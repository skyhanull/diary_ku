// 에디터 페이지: URL의 pageId(날짜)를 받아 EditorScreen을 렌더링하는 동적 라우트
import { EditorScreen } from '@/features/editor/components/EditorScreen';

interface EditorPageProps {
  params: Promise<{ pageId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { pageId } = await params;
  return <EditorScreen pageId={pageId} />;
}
