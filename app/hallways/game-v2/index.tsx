'use client';

import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { GameScene } from './core/GameScene';
import { GAME_WIDTH, GAME_HEIGHT } from './config/constants';

export default function HallwaysGameV2() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: '#ffffff',
      parent: containerRef.current,
      scene: [GameScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[700px]"
      style={{ maxWidth: GAME_WIDTH }}
    />
  );
}
