/**
 * useCloneChat hook - WebSocket-based chat with streaming support
 *
 * Features:
 * - Real-time WebSocket connection to backend
 * - Streaming responses (text appears as it's generated)
 * - Handles proactive agent messages
 * - Chat history resets on page reload (no persistence)
 */

import { useState, useRef, useEffect, useCallback } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
  isStreaming?: boolean; // True while response is being streamed
};

type WebSocketMessage = {
  type: "connected" | "start" | "delta" | "done" | "response" | "proactive" | "error" | "pong";
  content?: string;
  delta?: string;
  id?: string;
  ts?: number;
  message?: string;
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/clone/ws";

export function useCloneChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [composer, setComposer] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingMessageRef = useRef<string | null>(null);

  // Auto-resize composer
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 288);
    el.style.height = next + "px";
  }, [composer]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);

      switch (data.type) {
        case "connected":
          console.log("💬 Connected to chat");
          setIsConnected(true);
          break;

        case "start":
          // Response is starting - create placeholder message
          if (data.id) {
            streamingMessageRef.current = data.id;
            setMessages((prev) => [
              ...prev,
              {
                id: data.id!,
                role: "assistant" as const,
                content: "",
                ts: data.ts || Date.now(),
                isStreaming: true,
              },
            ]);
          }
          break;

        case "delta":
          // Append delta to current streaming message
          if (data.delta && data.id) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? { ...msg, content: msg.content + data.delta }
                  : msg
              )
            );
          }
          break;

        case "done":
          // Response complete - finalize message
          if (data.id) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === data.id
                  ? {
                    ...msg,
                    content: data.content || msg.content,
                    isStreaming: false
                  }
                  : msg
              )
            );
            streamingMessageRef.current = null;
          }
          setIsWaiting(false);
          break;

        case "response":
          // Non-streaming response (fallback)
          if (data.content) {
            const content = data.content;
            setMessages((prev) => [
              ...prev,
              {
                id: data.id || makeId(),
                role: "assistant" as const,
                content: content,
                ts: data.ts || Date.now(),
              },
            ]);
          }
          setIsWaiting(false);
          break;

        case "proactive":
          // Agent-initiated message
          if (data.content) {
            const content = data.content;
            setMessages((prev) => [
              ...prev,
              {
                id: data.id || makeId(),
                role: "assistant" as const,
                content: content,
                ts: data.ts || Date.now(),
              },
            ]);
          }
          break;

        case "error":
          console.error("Chat error:", data.message);
          setIsWaiting(false);
          // Remove any incomplete streaming message
          if (streamingMessageRef.current) {
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== streamingMessageRef.current)
            );
            streamingMessageRef.current = null;
          }
          break;

        case "pong":
          break;
      }
    } catch (e) {
      console.error("Failed to parse WebSocket message:", e);
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    console.log("🔌 Connecting to chat...");
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setIsConnected(true);
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
      setIsConnected(false);
      wsRef.current = null;
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Reconnecting...");
        connect();
      }, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  }, [handleMessage]);

  // Initialize WebSocket
  useEffect(() => {
    connect();

    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Send a message
  function onSend() {
    if (!composer.trim()) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    const text = composer.trim();
    setComposer("");

    // Add user message
    const userMsg: Message = {
      id: makeId(),
      role: "user",
      content: text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsWaiting(true);

    // Send to backend
    wsRef.current.send(
      JSON.stringify({
        type: "message",
        content: text,
      })
    );
  }

  return {
    username: "Aarav",
    messages,
    composer,
    composerRef,
    scrollRef,
    setComposer,
    onSend,
    isConnected,
    isWaiting,
    changePersona: () => { },
  };
}
