import * as Phaser from 'phaser';
import { GameState, SharedData } from './types';
import { Level1State, Level2State, Level3State, SandboxState, Level4State, Level5State, Level6State, Level7State, Level8State } from './states';

export class StateManager {
  private currentState: GameState | null = null;
  private states: Map<number, GameState> = new Map();
  private currentId: number | null = null;

  constructor(private scene: Phaser.Scene, private data: SharedData) {
    this.states.set(0, new SandboxState(scene, data));
    this.states.set(1, new Level1State(scene, data));
    this.states.set(2, new Level2State(scene, data));
    this.states.set(3, new Level3State(scene, data));
    this.states.set(4, new Level4State(scene, data));
    this.states.set(5, new Level5State(scene, data));
    this.states.set(6, new Level6State(scene, data));
    this.states.set(7, new Level7State(scene, data));
    this.states.set(8, new Level8State(scene, data));
  }

  change(stateId: number) {
    if (this.currentState) this.currentState.exit();
    const next = this.states.get(stateId);
    if (next) {
      this.currentState = next;
      this.currentId = stateId;
      this.currentState.enter();
      // Update or create the level title label at the top (non-bold)
      const levelName = this.getLevelName(stateId);
      const width = (this.scene.scale?.width || 1750);
      if (!this.data.levelTitleText) {
        this.data.levelTitleText = this.scene.add.text(width / 2, 10, levelName, { font: '88px Arial', color: '#000' }).setOrigin(0.5, 0);
        (this.data.levelTitleText as any).setDepth?.(3000);
      } else {
        this.data.levelTitleText.setText(levelName);
        this.data.levelTitleText.setPosition(width / 2, 10);
        this.data.levelTitleText.setFontSize(88);
        this.data.levelTitleText.setVisible(true);
      }
    }
  }

  getCurrent() { return this.currentState; }
  getCurrentId() { return this.currentId; }

  private getLevelName(id: number): string {
    switch (id) {
      case 0: return 'Sandbox';
      case 1: return 'Level 1';
      case 2: return 'Level 2';
      case 3: return 'Level 3';
      case 4: return 'Level 4';
      case 5: return 'Level 5';
      case 6: return 'Level 6';
      case 7: return 'Level 7';
      case 8: return 'Level 8';
      default: return 'Level';
    }
  }
}


