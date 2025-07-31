import * as Phaser from 'phaser';
import { SandboxState } from './states/sandboxState';
import { PartAState } from './states/partAState';
import { PartBState } from './states/partBState';
import { FinalState } from './states/finalState';
import { GameStateData } from './states/baseState';

export interface GameState {
  enter(): void;
  exit(): void;
  update(): void;
}

export class GameStateManager {
  private currentState: GameState | null = null;
  private states: Map<number, GameState> = new Map();
  private scene: Phaser.Scene;
  private sharedData: GameStateData;

  constructor(scene: Phaser.Scene, sharedData: GameStateData) {
    this.scene = scene;
    this.sharedData = sharedData;
    this.initializeStates();
  }

  private initializeStates() {
    this.states.set(0, new SandboxState(this.scene, this.sharedData));
    this.states.set(1, new PartAState(this.scene, this.sharedData));
    this.states.set(2, new PartBState(this.scene, this.sharedData));
    this.states.set(3, new FinalState(this.scene, this.sharedData));
  }

  public changeState(stateId: number) {
    if (this.currentState) {
      this.currentState.exit();
    }
    
    const newState = this.states.get(stateId);
    if (newState) {
      this.currentState = newState;
      this.currentState.enter();
    }
  }

  public getCurrentState(): GameState | null {
    return this.currentState;
  }

  public getState(stateId: number): GameState | undefined {
    return this.states.get(stateId);
  }

  public getSharedData(): GameStateData {
    return this.sharedData;
  }
} 