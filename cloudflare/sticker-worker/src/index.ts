export interface Env {
  AI: Ai;
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

      const result = await env.AI.run('@cf/black-forest-labs/flux-1-schnell', {
        prompt: `${prompt}, kawaii diary sticker, clean white outline, transparent style`,
        num_steps: 4
      });

      return json({ imageBase64: result.image });
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
