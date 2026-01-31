import React from "react";

export function RightBanner() {
  return (
    <aside className="relative hidden md:block overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="font-bold text-white/10 whitespace-nowrap select-none rotate-90 text-4xl lg:text-6xl xl:text-7xl m-0 p-0 leading-none tracking-tight">
          Fido
        </div>
      </div>
    </aside>
  );
}

