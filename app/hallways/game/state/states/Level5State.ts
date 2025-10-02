import * as Phaser from 'phaser';
import { GameState, SharedData, NodeKey } from '../types';

export class Level5State implements GameState {
  private prompt?: Phaser.GameObjects.Text;
  private scalarRect?: Phaser.GameObjects.Rectangle;
  private scalarText?: Phaser.GameObjects.Text;
  private multiplyText?: Phaser.GameObjects.Text;
  private equalText?: Phaser.GameObjects.Text;
  private resultGroup?: Phaser.GameObjects.Group;

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    this.showPrompt();
    this.setMatrixEnabled(true);
    this.enableArrows(true);
    // Start with 5 per room
    this.data.roomCounts = { A: 5, B: 5, C: 5, D: 5 };
    this.resetPositionToStart();
    this.renderRoomDots();
    // Ensure matrix brackets (frame) visible and labels C1–C5 visible
    if ((this.data as any).matrixFrame) (this.data as any).matrixFrame.setVisible(true);
    if ((this.data as any).matrixLabels) ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(true));
    // Ensure input cells render above any brackets for clickability
    const input = this.data.matrixInput;
    if (input) {
      for (let r = 0; r < input.cells.length; r++) {
        for (let c = 0; c < input.cells[r].length; c++) {
          input.cells[r][c].rect.setDepth(5);
          input.cells[r][c].text.setDepth(6);
        }
      }
    }

    // Build scalar UI and result vector
    this.buildScalarAndResult();
    // Recompute once at start
    this.updateResultVector();

    // Show Save UI (button + slots)
    this.ensureSaveUI();
    this.setSaveUIVisible(true);
  }

  exit(): void {
    this.prompt?.destroy();
    this.scalarRect?.destroy();
    this.scalarText?.destroy();
    this.multiplyText?.destroy();
    this.equalText?.destroy();
    this.resultGroup?.clear(true, true);
    this.setSaveUIVisible(false);
  }

  update(): void {}

  // Called by scene after each increment to recompute = scalar * matrix
  public onMatrixUpdated(): void { this.updateResultVector(); }

  private showPrompt() {
    const text = 'For this level, every time you move someone from a room, 1 of their friends also tag along.\n\nCan you match the resulting values with [6,6,6,0,6]?';
    this.prompt = this.scene.add.text(1100, 120, text, { font: '24px Arial', color: '#222', wordWrap: { width: 500 } });
  }

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

  private buildScalarAndResult() {
    // Scalar cell right of the main input vector
    const cellSize = 50; const spacing = 10; const x = 1150; const y = 620; const rows = 5;
    const matrixHeight = rows * cellSize + (rows - 1) * spacing;
    const midY = y + matrixHeight / 2;
    const rightX = x + cellSize + 60; // add more gap between matrix and scalar
    // Multiply sign between matrix and scalar
    this.multiplyText = this.scene.add.text(rightX - 24, midY, '×', { font: '28px Arial', color: '#000' }).setOrigin(0.5);
    // Scalar cell centered vertically
    const rect = this.scene.add.rectangle(rightX + cellSize/2, midY, cellSize, cellSize, 0xffffff, 1).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
    const txt = this.scene.add.text(rightX + cellSize/2, midY, '2', { font: '20px Arial', color: '#000', align: 'center' }).setOrigin(0.5);
    this.scalarRect = rect; this.scalarText = txt;
    // Equals centered vertically as well
    this.equalText = this.scene.add.text(rightX + cellSize + 32, midY, '=', { font: '28px Arial', color: '#000' }).setOrigin(0, 0.5);

    // Handle typing for scalar
    rect.on('pointerdown', () => {
      this.scene.input.keyboard?.off('keydown');
      this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        let v = txt.text;
        if (event.key === 'Backspace') v = v.slice(0, -1);
        else if (event.key.length === 1 && /[0-9]/.test(event.key)) { if (v.length < 3) v += event.key; }
        else if (event.key === 'Enter') { return; }
        txt.setText(v === '' ? '0' : v);
        this.updateResultVector();
      });
    });

    // Build result vector group
    this.resultGroup = this.scene.add.group();
    // Base x,y for result vector cells
    const rxBase = rightX + cellSize + 88;
    // Draw result brackets
    const g = this.scene.add.graphics();
    const extraHeight = 30;
    const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
    const bracketYOffset = -extraHeight / 2;
    const bracketWidth = 20;
    const overlap = 4;
    g.lineStyle(8, 0x000000);
    // Left bracket
    g.strokeLineShape(new Phaser.Geom.Line(rxBase - bracketWidth, y + bracketYOffset, rxBase - bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rxBase - bracketWidth - overlap, y + bracketYOffset, rxBase, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rxBase - bracketWidth - overlap, y + bracketHeight + bracketYOffset, rxBase, y + bracketHeight + bracketYOffset));
    // Right bracket
    const rightXBracket = rxBase + cellSize;
    g.strokeLineShape(new Phaser.Geom.Line(rightXBracket + bracketWidth, y + bracketYOffset, rightXBracket + bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightXBracket, y + bracketYOffset, rightXBracket + bracketWidth + overlap, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightXBracket, y + bracketHeight + bracketYOffset, rightXBracket + bracketWidth + overlap, y + bracketHeight + bracketYOffset));
    this.resultGroup.add(g);

    // Draw result cells
    for (let r = 0; r < rows; r++) {
      const ry = y + r * (cellSize + spacing);
      const rectR = this.scene.add.rectangle(rxBase + cellSize/2, ry + cellSize/2, cellSize, cellSize, 0xffffff, 1).setStrokeStyle(2, 0x000000);
      const txtR = this.scene.add.text(rxBase + cellSize/2, ry + cellSize/2, '0', { font: '20px Arial', color: '#000' }).setOrigin(0.5).setName(`res_${r}`);
      this.resultGroup.addMultiple([rectR, txtR]);
    }
  }

  private updateResultVector() {
    if (!this.data.matrixInput || !this.resultGroup || !this.scalarText) return;
    const s = parseInt(this.scalarText.text) || 0;
    for (let r = 0; r < 5; r++) {
      const base = parseInt(this.data.matrixInput.getValue(r, 0) || '0') || 0;
      const val = base * s;
      const txt = this.resultGroup.getChildren().find(c => c.name === `res_${r}`) as Phaser.GameObjects.Text | undefined;
      if (txt) txt.setText(String(val));
    }
  }

  // ==== Save UI (button + slots) ====
  private ensureSaveUI() {
    if (!this.data.saveUIContainer) this.data.saveUIContainer = this.scene.add.container(0, 0);
    const container = this.data.saveUIContainer;
    container.removeAll(true);

    // Save button under matrix (matrix at x=1150,y=620, 5x1, cell 50, spacing 10)
    const mx = 1150, my = 620, rows = 5, cellSize = 50, spacing = 10;
    const bottomY = my + rows * (cellSize + spacing) - spacing;
    const btn = this.scene.add.text(mx + cellSize/2, bottomY + 20, 'Save', {
      font: '22px Arial', color: '#fff', backgroundColor: '#0077cc', padding: { left: 12, right: 12, top: 6, bottom: 6 }, fontStyle: 'bold'
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.onSavePressed());
    container.add(btn);
    this.data.saveButton = btn;

    // Slots (four) above diagram with glow highlight support
    const slots: Phaser.GameObjects.Container[] = [];
    const baseX = 268; const baseY = 114; const gap = 90; const w = 54; const h = 90;
    for (let i = 0; i < 4; i++) {
      const slot = this.scene.add.container(baseX + i * gap, baseY);
      const glow = this.scene.add.graphics();
      glow.lineStyle(6, 0xffcc00).strokeRoundedRect(-w/2 - 6, -h/2 - 6, w + 12, h + 12, 10);
      glow.setAlpha(0);
      const frame = this.scene.add.graphics();
      frame.lineStyle(3, 0x000000).strokeRoundedRect(-w/2, -h/2, w, h, 6);
      const label = this.scene.add.text(0, 0, ['A','B','C','D'][i], { font: '18px Arial', color: '#000' }).setOrigin(0.5);
      slot.add([glow, frame, label]);
      slot.setSize(w, h);
      slot.setInteractive(new Phaser.Geom.Rectangle(-w/2, -h/2, w, h), Phaser.Geom.Rectangle.Contains);
      slot.setData('glow', glow);
      slot.on('pointerdown', () => this.onSlotPressed(i));
      container.add(slot);
      slots.push(slot);
    }
    this.data.saveSlots = slots;
    this.data.savedMatrices = this.data.savedMatrices || [];
  }

  private setSaveUIVisible(visible: boolean) { this.data.saveUIContainer?.setVisible(visible); }

  private onSavePressed() {
    const input = this.data.matrixInput; if (!input) return;
    const vector: number[] = [];
    for (let i = 0; i < 5; i++) {
      const raw = (input.getValue(i, 0) || '0').toString();
      const n = parseInt(raw.replace(/[^0-9\-]/g, '') || '0', 10) || 0;
      vector.push(n);
    }
    this.data.saveModeActive = true;
    (this.data.saveSlots || []).forEach(slot => {
      slot.setAlpha(1);
      const glow = slot.getData('glow') as Phaser.GameObjects.Graphics | undefined;
      if (glow) {
        glow.setAlpha(1);
        this.scene.tweens.add({ targets: [slot], scaleX: 1.06, scaleY: 1.06, duration: 220, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({ targets: [glow], alpha: 0.3, duration: 220, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
      }
    });
    (this.data.saveUIContainer as any).__pendingVector = vector;
  }

  private onSlotPressed(index: number) {
    if (!this.data.saveModeActive) return;
    const vector = (this.data.saveUIContainer as any).__pendingVector as number[];
    if (!vector) return;
    this.data.savedMatrices = this.data.savedMatrices || [];
    this.data.savedMatrices[index] = vector.slice();
    this.renderVectorIntoSlot(index, vector);
    this.data.saveModeActive = false;
    (this.data.saveUIContainer as any).__pendingVector = undefined;
    (this.data.saveSlots || []).forEach(slot => {
      slot.setScale(1);
      slot.setAlpha(1);
      const glow = slot.getData('glow') as Phaser.GameObjects.Graphics | undefined;
      if (glow) glow.setAlpha(0);
    });
  }

  private renderVectorIntoSlot(index: number, values: number[]) {
    const slot = (this.data.saveSlots || [])[index];
    if (!slot) return;
    slot.removeAll(true);
    const w = 54, h = 90; const cellSize = 12; const spacing = 4;
    const frame = this.scene.add.graphics();
    frame.lineStyle(3, 0x000000).strokeRoundedRect(-w/2, -h/2, w, h, 6);
    slot.add(frame);
    const x = -4; const y = -h/2 + 6;
    const g = this.scene.add.graphics();
    const rows = values.length; const brW = 6; const overlap = 2; const brH = rows*cellSize + (rows-1)*spacing + 8;
    g.lineStyle(2, 0x000000);
    g.strokeLineShape(new Phaser.Geom.Line(x - brW, y, x - brW, y + brH));
    g.strokeLineShape(new Phaser.Geom.Line(x - brW - overlap, y, x, y));
    g.strokeLineShape(new Phaser.Geom.Line(x - brW - overlap, y + brH, x, y + brH));
    const rightX = x + cellSize;
    g.strokeLineShape(new Phaser.Geom.Line(rightX + brW, y, rightX + brW, y + brH));
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y, rightX + brW + overlap, y));
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + brH, rightX + brW + overlap, y + brH));
    slot.add(g);
    for (let r = 0; r < rows; r++) {
      const ty = y + r * (cellSize + spacing) + cellSize/2;
      const txt = this.scene.add.text(x + cellSize/2, ty, String(values[r]), { font: '12px Arial', color: '#000' }).setOrigin(0.5);
      slot.add(txt);
    }
  }
}


