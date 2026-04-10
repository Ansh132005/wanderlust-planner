import { useState, useCallback } from "react";
import type { Msg } from "@/lib/streamChat";

export interface Conversation {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: number;
}

const STORAGE_KEY = "travelmate-conversations";

function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convos));
}

function generateTitle(messages: Msg[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New Chat";
  return first.content.length > 40
    ? first.content.slice(0, 40) + "…"
    : first.content;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const persist = useCallback((updated: Conversation[]) => {
    const sorted = [...updated].sort((a, b) => b.updatedAt - a.updatedAt);
    setConversations(sorted);
    saveConversations(sorted);
  }, []);

  const newChat = useCallback(() => {
    setActiveId(null);
  }, []);

  const updateMessages = useCallback(
    (messages: Msg[]) => {
      setConversations((prev) => {
        if (activeId) {
          const updated = prev.map((c) =>
            c.id === activeId
              ? { ...c, messages, title: generateTitle(messages), updatedAt: Date.now() }
              : c
          );
          saveConversations(updated);
          return updated;
        }
        // Create new conversation
        const id = crypto.randomUUID();
        const convo: Conversation = {
          id,
          title: generateTitle(messages),
          messages,
          updatedAt: Date.now(),
        };
        const updated = [convo, ...prev];
        saveConversations(updated);
        setActiveId(id);
        return updated;
      });
    },
    [activeId]
  );

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        saveConversations(updated);
        if (activeId === id) setActiveId(null);
        return updated;
      });
    },
    [activeId]
  );

  return {
    conversations,
    activeConversation,
    activeId,
    newChat,
    updateMessages,
    selectConversation,
    deleteConversation,
  };
}
