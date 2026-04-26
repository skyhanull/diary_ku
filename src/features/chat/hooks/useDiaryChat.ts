"use client";
// AI 채팅 훅: 대화 이력 로드, 스트리밍 수신, 메시지 DB 저장을 관리한다
import { useCallback, useEffect, useRef, useState } from "react";
import { authorizedFetch } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";

// 채팅 메시지 한 건의 형태를 정의한다 (id, 역할, 내용)
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// DB에 저장하지 않는 기본 인사 메시지로, 대화 이력이 없을 때 초기값으로 쓴다
const GREETING: ChatMessage = {
  id: "initial-greeting",
  role: "assistant",
  content: "안녕! 오늘 하루 어땠어? 일기 써주면 내가 기억해둘게 😊",
};

// 특정 날짜 일기에 대한 AI 채팅 상태와 전송·저장 로직을 제공하는 훅이다
export function useDiaryChat({ entryDate }: { entryDate: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // 패널이 열릴 때 현재 날짜(entryDate)에 연결된 이전 대화를 불러온다.
    // 저장된 이력이 없으면 DB에 넣지 않은 기본 인사만 보여준다.
    if (!supabase) {
      setMessages([GREETING]);
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        if (!session?.user) {
          setMessages([GREETING]);
          return;
        }

        const { data } = await supabase!
          .from("chat_messages")
          .select("id, role, content")
          .eq("user_id", session.user.id)
          .eq("entry_date", entryDate)
          .order("created_at", { ascending: true })
          .limit(50);

        setMessages(
          data?.length
            ? data.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }))
            : [GREETING]
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [entryDate]);

  // 스트리밍 완료 후 user·assistant 메시지 쌍을 Supabase에 저장한다
  const saveMessages = useCallback(
    async (userMsg: ChatMessage, assistantMsg: ChatMessage) => {
      if (!supabase) return;
      try {
        // 스트리밍이 끝난 뒤 user/assistant 메시지를 한 번에 저장한다.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        await supabase.from("chat_messages").insert([
          { id: userMsg.id, user_id: session.user.id, entry_date: entryDate, role: "user", content: userMsg.content },
          { id: assistantMsg.id, user_id: session.user.id, entry_date: entryDate, role: "assistant", content: assistantMsg.content },
        ]);
      } catch {
        // silently ignore
      }
    },
    [entryDate]
  );

  // 입력값을 서버로 전송하고 스트리밍 응답을 메시지 버블에 실시간으로 반영한다
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || !supabase) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();

    // 먼저 낙관적으로 메시지 버블을 추가하고, assistant는 빈 상태로 스트리밍을 기다린다.
    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let assistantContent = "";

    try {
      // 인사 메시지는 제외하고 최근 대화 일부만 서버에 보낸다.
      const history = messages
        .filter((m) => m.id !== "initial-greeting")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await authorizedFetch("/api/diary/chat", {
        method: "POST",
        body: JSON.stringify({ message: text, conversationHistory: history }),
        signal: abortRef.current.signal,
      });
      if (!res.body) throw new Error("응답을 받지 못했어요.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;
        // 스트리밍 chunk를 assistant 버블에 이어붙여 "타이핑 중"처럼 보이게 한다.
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
        );
      }

      void saveMessages(userMessage, { id: assistantId, role: "assistant", content: assistantContent });
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: "오류가 발생했어요. 다시 시도해주세요." } : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }, [input, isStreaming, messages, saveMessages]);

  return { messages, input, isStreaming, isLoading, setInput, sendMessage };
}
