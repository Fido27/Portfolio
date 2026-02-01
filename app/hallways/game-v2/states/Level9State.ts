import * as Phaser from 'phaser';
import { ILevel, LevelConfig, ValidationResult, IBoardManager, IUIManager } from '../types';

/**
 * Level 9: Linear combination of two saved vectors
 * UI: a × M + b × N = Result
 */
export class Level9State implements ILevel {
  private scene: Phaser.Scene;
  private boardManager: IBoardManager;
  private uiManager: IUIManager;
  private _config: LevelConfig;

  private container?: Phaser.GameObjects.Container;
  private prompt?: Phaser.GameObjects.Text;

  // Scalars
  private leftScalarRect?: Phaser.GameObjects.Rectangle;
  private leftScalarText?: Phaser.GameObjects.Text;
  private rightScalarRect?: Phaser.GameObjects.Rectangle;
  private rightScalarText?: Phaser.GameObjects.Text;

  // Vectors
  private leftVector: number[] = [0, 0, 0, 0, 0];
  private rightVector: number[] = [0, 0, 0, 0, 0];
  private leftVectorTexts: Phaser.GameObjects.Text[] = [];
  private rightVectorTexts: Phaser.GameObjects.Text[] = [];
  private resultTexts: Phaser.GameObjects.Text[] = [];

  // Selection state
  private activeTarget: 'left' | 'right' = 'left';
  private selectHint?: Phaser.GameObjects.Text;
  private leftBracketGraphics?: Phaser.GameObjects.Graphics;
  private rightBracketGraphics?: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    config: LevelConfig,
    boardManager: IBoardManager,
    uiManager: IUIManager
  ) {
    this.scene = scene;
    this._config = config;
    this.boardManager = boardManager;
    this.uiManager = uiManager;
  }

  get config(): LevelConfig {
    return this._config;
  }

  enter(): void {
    // Hide default matrix UI
    this.uiManager.setMatrixBracketsVisible(false);
    this.uiManager.setCameraLabelsVisible(false);
    this.uiManager.getMatrixInput().setEnabled(false);
    this.hideDefaultMatrixCells();

    // Show save UI for slot selection
    this.uiManager.setSaveUIVisible(true);

    // Create container
    this.container = this.scene.add.container(0, 0);

    // Show prompt
    this.showPrompt();

    // Build linear combination UI
    this.buildLinearCombinationUI();

    // Initial update
    this.updateResultVector();
  }

  exit(): void {
    this.prompt?.destroy();
    this.container?.destroy(true);
    this.leftVectorTexts = [];
    this.rightVectorTexts = [];
    this.resultTexts = [];
    
    // Restore default matrix UI
    this.showDefaultMatrixCells();
    this.uiManager.setMatrixBracketsVisible(true);
  }

  update(_delta: number): void {}

  reset(): void {
    this.leftVector = [0, 0, 0, 0, 0];
    this.rightVector = [0, 0, 0, 0, 0];
    this.leftScalarText?.setText('1');
    this.rightScalarText?.setText('1');
    this.updateVectorDisplay();
    this.updateResultVector();
  }

  validate(): ValidationResult {
    return { valid: true };
  }

  // Called when a save slot is clicked (from external)
  onSlotSelected(index: number): void {
    const saved = this.uiManager.loadFromSlot(index);
    if (!saved) return;

    if (this.activeTarget === 'left') {
      this.leftVector = [...saved];
    } else {
      this.rightVector = [...saved];
    }
    this.updateVectorDisplay();
    this.updateResultVector();
  }

  private showPrompt(): void {
    const text = 'Level 9:\n\nUse two saved vectors to create a linear combination:\n\na × Left + b × Right = Result\n\nClick a slot to fill the highlighted vector. Click a vector to switch which one is active.';
    this.prompt = this.scene.add.text(1100, 120, text, {
      font: '22px Arial',
      color: '#222',
      wordWrap: { width: 500 },
    });
  }

  private buildLinearCombinationUI(): void {
    const rows = 5;
    const cellSize = 40;
    const spacing = 8;
    const bracketWidth = 16;
    const scalarSize = 40;

    const y = 620;
    const baseX = 850;
    let cursor = baseX;

    // Hint text
    this.selectHint = this.scene.add.text(baseX, y - 40, 'Selecting: Left vector', {
      font: '16px Arial',
      color: '#555',
    });
    this.container?.add(this.selectHint);

    // Left scalar
    this.leftScalarRect = this.scene.add.rectangle(cursor + scalarSize / 2, y + (rows * (cellSize + spacing)) / 2, scalarSize, scalarSize, 0xffffff)
      .setStrokeStyle(2, 0x000000)
      .setInteractive({ useHandCursor: true });
    this.leftScalarText = this.scene.add.text(cursor + scalarSize / 2, y + (rows * (cellSize + spacing)) / 2, '1', {
      font: '18px Arial',
      color: '#000',
    }).setOrigin(0.5);
    this.container?.add(this.leftScalarRect);
    this.container?.add(this.leftScalarText);
    this.setupScalarInput(this.leftScalarRect, this.leftScalarText);
    cursor += scalarSize + 16;

    // × sign
    const mult1 = this.scene.add.text(cursor, y + (rows * (cellSize + spacing)) / 2, '×', {
      font: '24px Arial',
      color: '#000',
    }).setOrigin(0.5);
    this.container?.add(mult1);
    cursor += 32;

    // Left vector (with highlight)
    this.leftBracketGraphics = this.scene.add.graphics();
    this.drawBrackets(this.leftBracketGraphics, cursor, y, rows, cellSize, spacing, bracketWidth, 0x4287f5, 6);
    this.container?.add(this.leftBracketGraphics);
    
    const leftHit = this.scene.add.rectangle(
      cursor + cellSize / 2,
      y + (rows * (cellSize + spacing)) / 2,
      cellSize + 40,
      rows * (cellSize + spacing),
      0x000000, 0
    ).setInteractive({ useHandCursor: true });
    leftHit.on('pointerdown', () => this.setActiveTarget('left'));
    this.container?.add(leftHit);

    for (let r = 0; r < rows; r++) {
      const txt = this.scene.add.text(cursor + cellSize / 2, y + r * (cellSize + spacing) + cellSize / 2, '0', {
        font: '16px Arial',
        color: '#000',
      }).setOrigin(0.5);
      this.container?.add(txt);
      this.leftVectorTexts.push(txt);
    }
    cursor += cellSize + bracketWidth * 2 + 24;

    // + sign
    const plus = this.scene.add.text(cursor, y + (rows * (cellSize + spacing)) / 2, '+', {
      font: '24px Arial',
      color: '#000',
    }).setOrigin(0.5);
    this.container?.add(plus);
    cursor += 32;

    // Right scalar
    this.rightScalarRect = this.scene.add.rectangle(cursor + scalarSize / 2, y + (rows * (cellSize + spacing)) / 2, scalarSize, scalarSize, 0xffffff)
      .setStrokeStyle(2, 0x000000)
      .setInteractive({ useHandCursor: true });
    this.rightScalarText = this.scene.add.text(cursor + scalarSize / 2, y + (rows * (cellSize + spacing)) / 2, '1', {
      font: '18px Arial',
      color: '#000',
    }).setOrigin(0.5);
    this.container?.add(this.rightScalarRect);
    this.container?.add(this.rightScalarText);
    this.setupScalarInput(this.rightScalarRect, this.rightScalarText);
    cursor += scalarSize + 16;

    // × sign
    const mult2 = this.scene.add.text(cursor, y + (rows * (cellSize + spacing)) / 2, '×', {
      font: '24px Arial',
      color: '#000',
    }).setOrigin(0.5);
    this.container?.add(mult2);
    cursor += 32;

    // Right vector
    this.rightBracketGraphics = this.scene.add.graphics();
    this.drawBrackets(this.rightBracketGraphics, cursor, y, rows, cellSize, spacing, bracketWidth, 0x000000, 4);
    this.container?.add(this.rightBracketGraphics);

    const rightHit = this.scene.add.rectangle(
      cursor + cellSize / 2,
      y + (rows * (cellSize + spacing)) / 2,
      cellSize + 40,
      rows * (cellSize + spacing),
      0x000000, 0
    ).setInteractive({ useHandCursor: true });
    rightHit.on('pointerdown', () => this.setActiveTarget('right'));
    this.container?.add(rightHit);

    for (let r = 0; r < rows; r++) {
      const txt = this.scene.add.text(cursor + cellSize / 2, y + r * (cellSize + spacing) + cellSize / 2, '0', {
        font: '16px Arial',
        color: '#000',
      }).setOrigin(0.5);
      this.container?.add(txt);
      this.rightVectorTexts.push(txt);
    }
    cursor += cellSize + bracketWidth * 2 + 32;

    // = sign
    const eq = this.scene.add.text(cursor, y + (rows * (cellSize + spacing)) / 2, '=', {
      font: '24px Arial',
      color: '#000',
    }).setOrigin(0.5);
    this.container?.add(eq);
    cursor += 32;

    // Result vector
    const resultBrackets = this.scene.add.graphics();
    this.drawBrackets(resultBrackets, cursor, y, rows, cellSize, spacing, bracketWidth, 0x000000, 4);
    this.container?.add(resultBrackets);

    for (let r = 0; r < rows; r++) {
      const txt = this.scene.add.text(cursor + cellSize / 2, y + r * (cellSize + spacing) + cellSize / 2, '0', {
        font: '16px Arial',
        color: '#000',
      }).setOrigin(0.5);
      this.container?.add(txt);
      this.resultTexts.push(txt);
    }
  }

  private drawBrackets(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    rows: number,
    cellSize: number,
    spacing: number,
    bracketWidth: number,
    color: number,
    lineWidth: number
  ): void {
    const height = rows * cellSize + (rows - 1) * spacing;
    const overlap = 4;

    g.clear();
    g.lineStyle(lineWidth, color);

    // Left bracket
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y - 10, x - bracketWidth, y + height + 10));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y - 10, x, y - 10));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + height + 10, x, y + height + 10));

    // Right bracket
    const rightX = x + cellSize;
    g.strokeLineShape(new Phaser.Geom.Line(rightX + bracketWidth, y - 10, rightX + bracketWidth, y + height + 10));
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y - 10, rightX + bracketWidth + overlap, y - 10));
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + height + 10, rightX + bracketWidth + overlap, y + height + 10));
  }

  private setActiveTarget(target: 'left' | 'right'): void {
    this.activeTarget = target;
    this.selectHint?.setText(`Selecting: ${target === 'left' ? 'Left' : 'Right'} vector`);

    // Update bracket highlights
    if (this.leftBracketGraphics) {
      const rows = 5, cellSize = 40, spacing = 8, bracketWidth = 16;
      const x = 850 + 40 + 16 + 32; // Calculate left vector x position
      this.drawBrackets(
        this.leftBracketGraphics,
        x, 620, rows, cellSize, spacing, bracketWidth,
        target === 'left' ? 0x4287f5 : 0x000000,
        target === 'left' ? 6 : 4
      );
    }
    if (this.rightBracketGraphics) {
      const rows = 5, cellSize = 40, spacing = 8, bracketWidth = 16;
      // Calculate right vector x position (roughly)
      const x = 850 + 40 + 16 + 32 + 40 + 32 + 24 + 32 + 40 + 16 + 32;
      this.drawBrackets(
        this.rightBracketGraphics,
        x, 620, rows, cellSize, spacing, bracketWidth,
        target === 'right' ? 0x4287f5 : 0x000000,
        target === 'right' ? 6 : 4
      );
    }
  }

  private setupScalarInput(rect: Phaser.GameObjects.Rectangle, txt: Phaser.GameObjects.Text): void {
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
          if (v.length < 3) v += event.key;
        } else if (event.key === 'Enter') {
          focused = false;
          rect.setStrokeStyle(2, 0x000000);
          return;
        }

        txt.setText(v === '' ? '0' : v);
        this.updateResultVector();
      });
    };

    rect.on('pointerdown', focus);
    txt.setInteractive({ useHandCursor: true });
    txt.on('pointerdown', focus);
  }

  private updateVectorDisplay(): void {
    for (let i = 0; i < 5; i++) {
      this.leftVectorTexts[i]?.setText(String(this.leftVector[i] || 0));
      this.rightVectorTexts[i]?.setText(String(this.rightVector[i] || 0));
    }
  }

  private updateResultVector(): void {
    const a = parseInt(this.leftScalarText?.text || '1') || 0;
    const b = parseInt(this.rightScalarText?.text || '1') || 0;

    for (let i = 0; i < 5; i++) {
      const result = (this.leftVector[i] || 0) * a + (this.rightVector[i] || 0) * b;
      this.resultTexts[i]?.setText(String(result));
    }
  }

  private hideDefaultMatrixCells(): void {
    const input = this.uiManager.getMatrixInput();
    input.cells.forEach(row => {
      row.forEach(cell => {
        cell.rect.setVisible(false);
        cell.text.setVisible(false);
      });
    });
  }

  private showDefaultMatrixCells(): void {
    const input = this.uiManager.getMatrixInput();
    input.cells.forEach(row => {
      row.forEach(cell => {
        cell.rect.setVisible(true);
        cell.text.setVisible(true);
      });
    });
  }
}
