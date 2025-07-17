import * as Phaser from 'phaser';

export interface MatrixInputCell {
  rect: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  row: number;
  col: number;
}

export interface MatrixInput {
  cells: MatrixInputCell[][];
  values: string[][];
  setValue: (row: number, col: number, value: string) => void;
  getValue: (row: number, col: number) => string;
}

export function drawMatrixInput(
  scene: Phaser.Scene,
  x: number,
  y: number,
  rows: number,
  cols: number,
  cellSize = 50
): MatrixInput {
  const spacing = 10;
  const values: string[][] = Array.from({ length: rows }, () => Array(cols).fill(''));
  const cells: MatrixInputCell[][] = [];
  let focusedCell: MatrixInputCell | null = null;

  // Draw left bracket
  const g = scene.add.graphics();
  const extraHeight = 30;
  const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
  const bracketYOffset = -extraHeight / 2;
  const bracketWidth = 20;
  const overlap = 4;
  g.lineStyle(8, 0x000000);
  // Left bracket: vertical + top + bottom (with overlap)
  g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y + bracketYOffset, x - bracketWidth, y + bracketHeight + bracketYOffset));
  g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketYOffset, x, y + bracketYOffset));
  g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketHeight + bracketYOffset, x, y + bracketHeight + bracketYOffset));
  // Right bracket: vertical + top + bottom (with overlap)
  const rightX = x + cols * (cellSize + spacing) - spacing + bracketWidth;
  g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketYOffset, rightX, y + bracketHeight + bracketYOffset));
  g.strokeLineShape(new Phaser.Geom.Line(rightX - bracketWidth, y + bracketYOffset, rightX + overlap, y + bracketYOffset));
  g.strokeLineShape(new Phaser.Geom.Line(rightX - bracketWidth, y + bracketHeight + bracketYOffset, rightX + overlap, y + bracketHeight + bracketYOffset));

  // Draw cells
  for (let row = 0; row < rows; row++) {
    const rowCells: MatrixInputCell[] = [];
    for (let col = 0; col < cols; col++) {
      const cellX = x + col * (cellSize + spacing);
      const cellY = y + row * (cellSize + spacing);
      const rect = scene.add.rectangle(cellX + cellSize/2, cellY + cellSize/2, cellSize, cellSize, 0xffffff, 1)
        .setStrokeStyle(2, 0x000000)
        .setInteractive({ useHandCursor: true });
      const text = scene.add.text(cellX + cellSize/2, cellY + cellSize/2, '', {
        font: '20px Arial',
        color: '#000',
        align: 'center',
      }).setOrigin(0.5);
      const cell: MatrixInputCell = { rect, text, row, col };
      rowCells.push(cell);

      rect.on('pointerdown', () => {
        // Remove highlight from previous
        if (focusedCell) focusedCell.rect.setStrokeStyle(2, 0x000000);
        focusedCell = cell;
        rect.setStrokeStyle(4, 0x4287f5); // Highlight
        // Clear the value and text on click
        values[cell.row][cell.col] = '';
        cell.text.setText('');
        scene.input.keyboard?.off('keydown');
        scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
          if (!focusedCell) return;
          let val = values[focusedCell.row][focusedCell.col];
          if (event.key === 'Backspace') {
            val = val.slice(0, -1);
          } else if (event.key.length === 1 && /[0-9\-]/.test(event.key)) {
            if (val.length < 3) val += event.key;
          } else if (event.key === 'Enter') {
            // Move to next cell
            let nextCol = focusedCell.col + 1;
            let nextRow = focusedCell.row;
            if (nextCol >= cols) {
              nextCol = 0;
              nextRow++;
            }
            if (nextRow < rows) {
              const nextCell = cells[nextRow][nextCol];
              nextCell.rect.emit('pointerdown');
            }
            return;
          }
          values[focusedCell.row][focusedCell.col] = val;
          focusedCell.text.setText(val);
        });
      });
    }
    cells.push(rowCells);
  }

  // API to get/set values
  return {
    cells,
    values,
    setValue: (row, col, value) => {
      values[row][col] = value;
      cells[row][col].text.setText(value);
    },
    getValue: (row, col) => values[row][col],
  };
}

export function drawVectorDisplay(
  scene: Phaser.Scene,
  x: number,
  y: number,
  values: (string|number)[],
  cellSize = 50
) {
  const group = scene.add.group();
  const spacing = 10;
  const rows = values.length;
  const extraHeight = 30;
  const bracketHeight = rows * cellSize + (rows - 1) * spacing + extraHeight;
  const bracketYOffset = -extraHeight / 2;
  const bracketWidth = 20;
  const overlap = 4;
  const g = scene.add.graphics();
  g.lineStyle(8, 0x000000);
  // Left bracket
  g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth, y + bracketYOffset, x - bracketWidth, y + bracketHeight + bracketYOffset));
  g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketYOffset, x, y + bracketYOffset));
  g.strokeLineShape(new Phaser.Geom.Line(x - bracketWidth - overlap, y + bracketHeight + bracketYOffset, x, y + bracketHeight + bracketYOffset));
  // Right bracket
  const rightX = x + cellSize;
  g.strokeLineShape(new Phaser.Geom.Line(rightX + bracketWidth, y + bracketYOffset, rightX + bracketWidth, y + bracketHeight + bracketYOffset));
  g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketYOffset, rightX + bracketWidth + overlap, y + bracketYOffset));
  g.strokeLineShape(new Phaser.Geom.Line(rightX, y + bracketHeight + bracketYOffset, rightX + bracketWidth + overlap, y + bracketHeight + bracketYOffset));
  group.add(g);
  // Draw values as text
  for (let row = 0; row < rows; row++) {
    const cellY = y + row * (cellSize + spacing);
    const txt = scene.add.text(x + cellSize/2, cellY + cellSize/2, String(values[row]), {
      font: '24px Arial',
      color: '#000',
      align: 'center',
    }).setOrigin(0.5);
    group.add(txt);
  }
  return group;
}

export function drawDiagram(scene: Phaser.Scene) {
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
    { x: 600, y: 400, angle: 90, label: 'C3' },
    { x: 400, y: 400, angle: 180, label: 'C4' },
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