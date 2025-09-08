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
    this.timerText = this.add.text(10, 10, '00:00', { font: '20px Arial', color: '#000' }).setOrigin(0, 0);

    // shared data
    this.dataBag = {
      selectedStart: 'A',
      selectedDest: 'A',
      peopleValue: '1',
      hallwayCount: 1,
      roomCounts: { A: 0, B: 0, C: 0, D: 0 },
      currentNode: 'A'
    };

    // board and UI
    this.drawDiagram();
    this.createMatrixInput();
    this.createControls();
    // (Removed) occupancy vector UI

    // state manager: start at Level 1
    this.stateManager = new StateManager(this, this.dataBag);
    this.stateManager.change(1);
  }

  update(time: number) {
    const elapsed = time - this.startTime;
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
      const pos = letter==='A'? {x:150,y:650+dy} : letter==='B'? {x:150,y:150+dy} : letter==='C'? {x:650,y:150+dy} : {x:650,y:650+dy};
      this.add.image(pos.x, pos.y, texKey).setAngle(45);
      this.add.text(pos.x, pos.y, `${letter}\n${text}`, { font: '20px Arial', color: '#000' }).setOrigin(0.5).setAlign('center');
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
    const getRoomCenter = (letter: 'A'|'B'|'C'|'D') => {
      return letter==='A'? { x: 150, y: 650 + dy } : letter==='B'? { x: 150, y: 150 + dy } : letter==='C'? { x: 650, y: 150 + dy } : { x: 650, y: 650 + dy };
    };
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
        const dyDot = (r - 1) * 16;
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

    const greenCircle = this.add.circle(this.nodeCoords.A.x, this.nodeCoords.A.y, 18, 0x2ecc40);
    const greenText = this.add.text(this.nodeCoords.A.x, this.nodeCoords.A.y, '', { font: '16px Arial', color: '#fff' }).setOrigin(0.5);
    
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
      }});
    };

    const isAt = (p:{x:number;y:number}) => Math.abs(greenCircle.x - p.x) < 2 && Math.abs(greenCircle.y - p.y) < 2;

    arrows.left.on('pointerdown', () => {
      const atA = isAt((this.dataBag.nodeCoords || this.nodeCoords).A);
      if (atA) { this.incrementMatrixValue(0); moveTo('B'); }
    });
    arrows.top.on('pointerdown', () => {
      const atB = isAt((this.dataBag.nodeCoords || this.nodeCoords).B);
      if (atB) { this.incrementMatrixValue(1); moveTo('C'); }
    });
    arrows.right.on('pointerdown', () => {
      const atC = isAt((this.dataBag.nodeCoords || this.nodeCoords).C);
      if (atC) { this.incrementMatrixValue(2); moveTo('D'); }
    });
    arrows.bottom.on('pointerdown', () => {
      const atD = isAt((this.dataBag.nodeCoords || this.nodeCoords).D);
      if (atD) { this.incrementMatrixValue(4); moveTo('A'); }
    });
    arrows.center.on('pointerdown', () => {
      const atC = isAt((this.dataBag.nodeCoords || this.nodeCoords).C);
      if (atC) { this.incrementMatrixValue(3); moveTo('A'); }
    });
  }

  private createMatrixInput() {
    const x = 1150, y = 620, rows = 5, cols = 1, cellSize = 50, spacing = 10;
    const values: string[][] = Array.from({ length: rows }, () => Array(cols).fill('0'));
    const cells: any[][] = [];
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
        };
        const cell = { rect, text, row: r, col: c };
        rect.on('pointerdown', () => {
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

    // Top-right Info and Reset buttons
    const buttonStyle = { font: '22px Arial', color: '#fff', backgroundColor: '#333', padding: { left: 12, right: 12, top: 6, bottom: 6 }, align: 'center', fontStyle: 'bold' } as Phaser.Types.GameObjects.Text.TextStyle;
    const resetBtn = this.add.text(width - 20, 20, 'Reset', buttonStyle).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    const infoBtn = this.add.text(resetBtn.x - resetBtn.width - 12, 20, 'Info', buttonStyle).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    infoBtn.on('pointerdown', () => {
      this.infoOverlay?.destroy();
      const message = 'Click on the arrows to move the green circle and fill the matrix';
      this.infoOverlay = this.add.text(width - 20, 60, message, { font: '18px Arial', color: '#fff', backgroundColor: '#333', wordWrap: { width: 520 } }).setOrigin(1, 0);
      this.time.delayedCall(4000, () => { this.infoOverlay?.destroy(); this.infoOverlay = undefined; });
    });

    resetBtn.on('pointerdown', () => {
      this.resetGame();
    });

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
    const inc = Math.max(0, this.dataBag.hallwayCount || 0) || 1;
    input.setValue(row, 0, String(prev + inc));
  }

  private resetGame() {
    const currentState = this.stateManager.getCurrent() as any;
    if (currentState && typeof currentState.resetState === 'function') {
      currentState.resetState();
    } else {
      // Fallback: reset matrix values and position if state-specific reset not available
      const input = this.dataBag.matrixInput;
      if (input) {
        for (let r = 0; r < input.cells.length; r++) {
          for (let c = 0; c < input.cells[r].length; c++) {
            input.setValue(r, c, '0');
          }
        }
      }
      const coords = this.dataBag.nodeCoords || { A: { x: 240, y: 560 } as any };
      const start = (coords as any)['A'];
      if (this.dataBag.greenCircle && start) {
        this.dataBag.greenCircle.setPosition(start.x, start.y);
        this.dataBag.currentNode = 'A';
      }
      if (this.dataBag.greenCircleText && start) this.dataBag.greenCircleText.setPosition(start.x, start.y);
      // Re-render room dots if helper exists
      const sceneAny = this as any;
      if (sceneAny && typeof sceneAny['__layoutRoomDots'] === 'function') {
        ['A','B','C','D'].forEach((letter) => {
          const count = (this.dataBag.roomCounts as any)?.[letter] || 0;
          sceneAny['__layoutRoomDots'](letter, count);
        });
      }
    }

    // Reset timer
    this.startTime = this.time.now;
    this.timerText.setText('00:00');
  }

  private handleNextFromLevel1() {
    const input = this.dataBag.matrixInput;
    if (!input) return;
    const currentId = this.stateManager.getCurrentId() || 1;
    const isLevel1 = currentId === 1;
    const isLevel2 = currentId === 2;
    const target = isLevel1 ? [3, 3, 3, 0, 3] : isLevel2 ? [5, 5, 3, 2, 3] : null;
    const actual: number[] = [];
    for (let i = 0; i < 5; i++) {
      const raw = (input.getValue(i, 0) || '0').toString();
      const n = parseInt(raw.replace(/[^0-9\-]/g, '') || '0', 10) || 0;
      actual.push(n);
    }

    if (target) {
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

    // All match or free-play level (Level 3)
    if (isLevel1) {
      this.resetGame();
      this.stateManager.change(2);
    } else if (isLevel2) {
      this.resetGame();
      this.stateManager.change(3);
    } else {
      alert('Great job!');
    }
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
      const target = (this.dataBag.nodeCoords || this.nodeCoords)[path[i]];
      await new Promise<void>((resolve) => {
        this.tweens.add({
          targets: text ? [circle, text] : [circle],
          x: target.x,
          y: target.y,
          duration: 600,
          ease: 'Power2',
          onComplete: () => resolve()
        });
      });
    }
    this.isAnimating = false;
  }
}


