import * as Phaser from 'phaser';
import { 
  ILevel, 
  LevelConfig, 
  NodeKey, 
  ArrowKey, 
  ValidationResult,
  RoomCounts,
  IBoardManager,
  IUIManager,
} from '../types';
import { NODE_ARROWS, HALLWAY_TRANSITIONS } from '../config/constants';

/**
 * BaseLevel - Contains ALL shared functionality for levels.
 * Individual levels only need to override specific behavior.
 */
export class BaseLevel implements ILevel {
  protected scene: Phaser.Scene;
  protected boardManager: IBoardManager;
  protected uiManager: IUIManager;
  protected _config: LevelConfig;
  
  // Level state
  protected currentNode: NodeKey;
  protected roomCounts: RoomCounts;
  protected matrixValues: number[];
  protected scalarValue: number;

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
    
    // Initialize state from config
    this.currentNode = config.startNode;
    this.roomCounts = { ...config.initialRoomCounts };
    this.matrixValues = [0, 0, 0, 0, 0];
    this.scalarValue = config.defaultScalar ?? 1;
  }

  get config(): LevelConfig {
    return this._config;
  }

  // ============ Lifecycle Methods ============

  enter(): void {
    // Reset state
    this.currentNode = this._config.startNode;
    this.roomCounts = { ...this._config.initialRoomCounts };
    this.matrixValues = [0, 0, 0, 0, 0];
    this.scalarValue = this._config.defaultScalar ?? 1;

    // Configure UI based on config
    this.uiManager.showPrompt(this._config.prompt);
    this.uiManager.setMatrixBracketsVisible(this._config.showMatrixBrackets);
    this.uiManager.setCameraLabelsVisible(this._config.showCameraLabels);
    this.uiManager.setSaveUIVisible(this._config.showSaveUI);
    this.uiManager.setScalarUIVisible(this._config.showScalarUI ?? false);
    
    if (this._config.showScalarUI && this._config.defaultScalar !== undefined) {
      this.uiManager.setScalarValue(this._config.defaultScalar);
    }

    // Configure matrix
    const matrixInput = this.uiManager.getMatrixInput();
    matrixInput.setEnabled(this._config.matrixEnabled);
    matrixInput.reset();

    // Configure board
    this.boardManager.setArrowsEnabled(this._config.arrowsEnabled);
    this.boardManager.movePlayerTo(this._config.startNode, false);
    this.boardManager.updateRoomDots(this.roomCounts);

    // Update occupancy
    this.uiManager.updateOccupancyVector(this.roomCounts);

    // Restrict arrows if needed
    if (this._config.restrictArrowsToCurrentNode) {
      this.updateArrowsForNode(this.currentNode);
    }
  }

  exit(): void {
    this.uiManager.hidePrompt();
  }

  update(_delta: number): void {
    // Override in subclasses if needed
  }

  reset(): void {
    this.enter();
  }

  // ============ Event Handlers ============

  onNodeChanged(node: NodeKey): void {
    this.currentNode = node;
    
    if (this._config.restrictArrowsToCurrentNode) {
      this.updateArrowsForNode(node);
    }
  }

  onMatrixUpdated(): void {
    // Sync matrix values from UI
    const matrixInput = this.uiManager.getMatrixInput();
    for (let i = 0; i < 5; i++) {
      this.matrixValues[i] = matrixInput.getValue(i);
    }

    // Update result vector if scalar UI is shown
    if (this._config.showScalarUI) {
      this.scalarValue = this.uiManager.getScalarValue();
      const result = this.matrixValues.map(v => v * this.scalarValue);
      this.uiManager.updateResultVector(result);
    }
  }

  onArrowClicked(arrowKey: ArrowKey, from: NodeKey, to: NodeKey): void {
    // Find which camera this transition uses
    const transition = HALLWAY_TRANSITIONS.find(t => t.arrowKey === arrowKey);
    if (!transition) return;

    // Increment the camera counter
    this.incrementMatrix(transition.cameraIndex);

    // Transfer people between rooms
    this.transferPeople(from, to);

    // Pulse the arrow
    this.boardManager.pulseArrow(arrowKey);
  }

  // ============ Validation ============

  validate(): ValidationResult {
    // Use custom validation if provided
    if (this._config.customValidation) {
      return this._config.customValidation(this.getState());
    }

    // Check target vector
    if (this._config.targetVector) {
      const target = this._config.targetVector;
      for (let i = 0; i < 5; i++) {
        if (this.matrixValues[i] > target[i]) {
          return { valid: false, message: 'The circle traveled more than required.' };
        }
        if (this.matrixValues[i] < target[i]) {
          return { valid: false, message: "The values don't match" };
        }
      }
    }

    // Check target end node
    if (this._config.targetEndNode) {
      if (this.currentNode !== this._config.targetEndNode) {
        return { 
          valid: false, 
          message: `Not quite yet — end at ${this._config.targetEndNode} to proceed.` 
        };
      }
    }

    return { valid: true };
  }

  // ============ Protected Helpers ============

  protected updateArrowsForNode(node: NodeKey): void {
    const allowedArrows = NODE_ARROWS[node];
    const allArrows: ArrowKey[] = ['left', 'top', 'right', 'center', 'bottom'];
    
    allArrows.forEach(arrowKey => {
      this.boardManager.setArrowEnabled(arrowKey, allowedArrows.includes(arrowKey));
    });
  }

  protected incrementMatrix(cameraIndex: number): void {
    const matrixInput = this.uiManager.getMatrixInput();
    const increment = this._config.movementMultiplier ?? 1;
    const currentValue = matrixInput.getValue(cameraIndex);
    matrixInput.setValue(cameraIndex, currentValue + increment);
    
    this.matrixValues[cameraIndex] = matrixInput.getValue(cameraIndex);

    // Update result vector if scalar UI is shown
    if (this._config.showScalarUI) {
      const result = this.matrixValues.map(v => v * this.scalarValue);
      this.uiManager.updateResultVector(result);
    }
  }

  protected transferPeople(from: NodeKey, to: NodeKey): void {
    const available = this.roomCounts[from];
    if (available <= 0 && this._config.id !== 0) return; // Sandbox allows 0

    const delta = this._config.movementMultiplier ?? 1;
    const moveAmount = Math.min(available, delta);
    
    if (moveAmount > 0 || this._config.id === 0) {
      this.roomCounts[from] = Math.max(0, available - moveAmount);
      this.roomCounts[to] = (this.roomCounts[to] || 0) + moveAmount;
      
      this.boardManager.updateRoomDots(this.roomCounts);
      this.uiManager.updateOccupancyVector(this.roomCounts);
    }
  }

  protected getState() {
    return {
      currentLevelId: this._config.id,
      currentNode: this.currentNode,
      roomCounts: { ...this.roomCounts },
      matrixValues: [...this.matrixValues],
      scalarValue: this.scalarValue,
      savedMatrices: this.uiManager.getSavedMatrices(),
      elapsedMs: 0,
      isPaused: false,
    };
  }

  // ============ Public State Access ============

  getCurrentNode(): NodeKey {
    return this.currentNode;
  }

  getRoomCounts(): RoomCounts {
    return { ...this.roomCounts };
  }

  getMatrixValues(): number[] {
    return [...this.matrixValues];
  }

  getScalarValue(): number {
    return this.scalarValue;
  }
}
