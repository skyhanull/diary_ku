// 이미지 스토리지: 캔버스 이미지 blob을 Supabase Storage에 업로드하고 URL을 반환한다
import { APP_MESSAGES } from "@/lib/messages";
import { supabase } from "@/lib/supabase";

// 이미지를 저장하는 Supabase Storage 버킷 이름
const BUCKET = "editor-images";

// blob을 사용자 경로에 업로드하고 공개 URL을 반환한다
export async function uploadEditorImage(blob: Blob, userId: string): Promise<string> {
  if (!supabase) throw new Error(APP_MESSAGES.supabaseNotConfigured);

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });

  if (error) throw new Error(APP_MESSAGES.imageUploadFailed);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
