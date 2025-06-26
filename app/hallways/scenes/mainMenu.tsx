import * as Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }
  preload() {
    // load menu assets here if you have any
  }
  create() {
    const { width, height } = this.scale;
    // a simple text button in the center
    const btn = this.add.text(width/2, height/2, '▶ Start', {
      font: '32px Arial',
      color: '#000'
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    btn.on('pointerdown', () => {
      this.scene.start('HallwaysScene');
    });
  }
}
