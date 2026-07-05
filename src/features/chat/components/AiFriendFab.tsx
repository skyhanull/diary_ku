"use client";
// 전역 AI 친구 진입점: 로그인 상태에서 우하단 플로팅 버튼으로 어디서나 채팅을 연다
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { DiaryChat } from "@/features/chat/components/DiaryChat";
import { supabase } from "@/lib/supabase";

// 전역 채팅은 특정 일기 날짜에 묶이지 않으므로 "오늘"을 대화 스레드 키로 사용한다 (YYYY-MM-DD, 로컬 기준)
function getTodayKey() {
  return new Date().toLocaleDateString("en-CA");
}

export function AiFriendFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setIsAuthed(Boolean(data.session?.user));
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!isAuthed) return null;

  return (
    <>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="AI 일기 친구 열기"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-cedar text-paper shadow-[0_12px_32px_rgba(52,50,47,0.24)] transition-transform hover:scale-105"
        >
          <Sparkles className="h-6 w-6" />
        </button>
      ) : null}

      <DiaryChat entryDate={getTodayKey()} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
