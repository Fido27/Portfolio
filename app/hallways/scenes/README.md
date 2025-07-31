# Hallways Game - Modular Architecture

This directory contains the refactored hallways game with a modular state-based architecture.

## File Structure

### Core Files
- `hallwaysGame.tsx` - Original monolithic game file (670 lines)
- `hallwaysGameRefactored.tsx` - New modular main game file (400 lines)
- `matrixDrawUtils.ts` - Utility functions for drawing matrices and diagrams
- `mainMenu.tsx` - Main menu scene

### State Management
- `gameStateManager.ts` - Manages state transitions and coordinates between game states
- `states/baseState.ts` - Abstract base class for all game states with common functionality
- `states/sandboxState.ts` - Sandbox state with full UI controls and testing features
- `states/partAState.ts` - Part A question state showing first vector display
- `states/partBState.ts` - Part B question state showing both vector displays
- `states/finalState.ts` - Final state for user input challenge

## Architecture Overview

### State Pattern Implementation
The game uses a state pattern where each game state is a separate class that:
- Extends `BaseState` for common functionality
- Implements `enter()`, `exit()`, and `update()` methods
- Manages its own UI visibility and interactions
- Shares data through a common `GameStateData` interface

### Shared Data Structure
```typescript
interface GameStateData {
  matrixInput?: any;                    // Matrix input component
  greenCircle?: Phaser.GameObjects.Arc; // Player position indicator
  arrows?: { [key: string]: Phaser.GameObjects.Image }; // Navigation arrows
  sandboxContainer?: Phaser.GameObjects.Container; // Sandbox UI container
  questionPrompt?: Phaser.GameObjects.Text; // Question text
  aLabel?: Phaser.GameObjects.Text;     // Part A label
  bLabel?: Phaser.GameObjects.Text;     // Part B label
  aVector?: Phaser.GameObjects.Group;   // Part A vector display
  bVector?: Phaser.GameObjects.Group;   // Part B vector display
  peopleCellText?: Phaser.GameObjects.Text; // People count input
  selectedStart: string | null;         // Selected start location
  selectedDest: string | null;          // Selected destination
  peopleValue: string;                  // Number of people value
  inputMatrixEnabled: boolean;          // Matrix input toggle
  arrowsEnabled: boolean;               // Arrows toggle
  isPlaying: boolean;                   // Animation state
}
```

### Game States
1. **Sandbox State (0)** - Full testing environment with all controls
2. **Part A State (1)** - Shows first question and vector [3,3,3,0,3]
3. **Part B State (2)** - Shows both questions and vectors [5,5,3,2,3]
4. **Final State (3)** - User input challenge for looping matrix

## Benefits of Refactoring

### Code Organization
- **Separation of Concerns**: Each state manages its own UI and logic
- **Maintainability**: Easier to modify individual states without affecting others
- **Readability**: Smaller, focused files instead of one large file

### Reusability
- **Base State**: Common functionality shared across all states
- **State Manager**: Centralized state transition logic
- **Shared Data**: Consistent data access across all states

### Extensibility
- **New States**: Easy to add new game states by extending BaseState
- **State Logic**: Each state can have its own validation and behavior
- **UI Management**: States can show/hide UI elements independently

## Usage

To use the refactored version:
1. Replace `hallwaysGame.tsx` with `hallwaysGameRefactored.tsx` in your imports
2. The game will automatically use the new state management system
3. All existing functionality is preserved with better organization

## Migration Notes

The refactored version maintains 100% compatibility with the original:
- Same game mechanics and logic
- Same UI layout and interactions
- Same validation rules and state transitions
- Same asset loading and rendering

The main difference is internal organization for better maintainability and extensibility. 