import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: [text], model: 'voyage-3-lite' }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { data: { embedding: number[] }[] };
    return data.data[0].embedding;
  } catch {
    return null;
  }
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DiaryMatchRow {
  entry_date: string;
  title: string | null;
  body_html: string | null;
  mood: string | null;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return new Response('Unauthorized', { status: 401 });

  const { message, conversationHistory = [] } = await req.json() as {
    message: string;
    conversationHistory: ConversationMessage[];
  };

  if (!message?.trim()) return new Response('Bad Request', { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  // RAG: 실패해도 채팅은 계속
  let context = '';
  try {
    const queryEmbedding = await getEmbedding(message);
    if (queryEmbedding) {
      const { data: similarEntries } = await supabase.rpc('match_diary_entries', {
        query_embedding: queryEmbedding,
        match_threshold: 0.4,
        match_count: 5,
        p_user_id: user.id,
      });

      context = ((similarEntries ?? []) as DiaryMatchRow[])
        .map((entry) => {
          const body = entry.body_html?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() ?? '';
          return `[${entry.entry_date}]${entry.title ? ` ${entry.title}` : ''}${entry.mood ? ` (${entry.mood})` : ''}${body ? `\n${body}` : ''}`;
        })
        .join('\n\n');
    }
  } catch {
    // RAG 실패 시 컨텍스트 없이 진행
  }

  const systemPrompt = `당신은 사용자의 일기를 읽고 기억하는 따뜻한 친구예요. 짧고 자연스럽게 대화하고, 공감해주세요. 형식 없이 친구처럼 말하세요. 답변은 2-3문장 이내로 간결하게.
반드시 한국어로만 답변하세요. 다른 언어(영어, 일본어, 중국어, 베트남어 등)는 절대 사용하지 마세요.

${context ? `참고할 과거 일기:\n${context}` : ''}`;

  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 400,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            ...(conversationHistory.slice(-8) as ConversationMessage[]),
            { role: 'user', content: message },
          ],
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) controller.enqueue(encoder.encode(text));
        }
      } catch (err) {
        console.error('[diary/chat] error:', err);
        controller.enqueue(encoder.encode('오류가 발생했어요. 다시 시도해주세요.'));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
