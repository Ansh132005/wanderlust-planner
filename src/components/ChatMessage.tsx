import { Plane, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Msg } from "@/lib/streamChat";

interface ChatMessageProps {
  message: Msg;
}

const ChatMessage = ({ message }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md whitespace-pre-wrap"
            : "bg-card text-card-foreground border border-border rounded-bl-md shadow-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-headings:text-card-foreground"
        }`}
      >
        {isUser ? message.content : <ReactMarkdown>{message.content}</ReactMarkdown>}
      </div>
    </div>
  );
};

export default ChatMessage;
