import * as Phaser from 'phaser';
import { GameState, SharedData } from '../types';

type VectorBorderController = { setStrokeStyle: (lineWidth: number, color: number) => void };

interface VectorBracketInfo {
  x: number;
  y: number;
  rows: number;
  cellSize: number;
  spacing: number;
  extraHeight: number;
  bracketWidth: number;
  overlap: number;
  leftBracket: Phaser.GameObjects.Graphics;
  rightBracket: Phaser.GameObjects.Graphics;
}

export class Level9State implements GameState {
  private prompt?: Phaser.GameObjects.Text;
  private container?: Phaser.GameObjects.Container;

  // Scalars UI
  private leftScalarRect?: Phaser.GameObjects.Rectangle;
  private leftScalarText?: Phaser.GameObjects.Text;
  private rightScalarRect?: Phaser.GameObjects.Rectangle;
  private rightScalarText?: Phaser.GameObjects.Text;
  private leftMultiplyText?: Phaser.GameObjects.Text;
  private plusText?: Phaser.GameObjects.Text;
  private rightMultiplyText?: Phaser.GameObjects.Text;
  private equalText?: Phaser.GameObjects.Text;

  // Vectors UI
  private leftVectorGroup?: Phaser.GameObjects.Group;
  private rightVectorGroup?: Phaser.GameObjects.Group;
  private resultVectorGroup?: Phaser.GameObjects.Group;
  private leftBorderController?: VectorBorderController;
  private rightBorderController?: VectorBorderController;
  private selectHint?: Phaser.GameObjects.Text;

  // Data for combination
  private activeTarget: 'left'|'right' = 'left';
  private leftVector: number[] = [0,0,0,0,0];
  private rightVector: number[] = [0,0,0,0,0];
  private vectorBracketInfo = new WeakMap<Phaser.GameObjects.Group, VectorBracketInfo>();

  constructor(private scene: Phaser.Scene, private data: SharedData) {}

  enter(): void {
    this.showPrompt();
    // Hide default 5x1 matrix UI; we draw our own combination UI
    if ((this.data as any).matrixFrame) (this.data as any).matrixFrame.setVisible(false);
    if ((this.data as any).matrixLabels) ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(false));
    this.toggleDefaultMatrixVisible(false);

    this.container = this.scene.add.container(0, 0);
    this.buildLinearCombinationUI();
    this.ensureSlotsUI();
    this.updateAllVectors();
  }

  exit(): void {
    this.prompt?.destroy();
    this.container?.destroy(true);
    this.leftVectorGroup?.clear(true, true);
    this.rightVectorGroup?.clear(true, true);
    this.resultVectorGroup?.clear(true, true);
    this.leftMultiplyText?.destroy();
    this.rightMultiplyText?.destroy();
    this.plusText?.destroy();
    this.equalText?.destroy();
    this.leftScalarRect?.destroy();
    this.leftScalarText?.destroy();
    this.rightScalarRect?.destroy();
    this.rightScalarText?.destroy();
    this.selectHint?.destroy();
    this.leftBorderController = undefined;
    this.rightBorderController = undefined;
    // Restore default matrix UI for other levels
    if ((this.data as any).matrixFrame) (this.data as any).matrixFrame.setVisible(true);
    if ((this.data as any).matrixLabels) ((this.data as any).matrixLabels as Phaser.GameObjects.Text[]).forEach(l => l.setVisible(true));
    this.toggleDefaultMatrixVisible(true);
    // Keep the slots visible for other levels as they recreate UI themselves
    this.setSlotsVisible(false);
  }

  update(): void {}

  // ===== UI Builders =====
  private showPrompt() {
    const text = 'Use two saved matrices to make a linear combination: a · M + b · N.\nClick a slot to fill the highlighted term. Click a term to switch which one is active.';
    this.prompt = this.scene.add.text(1100, 120, text, { font: '24px Arial', color: '#222', wordWrap: { width: 500 } });
  }

  private buildLinearCombinationUI() {
    // Geometry constants (aligned with existing matrix sizing in scene)
    const rows = 5;
    const cellSize = 50;
    const cellSpacing = 10;
    const bracketWidth = 20;
    const bracketOverlap = 4;
    const bracketMargin = bracketWidth + bracketOverlap; // how far brackets extend past the cell
    const vectorTotalWidth = cellSize + bracketMargin * 2;
    const scalarWidth = cellSize;
    const smallGap = 32;
    const mediumGap = 56;
    const largeGap = 64;

    const y = 620;
    const baseX = 900;
    const midY = y + (rows * cellSize + (rows - 1) * cellSpacing) / 2;

    let cursor = baseX;

    // Left scalar
    const leftScalarCenterX = cursor + scalarWidth / 2;
    this.leftScalarRect = this.scene.add.rectangle(leftScalarCenterX, midY, scalarWidth, scalarWidth, 0xffffff, 1)
      .setStrokeStyle(2, 0x000000)
      .setInteractive({ useHandCursor: true });
    this.leftScalarText = this.scene.add.text(leftScalarCenterX, midY, '1', { font: '20px Arial', color: '#000' }).setOrigin(0.5);
    this.container?.add(this.leftScalarRect);
    this.container?.add(this.leftScalarText);
    cursor += scalarWidth;

    // Multiply sign
    cursor += smallGap;
    this.leftMultiplyText = this.scene.add.text(cursor, midY, '×', { font: '28px Arial', color: '#000' }).setOrigin(0.5);
    this.container?.add(this.leftMultiplyText);

    cursor += smallGap;
    const leftVectorOuterLeft = cursor;
    const leftVecX = leftVectorOuterLeft + bracketMargin;
    this.leftVectorGroup = this.buildVectorAt(leftVecX, y, rows, cellSize, cellSpacing, 'L_');
    this.leftBorderController = this.createVectorBorderController(this.leftVectorGroup);
    this.leftBorderController?.setStrokeStyle(10, 0x4287f5); // Left is active by default
    cursor += vectorTotalWidth;

    // Plus
    cursor += mediumGap;
    this.plusText = this.scene.add.text(cursor, midY, '+', { font: '28px Arial', color: '#000' }).setOrigin(0.5);
    this.container?.add(this.plusText);

    cursor += mediumGap;
    const rightScalarCenterX = cursor + scalarWidth / 2;
    this.rightScalarRect = this.scene.add.rectangle(rightScalarCenterX, midY, scalarWidth, scalarWidth, 0xffffff, 1)
      .setStrokeStyle(2, 0x000000)
      .setInteractive({ useHandCursor: true });
    this.rightScalarText = this.scene.add.text(rightScalarCenterX, midY, '1', { font: '20px Arial', color: '#000' }).setOrigin(0.5);
    this.container?.add(this.rightScalarRect);
    this.container?.add(this.rightScalarText);
    cursor += scalarWidth;

    cursor += smallGap;
    this.rightMultiplyText = this.scene.add.text(cursor, midY, '×', { font: '28px Arial', color: '#000' }).setOrigin(0.5);
    this.container?.add(this.rightMultiplyText);

    cursor += smallGap;
    const rightVectorOuterLeft = cursor;
    const rightVecX = rightVectorOuterLeft + bracketMargin;
    this.rightVectorGroup = this.buildVectorAt(rightVecX, y, rows, cellSize, cellSpacing, 'R_');
    this.rightBorderController = this.createVectorBorderController(this.rightVectorGroup);
    this.rightBorderController?.setStrokeStyle(8, 0x000000);
    cursor += vectorTotalWidth;

    cursor += largeGap;
    this.equalText = this.scene.add.text(cursor, midY, '=', { font: '28px Arial', color: '#000' }).setOrigin(0.5);
    this.container?.add(this.equalText);

    cursor += mediumGap;
    const resOuterLeft = cursor;
    const resX = resOuterLeft + bracketMargin;
    this.resultVectorGroup = this.buildVectorAt(resX, y, rows, cellSize, cellSpacing, 'RES_');

    // Hint
    const hintX = baseX;
    this.selectHint = this.scene.add.text(hintX, y - 44, 'Selecting: Left', { font: '18px Arial', color: '#555' });
    this.container?.add(this.selectHint);

    // Interactions: click a vector area to switch active
    const makeSwitchActive = (target: 'left'|'right') => () => {
      this.activeTarget = target;
      this.leftBorderController?.setStrokeStyle(target === 'left' ? 10 : 8, target === 'left' ? 0x4287f5 : 0x000000);
      this.rightBorderController?.setStrokeStyle(target === 'right' ? 10 : 8, target === 'right' ? 0x4287f5 : 0x000000);
      if (this.selectHint) this.selectHint.setText(`Selecting: ${target === 'left' ? 'Left' : 'Right'}`);
    };

    // Transparent hit rectangles over vector areas
    const hitHeight = rows * (cellSize + cellSpacing) + 24;
    const hitAlpha = 0.001;
    const leftHitWidth = vectorTotalWidth + 16;
    const leftHitCenter = leftVectorOuterLeft + vectorTotalWidth / 2;
    const leftHit = this.scene.add.rectangle(leftHitCenter, midY, leftHitWidth, hitHeight, 0x000000, hitAlpha)
      .setInteractive({ useHandCursor: true });
    const rightHitWidth = vectorTotalWidth + 16;
    const rightHitCenter = rightVectorOuterLeft + vectorTotalWidth / 2;
    const rightHit = this.scene.add.rectangle(rightHitCenter, midY, rightHitWidth, hitHeight, 0x000000, hitAlpha)
      .setInteractive({ useHandCursor: true });
    leftHit.on('pointerdown', makeSwitchActive('left'));
    rightHit.on('pointerdown', makeSwitchActive('right'));
    this.container?.add(leftHit);
    this.container?.add(rightHit);

    // Scalar input handlers
    this.setupScalarInput(this.leftScalarRect!, this.leftScalarText!, () => this.updateAllVectors(), true);
    this.setupScalarInput(this.rightScalarRect!, this.rightScalarText!, () => this.updateAllVectors(), true);

    // Ensure this UI is above the occupancy vector
    this.container?.setDepth(2500);
  }

  private buildVectorAt(x: number, y: number, rows: number, cellSize: number, spacing: number, namePrefix: string) {
    const extraHeight = 30;
    const bracketWidth = 20;
    const overlap = 4;
    const leftBracket = this.scene.add.graphics();
    const rightBracket = this.scene.add.graphics();

    const group = this.scene.add.group();
    group.addMultiple([leftBracket, rightBracket]);

    const info: VectorBracketInfo = {
      x,
      y,
      rows,
      cellSize,
      spacing,
      extraHeight,
      bracketWidth,
      overlap,
      leftBracket,
      rightBracket
    };
    this.vectorBracketInfo.set(group, info);

    this.redrawBracket(info, 'left', 8, 0x000000);
    this.redrawBracket(info, 'right', 8, 0x000000);
    this.container?.add(leftBracket);
    this.container?.add(rightBracket);
    for (let r = 0; r < rows; r++) {
      const cellY = y + r * (cellSize + spacing);
      const rect = this.scene.add.rectangle(x + cellSize/2, cellY + cellSize/2, cellSize, cellSize, 0xffffff, 1).setStrokeStyle(2, 0x000000);
      const txt = this.scene.add.text(x + cellSize/2, cellY + cellSize/2, '0', { font: '20px Arial', color: '#000' }).setOrigin(0.5).setName(`${namePrefix}${r}`);
      group.addMultiple([rect, txt]);
      this.container?.add(rect);
      this.container?.add(txt);
    }
    return group;
  }

  private createVectorBorderController(group: Phaser.GameObjects.Group | undefined): VectorBorderController | undefined {
    if (!group) return undefined;
    const info = this.vectorBracketInfo.get(group);
    if (!info) return undefined;
    return {
      setStrokeStyle: (lineWidth: number, color: number) => {
        this.redrawBracket(info, 'left', lineWidth, color);
        this.redrawBracket(info, 'right', lineWidth, color);
      }
    };
  }

  private redrawBracket(info: VectorBracketInfo, side: 'left'|'right', lineWidth: number, color: number) {
    const { x, y, rows, cellSize, spacing, extraHeight, bracketWidth, overlap, leftBracket, rightBracket } = info;
    const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
    const bracketYOffset = -extraHeight / 2;
    const graphics = side === 'left' ? leftBracket : rightBracket;
    if (!graphics) return;
    graphics.clear();
    graphics.lineStyle(lineWidth, color);
    if (side === 'left') {
      graphics.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y + bracketYOffset, x - bracketWidth, y + bracketHeight + bracketYOffset));
      graphics.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketYOffset, x, y + bracketYOffset));
      graphics.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketHeight + bracketYOffset, x, y + bracketHeight + bracketYOffset));
    } else {
      const rightX = x + cellSize;
      graphics.strokeLineShape(new Phaser.Geom.Line(rightX + bracketWidth, y + bracketYOffset, rightX + bracketWidth, y + bracketHeight + bracketYOffset));
      graphics.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketYOffset, rightX + bracketWidth + overlap, y + bracketYOffset));
      graphics.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketHeight + bracketYOffset, rightX + bracketWidth + overlap, y + bracketHeight + bracketYOffset));
    }
  }

  private setupScalarInput(rect: Phaser.GameObjects.Rectangle, txt: Phaser.GameObjects.Text, onChange: () => void, allowNegative: boolean) {
    let focused = false;
    const focus = () => {
      rect.setStrokeStyle(4, 0x4287f5);
      txt.setText('');
      focused = true;
      this.scene.input.keyboard?.off('keydown');
      this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (!focused) return;
        let v = txt.text;
        if (event.key === 'Backspace') {
          v = v.slice(0, -1);
        } else if (event.key.length === 1 && /[0-9\-]/.test(event.key)) {
          if (!allowNegative && event.key === '-') {
            // ignore minus if not allowed
          } else {
            if (v.length < 4) v += event.key;
          }
        } else if (event.key === 'Enter') {
          focused = false;
          rect.setStrokeStyle(2, 0x000000);
          return;
        }
        // Normalize empty to 0, a single '-' to 0
        if (v === '' || v === '-') v = '0';
        txt.setText(v);
        onChange();
      });
    };
    rect.on('pointerdown', focus);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', focus);
  }

  // ===== Saved Slots UI (Selection only) =====
  private ensureSlotsUI() {
    if (!this.data.saveUIContainer) this.data.saveUIContainer = this.scene.add.container(0, 0);
    const container = this.data.saveUIContainer;
    container.removeAll(true);

    // Reuse the same slot visuals as Levels 4–7 (with mini vectors)
    const slots: Phaser.GameObjects.Container[] = [];
    const baseX = 268; const baseY = 114; const gap = 90; const w = 54; const h = 90;
    const pad = 20; // expand hitbox padding
    for (let i = 0; i < 4; i++) {
      const slot = this.scene.add.container(baseX + i * gap, baseY);
      const glow = this.scene.add.graphics();
      glow.lineStyle(6, 0xffcc00).strokeRoundedRect(-w/2 - 6, -h/2 - 6, w + 12, h + 12, 10);
      glow.setAlpha(0);
      const frame = this.scene.add.graphics();
      frame.lineStyle(3, 0x000000).strokeRoundedRect(-w/2, -h/2, w, h, 6);
      const label = this.scene.add.text(0, 0, ['A','B','C','D'][i], { font: '18px Arial', color: '#000' }).setOrigin(0.5);
      const preview = this.scene.add.container(0, 0);
      preview.setVisible(false);
      const hit = this.scene.add.rectangle(0, 0, w + pad, h + pad, 0x000000, 0).setOrigin(0.5).setInteractive({ useHandCursor: true });
      slot.add([glow, frame]);
      slot.add(preview);
      slot.add(label);
      slot.add(hit);
      slot.setSize(w + pad, h + pad);
      slot.setData('glow', glow);
      slot.setData('label', label);
      slot.setData('vectorContainer', preview);
      slot.setData('hitZone', hit);
      hit.on('pointerdown', () => this.onSlotPressed(i));
      container.add(slot);
      slots.push(slot);
    }
    this.data.saveSlots = slots;
    this.data.savedMatrices = this.data.savedMatrices || [];
    // Pre-populate visual contents for any existing saved matrices
    (this.data.savedMatrices || []).forEach((vec, idx) => {
      if (Array.isArray(vec) && vec.length === 5) this.renderVectorIntoSlot(idx, vec as number[]);
    });
    // Put slots above most elements
    container.setDepth(2600);
    this.setSlotsVisible(true);
  }

  private setSlotsVisible(visible: boolean) {
    this.data.saveUIContainer?.setVisible(visible);
  }

  private onSlotPressed(index: number) {
    // Load mode only: assign the saved vector to the active term
    const saved = (this.data.savedMatrices || [])[index] as number[] | undefined;
    if (!saved) return;
    if (this.activeTarget === 'left') {
      this.leftVector = saved.slice();
      this.updateVectorGroup(this.leftVectorGroup, 'L_', this.leftVector);
    } else {
      this.rightVector = saved.slice();
      this.updateVectorGroup(this.rightVectorGroup, 'R_', this.rightVector);
    }
    this.updateResultVector();
  }

  private renderVectorIntoSlot(index: number, values: number[]) {
    const slot = (this.data.saveSlots || [])[index];
    if (!slot) return;
    const preview = slot.getData('vectorContainer') as Phaser.GameObjects.Container | undefined;
    if (!preview) return;

    preview.removeAll(true);
    preview.setVisible(true);

    const w = 54;
    const h = 90;
    const cellSize = 12;
    const spacing = 4;
    const top = -h/2 + 10;
    const x = -4;
    const rows = values.length;
    const brW = 6;
    const overlap = 2;
    const brH = rows * cellSize + (rows - 1) * spacing + 8;

    const brackets = this.scene.add.graphics();
    brackets.lineStyle(2, 0x000000);
    brackets.strokeLineShape(new Phaser.Geom.Line(x - brW, top, x - brW, top + brH));
    brackets.strokeLineShape(new Phaser.Geom.Line(x - brW - overlap, top, x, top));
    brackets.strokeLineShape(new Phaser.Geom.Line(x - brW - overlap, top + brH, x, top + brH));
    const rightX = x + cellSize;
    brackets.strokeLineShape(new Phaser.Geom.Line(rightX + brW, top, rightX + brW, top + brH));
    brackets.strokeLineShape(new Phaser.Geom.Line(rightX, top, rightX + brW + overlap, top));
    brackets.strokeLineShape(new Phaser.Geom.Line(rightX, top + brH, rightX + brW + overlap, top + brH));
    preview.add(brackets);

    const slotId = ['A','B','C','D'][index] || '';
    const title = this.scene.add.text(x + cellSize / 2, top - 4, slotId, { font: '12px Arial', color: '#000' }).setOrigin(0.5, 1);
    preview.add(title);

    for (let r = 0; r < rows; r++) {
      const ty = top + r * (cellSize + spacing) + cellSize / 2;
      const txt = this.scene.add.text(x + cellSize / 2, ty, String(values[r]), { font: '12px Arial', color: '#000' }).setOrigin(0.5);
      preview.add(txt);
    }

    const label = slot.getData('label') as Phaser.GameObjects.Text | undefined;
    if (label) label.setVisible(false);

    const hit = slot.getData('hitZone') as Phaser.GameObjects.Rectangle | undefined;
    if (!hit) {
      const pad = 20;
      const hitZone = this.scene.add.rectangle(0, 0, w + pad, h + pad, 0x000000, 0).setOrigin(0.5).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', () => this.onSlotPressed(index));
      slot.add(hitZone);
      slot.setData('hitZone', hitZone);
    }
  }

  // ===== Updates =====
  private updateAllVectors() {
    this.updateVectorGroup(this.leftVectorGroup, 'L_', this.leftVector);
    this.updateVectorGroup(this.rightVectorGroup, 'R_', this.rightVector);
    this.updateResultVector();
  }

  private updateVectorGroup(group: Phaser.GameObjects.Group | undefined, prefix: string, vector: number[]) {
    if (!group) return;
    for (let r = 0; r < 5; r++) {
      const txt = group.getChildren().find(c => (c as any).name === `${prefix}${r}`) as Phaser.GameObjects.Text | undefined;
      if (txt) txt.setText(String(vector[r] || 0));
    }
  }

  private updateResultVector() {
    if (!this.resultVectorGroup) return;
    const a = parseInt(this.leftScalarText?.text || '0', 10) || 0;
    const b = parseInt(this.rightScalarText?.text || '0', 10) || 0;
    for (let r = 0; r < 5; r++) {
      const val = (parseInt(String(this.leftVector[r] || 0)) || 0) * a + (parseInt(String(this.rightVector[r] || 0)) || 0) * b;
      const txt = this.resultVectorGroup.getChildren().find(c => (c as any).name === `RES_${r}`) as Phaser.GameObjects.Text | undefined;
      if (txt) txt.setText(String(val));
    }
  }

  // ===== Utilities =====
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


