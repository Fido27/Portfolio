import * as Phaser from 'phaser';
import { BoardManager } from '../managers/BoardManager';
import { UIManager } from '../managers/UIManager';
import { StateManager } from '../managers/StateManager';
import { ArrowKey, NodeKey } from '../types';
import { HALLWAY_TRANSITIONS } from '../config/constants';

export class GameScene extends Phaser.Scene {
  private boardManager!: BoardManager;
  private uiManager!: UIManager;
  private stateManager!: StateManager;

  private currentPlayerNode: NodeKey = 'A';
  private isAnimating: boolean = false;

  constructor() {
    super('GameScene');
  }

  preload(): void {
    this.load.image('red_arrow', '/hallways/red_arrow.webp');
    this.load.image('security_cam', '/hallways/security_cam.png');
  }

  create(): void {
    // Create managers
    this.boardManager = new BoardManager(this);
    this.uiManager = new UIManager(this);
    this.stateManager = new StateManager(this, this.boardManager, this.uiManager);

    // Initialize board (diagram, arrows, player)
    this.boardManager.create((arrowKey, from, to) => {
      this.handleArrowClick(arrowKey, from, to);
    });

    // Initialize UI (vector, save slots, etc.)
    this.uiManager.create(
      () => this.stateManager.onMatrixUpdated(),
      (index, values) => this.handleSlotClick(index, values)
    );

    // Initialize state manager (levels, pause, controls)
    // Pass callback to sync player position when level changes
    this.stateManager.create(
      (levelId) => console.log(`Level ${levelId} completed!`),
      (node) => this.syncPlayerPosition(node)
    );

    // Start at Level 1
    this.stateManager.changeLevel(1);
  }

  update(): void {
    this.stateManager.update();
  }

  // ============ Event Handlers ============

  private handleArrowClick(arrowKey: ArrowKey, from: NodeKey, to: NodeKey): void {
    if (this.isAnimating) return;

    // Find the transition
    const transition = HALLWAY_TRANSITIONS.find(t => t.arrowKey === arrowKey);
    if (!transition) return;

    // Notify state manager
    this.stateManager.onArrowClicked(arrowKey, from, to);

    // Move player if currently at the source node
    if (this.currentPlayerNode === from) {
      this.movePlayer(to);
    }
  }

  private async movePlayer(to: NodeKey): Promise<void> {
    this.isAnimating = true;
    
    await this.boardManager.movePlayerTo(to, true);
    
    this.currentPlayerNode = to;
    this.stateManager.onNodeChanged(to);
    
    this.isAnimating = false;
  }

  // Called by StateManager when level changes to sync player position
  private syncPlayerPosition(node: NodeKey): void {
    this.currentPlayerNode = node;
  }

  private handleSlotClick(_index: number, _values: number[] | null): void {
    // Slot loading is handled by UIManager
    // Additional level-specific behavior can be added here
  }
}
