import * as Phaser from 'phaser';
import { BaseState, GameStateData } from './baseState';

export class PartBState extends BaseState {
  constructor(scene: Phaser.Scene, sharedData: GameStateData) {
    super(scene, sharedData);
  }

  enter(): void {
    this.showQuestionUI();
    this.setMatrixInputInteractivity(false);
    this.setArrowsInteractivity(true);
  }

  exit(): void {
    this.hideQuestionUI();
  }

  update(): void {
    // Part B state doesn't need continuous updates
  }

  private showQuestionUI(): void {
    if (this.data.questionPrompt) {
      this.data.questionPrompt.setVisible(true);
    }
    if (this.data.aLabel) {
      this.data.aLabel.setVisible(true);
    }
    if (this.data.bLabel) {
      this.data.bLabel.setVisible(true);
    }
    if (this.data.aVector) {
      this.data.aVector.setVisible(true);
    }
    if (this.data.bVector) {
      this.data.bVector.setVisible(true);
    }
  }

  private hideQuestionUI(): void {
    if (this.data.questionPrompt) {
      this.data.questionPrompt.setVisible(false);
    }
    if (this.data.aLabel) {
      this.data.aLabel.setVisible(false);
    }
    if (this.data.bLabel) {
      this.data.bLabel.setVisible(false);
    }
    if (this.data.aVector) {
      this.data.aVector.setVisible(false);
    }
    if (this.data.bVector) {
      this.data.bVector.setVisible(false);
    }
  }

  public validateMatrix(): boolean {
    if (!this.data.matrixInput) return false;
    
    const vals = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      vals[i] = parseInt(this.data.matrixInput.getValue(i, 0) || '0') || 0;
    }
    
    return vals[0] === 5 && vals[1] === 5 && vals[2] === 3 && vals[3] === 2 && vals[4] === 3;
  }
} 