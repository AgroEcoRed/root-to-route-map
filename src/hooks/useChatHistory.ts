import { useCallback, useEffect, useState } from "react";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  id: string;
  ts: number;
};

const keyFor = (mode: string) => `agrored-chat-history-${mode}`;

export function useChatHistory(mode: string) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(keyFor(mode));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Re-load when mode changes
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(keyFor(mode));
      setMessages(raw ? JSON.parse(raw) : []);
    } catch {
      setMessages([]);
    }
  }, [mode]);

  // Persist
  useEffect(() => {
    try {
      window.localStorage.setItem(keyFor(mode), JSON.stringify(messages));
    } catch {
      // quota — ignore
    }
  }, [mode, messages]);

  const append = useCallback((msg: Omit<ChatMessage, "id" | "ts">) => {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: crypto.randomUUID(), ts: Date.now() },
    ]);
  }, []);

  const updateLast = useCallback((updater: (m: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const copy = prev.slice();
      copy[copy.length - 1] = updater(copy[copy.length - 1]);
      return copy;
    });
  }, []);

  const reset = useCallback(() => {
    setMessages([]);
    try {
      window.localStorage.removeItem(keyFor(mode));
    } catch {
      // ignore
    }
  }, [mode]);

  return { messages, append, updateLast, reset, setMessages };
}