import { supabase } from "@/lib/supabase";

const BUCKET = "editor-images";

export async function uploadEditorImage(blob: Blob, userId: string): Promise<string> {
  if (!supabase) throw new Error("Supabase가 설정되지 않았어요.");

  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type,
    upsert: false,
  });

  if (error) throw new Error(`이미지 업로드에 실패했어요: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
