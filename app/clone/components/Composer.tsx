import React from "react";
import { InputBox } from "@/lib/ui/multi-line-input";
import { cn } from "@/lib/utils/cn";

export function Composer(props: {
  composer: string;
  thinking: boolean;
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
  onChange: (next: string) => void;
  onSend: () => void;
  onInput: () => void;
}) {
  const { composer, thinking, composerRef, onChange, onSend, onInput } = props;

  return (
    <div className="border-t border-white/10">
      <div className="p-3 sm:p-4 max-w-4xl mx-auto">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <InputBox
              ref={composerRef}
              className="min-h-16 h-auto max-h-72 overflow-y-auto resize-none"
              placeholder="Talk to me…"
              value={composer}
              onChange={(e) => onChange(e.target.value)}
              onInput={onInput}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSend();
              }}
            />
          </div>
          <button
            onClick={() => onSend()}
            disabled={!composer.trim() || thinking}
            className={cn(
              "h-10 px-4 rounded-lg border bg-white/10 border-white/15 hover:bg-white/20 transition",
              (!composer.trim() || thinking) && "opacity-50 cursor-not-allowed"
            )}
          >
            Send
          </button>
        </div>
        <div className="text-[10px] text-white/40 mt-1">Press ⌘/Ctrl + Enter to send</div>
      </div>
    </div>
  );
}

