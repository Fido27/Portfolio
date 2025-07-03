import * as Phaser from 'phaser';
import { drawMatrixInput, drawVectorDisplay, MatrixInput, MatrixInputCell, drawDiagram } from './matrixDrawUtils';

export class HallwaysScene extends Phaser.Scene {
  private startTime!: number;
  private timerText!: Phaser.GameObjects.Text;
  private matrixInput?: MatrixInput;

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

    this.add.text(1100, 120,
      'Describe the route or routes Ella may have taken that correspond to the following camera data vectors:',
      {
        font: '24px Arial',
        color: '#222',
        wordWrap: { width: 500 }
      }
    );

    // Remove ASCII-style output vectors and use bracketed vector display
    this.add.text(1100, 370, '(a)', { font: '22px Arial', color: '#222' });
    this.add.text(1250, 370, '(b)', { font: '22px Arial', color: '#222' });
    drawVectorDisplay(this, 1160, 300, [3, 3, 3, 0, 3], 40); // v vector
    drawVectorDisplay(this, 1310, 300, [5, 5, 3, 2, 3], 40); // w vector

    var c1 = 0;
    var c2 = 0;
    var c3 = 0;
    var c4 = 0;
    var c5 = 0;
    
    const { greenCircle, arrows } = drawDiagram(this);

    // Arrow movement logic
    arrows.left.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 240) < 2 && Math.abs(greenCircle.y - 560) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 240,
          duration: 1000,
          ease: 'Power2',
        });
        c1++;
        if (this.matrixInput) {
          this.matrixInput.setValue(0, 0, c1.toString());
        }
      }
    });
    arrows.top.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 240) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 560,
          y: 240,
          duration: 1000,
          ease: 'Power2',
        });
        c2++;
        if (this.matrixInput) {
          this.matrixInput.setValue(1, 0, c2.toString());
        }
      }
    });
    arrows.right.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 560,
          y: 560,
          duration: 1000,
          ease: 'Power2',
        });
        c3++;
        if (this.matrixInput) {
          this.matrixInput.setValue(2, 0, c3.toString());
        }
      }
    });
    arrows.bottom.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 560) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 560,
          duration: 1000,
          ease: 'Power2',
        });
        c5++;
        if (this.matrixInput) {
          this.matrixInput.setValue(4, 0, c5.toString());
        }
      }
    });
    arrows.center.on('pointerdown', () => {
      if (Math.abs(greenCircle.x - 560) < 2 && Math.abs(greenCircle.y - 240) < 2) {
        this.tweens.add({
          targets: greenCircle,
          x: 240,
          y: 560,
          duration: 1000,
          ease: 'Power2',
        });
        c4++;
        if (this.matrixInput) {
          this.matrixInput.setValue(3, 0, c4.toString());
        }
      }
    });

    // ─── Simple Counter UI ───────────────────────────
    let counter = 0;
    const { width, height } = this.scale;

    // Counter display centered on bottom
    const counterText = this.add
      .text(width/2, height - 40, `C1: ${counter}`, {
        font: '24px Arial',
        color: '#000'
      })
      .setOrigin(0.5);

    // "+" button to the right
    const plusBtn = this.add
      .text(width/2 + 60, height - 40, '+', {
        font: '32px Arial',
        color: '#008800'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    plusBtn.on('pointerdown', () => {
      counter++;
      counterText.setText(`C1: ${counter}`);
    });

    // "−" button to the left
    const minusBtn = this.add
      .text(width/2 - 60, height - 40, '−', {
        font: '32px Arial',
        color: '#880000'
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    minusBtn.on('pointerdown', () => {
      counter--;
      counterText.setText(`C1: ${counter}`);
    });

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
    this.add.text(width - 40, height - 40, 'Next', {
      font: '28px Arial',
      color: '#fff',
      backgroundColor: '#333',
      padding: { left: 16, right: 16, top: 8, bottom: 8 },
      align: 'center',
      fontStyle: 'bold'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    this.matrixInput = drawMatrixInput(this, 1150, 620, 5, 1, 50);
    
    // Initialize matrix input with current c1-c5 values
    this.matrixInput.setValue(0, 0, c1.toString());
    this.matrixInput.setValue(1, 0, c2.toString());
    this.matrixInput.setValue(2, 0, c3.toString());
    this.matrixInput.setValue(3, 0, c4.toString());
    this.matrixInput.setValue(4, 0, c5.toString());

    // Add Play button next to the input matrix
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
      playBtn.setAlpha(0.5);
      // Read c1-c5 from input matrix (in case user changed them)
      const cVals = [0, 0, 0, 0, 0];
      for (let i = 0; i < 5; i++) {
        cVals[i] = parseInt(this.matrixInput!.getValue(i, 0)) || 0;
      }
      // Define movement steps: left, top, right (c3), center (c4), bottom
      const moves = [
        { x: 240, y: 240 }, // left (c1)
        { x: 560, y: 240 }, // top (c2)
        { x: 560, y: 560 }, // right (c3)
        { x: 240, y: 560 }, // center (c4)
        { x: 240, y: 560 }, // bottom (c5)
      ];
      // Build the path
      let path = [];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < cVals[i]; j++) {
          path.push(i);
        }
      }
      // Get greenCircle reference and reset its position
      const { greenCircle } = drawDiagram(this);
      greenCircle.setPosition(240, 560);
      // Animate path
      for (let idx = 0; idx < path.length; idx++) {
        const moveIdx = path[idx];
        const { x, y } = moves[moveIdx];
        await new Promise(res => {
          this.tweens.add({
            targets: greenCircle,
            x,
            y,
            duration: 600,
            ease: 'Power2',
            onComplete: res
          });
        });
      }
      isPlaying = false;
      playBtn.setAlpha(1);
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
