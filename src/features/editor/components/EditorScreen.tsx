'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  ImagePlus,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  RotateCw,
  Send,
  Sticker,
  Trash2,
  Type
} from 'lucide-react';

import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NoticeBox } from '@/components/ui/notice-box';
import { RoundIconButton } from '@/components/ui/round-icon-button';
import { SurfaceCard } from '@/components/ui/surface-card';
import { ToolIconButton } from '@/components/ui/tool-icon-button';
import { EditorCanvasSingle } from '@/features/editor/components/EditorCanvasSingle';
import type { EditorTool } from '@/features/editor/components/EditorTopBar';
import { createSharedLetter, loadEditorSession, saveEditorSession } from '@/features/editor/lib/editor-persistence';
import { useEditorState } from '@/features/editor/hooks/useEditorState';
import type { CreateEditorItemInput, SharedLetterTheme } from '@/features/editor/types/editor.types';

interface EditorScreenProps {
  pageId: string;
}

type EditorSidePanel = 'base' | 'text' | 'sticker' | 'media';

interface SearchPreviewItem {
  id: string;
  imageUrl: string;
  title?: string;
}

interface TutorialStep {
  id: string;
  title: string;
  description: string;
}

interface TutorialBubbleLayout {
  left: number;
  top: number;
  arrowSide: 'left' | 'right' | 'top' | 'bottom';
}

const moodOptions = ['😄', '🙂', '😐', '🙁', '😢'] as const;
const defaultTags = ['일상', '서촌나들이', '기록'] as const;
const stickerPresets = [
  { emoji: '🌼', bg: '#FDE7D3' },
  { emoji: '☕', bg: '#F8DEC1' },
  { emoji: '💌', bg: '#FCD1C1' },
  { emoji: '⭐', bg: '#FCE8A9' }
] as const;
const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;
const giphyApiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
const textColorPresets = ['#4F3328', '#8C6A5D', '#D96C6C', '#556B2F', '#365A8C', '#6B4E9B'] as const;
const textFontOptions = [
  { value: 'inherit', label: '기본' },
  { value: '"Georgia", serif', label: 'Serif' },
  { value: '"Times New Roman", serif', label: 'Times' },
  { value: '"Trebuchet MS", sans-serif', label: 'Trebuchet' },
  { value: '"Courier New", monospace', label: 'Courier' },
  { value: '"Comic Sans MS", cursive', label: 'Comic' }
] as const;
const shareThemeOptions: Array<{ value: SharedLetterTheme; label: string; description: string }> = [
  { value: 'paper', label: '종이 편지', description: '가장 기본적인 따뜻한 편지 무드예요.' },
  { value: 'cream', label: '크림 카드', description: '조금 더 밝고 포근한 톤이에요.' },
  { value: 'midnight', label: '밤 편지', description: '저녁 분위기의 깊은 그라데이션이에요.' }
];
const aiPromptKeywordMap: Array<{ keywords: string[]; english: string }> = [
  { keywords: ['고양이', '냥', '냥이'], english: 'cute cat sticker' },
  { keywords: ['강아지', '개', '멍멍이'], english: 'cute dog sticker' },
  { keywords: ['토끼'], english: 'cute rabbit sticker' },
  { keywords: ['곰'], english: 'cute bear sticker' },
  { keywords: ['커피', '카페'], english: 'coffee sticker' },
  { keywords: ['하트', '사랑'], english: 'heart sticker' },
  { keywords: ['꽃'], english: 'flower sticker' },
  { keywords: ['별'], english: 'star sticker' },
  { keywords: ['구름'], english: 'cloud sticker' },
  { keywords: ['축하', '파티'], english: 'celebration sticker' }
];
const tutorialSteps: TutorialStep[] = [
  {
    id: 'sidebar',
    title: '왼쪽 도구',
    description: '여기서 포인터, 텍스트, 스티커, 사진/움짤 패널을 열 수 있어요. 이제 클릭만으로 바로 생성되진 않고, 오른쪽 패널을 여는 역할만 합니다.'
  },
  {
    id: 'canvas',
    title: '가운데 캔버스',
    description: '일기 본문과 꾸미기 요소가 실제로 배치되는 영역이에요. 추가한 요소는 여기서 선택하고 이동할 수 있어요.'
  },
  {
    id: 'panel',
    title: '오른쪽 패널',
    description: '현재 선택한 도구에 따라 패널 내용이 바뀝니다. 검색 결과를 보고 직접 골라서 추가하는 흐름도 여기서 진행해요.'
  }
];

function formatDiaryDate(pageId: string) {
  const date = new Date(pageId);
  if (Number.isNaN(date.getTime())) return pageId;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function makeStickerDataUrl(emoji: string, bg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect x="10" y="10" width="200" height="200" rx="36" fill="${bg}"/><text x="110" y="138" font-size="98" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildBodyHtml(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return '<p></p>';
  return lines.map((line) => `<p>${line}</p>`).join('');
}

function extractBodyText(bodyHtml: string | null) {
  if (!bodyHtml) return '오늘의 기록을 시작해보세요.';
  const lines = [...bodyHtml.matchAll(/<p>(.*?)<\/p>/g)].map((match) => match[1].trim()).filter(Boolean);
  return lines.join('\n') || '오늘의 기록을 시작해보세요.';
}

function buildAiPrompt(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (!/[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(trimmed)) {
    return `${trimmed}, cute diary sticker, simple background, clean outline`;
  }

  const mappedKeywords = aiPromptKeywordMap
    .filter((entry) => entry.keywords.some((keyword) => trimmed.includes(keyword)))
    .map((entry) => entry.english);

  const englishHint = mappedKeywords.length > 0 ? mappedKeywords.join(', ') : 'cute diary sticker';

  return `${englishHint}, ${trimmed}, simple background, clean outline, pastel colors, sticker illustration`;
}

export function EditorScreen({ pageId }: EditorScreenProps) {
  const {
    state,
    selectedItem,
    addItem,
    updateItem,
    removeItem,
    replaceItems,
    selectItem,
    resetDirty
  } = useEditorState({ pageId, viewMode: 'single' });

  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [activePanel, setActivePanel] = useState<EditorSidePanel>('base');
  const [activeMood, setActiveMood] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [textDraft, setTextDraft] = useState('새 텍스트');
  const [aiStickerPrompt, setAiStickerPrompt] = useState('');
  const [gifQuery, setGifQuery] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [bodyText, setBodyText] = useState('오늘의 기록을 시작해보세요.');
  const [lastSavedBodyText, setLastSavedBodyText] = useState('오늘의 기록을 시작해보세요.');
  const [entryTags, setEntryTags] = useState<string[]>([...defaultTags]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBodySaving, setIsBodySaving] = useState(false);
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [isSearchingGif, setIsSearchingGif] = useState(false);
  const [stickerPreview, setStickerPreview] = useState<SearchPreviewItem | null>(null);
  const [gifResults, setGifResults] = useState<SearchPreviewItem[]>([]);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialBubbleLayout, setTutorialBubbleLayout] = useState<TutorialBubbleLayout | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareRecipientName, setShareRecipientName] = useState('');
  const [shareCoverMessage, setShareCoverMessage] = useState('');
  const [shareTheme, setShareTheme] = useState<SharedLetterTheme>('paper');
  const [sharedLetterUrl, setSharedLetterUrl] = useState<string | null>(null);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const diaryDate = useMemo(() => formatDiaryDate(pageId), [pageId]);
  const isBodyDirty = bodyText !== lastSavedBodyText;
  const selectedTextItem = selectedItem?.type === 'text' ? selectedItem : null;
  const tutorialStep = tutorialSteps[tutorialStepIndex];

  const addEditorItem = (input: CreateEditorItemInput) => {
    addItem({
      ...input,
      pageSide: 'single'
    });
  };

  const handleAddText = () => {
    addEditorItem({
      type: 'text',
      width: 180,
      height: 64,
        payload: {
          text: {
            content: textDraft.trim() || '새 텍스트',
            fontSize: 18,
            color: '#4F3328',
            fontFamily: 'inherit'
          }
        }
      });
  };

  const handlePlaceTextAt = (x: number, y: number) => {
    addEditorItem({
      type: 'text',
      x,
      y,
      width: 180,
      height: 64,
        payload: {
          text: {
            content: textDraft.trim() || '새 텍스트',
            fontSize: 18,
            color: '#4F3328',
            fontFamily: 'inherit'
          }
        }
      });
  };

  const handleAddSticker = (emoji: string, bg: string) => {
    addEditorItem({
      type: 'sticker',
      width: 110,
      height: 110,
      payload: {
        imageUrl: makeStickerDataUrl(emoji, bg),
        source: 'library'
      }
    });
  };

  const handleAddImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('이미지 파일만 업로드할 수 있어요.');
      event.target.value = '';
      return;
    }

    try {
      const imageUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') resolve(reader.result);
          else reject(new Error('이미지를 읽지 못했어요.'));
        };
        reader.onerror = () => reject(new Error('이미지를 읽는 중 문제가 발생했어요.'));
        reader.readAsDataURL(file);
      });

      addEditorItem({
        type: 'image',
        width: 220,
        height: 160,
        payload: {
          imageUrl,
          source: 'upload',
          mediaType: 'image',
          originalFilename: file.name
        }
      });
      setSaveError(null);
      setSaveMessage(`${file.name} 이미지를 추가했어요.`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '이미지 업로드 중 문제가 발생했어요.');
    } finally {
      event.target.value = '';
    }
  };

  const handleAddGif = async () => {
    const query = gifQuery.trim();
    if (!query) {
      setSaveError('움짤 검색어를 입력해주세요.');
      return;
    }
    if (!giphyApiKey) {
      setSaveError('GIPHY API 키가 연결되지 않았어요.');
      return;
    }

    setIsSearchingGif(true);
    setSaveError(null);
    setSaveMessage(null);
    setGifResults([]);

    try {
      const params = new URLSearchParams({
        api_key: giphyApiKey,
        q: query,
        limit: '8',
        rating: 'g',
        lang: /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(query) ? 'ko' : 'en'
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
            imageUrl: item.images?.fixed_width?.url ?? item.images?.original?.url ?? ''
          }))
          .filter((item) => item.imageUrl) ?? [];

      if (!response.ok || results.length === 0) {
        throw new Error('검색 결과를 찾지 못했어요.');
      }

      setGifResults(results);
      setSaveMessage('움짤 검색 결과를 불러왔어요. 원하는 결과를 선택해보세요.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '움짤 검색 중 문제가 발생했어요.');
    } finally {
      setIsSearchingGif(false);
    }
  };

  const handleGenerateAiSticker = async () => {
    const prompt = buildAiPrompt(aiStickerPrompt);
    if (!prompt) {
      setSaveError('스티커 검색어를 입력해주세요.');
      return;
    }
    if (!workerUrl) {
      setSaveError('AI 스티커 설정이 연결되지 않았어요.');
      return;
    }

    setIsGeneratingSticker(true);
    setSaveError(null);
    setSaveMessage(null);
    setStickerPreview(null);

    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = (await response.json()) as { imageBase64?: string; error?: string; message?: string };
      if (!response.ok || !data.imageBase64) {
        throw new Error(data.message || data.error || 'AI 스티커 생성에 실패했어요.');
      }

      setStickerPreview({
        id: crypto.randomUUID(),
        imageUrl: `data:image/jpeg;base64,${data.imageBase64}`,
        title: aiStickerPrompt.trim()
      });
      setSaveMessage('AI 스티커 결과를 만들었어요. 확인 후 추가해보세요.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'AI 스티커 생성 중 문제가 발생했어요.');
    } finally {
      setIsGeneratingSticker(false);
    }
  };

  const handleAddPreviewSticker = () => {
    if (!stickerPreview) return;

    addEditorItem({
      type: 'sticker',
      width: 140,
      height: 140,
      payload: {
        imageUrl: stickerPreview.imageUrl,
        source: 'ai',
        prompt: stickerPreview.title
      }
    });
    setSaveMessage('스티커를 추가했어요.');
    setStickerPreview(null);
  };

  const handleAddGifResult = (result: SearchPreviewItem) => {
    addEditorItem({
      type: 'gif',
      width: 180,
      height: 180,
      payload: {
        imageUrl: result.imageUrl,
        source: 'library',
        mediaType: 'gif',
        prompt: gifQuery.trim() || result.title
      }
    });
    setSaveMessage('움짤을 추가했어요.');
    setGifResults([]);
  };

  useEffect(() => {
    let isMounted = true;

    const syncEntry = async () => {
      setIsLoading(true);
      setSaveMessage(null);
      setSaveError(null);

      try {
        const session = await loadEditorSession(pageId);
        if (!isMounted) return;

        if (session.entry) {
          const entry = session.entry;
          const nextBodyText = extractBodyText(entry.bodyHtml);
          const moodIndex = moodOptions.findIndex((mood) => mood === entry.mood);
          setActiveMood(moodIndex >= 0 ? moodIndex : 0);
          setEntryTitle(entry.title ?? '');
          setEntryTags(entry.tags.length > 0 ? entry.tags : [...defaultTags]);
          setBodyText(nextBodyText);
          setLastSavedBodyText(nextBodyText);
          replaceItems(session.items);
          setSaveMessage(
            session.items.length > 0
              ? `${pageId} 일기와 요소 ${session.items.length}개를 불러왔어요.`
              : `${pageId} 일기를 불러왔어요.`
          );
        } else {
          setActiveMood(0);
          setEntryTitle('');
          setEntryTags([...defaultTags]);
          setBodyText('오늘의 기록을 시작해보세요.');
          setLastSavedBodyText('오늘의 기록을 시작해보세요.');
          replaceItems([]);
        }
      } catch (error) {
        if (!isMounted) return;
        setSaveError(error instanceof Error ? error.message : '저장된 일기를 불러오는 중 문제가 발생했어요.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void syncEntry();

    return () => {
      isMounted = false;
    };
  }, [pageId, replaceItems]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      await saveEditorSession({
        pageId,
        title: entryTitle.trim() || null,
        bodyHtml: buildBodyHtml(bodyText),
        mood: moodOptions[activeMood],
        tags: entryTags,
        viewMode: 'single',
        status: 'saved',
        items: state.items
      });

      resetDirty();
      setLastSavedBodyText(bodyText);
      setSaveMessage(
        state.items.length > 0
          ? `${pageId} 일기와 요소 ${state.items.length}개를 저장했어요.`
          : `${pageId} 일기를 저장했어요.`
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장 중 문제가 발생했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBody = async () => {
    setIsBodySaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      await saveEditorSession({
        pageId,
        title: entryTitle.trim() || null,
        bodyHtml: buildBodyHtml(bodyText),
        mood: moodOptions[activeMood],
        tags: entryTags,
        viewMode: 'single',
        status: 'saved',
        items: state.items
      });

      setLastSavedBodyText(bodyText);
      setSaveMessage('본문을 따로 저장했어요. 요소 배치는 그대로 유지됩니다.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '본문 저장 중 문제가 발생했어요.');
    } finally {
      setIsBodySaving(false);
    }
  };

  const handleCreateShare = async () => {
    setIsCreatingShare(true);
    setSaveError(null);
    setShareMessage(null);

    try {
      const sharedLetter = await createSharedLetter({
        pageId,
        title: entryTitle.trim() || null,
        bodyHtml: buildBodyHtml(bodyText),
        mood: moodOptions[activeMood],
        tags: entryTags,
        viewMode: 'single',
        status: 'saved',
        items: state.items,
        background: '#fffdf9',
        recipientName: shareRecipientName.trim() || null,
        coverMessage: shareCoverMessage.trim() || null,
        theme: shareTheme
      });

      resetDirty();
      setLastSavedBodyText(bodyText);
      const nextUrl = `${window.location.origin}/letter/${sharedLetter.shareToken}`;
      setSharedLetterUrl(nextUrl);
      setShareMessage('편지 링크를 만들었어요. 복사하거나 바로 열어볼 수 있어요.');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '공유 링크 생성 중 문제가 발생했어요.');
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!sharedLetterUrl) return;

    try {
      await navigator.clipboard.writeText(sharedLetterUrl);
      setShareMessage('공유 링크를 복사했어요.');
    } catch {
      setShareMessage('링크 복사에 실패했어요. 다시 시도해주세요.');
    }
  };

  const updateTextItem = (itemId: string, patch: Partial<NonNullable<typeof selectedTextItem>['payload']['text']>) => {
    const item = state.items.find((candidate) => candidate.id === itemId);
    if (!item || item.type !== 'text') return;

    updateItem(itemId, {
      payload: {
        ...item.payload,
        text: {
          content: item.payload.text?.content ?? '새 텍스트',
          fontSize: item.payload.text?.fontSize ?? 18,
          color: item.payload.text?.color ?? '#4F3328',
          fontFamily: item.payload.text?.fontFamily ?? 'inherit',
          ...patch
        }
      }
    });
  };

  useEffect(() => {
    const tutorialSeen = window.localStorage.getItem('dearme-editor-tutorial-seen');
    if (!tutorialSeen) {
      setIsTutorialOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isTutorialOpen) return;

    const updateTutorialBubbleLayout = () => {
      const bubbleWidth = Math.min(window.innerWidth * 0.92, 440);
      const bubbleHeight = 220;
      const gutter = 24;
      const viewportPadding = 16;

      const target =
        tutorialStep?.id === 'sidebar'
          ? sidebarRef.current
          : tutorialStep?.id === 'canvas'
            ? canvasRef.current
            : panelRef.current;

      if (!target) return;

      const rect = target.getBoundingClientRect();

      if (tutorialStep?.id === 'sidebar') {
        setTutorialBubbleLayout({
          left: Math.min(rect.right + gutter, window.innerWidth - bubbleWidth - viewportPadding),
          top: Math.min(Math.max(rect.top + 56, viewportPadding), window.innerHeight - bubbleHeight - viewportPadding),
          arrowSide: 'left'
        });
        return;
      }

      if (tutorialStep?.id === 'panel') {
        setTutorialBubbleLayout({
          left: Math.max(rect.left - bubbleWidth - gutter, viewportPadding),
          top: Math.min(Math.max(rect.top + 80, viewportPadding), window.innerHeight - bubbleHeight - viewportPadding),
          arrowSide: 'right'
        });
        return;
      }

      setTutorialBubbleLayout({
        left: Math.min(Math.max(rect.left + rect.width - bubbleWidth - 32, viewportPadding), window.innerWidth - bubbleWidth - viewportPadding),
        top: Math.min(Math.max(rect.top + 120, viewportPadding), window.innerHeight - bubbleHeight - viewportPadding),
        arrowSide: 'right'
      });
    };

    updateTutorialBubbleLayout();
    window.addEventListener('resize', updateTutorialBubbleLayout);
    window.addEventListener('scroll', updateTutorialBubbleLayout, true);

    return () => {
      window.removeEventListener('resize', updateTutorialBubbleLayout);
      window.removeEventListener('scroll', updateTutorialBubbleLayout, true);
    };
  }, [isTutorialOpen, tutorialStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedItem) return;

      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        removeItem(selectedItem.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [removeItem, selectedItem]);

  const closeTutorial = (markSeen = true) => {
    setIsTutorialOpen(false);
    if (markSeen) {
      window.localStorage.setItem('dearme-editor-tutorial-seen', 'true');
    }
  };

  const goToNextTutorialStep = () => {
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      closeTutorial(true);
      return;
    }

    setTutorialStepIndex((prev) => prev + 1);
  };

  const goToPreviousTutorialStep = () => {
    setTutorialStepIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-[#fdf8f5] text-[#34322f]">
      <AppHeader
        activeItem="기록"
        showSearch={false}
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => setIsShareModalOpen(true)}>
              <Send className="mr-1 h-4 w-4" />
              편지 공유
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Check className="mr-1 h-4 w-4" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </>
        }
      />

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />

      <main className="flex h-[calc(100vh-64px)] pt-0">
        <aside ref={sidebarRef} className="fixed left-0 top-16 z-40 flex h-[calc(100vh-64px)] w-20 flex-col items-center gap-6 rounded-r-[28px] border-r border-[#ece7e3] bg-[#f8f3ef] py-6">
          <ToolIconButton
            onClick={() => {
              setActiveTool('select');
              setActivePanel('base');
            }}
            active={activePanel === 'base'}
          >
            <MousePointer2 className="h-5 w-5" />
          </ToolIconButton>
          <ToolIconButton
            onClick={() => {
              setActiveTool('select');
              setActivePanel('text');
            }}
            active={activePanel === 'text'}
          >
            <Type className="h-5 w-5" />
          </ToolIconButton>
          <ToolIconButton
            onClick={() => {
              setActiveTool('select');
              setActivePanel('sticker');
            }}
            active={activePanel === 'sticker'}
          >
            <Sticker className="h-5 w-5" />
          </ToolIconButton>
          <ToolIconButton
            onClick={() => {
              setActiveTool('select');
              setActivePanel('media');
            }}
            active={activePanel === 'media'}
          >
            <ImagePlus className="h-5 w-5" />
          </ToolIconButton>

          <ToolIconButton className="mt-auto">
            <ChevronLeft className="h-5 w-5" />
          </ToolIconButton>
        </aside>

        <section className="ml-20 mr-80 flex-1 overflow-y-auto bg-[#fdf8f5] px-8 py-0">
          <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-4">
            <div>
              <h1 className="font-['Epilogue'] text-3xl font-bold tracking-tight text-[#34322f]">{diaryDate}</h1>
            </div>

            <div className="flex gap-2 rounded-full bg-[#f8f3ef] p-2">
              {moodOptions.map((icon, index) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setActiveMood(index)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${activeMood === index ? 'bg-white shadow-sm' : ''}`}
                >
                  <span className="text-lg">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading ? <NoticeBox className="mx-auto mb-4 max-w-6xl">저장된 일기를 불러오는 중이에요...</NoticeBox> : null}
          {saveMessage && !saveMessage.includes('불러왔어요') ? (
            <NoticeBox tone="success" className="mx-auto mb-4 max-w-6xl">
              {saveMessage}
            </NoticeBox>
          ) : null}
          {saveError ? (
            <NoticeBox tone="error" className="mx-auto mb-4 max-w-6xl">
              {saveError}
            </NoticeBox>
          ) : null}

          <SurfaceCard tone="soft" className="mx-auto mb-4 max-w-6xl p-4">
            <label className="mb-2 block text-sm font-semibold text-[#34322f]">일기 제목</label>
            <Input
              value={entryTitle}
              onChange={(event) => setEntryTitle(event.target.value)}
              placeholder="예: 비 오는 토요일의 산책"
              className="h-12 rounded-2xl border-[#ece7e3] bg-[#fcfaf8]"
            />
          </SurfaceCard>

          <div ref={canvasRef} className="mx-auto max-w-6xl">
            <EditorCanvasSingle
              background="#fffdf9"
              items={state.items.filter((item) => item.pageSide === 'single' || item.pageSide === 'left')}
              selectedItemId={state.selectedItemId}
              zoom={zoom}
              activeTool={activeTool}
              diaryText={buildBodyHtml(bodyText)}
              onDiaryTextChange={(html) => setBodyText(extractBodyText(html))}
              diaryDate={diaryDate}
              onDiaryDateChange={() => undefined}
              dailyExpense=""
              onDailyExpenseChange={() => undefined}
              onSelectItem={selectItem}
              onMoveItem={(itemId, x, y) => updateItem(itemId, { x, y })}
              onResizeItem={(itemId, width, height) => updateItem(itemId, { width, height })}
              textToolbar={selectedTextItem ? selectedTextItem : null}
              onUpdateTextFontSize={(itemId, fontSize) => updateTextItem(itemId, { fontSize })}
              onUpdateTextColor={(itemId, color) => updateTextItem(itemId, { color })}
              onDeleteItem={removeItem}
              onDropAddItem={(input) => addEditorItem({ ...input, pageSide: 'single' })}
              onPlaceTextAt={(x, y) => handlePlaceTextAt(x, y)}
            />
          </div>
        </section>

        <aside ref={panelRef} className="fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] w-80 flex-col overflow-y-auto rounded-l-[28px] border-l border-[#ece7e3] bg-[#fdf8f5]/90 p-6 backdrop-blur">
          <div className="mb-6">
            <h2 className="font-['Epilogue'] text-xl font-bold text-[#34322f]">
              {activePanel === 'base' ? '선택/편집' : null}
              {activePanel === 'text' ? '텍스트 추가' : null}
              {activePanel === 'sticker' ? '스티커' : null}
              {activePanel === 'media' ? '사진/움짤' : null}
            </h2>
            <p className="text-sm text-[#8C6A5D]">
              {activePanel === 'base' ? '선택한 요소를 수정하거나 본문을 정리할 수 있어요.' : null}
              {activePanel === 'text' ? '텍스트를 만들고 배치하기 전에 내용을 먼저 준비해보세요.' : null}
              {activePanel === 'sticker' ? 'AI 스티커를 만들거나 기본 스티커를 바로 추가할 수 있어요.' : null}
              {activePanel === 'media' ? '사진을 올리거나 원하는 움짤을 검색해서 추가할 수 있어요.' : null}
            </p>
          </div>

          <div className="space-y-6">
            {activePanel === 'base' ? (
              <SurfaceCard className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#34322f]">본문</p>
                  </div>
                  <Button size="sm" onClick={handleSaveBody} disabled={isBodySaving || !isBodyDirty}>
                    {isBodySaving ? '본문 저장 중...' : isBodyDirty ? '본문 저장' : '본문 저장됨'}
                  </Button>
                </div>
                <textarea
                  value={bodyText}
                  onChange={(event) => setBodyText(event.target.value)}
                  className="min-h-32 w-full rounded-2xl border border-[#ece7e3] bg-[#fcfaf8] p-3 text-sm outline-none"
                  placeholder="오늘 있었던 일을 편하게 적어보세요."
                />
                <div className="mt-2 flex items-center justify-between text-xs text-[#8C6A5D]">
                  <span>{bodyText.trim().length}자</span>
                  <span>{isBodyDirty ? '아직 본문 저장 전' : '본문 저장 완료'}</span>
                </div>
              </SurfaceCard>
            ) : null}

            {activePanel === 'text' ? (
              <SurfaceCard className="p-4">
                <p className="mb-1 text-sm font-semibold text-[#34322f]">텍스트 요소 추가</p>
                <p className="mb-3 text-xs text-[#8C6A5D]">문구를 입력한 뒤 추가하거나, 캔버스를 눌러 원하는 위치에 놓을 수 있어요.</p>
                <Input value={textDraft} onChange={(event) => setTextDraft(event.target.value)} placeholder="캔버스에 올릴 텍스트" />
                <Button className="mt-3 w-full" size="sm" onClick={() => handleAddText()}>
                  텍스트 추가
                </Button>
              </SurfaceCard>
            ) : null}

            {activePanel === 'sticker' ? (
              <>
                <SurfaceCard className="p-4">
                  <p className="mb-1 text-sm font-semibold text-[#34322f]">AI 스티커 검색</p>
                  <p className="mb-3 text-xs text-[#8C6A5D]">검색어를 넣으면 AI가 스티커 결과를 만들고, 확인 후 추가할 수 있어요.</p>
                  <Input
                    value={aiStickerPrompt}
                    onChange={(event) => {
                      setAiStickerPrompt(event.target.value);
                      setStickerPreview(null);
                    }}
                    placeholder="예: 하트를 든 고양이 스티커"
                  />
                  <Button className="mt-3 w-full" size="sm" onClick={handleGenerateAiSticker} disabled={isGeneratingSticker}>
                    {isGeneratingSticker ? '스티커 생성 중...' : 'AI 스티커 생성'}
                  </Button>

                  {stickerPreview ? (
                    <div className="mt-4 rounded-2xl border border-[#ece7e3] bg-[#fcfaf8] p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-xs font-semibold text-[#8C6A5D]">생성 결과</p>
                        <button type="button" onClick={() => setStickerPreview(null)} className="text-xs text-[#8C6A5D]">
                          닫기
                        </button>
                      </div>
                      <img src={stickerPreview.imageUrl} alt={stickerPreview.title ?? 'AI sticker preview'} className="mx-auto h-32 w-32 rounded-2xl object-cover" />
                      <Button className="mt-3 w-full" size="sm" onClick={handleAddPreviewSticker}>
                        이 스티커 추가
                      </Button>
                    </div>
                  ) : null}
                </SurfaceCard>

                <SurfaceCard className="p-4">
                  <p className="mb-3 text-sm font-semibold text-[#34322f]">기본 스티커</p>
                  <div className="grid grid-cols-4 gap-2">
                    {stickerPresets.map((preset) => (
                      <button
                        key={preset.emoji}
                        type="button"
                        onClick={() => handleAddSticker(preset.emoji, preset.bg)}
                        className="grid h-12 place-items-center rounded-2xl text-xl"
                        style={{ backgroundColor: preset.bg }}
                      >
                        {preset.emoji}
                      </button>
                    ))}
                  </div>
                </SurfaceCard>
              </>
            ) : null}

            {activePanel === 'media' ? (
              <SurfaceCard className="p-4">
                <p className="mb-3 text-sm font-semibold text-[#34322f]">미디어 추가</p>
                <Input
                  value={gifQuery}
                  onChange={(event) => {
                    setGifQuery(event.target.value);
                    setGifResults([]);
                  }}
                  placeholder="움짤 검색어 예: 고양이, 축하, 커피"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAddImage()}>
                    사진 추가
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => void handleAddGif()} disabled={isSearchingGif}>
                    {isSearchingGif ? '검색 중...' : '움짤 추가'}
                  </Button>
                </div>

                {gifResults.length > 0 ? (
                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#8C6A5D]">검색 결과</p>
                      <button type="button" onClick={() => setGifResults([])} className="text-xs text-[#8C6A5D]">
                        닫기
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {gifResults.map((result) => (
                        <button
                          key={result.id}
                          type="button"
                          onClick={() => handleAddGifResult(result)}
                          className="overflow-hidden rounded-2xl border border-[#ece7e3] bg-[#fcfaf8]"
                        >
                          <img src={result.imageUrl} alt={result.title ?? 'GIF result'} className="h-28 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </SurfaceCard>
            ) : null}

            {activePanel === 'base' ? (
              <SurfaceCard className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[#34322f]">선택 요소</p>
                  {selectedItem ? <span className="text-xs text-[#8C6A5D]">{selectedItem.type}</span> : null}
                </div>

                {!selectedItem ? (
                  <div className="rounded-2xl border border-dashed border-[#e6ddd6] bg-[#fcfaf8] p-4 text-sm text-[#6f5c45]">
                    <p className="font-medium text-[#4f473f]">아직 선택된 요소가 없어요.</p>
                    <p className="mt-2">캔버스에서 요소를 눌러 편집하거나, 왼쪽 도구에서 텍스트·스티커·사진/움짤을 추가해보세요.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedTextItem ? (
                      <section className="rounded-2xl border border-[#f0e6dd] bg-[#fcfaf8] p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#34322f]">텍스트 편집</p>
                            <p className="mt-1 text-xs text-[#8C6A5D]">입력하는 즉시 캔버스에 반영돼요.</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => removeItem(selectedTextItem.id)}>
                            <Trash2 className="mr-1 h-4 w-4" />
                            삭제
                          </Button>
                        </div>

                        <textarea
                          value={selectedTextItem.payload.text?.content ?? ''}
                          onChange={(event) => updateTextItem(selectedTextItem.id, { content: event.target.value })}
                          className="min-h-28 w-full rounded-2xl border border-[#ece7e3] bg-white p-3 text-sm outline-none"
                          placeholder="텍스트 내용을 입력하세요."
                        />

                        <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-3">
                          <label className="text-xs font-semibold text-[#6f5c45]">글자 크기</label>
                          <Input
                            type="number"
                            min={12}
                            max={72}
                            value={String(selectedTextItem.payload.text?.fontSize ?? 18)}
                            onChange={(event) => {
                              const nextValue = Number(event.target.value);
                              if (!Number.isFinite(nextValue)) return;
                              updateTextItem(selectedTextItem.id, { fontSize: Math.max(12, Math.min(72, nextValue)) });
                            }}
                            className="h-9 w-20 text-center"
                          />
                        </div>

                        <input
                          type="range"
                          min={12}
                          max={72}
                          value={selectedTextItem.payload.text?.fontSize ?? 18}
                          onChange={(event) => updateTextItem(selectedTextItem.id, { fontSize: Number(event.target.value) })}
                          className="mt-2 w-full accent-[#8C6A5D]"
                        />

                        <div className="mt-4">
                          <div className="mb-3 flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#6f5c45]">폰트</label>
                            <select
                              value={selectedTextItem.payload.text?.fontFamily ?? 'inherit'}
                              onChange={(event) => updateTextItem(selectedTextItem.id, { fontFamily: event.target.value })}
                              className="h-9 rounded-xl border border-[#ece7e3] bg-white px-3 text-sm text-[#34322f] outline-none"
                            >
                              {textFontOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="mb-2 flex items-center justify-between">
                            <label className="text-xs font-semibold text-[#6f5c45]">글자 색상</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={selectedTextItem.payload.text?.color ?? '#4F3328'}
                                onChange={(event) => updateTextItem(selectedTextItem.id, { color: event.target.value })}
                                className="h-9 w-12 cursor-pointer rounded border border-[#ece7e3] bg-white p-1"
                              />
                              <span className="text-xs text-[#8C6A5D]">{selectedTextItem.payload.text?.color ?? '#4F3328'}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-6 gap-2">
                            {textColorPresets.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => updateTextItem(selectedTextItem.id, { color })}
                                className={`h-8 rounded-full border ${selectedTextItem.payload.text?.color === color ? 'border-[#34322f]' : 'border-transparent'}`}
                                style={{ backgroundColor: color }}
                                aria-label={`텍스트 색상 ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                      </section>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2">
                      <Input value={String(Math.round(selectedItem.x))} onChange={(event) => updateItem(selectedItem.id, { x: Number(event.target.value) || 0 })} />
                      <Input value={String(Math.round(selectedItem.y))} onChange={(event) => updateItem(selectedItem.id, { y: Number(event.target.value) || 0 })} />
                      <Input value={String(Math.round(selectedItem.width))} onChange={(event) => updateItem(selectedItem.id, { width: Number(event.target.value) || 40 })} />
                      <Input value={String(Math.round(selectedItem.height))} onChange={(event) => updateItem(selectedItem.id, { height: Number(event.target.value) || 40 })} />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-[#615f5b]">
                        <span>회전</span>
                        <span>{selectedItem.rotation}°</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <RoundIconButton type="button" onClick={() => updateItem(selectedItem.id, { rotation: selectedItem.rotation - 5 })}>
                          <RotateCcw className="h-4 w-4" />
                        </RoundIconButton>
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={selectedItem.rotation}
                          onChange={(event) => updateItem(selectedItem.id, { rotation: Number(event.target.value) })}
                          className="flex-1 accent-[#8C6A5D]"
                        />
                        <RoundIconButton type="button" onClick={() => updateItem(selectedItem.id, { rotation: selectedItem.rotation + 5 })}>
                          <RotateCw className="h-4 w-4" />
                        </RoundIconButton>
                      </div>
                    </div>

                    <Button variant="outline" size="sm" className="w-full" onClick={() => removeItem(selectedItem.id)}>
                      선택 요소 삭제
                    </Button>
                  </div>
                )}
              </SurfaceCard>
            ) : null}

            <SurfaceCard className="p-4">
              <p className="mb-3 text-sm font-semibold text-[#34322f]">줌</p>
              <div className="flex items-center gap-3">
                <RoundIconButton type="button" onClick={() => setZoom((prev) => Math.max(0.7, prev - 0.1))}>
                  <Minus className="h-4 w-4" />
                </RoundIconButton>
                <div className="flex-1 text-center text-sm text-[#6f5c45]">{Math.round(zoom * 100)}%</div>
                <RoundIconButton type="button" onClick={() => setZoom((prev) => Math.min(1.3, prev + 0.1))}>
                  <Plus className="h-4 w-4" />
                </RoundIconButton>
              </div>
            </SurfaceCard>
          </div>

          <Button className="mt-6 h-12 w-full" onClick={handleSave} disabled={isSaving}>
            <Check className="mr-1 h-4 w-4" />
            {isSaving ? '저장 중...' : '저장하기'}
          </Button>

          <button className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#615f5b]/40">
            <ChevronRight className="h-5 w-5" />
          </button>
        </aside>
      </main>

      {isTutorialOpen ? (
        <div className="fixed inset-0 z-[120] bg-[rgba(38,30,28,0.52)] backdrop-blur-[3px]">
          {tutorialStep?.id === 'sidebar' ? (
            <div className="pointer-events-none fixed left-1 top-[75px] h-[calc(100vh-82px)] w-20 rounded-[28px] border-[5px] border-[#6f6af8] shadow-[0_0_0_9999px_rgba(0,0,0,0.06)]" />
          ) : null}
          {tutorialStep?.id === 'canvas' ? (
            <div className="pointer-events-none fixed left-[98px] right-[332px] top-[60px] bottom-2 rounded-[28px] border-[5px] border-[#6f6af8] shadow-[0_0_0_9999px_rgba(0,0,0,0.06)]" />
          ) : null}
          {tutorialStep?.id === 'panel' ? (
            <div className="pointer-events-none fixed right-2 top-[75px] h-[calc(100vh-82px)] w-[304px] rounded-[28px] border-[5px] border-[#6f6af8] shadow-[0_0_0_9999px_rgba(0,0,0,0.06)]" />
          ) : null}

          <div
            className="absolute w-[min(92vw,440px)] rounded-[24px] border border-[#eadfd7] bg-[#fffaf6] px-6 py-5 text-[#34322f] shadow-[0_20px_60px_rgba(54,35,28,0.22)]"
            style={{
              left: tutorialBubbleLayout?.left ?? 24,
              top: tutorialBubbleLayout?.top ?? 24
            }}
          >
            {tutorialBubbleLayout?.arrowSide === 'left' ? (
              <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rotate-45 border-b border-l border-[#eadfd7] bg-[#fffaf6]" />
            ) : null}
            {tutorialBubbleLayout?.arrowSide === 'right' ? (
              <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rotate-45 border-r border-t border-[#eadfd7] bg-[#fffaf6]" />
            ) : null}
            {tutorialBubbleLayout?.arrowSide === 'top' ? (
              <div className="absolute left-1/2 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-t border-[#eadfd7] bg-[#fffaf6]" />
            ) : null}
            {tutorialBubbleLayout?.arrowSide === 'bottom' ? (
              <div className="absolute bottom-0 left-1/2 h-6 w-6 -translate-x-1/2 translate-y-1/2 rotate-45 border-b border-r border-[#eadfd7] bg-[#fffaf6]" />
            ) : null}
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#f4ebe5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8C6A5D]">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-[#8C6A5D] text-[10px] text-white">{tutorialStepIndex + 1}</span>
                  Tutorial Step
                </div>
                <h3 className="mt-3 text-[22px] font-bold tracking-tight">{tutorialStep.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6f5c45]">{tutorialStep.description}</p>
              </div>
              {/* <button type="button" onClick={() => closeTutorial(true)} className="text-sm text-[#8C6A5D]">
                건너뛰기
              </button> */}
            </div>

            <div className="relative mt-5 flex items-center justify-between">
              <button
                type="button"
                onClick={goToPreviousTutorialStep}
                disabled={tutorialStepIndex === 0}
                className="rounded-full border border-[#ece7e3] bg-white px-4 py-2 text-sm text-[#6f5c45] disabled:opacity-40"
              >
                이전
              </button>
              <div className="flex items-center gap-2">
                {tutorialSteps.map((step, index) => (
                  <span key={step.id} className={`h-2.5 w-2.5 rounded-full ${index === tutorialStepIndex ? 'bg-[#8C6A5D]' : 'bg-[#ded3cb]'}`} />
                ))}
              </div>
              <button type="button" onClick={goToNextTutorialStep} className="rounded-full bg-[#7d6456] px-5 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(125,100,86,0.35)]">
                {tutorialStepIndex === tutorialSteps.length - 1 ? '시작하기' : '다음'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isShareModalOpen ? (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(38,30,28,0.5)] px-4 backdrop-blur-[4px]">
          <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-[#eadfd7] bg-[#fff9f4] shadow-[0_28px_80px_rgba(52,50,47,0.24)]">
            <div className="border-b border-[#eee2d8] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(244,232,223,0.9)_60%,_rgba(237,224,213,0.88))] px-7 py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8C6A5D]">Share As Letter</p>
                  <h3 className="mt-2 font-['Epilogue'] text-3xl font-bold tracking-tight text-[#34322f]">편지처럼 보내기</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6f5c45]">
                    에디터 결과물을 읽기 전용 편지 링크로 발행합니다. 원본을 나중에 수정해도 이미 보낸 편지는 그대로 유지돼요.
                  </p>
                </div>
                <button type="button" onClick={() => setIsShareModalOpen(false)} className="text-sm text-[#8C6A5D]">
                  닫기
                </button>
              </div>
            </div>

            <div className="grid gap-6 px-7 py-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <section className="rounded-[24px] border border-[#eee2d8] bg-white/80 p-4">
                  <label className="mb-2 block text-sm font-semibold text-[#34322f]">받는 사람</label>
                  <Input
                    value={shareRecipientName}
                    onChange={(event) => setShareRecipientName(event.target.value)}
                    placeholder="예: 미래의 나, 윤경에게"
                    className="h-11 rounded-2xl border-[#ece7e3] bg-[#fcfaf8]"
                  />
                </section>

                <section className="rounded-[24px] border border-[#eee2d8] bg-white/80 p-4">
                  <label className="mb-2 block text-sm font-semibold text-[#34322f]">커버 문구</label>
                  <textarea
                    value={shareCoverMessage}
                    onChange={(event) => setShareCoverMessage(event.target.value)}
                    placeholder="예: 오늘의 기록을 편지로 전해요."
                    className="min-h-28 w-full rounded-2xl border border-[#ece7e3] bg-[#fcfaf8] p-3 text-sm outline-none"
                  />
                </section>

                {shareMessage ? <NoticeBox tone="success">{shareMessage}</NoticeBox> : null}
                {saveError ? <NoticeBox tone="error">{saveError}</NoticeBox> : null}

                {sharedLetterUrl ? (
                  <SurfaceCard tone="soft" radius="xl" className="p-4">
                    <p className="mb-2 text-sm font-semibold text-[#34322f]">생성된 링크</p>
                    <div className="rounded-2xl border border-[#ece7e3] bg-[#fcfaf8] px-3 py-3 text-sm text-[#6f5c45]">
                      {sharedLetterUrl}
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" onClick={() => void handleCopyShareLink()}>
                        <Copy className="mr-2 h-4 w-4" />
                        링크 복사
                      </Button>
                      <Button size="sm" onClick={() => window.open(sharedLetterUrl, '_blank', 'noopener,noreferrer')}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        편지 열기
                      </Button>
                    </div>
                  </SurfaceCard>
                ) : null}
              </div>

              <div className="space-y-4">
                <section className="rounded-[26px] border border-[#eadfd7] bg-[linear-gradient(180deg,#fbf2e8_0%,#fff9f4_55%,#f1e3d4_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a38977]">Envelope Preview</p>
                  <div className="relative mt-4 h-[240px] rounded-[28px] bg-[linear-gradient(180deg,#f4e4d4_0%,#ead5c4_100%)] shadow-[0_14px_30px_rgba(68,48,36,0.12)]">
                    <div className="absolute inset-x-5 top-5 rounded-[18px] bg-white/80 px-4 py-3 text-sm text-[#6f5c45] shadow-sm">
                      {shareRecipientName.trim() ? `To. ${shareRecipientName.trim()}` : 'To. 아직 정해지지 않은 수신자'}
                    </div>
                    <div className="absolute inset-x-0 top-0 h-24 rounded-t-[28px] bg-[linear-gradient(180deg,#efddcc_0%,#f8eee5_100%)] [clip-path:polygon(0_0,100%_0,50%_100%)]" />
                    <div className="absolute inset-x-7 bottom-7 rounded-[18px] bg-[#fffaf4] px-4 py-4 text-sm leading-6 text-[#5f534a] shadow-[0_10px_24px_rgba(68,48,36,0.12)]">
                      {shareCoverMessage.trim() || '편지를 열고 오늘의 기록을 읽어보세요.'}
                    </div>
                  </div>
                </section>

                <SurfaceCard tone="soft" radius="xl" className="p-4">
                  <p className="mb-3 text-sm font-semibold text-[#34322f]">편지 무드</p>
                  <div className="space-y-2">
                    {shareThemeOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setShareTheme(option.value)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          shareTheme === option.value
                            ? 'border-[#8C6A5D] bg-[#f6efe8]'
                            : 'border-[#ece7e3] bg-[#fcfaf8]'
                        }`}
                      >
                        <p className="text-sm font-semibold text-[#34322f]">{option.label}</p>
                        <p className="mt-1 text-xs text-[#8C6A5D]">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </SurfaceCard>

                <Button className="h-12 w-full" onClick={() => void handleCreateShare()} disabled={isCreatingShare}>
                  <Send className="mr-2 h-4 w-4" />
                  {isCreatingShare ? '편지 생성 중...' : '편지 링크 만들기'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
