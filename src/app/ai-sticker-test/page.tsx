'use client';

import { useState } from 'react';

const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;

export default function AiStickerTestPage() {
  const [prompt, setPrompt] = useState('smiling cat holding a heart');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const generate = async () => {
    if (!workerUrl) {
      setError('NEXT_PUBLIC_CF_WORKER_URL is missing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = (await response.json()) as { imageBase64?: string; error?: string; message?: string };

      if (!response.ok || !data.imageBase64) {
        throw new Error(data.message || data.error || 'failed');
      }

      setImageBase64(data.imageBase64);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-4 px-5 py-10">
      <h1 className="text-2xl font-semibold">AI Sticker Test</h1>
      <p className="text-sm text-foreground/80">프롬프트를 넣고 Cloudflare Workers AI로 스티커를 생성합니다.</p>

      <div className="space-y-2">
        <label htmlFor="prompt" className="block text-sm font-medium">
          Prompt
        </label>
        <input
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full rounded-md border bg-white px-3 py-2 text-sm"
          placeholder="kawaii bear sticker"
        />
      </div>

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {loading ? '생성 중...' : '스티커 생성'}
      </button>

      {error ? <p className="text-sm text-red-600">에러: {error}</p> : null}

      {imageBase64 ? (
        <div className="rounded-xl border bg-white p-4">
          <img alt="generated sticker" src={`data:image/jpeg;base64,${imageBase64}`} className="h-auto w-full" />
        </div>
      ) : null}
    </main>
  );
}
