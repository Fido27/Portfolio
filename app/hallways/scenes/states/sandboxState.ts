import * as Phaser from 'phaser';
import { BaseState, GameStateData } from './baseState';

export class SandboxState extends BaseState {
  private startButtons: Phaser.GameObjects.Text[] = [];
  private destButtons: Phaser.GameObjects.Text[] = [];
  private inputMatrixToggleBtn?: Phaser.GameObjects.Text;
  private arrowsToggleBtn?: Phaser.GameObjects.Text;
  private peopleCellRect?: Phaser.GameObjects.Rectangle;
  private peopleFocused: boolean = false;

  constructor(scene: Phaser.Scene, sharedData: GameStateData) {
    super(scene, sharedData);
  }

  enter(): void {
    this.createSandboxUI();
    this.setMatrixInputInteractivity(true);
    this.setArrowsInteractivity(this.data.arrowsEnabled);
  }

  exit(): void {
    if (this.data.sandboxContainer) {
      this.data.sandboxContainer.setVisible(false);
    }
    this.setMatrixInputInteractivity(false);
  }

  update(): void {
    // Sandbox state doesn't need continuous updates
  }

  private createSandboxUI(): void {
    if (!this.data.sandboxContainer) {
      this.data.sandboxContainer = this.scene.add.container(0, 0);
    }
    this.data.sandboxContainer.setVisible(true);

    // Start Location selector
    const startLabel = this.scene.add.text(950, 80, 'Start Location', { 
      font: '26px Arial', 
      color: '#222' 
    });
    this.data.sandboxContainer.add(startLabel);

    const startOptions = ['A', 'B', 'C', 'D'];
    this.startButtons = [];
    startOptions.forEach((opt, idx) => {
      const btn = this.scene.add.text(1150 + idx * 60, 80, opt, {
        font: '32px Arial',
        backgroundColor: idx === 0 ? '#222' : '#eee',
        color: idx === 0 ? '#fff' : '#222',
        padding: { left: 12, right: 12, top: 6, bottom: 6 }
      })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.startButtons.forEach(b => b.setStyle({ backgroundColor: '#eee', color: '#222' }));
          btn.setStyle({ backgroundColor: '#222', color: '#fff' });
          this.data.selectedStart = opt;
          this.resetState();
        });
      this.startButtons.push(btn);
      this.data.sandboxContainer!.add(btn);
    });

    // Destination selector
    const destLabel = this.scene.add.text(950, 150, 'Destination', { 
      font: '26px Arial', 
      color: '#222' 
    });
    this.data.sandboxContainer.add(destLabel);

    const destOptions = ['A', 'B', 'C', 'D'];
    this.destButtons = [];
    destOptions.forEach((opt, idx) => {
      const btn = this.scene.add.text(1150 + idx * 60, 150, opt, {
        font: '32px Arial',
        backgroundColor: idx === 0 ? '#222' : '#eee',
        color: idx === 0 ? '#fff' : '#222',
        padding: { left: 12, right: 12, top: 6, bottom: 6 }
      })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
          this.destButtons.forEach(b => b.setStyle({ backgroundColor: '#eee', color: '#222' }));
          btn.setStyle({ backgroundColor: '#222', color: '#fff' });
          this.data.selectedDest = opt;
        });
      this.destButtons.push(btn);
      this.data.sandboxContainer!.add(btn);
    });

    // Number of People input
    this.createPeopleInput();

    // Toggles
    this.createToggles();
  }

  private createPeopleInput(): void {
    const peopleLabelY = 230;
    const peopleLabelX = 950;
    const cellSize = 50;
    
    const label = this.scene.add.text(peopleLabelX, peopleLabelY, 'Number of People', { 
      font: '26px Arial', 
      color: '#222' 
    });
    this.data.sandboxContainer!.add(label);

    const cellX = peopleLabelX + 240;
    const cellY = peopleLabelY + (label.height - cellSize) / 2;
    
    this.peopleCellRect = this.scene.add.rectangle(
      cellX + cellSize/2, 
      cellY + cellSize/2, 
      cellSize, 
      cellSize, 
      0xffffff, 
      1
    )
      .setStrokeStyle(2, 0x000000)
      .setInteractive({ useHandCursor: true });

    this.data.peopleCellText = this.scene.add.text(
      cellX + cellSize/2, 
      cellY + cellSize/2, 
      this.data.peopleValue, 
      {
        font: '20px Arial',
        color: '#000',
        align: 'center',
      }
    ).setOrigin(0.5);

    this.data.sandboxContainer!.add(this.peopleCellRect);
    this.data.sandboxContainer!.add(this.data.peopleCellText);

    this.setupPeopleInputHandlers();
  }

  private setupPeopleInputHandlers(): void {
    if (!this.peopleCellRect || !this.data.peopleCellText) return;

    this.peopleCellRect.on('pointerdown', () => {
      this.peopleFocused = true;
      this.data.peopleValue = '';
      this.data.peopleCellText!.setText('');
      this.peopleCellRect!.setStrokeStyle(4, 0x4287f5);
      
      this.scene.input.keyboard?.off('keydown');
      this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (!this.peopleFocused) return;
        
        let val = this.data.peopleValue;
        if (event.key === 'Backspace') {
          val = val.slice(0, -1);
        } else if (event.key.length === 1 && /[0-9]/.test(event.key)) {
          if (val.length < 5) val += event.key;
        } else if (event.key === 'Enter') {
          this.peopleFocused = false;
          this.peopleCellRect!.setStrokeStyle(2, 0x000000);
          return;
        }
        
        this.data.peopleValue = val;
        this.data.peopleCellText!.setText(val);
      });
    });
  }

  private createToggles(): void {
    const toggleLabelY = 300;
    const toggleX = 950;

    // Input Matrix Toggle
    const inputMatrixToggleLabel = this.scene.add.text(toggleX, toggleLabelY, 'Enable Input Matrix', { 
      font: '20px Arial', 
      color: '#222' 
    });
    
    this.inputMatrixToggleBtn = this.scene.add.text(toggleX + 220, toggleLabelY, '[ON]', {
      font: '20px Arial', 
      color: '#fff', 
      backgroundColor: '#0077cc', 
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setInteractive({ useHandCursor: true });

    this.inputMatrixToggleBtn.on('pointerdown', () => {
      this.data.inputMatrixEnabled = !this.data.inputMatrixEnabled;
      this.inputMatrixToggleBtn!.setText(this.data.inputMatrixEnabled ? '[ON]' : '[OFF]');
      this.inputMatrixToggleBtn!.setStyle({ 
        backgroundColor: this.data.inputMatrixEnabled ? '#0077cc' : '#888' 
      });
      this.setMatrixInputInteractivity(this.data.inputMatrixEnabled);
    });

    this.data.sandboxContainer!.add(inputMatrixToggleLabel);
    this.data.sandboxContainer!.add(this.inputMatrixToggleBtn);

    // Arrows Toggle
    const arrowsToggleLabel = this.scene.add.text(toggleX, toggleLabelY + 40, 'Enable Arrows', { 
      font: '20px Arial', 
      color: '#222' 
    });
    
    this.arrowsToggleBtn = this.scene.add.text(toggleX + 220, toggleLabelY + 40, '[ON]', {
      font: '20px Arial', 
      color: '#fff', 
      backgroundColor: '#0077cc', 
      padding: { left: 10, right: 10, top: 4, bottom: 4 }
    }).setInteractive({ useHandCursor: true });

    this.arrowsToggleBtn.on('pointerdown', () => {
      this.data.arrowsEnabled = !this.data.arrowsEnabled;
      this.arrowsToggleBtn!.setText(this.data.arrowsEnabled ? '[ON]' : '[OFF]');
      this.arrowsToggleBtn!.setStyle({ 
        backgroundColor: this.data.arrowsEnabled ? '#0077cc' : '#888' 
      });
      this.setArrowsInteractivity(this.data.arrowsEnabled);
    });

    this.data.sandboxContainer!.add(arrowsToggleLabel);
    this.data.sandboxContainer!.add(this.arrowsToggleBtn);
  }
} 