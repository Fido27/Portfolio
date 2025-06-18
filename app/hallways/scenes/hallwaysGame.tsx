export class HallwaysScene extends Phaser.Scene {
  private startTime!: number;
  private timerText!: Phaser.GameObjects.Text;

  constructor() { super('GameScene'); }

  preload() {
    this.load.image('camera', '/camera.png');
  }

  create() {
    const g = this.add.graphics();

    // … your existing drawSquare, draw-loop code goes here …
    // (copy all of your drawSquare() calls, walls, cameras, arrows, etc.)

    // ── STOPWATCH SETUP ─────────────────────────
    // record the timestamp when this scene starts
    this.startTime = this.time.now;
    // add a text object in the top-left (change x/y for another corner)
    this.timerText = this.add.text(10, 10, '00:00', {
      font: '20px Arial',
      color: '#000'
    }).setOrigin(0, 0);
  }

  update(time: number) {
    // every frame, compute elapsed ms, turn into mm:ss, and update the text
    const elapsed = time - this.startTime;
    const totalSec = Math.floor(elapsed / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    this.timerText.setText(`${mm}:${ss}`);
  }
}
