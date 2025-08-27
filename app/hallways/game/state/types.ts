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
  selectedStart: NodeKey | null;
  selectedDest: NodeKey | null;
  peopleValue: string;
  hallwayCount: number;
  roomCounts: { A: number; B: number; C: number; D: number };
  currentNode: NodeKey;
  nodeCoords?: Record<NodeKey, { x: number; y: number }>;
  roomDots?: { [key in NodeKey]?: Phaser.GameObjects.Group };
}

export interface GameState {
  enter(): void;
  exit(): void;
  update(): void;
}


