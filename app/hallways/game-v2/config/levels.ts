import { LevelConfig, RoomCounts, GameState, ValidationResult } from '../types';

// ============ Default Room Counts ============

const STANDARD_COUNTS: RoomCounts = { A: 5, B: 5, C: 5, D: 5 };
const EMPTY_COUNTS: RoomCounts = { A: 0, B: 0, C: 0, D: 0 };
const ELEVATED_COUNTS: RoomCounts = { A: 8, B: 8, C: 8, D: 8 }; // For Level 6+

// ============ Level Configurations ============

export const LEVELS: LevelConfig[] = [
  // ============ SANDBOX (id: 0) ============
  {
    id: 0,
    name: 'Sandbox',
    prompt: 'Sandbox Mode\n\nExperiment freely! Click arrows to move the green circle. Edit vector values directly or use the Save button to store presets.',
    initialRoomCounts: EMPTY_COUNTS,
    startNode: 'A',
    matrixEnabled: true,
    arrowsEnabled: true,
    showMatrixBrackets: true,
    showCameraLabels: true,
    showSaveUI: true,
    restrictArrowsToCurrentNode: false,
  },

  // ============ LEVEL 1 (id: 1) ============
  {
    id: 1,
    name: 'Level 1',
    prompt: 'Level 1:\n\nClick the red arrows to move the green circle. Every time the circle crosses a security camera, the camera increments its counter.\n\nCan you trace a path that matches the counters below:\n\nC1 : 3\nC2 : 3\nC3 : 3\nC4 : 0\nC5 : 3',
    initialRoomCounts: STANDARD_COUNTS,
    startNode: 'A',
    matrixEnabled: false,
    arrowsEnabled: true,
    showMatrixBrackets: false,
    showCameraLabels: true,
    showSaveUI: false,
    restrictArrowsToCurrentNode: true,
    targetVector: [3, 3, 3, 0, 3],
  },

  // ============ LEVEL 2 (id: 2) ============
  {
    id: 2,
    name: 'Level 2',
    prompt: 'Level 2:\n\nClick the red arrows to move the green circle. Every time the circle crosses a security camera, the camera increments its counter.\n\nCan you trace a path that matches the counters below:\n\nC1 : 5\nC2 : 5\nC3 : 3\nC4 : 2\nC5 : 3',
    initialRoomCounts: STANDARD_COUNTS,
    startNode: 'A',
    matrixEnabled: false,
    arrowsEnabled: true,
    showMatrixBrackets: false,
    showCameraLabels: true,
    showSaveUI: false,
    restrictArrowsToCurrentNode: true,
    targetVector: [5, 5, 3, 2, 3],
  },

  // ============ LEVEL 3 (id: 3) ============
  {
    id: 3,
    name: 'Level 3',
    prompt: 'Level 3:\n\nCan you help Ella and Jack reach the Drama Room from the Art room, using any path?\n\nNotice how the camera values change as they cross the camera paths in the hallways.',
    initialRoomCounts: STANDARD_COUNTS,
    startNode: 'A',
    matrixEnabled: false,
    arrowsEnabled: true,
    showMatrixBrackets: false,
    showCameraLabels: true,
    showSaveUI: false,
    restrictArrowsToCurrentNode: true,
    movementMultiplier: 2,
    targetEndNode: 'D',
  },

  // ============ LEVEL 4 (id: 4) ============
  {
    id: 4,
    name: 'Level 4',
    prompt: 'Save a vector that represents one round of the hallways, starting from Room A, visiting all the rooms and then ending up at Room A.\n\nMove the green circle to trace the path. When done, press Save and choose a slot.',
    initialRoomCounts: STANDARD_COUNTS,
    startNode: 'A',
    matrixEnabled: true,
    arrowsEnabled: true,
    showMatrixBrackets: true,
    showCameraLabels: true,
    showSaveUI: true,
    restrictArrowsToCurrentNode: false,
  },

  // ============ LEVEL 5 (id: 5) ============
  {
    id: 5,
    name: 'Level 5',
    prompt: 'For this level, every time you move someone from a room, 1 of their friends also tag along.\n\nCan you match the resulting values with [6,6,6,0,6]?',
    initialRoomCounts: STANDARD_COUNTS, // Level 5 still uses 5
    startNode: 'A',
    matrixEnabled: true,
    arrowsEnabled: true,
    showMatrixBrackets: true,
    showCameraLabels: true,
    showSaveUI: true,
    restrictArrowsToCurrentNode: false,
    showScalarUI: true,
    defaultScalar: 2,
    customValidation: (state: GameState): ValidationResult => {
      const target = [6, 6, 6, 0, 6];
      const result = state.matrixValues.map(v => v * state.scalarValue);
      for (let i = 0; i < 5; i++) {
        if (result[i] !== target[i]) {
          return { valid: false, message: "The values don't match" };
        }
      }
      return { valid: true };
    },
  },

  // ============ LEVEL 6 (id: 6) ============
  {
    id: 6,
    name: 'Level 6',
    prompt: 'Use your saved vector to trace the path [8,8,8,0,8]. You can change the multiplier. To edit the saved vector, go to a previous level.',
    initialRoomCounts: ELEVATED_COUNTS, // Level 6+ uses 8
    startNode: 'A',
    matrixEnabled: false, // Locked - populated from saved
    arrowsEnabled: true,
    showMatrixBrackets: true,
    showCameraLabels: true,
    showSaveUI: true,
    restrictArrowsToCurrentNode: false,
    showScalarUI: true,
    defaultScalar: 1,
    customValidation: (state: GameState): ValidationResult => {
      const target = [8, 8, 8, 0, 8];
      const result = state.matrixValues.map(v => v * state.scalarValue);
      for (let i = 0; i < 5; i++) {
        if (result[i] !== target[i]) {
          return { valid: false, message: "The values don't match" };
        }
      }
      return { valid: true };
    },
  },

  // ============ LEVEL 7 (id: 7) ============
  // Custom level: Given camera vector, find delta vector
  {
    id: 7,
    name: 'Level 7',
    prompt: '', // Custom level handles its own prompt
    initialRoomCounts: ELEVATED_COUNTS,
    startNode: 'A',
    matrixEnabled: false, // Custom UI
    arrowsEnabled: true,
    showMatrixBrackets: false,
    showCameraLabels: false,
    showSaveUI: false,
    restrictArrowsToCurrentNode: false,
  },

  // ============ LEVEL 8 (id: 8) ============
  // Custom level: Given delta vector, find camera vector
  {
    id: 8,
    name: 'Level 8',
    prompt: '', // Custom level handles its own prompt
    initialRoomCounts: ELEVATED_COUNTS,
    startNode: 'A',
    matrixEnabled: true,
    arrowsEnabled: true,
    showMatrixBrackets: true,
    showCameraLabels: true,
    showSaveUI: false,
    restrictArrowsToCurrentNode: false,
  },

  // ============ LEVEL 9 (id: 9) ============
  // Custom level: Linear combination a×M + b×N
  {
    id: 9,
    name: 'Level 9',
    prompt: '', // Custom level handles its own prompt
    initialRoomCounts: ELEVATED_COUNTS,
    startNode: 'A',
    matrixEnabled: false, // Custom UI
    arrowsEnabled: false,
    showMatrixBrackets: false,
    showCameraLabels: false,
    showSaveUI: true, // Needs slots for selection
    restrictArrowsToCurrentNode: false,
  },
];

// ============ Helper Functions ============

export function getLevelConfig(id: number): LevelConfig | undefined {
  return LEVELS.find(l => l.id === id);
}

export function getNextLevelId(currentId: number): number | null {
  const maxId = Math.max(...LEVELS.map(l => l.id));
  if (currentId >= maxId) return null;
  return currentId + 1;
}

export function getLevelCount(): number {
  return LEVELS.length;
}
