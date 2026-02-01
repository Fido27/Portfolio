import * as Phaser from 'phaser';
import {
  IStateManager,
  ILevel,
  GameState,
  NodeKey,
  ArrowKey,
  IBoardManager,
  IUIManager,
  LevelConfig,
} from '../types';
import { LEVELS, getNextLevelId } from '../config/levels';
import { BaseLevel, Level7State, Level8State, Level9State } from '../states';
import { FONTS, GAME_WIDTH } from '../config/constants';

export class StateManager implements IStateManager {
  private scene: Phaser.Scene;
  private boardManager: IBoardManager;
  private uiManager: IUIManager;

  private levels: Map<number, ILevel> = new Map();
  private currentLevel: ILevel | null = null;
  private currentLevelId: number = 1;

  // Level title display
  private levelTitleText?: Phaser.GameObjects.Text;

  // Timer state
  private startTime: number = 0;
  private baseElapsedMs: number = 0;
  private resumeStartMs: number = 0;
  private isPaused: boolean = false;

  // Pause UI
  private pauseBtn?: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Container;

  // Callbacks
  private onLevelComplete?: (levelId: number) => void;
  private onPlayerPositionSync?: (node: NodeKey) => void;

  constructor(
    scene: Phaser.Scene,
    boardManager: IBoardManager,
    uiManager: IUIManager
  ) {
    this.scene = scene;
    this.boardManager = boardManager;
    this.uiManager = uiManager;
  }

  // ============ Initialization ============

  create(
    onLevelComplete?: (levelId: number) => void,
    onPlayerPositionSync?: (node: NodeKey) => void
  ): void {
    this.onLevelComplete = onLevelComplete;
    this.onPlayerPositionSync = onPlayerPositionSync;
    
    // Create all level instances
    LEVELS.forEach(config => {
      const level = this.createLevelInstance(config);
      this.levels.set(config.id, level);
    });

    // Initialize timer
    this.startTime = this.scene.time.now;
    this.resumeStartMs = this.scene.time.now;
    this.baseElapsedMs = 0;

    // Create pause UI
    this.createPauseUI();

    // Create control buttons
    this.createControlButtons();
  }

  // ============ Public Interface ============

  getCurrentLevel(): ILevel | null {
    return this.currentLevel;
  }

  getCurrentLevelId(): number {
    return this.currentLevelId;
  }

  changeLevel(levelId: number): void {
    // Exit current level
    if (this.currentLevel) {
      this.currentLevel.exit();
    }

    // Get new level
    const nextLevel = this.levels.get(levelId);
    if (!nextLevel) {
      console.error(`Level ${levelId} not found`);
      return;
    }

    this.currentLevel = nextLevel;
    this.currentLevelId = levelId;

    // Enter new level
    this.currentLevel.enter();

    // Update title
    this.updateLevelTitle(nextLevel.config.name);

    // Sync player position with GameScene
    const startNode = nextLevel.config.startNode;
    this.onPlayerPositionSync?.(startNode);

    // Reset timer
    this.resetTimer();
  }

  getGameState(): GameState {
    const level = this.currentLevel as BaseLevel | null;
    
    return {
      currentLevelId: this.currentLevelId,
      currentNode: level?.getCurrentNode() ?? 'A',
      roomCounts: level?.getRoomCounts() ?? { A: 0, B: 0, C: 0, D: 0 },
      matrixValues: level?.getMatrixValues() ?? [0, 0, 0, 0, 0],
      scalarValue: level?.getScalarValue() ?? 1,
      savedMatrices: this.uiManager.getSavedMatrices(),
      elapsedMs: this.getElapsedMs(),
      isPaused: this.isPaused,
    };
  }

  resetCurrentLevel(): void {
    if (this.currentLevel) {
      this.currentLevel.reset();
      this.resetTimer();
    }
  }

  // ============ Event Handlers (called by GameScene) ============

  onArrowClicked(arrowKey: ArrowKey, from: NodeKey, to: NodeKey): void {
    this.currentLevel?.onArrowClicked?.(arrowKey, from, to);
  }

  onNodeChanged(node: NodeKey): void {
    this.currentLevel?.onNodeChanged?.(node);
  }

  onMatrixUpdated(): void {
    this.currentLevel?.onMatrixUpdated?.();
  }

  // ============ Update Loop ============

  update(): void {
    // Update timer display
    const elapsed = this.getElapsedMs();
    this.uiManager.updateTimer(elapsed);

    // Update current level
    if (this.currentLevel && !this.isPaused) {
      this.currentLevel.update(16); // Approximate delta
    }
  }

  // ============ Level Progression ============

  tryAdvanceLevel(): void {
    if (!this.currentLevel) return;

    // Validate current level
    const validation = this.currentLevel.validate?.() ?? { valid: true };
    
    if (!validation.valid) {
      if (validation.message) {
        alert(validation.message);
      }
      return;
    }

    // Get next level
    const nextId = getNextLevelId(this.currentLevelId);
    
    if (nextId === null) {
      alert('Great job! You completed all levels!');
      return;
    }

    // Reset and change to next level
    this.changeLevel(nextId);
  }

  // ============ Pause System ============

  pauseGame(): void {
    if (this.isPaused) return;
    
    this.isPaused = true;
    this.baseElapsedMs += this.scene.time.now - this.resumeStartMs;
    this.scene.tweens.pauseAll();
    
    if (!this.pauseOverlay) {
      this.buildPauseOverlay();
    }
    this.pauseOverlay!.setVisible(true);
    this.pauseBtn?.setText('Resume');
  }

  resumeGame(): void {
    if (!this.isPaused) return;
    
    this.isPaused = false;
    this.resumeStartMs = this.scene.time.now;
    this.scene.tweens.resumeAll();
    
    this.pauseOverlay?.setVisible(false);
    this.pauseBtn?.setText('Pause');
  }

  // ============ Private Methods ============

  private createLevelInstance(config: LevelConfig): ILevel {
    // Use custom level classes for levels 7, 8, 9
    switch (config.id) {
      case 7:
        return new Level7State(this.scene, config, this.boardManager, this.uiManager);
      case 8:
        return new Level8State(this.scene, config, this.boardManager, this.uiManager);
      case 9:
        return new Level9State(this.scene, config, this.boardManager, this.uiManager);
      default:
        // All other levels use BaseLevel - config drives behavior
        return new BaseLevel(this.scene, config, this.boardManager, this.uiManager);
    }
  }

  private updateLevelTitle(name: string): void {
    if (!this.levelTitleText) {
      this.levelTitleText = this.scene.add
        .text(GAME_WIDTH / 2, 10, name, {
          font: FONTS.title,
          color: '#000',
        })
        .setOrigin(0.5, 0)
        .setDepth(3000);
    } else {
      this.levelTitleText.setText(name);
    }
  }

  private resetTimer(): void {
    this.startTime = this.scene.time.now;
    this.baseElapsedMs = 0;
    this.resumeStartMs = this.scene.time.now;
  }

  private getElapsedMs(): number {
    let elapsed = this.baseElapsedMs;
    if (!this.isPaused) {
      elapsed += this.scene.time.now - this.resumeStartMs;
    }
    return elapsed;
  }

  private createPauseUI(): void {
    const width = this.scene.scale.width;

    this.pauseBtn = this.scene.add
      .text(width - 10, 10, 'Pause', {
        font: '20px Arial',
        color: '#fff',
        backgroundColor: '#333',
        padding: { left: 12, right: 12, top: 6, bottom: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(4000)
      .setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => {
      if (this.isPaused) { this.resumeGame(); } else { this.pauseGame(); }
    });

    this.scene.input.keyboard?.on('keydown-ESC', () => {
      if (this.isPaused) { this.resumeGame(); } else { this.pauseGame(); }
    });
  }

  private buildPauseOverlay(): void {
    const { width, height } = this.scene.scale;
    const overlay = this.scene.add.container(0, 0);

    // Dim background
    const dim = this.scene.add
      .rectangle(0, 0, width, height, 0x000000, 0.35)
      .setOrigin(0, 0)
      .setInteractive();
    overlay.add(dim);

    // Side panel
    const panelWidth = 460;
    const panel = this.scene.add
      .rectangle(width - panelWidth, 0, panelWidth, height, 0xffffff, 1)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x000000);
    overlay.add(panel);

    // Title
    const title = this.scene.add.text(width - panelWidth + 24, 24, 'Paused', {
      font: '28px Arial',
      color: '#000',
    });
    overlay.add(title);

    // Info text
    const infoText =
      'Click the red arrows to move the green circle. Each time the circle crosses a security camera, that camera increments its counter.';
    const info = this.scene.add.text(width - panelWidth + 24, 70, infoText, {
      font: '18px Arial',
      color: '#222',
      wordWrap: { width: panelWidth - 48 },
    });
    overlay.add(info);

    // Buttons
    const makeBtn = (y: number, label: string, bg: number, onClick: () => void) => {
      const btn = this.scene.add
        .text(width - panelWidth + 24, y, label, {
          font: '22px Arial',
          color: '#fff',
          backgroundColor: `#${bg.toString(16).padStart(6, '0')}`,
          padding: { left: 16, right: 16, top: 8, bottom: 8 },
        })
        .setInteractive({ useHandCursor: true });
      btn.on('pointerdown', onClick);
      overlay.add(btn);
      return btn;
    };

    makeBtn(220, 'Resume', 0x2e7d32, () => this.resumeGame());
    makeBtn(280, 'Reset', 0x616161, () => {
      this.resetCurrentLevel();
      this.resumeGame();
    });

    // Level select
    const lvlTitle = this.scene.add.text(width - panelWidth + 24, 350, 'Level Select', {
      font: '20px Arial',
      color: '#000',
    });
    overlay.add(lvlTitle);

    LEVELS.forEach((lvl, i) => {
      const lbtn = this.scene.add
        .text(width - panelWidth + 24, 390 + i * 40, lvl.name, {
          font: '20px Arial',
          color: '#0077cc',
        })
        .setInteractive({ useHandCursor: true });
      lbtn.on('pointerdown', () => {
        this.changeLevel(lvl.id);
        this.resumeGame();
      });
      overlay.add(lbtn);
    });

    overlay.setDepth(3500);
    overlay.setVisible(false);
    this.pauseOverlay = overlay;
  }

  private createControlButtons(): void {
    const { width, height } = this.scene.scale;
    const dy = height / 2 - 400;

    // Next button
    const nextBtn = this.scene.add
      .text(width - 40, height - 40, 'Next', {
        font: '28px Arial',
        color: '#fff',
        backgroundColor: '#333',
        padding: { left: 16, right: 16, top: 8, bottom: 8 },
      })
      .setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this.tryAdvanceLevel());

    // Animate button
    const btnWidth = 200;
    const btnHeight = 64;
    const btnContainer = this.scene.add.container(400, 600 + dy + 120);

    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x2f2f2f, 0.35);
    shadow.fillRoundedRect(-btnWidth / 2 + 6, -btnHeight / 2 + 6, btnWidth, btnHeight, 16);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0xff8c7f, 1);
    bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);

    const label = this.scene.add
      .text(0, 0, 'Animate', { font: '28px Arial', color: '#ffffff' })
      .setOrigin(0.5);

    const hit = this.scene.add
      .rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    btnContainer.add([shadow, bg, label, hit]);

    hit.on('pointerdown', () => this.handleAnimateButton());
    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xffa092, 1);
      bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);
    });
    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xff8c7f, 1);
      bg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 16);
    });
  }

  private async handleAnimateButton(): Promise<void> {
    // Get current matrix values
    const level = this.currentLevel as BaseLevel | null;
    if (!level) return;

    const matrixInput = this.uiManager.getMatrixInput();
    const cVals: number[] = [];
    for (let i = 0; i < 5; i++) {
      cVals.push(matrixInput.getValue(i));
    }

    // Simulate path and animate
    const startNode = level.config.startNode;
    await this.boardManager.movePlayerTo(startNode, false);

    const path = this.simulateHallwayPath(startNode, cVals);

    for (let i = 1; i < path.length; i++) {
      const _from = path[i - 1];
      const to = path[i];
      await this.boardManager.movePlayerTo(to, true);
      level.onNodeChanged?.(to);
    }
  }

  private simulateHallwayPath(start: NodeKey, matrix: number[]): NodeKey[] {
    const path: NodeKey[] = [start];
    const cams = [...matrix];
    let current: NodeKey = start;
    let guard = 0;

    const transitions = [
      { from: 'A' as NodeKey, to: 'B' as NodeKey, camIdx: 0 },
      { from: 'B' as NodeKey, to: 'C' as NodeKey, camIdx: 1 },
      { from: 'C' as NodeKey, to: 'D' as NodeKey, camIdx: 2 },
      { from: 'C' as NodeKey, to: 'A' as NodeKey, camIdx: 3 },
      { from: 'D' as NodeKey, to: 'A' as NodeKey, camIdx: 4 },
    ];

    while (guard < 1000) {
      let moved = false;

      // Special handling for node C (two options)
      if (current === 'C') {
        const canC3 = (cams[2] || 0) > 0;
        const canC4 = (cams[3] || 0) > 0;
        if (!canC3 && !canC4) break;

        const moreWorkFromA = (cams[0] || 0) > 0 || (cams[1] || 0) > 0;
        if (canC4 && (!canC3 || ((cams[4] || 0) === 0 && moreWorkFromA))) {
          cams[3]--;
          current = 'A';
          path.push(current);
          moved = true;
        } else if (canC3) {
          cams[2]--;
          current = 'D';
          path.push(current);
          moved = true;
        }
      } else {
        for (const t of transitions) {
          if (t.from === current && (cams[t.camIdx] || 0) > 0) {
            cams[t.camIdx]--;
            current = t.to;
            path.push(current);
            moved = true;
            break;
          }
        }
      }

      if (!moved) break;
      guard++;
    }

    return path;
  }
}
