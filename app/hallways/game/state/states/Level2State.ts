import * as Phaser from 'phaser';
import { GameState, SharedData } from '../types';

export class Level2State implements GameState {
  private prompt?: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    this.showPrompt();
    this.setMatrixEnabled(false);
    this.enableArrows(true);
    this.resetPositionToStart();
    // Level 2: start with 5 in each room
    this.data.roomCounts = { A: 5, B: 5, C: 5, D: 5 };
    const sceneAny = this.scene as any;
    if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') {
      (['A','B','C','D'] as ('A'|'B'|'C'|'D')[]).forEach(l => sceneAny['__layoutRoomDots'](l, this.data.roomCounts?.[l] || 0));
    }
    // Keep labels C1-C5 visible; hide matrix brackets
    if ((this.data as any).matrixFrame) (this.data as any).matrixFrame.setVisible(false);
    if ((this.data as any).matrixLabels) ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(true));
    // Update occupancy vector on the scene
    if (typeof sceneAny.updateOccupancyVector === 'function') sceneAny.updateOccupancyVector();
  }

  exit(): void {
    this.prompt?.destroy();
  }

  update(): void {}

  private setMatrixEnabled(enabled: boolean) {
    const input = this.data.matrixInput;
    if (!input) return;
    for (let r = 0; r < input.cells.length; r++) {
      for (let c = 0; c < input.cells[r].length; c++) {
        if (enabled) input.cells[r][c].rect.setInteractive({ useHandCursor: true });
        else input.cells[r][c].rect.disableInteractive();
      }
    }
  }

  private enableArrows(enabled: boolean) {
    const arrowObjects = Object.values(this.data.arrows || {}) as Phaser.GameObjects.GameObject[];
    arrowObjects.forEach((obj) => {
      if (enabled) (obj as any).setInteractive({ useHandCursor: true }); else (obj as any).disableInteractive();
    });
  }

  private resetPositionToStart() {
    if (!this.data.greenCircle) return;
    const coords = this.data.nodeCoords || {
      A: { x: 240, y: 560 },
      B: { x: 240, y: 240 },
      C: { x: 560, y: 240 },
      D: { x: 560, y: 560 }
    };
    const start = (coords as any)['A'];
    this.data.greenCircle.setPosition(start.x, start.y);
    if (this.data.greenCircleText) this.data.greenCircleText.setPosition(start.x, start.y);
    this.data.currentNode = 'A';
  }

  private showPrompt() {
    const promptText = 'Level 2:\n\nClick the red arrows to move the green circle. every time the circle crosses a security camera, the camera increments its counter. \n\nCan you trace a path that matches the counters below:\n\nC1 : 5\nC2 : 5\nC3 : 5\nC4 : 2\nC5 : 3';
    this.prompt = this.scene.add.text(1100, 120, promptText,
      { font: '28px Arial', color: '#222', wordWrap: { width: 500 } }
    );
  }
}


