import * as Phaser from 'phaser';
import { GameState, SharedData } from '../types';

export class Level3State implements GameState {
  private prompt?: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    this.showPrompt();
    this.setMatrixEnabled(false);
    this.enableArrows(true);
    // Level 3: start with 5 people in each room
    this.data.selectedStart = 'A';
    this.data.selectedDest = 'D';
    this.data.roomCounts = { A: 5, B: 5, C: 5, D: 5 };
    this.renderRoomDots();
    // Reset player position to start
    this.resetPositionToStart();
    // Update occupancy vector on the scene
    const sceneAny = this.scene as any;
    if (typeof sceneAny.updateOccupancyVector === 'function') sceneAny.updateOccupancyVector();

    // Keep labels C1-C5 visible; hide matrix brackets
    if ((this.data as any).matrixFrame) (this.data as any).matrixFrame.setVisible(false);
    if ((this.data as any).matrixLabels) ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(true));
  }

  exit(): void {
    this.prompt?.destroy();
  }

  update(): void {}

  // Exposed for scene-level reset
  public resetState(): void {
    // Reset matrix inputs
    const input = this.data.matrixInput;
    if (input) {
      for (let r = 0; r < input.cells.length; r++) {
        for (let c = 0; c < input.cells[r].length; c++) {
          input.setValue(r, c, '0');
        }
      }
    }

    // Reset position
    this.resetPositionToStart();

    // Re-render room dots
    this.renderRoomDots();

    // Refresh occupancy vector
    const sceneAny2 = this.scene as any;
    if (typeof sceneAny2.updateOccupancyVector === 'function') sceneAny2.updateOccupancyVector();
  }

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
    const promptText = 'Level 3:\n\nCan you help Ella and Jack reach the Drama Room from the Art room, using any path?\n\nNotice how the camera values change as they cross the camera paths in the hallways.';
    this.prompt = this.scene.add.text(1100, 120, promptText,
      { font: '28px Arial', color: '#222', wordWrap: { width: 500 } }
    );
  }

  private renderRoomDots() {
    const rooms: ('A'|'B'|'C'|'D')[] = ['A','B','C','D'];
    rooms.forEach(letter => {
      const count = this.data.roomCounts?.[letter] || 0;
      const sceneAny = this.scene as any;
      if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') {
        sceneAny['__layoutRoomDots'](letter, count);
      }
    });
  }

  // hallway badge removed in levels; no hallway mechanic
  private updateHallwayBadge() {}
}



