import * as Phaser from 'phaser';
import { BaseState, GameStateData } from './baseState';

export class PartAState extends BaseState {
  constructor(scene: Phaser.Scene, sharedData: GameStateData) {
    super(scene, sharedData);
  }

  enter(): void {
    this.showQuestionUI();
    this.setMatrixInputInteractivity(false);
    this.setArrowsInteractivity(true);
    this.resetState();
  }

  exit(): void {
    this.hideQuestionUI();
  }

  update(): void {
    // Part A state doesn't need continuous updates
  }

  private showQuestionUI(): void {
    if (this.data.questionPrompt) {
      this.data.questionPrompt.setVisible(true);
    }
    if (this.data.aLabel) {
      this.data.aLabel.setVisible(true);
    }
    if (this.data.aVector) {
      this.data.aVector.setVisible(true);
    }
  }

  private hideQuestionUI(): void {
    if (this.data.questionPrompt) {
      this.data.questionPrompt.setVisible(false);
    }
    if (this.data.aLabel) {
      this.data.aLabel.setVisible(false);
    }
    if (this.data.aVector) {
      this.data.aVector.setVisible(false);
    }
  }

  public validateMatrix(): boolean {
    if (!this.data.matrixInput) return false;
    
    const vals = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      vals[i] = parseInt(this.data.matrixInput.getValue(i, 0) || '0') || 0;
    }
    
    return vals[0] === 3 && vals[1] === 3 && vals[2] === 3 && vals[3] === 0 && vals[4] === 3;
  }
} 