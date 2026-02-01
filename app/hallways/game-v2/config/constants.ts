import { NodeKey, ArrowKey, HallwayTransition, CameraConfig, Position } from '../types';

// ============ Game Dimensions ============

export const GAME_WIDTH = 1750;
export const GAME_HEIGHT = 1000;
export const DIAGRAM_CENTER_X = 400;
export const DIAGRAM_CENTER_Y = 400;

// ============ Room Colors ============

export const ROOM_COLORS: Record<NodeKey, number> = {
  A: 0x7da0f7,  // Blue - Art
  B: 0xff7070,  // Coral - Biology
  C: 0xffd43b,  // Yellow - Civics
  D: 0xff8c42,  // Orange - Drama
};

export const ROOM_NAMES: Record<NodeKey, string> = {
  A: 'Art',
  B: 'Biology',
  C: 'Civics',
  D: 'Drama',
};

// ============ Node Positions (relative to diagram center) ============

export const getNodeCoords = (dy: number): Record<NodeKey, Position> => ({
  A: { x: 240, y: 560 + dy },
  B: { x: 240, y: 240 + dy },
  C: { x: 560, y: 240 + dy },
  D: { x: 560, y: 560 + dy },
});

export const getRoomCenters = (dy: number): Record<NodeKey, Position> => ({
  A: { x: 200, y: 600 + dy },
  B: { x: 200, y: 200 + dy },
  C: { x: 600, y: 200 + dy },
  D: { x: 600, y: 600 + dy },
});

// ============ Arrow Positions ============

export const getArrowPositions = (dy: number): Record<ArrowKey, Position & { angle: number }> => ({
  left:   { x: 240, y: 400 + dy, angle: -90 },
  top:    { x: 400, y: 240 + dy, angle: 0 },
  right:  { x: 565, y: 400 + dy, angle: 90 },
  bottom: { x: 400, y: 565 + dy, angle: 180 },
  center: { x: 400, y: 400 + dy, angle: 135 },
});

// ============ Hallway Transitions (Arrow -> Camera mapping) ============

export const HALLWAY_TRANSITIONS: HallwayTransition[] = [
  { from: 'A', to: 'B', cameraIndex: 0, arrowKey: 'left' },    // C1: A -> B
  { from: 'B', to: 'C', cameraIndex: 1, arrowKey: 'top' },     // C2: B -> C
  { from: 'C', to: 'D', cameraIndex: 2, arrowKey: 'right' },   // C3: C -> D
  { from: 'C', to: 'A', cameraIndex: 3, arrowKey: 'center' },  // C4: C -> A
  { from: 'D', to: 'A', cameraIndex: 4, arrowKey: 'bottom' },  // C5: D -> A
];

// ============ Camera Configurations ============

export const getCameraConfigs = (dy: number): CameraConfig[] => [
  { x: 200, y: 400 + dy, angle: -40,  label: 'C1', offsetX: 20,  offsetY: -60, scale: 0.025 },
  { x: 400, y: 200 + dy, angle: 30,   label: 'C2', offsetX: -60, offsetY: 20,  scale: 0.025 },
  { x: 600, y: 400 + dy, angle: 150,  label: 'C3', offsetX: -10, offsetY: 80,  scale: 0.025 },
  { x: 400, y: 400 + dy, angle: 180,  label: 'C4', offsetX: -30, offsetY: 60,  scale: 0.025 },
  { x: 400, y: 600 + dy, angle: 225,  label: 'C5', offsetX: -70, offsetY: -20, scale: 0.025 },
];

// ============ Node -> Available Arrows Mapping ============

export const NODE_ARROWS: Record<NodeKey, ArrowKey[]> = {
  A: ['left'],
  B: ['top'],
  C: ['right', 'center'],
  D: ['bottom'],
};

// ============ Matrix UI Constants ============

export const MATRIX_CONFIG = {
  x: 1150,
  y: 620,
  rows: 5,
  cols: 1,
  cellSize: 50,
  spacing: 10,
  bracketWidth: 20,
  bracketOverlap: 4,
  lineWidth: 8,
};

// ============ Occupancy Vector UI ============

export const OCCUPANCY_CONFIG = {
  x: 1500,
  y: 620,
  rowSpacing: 30,
};

// ============ Prompt UI ============

export const PROMPT_CONFIG = {
  x: 1100,
  y: 120,
  width: 500,
  fontSize: 24,
};

// ============ Save Slots UI ============

export const SAVE_SLOTS_CONFIG = {
  baseX: 268,
  baseY: 114,
  gap: 90,
  width: 54,
  height: 90,
  hitPadding: 20,
  count: 4,
};

// ============ Animation Durations ============

export const ANIMATION = {
  playerMoveDuration: 400,
  arrowPulseDuration: 140,
  transferDotDuration: 300,
};

// ============ Room Dots Layout ============

export const ROOM_DOTS = {
  perRow: 4,
  spacing: 16,
  radius: 6,
  color: 0x2ecc40,
  yOffset: 24,
};

// ============ Fonts ============

export const FONTS = {
  title: '88px Arial',
  prompt: '24px Arial',
  button: '22px Arial',
  label: '20px Arial',
  timer: '20px Arial',
  matrix: '20px Arial',
};
