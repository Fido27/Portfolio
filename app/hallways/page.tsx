'use client';
import dynamic from 'next/dynamic';

const HallwaysGame = dynamic(() => import('./game').then(m => m.default), { ssr: false });

export default function GamePage() {
  return (
    <main className="flex items-center justify-center w-full h-100vh h-full p-4 bg-center bg-cover bg-[url('/Background/coral_red.jpg')] before:content-[''] before:absolute before:inset-0">
      <div className="rounded-lg shadow-lg overflow-hidden">
        <HallwaysGame />
      </div>
    </main>
  );
}
