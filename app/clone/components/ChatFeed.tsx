import React from "react";
import { cn } from "@/lib/utils/cn";
import { Markdown } from "../Markdown";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
};

export function ChatFeed(props: {
  messages: Message[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { messages, scrollRef } = props;

  return (
    <div ref={scrollRef} className="flex-1 overflow-auto px-4 sm:px-8 py-6 space-y-4 min-h-0">
      {messages.length > 0 ? (
        messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "inline-block max-w-3xl rounded-xl px-4 py-3 break-words",
                m.role === "user" ? "bg-blue-600/30 border border-blue-400/20" : "bg-white/5 border border-white/10"
              )}
            >
              {m.role === "assistant" ? (
                <Markdown content={m.content} />
              ) : (
                <div className="whitespace-pre-wrap">{m.content}</div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="h-full grid place-content-center text-center text-white/50">
          <div className="text-lg">Tell me something and I will answer like your clone.</div>
        </div>
      )}
    </div>
  );
}
