import * as Phaser from 'phaser';
import { StateManager } from '../state/StateManager';
import { SharedData, NodeKey } from '../state/types';

export class HallwaysScene extends Phaser.Scene {
  private stateManager!: StateManager;
  private dataBag!: SharedData;
  private startTime!: number;
  private timerText!: Phaser.GameObjects.Text;
  private infoOverlay?: Phaser.GameObjects.Text;
  private isAnimating: boolean = false;
  // pause support
  private isPaused: boolean = false;
  private baseElapsedMs: number = 0;
  private resumeStartMs: number = 0;
  private pauseBtn?: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Container;

  private nodeCoords: Record<NodeKey, {x:number;y:number}> = {
    A: { x: 240, y: 560 },
    B: { x: 240, y: 240 },
    C: { x: 560, y: 240 },
    D: { x: 560, y: 560 }
  };

  private hallwayTransitions: Array<{ from: NodeKey; to: NodeKey; camIdx: number }> = [
    { from: 'A', to: 'B', camIdx: 0 },
    { from: 'B', to: 'C', camIdx: 1 },
    { from: 'C', to: 'D', camIdx: 2 },
    { from: 'C', to: 'A', camIdx: 3 },
    { from: 'D', to: 'A', camIdx: 4 }
  ];

  constructor() { super('HallwaysScene'); }

  preload() {
    this.load.image('red_arrow', '/hallways/red_arrow.webp');
    this.load.image('security_cam', '/hallways/security_cam.png');
  }

  create() {
    this.startTime = this.time.now;
    this.resumeStartMs = this.time.now;
    this.baseElapsedMs = 0;
    this.timerText = this.add.text(10, 10, '00:00', { font: '20px Arial', color: '#000' }).setOrigin(0, 0);

    // shared data
    this.dataBag = {
      selectedStart: 'A',
      selectedDest: 'A',
      peopleValue: '1',
      roomCounts: { A: 0, B: 0, C: 0, D: 0 },
      currentNode: 'A',
      savedMatrices: []
    };

    // board and UI
    this.drawDiagram();
    this.createMatrixInput();
    this.createControls();
    // (Removed) occupancy vector UI

    // state manager: start at Level 1
    this.stateManager = new StateManager(this, this.dataBag);
    this.stateManager.change(1);

    // Occupancy vector UI [A,B,C,D]
    const vectorValues = [0,0,0,0];
    const group = this.add.group();
    const baseX = 1500; const baseY = 620; const labels = ['A','B','C','D'];
    for (let i = 0; i < 4; i++) {
      const label = this.add.text(baseX - 30, baseY + i*30, labels[i], { font: '16px Arial', color: '#000' });
      const val = this.add.text(baseX, baseY + i*30, String(vectorValues[i]), { font: '18px Arial', color: '#000' }).setName(`occ_${i}`);
      group.addMultiple([label, val]);
    }
    this.dataBag.occupancyVector = group;

    // Pause UI
    this.setupPauseUI();
  }

  update(time: number) {
    let elapsed = this.baseElapsedMs;
    if (!this.isPaused) elapsed += (time - this.resumeStartMs);
    const totalSec = Math.floor(elapsed / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    this.timerText.setText(`${mm}:${ss}`);
    this.stateManager.getCurrent()?.update();
  }

  // --- diagram and inputs ---
  private drawDiagram() {
    // Offset vertically so original design center (400,400) aligns on Y only
    const dy = this.scale.height / 2 - 400;

    // update node centers with offset
    this.nodeCoords = {
      A: { x: 240, y: 560 + dy },
      B: { x: 240, y: 240 + dy },
      C: { x: 560, y: 240 + dy },
      D: { x: 560, y: 560 + dy }
    };
    this.dataBag.nodeCoords = this.nodeCoords;

    const g = this.add.graphics();
    const drawSquare = (color:number, letter:NodeKey, text:string) => {
      g.fillStyle(color, 1).fillRect(0, 0, 120, 120);
      const texKey = `box-${letter}`;
      g.generateTexture(texKey, 120, 120);
      g.clear();
      // Move rooms slightly toward the center so their outer corner reaches halfway into the hallway
      const pos = letter==='A'? {x:200,y:600+dy} : letter==='B'? {x:200,y:200+dy} : letter==='C'? {x:600,y:200+dy} : {x:600,y:600+dy};
      this.add.image(pos.x, pos.y, texKey).setAngle(45);
      // Lift the text higher within the diamond
      this.add.text(pos.x, pos.y - 24, `${letter}\n${text}`, { font: '20px Arial', color: '#000' }).setOrigin(0.5).setAlign('center');
    };
    drawSquare(0x7da0f7,'A','Art');      // brighter blue
    drawSquare(0xff7070,'B','Biology');  // vibrant coral-red
    drawSquare(0xffd43b,'C','Civics');   // bold sunflower yellow
    drawSquare(0xff8c42,'D','Drama');    // brighter orange

    g.lineStyle(4, 0x000000).strokeRect(200, 200 + dy, 400, 400);
    g.lineStyle(4, 0x000000);
    const wall1 = new Phaser.Geom.Triangle(275,275 + dy,475,275 + dy,275,475 + dy);
    const wall2 = new Phaser.Geom.Triangle(325,525 + dy,525,325 + dy,525,525 + dy);
    g.strokeTriangleShape(wall1);
    g.strokeTriangleShape(wall2);

    // helper to place small dots representing room populations
    const roomCenters = {
      A: { x: 200, y: 600 + dy },
      B: { x: 200, y: 200 + dy },
      C: { x: 600, y: 200 + dy },
      D: { x: 600, y: 600 + dy }
    } as const;
    this.dataBag.roomCenters = roomCenters as any;
    const getRoomCenter = (letter: 'A'|'B'|'C'|'D') => (roomCenters as any)[letter];
    const ensureRoomGroup = (letter: 'A'|'B'|'C'|'D') => {
      if (!this.dataBag.roomDots) this.dataBag.roomDots = {} as any;
      const groups = this.dataBag.roomDots as Record<'A'|'B'|'C'|'D', Phaser.GameObjects.Group | undefined>;
      if (!groups[letter]) groups[letter] = this.add.group();
      return groups[letter] as Phaser.GameObjects.Group;
    };
    const layoutRoomDots = (letter: 'A'|'B'|'C'|'D', count: number) => {
      const group = ensureRoomGroup(letter);
      // clear existing
      group.clear(true, true);
      const center = getRoomCenter(letter);
      const perRow = 4;
      for (let i = 0; i < Math.max(0, count); i++) {
        const r = Math.floor(i / perRow);
        const c = i % perRow;
        const dxDot = (c - (perRow - 1) / 2) * 16;
        // Push dots lower within the diamond (further from the text)
        const dyDot = (r - 1) * 16 + 24;
        const dot = this.add.circle(center.x + dxDot, center.y + dyDot, 6, 0x2ecc40);
        group.add(dot);
      }
    };
    // expose layout function to states
    (this as any)['__layoutRoomDots'] = layoutRoomDots;

    // cameras
    const cams = [
      { x: 200, y: 400 + dy, angle: -40, label: 'C1', offsetX: 20, offsetY: -60, scale: 0.025 },
      { x: 400, y: 200 + dy, angle: 30, label: 'C2', offsetX: -60, offsetY: 20, scale: 0.025 },
      { x: 600, y: 400 + dy, angle: 150, label: 'C3', offsetX: -10, offsetY: 80, scale: 0.025 },
      { x: 400, y: 400 + dy, angle: 180, label: 'C4', offsetX: -30, offsetY: 60, scale: 0.025 },
      { x: 400, y: 600 + dy, angle: 225, label: 'C5', offsetX: -70, offsetY: -20, scale: 0.025 },
    ];
    cams.forEach(({ x, y, angle, label, offsetX = 0, offsetY = 0, scale = 0.13 }) => {
      this.add.image(x + offsetX, y + offsetY, 'security_cam').setAngle(angle).setScale(scale);
      this.add.text(x + 15, y - 15, label, { font: '18px Arial', color: '#000' });
    });

    // arrows
    const arrows = {
      left: this.add.image(240, 400 + dy, 'red_arrow').setScale(0.3).setAngle(-90).setInteractive({ useHandCursor: true }),
      top: this.add.image(400, 240 + dy, 'red_arrow').setScale(0.3).setAngle(0).setInteractive({ useHandCursor: true }),
      right: this.add.image(565, 400 + dy, 'red_arrow').setScale(0.3).setAngle(90).setInteractive({ useHandCursor: true }),
      bottom: this.add.image(400, 565 + dy, 'red_arrow').setScale(0.3).setAngle(180).setInteractive({ useHandCursor: true }),
      center: this.add.image(400, 400 + dy, 'red_arrow').setScale(0.3).setAngle(135).setInteractive({ useHandCursor: true })
    };

    const pulseArrow = (arrow: Phaser.GameObjects.Image) => {
      const baseScaleX = arrow.getData('baseScaleX') ?? arrow.scaleX;
      const baseScaleY = arrow.getData('baseScaleY') ?? arrow.scaleY;
      const previousTween = arrow.getData('pulseTween') as Phaser.Tweens.Tween | undefined;
      previousTween?.stop();
      arrow.setScale(baseScaleX, baseScaleY);
      const tween = this.tweens.add({
        targets: arrow,
        scaleX: baseScaleX * 1.12,
        scaleY: baseScaleY * 1.12,
        duration: 140,
        yoyo: true,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          arrow.setScale(baseScaleX, baseScaleY);
          arrow.setData('pulseTween', undefined);
        }
      });
      arrow.setData('pulseTween', tween);
    };

    Object.values(arrows).forEach((arrow) => {
      arrow.setData('baseScaleX', (arrow as Phaser.GameObjects.Image).scaleX);
      arrow.setData('baseScaleY', (arrow as Phaser.GameObjects.Image).scaleY);
    });

    const greenCircle = this.add.circle(this.nodeCoords.A.x, this.nodeCoords.A.y, 14, 0x2ecc40);
    // ensure no badge text is displayed (no hallway count)
    const greenText = this.add.text(this.nodeCoords.A.x, this.nodeCoords.A.y, '', { font: '16px Arial', color: '#fff' }).setOrigin(0.5);
    greenText.setVisible(false);
    
    this.dataBag.arrows = arrows;
    this.dataBag.greenCircle = greenCircle as any;
    this.dataBag.greenCircleText = greenText as any;
    this.dataBag.currentNode = 'A';

    // movement handlers update current node and can be overridden by states
    const moveTo = (to: NodeKey) => {
      if (!this.dataBag.greenCircle) return;
      const { x, y } = (this.dataBag.nodeCoords || this.nodeCoords)[to];
      this.tweens.add({ targets: [this.dataBag.greenCircle, this.dataBag.greenCircleText], x, y, duration: 400, ease: 'Power2', onComplete: () => {
        this.dataBag.currentNode = to;
        const current = this.stateManager.getCurrent() as any;
        if (current && typeof current.onNodeChanged === 'function') {
          current.onNodeChanged(to);
        }
      }});
    };

    const handleArrow = (from: NodeKey, to: NodeKey, camIdx: number) => {
      // Always increment the corresponding camera count
      this.incrementMatrixValue(camIdx);
      // If the green circle is at the arrow's source, move it; otherwise just transfer people
      if ((this.dataBag.currentNode || 'A') === from) {
        this.transferOne(from, to);
        moveTo(to);
      } else {
        this.transferOne(from, to);
      }
    };

    const registerArrow = (arrow: Phaser.GameObjects.Image, from: NodeKey, to: NodeKey, camIdx: number) => {
      arrow.on('pointerdown', () => {
        pulseArrow(arrow);
        handleArrow(from, to, camIdx);
      });
    };

    // Map each arrow to its hallway edge
    registerArrow(arrows.left, 'A', 'B', 0);   // C1: A -> B
    registerArrow(arrows.top, 'B', 'C', 1);    // C2: B -> C
    registerArrow(arrows.right, 'C', 'D', 2);  // C3: C -> D
    registerArrow(arrows.center, 'C', 'A', 3); // C4: C -> A
    registerArrow(arrows.bottom, 'D', 'A', 4); // C5: D -> A
  }

  private createMatrixInput() {
    const x = 1150, y = 620, rows = 5, cols = 1, cellSize = 50, spacing = 10;
    const values: string[][] = Array.from({ length: rows }, () => Array(cols).fill('0'));
    const cells: any[][] = [];
    let focusedCell: any | null = null;
    const g = this.add.graphics();
    const extraHeight = 30; const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight; const bracketYOffset = -extraHeight / 2; const bracketWidth = 20; const overlap = 4;
    g.lineStyle(8, 0x000000);
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y + bracketYOffset, x - bracketWidth, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketYOffset, x, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketHeight + bracketYOffset, x, y + bracketHeight + bracketYOffset));
    const rightX = x + cols * (cellSize + spacing) - spacing + bracketWidth;
    g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketYOffset, rightX, y + bracketHeight + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX - bracketWidth, y + bracketYOffset, rightX + overlap, y + bracketYOffset));
    g.strokeLineShape(new Phaser.Geom.Line(rightX - bracketWidth, y + bracketHeight + bracketYOffset, rightX + overlap, y + bracketHeight + bracketYOffset));
    for (let r = 0; r < rows; r++) {
      const rowCells: any[] = [];
      for (let c = 0; c < cols; c++) {
        const cellX = x + c * (cellSize + spacing);
        const cellY = y + r * (cellSize + spacing);
        const rect = this.add.rectangle(cellX + cellSize/2, cellY + cellSize/2, cellSize, cellSize, 0xffffff, 1).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
        const text = this.add.text(cellX + cellSize/2, cellY + cellSize/2, values[r][c], { font: '20px Arial', color: '#000', align: 'center' }).setOrigin(0.5);
        const onKey = (cell: any) => (event: KeyboardEvent) => {
          let val = values[cell.row][cell.col];
          if (event.key === 'Backspace') val = val.slice(0, -1);
          else if (event.key.length === 1 && /[0-9\-]/.test(event.key)) { if (val.length < 3) val += event.key; }
          else if (event.key === 'Enter') { return; }
          values[cell.row][cell.col] = val; text.setText(val);
          const current = this.stateManager.getCurrent() as any;
          if (current && typeof current.onMatrixUpdated === 'function') current.onMatrixUpdated();
        };
        const cell = { rect, text, row: r, col: c };
        rect.on('pointerdown', () => {
          // Remove previous highlight
          if (focusedCell) focusedCell.rect.setStrokeStyle(2, 0x000000);
          focusedCell = cell;
          rect.setStrokeStyle(4, 0x4287f5); // Highlight
          // Clear current cell value on click
          values[cell.row][cell.col] = '';
          text.setText('');
          const current = this.stateManager.getCurrent() as any;
          if (current && typeof current.onMatrixUpdated === 'function') current.onMatrixUpdated();

          this.input.keyboard?.off('keydown');
          this.input.keyboard?.on('keydown', onKey(cell));
        });
        rowCells.push(cell);
      }
      cells.push(rowCells);
    }
    this.dataBag.matrixInput = {
      cells,
      values,
      setValue: (row:number,col:number,value:string) => { values[row][col] = value; cells[row][col].text.setText(value); },
      getValue: (row:number,col:number) => values[row][col]
    };

    // Store frame and labels so levels can toggle them
    this.dataBag.matrixFrame = g;
    const labels: Phaser.GameObjects.Text[] = [];
    const labelText = ['C1','C2','C3','C4','C5'];
    for (let i = 0; i < rows; i++) {
      const lx = x - 60;
      const ly = y + i * (cellSize + spacing) + cellSize/2;
      const lbl = this.add.text(lx, ly, labelText[i], { font: '20px Arial', color: '#000' }).setOrigin(1, 0.5);
      lbl.setVisible(false);
      labels.push(lbl);
    }
    this.dataBag.matrixLabels = labels;
  }

  private createControls() {
    const width = this.scale.width, height = this.scale.height;
    const nextBtn = this.add.text(width - 40, height - 40, 'Next', { font: '28px Arial', color: '#fff', backgroundColor: '#333', padding: { left: 16, right: 16, top: 8, bottom: 8 }, align: 'center', fontStyle: 'bold' }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => {
      this.handleNextFromLevel1();
    });

    // Removed always-visible Info/Reset per request. They appear in Pause menu.

    // (Sandbox quick-return button removed per request)

    // Animate button (below diagram, centered)
    const dy = this.scale.height / 2 - 400;
    const btnWidth = 200, btnHeight = 64;
    const btnContainer = this.add.container(400, 600 + dy + 120);
    const shadow = this.add.graphics();
    shadow.fillStyle(0x2f2f2f, 0.35);
    shadow.fillRoundedRect(-btnWidth/2 + 6, -btnHeight/2 + 6, btnWidth, btnHeight, 16);
    const bg = this.add.graphics();
    bg.fillStyle(0xff8c7f, 1);
    bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 16);
    const label = this.add.text(0, 0, 'Animate', { font: '28px Arial', color: '#ffffff' }).setOrigin(0.5);
    // Transparent hit zone centered on the button to fix offset hitbox
    const hit = this.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btnContainer.add([shadow, bg, label, hit]);
    btnContainer.setSize(btnWidth, btnHeight);
    hit.on('pointerdown', () => this.handleAnimateButton());
    hit.on('pointerover', () => { bg.clear(); bg.fillStyle(0xffa092, 1); bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 16); });
    hit.on('pointerout',  () => { bg.clear(); bg.fillStyle(0xff8c7f, 1); bg.fillRoundedRect(-btnWidth/2, -btnHeight/2, btnWidth, btnHeight, 16); });
  }
 

  private incrementMatrixValue(row: number) {
    const input = this.dataBag.matrixInput;
    if (!input) return;
    const prev = parseInt(input.getValue(row, 0) || '0') || 0;
    const currentId = this.stateManager.getCurrentId?.() ?? null;
    const inc = currentId === 3 ? 2 : 1;
    input.setValue(row, 0, String(prev + inc));
    // Notify level state (e.g., Level 5) that matrix changed, so it can recompute results
    const current = this.stateManager.getCurrent() as any;
    if (current && typeof current.onMatrixUpdated === 'function') {
      current.onMatrixUpdated();
    }
  }

  private resetGame() {
    // Always force everything back to the level's defined defaults
    const currentId = this.stateManager.getCurrentId?.() ?? 0;

    // 1) Clear default 5x1 matrix values (safe no-op for Level 7 which hides it)
    const input = this.dataBag.matrixInput;
    if (input) {
      for (let r = 0; r < input.cells.length; r++) {
        for (let c = 0; c < input.cells[r].length; c++) {
          input.setValue(r, c, '0');
        }
      }
    }

    // 2) Reset room counts to per-level defaults
    const defaultCounts = (() => {
      if (currentId === 7) return { A: 8, B: 8, C: 8, D: 8 } as any;
      if (currentId === 0) return { A: 0, B: 0, C: 0, D: 0 } as any;
      return { A: 5, B: 5, C: 5, D: 5 } as any; // Levels 1–6
    })();
    this.dataBag.roomCounts = defaultCounts;

    // 3) Reset position to A immediately (enter() will also do this)
    const coords = this.dataBag.nodeCoords || { A:{x:240,y:560}, B:{x:240,y:240}, C:{x:560,y:240}, D:{x:560,y:560} };
    const start = (coords as any)['A'];
    if (this.dataBag.greenCircle && start) {
      this.dataBag.greenCircle.setPosition(start.x, start.y);
      this.dataBag.currentNode = 'A';
    }
    if (this.dataBag.greenCircleText && start) this.dataBag.greenCircleText.setPosition(start.x, start.y);

    // 4) Refresh dots and occupancy values
    const sceneAny = this as any;
    if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') {
      ['A','B','C','D'].forEach((letter) => {
        const count = (this.dataBag.roomCounts as any)?.[letter] || 0;
        sceneAny['__layoutRoomDots'](letter, count);
      });
    }
    this.updateOccupancyVector();

    // 4b) If Sandbox room inputs exist, sync those text boxes to counts
    const roomTexts = this.dataBag.roomPeopleTexts || {};
    (['A','B','C','D'] as ('A'|'B'|'C'|'D')[]).forEach((l) => {
      const t = (roomTexts as any)[l] as Phaser.GameObjects.Text | undefined;
      if (t) t.setText(String((this.dataBag.roomCounts as any)[l] || 0));
    });

    // 5) Re-enter the current level to rebuild level-specific UI and logic defaults
    this.stateManager.change(currentId);

    // 6) Reset timer
    this.startTime = this.time.now;
    this.baseElapsedMs = 0;
    this.resumeStartMs = this.time.now;
    this.timerText.setText('00:00');
  }

  private handleNextFromLevel1() {
    const input = this.dataBag.matrixInput;
    if (!input) return;
    const currentId = this.stateManager.getCurrentId() ?? 0;
    const isSandbox = currentId === 0;
    const isLevel1 = currentId === 1;
    const isLevel2 = currentId === 2;
    const isLevel3 = currentId === 3;
    const target = isLevel1 ? [3, 3, 3, 0, 3] : isLevel2 ? [5, 5, 3, 2, 3] : null;
    const actual: number[] = [];
    for (let i = 0; i < 5; i++) {
      const raw = (input.getValue(i, 0) || '0').toString();
      const n = parseInt(raw.replace(/[^0-9\-]/g, '') || '0', 10) || 0;
      actual.push(n);
    }

    if (target && !isSandbox) {
      let hasGreater = false, hasLess = false;
      for (let i = 0; i < 5; i++) {
        if (actual[i] > target[i]) { hasGreater = true; break; }
      }
      if (!hasGreater) {
        for (let i = 0; i < 5; i++) {
          if (actual[i] < target[i]) { hasLess = true; break; }
        }
      }

      if (hasGreater) {
        alert('The circle traveled more than required.');
        return;
      }
      if (hasLess) {
        alert("The values don't match");
        return;
      }
    }

    // Progression with validation for Level 3
    if (isSandbox) {
      this.resetGame();
      this.stateManager.change(1);
    } else if (isLevel1) {
      this.resetGame();
      this.stateManager.change(2);
    } else if (isLevel2) {
      this.resetGame();
      this.stateManager.change(3);
    } else if (isLevel3) {
      // Validate: end at D
      const cVals: number[] = [0,0,0,0,0];
      for (let i = 0; i < 5; i++) {
        const raw = (input.getValue(i, 0) || '0').toString();
        const sanitized = raw.replace(/[^0-9\-]/g, '');
        cVals[i] = parseInt(sanitized || '0', 10) || 0;
      }
      const startNode = (this.dataBag.selectedStart || 'A') as NodeKey;
      const path = this.simulateHallwayPath(startNode, cVals);
      const finalNode = path[path.length - 1];
      if (finalNode !== 'D') {
        alert('Not quite yet — end at Drama (D) to proceed.');
        return;
      }
      this.resetGame();
      this.stateManager.change(4);
    } else if ((this.stateManager.getCurrentId?.() ?? null) === 4) {
      // Level 4: no checks or alerts; just advance
      this.resetGame();
      this.stateManager.change(5);
    } else if ((this.stateManager.getCurrentId?.() ?? null) === 5) {
      // Level 5: validate result equals [6,6,6,0,6]
      const current = this.stateManager.getCurrent() as any;
      if (current && typeof current.isLevelComplete === 'function') {
        const ok = current.isLevelComplete();
        if (!ok) {
          alert("The values don't match");
          return;
        }
      }
      this.resetGame();
      this.stateManager.change(6);
    } else if ((this.stateManager.getCurrentId?.() ?? null) === 6) {
      this.resetGame();
      this.stateManager.change(7);
    } else if ((this.stateManager.getCurrentId?.() ?? null) === 7) {
      this.resetGame();
      this.stateManager.change(8);
    } else if ((this.stateManager.getCurrentId?.() ?? null) === 8) {
      this.resetGame();
      this.stateManager.change(9);
    } else {
      alert('Great job!');
    }
  }

  // ===== Pause UI =====
  private setupPauseUI() {
    const { width } = this.scale;
    this.pauseBtn = this.add.text(width - 10, 10, 'Pause', {
      font: '20px Arial', color: '#fff', backgroundColor: '#333',
      padding: { left: 12, right: 12, top: 6, bottom: 6 }, align: 'center', fontStyle: 'bold'
    }).setOrigin(1, 0).setDepth(4000).setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => { this.isPaused ? this.resumeGame() : this.pauseGame(); });
    this.input.keyboard?.on('keydown-ESC', () => { this.isPaused ? this.resumeGame() : this.pauseGame(); });
  }

  private buildPauseOverlay() {
    const { width, height } = this.scale;
    const overlay = this.add.container(0, 0);
    const dim = this.add.rectangle(0, 0, width, height, 0x000000, 0.35).setOrigin(0, 0).setInteractive();
    overlay.add(dim);

    const panelWidth = 460;
    const panel = this.add.rectangle(width - panelWidth, 0, panelWidth, height, 0xffffff, 1).setOrigin(0, 0).setStrokeStyle(2, 0x000000);
    overlay.add(panel);
    const title = this.add.text(width - panelWidth + 24, 24, 'Paused', { font: '28px Arial', color: '#000' });
    overlay.add(title);

    const infoText = 'Click the red arrows to move the green circle. Each time the circle crosses a security camera, that camera increments its counter. Use the inputs to set C1–C5 or click arrows to build the matrix.';
    const info = this.add.text(width - panelWidth + 24, 70, infoText, { font: '18px Arial', color: '#222', wordWrap: { width: panelWidth - 48 } });
    overlay.add(info);

    const makeBtn = (y:number, label:string, bg:number, onClick:() => void) => {
      const btn = this.add.text(width - panelWidth + 24, y, label, { font: '22px Arial', color: '#fff', backgroundColor: `#${bg.toString(16).padStart(6,'0')}`, padding: { left: 16, right: 16, top: 8, bottom: 8 } }).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', onClick);
      overlay.add(btn);
      return btn;
    };
    makeBtn(220, 'Resume', 0x2e7d32, () => this.resumeGame());
    makeBtn(280, 'Reset', 0x616161, () => this.resetGame());

    const lvlTitle = this.add.text(width - panelWidth + 24, 350, 'Level Select', { font: '20px Arial', color: '#000' });
    overlay.add(lvlTitle);
    const levels = [ {label:'Sandbox', id:0}, {label:'Level 1', id:1}, {label:'Level 2', id:2}, {label:'Level 3', id:3}, {label:'Level 4', id:4}, {label:'Level 5', id:5}, {label:'Level 6', id:6}, {label:'Level 7', id:7}, {label:'Level 8', id:8}, {label:'Level 9', id:9} ];
    levels.forEach((lvl, i) => {
      const lbtn = this.add.text(width - panelWidth + 24, 390 + i*40, lvl.label, { font: '20px Arial', color: '#0077cc' }).setInteractive({ useHandCursor: true });
      lbtn.on('pointerdown', () => { this.resetGame(); this.stateManager.change(lvl.id); this.resumeGame(); });
      overlay.add(lbtn);
    });

    overlay.setDepth(3500);
    overlay.setVisible(false);
    this.pauseOverlay = overlay;
  }

  private pauseGame() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.baseElapsedMs += this.time.now - this.resumeStartMs;
    this.tweens.pauseAll();
    if (!this.pauseOverlay) this.buildPauseOverlay();
    this.pauseOverlay!.setVisible(true);
    this.pauseBtn?.setText('Resume');
  }

  private resumeGame() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.resumeStartMs = this.time.now;
    this.tweens.resumeAll();
    this.pauseOverlay?.setVisible(false);
    this.pauseBtn?.setText('Pause');
  }

  private simulateHallwayPath(start: NodeKey, matrix: number[]): NodeKey[] {
    const path: NodeKey[] = [start];
    const cams = matrix.slice();
    let current: NodeKey = start;
    let guard = 0;
    while (guard < 1000) { // guard against infinite loops
      let moved = false;

      // Smart choice at node C to avoid getting stranded at D when C5 is 0
      if (current === 'C') {
        const canC3 = (cams[2] || 0) > 0; // C -> D
        const canC4 = (cams[3] || 0) > 0; // C -> A
        if (!canC3 && !canC4) break;

        // Prefer C4 when going to D would strand us (no C5) and there are remaining moves using C1/C2
        const thereIsMoreWorkFromA = (cams[0] || 0) > 0 || (cams[1] || 0) > 0;
        if (canC4 && (!canC3 || ((cams[4] || 0) === 0 && thereIsMoreWorkFromA))) {
          cams[3] = (cams[3] || 0) - 1; // use C4
          current = 'A';
          path.push(current);
          moved = true;
        } else if (canC3) {
          cams[2] = (cams[2] || 0) - 1; // use C3
          current = 'D';
          path.push(current);
          moved = true;
        } else if (canC4) {
          cams[3] = (cams[3] || 0) - 1; // fallback to C4
          current = 'A';
          path.push(current);
          moved = true;
        }
      } else {
        // Generic choice elsewhere: take the first available transition
        for (const t of this.hallwayTransitions) {
          if (t.from === current && (cams[t.camIdx] || 0) > 0) {
            cams[t.camIdx] = (cams[t.camIdx] || 0) - 1;
            current = t.to;
            path.push(current);
            moved = true;
            break;
          }
        }
      }
      if (!moved) break;
      guard++;
    }
    return path;
  }

  // Move one student from room "from" to room "to" with a small dot animation
  private transferOne(from: NodeKey, to: NodeKey) {
    const counts = this.dataBag.roomCounts || { A:0, B:0, C:0, D:0 };
    const currentId = this.stateManager.getCurrentId?.() ?? null;
    const available = Math.max(0, (counts as any)[from] || 0);
    if (currentId !== 0 && available <= 0) return;

    let delta = 1;
    if (currentId === 3) delta = 2;
    else if (currentId === 5) {
      const mult = this.dataBag.movementMultiplier;
      delta = typeof mult === 'number' ? Math.max(0, mult) : 2;
    }

    let moveAmount = delta;
    if (currentId !== 0) moveAmount = Math.min(available, delta);
    if (moveAmount <= 0) return;

    const newFrom = Math.max(0, available - moveAmount);
    const actualMoved = available - newFrom;

    (counts as any)[from] = newFrom;
    (counts as any)[to] = ((counts as any)[to] || 0) + actualMoved;
    this.dataBag.roomCounts = counts as any;

    if (actualMoved > 0) {
      const sceneAny = this as any;
      if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') {
        ['A','B','C','D'].forEach((letter) => {
          const count = (this.dataBag.roomCounts as any)?.[letter] || 0;
          sceneAny['__layoutRoomDots'](letter, count);
        });
      }
      this.updateOccupancyVector();
    }
  }

  private updateOccupancyVector() {
    const group = this.dataBag.occupancyVector;
    if (!group) return;
    const counts = [
      this.dataBag.roomCounts?.A || 0,
      this.dataBag.roomCounts?.B || 0,
      this.dataBag.roomCounts?.C || 0,
      this.dataBag.roomCounts?.D || 0
    ];
    const children = group.getChildren();
    for (const obj of children) {
      if (obj.name && obj.name.startsWith('occ_')) {
        const idx = parseInt((obj.name.split('_')[1]) as any);
        (obj as Phaser.GameObjects.Text).setText(String(counts[idx]));
      }
    }
  }

  private async handleAnimateButton() {
    if (this.isAnimating) return;
    const circle = this.dataBag.greenCircle;
    const text = this.dataBag.greenCircleText;
    const input = this.dataBag.matrixInput;
    if (!circle || !input) return;

    // Read c1-c5 from input matrix
    const cVals: number[] = [0,0,0,0,0];
    for (let i = 0; i < 5; i++) {
      const raw = (input.getValue(i, 0) || '0').toString();
      const sanitized = raw.replace(/[^0-9\-]/g, '');
      const num = parseInt(sanitized || '0', 10);
      cVals[i] = isNaN(num) ? 0 : num;
    }

    // Always reset to the selected start node
    const startNode: NodeKey = (this.dataBag.selectedStart || 'A') as NodeKey;
    const startPos = (this.dataBag.nodeCoords || this.nodeCoords)[startNode];
    circle.setPosition(startPos.x, startPos.y);
    if (text) text.setPosition(startPos.x, startPos.y);

    // Simulate and animate
    let path = this.simulateHallwayPath(startNode, cVals);

    // Fallbacks to ensure movement when matrix sum > 0
    const total = cVals.reduce((a, b) => a + Math.max(0, b), 0);
    if (path.length <= 1 && total > 0) {
      // Try a valid first step from the start node
      const fromStart = this.hallwayTransitions.find(t => t.from === startNode && (cVals[t.camIdx] || 0) > 0);
      if (fromStart) {
        const cams2 = cVals.slice();
        cams2[fromStart.camIdx] = (cams2[fromStart.camIdx] || 0) - 1;
        const extra = this.simulateHallwayPath(fromStart.to as NodeKey, cams2);
        path = [startNode, ...extra];
      } else {
        // If no step is available from the start, seed from any available camera by repositioning
        const anyStep = this.hallwayTransitions.find(t => (cVals[t.camIdx] || 0) > 0);
        if (anyStep) {
          const fromPos = (this.dataBag.nodeCoords || this.nodeCoords)[anyStep.from];
          circle.setPosition(fromPos.x, fromPos.y);
          if (text) text.setPosition(fromPos.x, fromPos.y);
          const cams3 = cVals.slice();
          cams3[anyStep.camIdx] = (cams3[anyStep.camIdx] || 0) - 1;
          const extra2 = this.simulateHallwayPath(anyStep.to as NodeKey, cams3);
          path = [anyStep.from, ...extra2];
        }
      }
    }
    this.isAnimating = true;
    for (let i = 1; i < path.length; i++) {
      const from = path[i - 1] as NodeKey;
      const to = path[i] as NodeKey;
      const target = (this.dataBag.nodeCoords || this.nodeCoords)[to];
      await new Promise<void>((resolve) => {
        this.tweens.add({
          targets: text ? [circle, text] : [circle],
          x: target.x,
          y: target.y,
          duration: 600,
          ease: 'Power2',
          onComplete: () => { this.transferOne(from, to); resolve(); }
        });
      });
    }
    this.isAnimating = false;
  }
}


