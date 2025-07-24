import * as Phaser from 'phaser';
import { drawMatrixInput, drawVectorDisplay, MatrixInput, MatrixInputCell, drawDiagram } from './matrixDrawUtils';
// @ts-ignore
import InputText from 'phaser3-rex-plugins/plugins/inputtext.js';

export class HallwaysScene extends Phaser.Scene {
  private startTime!: number;
  private timerText!: Phaser.GameObjects.Text;
  private matrixInput?: MatrixInput;
  private greenCircle?: Phaser.GameObjects.Arc;
  private questionPrompt?: Phaser.GameObjects.Text;
  private aLabel?: Phaser.GameObjects.Text;
  private bLabel?: Phaser.GameObjects.Text;
  private aVector?: Phaser.GameObjects.Group;
  private bVector?: Phaser.GameObjects.Group;
  private nextBtn?: Phaser.GameObjects.Text;
  private gameState: number = 0; // 0: main menu, 1: part (a), 2: part (b), 3: final input
  private sandboxContainer?: Phaser.GameObjects.Container;
  private startInput?: any; // rexInputText instance
  private destInput?: any; // rexInputText instance
  private selectedStart: string | null = null;
  private selectedDest: string | null = null;
  private isPlaying: boolean = false;
  private peopleValue: string = '1';
  private inputMatrixEnabled: boolean = true;
  private arrowsEnabled: boolean = true;
  private arrows?: { [key: string]: Phaser.GameObjects.Text }; // Store reference to arrows
  private peopleCellText?: Phaser.GameObjects.Text;

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

    // Store references to all UI elements for later visibility control
    this.questionPrompt = this.add.text(1100, 120,
      'Describe the route or routes Ella may have taken that correspond to the following camera data vectors:',
      {
        font: '24px Arial',
        color: '#222',
        wordWrap: { width: 500 }
      }
    );
    this.aLabel = this.add.text(1100, 370, '(a)', { font: '22px Arial', color: '#222' });
    this.bLabel = this.add.text(1250, 370, '(b)', { font: '22px Arial', color: '#222' });
    // Draw vector displays as Phaser Groups for easy visibility control
    this.aVector = drawVectorDisplay(this, 1160, 300, [3, 3, 3, 0, 3], 40);
    this.bVector = drawVectorDisplay(this, 1310, 300, [5, 5, 3, 2, 3], 40);
    
    // Initially hide all question UI elements since we start at gameState 0
    this.questionPrompt.setVisible(false);
    this.aLabel.setVisible(false);
    this.bLabel.setVisible(false);
    this.aVector.setVisible(false);
    this.bVector.setVisible(false);

    // Store reference to arrows for applyGameStatePreferences
    const { greenCircle, arrows } = drawDiagram(this);
    this.greenCircle = greenCircle;
    this.arrows = arrows;

    // Arrow movement logic
    arrows.left.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 240) < 2 && Math.abs(greenCircle.y - 560) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 240,
          duration: 400, // was 1000
          ease: 'Power2',
        });
        // Increment value in matrix input
        if (this.matrixInput) {
          const prev = parseInt(this.matrixInput.getValue(0, 0)) || 0;
          let inc = 1;
          if (typeof this.peopleValue !== 'undefined') {
            const parsed = parseInt(this.peopleValue);
            if (!isNaN(parsed) && parsed > 0) inc = parsed;
          }
          this.matrixInput.setValue(0, 0, (prev + inc).toString());
        }
      }
    });
    arrows.top.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 240) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 560,
          y: 240,
          duration: 400, // was 1000
          ease: 'Power2',
        });
        if (this.matrixInput) {
          const prev = parseInt(this.matrixInput.getValue(1, 0)) || 0;
          let inc = 1;
          if (typeof this.peopleValue !== 'undefined') {
            const parsed = parseInt(this.peopleValue);
            if (!isNaN(parsed) && parsed > 0) inc = parsed;
          }
          this.matrixInput.setValue(1, 0, (prev + inc).toString());
        }
      }
    });
    arrows.right.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 560,
          y: 560,
          duration: 400, // was 1000
          ease: 'Power2',
        });
        if (this.matrixInput) {
          const prev = parseInt(this.matrixInput.getValue(2, 0)) || 0;
          let inc = 1;
          if (typeof this.peopleValue !== 'undefined') {
            const parsed = parseInt(this.peopleValue);
            if (!isNaN(parsed) && parsed > 0) inc = parsed;
          }
          this.matrixInput.setValue(2, 0, (prev + inc).toString());
        }
      }
    });
    arrows.bottom.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 560) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 560,
          duration: 400, // was 1000
          ease: 'Power2',
        });
        if (this.matrixInput) {
          const prev = parseInt(this.matrixInput.getValue(4, 0)) || 0;
          let inc = 1;
          if (typeof this.peopleValue !== 'undefined') {
            const parsed = parseInt(this.peopleValue);
            if (!isNaN(parsed) && parsed > 0) inc = parsed;
          }
          this.matrixInput.setValue(4, 0, (prev + inc).toString());
        }
      }
    });
    arrows.center.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 560,
          duration: 400, // was 1000
          ease: 'Power2',
        });
        if (this.matrixInput) {
          const prev = parseInt(this.matrixInput.getValue(3, 0)) || 0;
          let inc = 1;
          if (typeof this.peopleValue !== 'undefined') {
            const parsed = parseInt(this.peopleValue);
            if (!isNaN(parsed) && parsed > 0) inc = parsed;
          }
          this.matrixInput.setValue(3, 0, (prev + inc).toString());
        }
      }
    });

    const { width, height } = this.scale;
    
    // Prev button (left bottom corner)
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
        this.applyGameStatePreferences();
      }
    });

    // Next button (right bottom corner)
    this.nextBtn = this.add.text(width - 40, height - 40, 'Next', {
      font: '28px Arial',
      color: '#fff',
      backgroundColor: '#333',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    // Draw input matrix and disable interactivity at start
    this.matrixInput = drawMatrixInput(this, 1150, 620, 5, 1, 50);
    for (let i = 0; i < 5; i++) {
      this.matrixInput.setValue(i, 0, '0');
      // Disable cell interactivity
      this.matrixInput.cells[i][0].rect.disableInteractive();
    }

    // Play button next to the input matrix
    const playBtn = this.add.text(1150 + 80, 620, '▶ Play', {
      font: '24px Arial',
      color: '#fff',
      backgroundColor: '#008800',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    // Reset button under the play button
    const resetBtn = this.add.text(1150 + 80, 680, 'Reset', {
      font: '24px Arial',
      color: '#fff',
      backgroundColor: '#666',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

    // Validate button under the reset button
    const validateBtn = this.add.text(1150 + 80, 740, 'Validate', {
      font: '24px Arial',
      color: '#fff',
      backgroundColor: '#0077cc',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    validateBtn.on('pointerdown', async () => {
      // 1. Check for trivial solution
      if (this.matrixInput) {
        let allZero = true;
        for (let row = 0; row < this.matrixInput.cells.length; row++) {
          for (let col = 0; col < this.matrixInput.cells[row].length; col++) {
            if (parseInt(this.matrixInput.getValue(row, col)) !== 0) {
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
      // 2. Simulate play button (run the play animation logic)
      if (typeof playBtn.emit === 'function') {
        playBtn.emit('pointerdown');
        // Wait for the play animation to finish by polling isPlaying
        while (this.isPlaying) {
          await new Promise(res => setTimeout(res, 50));
        }
      }
      // 3. After play, check greenCircle position
      // Simulate the path (without animation)
      const cVals = [0, 0, 0, 0, 0];
      for (let i = 0; i < 5; i++) {
        cVals[i] = parseInt(this.matrixInput!.getValue(i, 0)) || 0;
      }
      const startNode = this.selectedStart || 'A';
      const pathNodes = this.simulateHallwayPath(startNode, cVals);
      const finalNode = pathNodes[pathNodes.length - 1];
      const destNode = this.selectedDest;
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
    });

    resetBtn.on('pointerdown', () => {
      this.resetState();
    });

    playBtn.on('pointerdown', async () => {
      if (this.isPlaying) return;
      this.isPlaying = true;
      playBtn.setAlpha(0.4);
      // Hide the original green circle before animating
      this.greenCircle?.setVisible(false);
      // Read c1-c5 from input matrix (in case user changed them)
      const cVals = [0, 0, 0, 0, 0];
      for (let i = 0; i < 5; i++) {
        cVals[i] = parseInt(this.matrixInput!.getValue(i, 0)) || 0;
      }

      // Get greenCircle reference and reset its position to selectedStart
      let startNode = this.selectedStart || 'A';
      if (this.greenCircle) {
        const pos = this.nodeCoords[startNode];
        this.greenCircle.setPosition(pos.x, pos.y);
      }
      this.greenCircle?.setVisible(true);

     // Simulate the path
     const pathNodes = this.simulateHallwayPath(startNode, cVals);
     // Animate along the path
     for (let i = 1; i < pathNodes.length; i++) {
       const pos = this.nodeCoords[pathNodes[i]];
       await new Promise(res => {
         this.tweens.add({
           targets: this.greenCircle,
           x: pos.x,
           y: pos.y,
           duration: 600,
           ease: 'Power2',
           onComplete: res
         });
       });
     }

      // Hide the green circle after animation
      this.greenCircle?.setVisible(false);
      this.isPlaying = false;
      playBtn.setAlpha(1);
      // Show the green circle again after animation is done
      this.greenCircle?.setVisible(true);
    });

    // Next button logic for multi-step UI
    this.gameState = 0;
    this.nextBtn.on('pointerdown', () => {
      if (this.gameState === 0) {
        // Show the question UI for part (a)
        if (this.questionPrompt) this.questionPrompt.setVisible(true);
        if (this.aLabel) this.aLabel.setVisible(true);
        if (this.aVector) this.aVector.setVisible(true);
        // Hide sandbox UI
        if (this.sandboxContainer) this.sandboxContainer.setVisible(false);
        // Reset matrix and greenCircle, and set start/dest to A
        this.selectedStart = 'A';
        this.selectedDest = 'A';
        // Call the reset logic
        this.resetState();
        this.gameState = 1;
        this.applyGameStatePreferences();
      } else if (this.gameState === 1) {
        // Check for [3,3,3,0,3]
        const vals = [0, 0, 0, 0, 0];
        for (let i = 0; i < 5; i++) vals[i] = parseInt(this.matrixInput?.getValue(i, 0) || '0') || 0;
        if (!(vals[0] === 3 && vals[1] === 3 && vals[2] === 3 && vals[3] === 0 && vals[4] === 3)) {
          alert('Input matrix must be [3,3,3,0,3]');
          return;
        }
        // Show (b) label and vector
        if (this.bLabel) this.bLabel.setVisible(true);
        if (this.bVector) this.bVector.setVisible(true);
        this.gameState = 2;
        this.applyGameStatePreferences();
      } else if (this.gameState === 2) {
        // Check for [5,5,3,2,3]
        const vals = [0, 0, 0, 0, 0];
        for (let i = 0; i < 5; i++) vals[i] = parseInt(this.matrixInput?.getValue(i, 0) || '0') || 0;
        if (!(vals[0] === 5 && vals[1] === 5 && vals[2] === 3 && vals[3] === 2 && vals[4] === 3)) {
          alert('Input matrix must be [5,5,3,2,3]');
          return;
        }
        // Hide all question UI
        if (this.questionPrompt) this.questionPrompt.setVisible(false);
        if (this.aLabel) this.aLabel.setVisible(false);
        if (this.bLabel) this.bLabel.setVisible(false);
        if (this.aVector) this.aVector.setVisible(false);
        if (this.bVector) this.bVector.setVisible(false);
        // Change prompt and enable input
        const newPrompt = this.add.text(1100, 120, 'Make a matrix that loops once in the hallway', {
          font: '24px Arial', color: '#222', wordWrap: { width: 500 }
        });
        this.questionPrompt = newPrompt;
        // Enable input matrix interactivity
        if (this.matrixInput) {
          for (let i = 0; i < 5; i++) {
            this.matrixInput.cells[i][0].rect.setInteractive({ useHandCursor: true });
          }
        }
        this.gameState = 3;
        this.applyGameStatePreferences();
      }
    });

    // SANDBOX STATE 0: Add test UI for playtesting
    if (this.gameState === 0) {
      this.sandboxContainer = this.add.container(0, 0);
      // Start Location single-choice selector
      const startLabel = this.add.text(950, 80, 'Start Location', { font: '26px Arial', color: '#222' });
      const startOptions = ['A', 'B', 'C', 'D'];
      const startButtons: Phaser.GameObjects.Text[] = [];
      startOptions.forEach((opt, idx) => {
        const btn = this.add.text(1150 + idx * 60, 80, opt, {
          font: '32px Arial',
          backgroundColor: '#eee',
          color: '#222',
          padding: { left: 12, right: 12, top: 6, bottom: 6 }
        })
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            startButtons.forEach(b => b.setStyle({ backgroundColor: '#eee', color: '#222' }));
            btn.setStyle({ backgroundColor: '#222', color: '#fff' });
            this.selectedStart = opt;
            // Also reset the matrix and greenCircle state
            this.resetState();
          });
        startButtons.push(btn);
        this.sandboxContainer.add(btn);
      });
      this.sandboxContainer.add(startLabel);
      // Destination single-choice selector
      const destLabel = this.add.text(950, 150, 'Destination', { font: '26px Arial', color: '#222' });
      const destOptions = ['A', 'B', 'C', 'D'];
      const destButtons: Phaser.GameObjects.Text[] = [];
      destOptions.forEach((opt, idx) => {
        const btn = this.add.text(1150 + idx * 60, 150, opt, {
          font: '32px Arial',
          backgroundColor: '#eee',
          color: '#222',
          padding: { left: 12, right: 12, top: 6, bottom: 6 }
        })
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => {
            destButtons.forEach(b => b.setStyle({ backgroundColor: '#eee', color: '#222' }));
            btn.setStyle({ backgroundColor: '#222', color: '#fff' });
            this.selectedDest = opt;
          });
        destButtons.push(btn);
        this.sandboxContainer.add(btn);
      });
      this.sandboxContainer.add(destLabel);
      // Enable input matrix interactivity in sandbox
      if (this.matrixInput) {
        for (let row = 0; row < this.matrixInput.cells.length; row++) {
          for (let col = 0; col < this.matrixInput.cells[row].length; col++) {
            this.matrixInput.cells[row][col].rect.setInteractive({ useHandCursor: true });
          }
        }
      }

      // Number of People label and input cell (sandbox only)
      const peopleLabelY = 230;
      const peopleLabelX = 950;
      const cellSize = 50;
      const label = this.add.text(peopleLabelX, peopleLabelY, 'Number of People', { font: '26px Arial', color: '#222' });
      this.sandboxContainer.add(label);
      // Align the cell vertically centered with the label, and horizontally close to the label
      const cellX = peopleLabelX + 240;
      const cellY = peopleLabelY + (label.height - cellSize) / 2;
      const peopleCellRect = this.add.rectangle(cellX + cellSize/2, cellY + cellSize/2, cellSize, cellSize, 0xffffff, 1)
        .setStrokeStyle(2, 0x000000)
        .setInteractive({ useHandCursor: true });
      const peopleCellText = this.add.text(cellX + cellSize/2, cellY + cellSize/2, '', {
        font: '20px Arial',
        color: '#000',
        align: 'center',
      }).setOrigin(0.5);
      this.sandboxContainer.add(peopleCellRect);
      this.sandboxContainer.add(peopleCellText);
      this.peopleCellText = peopleCellText;
      let peopleFocused = false;
      this.peopleValue = '1';
      peopleCellText.setText(this.peopleValue);
      peopleCellRect.on('pointerdown', () => {
        peopleFocused = true;
        // Clear the value and text on click (like input matrix)
        this.peopleValue = '';
        peopleCellText.setText('');
        peopleCellRect.setStrokeStyle(4, 0x4287f5);
        this.input.keyboard?.off('keydown');
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
          if (!peopleFocused) return;
          let val = this.peopleValue;
          if (event.key === 'Backspace') {
            val = val.slice(0, -1);
          } else if (event.key.length === 1 && /[0-9]/.test(event.key)) {
            if (val.length < 5) val += event.key;
          } else if (event.key === 'Enter') {
            peopleFocused = false;
            peopleCellRect.setStrokeStyle(2, 0x000000);
            return;
          }
          this.peopleValue = val;
          peopleCellText.setText(val);
        });
      });

      // --- Toggles for input matrix and arrows ---
      this.inputMatrixEnabled = true;
      this.arrowsEnabled = true;
      const toggleLabelY = peopleLabelY + 70;
      const toggleX = peopleLabelX;
      // Input Matrix Toggle
      const inputMatrixToggleLabel = this.add.text(toggleX, toggleLabelY, 'Enable Input Matrix', { font: '20px Arial', color: '#222' });
      const inputMatrixToggleBtn = this.add.text(toggleX + 220, toggleLabelY, '[ON]', {
        font: '20px Arial', color: '#fff', backgroundColor: '#0077cc', padding: { left: 10, right: 10, top: 4, bottom: 4 }
      }).setInteractive({ useHandCursor: true });
      inputMatrixToggleBtn.on('pointerdown', () => {
        this.inputMatrixEnabled = !this.inputMatrixEnabled;
        inputMatrixToggleBtn.setText(this.inputMatrixEnabled ? '[ON]' : '[OFF]');
        inputMatrixToggleBtn.setStyle({ backgroundColor: this.inputMatrixEnabled ? '#0077cc' : '#888' });
        if (this.matrixInput) {
          for (let row = 0; row < this.matrixInput.cells.length; row++) {
            for (let col = 0; col < this.matrixInput.cells[row].length; col++) {
              if (this.inputMatrixEnabled) {
                this.matrixInput.cells[row][col].rect.setInteractive({ useHandCursor: true });
              } else {
                this.matrixInput.cells[row][col].rect.disableInteractive();
              }
            }
          }
        }
      });
      this.sandboxContainer.add(inputMatrixToggleLabel);
      this.sandboxContainer.add(inputMatrixToggleBtn);
      // Arrows Toggle
      const arrowsToggleLabel = this.add.text(toggleX, toggleLabelY + 40, 'Enable Arrows', { font: '20px Arial', color: '#222' });
      const arrowsToggleBtn = this.add.text(toggleX + 220, toggleLabelY + 40, '[ON]', {
        font: '20px Arial', color: '#fff', backgroundColor: '#0077cc', padding: { left: 10, right: 10, top: 4, bottom: 4 }
      }).setInteractive({ useHandCursor: true });
      arrowsToggleBtn.on('pointerdown', () => {
        this.arrowsEnabled = !this.arrowsEnabled;
        arrowsToggleBtn.setText(this.arrowsEnabled ? '[ON]' : '[OFF]');
        arrowsToggleBtn.setStyle({ backgroundColor: this.arrowsEnabled ? '#0077cc' : '#888' });
        if (arrows) {
          Object.values(arrows).forEach(arrow => {
            if (this.arrowsEnabled) {
              arrow.setInteractive({ useHandCursor: true });
            } else {
              arrow.disableInteractive();
            }
          });
        }
      });
      this.sandboxContainer.add(arrowsToggleLabel);
      this.sandboxContainer.add(arrowsToggleBtn);
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
  }

  // Reset matrix and greenCircle to the selected start location
  private resetState() {
    // Reset all matrix input values to 0 (robust for any matrix size)
    if (this.matrixInput) {
      for (let row = 0; row < this.matrixInput.cells.length; row++) {
        for (let col = 0; col < this.matrixInput.cells[row].length; col++) {
          this.matrixInput.setValue(row, col, '0');
        }
      }
    }
    // Reset green circle position
    if (this.greenCircle) {
      let target = { x: 240, y: 560 };
      if (this.gameState === 0 && typeof this.selectedStart === 'string') {
        if (this.selectedStart === 'A') target = { x: 240, y: 560 };
        else if (this.selectedStart === 'B') target = { x: 240, y: 240 };
        else if (this.selectedStart === 'C') target = { x: 560, y: 240 };
        else if (this.selectedStart === 'D') target = { x: 560, y: 560 };
      }
      this.greenCircle.setPosition(target.x, target.y);
    }
  }

  // Centralized method to apply UI preferences for each game state
  private applyGameStatePreferences() {
    // Sandbox features
    if (this.sandboxContainer) this.sandboxContainer.setVisible(this.gameState === 0);
    // Main game UI elements
    if (this.questionPrompt) this.questionPrompt.setVisible(this.gameState !== 0 && (this.gameState === 1 || this.gameState === 2));
    if (this.aLabel) this.aLabel.setVisible(this.gameState === 1 || this.gameState === 2);
    if (this.bLabel) this.bLabel.setVisible(this.gameState === 2);
    if (this.aVector) this.aVector.setVisible(this.gameState === 1 || this.gameState === 2);
    if (this.bVector) this.bVector.setVisible(this.gameState === 2);
    // Input matrix interactivity
    if (this.matrixInput) {
      const enable = this.gameState === 0 || this.gameState === 3;
      for (let row = 0; row < this.matrixInput.cells.length; row++) {
        for (let col = 0; col < this.matrixInput.cells[row].length; col++) {
          if (enable) {
            this.matrixInput.cells[row][col].rect.setInteractive({ useHandCursor: true });
          } else {
            this.matrixInput.cells[row][col].rect.disableInteractive();
          }
        }
      }
    }
    // Arrows: Only allow toggling in sandbox, always enabled otherwise
    if (typeof this.arrowsEnabled !== 'undefined' && typeof this.inputMatrixEnabled !== 'undefined' && this.arrows) {
      const enableArrows = this.gameState === 0 ? this.arrowsEnabled : true;
      Object.values(this.arrows).forEach(arrow => {
        if (enableArrows) {
          arrow.setInteractive({ useHandCursor: true });
        } else {
          arrow.disableInteractive();
        }
      });
    }
    // Reset peopleValue to '1' and update cell text if it exists
    this.peopleValue = '1';
    if (this.peopleCellText) {
      this.peopleCellText.setText('1');
    }
    // Reset start/dest to A for non-sandbox states
    if (this.gameState !== 0) {
      this.selectedStart = 'A';
      this.selectedDest = 'A';
    }
  }
}
