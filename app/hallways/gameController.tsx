'use client';
import { useEffect, useRef } from 'react';
import * as Phaser from 'phaser';
import { HallwaysScene } from './scenes/hallwaysGame';
import { MainMenuScene } from './scenes/mainMenu';
// @ts-ignore
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';

export default function HallwaysGame() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 1750,
      height: 1000,
      backgroundColor: '#ffffff',
      parent: containerRef.current,
      dom: {
        createContainer: true
      },
      scene: [ MainMenuScene,HallwaysScene ],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      plugins: {
        scene: [
          { key: 'rexInputText', plugin: InputText, mapping: 'rexInputText' }
        ]
      }
    };

    const game = new Phaser.Game(config);
    return () => { game.destroy(true); };
  }, []);

  return <div ref={containerRef} className="w-full h-[700px]" />;
}
