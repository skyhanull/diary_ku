"use client";
// 미디어 검색 훅: GIPHY·스티커 검색 쿼리 상태와 검색 결과를 관리한다
import { useCallback, useRef, useState } from "react";
import type { CreateEditorItemInput } from "@/features/editor/types/editor.types";
import { APP_MESSAGES, getUserFacingErrorMessage } from "@/lib/messages";

const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;
const giphyApiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

export interface MediaSearchPreviewItem {
  id: string;
  imageUrl: string;
  title?: string;
}

interface UseEditorMediaSearchInput {
  onAddItem: (input: CreateEditorItemInput) => void;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
}

export function useEditorMediaSearch({ onAddItem, onError, onMessage }: UseEditorMediaSearchInput) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const [aiStickerPrompt, setAiStickerPrompt] = useState("");
  const [gifQuery, setGifQuery] = useState("");
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [isSearchingGif, setIsSearchingGif] = useState(false);
  const [stickerPreview, setStickerPreview] = useState<MediaSearchPreviewItem | null>(null);
  const [gifResults, setGifResults] = useState<MediaSearchPreviewItem[]>([]);

  const handleAddImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        onError(APP_MESSAGES.imageFileOnly);
        event.target.value = "";
        return;
      }

      try {
        const { normalizeEditorImageFile } = await import("@/features/editor/lib/editor-image");
        const { uploadEditorImage } = await import("@/features/editor/lib/editor-storage");
        const { getCurrentSession } = await import("@/features/auth/lib/auth-client");

        const normalizedImage = await normalizeEditorImageFile(file);
        const session = await getCurrentSession();
        if (!session) throw new Error("로그인이 필요해요.");

        const imageUrl = await uploadEditorImage(normalizedImage.blob, session.user.id);
        const aspectRatio = normalizedImage.width / Math.max(1, normalizedImage.height);
        const width = 220;
        const height = Math.max(120, Math.round(width / Math.max(0.5, Math.min(aspectRatio, 2.5))));

        onAddItem({
          type: "image",
          width,
          height,
          payload: {
            imageUrl,
            source: "upload",
            mediaType: "image",
            originalFilename: file.name,
          },
        });
        onMessage(`${file.name} 이미지를 추가했어요.`);
      } catch (error) {
        onError(getUserFacingErrorMessage(error, APP_MESSAGES.imageUploadFailed));
      } finally {
        event.target.value = "";
      }
    },
    [onAddItem, onError, onMessage]
  );

  const handleSearchGif = useCallback(async () => {
    const query = gifQuery.trim();
    if (!query) { onError("움짤 검색어를 입력해주세요."); return; }
    if (!giphyApiKey) { onError("GIPHY API 키가 연결되지 않았어요."); return; }

    setIsSearchingGif(true);
    setGifResults([]);

    try {
      const params = new URLSearchParams({
        api_key: giphyApiKey,
        q: query,
        limit: "8",
        rating: "g",
        lang: /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(query) ? "ko" : "en",
      });

      const response = await fetch(`https://api.giphy.com/v1/gifs/search?${params.toString()}`);
      const data = (await response.json()) as {
        data?: Array<{
          id?: string;
          title?: string;
          images?: { fixed_width?: { url?: string }; original?: { url?: string } };
        }>;
      };

      const results =
        data.data
          ?.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            title: item.title,
            imageUrl: item.images?.fixed_width?.url ?? item.images?.original?.url ?? "",
          }))
          .filter((item) => item.imageUrl) ?? [];

      if (!response.ok || results.length === 0) throw new Error(APP_MESSAGES.gifSearchEmpty);

      setGifResults(results);
      onMessage("움짤 검색 결과를 불러왔어요. 원하는 결과를 선택해보세요.");
    } catch (error) {
      onError(getUserFacingErrorMessage(error, APP_MESSAGES.gifSearchFailed));
    } finally {
      setIsSearchingGif(false);
    }
  }, [gifQuery, onError, onMessage]);

  const handleGenerateAiSticker = useCallback(async () => {
    const prompt = aiStickerPrompt.trim();
    if (!prompt) { onError("스티커 검색어를 입력해주세요."); return; }
    if (!workerUrl) { onError("AI 스티커 설정이 연결되지 않았어요."); return; }

    setIsGeneratingSticker(true);
    setStickerPreview(null);

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as {
        imageBase64?: string;
        prompt?: string;
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.imageBase64) {
        throw new Error(data.message ?? data.error ?? "AI 스티커 생성에 실패했어요.");
      }

      setStickerPreview({
        id: crypto.randomUUID(),
        imageUrl: `data:image/jpeg;base64,${data.imageBase64}`,
        title: data.prompt ?? prompt,
      });
      onMessage("AI 스티커 결과를 만들었어요. 확인 후 추가해보세요.");
    } catch (error) {
      onError(getUserFacingErrorMessage(error, APP_MESSAGES.aiStickerFailed));
    } finally {
      setIsGeneratingSticker(false);
    }
  }, [aiStickerPrompt, onError, onMessage]);

  const handleAddPreviewSticker = useCallback(() => {
    if (!stickerPreview) return;
    onAddItem({
      type: "sticker",
      width: 140,
      height: 140,
      payload: { imageUrl: stickerPreview.imageUrl, source: "ai", prompt: stickerPreview.title },
    });
    onMessage("스티커를 추가했어요.");
    setStickerPreview(null);
  }, [onAddItem, onMessage, stickerPreview]);

  const handleAddGifResult = useCallback(
    (result: MediaSearchPreviewItem) => {
      onAddItem({
        type: "gif",
        width: 180,
        height: 180,
        payload: {
          imageUrl: result.imageUrl,
          source: "library",
          mediaType: "gif",
          prompt: gifQuery.trim() || result.title,
        },
      });
      onMessage("움짤을 추가했어요.");
      setGifResults([]);
    },
    [gifQuery, onAddItem, onMessage]
  );

  const clearStickerPreview = useCallback(() => setStickerPreview(null), []);
  const clearGifResults = useCallback(() => setGifResults([]), []);

  return {
    imageInputRef,
    aiStickerPrompt,
    gifQuery,
    isGeneratingSticker,
    isSearchingGif,
    stickerPreview,
    gifResults,
    setAiStickerPrompt,
    setGifQuery,
    handleAddImage,
    handleImageFileChange,
    handleSearchGif,
    handleGenerateAiSticker,
    handleAddPreviewSticker,
    handleAddGifResult,
    clearStickerPreview,
    clearGifResults,
  };
}
