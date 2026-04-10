import { useState, useRef, useEffect, useMemo } from "react";
import { Plane, Globe, Cloud, Hotel } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import WeatherWidget from "@/components/WeatherWidget";
import ConversationSidebar from "@/components/ConversationSidebar";
import { streamChat, type Msg } from "@/lib/streamChat";
import { extractDestination } from "@/lib/weatherApi";
import { useConversations } from "@/hooks/useConversations";
import { useToast } from "@/hooks/use-toast";

const SUGGESTIONS = [
  { icon: Plane, text: "Find cheap flights from NYC to Tokyo in March" },
  { icon: Hotel, text: "Best hotels in Bali under $100/night" },
  { icon: Cloud, text: "What's the weather like in Paris next week?" },
  { icon: Globe, text: "Plan a 5-day trip to Barcelona" },
];

const Index = () => {
  const {
    conversations,
    activeConversation,
    activeId,
    newChat,
    updateMessages,
    selectConversation,
    deleteConversation,
  } = useConversations();

  const messages = activeConversation?.messages ?? [];
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const currentDestination = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        const dest = extractDestination(messages[i].content);
        if (dest) return dest;
      }
    }
    return null;
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (input: string) => {
    const userMsg: Msg = { role: "user", content: input };
    const updated = [...messages, userMsg];
    updateMessages(updated);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      const withAssistant = [...updated];
      const last = withAssistant[withAssistant.length - 1];
      if (last?.role === "assistant") {
        withAssistant[withAssistant.length - 1] = { ...last, content: assistantSoFar };
      } else {
        withAssistant.push({ role: "assistant", content: assistantSoFar });
      }
      updateMessages(withAssistant);
    };

    try {
      await streamChat({
        messages: updated,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <ConversationSidebar
        conversations={conversations}
        activeId={activeId}
        onNew={newChat}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-border bg-card">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">TravelMate AI</h1>
            <p className="text-xs text-muted-foreground">Flights · Hotels · Weather · Trip Planning</p>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold mb-1">Where to next?</h2>
                <p className="text-sm text-muted-foreground">Ask me about flights, hotels, weather, or trip ideas</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="flex items-center gap-2 text-left rounded-xl border border-border bg-card px-4 py-3 text-sm hover:bg-muted transition-colors"
                  >
                    <s.icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => <ChatMessage key={i} message={m} />)
          )}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                <Plane className="w-4 h-4" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Weather Widget */}
        {currentDestination && messages.length > 0 && (
          <div className="px-4 pb-2">
            <WeatherWidget destination={currentDestination} />
          </div>
        )}

        {/* Input */}
        <ChatInput onSend={send} disabled={isLoading} />
      </div>
    </div>
  );
};

export default Index;
