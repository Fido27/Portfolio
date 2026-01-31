"use client";

import React from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatFeed } from "./components/ChatFeed";
import { Composer } from "./components/Composer";
import { RightBanner } from "./components/RightBanner";
import { useCloneChat } from "./useCloneChat";

export default function ClonePage() {
  const chat = useCloneChat();

  return (
    <div className="h-dvh w-dvw overflow-hidden">
      {/* Main layout */}
      <div className="grid grid-cols-[280px_1fr_88px] md:grid-cols-[320px_1fr_104px] gap-0 h-dvh overflow-hidden">
        {/* Left sidebar: personas only */}
        <Sidebar
          currentUser={chat.username}
          onChangePersona={chat.changePersona}
        />

        {/* Center: chat feed */}
        <section className="relative flex flex-col min-h-0 overflow-hidden">
          {/* Messages */}
          <ChatFeed messages={chat.messages} scrollRef={chat.scrollRef} />

          {/* Composer */}
          <Composer
            composer={chat.composer}
            composerRef={chat.composerRef}
            onChange={chat.setComposer}
            onSend={chat.onSend}
          />
        </section>

        {/* Right banner */}
        <RightBanner />
      </div>
    </div>
  );
}