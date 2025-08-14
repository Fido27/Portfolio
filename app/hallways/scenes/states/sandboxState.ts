import * as Phaser from 'phaser';
import { BaseState, GameStateData } from './baseState';

export class SandboxState extends BaseState {
  private startButtons: Phaser.GameObjects.Text[] = [];
  private destButtons: Phaser.GameObjects.Text[] = [];
  private inputMatrixToggleBtn?: Phaser.GameObjects.Text;
  private arrowsToggleBtn?: Phaser.GameObjects.Text;
  private peopleCellRect?: Phaser.GameObjects.Rectangle;
  private peopleFocused: boolean = false;
  private roomCellRects: { [k in 'A'|'B'|'C'|'D']?: Phaser.GameObjects.Rectangle } = {};
  private roomFocused: { [k in 'A'|'B'|'C'|'D']?: boolean } = {};

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

    // Classroom population inputs
    this.createRoomInputs();

    // Initial dots for rooms
    this.refreshAllRoomDots();
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
        // mirror hallway count
        const parsed = parseInt(val);
        if (!isNaN(parsed)) {
          this.data.hallwayCount = parsed;
        }
        (this.scene as any).updateOccupancyVector?.();
      });
    });
  }

  private createRoomInputs(): void {
    const baseY = 380;
    const leftX = 950;
    const cellSize = 44;
    const letters: ('A'|'B'|'C'|'D')[] = ['A','B','C','D'];
    const labels = ['People in A', 'People in B', 'People in C', 'People in D'];
    if (!this.data.roomCounts) this.data.roomCounts = { A: 0, B: 0, C: 0, D: 0 };
    if (!this.data.roomPeopleTexts) this.data.roomPeopleTexts = {};
    if (!this.data.roomPeopleRects) this.data.roomPeopleRects = {};

    letters.forEach((letter, idx) => {
      const y = baseY + idx * 56;
      const label = this.scene.add.text(leftX, y, labels[idx], {
        font: '20px Arial',
        color: '#222'
      });
      this.data.sandboxContainer!.add(label);

      const cellX = leftX + 220;
      const cellY = y + (label.height - cellSize) / 2;

      const rect = this.scene.add.rectangle(
        cellX + cellSize/2,
        cellY + cellSize/2,
        cellSize,
        cellSize,
        0xffffff,
        1
      ).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });

      const txt = this.scene.add.text(
        cellX + cellSize/2,
        cellY + cellSize/2,
        String(this.data.roomCounts![letter]),
        { font: '18px Arial', color: '#000', align: 'center' }
      ).setOrigin(0.5);

      this.data.sandboxContainer!.add(rect);
      this.data.sandboxContainer!.add(txt);
      this.data.roomPeopleRects![letter] = rect;
      this.data.roomPeopleTexts![letter] = txt;

      // Transfer buttons
      const pullBtn = this.scene.add.text(cellX + 60, y, '← Hall', {
        font: '18px Arial', color: '#fff', backgroundColor: '#444',
        padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setInteractive({ useHandCursor: true });
      const pushBtn = this.scene.add.text(cellX + 150, y, '→ Room', {
        font: '18px Arial', color: '#fff', backgroundColor: '#444',
        padding: { left: 8, right: 8, top: 4, bottom: 4 }
      }).setInteractive({ useHandCursor: true });
      this.data.sandboxContainer!.add(pullBtn);
      this.data.sandboxContainer!.add(pushBtn);

      pullBtn.on('pointerdown', () => this.transferFromRoomToHall(letter));
      pushBtn.on('pointerdown', () => this.transferFromHallToRoom(letter));

      // Typing handler per room
      rect.on('pointerdown', () => {
        this.roomFocused[letter] = true;
        txt.setText('');
        rect.setStrokeStyle(4, 0x4287f5);
        this.scene.input.keyboard?.off('keydown');
        this.scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
          if (!this.roomFocused[letter]) return;
          let v = this.data.roomCounts![letter].toString();
          // when first click we cleared text; rebuild v from text value
          v = txt.text;
          if (event.key === 'Backspace') {
            v = v.slice(0, -1);
          } else if (event.key.length === 1 && /[0-9]/.test(event.key)) {
            if (v.length < 5) v += event.key;
          } else if (event.key === 'Enter') {
            this.roomFocused[letter] = false;
            rect.setStrokeStyle(2, 0x000000);
            return;
          }
          txt.setText(v);
          const parsed = parseInt(v);
          if (!isNaN(parsed)) {
            this.data.roomCounts![letter] = parsed;
            this.syncRoomDots(letter);
            (this.scene as any).updateOccupancyVector?.();
          }
        });
      });
    });
  }

  private getRoomCenter(letter: 'A'|'B'|'C'|'D') {
    const map = { A: { x: 150, y: 650 }, B: { x: 150, y: 150 }, C: { x: 650, y: 150 }, D: { x: 650, y: 650 } };
    return map[letter];
  }

  private getNodeCenter(letter: 'A'|'B'|'C'|'D') {
    const map = { A: { x: 240, y: 560 }, B: { x: 240, y: 240 }, C: { x: 560, y: 240 }, D: { x: 560, y: 560 } };
    return map[letter];
  }

  private syncRoomDots(letter: 'A'|'B'|'C'|'D') {
    if (!this.data.roomDots) this.data.roomDots = {} as any;
    const roomDots = this.data.roomDots!;
    let group = roomDots[letter];
    if (!group) {
      group = this.scene.add.group();
      roomDots[letter] = group;
    }
    const desired = Math.max(0, this.data.roomCounts ? this.data.roomCounts[letter] : 0);
    const current = group.getChildren().length;
    const center = this.getRoomCenter(letter);
    const radius = 6;
    // layout in a small grid around center
    const perRow = 4;
    if (current < desired) {
      for (let i = current; i < desired; i++) {
        const r = Math.floor(i / perRow);
        const c = i % perRow;
        const dx = (c - (perRow - 1) / 2) * 16;
        const dy = (r - 1) * 16;
        const dot = this.scene.add.circle(center.x + dx, center.y + dy, radius, 0x2ecc40);
        group.add(dot);
      }
    } else if (current > desired) {
      const toRemove = current - desired;
      const children = group.getChildren();
      for (let i = 0; i < toRemove; i++) {
        const obj = children[children.length - 1 - i] as Phaser.GameObjects.GameObject;
        obj.destroy();
      }
    }
  }

  private refreshAllRoomDots() {
    (['A','B','C','D'] as ('A'|'B'|'C'|'D')[]).forEach(l => this.syncRoomDots(l));
  }

  private transferFromRoomToHall(letter: 'A'|'B'|'C'|'D') {
    if (!this.data.roomCounts || typeof this.data.hallwayCount !== 'number') return;
    if (this.data.currentNode !== letter) return; // only when at the node
    if (this.data.roomCounts[letter] <= 0) return;
    this.data.roomCounts[letter] -= 1;
    this.data.hallwayCount = (this.data.hallwayCount || 0) + 1;
    this.updateHallwayCellFromCount();
    this.updateRoomCell(letter);
    // update occupancy vector if available
    (this.scene as any).updateOccupancyVector?.();
    // animate dot from room to node
    const center = this.getRoomCenter(letter);
    const node = this.getNodeCenter(letter);
    const dot = this.scene.add.circle(center.x, center.y, 6, 0x2ecc40);
    this.scene.tweens.add({ targets: dot, x: node.x, y: node.y, duration: 300, ease: 'Power2', onComplete: () => dot.destroy() });
    // also remove one static dot from the group
    const group = this.data.roomDots?.[letter];
    if (group && group.getChildren().length > 0) {
      const child = group.getChildren()[group.getChildren().length - 1] as Phaser.GameObjects.GameObject;
      child.destroy();
    }
  }

  private transferFromHallToRoom(letter: 'A'|'B'|'C'|'D') {
    if (!this.data.roomCounts || typeof this.data.hallwayCount !== 'number') return;
    if (this.data.currentNode !== letter) return;
    if ((this.data.hallwayCount || 0) <= 0) return;
    this.data.hallwayCount = (this.data.hallwayCount || 0) - 1;
    this.data.roomCounts[letter] += 1;
    this.updateHallwayCellFromCount();
    this.updateRoomCell(letter);
    // update occupancy vector if available
    (this.scene as any).updateOccupancyVector?.();
    // animate from node to room
    const center = this.getRoomCenter(letter);
    const node = this.getNodeCenter(letter);
    const dot = this.scene.add.circle(node.x, node.y, 6, 0x2ecc40);
    this.scene.tweens.add({ targets: dot, x: center.x, y: center.y, duration: 300, ease: 'Power2', onComplete: () => { dot.destroy(); this.syncRoomDots(letter); } });
  }

  private updateHallwayCellFromCount() {
    if (!this.data.peopleCellText) return;
    const count = this.data.hallwayCount || 0;
    this.data.peopleValue = String(count);
    this.data.peopleCellText.setText(this.data.peopleValue);
  }

  private updateRoomCell(letter: 'A'|'B'|'C'|'D') {
    const txt = this.data.roomPeopleTexts?.[letter];
    if (txt && this.data.roomCounts) txt.setText(String(this.data.roomCounts[letter]));
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