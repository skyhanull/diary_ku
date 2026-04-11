export interface Env {
  AI: Ai;
}

interface TextGenerationResult {
  response?: string;
}

interface ImageGenerationResult {
  image?: string;
}

function hasKorean(text: string) {
  return /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(text);
}

function cleanPrompt(text: string) {
  return text
    .replace(/^["'`]+|["'`]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

function cleanEnglishPrompt(text: string) {
  return cleanPrompt(text)
    .replace(/^prompt:\s*/i, '')
    .replace(/[^a-zA-Z0-9 ,.'()-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
}

function fallbackKoreanPrompt(prompt: string) {
  if (/나뭇잎|나무잎|잎사귀|낙엽|leaf|leaves/i.test(prompt)) {
    return 'a simple leaf with the requested color and shape';
  }

  if (/나무|tree/i.test(prompt)) {
    return 'a simple tree with the requested shape and style';
  }

  if (/꽃|플라워|flower/i.test(prompt)) {
    return 'a cute flower with the requested color and shape';
  }

  if (/커피|coffee/i.test(prompt)) {
    return 'a warm cup of coffee';
  }

  if (/별|star/i.test(prompt)) {
    return 'a bright yellow star';
  }

  if (/강아지|멍멍이|반려견|dog/i.test(prompt)) {
    return 'a friendly puppy face';
  }

  if (/고양이|cat/i.test(prompt)) {
    return 'a friendly cat face';
  }

  return 'a cute simple diary sticker icon inspired by a friendly everyday object';
}

const stickerVariations = [
  'front-facing with a tiny smile',
  'side view with a playful pose',
  'sitting with rounded proportions',
  'standing with a cheerful expression',
  'sleepy expression with soft curves',
  'tiny chibi proportions',
  'simple doodle style with bold outline',
  'soft watercolor-like fill',
  'minimal flat icon style',
  'slightly tilted cute pose',
  'holding a small heart-shaped accent',
  'surrounded by two tiny sparkle accents'
];

function pickVariation() {
  return stickerVariations[Math.floor(Math.random() * stickerVariations.length)];
}

async function buildImagePrompt(env: Env, prompt: string) {
  if (!hasKorean(prompt)) {
    return cleanPrompt(prompt);
  }

  const result = (await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'system',
        content:
          'You convert Korean user requests into concise English image-generation prompts. Return only one English prompt. Preserve all objects, actions, colors, mood, and style. Do not explain. Do not include Korean.'
      },
      {
        role: 'user',
        content: `Translate this into a safe, family-friendly English prompt for one cute diary sticker with a clean outline and without any text: ${prompt}`
      }
    ],
    temperature: 0.1,
    max_tokens: 80
  })) as TextGenerationResult;

  const translatedPrompt = cleanEnglishPrompt(result.response ?? '');

  if (!translatedPrompt || hasKorean(translatedPrompt)) {
    return fallbackKoreanPrompt(prompt);
  }

  return translatedPrompt;
}

function buildStickerPrompt(imagePrompt: string) {
  return `Create exactly one centered cute diary sticker of ${imagePrompt}, ${pickVariation()}. Clean white border, simple readable silhouette, plain light background, family-friendly, text-free, watermark-free. Make a fresh visual variation, not a default generic version.`;
}

async function generateSticker(env: Env, imagePrompt: string) {
  return (await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
    prompt: buildStickerPrompt(imagePrompt),
    num_steps: 8
  })) as ImageGenerationResult;
}

function isSafetyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /3030|nsfw|safety|unsafe/i.test(message);
}

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'POST, OPTIONS',
          'access-control-allow-headers': 'content-type'
        }
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, { status: 405 });
    }

    try {
      const body = (await request.json()) as { prompt?: string };
      const prompt = body.prompt?.trim();

      if (!prompt) {
        return json({ error: 'prompt is required' }, { status: 400 });
      }

      const imagePrompt = await buildImagePrompt(env, prompt);
      let result: ImageGenerationResult;
      let finalPrompt = imagePrompt;
      let retried = false;

      try {
        result = await generateSticker(env, imagePrompt);
      } catch (error) {
        if (!isSafetyError(error)) {
          throw error;
        }

        retried = true;
        finalPrompt = hasKorean(prompt)
          ? fallbackKoreanPrompt(prompt)
          : cleanEnglishPrompt(imagePrompt) || 'a cute simple diary sticker icon';
        result = await generateSticker(env, finalPrompt);
      }

      return json({ imageBase64: result.image, prompt: finalPrompt, retried });
    } catch (error) {
      return json(
        {
          error: 'generation_failed',
          message: error instanceof Error ? error.message : 'unknown error'
        },
        { status: 500 }
      );
    }
  }
};
