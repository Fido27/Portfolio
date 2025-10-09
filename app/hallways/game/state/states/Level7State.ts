import * as Phaser from 'phaser';
import { GameState, SharedData, NodeKey } from '../types';

export class Level7State implements GameState {
  private prompt?: Phaser.GameObjects.Text;
  private container?: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    this.showPrompt();
    // Enable all arrows for this level
    this.enableArrows(true);
    // Hide the default 5x1 matrix frame and labels; we draw our own 4x1 input
    if ((this.data as any).matrixFrame) (this.data as any).matrixFrame.setVisible(false);
    if ((this.data as any).matrixLabels) ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(false));
    // Hide the default 5x1 input cells so we don't see extra cells
    this.toggleDefaultMatrixVisible(false);

    // Default people per room: 5
    this.data.roomCounts = { A: 5, B: 5, C: 5, D: 5 };
    this.renderRoomDots();
    this.resetPositionToStart();

    // Create UI container for this level's elements
    this.container = this.scene.add.container(0, 0);

    // Show the given camera vector [5,3,5,4,7] like Levels 1–2 prompt visuals
    this.drawVectorDisplay([5,3,5,4,7]);

    // Create a 4x1 editable input matrix (no camera labels)
    this.buildFourByOneInput();
  }

  exit(): void {
    this.prompt?.destroy();
    this.container?.destroy(true);
    // Restore default matrix frame visibility for other levels
    if ((this.data as any).matrixFrame) (this.data as any).matrixFrame.setVisible(true);
    if ((this.data as any).matrixLabels) ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(false));
    // Show default input back for other levels
    this.toggleDefaultMatrixVisible(true);
  }

  update(): void {}

  private enableArrows(enabled: boolean) {
    const arrowObjects = Object.values(this.data.arrows || {}) as Phaser.GameObjects.GameObject[];
    arrowObjects.forEach((obj) => { if (enabled) (obj as any).setInteractive({ useHandCursor: true }); else (obj as any).disableInteractive(); });
  }

  private showPrompt() {
    const text = 'If the camera vector captures the follow data. What would be the delta vector for this scenario?';
    this.prompt = this.scene.add.text(1100, 120, text, { font: '24px Arial', color: '#222', wordWrap: { width: 500 } });
  }

  private drawVectorDisplay(values: (string|number)[]) {
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
    // Labels C1–C5 on the left
    const labelText = ['C1','C2','C3','C4','C5'];
    for (let i = 0; i < rows; i++) {
      const lx = x - 60;
      const ly = y + i * (cellSize + spacing) + cellSize/2;
      const lbl = this.scene.add.text(lx, ly, labelText[i], { font: '20px Arial', color: '#000' }).setOrigin(1, 0.5);
      this.container?.add(lbl);
    }
  }

  private renderRoomDots() {
    const rooms: NodeKey[] = ['A','B','C','D'];
    rooms.forEach(letter => {
      const count = this.data.roomCounts?.[letter] || 0;
      const sceneAny = this.scene as any;
      if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') sceneAny['__layoutRoomDots'](letter, count);
    });
  }

  private resetPositionToStart() {
    if (!this.data.greenCircle) return;
    const coords = this.data.nodeCoords || { A:{x:240,y:560}, B:{x:240,y:240}, C:{x:560,y:240}, D:{x:560,y:560} };
    const start = (coords as any)['A'];
    this.data.greenCircle.setPosition(start.x, start.y);
    if (this.data.greenCircleText) this.data.greenCircleText.setPosition(start.x, start.y);
    this.data.currentNode = 'A';
  }

  private buildFourByOneInput() {
    const x = 1150, y = 620, rows = 4, cols = 1, cellSize = 50, spacing = 10;
    const values: string[][] = Array.from({ length: rows }, () => Array(cols).fill('0'));
    const g = this.scene.add.graphics();
    const extraHeight = 30; const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight; const bracketYOffset = -extraHeight / 2; const bracketWidth = 20; const overlap = 4;
    g.lineStyle(8, 0x000000);
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y + bracketYOffset, x - bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketYOffset, x, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketHeight + bracketYOffset, x, y + bracketHeight + bracketYOffset));
    const rightX = x + cols * (cellSize + spacing) - spacing + bracketWidth;
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketYOffset, rightX, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX - bracketWidth, y + bracketYOffset, rightX + overlap, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX - bracketWidth, y + bracketHeight + bracketYOffset, rightX + overlap, y + bracketHeight + bracketYOffset));
    this.container?.add(g);

    let focused: { rect: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; row: number; col: number } | null = null;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = x + c * (cellSize + spacing);
        const cellY = y + r * (cellSize + spacing);
        const rect = this.scene.add.rectangle(cellX + cellSize/2, cellY + cellSize/2, cellSize, cellSize, 0xffffff, 1).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
        const text = this.scene.add.text(cellX + cellSize/2, cellY + cellSize/2, values[r][c], { font: '20px Arial', color: '#000', align: 'center' }).setOrigin(0.5);
        this.container?.add(rect); this.container?.add(text);
        const onKey = (cell: any) => (event: KeyboardEvent) => {
          if (!focused) return;
          let val = values[cell.row][cell.col];
          if (event.key === 'Backspace') val = val.slice(0, -1);
          else if (event.key.length === 1 && /[0-9\-]/.test(event.key)) { if (val.length < 3) val += event.key; }
          else if (event.key === 'Enter') { focused.rect.setStrokeStyle(2, 0x000000); focused = null; return; }
          values[cell.row][cell.col] = val; text.setText(val);
        };
        const cell = { rect, text, row: r, col: c };
        rect.on('pointerdown', () => {
          if (focused) focused.rect.setStrokeStyle(2, 0x000000);
          focused = cell;
          rect.setStrokeStyle(4, 0x4287f5);
          values[cell.row][cell.col] = '';
          text.setText('');
          this.scene.input.keyboard?.off('keydown');
          this.scene.input.keyboard?.on('keydown', onKey(cell));
        });
      }
    }
    // Labels A–D on the left of the 4x1 input
    const labels = ['A','B','C','D'];
    for (let i = 0; i < rows; i++) {
      const lx = x - 60;
      const ly = y + i * (cellSize + spacing) + cellSize/2;
      const lbl = this.scene.add.text(lx, ly, labels[i], { font: '20px Arial', color: '#000' }).setOrigin(1, 0.5);
      this.container?.add(lbl);
    }
  }

  private toggleDefaultMatrixVisible(visible: boolean) {
    const input = this.data.matrixInput;
    if (!input) return;
    for (let r = 0; r < input.cells.length; r++) {
      for (let c = 0; c < input.cells[r].length; c++) {
        input.cells[r][c].rect.setVisible(visible);
        input.cells[r][c].text.setVisible(visible);
        if (!visible) input.cells[r][c].rect.disableInteractive();
      }
    }
  }
}


