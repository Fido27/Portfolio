import * as Phaser from 'phaser';
import { GameState, SharedData } from '../types';

export class Level4State implements GameState {
  private prompt?: Phaser.GameObjects.Text;

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    this.showPrompt();
    // Level 4 should reflect latest mechanics:
    // - No hallway group, arrows always available, one person moves per step
    // - Start with 5 people in each room
    this.setMatrixEnabled(true);
    this.enableArrows(true);
    this.data.roomCounts = { A: 5, B: 5, C: 5, D: 5 };
    this.renderRoomDots();
    this.resetPositionToStart();
    this.ensureSaveUI();
    this.setSaveUIVisible(true);
  }

  exit(): void {
    this.prompt?.destroy();
    this.setSaveUIVisible(false);
  }

  update(): void {}

  private showPrompt() {
    const text = 'Save a matrix that represents one round of the hallways, starting from Room A, visiting all the rooms and then ending up at Room A.\n\nMove the green circle to trace the path. When done, press Save and choose a slot.';
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

  private ensureSaveUI() {
    if (!this.data.saveUIContainer) this.data.saveUIContainer = this.scene.add.container(0, 0);
    const container = this.data.saveUIContainer;
    container.removeAll(true);

    // Save button under matrix (matrix at x=1150,y=620, 5x1, cell 50, spacing 10)
    const mx = 1150, my = 620, rows = 5, cellSize = 50, spacing = 10;
    const bottomY = my + rows * (cellSize + spacing) - spacing;
    const btn = this.scene.add.text(mx + cellSize/2, bottomY + 20, 'Save', { font: '22px Arial', color: '#fff', backgroundColor: '#0077cc', padding: { left: 12, right: 12, top: 6, bottom: 6 }, fontStyle: 'bold' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.onSavePressed());
    container.add(btn);
    this.data.saveButton = btn;

    // Reuse Sandbox-style highlighted save slots
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

  private setSaveUIVisible(visible: boolean) {
    this.data.saveUIContainer?.setVisible(visible);
  }

  private onSavePressed() {
    const input = this.data.matrixInput; if (!input) return;
    const vector: number[] = [];
    for (let i = 0; i < 5; i++) {
      const raw = (input.getValue(i, 0) || '0').toString();
      const n = parseInt(raw.replace(/[^0-9\-]/g, '') || '0', 10) || 0;
      vector.push(n);
    }
    // Save mode: click a slot to store and highlight slots
    this.data.saveModeActive = true;
    (this.data.saveSlots || []).forEach(slot => {
      slot.setAlpha(1);
      const glow = slot.getData('glow') as Phaser.GameObjects.Graphics | undefined;
      if (glow) {
        glow.setAlpha(1);
        this.scene.tweens.add({ targets: [slot], scaleX: 1.06, scaleY: 1.06, duration: 220, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({ targets: [glow], alpha: 0.3, duration: 220, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
      } else {
        this.scene.tweens.add({ targets: slot, alpha: 0.7, duration: 220, yoyo: true, repeat: 4 });
      }
    });
    // Temporarily store the vector on the container for retrieval in slot press
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
    // Clear slot highlights
    (this.data.saveSlots || []).forEach(slot => {
      slot.setScale(1);
      slot.setAlpha(1);
      const glow = slot.getData('glow') as Phaser.GameObjects.Graphics | undefined;
      if (glow) glow.setAlpha(0);
    });
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

  private resetPositionToStart() {
    if (!this.data.greenCircle) return;
    const coords = this.data.nodeCoords || { A:{x:240,y:560}, B:{x:240,y:240}, C:{x:560,y:240}, D:{x:560,y:560} };
    const start = (coords as any)['A'];
    this.data.greenCircle.setPosition(start.x, start.y);
    if (this.data.greenCircleText) this.data.greenCircleText.setPosition(start.x, start.y);
    this.data.currentNode = 'A';
  }

  private renderVectorIntoSlot(index: number, values: number[]) {
    const slot = (this.data.saveSlots || [])[index];
    if (!slot) return;
    slot.removeAll(true);
    const w = 54, h = 90;
    const frame = this.scene.add.graphics();
    frame.lineStyle(3, 0x000000).strokeRoundedRect(-w/2, -h/2, w, h, 6);
    slot.add(frame);
    // Draw a tiny bracketed 5x1 vector
    const x = -4; const y = -h/2 + 6; const cellSize = 12; const spacing = 4;
    const g = this.scene.add.graphics();
    const rows = values.length;
    const brW = 6; const overlap = 2; const brH = rows*cellSize + (rows-1)*spacing + 8;
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


