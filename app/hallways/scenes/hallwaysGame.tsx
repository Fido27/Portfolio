import * as Phaser from 'phaser';
import { drawMatrixInput, drawVectorDisplay, MatrixInput, MatrixInputCell, drawDiagram } from './matrixDrawUtils';

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
  private inputStep: number = 0;

  constructor() { super('HallwaysScene'); }

  preload() {
    // this.load.image('camera', '/camera.png');
    this.load.image('red_arrow', '/hallways/red_arrow.webp');
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
    // Hide (b) label and vector at start
    this.bLabel.setVisible(false);
    this.bVector.setVisible(false);

    const { greenCircle, arrows } = drawDiagram(this);
    this.greenCircle = greenCircle;

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
          this.matrixInput.setValue(0, 0, (prev + 1).toString());
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
          this.matrixInput.setValue(1, 0, (prev + 1).toString());
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
          this.matrixInput.setValue(2, 0, (prev + 1).toString());
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
          this.matrixInput.setValue(4, 0, (prev + 1).toString());
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
          this.matrixInput.setValue(3, 0, (prev + 1).toString());
        }
      }
    });

    const { width, height } = this.scale;
    
    // Prev button (left bottom corner)
    this.add.text(40, height - 40, 'Prev', {
      font: '28px Arial',
      color: '#fff',
      backgroundColor: '#333',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });

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

    let isPlaying = false;
    playBtn.on('pointerdown', async () => {
      if (isPlaying) return;
      isPlaying = true;
      playBtn.setAlpha(0.4);
      // Hide the original green circle before animating
      this.greenCircle?.setVisible(false);
      // Read c1-c5 from input matrix (in case user changed them)
      const cVals = [0, 0, 0, 0, 0];
      for (let i = 0; i < 5; i++) {
        cVals[i] = parseInt(this.matrixInput!.getValue(i, 0)) || 0;
      }

      // Validate
      if (cVals[0] == 0 && cVals[1] == 0 && cVals[2] == 0 && cVals[3] == 0 && cVals[4] == 0) {
        alert('Trivial solution is not acceptible for this problem');
        this.greenCircle?.setVisible(true);
        // Reset all matrix input values to 0
        for (let i = 0; i < 5; i++) {
          this.matrixInput?.setValue(i, 0, '0');
        }
        // Reset c1-c5 variables
        // c1 = 0; c2 = 0; c3 = 0; c4 = 0; c5 = 0; // Removed
        isPlaying = false;
        playBtn.setAlpha(1);
        return;
      }
      if (!(cVals[0] == cVals[1] && cVals[2] == cVals[4] && cVals[2] + cVals[3] == cVals[0])) {
        alert('Path is wrong');
        this.greenCircle?.setVisible(true);
        // Reset all matrix input values to 0
        for (let i = 0; i < 5; i++) {
          this.matrixInput?.setValue(i, 0, '0');
        }
        // Reset c1-c5 variables
        // c1 = 0; c2 = 0; c3 = 0; c4 = 0; c5 = 0; // Removed
        isPlaying = false;
        playBtn.setAlpha(1);
        return;
      }

      // Define movement steps: left, top, right (c3), center (c4), bottom
      const moves = [
        { x: 240, y: 240 }, // left (c1)
        { x: 560, y: 240 }, // top (c2)
        { x: 560, y: 560 }, // right (c3)
        { x: 240, y: 560 }, // center (c4)
        { x: 240, y: 560 }, // bottom (c5)
      ];
      // Build the path with square and diagonal loops
      let path = [];
      let counts = cVals.slice();
      // First, do as many 'square' loops (0→1→2→4) as possible
      while (counts[0] > 0 && counts[1] > 0 && counts[2] > 0 && counts[4] > 0) {
        path.push(0); counts[0]--;
        path.push(1); counts[1]--;
        path.push(2); counts[2]--;
        path.push(4); counts[4]--;
      }
      // Then, do as many 'diagonal' loops (0->1->3) as possible
      while (counts[1] > 0 && counts[3] > 0 && counts[0] > 0) {
        path.push(0); counts[0]--;
        path.push(1); counts[1]--;
        path.push(3); counts[3]--;
      }
      // If any moves are left, add them in order (shouldn't happen for valid input)
      for (let i = 0; i < 5; i++) {
        while (counts[i] > 0) {
          path.push(i);
          counts[i]--;
        }
      }
      // Get greenCircle reference and reset its position
      this.greenCircle?.setPosition(240, 560);
      this.greenCircle?.setVisible(true);
      // Animate path
      for (let idx = 0; idx < path.length; idx++) {
        const moveIdx = path[idx];
        const { x, y } = moves[moveIdx];
        await new Promise(res => {
          this.tweens.add({
            targets: this.greenCircle,
            x,
            y,
            duration: 600,
            ease: 'Power2',
            onComplete: res
          });
        });
      }
      // Hide the green circle after animation
      this.greenCircle?.setVisible(false);
      isPlaying = false;
      playBtn.setAlpha(1);
      // Show the green circle again after animation is done
      this.greenCircle?.setVisible(true);
    });

    // Next button logic for multi-step UI
    this.inputStep = 0;
    this.nextBtn.on('pointerdown', () => {
      if (this.inputStep === 0) {
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
        this.inputStep = 1;
      } else if (this.inputStep === 1) {
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
        this.inputStep = 2;
      }
    });
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
}
