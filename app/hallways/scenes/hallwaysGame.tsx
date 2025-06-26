import * as Phaser from 'phaser';

function drawDiagram(scene: Phaser.Scene) {
  const g = scene.add.graphics();

  const drawSquare = (
    x: number,
    y: number,
    color: number,
    letter: string,
    text: string
  ) => {
    g.fillStyle(color, 1).fillRect(0, 0, 120, 120);
    const texKey = `box-${letter}`;
    g.generateTexture(texKey, 120, 120);
    g.clear();
    scene.add.image(x, y, texKey).setAngle(45);
    scene.add
      .text(x, y, `${letter}\n${text}`, {
        font: '20px Arial',
        color: '#000',
      })
      .setOrigin(0.5)
      .setAlign('center');
  };

  // 4 subject diamonds
  drawSquare(150, 650, 0xa9b7e1, 'A', 'Art');
  drawSquare(150, 150, 0xe19a9a, 'B', 'Biology');
  drawSquare(650, 150, 0xf7e199, 'C', 'Civics');
  drawSquare(650, 650, 0xaedbad, 'D', 'Drama');

  // outer rectangle
  g.lineStyle(4, 0x000000).strokeRect(200, 200, 400, 400);

  // inner "hallways":
  g.lineStyle(4, 0x000000);
  const wall1 = new Phaser.Geom.Triangle(
      275, 275,
      475, 275, 
      275, 475
  );
  const wall2 = new Phaser.Geom.Triangle(
      325, 525,
      525, 325,
      525, 525
  );
  g.strokeTriangleShape(wall1);
  g.strokeTriangleShape(wall2);

  // cameras C1–C5
  const cams = [
    { x: 200, y: 400, angle: -90, label: 'C1' },
    { x: 400, y: 200, angle: 0, label: 'C2' },
    { x: 400, y: 400, angle: 180, label: 'C3' },
    { x: 600, y: 400, angle: 90, label: 'C4' },
    { x: 400, y: 600, angle: 180, label: 'C5' },
  ];
  cams.forEach(({ x, y, angle, label }) => {
    scene.add.image(x, y, 'camera').setAngle(angle).setScale(0.3);
    scene.add
      .text(x + 15, y - 15, label, { font: '18px Arial', color: '#000' });
  });

  // Draw all arrows as interactive images and return references
  const arrows = {
    left: scene.add.image(240, 400, 'red_arrow').setScale(0.3).setAngle(-90).setInteractive({ useHandCursor: true }),
    top: scene.add.image(400, 240, 'red_arrow').setScale(0.3).setAngle(0).setInteractive({ useHandCursor: true }),
    right: scene.add.image(565, 400, 'red_arrow').setScale(0.3).setAngle(90).setInteractive({ useHandCursor: true }),
    bottom: scene.add.image(400, 565, 'red_arrow').setScale(0.3).setAngle(180).setInteractive({ useHandCursor: true }),
    center: scene.add.image(400, 400, 'red_arrow').setScale(0.3).setAngle(135).setInteractive({ useHandCursor: true })
  };

  // Draw a green solid circle as a GameObject
  const greenCircle = scene.add.circle(240, 560, 18, 0x2ecc40);

  return { greenCircle, arrows };
}

export class HallwaysScene extends Phaser.Scene {
  private startTime!: number;
  private timerText!: Phaser.GameObjects.Text;

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
    
    // Add the interactive math question and camera data vectors in the empty area (right side)
    this.add.text(1100, 200,
      'Describe the route or routes Ella may have taken that correspond to the following camera data vectors:',
      {
        font: '24px Arial',
        color: '#222',
        wordWrap: { width: 500 }
      }
    );
    // (a) vector
    this.add.text(
      1100, 270,
      '(a)    v = [3\n           3\n           3\n           0\n           3]',
      {
        font: '24px Arial',
        color: '#222',
        align: 'left'
      }
    );
    // (b) vector, offset to the right
    this.add.text(
      1250, 270,
      '(b)    w = [5\n           5\n           3\n           2\n           3]',
      {
        font: '24px Arial',
        color: '#222',
        align: 'left'
      }
    );

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
        c4++;
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
        c3++;
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
