import * as Phaser from 'phaser';
import { GameState, SharedData, NodeKey } from '../types';

export class Level8State implements GameState {
  private prompt?: Phaser.GameObjects.Text;
  private container?: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    // Ensure default 5x1 matrix UI is visible and editable
    this.setMatrixEnabled(true);
    if ((this.data as any).matrixFrame) (this.data as any).matrixFrame.setVisible(true);
    if ((this.data as any).matrixLabels) ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(true));

    // Keep arrows enabled (optional for exploration)
    this.enableArrows(true);

    // Default people per room for this level
    this.data.roomCounts = { A: 5, B: 5, C: 5, D: 5 };
    this.renderRoomDots();
    this.resetPositionToStart();

    // Prompt + delta vector display
    this.showPrompt();
    this.container = this.scene.add.container(0, 0);
    this.drawDeltaVector([6, 2, -6, -2]);
  }

  exit(): void {
    this.prompt?.destroy();
    this.container?.destroy(true);
  }

  update(): void {}

  private setMatrixEnabled(enabled: boolean) {
    const input = this.data.matrixInput; if (!input) return;
    for (let r = 0; r < input.cells.length; r++) {
      for (let c = 0; c < input.cells[r].length; c++) {
        if (enabled) input.cells[r][c].rect.setInteractive({ useHandCursor: true });
        else input.cells[r][c].rect.disableInteractive();
      }
    }
  }

  private enableArrows(enabled: boolean) {
    const arrowObjects = Object.values(this.data.arrows || {}) as Phaser.GameObjects.GameObject[];
    arrowObjects.forEach((obj) => { if (enabled) (obj as any).setInteractive({ useHandCursor: true }); else (obj as any).disableInteractive(); });
  }

  private resetPositionToStart() {
    if (!this.data.greenCircle) return;
    const coords = this.data.nodeCoords || { A:{x:240,y:560}, B:{x:240,y:240}, C:{x:560,y:240}, D:{x:560,y:560} };
    const start = (coords as any)['A'];
    this.data.greenCircle.setPosition(start.x, start.y);
    if (this.data.greenCircleText) this.data.greenCircleText.setPosition(start.x, start.y);
    this.data.currentNode = 'A';
  }

  private renderRoomDots() {
    const rooms: NodeKey[] = ['A','B','C','D'];
    rooms.forEach(letter => {
      const count = this.data.roomCounts?.[letter] || 0;
      const sceneAny = this.scene as any;
      if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') sceneAny['__layoutRoomDots'](letter, count);
    });
  }

  private showPrompt() {
    const text = 'For the following delta vector, determine the camera vector.';
    this.prompt = this.scene.add.text(1100, 120, text, { font: '24px Arial', color: '#222', wordWrap: { width: 500 } });
  }

  private drawDeltaVector(values: number[]) {
    // Draw a 4x1 bracketed vector with A–D labels
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
    this.container?.add(g);
    for (let row = 0; row < rows; row++) {
      const cellY = y + row * (cellSize + spacing);
      const txt = this.scene.add.text(x + cellSize/2, cellY + cellSize/2, String(values[row]), { font: '24px Arial', color: '#000', align: 'center' }).setOrigin(0.5);
      this.container?.add(txt);
    }
    // Labels A–D on the left
    const labels = ['A','B','C','D'];
    for (let i = 0; i < rows; i++) {
      const lx = x - 60;
      const ly = y + i * (cellSize + spacing) + cellSize/2;
      const lbl = this.scene.add.text(lx, ly, labels[i], { font: '20px Arial', color: '#000' }).setOrigin(1, 0.5);
      this.container?.add(lbl);
    }
  }
}


