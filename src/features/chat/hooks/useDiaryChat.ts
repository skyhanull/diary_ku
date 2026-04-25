"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMessage = {
  id: "initial-greeting",
  role: "assistant",
  content: "안녕! 오늘 하루 어땠어? 일기 써주면 내가 기억해둘게 😊",
};

export function useDiaryChat({ entryDate }: { entryDate: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
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

  const saveMessages = useCallback(
    async (userMsg: ChatMessage, assistantMsg: ChatMessage) => {
      if (!supabase) return;
      try {
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

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || !supabase) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text };
    const assistantId = crypto.randomUUID();

    setMessages((prev) => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    let assistantContent = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("로그인이 필요해요.");

      const history = messages
        .filter((m) => m.id !== "initial-greeting")
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/diary/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text, conversationHistory: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error("응답을 받지 못했어요.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        assistantContent += chunk;
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
