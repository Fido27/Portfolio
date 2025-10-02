import * as Phaser from 'phaser';
import { GameState, SharedData } from './types';
import { Level1State, Level2State, Level3State, SandboxState, Level4State, Level5State, Level6State } from './states';

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


