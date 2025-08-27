import * as Phaser from 'phaser';
import { GameState, SharedData } from '../types';

// Game State 1 (post-sandbox):
// - Locks the input matrix and uses arrow-only traversal
// - Presents target camera vector [3,3,3,0,3]
// - Validate button not present; user progresses by clicking Next in outer UI

export class Level1State implements GameState {
  private prompt?: Phaser.GameObjects.Text;
  private vectorGroup?: Phaser.GameObjects.Group;

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    this.showPrompt();
    this.setMatrixEnabled(false);
    this.enableArrows(true);
    this.resetPositionToStart();
    // Initialize room populations to 5 each
    this.data.roomCounts = { A: 4, B: 5, C: 5, D: 5 };
    // Draw dots for each room to reflect populations
    this.renderRoomDots();
    // Initialize hallway people and update badge
    this.data.hallwayCount = parseInt(this.data.peopleValue || '1') || 1;
    this.updateHallwayBadge();

    // Level-specific UI: hide matrix brackets, show labels C1-C5
    if ((this.data as any).matrixFrame) {
      (this.data as any).matrixFrame.setVisible(false);
    }
    if ((this.data as any).matrixLabels) {
      ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(true));
    }
  }

  exit(): void {
    this.prompt?.destroy();
    this.vectorGroup?.clear(true, true);
    // Restore matrix frame/labels when leaving the level
    if ((this.data as any).matrixFrame) {
      (this.data as any).matrixFrame.setVisible(true);
    }
    if ((this.data as any).matrixLabels) {
      ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(false));
    }
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
    const start = coords['A'];
    this.data.greenCircle.setPosition(start.x, start.y);
    if (this.data.greenCircleText) this.data.greenCircleText.setPosition(start.x, start.y);
    this.data.currentNode = 'A';
  }

  private showPrompt() {
    const promptText = 'Level 1:\n\nClick the red arrows to move the green circle. every time the circle crosses a security camera, the camera increments its counter. \n\nCan you trace a path that matches the counters below:\n\nC1 : 3\nC2 : 3\nC3 : 3\nC4 : 0\nC5 : 3';
    this.prompt = this.scene.add.text(1100, 120, promptText,
      { font: '28px Arial', color: '#222', wordWrap: { width: 500 } }
    );
    // Intentionally do not render the bracketed matrix for introductory level
  }

  private renderRoomDots() {
    const rooms: ('A'|'B'|'C'|'D')[] = ['A','B','C','D'];
    rooms.forEach(letter => {
      const count = this.data.roomCounts?.[letter] || 0;
      // access helper from scene
      const sceneAny = this.scene as any;
      if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') {
        sceneAny['__layoutRoomDots'](letter, count);
      }
    });
  }

  private updateHallwayBadge() {
    const count = this.data.hallwayCount || 0;
    if (!this.data.greenCircleText) return;
    if (count > 1) {
      this.data.greenCircleText.setText(String(count));
      this.data.greenCircleText.setVisible(true);
    } else {
      this.data.greenCircleText.setText('');
      this.data.greenCircleText.setVisible(false);
    }
  }

  private drawVectorDisplay(values: (string|number)[]) {
    const group = this.scene.add.group();
    const x = 1160, y = 300, cellSize = 40, spacing = 10;
    const rows = values.length;
    const g = this.scene.add.graphics();
    const extraHeight = 30;
    const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
    const bracketYOffset = -extraHeight / 2; const bracketWidth = 20; const overlap = 4;
    g.lineStyle(8, 0x000000);
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y + bracketYOffset, x - bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketYOffset, x, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketHeight + bracketYOffset, x, y + bracketHeight + bracketYOffset));
    const rightX = x + cellSize;
    g.strokeLineShape(new Phaser.Geom.Line(rightX + bracketWidth, y + bracketYOffset, rightX + bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketYOffset, rightX + bracketWidth + overlap, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketHeight + bracketYOffset, rightX + bracketWidth + overlap, y + bracketHeight + bracketYOffset));
    group.add(g);
    for (let row = 0; row < rows; row++) {
      const cellY = y + row * (cellSize + spacing);
      const txt = this.scene.add.text(x + cellSize/2, cellY + cellSize/2, String(values[row]), { font: '24px Arial', color: '#000', align: 'center' }).setOrigin(0.5);
      group.add(txt);
    }
    return group;
  }

  // Exposed to allow scene-level reset button to invoke state reset
  public resetState(): void {
    // Reset all matrix input values to 0
    const input = this.data.matrixInput;
    if (input) {
      for (let r = 0; r < input.cells.length; r++) {
        for (let c = 0; c < input.cells[r].length; c++) {
          input.setValue(r, c, '0');
        }
      }
    }

    // Reset green circle back to start (A)
    this.resetPositionToStart();

    // Re-render room dots to reflect current roomCounts
    this.renderRoomDots();

    // Refresh hallway badge based on current hallwayCount
    this.updateHallwayBadge();
  }
}


