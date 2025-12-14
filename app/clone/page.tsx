"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { InputBox } from "@/lib/ui/multi-line-input";
import { cn } from "@/lib/utils/cn";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  ts: number;
};

type ChatSession = {
  id: string;
  title: string;
  personaId: string;
  messages: Message[];
  updatedAt: number;
};

type Persona = {
  id: string;
  name: string;
  description: string;
};

const PERSONAS: Persona[] = [
  { id: "aarav", name: "Aarav's Clone", description: "Friendly and concise – like your portfolio voice." },
  { id: "tutor", name: "Tutor Quiglim", description: "Explains with steps and examples." },
  { id: "random", name: "Choose for me", description: "Picks a tone for each reply." },
];

const STORAGE_KEY = "aarav_clone_sessions_v1";
const STORAGE_ACTIVE_KEY = "aarav_clone_active_session_v1";
const OPENROUTER_API_KEY = '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';
const N8N_WEBHOOK_URL = 'https://jainaarav.in/webhook/friday';

const makeId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

function resolveApiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_BASE as string | undefined) || "http://localhost:8000";
  if (/^https?:\/\//i.test(raw)) return raw;
  const withProto = `http://${raw}`;
  try {
    const url = new URL(withProto);
    const port = url.port || "8000";
    return `${url.protocol}//${url.hostname}:${port}`;
  } catch {
    return "http://localhost:8000";
  }
}
const API_BASE = resolveApiBase();

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: ChatSession[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function loadActiveId(): string | null {
  return localStorage.getItem(STORAGE_ACTIVE_KEY);
}

function saveActiveId(id: string) {
  localStorage.setItem(STORAGE_ACTIVE_KEY, id);
}

function titleFromFirstUserMessage(messages: Message[]): string {
  const first = messages.find((m) => m.role === "user");
  if (!first) return "New chat";
  const raw = first.content.trim().replace(/\s+/g, " ");
  return raw.length > 32 ? raw.slice(0, 29) + "…" : raw || "New chat";
}

function pickStyle(personaId: string): "friendly" | "tutor" | "poetic" {
  if (personaId === "aarav") return "friendly";
  if (personaId === "tutor") return "tutor";
  // random
  const pool: ("friendly" | "tutor" | "poetic")[] = ["friendly", "tutor", "poetic"];
  return pool[Math.floor(Math.random() * pool.length)];
}

function craftReply(userText: string, personaId: string): string {
  const style = pickStyle(personaId);
  if (style === "tutor") {
    return [
      "Let's break it down:",
      "1) What you asked: " + userText,
      "2) Key idea: I'll keep it actionable.",
      "3) Next step: tell me one constraint or example.",
    ].join("\n");
  }
  if (style === "poetic") {
    return `You said: "${userText}".\nA small spark becomes a plan. I can sketch, iterate, and ship. What nuance should I keep absolutely true?`;
  }
  return `Got it: "${userText}". I can help like your clone would—direct, kind, and pragmatic.`;
}

export default function ClonePage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composer, setComposer] = useState<string>("");
  const [thinking, setThinking] = useState<boolean>(false);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // bootstrap
  useEffect(() => {
    const s = loadSessions();
    let active = loadActiveId();
    if (!s.length) {
      const first: ChatSession = {
        id: makeId(),
        title: "New chat",
        personaId: PERSONAS[0].id,
        messages: [],
        updatedAt: Date.now(),
      };
      saveSessions([first]);
      saveActiveId(first.id);
      setSessions([first]);
      setActiveId(first.id);
    } else {
      setSessions(s);
      if (!active || !s.some((x) => x.id === active)) {
        active = s[0].id;
        saveActiveId(active);
      }
      setActiveId(active);
    }
  }, []);

  const activeSession = useMemo(() => sessions.find((s) => s.id === activeId) || null, [sessions, activeId]);

  // Debounced remote save when logged-in user present
  const saveTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (!currentUser) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await fetch(`${API_BASE}/clone/user/upsert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: currentUser, sessions, activeId }),
        });
      } catch (err) {
        // ignore for now; can add toast later
      }
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, activeId, currentUser]);

  function updateSession(next: ChatSession) {
    setSessions((prev) => {
      const updated = prev.map((s) => (s.id === next.id ? next : s));
      saveSessions(updated);
      return updated;
    });
  }

  function createSession() {
    const fresh: ChatSession = {
      id: makeId(),
      title: "New chat",
      personaId: PERSONAS[0].id,
      messages: [],
      updatedAt: Date.now(),
    };
    setSessions((prev) => {
      const updated = [fresh, ...prev];
      saveSessions(updated);
      return updated;
    });
    setActiveId(fresh.id);
    saveActiveId(fresh.id);
  }

  function changePersona(personaId: string) {
    if (!activeSession) return;
    updateSession({ ...activeSession, personaId, updatedAt: Date.now() });
  }

  async function handleHiUserClick() {
    const entered = window.prompt("Enter your username");
    const name = (entered ?? "").trim();
    if (!name) return;
    setCurrentUser(name);
    async function callBase(base: string, uname: string) {
      const res = await fetch(`${base}/clone/user/${encodeURIComponent(uname)}`);
      if (!res.ok) throw new Error(`GET failed ${res.status}`);
      const data = await res.json();
      if (data?.exists && data?.doc) {
        const remoteSessions: ChatSession[] = Array.isArray(data.doc.sessions) ? data.doc.sessions : [];
        const remoteActive: string | null = data.doc.activeId || null;
        if (remoteSessions.length) {
          setSessions(remoteSessions);
          saveSessions(remoteSessions);
          const nextActive = remoteActive ?? remoteSessions[0].id;
          setActiveId(nextActive);
          if (nextActive) saveActiveId(nextActive);
          return;
        }
      }
      // create or update with current local
      const up = await fetch(`${base}/clone/user/upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uname, sessions, activeId }),
      });
      if (!up.ok) throw new Error(`UPsert failed ${up.status}`);
    }
    try {
      await callBase(API_BASE, name);
    } catch (e) {
      // Fallback to typical FastAPI dev port if user pointed to frontend port
      if (!/8000$/.test(API_BASE)) {
        try { await callBase("http://localhost:8000", name); } catch (e) {
          console.warn("Backend not reachable at", API_BASE, "and localhost:8000", e);
        }
      }
    }
  }

  async function sendWebhook(command: string) {
    if (!command.trim()) return;
    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      if (!res.ok) {
        console.warn("n8n webhook returned non-OK status", res.status, await res.text());
      }
    } catch (err) {
      console.warn("n8n webhook request failed", err);
    }
  }

  function onSend() {
    const text = composer.trim();
    if (!text || !activeSession) return;
    setComposer("");
    const userMsg: Message = {
      id: makeId(),
      role: "user",
      content: text,
      ts: Date.now(),
    };
    const afterUser: ChatSession = {
      ...activeSession,
      title: activeSession.title === "New chat" ? titleFromFirstUserMessage([userMsg]) : activeSession.title,
      messages: [...activeSession.messages, userMsg],
      updatedAt: Date.now(),
    };
    updateSession(afterUser);
    setThinking(true);
    void sendWebhook(text);
    // Simulate AI reply locally
    setTimeout(() => {
      const reply: Message = {
        id: makeId(),
        role: "assistant",
        content: craftReply(text, afterUser.personaId),
        ts: Date.now(),
      };
      const done: ChatSession = {
        ...afterUser,
        messages: [...afterUser.messages, reply],
        updatedAt: Date.now(),
      };
      updateSession(done);
      setThinking(false);
    }, 500 + Math.random() * 500);
  }

  function removeSession(id: string) {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      saveSessions(filtered);
      if (activeId === id) {
        const next = filtered[0]?.id || null;
        setActiveId(next);
        if (next) saveActiveId(next); else localStorage.removeItem(STORAGE_ACTIVE_KEY);
      }
      return filtered;
    });
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeSession?.messages.length, thinking]);

  function resizeComposer() {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 288); // cap ~72
    el.style.height = next + "px";
  }
  useEffect(() => {
    resizeComposer();
  }, [composer]);

  return (
    <div className="h-dvh w-dvw overflow-hidden">
      {/* Main layout */}
      <div className="grid grid-cols-[280px_1fr_88px] md:grid-cols-[320px_1fr_104px] gap-0 h-dvh overflow-hidden">
        {/* Left sidebar: personas (top) + history (bottom) */}
        <aside className="border-r border-white/10 p-3 sm:p-4 grid grid-rows-[1fr_1fr] gap-4 min-h-0 overflow-hidden">
          {/* Personas */}
          <div className="flex flex-col min-h-0">
            <button
              className="text-left text-base font-semibold px-3 py-2 rounded-md bg-white/10 hover:bg-white/15"
              onClick={handleHiUserClick}
            >{`Hi, ${currentUser ?? "User"}`}</button>
            <div className="text-xs text-white/50 mt-3">Personas</div>
            <div className="mt-2 space-y-1 overflow-auto pr-1">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => changePersona(p.id)}
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
              <button
                className="text-xs px-2 py-1 rounded-md bg-white/10 hover:bg-white/15"
                onClick={createSession}
              >New</button>
            </div>
            <div className="mt-2 space-y-1 overflow-auto pr-1">
              {sessions.length === 0 && (
                <div className="text-sm text-white/50">No chats yet.</div>
              )}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setActiveId(s.id); saveActiveId(s.id); }}
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
                onClick={() => removeSession(activeSession.id)}
                className="mt-2 text-xs px-2 py-1 rounded-md bg-white/5 hover:bg-red-500/20 border border-red-500/20 text-red-300"
              >Delete current</button>
            )}
          </div>
        </aside>

        {/* Center: chat feed */}
        <section className="relative flex flex-col min-h-0 overflow-hidden">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-auto px-4 sm:px-8 py-6 space-y-4 min-h-0">
            {activeSession?.messages.length ? (
              activeSession.messages.map((m) => (
                <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}> 
                  <div className={cn(
                    "inline-block max-w-3xl rounded-xl px-4 py-3 whitespace-pre-wrap break-words",
                    m.role === "user" ? "bg-blue-600/30 border border-blue-400/20" : "bg-white/5 border border-white/10"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full grid place-content-center text-center text-white/50">
                <div className="text-lg">Tell me something and I will answer like your clone.</div>
                <div className="text-xs mt-2">Persona: {PERSONAS.find((p) => p.id === (activeSession?.personaId || PERSONAS[0].id))?.name}</div>
              </div>
            )}
            {thinking && (
              <div className="mr-auto max-w-3xl">
                <div className="rounded-xl px-4 py-3 bg-white/5 border border-white/10 text-white/60">Thinking …</div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-white/10">
            <div className="p-3 sm:p-4 max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <InputBox
                    ref={composerRef}
                    className="min-h-16 h-auto max-h-72 overflow-y-auto resize-none"
                    placeholder="Talk to me…"
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onInput={resizeComposer}
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSend();
                    }}
                  />
                </div>
                <button
                  onClick={onSend}
                  disabled={!composer.trim() || thinking}
                  className={cn("h-10 px-4 rounded-lg border bg-white/10 border-white/15 hover:bg-white/20 transition", (!composer.trim() || thinking) && "opacity-50 cursor-not-allowed")}
                >Send</button>
              </div>
              <div className="text-[10px] text-white/40 mt-1">Press ⌘/Ctrl + Enter to send</div>
            </div>
          </div>
        </section>

        {/* Right banner */}
        <aside className="relative hidden md:block overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="font-bold text-white/10 whitespace-nowrap select-none rotate-90 text-4xl lg:text-6xl xl:text-7xl m-0 p-0 leading-none tracking-tight">Aarav's Clone</div>
          </div>
        </aside>
      </div>
    </div>
  );
}