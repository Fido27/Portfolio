import * as Phaser from 'phaser';
import {
  IUIManager,
  MatrixInput,
  MatrixCell,
  RoomCounts,
  NodeKey,
} from '../types';
import {
  MATRIX_CONFIG,
  OCCUPANCY_CONFIG,
  PROMPT_CONFIG,
  SAVE_SLOTS_CONFIG,
  FONTS,
  GAME_HEIGHT,
} from '../config/constants';

export class UIManager implements IUIManager {
  private scene: Phaser.Scene;
  private dy: number;

  // Matrix UI
  private matrixInput!: MatrixInput;
  private matrixFrame!: Phaser.GameObjects.Graphics;
  private cameraLabels: Phaser.GameObjects.Text[] = [];

  // Prompt
  private promptText?: Phaser.GameObjects.Text;

  // Occupancy vector
  private occupancyTexts: Phaser.GameObjects.Text[] = [];

  // Timer
  private timerText!: Phaser.GameObjects.Text;

  // Save UI
  private saveContainer!: Phaser.GameObjects.Container;
  private saveButton!: Phaser.GameObjects.Text;
  private saveSlots: Phaser.GameObjects.Container[] = [];
  private savedMatrices: (number[] | null)[] = [null, null, null, null];
  private saveModeActive: boolean = false;
  private pendingVector: number[] | null = null;

  // Scalar UI
  private scalarContainer?: Phaser.GameObjects.Container;
  private scalarRect?: Phaser.GameObjects.Rectangle;
  private scalarText?: Phaser.GameObjects.Text;
  private resultTexts: Phaser.GameObjects.Text[] = [];

  // Callbacks
  private onMatrixChange?: () => void;
  private onSlotClick?: (index: number, values: number[] | null) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.dy = GAME_HEIGHT / 2 - 400;
  }

  // ============ Initialization ============

  create(
    onMatrixChange: () => void,
    onSlotClick?: (index: number, values: number[] | null) => void
  ): void {
    this.onMatrixChange = onMatrixChange;
    this.onSlotClick = onSlotClick;

    this.createTimer();
    this.createMatrixInput();
    this.createOccupancyVector();
    this.createSaveUI();
    this.createScalarUI();
  }

  // ============ Matrix Interface ============

  getMatrixInput(): MatrixInput {
    return this.matrixInput;
  }

  setMatrixBracketsVisible(visible: boolean): void {
    this.matrixFrame.setVisible(visible);
  }

  setCameraLabelsVisible(visible: boolean): void {
    this.cameraLabels.forEach(label => label.setVisible(visible));
  }

  // ============ Prompt Interface ============

  showPrompt(text: string): void {
    if (this.promptText) {
      this.promptText.setText(text);
      this.promptText.setVisible(true);
    } else {
      this.promptText = this.scene.add.text(
        PROMPT_CONFIG.x,
        PROMPT_CONFIG.y,
        text,
        {
          font: FONTS.prompt,
          color: '#222',
          wordWrap: { width: PROMPT_CONFIG.width },
        }
      );
    }
  }

  hidePrompt(): void {
    this.promptText?.setVisible(false);
  }

  // ============ Occupancy Interface ============

  updateOccupancyVector(counts: RoomCounts): void {
    const values = [counts.A, counts.B, counts.C, counts.D];
    this.occupancyTexts.forEach((text, i) => {
      text.setText(String(values[i]));
    });
  }

  // ============ Timer Interface ============

  updateTimer(elapsedMs: number): void {
    const totalSec = Math.floor(elapsedMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    this.timerText.setText(`${mm}:${ss}`);
  }

  // ============ Save UI Interface ============

  setSaveUIVisible(visible: boolean): void {
    this.saveContainer.setVisible(visible);
  }

  getSavedMatrices(): (number[] | null)[] {
    return [...this.savedMatrices];
  }

  saveToSlot(index: number, values: number[]): void {
    this.savedMatrices[index] = [...values];
    this.renderVectorInSlot(index, values);
  }

  loadFromSlot(index: number): number[] | null {
    return this.savedMatrices[index] ? [...this.savedMatrices[index]!] : null;
  }

  // ============ Scalar UI Interface ============

  setScalarUIVisible(visible: boolean): void {
    this.scalarContainer?.setVisible(visible);
  }

  getScalarValue(): number {
    if (!this.scalarText) return 1;
    return parseInt(this.scalarText.text) || 1;
  }

  setScalarValue(value: number): void {
    this.scalarText?.setText(String(value));
  }

  updateResultVector(values: number[]): void {
    values.forEach((val, i) => {
      if (this.resultTexts[i]) {
        this.resultTexts[i].setText(String(val));
      }
    });
  }

  // ============ Private Creation Methods ============

  private createTimer(): void {
    this.timerText = this.scene.add
      .text(10, 10, '00:00', {
        font: FONTS.timer,
        color: '#000',
      })
      .setOrigin(0, 0);
  }

  private createMatrixInput(): void {
    const { x, y, rows, cellSize, spacing, bracketWidth, bracketOverlap, lineWidth } = MATRIX_CONFIG;

    // Create bracket graphics
    this.matrixFrame = this.scene.add.graphics();
    const extraHeight = 30;
    const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
    const bracketYOffset = -extraHeight / 2;

    this.matrixFrame.lineStyle(lineWidth, 0x000000);
    
    // Left bracket
    this.matrixFrame.strokeLineShape(new Phaser.Geom.Line(
      x - bracketWidth, y + bracketYOffset,
      x - bracketWidth, y + bracketHeight + bracketYOffset
    ));
    this.matrixFrame.strokeLineShape(new Phaser.Geom.Line(
      x - bracketWidth - bracketOverlap, y + bracketYOffset,
      x, y + bracketYOffset
    ));
    this.matrixFrame.strokeLineShape(new Phaser.Geom.Line(
      x - bracketWidth - bracketOverlap, y + bracketHeight + bracketYOffset,
      x, y + bracketHeight + bracketYOffset
    ));

    // Right bracket
    const rightX = x + cellSize + bracketWidth;
    this.matrixFrame.strokeLineShape(new Phaser.Geom.Line(
      rightX, y + bracketYOffset,
      rightX, y + bracketHeight + bracketYOffset
    ));
    this.matrixFrame.strokeLineShape(new Phaser.Geom.Line(
      rightX - bracketWidth, y + bracketYOffset,
      rightX + bracketOverlap, y + bracketYOffset
    ));
    this.matrixFrame.strokeLineShape(new Phaser.Geom.Line(
      rightX - bracketWidth, y + bracketHeight + bracketYOffset,
      rightX + bracketOverlap, y + bracketHeight + bracketYOffset
    ));

    // Create cells
    const cells: MatrixCell[][] = [];
    const values: number[] = [];
    let focusedCell: MatrixCell | null = null;

    for (let r = 0; r < rows; r++) {
      const cellX = x;
      const cellY = y + r * (cellSize + spacing);

      const rect = this.scene.add
        .rectangle(cellX + cellSize / 2, cellY + cellSize / 2, cellSize, cellSize, 0xffffff, 1)
        .setStrokeStyle(2, 0x000000)
        .setInteractive({ useHandCursor: true });

      const text = this.scene.add
        .text(cellX + cellSize / 2, cellY + cellSize / 2, '0', {
          font: FONTS.matrix,
          color: '#000',
          align: 'center',
        })
        .setOrigin(0.5);

      const cell: MatrixCell = { rect, text, row: r, col: 0 };
      cells.push([cell]);
      values.push(0);

      // Click handler
      rect.on('pointerdown', () => {
        if (focusedCell) {
          focusedCell.rect.setStrokeStyle(2, 0x000000);
        }
        focusedCell = cell;
        rect.setStrokeStyle(4, 0x4287f5);
        values[r] = 0;
        text.setText('');
        this.onMatrixChange?.();

        this.scene.input.keyboard?.off('keydown');
        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
          let val = values[r].toString();
          if (val === '0') val = '';

          if (event.key === 'Backspace') {
            val = val.slice(0, -1);
          } else if (event.key.length === 1 && /[0-9\-]/.test(event.key)) {
            if (val.length < 3) val += event.key;
          } else if (event.key === 'Enter') {
            return;
          }

          const parsed = parseInt(val) || 0;
          values[r] = parsed;
          text.setText(val || '0');
          this.onMatrixChange?.();
        });
      });

      // Create camera label
      const label = this.scene.add
        .text(x - 60, cellY + cellSize / 2, `C${r + 1}`, {
          font: FONTS.label,
          color: '#000',
        })
        .setOrigin(1, 0.5)
        .setVisible(false);
      this.cameraLabels.push(label);
    }

    this.matrixInput = {
      cells,
      values,
      setValue: (row: number, value: number) => {
        values[row] = value;
        cells[row][0].text.setText(String(value));
      },
      getValue: (row: number) => values[row],
      setEnabled: (enabled: boolean) => {
        cells.forEach(row => {
          row.forEach(cell => {
            if (enabled) {
              cell.rect.setInteractive({ useHandCursor: true });
            } else {
              cell.rect.disableInteractive();
            }
          });
        });
      },
      reset: () => {
        for (let i = 0; i < rows; i++) {
          values[i] = 0;
          cells[i][0].text.setText('0');
        }
      },
    };
  }

  private createOccupancyVector(): void {
    const { x, y, rowSpacing } = OCCUPANCY_CONFIG;
    const labels: NodeKey[] = ['A', 'B', 'C', 'D'];

    labels.forEach((label, i) => {
      this.scene.add.text(x - 30, y + i * rowSpacing, label, {
        font: '16px Arial',
        color: '#000',
      });

      const valueText = this.scene.add.text(x, y + i * rowSpacing, '0', {
        font: '18px Arial',
        color: '#000',
      });
      this.occupancyTexts.push(valueText);
    });
  }

  private createSaveUI(): void {
    this.saveContainer = this.scene.add.container(0, 0);

    const { x, y, rows, cellSize, spacing } = MATRIX_CONFIG;
    const bottomY = y + rows * (cellSize + spacing) - spacing;

    // Save button
    this.saveButton = this.scene.add
      .text(x + cellSize / 2, bottomY + 20, 'Save', {
        font: FONTS.button,
        color: '#fff',
        backgroundColor: '#0077cc',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(0.5, 0)
      .setInteractive({ useHandCursor: true });

    this.saveButton.on('pointerdown', () => this.onSavePressed());
    this.saveContainer.add(this.saveButton);

    // Create slots
    const { baseX, baseY, gap, width, height, hitPadding, count } = SAVE_SLOTS_CONFIG;
    const slotLabels = ['Save\nSlot\n1', 'Save\nSlot\n2', 'Save\nSlot\n3', 'Save\nSlot\n4'];

    for (let i = 0; i < count; i++) {
      const slot = this.scene.add.container(baseX + i * gap, baseY);

      // Glow (for save mode)
      const glow = this.scene.add.graphics();
      glow.lineStyle(6, 0xffcc00);
      glow.strokeRoundedRect(-width / 2 - 6, -height / 2 - 6, width + 12, height + 12, 10);
      glow.setAlpha(0);

      // Frame
      const frame = this.scene.add.graphics();
      frame.lineStyle(3, 0x000000);
      frame.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

      // Label (multi-line, centered)
      const label = this.scene.add
        .text(0, 0, slotLabels[i], { font: '18px Arial', color: '#000', align: 'center' })
        .setOrigin(0.5);

      // Hit zone
      const hit = this.scene.add
        .rectangle(0, 0, width + hitPadding, height + hitPadding, 0x000000, 0)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      slot.add([glow, frame, label, hit]);
      slot.setSize(width + hitPadding, height + hitPadding);
      slot.setData('glow', glow);
      slot.setData('label', label);

      hit.on('pointerdown', () => this.onSlotPressed(i));

      this.saveContainer.add(slot);
      this.saveSlots.push(slot);
    }

    this.saveContainer.setVisible(false);
  }

  private createScalarUI(): void {
    const { x, y, rows, cellSize, spacing } = MATRIX_CONFIG;
    const matrixHeight = rows * cellSize + (rows - 1) * spacing;
    const midY = y + matrixHeight / 2;
    const rightX = x + cellSize + 60;

    this.scalarContainer = this.scene.add.container(0, 0);

    // Multiply sign
    const multiplyText = this.scene.add
      .text(rightX - 24, midY, '×', { font: '28px Arial', color: '#000' })
      .setOrigin(0.5);
    this.scalarContainer.add(multiplyText);

    // Scalar cell
    this.scalarRect = this.scene.add
      .rectangle(rightX + cellSize / 2, midY, cellSize, cellSize, 0xffffff, 1)
      .setStrokeStyle(2, 0x000000)
      .setInteractive({ useHandCursor: true });
    this.scalarContainer.add(this.scalarRect);

    this.scalarText = this.scene.add
      .text(rightX + cellSize / 2, midY, '2', { font: '20px Arial', color: '#000' })
      .setOrigin(0.5);
    this.scalarContainer.add(this.scalarText);

    // Equals sign
    const equalText = this.scene.add
      .text(rightX + cellSize + 32, midY, '=', { font: '28px Arial', color: '#000' })
      .setOrigin(0, 0.5);
    this.scalarContainer.add(equalText);

    // Scalar input handler
    let focused = false;
    const focusScalar = () => {
      this.scalarRect!.setStrokeStyle(4, 0x4287f5);
      this.scalarText!.setText('');
      focused = true;

      this.scene.input.keyboard?.off('keydown');
      this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (!focused) return;
        let v = this.scalarText!.text;

        if (event.key === 'Backspace') {
          v = v.slice(0, -1);
        } else if (event.key.length === 1 && /[0-9]/.test(event.key)) {
          if (v.length < 3) v += event.key;
        } else if (event.key === 'Enter') {
          focused = false;
          this.scalarRect!.setStrokeStyle(2, 0x000000);
          return;
        }

        this.scalarText!.setText(v === '' ? '0' : v);
        this.onMatrixChange?.();
      });
    };

    this.scalarRect.on('pointerdown', focusScalar);
    this.scalarText.setInteractive({ useHandCursor: true });
    this.scalarText.on('pointerdown', focusScalar);

    // Result vector
    const rxBase = rightX + cellSize + 88;

    // Result brackets
    const g = this.scene.add.graphics();
    const extraHeight = 30;
    const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
    const bracketYOffset = -extraHeight / 2;
    const bracketWidth = 20;
    const overlap = 4;

    g.lineStyle(8, 0x000000);
    g.strokeLineShape(new Phaser.Geom.Line(rxBase - bracketWidth, y + bracketYOffset, rxBase - bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rxBase - bracketWidth - overlap, y + bracketYOffset, rxBase, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rxBase - bracketWidth - overlap, y + bracketHeight + bracketYOffset, rxBase, y + bracketHeight + bracketYOffset));

    const rightXBracket = rxBase + cellSize;
    g.strokeLineShape(new Phaser.Geom.Line(rightXBracket + bracketWidth, y + bracketYOffset, rightXBracket + bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightXBracket, y + bracketYOffset, rightXBracket + bracketWidth + overlap, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightXBracket, y + bracketHeight + bracketYOffset, rightXBracket + bracketWidth + overlap, y + bracketHeight + bracketYOffset));
    this.scalarContainer.add(g);

    // Result cells
    for (let r = 0; r < rows; r++) {
      const ry = y + r * (cellSize + spacing);
      const rectR = this.scene.add
        .rectangle(rxBase + cellSize / 2, ry + cellSize / 2, cellSize, cellSize, 0xffffff, 1)
        .setStrokeStyle(2, 0x000000);
      this.scalarContainer.add(rectR);

      const txtR = this.scene.add
        .text(rxBase + cellSize / 2, ry + cellSize / 2, '0', { font: '20px Arial', color: '#000' })
        .setOrigin(0.5);
      this.scalarContainer.add(txtR);
      this.resultTexts.push(txtR);
    }

    this.scalarContainer.setVisible(false);
  }

  // ============ Private Save Logic ============

  private onSavePressed(): void {
    // Get current matrix values
    const vector: number[] = [];
    for (let i = 0; i < 5; i++) {
      vector.push(this.matrixInput.getValue(i));
    }

    this.saveModeActive = true;
    this.pendingVector = vector;

    // Highlight slots
    this.saveSlots.forEach(slot => {
      slot.setAlpha(1);
      const glow = slot.getData('glow') as Phaser.GameObjects.Graphics | undefined;
      if (glow) {
        glow.setAlpha(1);
        this.scene.tweens.add({
          targets: [slot],
          scaleX: 1.06,
          scaleY: 1.06,
          duration: 220,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.easeInOut',
        });
        this.scene.tweens.add({
          targets: [glow],
          alpha: 0.3,
          duration: 220,
          yoyo: true,
          repeat: 4,
          ease: 'Sine.easeInOut',
        });
      }
    });
  }

  private onSlotPressed(index: number): void {
    if (this.saveModeActive && this.pendingVector) {
      // Save mode: store vector
      this.savedMatrices[index] = [...this.pendingVector];
      this.renderVectorInSlot(index, this.pendingVector);
      
      this.saveModeActive = false;
      this.pendingVector = null;

      // Clear highlights
      this.saveSlots.forEach(slot => {
        slot.setScale(1);
        slot.setAlpha(1);
        const glow = slot.getData('glow') as Phaser.GameObjects.Graphics | undefined;
        if (glow) glow.setAlpha(0);
      });
    } else {
      // Load mode
      const saved = this.savedMatrices[index];
      if (saved) {
        // Apply to matrix
        saved.forEach((val, i) => {
          this.matrixInput.setValue(i, val);
        });
        this.onMatrixChange?.();
      }
      this.onSlotClick?.(index, saved);
    }
  }

  private renderVectorInSlot(index: number, values: number[]): void {
    const slot = this.saveSlots[index];
    if (!slot) return;

    // Remove children except glow and frame (first 2)
    const children = slot.getAll();
    for (let i = children.length - 1; i >= 2; i--) {
      const child = children[i];
      slot.remove(child, true);
    }

    const { width, height } = SAVE_SLOTS_CONFIG;
    const cellSize = 12;
    const spacing = 4;
    const top = -height / 2 + 10;
    const x = -4;
    const rows = values.length;
    const brW = 6;
    const overlap = 2;
    const brH = rows * cellSize + (rows - 1) * spacing + 8;

    // Brackets
    const brackets = this.scene.add.graphics();
    brackets.lineStyle(2, 0x000000);
    brackets.strokeLineShape(new Phaser.Geom.Line(x - brW, top, x - brW, top + brH));
    brackets.strokeLineShape(new Phaser.Geom.Line(x - brW - overlap, top, x, top));
    brackets.strokeLineShape(new Phaser.Geom.Line(x - brW - overlap, top + brH, x, top + brH));
    const rightX = x + cellSize;
    brackets.strokeLineShape(new Phaser.Geom.Line(rightX + brW, top, rightX + brW, top + brH));
    brackets.strokeLineShape(new Phaser.Geom.Line(rightX, top, rightX + brW + overlap, top));
    brackets.strokeLineShape(new Phaser.Geom.Line(rightX, top + brH, rightX + brW + overlap, top + brH));
    slot.add(brackets);

    // Values
    for (let r = 0; r < rows; r++) {
      const ty = top + r * (cellSize + spacing) + cellSize / 2;
      const txt = this.scene.add
        .text(x + cellSize / 2, ty, String(values[r]), { font: '12px Arial', color: '#000' })
        .setOrigin(0.5);
      slot.add(txt);
    }

    // Hit zone (re-add at the end)
    const hit = this.scene.add
      .rectangle(0, 0, width + 20, height + 20, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.onSlotPressed(index));
    slot.add(hit);
  }
}
