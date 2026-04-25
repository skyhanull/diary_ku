'use client';

import Image from 'next/image';
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

  return (
    <section className="rounded-[36px] border border-white/60 bg-white/35 p-4 shadow-[0_24px_60px_rgba(78,60,45,0.14)] backdrop-blur">
      <div className="mx-auto max-w-[760px]">
        <article className={`relative overflow-hidden rounded-[28px] border ${paperTone} px-5 py-6 shadow-[0_28px_70px_rgba(76,54,36,0.16)] sm:px-8 sm:py-9`}>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0,transparent_34px,rgba(214,194,176,0.55)_35px)] bg-[length:100%_36px] opacity-45" />
          <div className="pointer-events-none absolute left-8 top-0 h-full w-px bg-[#e7b4aa]/60" />

          <div className="relative z-10 border-b border-[#eadfd2] pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9b8170]">{letter.snapshot.entryDate}</p>
            <h1 className="mt-3 font-['Epilogue'] text-3xl font-bold tracking-tight text-[#34322f]">
              {letter.snapshot.title || '제목 없는 편지지'}
            </h1>
            {letter.recipientName ? <p className="mt-3 text-sm text-[#6f5c45]">To. {letter.recipientName}</p> : null}
          </div>

          <div className="relative z-10 mt-6 min-h-[560px] overflow-hidden rounded-[22px] bg-white/45 p-5 sm:p-7">
            <div className="max-w-[620px] whitespace-pre-wrap break-words text-[15px] leading-8 text-[#4f473f]">
              {bodyText || '이 편지지에는 아직 본문이 없어요.'}
            </div>
            <div className="absolute inset-0">
              {letter.snapshot.items.map((item) => renderSharedItem(item))}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
