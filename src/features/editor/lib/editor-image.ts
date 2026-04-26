// 이미지 정규화: 캔버스에 올리기 전 이미지 크기·포맷을 표준화한다
// 정규화된 이미지의 blob과 실제 픽셀 크기를 담는 타입
export interface NormalizedEditorImage {
  blob: Blob;
  width: number;
  height: number;
}

// 이미지 리사이즈 최대 픽셀 크기 (가로 또는 세로 기준)
const MAX_IMAGE_DIMENSION = 1600;
// WebP 변환 시 적용할 품질값 (0~1)
const IMAGE_QUALITY = 0.82;

// 가장 긴 변이 MAX_IMAGE_DIMENSION을 넘으면 비율을 유지하며 축소한다
function clampDimension(width: number, height: number) {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_IMAGE_DIMENSION) return { width, height };
  const ratio = MAX_IMAGE_DIMENSION / longestSide;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

// URL로부터 HTMLImageElement를 로드해 Promise로 반환한다
function loadImageFromUrl(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지를 불러오지 못했어요."));
    image.src = url;
  });
}

// canvas를 지정한 포맷과 품질로 Blob으로 변환해 Promise로 반환한다
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

// 파일을 읽어 리사이즈·WebP 변환 후 blob과 최종 픽셀 크기를 반환한다
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
