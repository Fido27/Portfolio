import * as Phaser from 'phaser';
import { ILevel, LevelConfig, ValidationResult, IBoardManager, IUIManager } from '../types';

/**
 * Level 7: Given a camera vector, determine the delta vector
 * Shows [5,3,5,4,7] and asks for a 4x1 delta vector (A,B,C,D)
 */
export class Level7State implements ILevel {
  private scene: Phaser.Scene;
  private boardManager: IBoardManager;
  private uiManager: IUIManager;
  private _config: LevelConfig;

  private container?: Phaser.GameObjects.Container;
  private prompt?: Phaser.GameObjects.Text;
  private deltaValues: number[] = [0, 0, 0, 0];
  private deltaCells: { rect: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text }[] = [];

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

    // Setup room counts and position
    this.boardManager.updateRoomDots({ A: 8, B: 8, C: 8, D: 8 });
    this.boardManager.movePlayerTo('A', false);
    this.boardManager.setArrowsEnabled(true);

    // Create container for level UI
    this.container = this.scene.add.container(0, 0);

    // Show prompt
    this.showPrompt();

    // Draw the given camera vector [5,3,5,4,7]
    this.drawCameraVector([5, 3, 5, 4, 7]);

    // Build the 4x1 delta vector input
    this.buildDeltaVectorInput();
  }

  exit(): void {
    this.prompt?.destroy();
    this.container?.destroy(true);
    this.deltaCells = [];
    
    // Restore default matrix UI
    this.showDefaultMatrixCells();
    this.uiManager.setMatrixBracketsVisible(true);
  }

  update(_delta: number): void {}

  reset(): void {
    this.deltaValues = [0, 0, 0, 0];
    this.deltaCells.forEach((cell, _i) => {
      cell.text.setText('0');
    });
  }

  validate(): ValidationResult {
    // Level 7 doesn't have strict validation - just proceed
    return { valid: true };
  }

  private showPrompt(): void {
    const text = 'Level 7:\n\nIf the camera vector captures the following data, what would be the delta vector for this scenario?\n\nThe delta vector represents the change in population for each room (A, B, C, D).';
    this.prompt = this.scene.add.text(1100, 120, text, {
      font: '24px Arial',
      color: '#222',
      wordWrap: { width: 500 },
    });
  }

  private drawCameraVector(values: number[]): void {
    const x = 1160, y = 300, cellSize = 40, spacing = 10;
    const rows = values.length;

    // Brackets
    const g = this.scene.add.graphics();
    const extraHeight = 30;
    const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
    const bracketYOffset = -extraHeight / 2;
    const bracketWidth = 20;
    const overlap = 4;

    g.lineStyle(8, 0x000000);
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y + bracketYOffset, x - bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketYOffset, x, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketHeight + bracketYOffset, x, y + bracketHeight + bracketYOffset));
    
    const rightX = x + cellSize;
    g.strokeLineShape(new Phaser.Geom.Line(rightX + bracketWidth, y + bracketYOffset, rightX + bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketYOffset, rightX + bracketWidth + overlap, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketHeight + bracketYOffset, rightX + bracketWidth + overlap, y + bracketHeight + bracketYOffset));
    
    this.container?.add(g);

    // Values
    for (let row = 0; row < rows; row++) {
      const cellY = y + row * (cellSize + spacing);
      const txt = this.scene.add.text(x + cellSize / 2, cellY + cellSize / 2, String(values[row]), {
        font: '24px Arial',
        color: '#000',
        align: 'center',
      }).setOrigin(0.5);
      this.container?.add(txt);
    }

    // Labels C1-C5
    const labels = ['C1', 'C2', 'C3', 'C4', 'C5'];
    for (let i = 0; i < rows; i++) {
      const lx = x - 60;
      const ly = y + i * (cellSize + spacing) + cellSize / 2;
      const lbl = this.scene.add.text(lx, ly, labels[i], { font: '20px Arial', color: '#000' }).setOrigin(1, 0.5);
      this.container?.add(lbl);
    }
  }

  private buildDeltaVectorInput(): void {
    const x = 1150, y = 620, rows = 4, cellSize = 50, spacing = 10;

    // Brackets
    const g = this.scene.add.graphics();
    const extraHeight = 30;
    const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
    const bracketYOffset = -extraHeight / 2;
    const bracketWidth = 20;
    const overlap = 4;

    g.lineStyle(8, 0x000000);
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y + bracketYOffset, x - bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketYOffset, x, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketHeight + bracketYOffset, x, y + bracketHeight + bracketYOffset));

    const rightX = x + cellSize + bracketWidth;
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketYOffset, rightX, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX - bracketWidth, y + bracketYOffset, rightX + overlap, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX - bracketWidth, y + bracketHeight + bracketYOffset, rightX + overlap, y + bracketHeight + bracketYOffset));

    this.container?.add(g);

    // Input cells
    let focused: { rect: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; row: number } | null = null;

    for (let r = 0; r < rows; r++) {
      const cellY = y + r * (cellSize + spacing);
      const rect = this.scene.add.rectangle(x + cellSize / 2, cellY + cellSize / 2, cellSize, cellSize, 0xffffff, 1)
        .setStrokeStyle(2, 0x000000)
        .setInteractive({ useHandCursor: true });
      const text = this.scene.add.text(x + cellSize / 2, cellY + cellSize / 2, '0', {
        font: '20px Arial',
        color: '#000',
        align: 'center',
      }).setOrigin(0.5);

      this.container?.add(rect);
      this.container?.add(text);
      this.deltaCells.push({ rect, text });

      const cell = { rect, text, row: r };

      rect.on('pointerdown', () => {
        if (focused) focused.rect.setStrokeStyle(2, 0x000000);
        focused = cell;
        rect.setStrokeStyle(4, 0x4287f5);
        this.deltaValues[r] = 0;
        text.setText('');

        this.scene.input.keyboard?.off('keydown');
        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
          if (!focused) return;
          let val = this.deltaValues[r].toString();
          if (val === '0') val = '';

          if (event.key === 'Backspace') {
            val = val.slice(0, -1);
          } else if (event.key.length === 1 && /[0-9\-]/.test(event.key)) {
            if (val.length < 3) val += event.key;
          } else if (event.key === 'Enter') {
            focused.rect.setStrokeStyle(2, 0x000000);
            focused = null;
            return;
          }

          const parsed = parseInt(val) || 0;
          this.deltaValues[r] = parsed;
          text.setText(val || '0');
        });
      });
    }

    // Labels A-D
    const labels = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < rows; i++) {
      const lx = x - 60;
      const ly = y + i * (cellSize + spacing) + cellSize / 2;
      const lbl = this.scene.add.text(lx, ly, labels[i], { font: '20px Arial', color: '#000' }).setOrigin(1, 0.5);
      this.container?.add(lbl);
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
