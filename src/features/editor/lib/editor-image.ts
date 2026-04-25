export interface NormalizedEditorImage {
  blob: Blob;
  width: number;
  height: number;
}

const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_QUALITY = 0.82;

function clampDimension(width: number, height: number) {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_IMAGE_DIMENSION) return { width, height };
  const ratio = MAX_IMAGE_DIMENSION / longestSide;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했어요."));
    image.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("이미지 변환에 실패했어요."));
      },
      type,
      quality
    );
  });
}

export async function normalizeEditorImageFile(file: File): Promise<NormalizedEditorImage> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromUrl(objectUrl);
    const nextSize = clampDimension(image.naturalWidth || image.width, image.naturalHeight || image.height);
    const canvas = document.createElement("canvas");
    canvas.width = nextSize.width;
    canvas.height = nextSize.height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지 처리 캔버스를 준비하지 못했어요.");
    context.drawImage(image, 0, 0, nextSize.width, nextSize.height);

    const blob = await canvasToBlob(canvas, "image/webp", IMAGE_QUALITY);
    return { blob, width: nextSize.width, height: nextSize.height };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
