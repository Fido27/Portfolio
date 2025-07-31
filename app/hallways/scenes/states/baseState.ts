import * as Phaser from 'phaser';

export interface GameStateData {
  matrixInput?: any;
  greenCircle?: Phaser.GameObjects.Arc;
  arrows?: { [key: string]: Phaser.GameObjects.Image };
  sandboxContainer?: Phaser.GameObjects.Container;
  questionPrompt?: Phaser.GameObjects.Text;
  aLabel?: Phaser.GameObjects.Text;
  bLabel?: Phaser.GameObjects.Text;
  aVector?: Phaser.GameObjects.Group;
  bVector?: Phaser.GameObjects.Group;
  peopleCellText?: Phaser.GameObjects.Text;
  selectedStart: string | null;
  selectedDest: string | null;
  peopleValue: string;
  inputMatrixEnabled: boolean;
  arrowsEnabled: boolean;
  isPlaying: boolean;
}

export abstract class BaseState {
  protected scene: Phaser.Scene;
  protected data: GameStateData;

  constructor(scene: Phaser.Scene, data: GameStateData) {
    this.scene = scene;
    this.data = data;
  }

  abstract enter(): void;
  abstract exit(): void;
  abstract update(): void;

  protected resetState() {
    // Reset all matrix input values to 0
    if (this.data.matrixInput) {
      for (let row = 0; row < this.data.matrixInput.cells.length; row++) {
        for (let col = 0; col < this.data.matrixInput.cells[row].length; col++) {
          this.data.matrixInput.setValue(row, col, '0');
        }
      }
    }

    // Reset green circle position
    if (this.data.greenCircle) {
      const nodeCoords = {
        'A': { x: 240, y: 560 },
        'B': { x: 240, y: 240 },
        'C': { x: 560, y: 240 },
        'D': { x: 560, y: 560 }
      };
      
      let target = { x: 240, y: 560 };
      if (this.data.selectedStart && nodeCoords[this.data.selectedStart as keyof typeof nodeCoords]) {
        target = nodeCoords[this.data.selectedStart as keyof typeof nodeCoords];
      }
      this.data.greenCircle.setPosition(target.x, target.y);
    }
  }

  protected setMatrixInputInteractivity(enabled: boolean) {
    if (this.data.matrixInput) {
      for (let row = 0; row < this.data.matrixInput.cells.length; row++) {
        for (let col = 0; col < this.data.matrixInput.cells[row].length; col++) {
          if (enabled) {
            this.data.matrixInput.cells[row][col].rect.setInteractive({ useHandCursor: true });
          } else {
            this.data.matrixInput.cells[row][col].rect.disableInteractive();
          }
        }
      }
    }
  }

  protected setArrowsInteractivity(enabled: boolean) {
    if (this.data.arrows) {
      Object.values(this.data.arrows).forEach(arrow => {
        if (enabled) {
          arrow.setInteractive({ useHandCursor: true });
        } else {
          arrow.disableInteractive();
        }
      });
    }
  }
} 