import * as Phaser from 'phaser';
import { ILevel, LevelConfig, ValidationResult, IBoardManager, IUIManager } from '../types';

/**
 * Level 8: Given a delta vector, determine the camera vector
 * Shows delta [6, 2, -6, -2] and asks for 5x1 camera vector
 */
export class Level8State implements ILevel {
  private scene: Phaser.Scene;
  private boardManager: IBoardManager;
  private uiManager: IUIManager;
  private _config: LevelConfig;

  private container?: Phaser.GameObjects.Container;
  private prompt?: Phaser.GameObjects.Text;

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
    // Enable default 5x1 matrix UI for camera vector input
    this.uiManager.setMatrixBracketsVisible(true);
    this.uiManager.setCameraLabelsVisible(true);
    this.uiManager.getMatrixInput().setEnabled(true);
    this.uiManager.getMatrixInput().reset();

    // Setup room counts and position
    this.boardManager.updateRoomDots({ A: 8, B: 8, C: 8, D: 8 });
    this.boardManager.movePlayerTo('A', false);
    this.boardManager.setArrowsEnabled(true);

    // Create container for level UI
    this.container = this.scene.add.container(0, 0);

    // Show prompt
    this.showPrompt();

    // Draw the given delta vector [6, 2, -6, -2]
    this.drawDeltaVector([6, 2, -6, -2]);
  }

  exit(): void {
    this.prompt?.destroy();
    this.container?.destroy(true);
  }

  update(_delta: number): void {}

  reset(): void {
    this.uiManager.getMatrixInput().reset();
  }

  validate(): ValidationResult {
    // Level 8 doesn't have strict validation - just proceed
    return { valid: true };
  }

  private showPrompt(): void {
    const text = 'Level 8:\n\nFor the following delta vector (change in room populations), determine the camera vector that would produce this result.\n\nThe delta vector shows: A gained 6, B gained 2, C lost 6, D lost 2.';
    this.prompt = this.scene.add.text(1100, 120, text, {
      font: '24px Arial',
      color: '#222',
      wordWrap: { width: 500 },
    });
  }

  private drawDeltaVector(values: number[]): void {
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

    // Labels A-D
    const labels = ['A', 'B', 'C', 'D'];
    for (let i = 0; i < rows; i++) {
      const lx = x - 60;
      const ly = y + i * (cellSize + spacing) + cellSize / 2;
      const lbl = this.scene.add.text(lx, ly, labels[i], { font: '20px Arial', color: '#000' }).setOrigin(1, 0.5);
      this.container?.add(lbl);
    }

    // Title for the vector
    const title = this.scene.add.text(x + cellSize / 2, y - 40, 'Delta Vector', {
      font: '18px Arial',
      color: '#666',
    }).setOrigin(0.5);
    this.container?.add(title);
  }
}
