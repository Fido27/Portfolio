import * as Phaser from 'phaser';
import { GameState, SharedData } from './types';
import { Level1State } from './states/Level1State';
import { Level2State } from './states/Level2State';

export class StateManager {
  private currentState: GameState | null = null;
  private states: Map<number, GameState> = new Map();
  private currentId: number | null = null;

  constructor(private scene: Phaser.Scene, private data: SharedData) {
    this.states.set(1, new Level1State(scene, data));
    this.states.set(2, new Level2State(scene, data));
  }

  change(stateId: number) {
    if (this.currentState) this.currentState.exit();
    const next = this.states.get(stateId);
    if (next) {
      this.currentState = next;
      this.currentId = stateId;
      this.currentState.enter();
    }
  }

  getCurrent() { return this.currentState; }
  getCurrentId() { return this.currentId; }
}


