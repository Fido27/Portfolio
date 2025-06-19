import Phaser from 'phaser';

export class HallwaysScene extends Phaser.Scene {
  private startTime!: number;
  private timerText!: Phaser.GameObjects.Text;

  constructor() { super('HallwaysScene'); }

  preload() {
    // this.load.image('camera', '/camera.png');
  }

  create() {
    const g = this.add.graphics();

    this.startTime = this.time.now;
    this.timerText = this.add.text(10, 10, '00:00', {
      font: '20px Arial',
      color: '#000'
    }).setOrigin(0, 0);

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
      // rotate the textured quad 45°
      this.add.image(x, y, texKey).setAngle(45);
      // label under it
      this.add
        .text(x, y + 70, `${letter}\n${text}`, {
          font: '20px Arial',
          color: '#000',
        })
        .setOrigin(0.5)
        .setAlign('center');
    };

    // 4 subject diamonds
    drawSquare(150, 150, 0xe19a9a, 'A', 'Art');
    drawSquare(650, 150, 0xf7e199, 'B', 'Biology');
    drawSquare(650, 650, 0xaedbad, 'C', 'Civics');
    drawSquare(150, 650, 0xa9b7e1, 'D', 'Drama');

    // outer rectangle
    g.lineStyle(4, 0x000000).strokeRect(200, 200, 400, 400);

    // inner “hallways”:
    g.lineStyle(4, 0x000000);
    const wall1 = new Phaser.Geom.Triangle(
        250, 275,
        250, 550, 
        525, 550
    );
    const wall2 = new Phaser.Geom.Triangle(
        275, 250,
        550, 250,
        550, 525
    );
    g.strokeTriangleShape(wall1);
    g.strokeTriangleShape(wall2);

    // cameras C1–C5
    const cams = [
      { x: 200, y: 400, angle: -90, label: 'C1' },
      { x: 400, y: 200, angle: 0, label: 'C2' },
      { x: 600, y: 400, angle: 90, label: 'C4' },
      { x: 400, y: 600, angle: 180, label: 'C5' },
    ];
    cams.forEach(({ x, y, angle, label }) => {
      this.add.image(x, y, 'camera').setAngle(angle).setScale(0.3);
      this.add
        .text(x + 15, y - 15, label, { font: '18px Arial', color: '#000' });
    });

    // // red arrows
    // const arrow = (x: number, y: number, angle: number) => {
    //   this.add
    //     .triangle(x, y, 0, 0, 20, -10, 20, 10, 0xe63946)
    //     .setAngle(angle);
    // };
    // arrow(400, 220, 0);    // top
    // arrow(580, 300, 90);   // right
    // arrow(400, 380, 180);  // bottom
    // arrow(220, 300, -90);  // left
    // arrow(350, 300, -45);  // diagonal

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

  // “+” button to the right
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

  // “–” button to the left
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
