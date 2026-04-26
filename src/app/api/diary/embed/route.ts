// 임베딩 API: 일기 본문을 Voyage AI로 벡터화해 Supabase에 저장한다 (RAG 검색용)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 텍스트를 Voyage AI에 보내 벡터 임베딩 배열을 받아온다 (실패 시 에러를 던진다)
async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: [text], model: 'voyage-3-lite' }),
  });
  if (!res.ok) throw new Error(`Voyage AI error: ${res.status}`);
  const data = await res.json() as { data: { embedding: number[] }[] };
  return data.data[0].embedding;
}

// pageId·text를 받아 임베딩을 생성한 뒤 해당 일기 행의 embedding 컬럼을 업데이트한다
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { pageId, text } = await req.json() as { pageId: string; text: string };
  if (!pageId || !text?.trim()) return NextResponse.json({ success: true });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const embedding = await getEmbedding(text);

  const { error } = await supabase
    .from('diary_entries')
    .update({ embedding })
    .eq('user_id', user.id)
    .eq('entry_date', pageId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
