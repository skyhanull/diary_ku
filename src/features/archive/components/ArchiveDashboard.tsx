'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ImageIcon, Search, Sparkles, Sticker, Type } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { rankArchiveEntries, type ArchiveSearchResult } from '@/features/archive/lib/archive-search';
import { loadAllDiaryEntrySummaries } from '@/features/home/lib/home-persistence';
import type { DiaryEntrySummary } from '@/features/home/types/home.types';
import { cn } from '@/lib/utils';

const moodLabels = new Map([
  [100, { emoji: '😄', label: '좋음' }],
  [80, { emoji: '🙂', label: '평온' }],
  [60, { emoji: '😐', label: '보통' }],
  [40, { emoji: '🙁', label: '흐림' }],
  [20, { emoji: '😢', label: '슬픔' }]
]);

const mediaFilters = [
  { key: 'all', label: '전체' },
  { key: 'text', label: '글' },
  { key: 'photo', label: '사진' },
  { key: 'sticker', label: '스티커' }
] as const;

const statusLabels = {
  empty: '빈 기록',
  draft: '작성 중',
  saved: '저장됨',
  published: '공유됨'
} as const;

type MediaFilter = (typeof mediaFilters)[number]['key'];
type SortMode = 'relevance' | 'recent';

function parseMediaFilter(value: string | null): MediaFilter {
  return mediaFilters.some((filter) => filter.key === value) ? (value as MediaFilter) : 'all';
}

function parseSortMode(value: string | null): SortMode {
  return value === 'relevance' ? 'relevance' : 'recent';
}

function formatDateLabel(date: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(`${date}T00:00:00`));
}

function getMoodLabel(entry: DiaryEntrySummary) {
  if (entry.moodScore === undefined) return null;
  return moodLabels.get(entry.moodScore) ?? null;
}

function getEntryText(entry: DiaryEntrySummary) {
  if (entry.bodyText) return entry.bodyText;
  if (entry.hasPhoto || entry.hasSticker) return '이미지와 스티커로 남긴 기록이에요.';
  return '아직 본문이 없는 기록이에요.';
}

function matchesMediaFilter(entry: DiaryEntrySummary, filter: MediaFilter) {
  if (filter === 'all') return true;
  if (filter === 'text') return Boolean(entry.hasText);
  if (filter === 'photo') return Boolean(entry.hasPhoto);
  return Boolean(entry.hasSticker);
}

function EntryCard({ result, index, showReasons }: { result: ArchiveSearchResult; index: number; showReasons: boolean }) {
  const { entry, reasons } = result;
  const mood = getMoodLabel(entry);
  const previewText = getEntryText(entry);
  const title = entry.title || `${formatDateLabel(entry.date)}의 기록`;
  const tallCard = index % 5 === 1;
  const hasCoverImage = Boolean(entry.coverImageUrl);

  return (
    <Link
      href={`/editor/${entry.date}`}
      className={cn(
        'group mb-ds-5 inline-block w-full break-inside-avoid overflow-hidden rounded-lg border border-line bg-paper-warm shadow-[0_12px_30px_rgba(52,50,47,0.06)] transition duration-200 hover:-translate-y-1 hover:border-cedar/50 hover:shadow-[0_18px_44px_rgba(52,50,47,0.10)]',
        tallCard && !hasCoverImage ? 'min-h-[18rem]' : 'min-h-[13rem]',
        index % 4 === 2 ? 'bg-paper-soft' : 'bg-paper-warm'
      )}
    >
      {hasCoverImage ? (
        <div
          className="relative h-44 bg-cover bg-center"
          style={{ backgroundImage: `url("${entry.coverImageUrl?.replace(/"/g, '%22')}")` }}
          role="img"
          aria-label={entry.title ?? '보관함 대표 이미지'}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/12 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-ds-card text-paper-warm">
            <p className="text-ds-caption font-semibold opacity-90">{formatDateLabel(entry.date)}</p>
            <p className="mt-ds-1 line-clamp-2 font-display text-ds-title font-semibold">{title}</p>
          </div>
        </div>
      ) : (
        <div className="mx-ds-card mt-ds-card rounded-md border border-line/80 bg-oatmeal px-ds-4 py-ds-5">
          <div className="border-l-2 border-cedar/70 pl-ds-4">
            <p className="text-ds-caption font-semibold text-cedar">{formatDateLabel(entry.date)}</p>
            <p className="mt-ds-2 line-clamp-3 font-editorial text-ds-title font-semibold text-ink">{title}</p>
          </div>
        </div>
      )}

      <div className="p-ds-card">
        {hasCoverImage ? null : (
          <div className="mb-ds-3 flex items-start justify-between gap-ds-3">
            <div>
              {mood ? <p className="text-ds-caption text-ink-muted">{mood.emoji} {mood.label}</p> : null}
              <p className="mt-ds-1 text-ds-caption font-semibold text-cedar">{statusLabels[entry.status]}</p>
            </div>
            {entry.hasSticker ? <Sticker className="mt-1 h-4 w-4 text-cedar" aria-hidden /> : null}
          </div>
        )}

        {hasCoverImage ? (
          <div className="mb-ds-3 flex items-center justify-between gap-ds-3">
            {mood ? <p className="text-ds-caption text-ink-muted">{mood.emoji} {mood.label}</p> : <span />}
            <p className="text-ds-caption font-semibold text-cedar">{statusLabels[entry.status]}</p>
          </div>
        ) : null}

        <p className={cn('text-ds-body text-ink-soft', tallCard ? 'line-clamp-6' : 'line-clamp-4')}>{previewText}</p>

        <div className="mt-ds-4 flex flex-wrap gap-ds-2">
          {showReasons
            ? reasons.map((reason) => (
                <span key={reason} className="rounded-lg bg-cedar-soft px-ds-2 py-ds-1 text-ds-caption font-semibold text-cedar-dark">
                  {reason}
                </span>
              ))
            : null}
          {(entry.tags ?? []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-lg bg-oatmeal px-ds-2 py-ds-1 text-ds-caption font-semibold text-ink-warm">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-ds-4 flex items-center justify-between gap-ds-3 border-t border-line/70 pt-ds-3 text-ds-caption text-ink-muted">
          <div className="flex items-center gap-ds-3">
            {entry.hasText ? <Type className="h-3.5 w-3.5" aria-label="본문" /> : null}
            {entry.hasPhoto ? <ImageIcon className="h-3.5 w-3.5" aria-label="사진" /> : null}
            {entry.hasSticker ? <Sticker className="h-3.5 w-3.5" aria-label="스티커" /> : null}
            {entry.itemCount ? <span>{entry.itemCount}개 요소</span> : null}
          </div>
          <span className="font-semibold text-cedar opacity-0 transition group-hover:opacity-100">열기</span>
        </div>
      </div>
    </Link>
  );
}

export function ArchiveDashboard() {
  const [entries, setEntries] = useState<DiaryEntrySummary[]>([]);
  const [query, setQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [selectedTag, setSelectedTag] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [isQueryReady, setIsQueryReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastSyncedQueryRef = useRef('');

  useEffect(() => {
    let cancelled = false;

    const syncEntries = async () => {
      try {
        const nextEntries = await loadAllDiaryEntrySummaries();
        if (!cancelled) {
          setEntries(nextEntries);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setEntries([]);
          setError(loadError instanceof Error ? loadError.message : '보관함을 불러오는 중 문제가 생겼어요.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void syncEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get('q') ?? '';

    setQuery(nextQuery);
    setMediaFilter(parseMediaFilter(params.get('media')));
    setSelectedTag(params.get('tag') ?? 'all');
    setSortMode(parseSortMode(params.get('sort')));
    setIsQueryReady(true);
  }, []);

  useEffect(() => {
    if (!isQueryReady) return;

    const params = new URLSearchParams(window.location.search);
    const nextQuery = query.trim();

    if (nextQuery) {
      params.set('q', nextQuery);
    } else {
      params.delete('q');
    }

    if (mediaFilter === 'all') {
      params.delete('media');
    } else {
      params.set('media', mediaFilter);
    }

    if (selectedTag === 'all') {
      params.delete('tag');
    } else {
      params.set('tag', selectedTag);
    }

    if (sortMode === 'recent') {
      params.delete('sort');
    } else {
      params.set('sort', sortMode);
    }

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    if (lastSyncedQueryRef.current === nextUrl || nextUrl === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      lastSyncedQueryRef.current = nextUrl;
      return;
    }

    window.history.replaceState(null, '', nextUrl);
    lastSyncedQueryRef.current = nextUrl;
  }, [isQueryReady, mediaFilter, query, selectedTag, sortMode]);

  const tagOptions = useMemo(() => {
    const tagSet = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.tags ?? []) {
        tagSet.add(tag);
      }
    }
    return ['all', ...Array.from(tagSet).sort((left, right) => left.localeCompare(right, 'ko'))];
  }, [entries]);

  const visibleResults = useMemo(() => {
    const queryText = query.trim();

    return rankArchiveEntries(entries, queryText)
      .filter(({ entry }) => {
        if (selectedTag !== 'all' && !(entry.tags ?? []).includes(selectedTag)) return false;
        return matchesMediaFilter(entry, mediaFilter);
      })
      .sort((left, right) => {
        if (sortMode === 'relevance' && queryText) {
          return right.score - left.score || right.entry.date.localeCompare(left.entry.date);
        }
        return right.entry.date.localeCompare(left.entry.date);
      });
  }, [entries, mediaFilter, query, selectedTag, sortMode]);

  return (
    <main className="mx-auto max-w-[1180px] px-ds-page pb-ds-12 pt-ds-8 lg:px-ds-page-lg">
      <section className="mb-ds-8 flex flex-col gap-ds-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-ds-2 flex items-center gap-ds-2 text-ds-caption font-semibold text-cedar">
            <CalendarDays className="h-4 w-4" />
            나중에 다시 꺼내볼 기록들
          </p>
          <h1 className="font-display text-ds-brand font-bold text-ink">기록 보관함</h1>
          <p className="mt-ds-2 max-w-xl text-ds-body text-ink-muted">
            제목, 본문, 태그, 감정으로 저장한 일기를 빠르게 찾아볼 수 있어요.
          </p>
        </div>

        <Link href="/" className={buttonVariants({ size: 'pill', variant: 'warm', className: 'rounded-lg' })}>
          달력으로 돌아가기
        </Link>
      </section>

      <section className="mb-ds-6 space-y-ds-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (nextQuery.trim()) {
                setSortMode('relevance');
              } else {
                setSortMode('recent');
              }
            }}
            placeholder="기억의 키워드를 입력하세요..."
            className="h-12 rounded-lg border-line bg-paper-warm pl-11 shadow-[0_10px_28px_rgba(52,50,47,0.04)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-ds-2">
          {mediaFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              onClick={() => setMediaFilter(filter.key)}
              className={cn(
                'rounded-lg border px-ds-3 py-ds-2 text-ds-caption font-semibold transition',
                mediaFilter === filter.key
                  ? 'border-cedar bg-cedar text-paper-warm'
                  : 'border-line bg-paper-warm text-ink-warm hover:border-cedar/50'
              )}
            >
              {filter.label}
            </button>
          ))}

          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={cn(
                'rounded-lg border px-ds-3 py-ds-2 text-ds-caption font-semibold transition',
                selectedTag === tag
                  ? 'border-ink bg-ink text-paper-warm'
                  : 'border-line bg-paper-warm text-ink-warm hover:border-ink/40'
              )}
            >
              {tag === 'all' ? '태그 전체' : `#${tag}`}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setSortMode((current) => (current === 'recent' ? 'relevance' : 'recent'))}
            className="ml-auto rounded-lg border border-line bg-paper-warm px-ds-3 py-ds-2 text-ds-caption font-semibold text-ink-warm transition hover:border-cedar/50"
          >
            {sortMode === 'recent' ? '최신순' : '관련도순'}
          </button>

          {query || mediaFilter !== 'all' || selectedTag !== 'all' ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setMediaFilter('all');
                setSelectedTag('all');
                setSortMode('recent');
              }}
              className="rounded-lg border border-line bg-paper-warm px-ds-3 py-ds-2 text-ds-caption font-semibold text-ink-muted transition hover:border-cedar/50 hover:text-cedar"
            >
              초기화
            </button>
          ) : null}
        </div>
      </section>

      {error ? (
        <section className="rounded-lg border border-rose/30 bg-rose-pale p-ds-card-lg text-ds-body text-rose-danger">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        <section className="grid min-h-[20rem] place-items-center rounded-lg border border-line bg-paper-warm text-ds-body text-ink-muted">
          보관함을 정리하는 중이에요.
        </section>
      ) : null}

      {!isLoading && !error && visibleResults.length === 0 ? (
        <section className="grid min-h-[20rem] place-items-center rounded-lg border border-line bg-paper-warm p-ds-card-lg text-center">
          <div>
            <Sparkles className="mx-auto mb-ds-3 h-6 w-6 text-cedar" />
            <p className="font-display text-ds-title font-semibold text-ink">아직 꺼내볼 기록이 없어요</p>
            <p className="mt-ds-2 text-ds-body text-ink-muted">검색어를 줄이거나 달력에서 새 기록을 남겨보세요.</p>
          </div>
        </section>
      ) : null}

      {!isLoading && !error && visibleResults.length > 0 ? (
        <section className="columns-1 gap-ds-5 sm:columns-2 lg:columns-3">
          {visibleResults.map((result, index) => (
            <EntryCard key={result.entry.id} result={result} index={index} showReasons={Boolean(query.trim())} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
