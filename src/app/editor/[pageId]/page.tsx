import { EditorScreen } from "@/features/editor/components/EditorScreen";

interface EditorPageProps {
  params: Promise<{ pageId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { pageId } = await params;
  return (
    <div className="h-dvh">
      <EditorScreen pageId={pageId} />
    </div>
  );
}
