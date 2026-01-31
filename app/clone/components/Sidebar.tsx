import React from "react";
import { cn } from "@/lib/utils/cn";
import { PERSONAS } from "../personas";

export function Sidebar(props: {
  currentUser: string;
  onChangePersona: (personaId: string) => void;
}) {
  const { currentUser, onChangePersona } = props;

  return (
    <aside className="border-r border-white/10 p-3 sm:p-4 flex flex-col min-h-0 overflow-hidden">
      {/* User greeting */}
      <div className="text-left text-base font-semibold px-3 py-2 rounded-md bg-white/10">
        {`Hi, ${currentUser}`}
      </div>

      {/* Personas */}
      <div className="text-xs text-white/50 mt-4">Personas</div>
      <div className="mt-2 space-y-1 overflow-auto pr-1">
        {PERSONAS.map((p) => (
          <button
            key={p.id}
            onClick={() => onChangePersona(p.id)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md transition-colors border border-transparent",
              "hover:bg-white/10"
            )}
          >
            <div className="text-sm">{p.name}</div>
            <div className="text-[10px] text-white/50">{p.description}</div>
          </button>
        ))}
      </div>
    </aside>
  );
}
