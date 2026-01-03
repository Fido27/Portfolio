import React from "react";
import { cn } from "@/lib/utils/cn";
import { PERSONAS, type ChatSession } from "../personas";

export function Sidebar(props: {
  currentUser: string | null;
  onHiUserClick: () => void;
  sessions: ChatSession[];
  activeId: string | null;
  activeSession: ChatSession | null;
  onChangePersona: (personaId: string) => void;
  onCreateSession: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}) {
  const { currentUser, onHiUserClick, sessions, activeId, activeSession, onChangePersona, onCreateSession, onSelectSession, onDeleteSession } = props;

  return (
    <aside className="border-r border-white/10 p-3 sm:p-4 grid grid-rows-[1fr_1fr] gap-4 min-h-0 overflow-hidden">
      {/* Personas */}
      <div className="flex flex-col min-h-0">
        <button className="text-left text-base font-semibold px-3 py-2 rounded-md bg-white/10 hover:bg-white/15" onClick={onHiUserClick}>
          {`Hi, ${currentUser ?? "User"}`}
        </button>
        <div className="text-xs text-white/50 mt-3">Personas</div>
        <div className="mt-2 space-y-1 overflow-auto pr-1">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChangePersona(p.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md transition-colors border border-transparent",
                activeSession?.personaId === p.id ? "bg-white/15 border-white/15" : "hover:bg-white/10"
              )}
            >
              <div className="text-sm">{p.name}</div>
              <div className="text-[10px] text-white/50">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="flex flex-col min-h-0">
        <div className="flex items-center justify-between">
          <div className="font-semibold">History</div>
          <button className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/15" onClick={() => onCreateSession()}>
            New
          </button>
        </div>
        <div className="mt-2 space-y-1 overflow-auto pr-1">
          {sessions.length === 0 && <div className="text-sm text-white/50">No chats yet.</div>}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md transition-colors border border-transparent",
                s.id === activeId ? "bg-white/15 border-white/15" : "hover:bg-white/10"
              )}
              title={new Date(s.updatedAt).toLocaleString()}
            >
              <div className="text-sm truncate">{s.title || "Untitled"}</div>
              <div className="text-[10px] text-white/50">{PERSONAS.find((p) => p.id === s.personaId)?.name}</div>
            </button>
          ))}
        </div>
        {activeSession && (
          <button
            onClick={() => onDeleteSession(activeSession.id)}
            className="mt-2 text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-red-500/20 border border-red-500/20 text-red-300"
          >
            Delete current
          </button>
        )}
      </div>
    </aside>
  );
}

