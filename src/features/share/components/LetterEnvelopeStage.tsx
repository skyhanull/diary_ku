'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { EditorItem, SharedLetterRecord } from '@/features/editor/types/editor.types';

type LetterOpenState = 'closed' | 'opened';

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
    opacity: item.opacity
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
          fontFamily: item.payload.text.fontFamily ?? 'inherit',
          zIndex: item.zIndex
        }}
      >
        {item.payload.text.content}
      </div>
    );
  }

  if (!item.payload.imageUrl) return null;

  return (
    <img
      key={item.id}
      src={item.payload.imageUrl}
      alt={item.payload.alt ?? item.payload.prompt ?? item.type}
      className="absolute rounded-[20px] object-cover shadow-[0_12px_28px_rgba(52,50,47,0.14)]"
      style={{
        ...style,
        zIndex: item.zIndex
      }}
    />
  );
}

export function LetterEnvelopeStage({ letter, bodyText }: LetterEnvelopeStageProps) {
  const [openState, setOpenState] = useState<LetterOpenState>('closed');
  const isOpen = openState === 'opened';

  return (
    <div className="relative overflow-hidden rounded-[36px] border border-[#eadfd2] bg-[#fff7ed] p-5 shadow-[0_24px_60px_rgba(78,60,45,0.14)]">
      <div className="relative mx-auto min-h-[720px] max-w-4xl overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.9),transparent_34%),linear-gradient(180deg,#fff8ef_0%,#fffdf8_54%,#f5eadc_100%)]">
        <motion.div
          className="absolute left-1/2 top-10 z-50 w-[min(82vw,560px)] -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: isOpen ? -8 : 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#2f8f85] shadow-[0_10px_24px_rgba(39,91,86,0.08)]">
            <Sparkles className="h-3.5 w-3.5" />
            {letter.recipientName ? `${letter.recipientName}에게 보내는 편지` : 'Dear letter'}
          </div>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#4f706b]">
            {letter.coverMessage ?? '편지를 열고 오늘의 기록을 읽어보세요.'}
          </p>
        </motion.div>

        <div className="absolute inset-x-0 top-[142px] flex justify-center px-6 [perspective:1400px]">
          <motion.article
            className="relative h-[560px] w-[min(78vw,520px)]"
            initial={false}
            animate={{
              y: isOpen ? 0 : 126,
              scale: isOpen ? 1 : 0.92,
              rotate: isOpen ? 0 : -1
            }}
            transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-[22px] border border-b-0 border-[#e3d4c5] bg-[#fffdf8] shadow-[0_22px_48px_rgba(76,54,36,0.12)]">
              <div className="absolute inset-0 bg-gradient-to-b from-[#fffefb] via-[#fff9f0] to-[#f6eadb]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0,transparent_34px,#eadfd2_35px)] bg-[length:100%_36px] opacity-45" />
              <div className="relative z-10 p-8">
                <p className="text-xs uppercase tracking-[0.28em] text-[#9b8170]">{letter.snapshot.entryDate}</p>
                <h1 className="mt-3 font-['Epilogue'] text-3xl font-bold tracking-tight text-[#34322f]">
                  {letter.snapshot.title || '제목 없는 편지'}
                </h1>
                {letter.recipientName ? <p className="mt-3 text-sm text-[#6f5c45]">To. {letter.recipientName}</p> : null}
              </div>
            </div>

            <motion.div
              className="absolute inset-x-0 top-1/2 h-1/2 origin-top overflow-hidden rounded-b-[22px] border border-t-0 border-[#e3d4c5] bg-[#fff9f0] shadow-[0_28px_58px_rgba(76,54,36,0.16)] [backface-visibility:hidden]"
              initial={false}
              animate={{
                rotateX: isOpen ? 0 : -94,
                opacity: isOpen ? 1 : 0.96
              }}
              transition={{ duration: 0.92, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#f6eadb] via-[#fff9f0] to-[#fffdf8]" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0,transparent_34px,#eadfd2_35px)] bg-[length:100%_36px] opacity-45" />
              <motion.div
                className="relative z-10 px-8 pb-8 pt-7"
                initial={false}
                animate={{
                  opacity: isOpen ? 1 : 0,
                  y: isOpen ? 0 : -8
                }}
                transition={{ duration: 0.34, delay: isOpen ? 0.36 : 0, ease: 'easeOut' }}
              >
                <div className="relative min-h-[220px] overflow-hidden rounded-[18px] border border-[#eadfd2] bg-white/72 px-7 pb-7 pt-6">
                  <div className="relative z-10">
                    <p className="mb-5 text-sm font-semibold text-[#7f6b5b]">{letter.snapshot.entryDate}</p>
                    <div className="max-w-[390px] whitespace-pre-wrap break-words text-[15px] leading-8 text-[#4f473f]">
                      {bodyText || '이 편지에는 아직 본문이 없어요.'}
                    </div>
                  </div>
                  <motion.div
                    className="absolute inset-0 z-20"
                    initial={false}
                    animate={{ opacity: isOpen ? 1 : 0 }}
                    transition={{ duration: 0.3, delay: isOpen ? 0.48 : 0 }}
                  >
                    {letter.snapshot.items.map((item) => renderSharedItem(item))}
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="absolute left-0 right-0 top-1/2 z-30 h-px bg-[#d4c2b0]"
              initial={false}
              animate={{ opacity: isOpen ? 0.7 : 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.article>
        </div>

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              className="absolute bottom-[42px] left-1/2 z-50 -translate-x-1/2"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.35, delay: 0.35 }}
            >
              <Button type="button" variant="outline" size="sm" onClick={() => setOpenState('closed')} className="bg-white/80 backdrop-blur">
                다시 접기
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="open"
              className="absolute bottom-[42px] left-1/2 z-50 -translate-x-1/2"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <Button type="button" variant="warm" size="pill" onClick={() => setOpenState('opened')} className="flex">
                편지 열기
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
