import Phaser from 'phaser';

// ============ Core Types ============

export type NodeKey = 'A' | 'B' | 'C' | 'D';

export interface Position {
  x: number;
  y: number;
}

export interface NodeCoords {
  A: Position;
  B: Position;
  C: Position;
  D: Position;
}

export interface RoomCounts {
  A: number;
  B: number;
  C: number;
  D: number;
}

// ============ Hallway/Camera Types ============

export interface HallwayTransition {
  from: NodeKey;
  to: NodeKey;
  cameraIndex: number;
  arrowKey: ArrowKey;
}

export type ArrowKey = 'left' | 'top' | 'right' | 'center' | 'bottom';

// ============ Vector Input Types ============

export interface VectorCell {
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  row: number;
  col: number;
}

export interface VectorInput {
  cells: VectorCell[][];
  values: number[];
  setValue: (row: number, value: number) => void;
  getValue: (row: number) => number;
  setEnabled: (enabled: boolean) => void;
  reset: () => void;
}

// Backward compatibility aliases
export type MatrixCell = VectorCell;
export type MatrixInput = VectorInput;

// ============ Level Configuration ============

export interface LevelConfig {
  id: number;
  name: string;
  prompt: string;
  initialRoomCounts: RoomCounts;
  startNode: NodeKey;
  
  // Feature flags
  matrixEnabled: boolean;
  arrowsEnabled: boolean;
  showMatrixBrackets: boolean;
  showCameraLabels: boolean;
  showSaveUI: boolean;
  restrictArrowsToCurrentNode: boolean;
  
  // Optional validation
  targetVector?: number[];
  targetEndNode?: NodeKey;
  
  // Optional multiplier for movement
  movementMultiplier?: number;
  
  // Custom validation function (for complex levels)
  customValidation?: (gameState: GameState) => ValidationResult;
  
  // Scalar multiplication UI (Level 5, 6)
  showScalarUI?: boolean;
  defaultScalar?: number;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

// ============ Game State ============

export interface GameState {
  currentLevelId: number;
  currentNode: NodeKey;
  roomCounts: RoomCounts;
  matrixValues: number[];
  scalarValue: number;
  savedMatrices: (number[] | null)[];
  elapsedMs: number;
  isPaused: boolean;
}

// ============ Level State Interface ============

export interface ILevel {
  readonly config: LevelConfig;
  
  enter(): void;
  exit(): void;
  update(delta: number): void;
  
  onNodeChanged?(node: NodeKey): void;
  onMatrixUpdated?(): void;
  onArrowClicked?(arrowKey: ArrowKey, from: NodeKey, to: NodeKey): void;
  
  validate?(): ValidationResult;
  reset(): void;
}

// ============ Manager Interfaces ============

export interface IBoardManager {
  getNodeCoords(): NodeCoords;
  movePlayerTo(node: NodeKey, animate?: boolean): Promise<void>;
  setArrowsEnabled(enabled: boolean): void;
  setArrowEnabled(arrowKey: ArrowKey, enabled: boolean): void;
  getArrowsForNode(node: NodeKey): ArrowKey[];
  pulseArrow(arrowKey: ArrowKey): void;
  updateRoomDots(counts: RoomCounts): void;
}

export interface IUIManager {
  getMatrixInput(): MatrixInput;
  setMatrixBracketsVisible(visible: boolean): void;
  setCameraLabelsVisible(visible: boolean): void;
  showPrompt(text: string): void;
  hidePrompt(): void;
  updateOccupancyVector(counts: RoomCounts): void;
  updateTimer(elapsedMs: number): void;
  
  // Save UI
  setSaveUIVisible(visible: boolean): void;
  getSavedMatrices(): (number[] | null)[];
  saveToSlot(index: number, values: number[]): void;
  loadFromSlot(index: number): number[] | null;
  
  // Scalar UI (Level 5, 6)
  setScalarUIVisible(visible: boolean): void;
  getScalarValue(): number;
  setScalarValue(value: number): void;
  updateResultVector(values: number[]): void;
}

export interface IStateManager {
  getCurrentLevel(): ILevel | null;
  getCurrentLevelId(): number;
  changeLevel(levelId: number): void;
  getGameState(): GameState;
  resetCurrentLevel(): void;
}

// ============ Event Types ============

export type GameEventType = 
  | 'arrow-clicked'
  | 'node-changed'
  | 'matrix-updated'
  | 'level-changed'
  | 'game-paused'
  | 'game-resumed'
  | 'level-completed';

export interface GameEvent {
  type: GameEventType;
  data?: unknown;
}

// ============ Camera Configuration ============

export interface CameraConfig {
  x: number;
  y: number;
  angle: number;
  label: string;
  offsetX: number;
  offsetY: number;
  scale: number;
}
