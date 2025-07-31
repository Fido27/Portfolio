import * as Phaser from 'phaser';
import { drawMatrixInput, drawVectorDisplay, MatrixInput, MatrixInputCell, drawDiagram } from './matrixDrawUtils';
import { GameStateManager } from './gameStateManager';
import { GameStateData } from './states/baseState';
// @ts-ignore
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';

export class HallwaysScene extends Phaser.Scene {
  private startTime!: number;
  private timerText!: Phaser.GameObjects.Text;
  private gameStateManager!: GameStateManager;
  private sharedData!: GameStateData;
  private nextBtn?: Phaser.GameObjects.Text;
  private gameState: number = 0; // 0: main menu, 1: part (a), 2: part (b), 3: final input
  private currentPosition: string = 'A'; // Track current position of green circle
  private visitedPositions: Set<string> = new Set(); // Track which positions have been visited

  // Helper: Hallway node positions
  private nodeCoords = {
    'A': { x: 240, y: 560 },
    'B': { x: 240, y: 240 },
    'C': { x: 560, y: 240 },
    'D': { x: 560, y: 560 }
  };

  // Helper: Hallway transitions (one-way)
  private hallwayTransitions = [
    { from: 'A', to: 'B', camIdx: 0 }, // C1
    { from: 'B', to: 'C', camIdx: 1 }, // C2
    { from: 'C', to: 'D', camIdx: 2 }, // C3
    { from: 'C', to: 'A', camIdx: 3 }, // C4
    { from: 'D', to: 'A', camIdx: 4 }  // C5
  ];

  // Simulate the path, return the sequence of nodes visited
  private simulateHallwayPath(start: string, matrix: number[]): string[] {
    let path: string[] = [start];
    let cams = matrix.slice();
    let current = start;
    let moved = true;
    while (moved) {
      moved = false;
      for (const t of this.hallwayTransitions) {
        if (t.from === current && cams[t.camIdx] > 0) {
          cams[t.camIdx]--;
          current = t.to;
          path.push(current);
          moved = true;
          break;
        }
      }
    }
    return path;
  }

  constructor() { super('HallwaysScene'); }

  preload() {
    this.load.image('red_arrow', '/hallways/red_arrow.webp');
    this.load.image('security_cam', '/hallways/security_cam.png');
  }

  create() {
    this.startTime = this.time.now;
    this.timerText = this.add.text(10, 10, '00:00', {
      font: '20px Arial',
      color: '#000'
    }).setOrigin(0, 0);

    // Initialize shared data
    this.sharedData = {
      selectedStart: 'A',
      selectedDest: 'A',
      peopleValue: '1',
      inputMatrixEnabled: true,
      arrowsEnabled: true,
      isPlaying: false
    };

    // Create UI elements and store in shared data
    this.createUIElements();

    // Initialize state manager
    this.gameStateManager = new GameStateManager(this, this.sharedData);

    // Set up arrow movement logic
    this.setupArrowLogic();

    // Set up navigation buttons
    this.setupNavigationButtons();

    // Set up game control buttons
    this.setupGameControls();

    // Start with sandbox state
    this.gameStateManager.changeState(0);
  }

  private createUIElements() {
    // Question prompt
    this.sharedData.questionPrompt = this.add.text(1100, 120,
      'Click on the red arrows to trace the route or routes Ella may have taken that correspond to the following camera data vectors:',
      {
        font: '24px Arial',
        color: '#222',
        wordWrap: { width: 500 }
      }
    );

    // Labels
    this.sharedData.aLabel = this.add.text(1100, 370, '(a)', { font: '22px Arial', color: '#222' });
    this.sharedData.bLabel = this.add.text(1250, 370, '(b)', { font: '22px Arial', color: '#222' });

    // Vector displays
    this.sharedData.aVector = drawVectorDisplay(this, 1160, 300, [3, 3, 3, 0, 3], 40);
    this.sharedData.bVector = drawVectorDisplay(this, 1310, 300, [5, 5, 3, 2, 3], 40);

    // Sandbox container
    this.sharedData.sandboxContainer = this.add.container(0, 0);

    // Draw diagram and store references
    const { greenCircle, arrows } = drawDiagram(this);
    this.sharedData.greenCircle = greenCircle;
    this.sharedData.arrows = arrows;

    // Draw input matrix
    this.sharedData.matrixInput = drawMatrixInput(this, 1150, 620, 5, 1, 50);
    for (let i = 0; i < 5; i++) {
      this.sharedData.matrixInput.setValue(i, 0, '0');
    }

    // Initially hide all question UI elements
    this.sharedData.questionPrompt.setVisible(false);
    this.sharedData.aLabel.setVisible(false);
    this.sharedData.bLabel.setVisible(false);
    this.sharedData.aVector.setVisible(false);
    this.sharedData.bVector.setVisible(false);
  }

  private setupArrowLogic() {
    if (!this.sharedData.arrows || !this.sharedData.greenCircle) return;

    const arrows = this.sharedData.arrows;
    const greenCircle = this.sharedData.greenCircle;

    arrows.left.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 240) < 2 && Math.abs(greenCircle.y - 560) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 240,
          duration: 400,
          ease: 'Power2',
          onComplete: () => this.updatePosition('B')
        });
        this.incrementMatrixValue(0, 0);
      }
    });

    arrows.top.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 240) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 560,
          y: 240,
          duration: 400,
          ease: 'Power2',
          onComplete: () => this.updatePosition('C')
        });
        this.incrementMatrixValue(1, 0);
      }
    });

    arrows.right.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 560,
          y: 560,
          duration: 400,
          ease: 'Power2',
          onComplete: () => this.updatePosition('D')
        });
        this.incrementMatrixValue(2, 0);
      }
    });

    arrows.bottom.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 560) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 560,
          duration: 400,
          ease: 'Power2',
          onComplete: () => this.updatePosition('A')
        });
        this.incrementMatrixValue(4, 0);
      }
    });

    arrows.center.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 560,
          duration: 400,
          ease: 'Power2',
          onComplete: () => this.updatePosition('A')
        });
        this.incrementMatrixValue(3, 0);
      }
    });
  }

  private updatePosition(newPosition: string) {
    this.currentPosition = newPosition;
    this.visitedPositions.add(newPosition);
    
    // Handle people count changes based on position (only in final state)
    if (this.gameState === 3) {
      this.handlePeopleCountChange(newPosition);
    }
  }

  private handlePeopleCountChange(position: string) {
    // Check if this is the first time visiting this position
    if (this.visitedPositions.has(position) && this.visitedPositions.size === 1) {
      // First time visiting this position
      if (position === 'C') {
        // Ella picks up a friend at the Civics classroom
        this.sharedData.peopleValue = '2';
        if (this.sharedData.peopleCellText) {
          this.sharedData.peopleCellText.setText('2');
        }
      }
    } else if (position === 'B' && this.sharedData.peopleValue === '2') {
      // After reaching C (people = 2), when they go to Biology Lab (B), pick up 3 more friends
      this.sharedData.peopleValue = '5';
      if (this.sharedData.peopleCellText) {
        this.sharedData.peopleCellText.setText('5');
      }
    }
    // Add more position-based people count changes here later
  }

  private incrementMatrixValue(row: number, col: number) {
    if (!this.sharedData.matrixInput) return;
    
    const prev = parseInt(this.sharedData.matrixInput.getValue(row, col)) || 0;
    let inc = 1;
    if (typeof this.sharedData.peopleValue !== 'undefined') {
      const parsed = parseInt(this.sharedData.peopleValue);
      if (!isNaN(parsed) && parsed > 0) inc = parsed;
    }
    this.sharedData.matrixInput.setValue(row, col, (prev + inc).toString());
  }

  private setupNavigationButtons() {
    const { width, height } = this.scale;
    
    // Prev button
    const prevBtn = this.add.text(40, height - 40, 'Prev', {
      font: '28px Arial',
      color: '#fff',
      backgroundColor: '#333',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    prevBtn.on('pointerdown', () => {
      if (this.gameState > 0) {
        this.gameState--;
        this.gameStateManager.changeState(this.gameState);
      }
    });

    // Next button
    this.nextBtn = this.add.text(width - 40, height - 40, 'Next', {
      font: '28px Arial',
      color: '#fff',
      backgroundColor: '#333',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    this.nextBtn.on('pointerdown', () => {
      this.handleNextButton();
    });
  }

  private setupGameControls() {
    // Play button
    const playBtn = this.add.text(1150 + 80, 620, '▶ Play', {
      font: '24px Arial',
      color: '#fff',
      backgroundColor: '#008800',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    // Reset button
    const resetBtn = this.add.text(1150 + 80, 680, 'Reset', {
      font: '24px Arial',
      color: '#fff',
      backgroundColor: '#666',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    // Validate button
    const validateBtn = this.add.text(1150 + 80, 740, 'Validate', {
      font: '24px Arial',
      color: '#fff',
      backgroundColor: '#0077cc',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    // Set up button handlers
    playBtn.on('pointerdown', () => this.handlePlayButton());
    resetBtn.on('pointerdown', () => this.handleResetButton());
    validateBtn.on('pointerdown', () => this.handleValidateButton());
  }

  private handleNextButton() {
    if (this.gameState === 0) {
      // Move to part (a)
      this.gameState = 1;
      this.gameStateManager.changeState(this.gameState);
      this.visitedPositions.clear();
    } else if (this.gameState === 1) {
      // Validate part (a) and move to part (b)
      const currentState = this.gameStateManager.getCurrentState();
      if (currentState && 'validateMatrix' in currentState) {
        const isValid = (currentState as any).validateMatrix();
        if (!isValid) {
          alert('Input matrix must be [3,3,3,0,3]');
          return;
        }
      }
      this.gameState = 2;
      this.gameStateManager.changeState(this.gameState);
      this.visitedPositions.clear();
    } else if (this.gameState === 2) {
      // Validate part (b) and move to final
      const currentState = this.gameStateManager.getCurrentState();
      if (currentState && 'validateMatrix' in currentState) {
        const isValid = (currentState as any).validateMatrix();
        if (!isValid) {
          alert('Input matrix must be [5,5,3,2,3]');
          return;
        }
      }
      this.gameState = 3;
      this.gameStateManager.changeState(this.gameState);
      this.visitedPositions.clear();
    }
  }

  private async handlePlayButton() {
    if (this.sharedData.isPlaying) return;
    
    this.sharedData.isPlaying = true;
    
    if (!this.sharedData.greenCircle || !this.sharedData.matrixInput) return;

    // Hide the original green circle before animating
    this.sharedData.greenCircle.setVisible(false);

    // Read c1-c5 from input matrix
    const cVals = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      cVals[i] = parseInt(this.sharedData.matrixInput.getValue(i, 0)) || 0;
    }

    // Reset green circle position to selected start
    let startNode = this.sharedData.selectedStart || 'A';
    const pos = this.nodeCoords[startNode as keyof typeof this.nodeCoords];
    this.sharedData.greenCircle.setPosition(pos.x, pos.y);
    this.sharedData.greenCircle.setVisible(true);

    // Simulate and animate the path
    const pathNodes = this.simulateHallwayPath(startNode, cVals);
    for (let i = 1; i < pathNodes.length; i++) {
      const pathPos = this.nodeCoords[pathNodes[i] as keyof typeof this.nodeCoords];
      await new Promise(res => {
        this.tweens.add({
          targets: this.sharedData.greenCircle,
          x: pathPos.x,
          y: pathPos.y,
          duration: 600,
          ease: 'Power2',
          onComplete: res
        });
      });
    }

    // Hide the green circle after animation
    this.sharedData.greenCircle.setVisible(false);
    this.sharedData.isPlaying = false;
    
    // Show the green circle again after animation is done
    this.sharedData.greenCircle.setVisible(true);
  }

  private handleResetButton() {
    const currentState = this.gameStateManager.getCurrentState();
    if (currentState && 'resetState' in currentState) {
      (currentState as any).resetState();
    }
    // Reset position tracking
    this.visitedPositions.clear();
    this.currentPosition = this.sharedData.selectedStart || 'A';
  }

  private async handleValidateButton() {
    // Check for trivial solution
    if (this.sharedData.matrixInput) {
      let allZero = true;
      for (let row = 0; row < this.sharedData.matrixInput.cells.length; row++) {
        for (let col = 0; col < this.sharedData.matrixInput.cells[row].length; col++) {
          if (parseInt(this.sharedData.matrixInput.getValue(row, col)) !== 0) {
            allZero = false;
            break;
          }
        }
      }
      if (allZero) {
        alert('This is the trivial solution');
        return;
      }
    }

    // Simulate play button
    await this.handlePlayButton();

    // Check final position
    const cVals = [0, 0, 0, 0, 0];
    for (let i = 0; i < 5; i++) {
      cVals[i] = parseInt(this.sharedData.matrixInput!.getValue(i, 0)) || 0;
    }
    
    const startNode = this.sharedData.selectedStart || 'A';
    const pathNodes = this.simulateHallwayPath(startNode, cVals);
    const finalNode = pathNodes[pathNodes.length - 1];
    const destNode = this.sharedData.selectedDest;

    if (!destNode) {
      // No destination selected, check if at start
      if (finalNode === startNode) {
        alert('Congrats, you\'re right!');
      }
    } else {
      // Destination selected, check if at destination
      if (finalNode === destNode) {
        alert('Congrats, you\'re right!');
      } else {
        alert('Input matrix was wrong');
      }
    }
  }

  update(time: number) {
    const elapsed = time - this.startTime;
    const totalSec = Math.floor(elapsed / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    this.timerText.setText(`${mm}:${ss}`);

    // Update current state
    const currentState = this.gameStateManager.getCurrentState();
    if (currentState) {
      currentState.update();
    }
  }
} 