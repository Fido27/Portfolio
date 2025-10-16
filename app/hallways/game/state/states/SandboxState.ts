import * as Phaser from 'phaser';
import { GameState, SharedData, NodeKey } from '../types';

export class SandboxState implements GameState {
  private container?: Phaser.GameObjects.Container;
  private peopleRect?: Phaser.GameObjects.Rectangle;
  private peopleFocused: boolean = false;

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    this.ensureUI();
    this.setMatrixEnabled(true);
    this.enableArrows(true);
    this.syncAllRoomDots();
    this.updateOccupancyVector();
    this.ensureSaveUI();
    this.setSaveUIVisible(true);
  }

  exit(): void {
    if (this.container) this.container.setVisible(false);
    this.setMatrixEnabled(false);
    this.setSaveUIVisible(false);
  }

  update(): void {}

  private ensureSaveUI() {
    if (!this.data.saveUIContainer) this.data.saveUIContainer = this.scene.add.container(0, 0);
    const container = this.data.saveUIContainer;
    container.removeAll(true);
    // Save button next to matrix
    // Place Save under the matrix (matrix at x=1150,y=620 with 5 rows)
    const mx = 1150, my = 620, rows = 5, cellSize = 50, spacing = 10;
    const bottomY = my + rows * (cellSize + spacing) - spacing;
    const btn = this.scene.add.text(mx + cellSize/2, bottomY + 20, 'Save', { font: '22px Arial', color: '#fff', backgroundColor: '#0077cc', padding: { left: 12, right: 12, top: 6, bottom: 6 }, fontStyle: 'bold' }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.onSavePressed());
    container.add(btn);
    this.data.saveButton = btn;
    // Slots
    const slots: Phaser.GameObjects.Container[] = [];
    const baseX = 268; const baseY = 114; const gap = 90; const w = 54; const h = 90;
    const pad = 20; // expand hitbox padding on all sides
    for (let i = 0; i < 4; i++) {
      const slot = this.scene.add.container(baseX + i * gap, baseY);
      // Glow outline (hidden until Save pressed)
      const glow = this.scene.add.graphics();
      glow.lineStyle(6, 0xffcc00).strokeRoundedRect(-w/2 - 6, -h/2 - 6, w + 12, h + 12, 10);
      glow.setAlpha(0);
      const frame = this.scene.add.graphics();
      frame.lineStyle(3, 0x000000).strokeRoundedRect(-w/2, -h/2, w, h, 6);
      const label = this.scene.add.text(0, 0, ['A','B','C','D'][i], { font: '18px Arial', color: '#000' }).setOrigin(0.5);
      // Transparent centered hit target to avoid top-left anchoring issues
      const hit = this.scene.add.rectangle(0, 0, w + pad, h + pad, 0x000000, 0).setOrigin(0.5).setInteractive({ useHandCursor: true });
      slot.add([glow, frame, label, hit]);
      // Enlarge the container size to match hit area
      slot.setSize(w + pad, h + pad);
      slot.setData('glow', glow);
      slot.setData('w', w);
      slot.setData('h', h);
      hit.on('pointerdown', () => this.onSlotPressed(i));
      container.add(slot);
      slots.push(slot);
    }
    this.data.saveSlots = slots;
    this.data.savedMatrices = this.data.savedMatrices || [];
  }

  private setSaveUIVisible(isVisible: boolean) {
    this.data.saveUIContainer?.setVisible(isVisible);
  }

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
        // Pulse both the glow and the slot slightly
        this.scene.tweens.add({ targets: [slot], scaleX: 1.06, scaleY: 1.06, duration: 220, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
        this.scene.tweens.add({ targets: [glow], alpha: 0.3, duration: 220, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
      } else {
        // fallback subtle alpha pulse
        this.scene.tweens.add({ targets: slot, alpha: 0.7, duration: 220, yoyo: true, repeat: 4 });
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
    // Clear highlights on all slots
    (this.data.saveSlots || []).forEach(slot => {
      slot.setScale(1);
      slot.setAlpha(1);
      const glow = slot.getData('glow') as Phaser.GameObjects.Graphics | undefined;
      if (glow) glow.setAlpha(0);
    });
  }

  private renderVectorIntoSlot(index: number, values: number[]) {
    const slot = (this.data.saveSlots || [])[index]; if (!slot) return;
    slot.removeAll(true);
    const w = 54, h = 90;
    const frame = this.scene.add.graphics();
    frame.lineStyle(3, 0x000000).strokeRoundedRect(-w/2, -h/2, w, h, 6);
    slot.add(frame);
    const x = -4; const y = -h/2 + 6; const cellSize = 12; const spacing = 4;
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
  private ensureUI() {
    if (!this.container) this.container = this.scene.add.container(0, 0);
    this.container.setVisible(true);

    // People input
    if (!this.data.peopleCellText) {
      const x = 950, y = 230, cellSize = 50;
      const label = this.scene.add.text(x, y, 'Number of People', { font: '26px Arial', color: '#222' });
      this.container.add(label);
      const cellX = x + 240, cellY = y + (label.height - cellSize) / 2;
      this.peopleRect = this.scene.add.rectangle(cellX + cellSize/2, cellY + cellSize/2, cellSize, cellSize, 0xffffff, 1).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
      const txt = this.scene.add.text(cellX + cellSize/2, cellY + cellSize/2, this.data.peopleValue || '1', { font: '20px Arial', color: '#000' }).setOrigin(0.5);
      this.container.add(this.peopleRect);
      this.container.add(txt);
      this.data.peopleCellText = txt;
      this.setupPeopleHandlers();
    } else {
      this.data.peopleCellText.setText(this.data.peopleValue || '1');
      this.peopleRect?.setInteractive();
    }

    // Room inputs A-D simple counters + buttons
    if (!this.data.roomPeopleTexts) this.data.roomPeopleTexts = {};
    if (!this.data.roomPeopleRects) this.data.roomPeopleRects = {};
    const baseY = 380, leftX = 950, cellSizeR = 44;
    (['A','B','C','D'] as NodeKey[]).forEach((letter, idx) => {
      const y = baseY + idx * 56;
      const label = this.scene.add.text(leftX, y, `People in ${letter}`, { font: '20px Arial', color: '#222' });
      this.container!.add(label);
      const cellX = leftX + 220; const cellY = y + (label.height - cellSizeR) / 2;
      if (!this.data.roomPeopleRects![letter]) {
        const rect = this.scene.add.rectangle(cellX + cellSizeR/2, cellY + cellSizeR/2, cellSizeR, cellSizeR, 0xffffff, 1).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
        const txt = this.scene.add.text(cellX + cellSizeR/2, cellY + cellSizeR/2, String(this.data.roomCounts?.[letter] ?? 0), { font: '18px Arial', color: '#000' }).setOrigin(0.5);
        this.container!.add(rect); this.container!.add(txt);
        this.data.roomPeopleRects![letter] = rect; this.data.roomPeopleTexts![letter] = txt;
        rect.on('pointerdown', () => this.setupRoomKeyHandler(letter));
      }
      // Always synchronize the displayed value with current roomCounts on (re)enter
      const curVal = this.data.roomCounts?.[letter] ?? 0;
      if (this.data.roomPeopleTexts![letter]) this.data.roomPeopleTexts![letter]!.setText(String(curVal));
      // transfer buttons
      const pull = this.scene.add.text(cellX + 60, y, '← Hall', { font: '18px Arial', color: '#fff', backgroundColor: '#444', padding: { left: 8, right: 8, top: 4, bottom: 4 } }).setInteractive({ useHandCursor: true });
      const push = this.scene.add.text(cellX + 150, y, '→ Room', { font: '18px Arial', color: '#fff', backgroundColor: '#444', padding: { left: 8, right: 8, top: 4, bottom: 4 } }).setInteractive({ useHandCursor: true });
      this.container!.add(pull); this.container!.add(push);
      pull.on('pointerdown', () => this.transferFromRoomToHall(letter));
      push.on('pointerdown', () => this.transferFromHallToRoom(letter));
    });
  }

  private setupPeopleHandlers() {
    if (!this.peopleRect || !this.data.peopleCellText) return;
    this.peopleRect.on('pointerdown', () => {
      this.peopleFocused = true;
      this.data.peopleValue = '';
      this.data.peopleCellText!.setText('');
      this.peopleRect!.setStrokeStyle(4, 0x4287f5);
      this.scene.input.keyboard?.off('keydown');
      this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (!this.peopleFocused) return;
        let v = this.data.peopleValue || '';
        if (event.key === 'Backspace') v = v.slice(0, -1);
        else if (event.key.length === 1 && /[0-9]/.test(event.key)) { if (v.length < 5) v += event.key; }
        else if (event.key === 'Enter') { this.peopleFocused = false; this.peopleRect!.setStrokeStyle(2, 0x000000); return; }
        this.data.peopleValue = v; this.data.peopleCellText!.setText(v);
        // hallway mechanic removed; keep display only
      });
    });
  }

  private setupRoomKeyHandler(letter: NodeKey) {
    const rect = this.data.roomPeopleRects?.[letter];
    const txt = this.data.roomPeopleTexts?.[letter];
    if (!rect || !txt) return;
    rect.setStrokeStyle(4, 0x4287f5);
    txt.setText('');
    this.scene.input.keyboard?.off('keydown');
    this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      let v = txt.text;
      if (event.key === 'Backspace') v = v.slice(0, -1);
      else if (event.key.length === 1 && /[0-9]/.test(event.key)) { if (v.length < 5) v += event.key; }
      else if (event.key === 'Enter') { rect.setStrokeStyle(2, 0x000000); return; }
      txt.setText(v);
      const parsed = parseInt(v); if (!isNaN(parsed)) { this.data.roomCounts[letter] = parsed; this.layoutRoomDots(letter, parsed); this.updateOccupancyVector(); }
    });
  }

  private layoutRoomDots(letter: NodeKey, count: number) {
    const sceneAny = this.scene as any;
    if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') {
      sceneAny['__layoutRoomDots'](letter, count);
    }
  }

  private syncAllRoomDots() {
    (['A','B','C','D'] as NodeKey[]).forEach((l) => this.layoutRoomDots(l, this.data.roomCounts?.[l] ?? 0));
  }

  // hallway badge removed (no hallway group mechanics)
  private updateHallwayBadge() {}

  private updateOccupancyVector() {
    const group = this.data.occupancyVector;
    if (!group) return;
    const counts = [
      this.data.roomCounts?.A || 0,
      this.data.roomCounts?.B || 0,
      this.data.roomCounts?.C || 0,
      this.data.roomCounts?.D || 0
    ];
    const children = group.getChildren();
    for (const obj of children) {
      if (obj.name && obj.name.startsWith('occ_')) {
        const idx = parseInt((obj.name.split('_')[1]) as any);
        (obj as Phaser.GameObjects.Text).setText(String(counts[idx]));
      }
    }
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

  private transferFromRoomToHall(letter: NodeKey) {}

  private transferFromHallToRoom(letter: NodeKey) {}
  
  private updateRoomCell(letter: NodeKey) {
    const txt = this.data.roomPeopleTexts?.[letter];
    if (txt) {
      const value = this.data.roomCounts?.[letter] ?? 0;
      txt.setText(String(value));
    }
  }
}


