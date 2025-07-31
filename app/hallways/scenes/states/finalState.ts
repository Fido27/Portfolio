import * as Phaser from 'phaser';
import { BaseState, GameStateData } from './baseState';

export class FinalState extends BaseState {
  private newPrompt?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, sharedData: GameStateData) {
    super(scene, sharedData);
  }

  enter(): void {
    this.showFinalPrompt();
    this.setMatrixInputInteractivity(true);
    this.setArrowsInteractivity(true);
    this.resetState();
    this.setStartPositionB();
  }

  private setStartPositionB(): void {
    if (this.data.greenCircle) {
      // Set green circle to position B (240, 240)
      this.data.greenCircle.setPosition(240, 240);
    }
    // Update the selected start to B
    this.data.selectedStart = 'B';
  }

  exit(): void {
    if (this.newPrompt) {
      this.newPrompt.destroy();
    }
  }

  update(): void {
    // Final state doesn't need continuous updates
  }

  private showFinalPrompt(): void {
    // Hide all previous question UI
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

    // Show new prompt
    this.newPrompt = this.scene.add.text(1100, 120, 'Describe a vector for the following situation: Ella starts her journey from the Biology Lab, calls a friend from the Civics classroom, and together they go to their next class in the Drama Theatre. After the Drama class, they pick up three more friends from the Biology Lab, and all five of them head to the Art Room.', {
      font: '24px Arial', 
      color: '#222', 
      wordWrap: { width: 500 }
    });
  }
} 