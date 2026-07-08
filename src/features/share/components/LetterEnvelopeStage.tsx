'use client';
// 편지지 본문: 공유 일기를 에디터와 동일한 페이지 좌표계(700×933)를 그대로 스케일해 읽기 전용으로 재현한다.
// 이렇게 하면 본문 글과 스티커·사진·텍스트 아이템의 상대 위치가 작성 당시와 정확히 일치한다.
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { EDITOR_PAGE_HEIGHT, EDITOR_PAGE_WIDTH } from '@/features/editor/lib/editor-canvas';
import type { EditorItem, SharedLetterRecord } from '@/features/editor/types/editor.types';

interface LetterEnvelopeStageProps {
  letter: SharedLetterRecord;
  bodyText: string;
}

function renderSharedItem(item: EditorItem) {
  const style = {
    left: `${item.x}px`,
    top: `${item.y}px`,
    width: `${item.width}px`,
    height: `${item.height}px`,
    transform: `rotate(${item.rotation}deg)`,
    opacity: item.opacity,
    zIndex: item.zIndex
  };

  if (item.type === 'text' && item.payload.text) {
    return (
      <div
        key={item.id}
        className="absolute whitespace-pre-wrap break-words rounded-2xl px-2 py-1"
        style={{
          ...style,
          color: item.payload.text.color,
          fontSize: `${item.payload.text.fontSize}px`,
          fontFamily: item.payload.text.fontFamily ?? 'inherit'
        }}
      >
        {item.payload.text.content}
      </div>
    );
  }

  if (!item.payload.imageUrl) return null;

  return (
    <div
      key={item.id}
      className="absolute overflow-hidden rounded-[20px] shadow-[0_12px_28px_rgba(52,50,47,0.14)]"
      style={style}
    >
      <Image
        src={item.payload.imageUrl}
        alt={item.payload.alt ?? item.payload.prompt ?? item.type}
        fill
        unoptimized
        sizes={`${item.width}px`}
        className="object-cover"
      />
    </div>
  );
}

export function LetterEnvelopeStage({ letter, bodyText }: LetterEnvelopeStageProps) {
  const isMidnight = letter.theme === 'midnight';
  const paperTone = isMidnight
    ? 'border-[#d4c2b0] bg-[linear-gradient(180deg,#fffaf4_0%,#fffdf9_52%,#f0e4d7_100%)]'
    : 'border-[#eadfd2] bg-[linear-gradient(180deg,#fffdf8_0%,#fff8f0_48%,#f7eadc_100%)]';

  // 페이지(700px 기준 좌표계)를 컨테이너 폭에 맞춰 균일 축소하기 위한 배율을 계산한다.
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const updateScale = () => setScale(element.clientWidth / EDITOR_PAGE_WIDTH);
    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="rounded-[36px] border border-white/60 bg-white/35 p-4 shadow-[0_24px_60px_rgba(78,60,45,0.14)] backdrop-blur">
      <div className="mx-auto max-w-[760px]">
        <article className={`relative overflow-hidden rounded-[28px] border ${paperTone} px-5 py-6 shadow-[0_28px_70px_rgba(76,54,36,0.16)] sm:px-8 sm:py-9`}>
          <div className="relative z-10 border-b border-[#eadfd2] pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b8170]">{letter.snapshot.entryDate}</p>
            <h1 className="mt-3 font-['Epilogue'] text-3xl font-bold tracking-tight text-[#34322f]">
              {letter.snapshot.title || '제목 없는 편지지'}
            </h1>
            {letter.recipientName ? <p className="mt-3 text-sm text-[#6f5c45]">To. {letter.recipientName}</p> : null}
          </div>

          {/* 작성 당시 페이지를 그대로 재현하는 스테이지. 높이는 배율에 맞춰 잡아 여백 붕괴를 막는다. */}
          <div
            ref={stageRef}
            className="relative z-10 mt-6 w-full overflow-hidden rounded-[22px] border border-[#efe3d5] bg-[linear-gradient(to_bottom,transparent_0,transparent_34px,rgba(214,194,176,0.4)_35px)] bg-[length:100%_36px] bg-white/55"
            style={{ height: scale > 0 ? EDITOR_PAGE_HEIGHT * scale : EDITOR_PAGE_HEIGHT * 0.9 }}
          >
            <div className="pointer-events-none absolute left-8 top-0 z-0 h-full w-px bg-[#e7b4aa]/50" />

            <div
              className="absolute left-0 top-0"
              style={{
                width: EDITOR_PAGE_WIDTH,
                height: EDITOR_PAGE_HEIGHT,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                visibility: scale > 0 ? 'visible' : 'hidden'
              }}
            >
              <div className="absolute inset-x-0 top-0 px-8 pt-9">
                <div className="max-w-[560px] whitespace-pre-wrap break-words text-[16px] leading-[1.9] text-[#4f473f]">
                  {bodyText || '이 편지지에는 아직 본문이 없어요.'}
                </div>
              </div>

              <div className="absolute inset-0">
                {letter.snapshot.items.map((item) => renderSharedItem(item))}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
