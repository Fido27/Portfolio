import * as Phaser from 'phaser';

export interface MatrixInputCell {
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  row: number;
  col: number;
}

export interface MatrixInput {
  cells: MatrixInputCell[][];
  values: string[][];
  setValue: (row: number, col: number, value: string) => void;
  getValue: (row: number, col: number) => string;
}

export type NodeKey = 'A'|'B'|'C'|'D';

export interface SharedData {
  matrixInput?: MatrixInput;
  matrixFrame?: Phaser.GameObjects.Graphics;
  matrixLabels?: Phaser.GameObjects.Text[];
  greenCircle?: Phaser.GameObjects.Arc;
  greenCircleText?: Phaser.GameObjects.Text;
  arrows?: { [key: string]: Phaser.GameObjects.GameObject };
  occupancyVector?: Phaser.GameObjects.Group;
  // Sandbox UI elements
  sandboxContainer?: Phaser.GameObjects.Container;
  peopleCellText?: Phaser.GameObjects.Text;
  roomPeopleTexts?: { A?: Phaser.GameObjects.Text; B?: Phaser.GameObjects.Text; C?: Phaser.GameObjects.Text; D?: Phaser.GameObjects.Text };
  roomPeopleRects?: { A?: Phaser.GameObjects.Rectangle; B?: Phaser.GameObjects.Rectangle; C?: Phaser.GameObjects.Rectangle; D?: Phaser.GameObjects.Rectangle };
  // Save Presets UI elements
  saveUIContainer?: Phaser.GameObjects.Container;
  saveButton?: Phaser.GameObjects.Text;
  saveSlots?: Phaser.GameObjects.Container[];
  savedMatrices?: number[][]; // per-slot saved 5x1 vectors
  saveModeActive?: boolean;
  selectedStart: NodeKey | null;
  selectedDest: NodeKey | null;
  peopleValue: string;
  roomCounts: { A: number; B: number; C: number; D: number };
  currentNode: NodeKey;
  nodeCoords?: Record<NodeKey, { x: number; y: number }>;
  roomCenters?: Record<NodeKey, { x: number; y: number }>;
  roomDots?: { [key in NodeKey]?: Phaser.GameObjects.Group };
  // Toggles
  inputMatrixEnabled?: boolean;
  arrowsEnabled?: boolean;
}

export interface GameState {
  enter(): void;
  exit(): void;
  update(): void;
}


