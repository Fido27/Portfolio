import * as Phaser from 'phaser';
import {
  IBoardManager,
  NodeKey,
  ArrowKey,
  RoomCounts,
  NodeCoords,
  Position,
} from '../types';
import {
  GAME_HEIGHT,
  ROOM_COLORS,
  ROOM_NAMES,
  getNodeCoords,
  getRoomCenters,
  getArrowPositions,
  getCameraConfigs,
  HALLWAY_TRANSITIONS,
  ANIMATION,
  ROOM_DOTS,
} from '../config/constants';

export class BoardManager implements IBoardManager {
  private scene: Phaser.Scene;
  private dy: number; // Vertical offset for centering

  // Game objects
  private arrows: Map<ArrowKey, Phaser.GameObjects.Image> = new Map();
  private playerCircle!: Phaser.GameObjects.Arc;
  private playerBadge!: Phaser.GameObjects.Text;
  private roomDotGroups: Map<NodeKey, Phaser.GameObjects.Group> = new Map();

  // Cached positions
  private nodeCoords!: NodeCoords;
  private roomCenters!: Record<NodeKey, Position>;

  // Callbacks
  private onArrowClick?: (arrowKey: ArrowKey, from: NodeKey, to: NodeKey) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.dy = GAME_HEIGHT / 2 - 400;
    
    // Initialize positions
    this.nodeCoords = getNodeCoords(this.dy) as NodeCoords;
    this.roomCenters = getRoomCenters(this.dy);
    
    // Initialize room dot groups
    const nodes: NodeKey[] = ['A', 'B', 'C', 'D'];
    nodes.forEach(node => {
      this.roomDotGroups.set(node, this.scene.add.group());
    });
  }

  // ============ Initialization ============

  create(onArrowClick: (arrowKey: ArrowKey, from: NodeKey, to: NodeKey) => void): void {
    this.onArrowClick = onArrowClick;
    
    this.drawDiagram();
    this.createCameras();
    this.createArrows();
    this.createPlayer();
  }

  // ============ Public Interface ============

  getNodeCoords(): NodeCoords {
    return this.nodeCoords;
  }

  async movePlayerTo(node: NodeKey, animate: boolean = true): Promise<void> {
    const target = this.nodeCoords[node];
    
    if (!animate) {
      this.playerCircle.setPosition(target.x, target.y);
      this.playerBadge.setPosition(target.x, target.y);
      return Promise.resolve();
    }

    return new Promise(resolve => {
      this.scene.tweens.add({
        targets: [this.playerCircle, this.playerBadge],
        x: target.x,
        y: target.y,
        duration: ANIMATION.playerMoveDuration,
        ease: 'Power2',
        onComplete: () => resolve(),
      });
    });
  }

  setArrowsEnabled(enabled: boolean): void {
    this.arrows.forEach(arrow => {
      if (enabled) {
        arrow.setInteractive({ useHandCursor: true });
        arrow.setAlpha(1);
      } else {
        arrow.disableInteractive();
        arrow.setAlpha(0.5);
      }
    });
  }

  setArrowEnabled(arrowKey: ArrowKey, enabled: boolean): void {
    const arrow = this.arrows.get(arrowKey);
    if (!arrow) return;

    if (enabled) {
      arrow.setInteractive({ useHandCursor: true });
      arrow.setAlpha(1);
    } else {
      arrow.disableInteractive();
      arrow.setAlpha(0.5);
    }
  }

  getArrowsForNode(node: NodeKey): ArrowKey[] {
    return HALLWAY_TRANSITIONS
      .filter(t => t.from === node)
      .map(t => t.arrowKey);
  }

  pulseArrow(arrowKey: ArrowKey): void {
    const arrow = this.arrows.get(arrowKey);
    if (!arrow) return;

    const baseScaleX = arrow.getData('baseScaleX') ?? arrow.scaleX;
    const baseScaleY = arrow.getData('baseScaleY') ?? arrow.scaleY;

    // Stop any existing pulse
    const previousTween = arrow.getData('pulseTween') as Phaser.Tweens.Tween | undefined;
    previousTween?.stop();
    arrow.setScale(baseScaleX, baseScaleY);

    // Start new pulse
    const tween = this.scene.tweens.add({
      targets: arrow,
      scaleX: baseScaleX * 1.12,
      scaleY: baseScaleY * 1.12,
      duration: ANIMATION.arrowPulseDuration,
      yoyo: true,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        arrow.setScale(baseScaleX, baseScaleY);
        arrow.setData('pulseTween', undefined);
      },
    });

    arrow.setData('pulseTween', tween);
  }

  updateRoomDots(counts: RoomCounts): void {
    const nodes: NodeKey[] = ['A', 'B', 'C', 'D'];
    nodes.forEach(node => {
      this.layoutDotsForRoom(node, counts[node]);
    });
  }

  setPlayerBadgeText(text: string): void {
    this.playerBadge.setText(text);
    this.playerBadge.setVisible(text.length > 0);
  }

  // ============ Private Drawing Methods ============

  private drawDiagram(): void {
    const g = this.scene.add.graphics();

    // Draw rooms (rotated squares)
    this.drawRoom('A');
    this.drawRoom('B');
    this.drawRoom('C');
    this.drawRoom('D');

    // Draw outer border
    g.lineStyle(4, 0x000000);
    g.strokeRect(200, 200 + this.dy, 400, 400);

    // Draw inner walls (triangles)
    g.lineStyle(4, 0x000000);
    const wall1 = new Phaser.Geom.Triangle(
      275, 275 + this.dy,
      475, 275 + this.dy,
      275, 475 + this.dy
    );
    const wall2 = new Phaser.Geom.Triangle(
      325, 525 + this.dy,
      525, 325 + this.dy,
      525, 525 + this.dy
    );
    g.strokeTriangleShape(wall1);
    g.strokeTriangleShape(wall2);
  }

  private drawRoom(node: NodeKey): void {
    const g = this.scene.add.graphics();
    const color = ROOM_COLORS[node];
    const name = ROOM_NAMES[node];
    const center = this.roomCenters[node];

    // Draw colored square (rotated 45 degrees)
    g.fillStyle(color, 1);
    g.fillRect(0, 0, 120, 120);
    
    const texKey = `room-${node}`;
    g.generateTexture(texKey, 120, 120);
    g.clear();

    this.scene.add.image(center.x, center.y, texKey).setAngle(45);

    // Add room label
    this.scene.add
      .text(center.x, center.y - 24, `${node}\n${name}`, {
        font: '20px Arial',
        color: '#000',
      })
      .setOrigin(0.5)
      .setAlign('center');
  }

  private createCameras(): void {
    const configs = getCameraConfigs(this.dy);

    configs.forEach(({ x, y, angle, label, offsetX, offsetY, scale }) => {
      this.scene.add
        .image(x + offsetX, y + offsetY, 'security_cam')
        .setAngle(angle)
        .setScale(scale);

      this.scene.add.text(x + 15, y - 15, label, {
        font: '18px Arial',
        color: '#000',
      });
    });
  }

  private createArrows(): void {
    const positions = getArrowPositions(this.dy);

    const arrowKeys: ArrowKey[] = ['left', 'top', 'right', 'center', 'bottom'];

    arrowKeys.forEach(key => {
      const pos = positions[key];
      const arrow = this.scene.add
        .image(pos.x, pos.y, 'red_arrow')
        .setScale(0.3)
        .setAngle(pos.angle)
        .setInteractive({ useHandCursor: true });

      // Store base scale for pulse animation
      arrow.setData('baseScaleX', arrow.scaleX);
      arrow.setData('baseScaleY', arrow.scaleY);

      // Set up click handler
      arrow.on('pointerdown', () => this.handleArrowClick(key));

      this.arrows.set(key, arrow);
    });
  }

  private createPlayer(): void {
    const startPos = this.nodeCoords['A'];

    // Green circle (player)
    this.playerCircle = this.scene.add.circle(
      startPos.x,
      startPos.y,
      14,
      0x2ecc40
    );

    // Badge text (for multiplier display)
    this.playerBadge = this.scene.add
      .text(startPos.x, startPos.y, '', {
        font: '16px Arial',
        color: '#fff',
      })
      .setOrigin(0.5)
      .setVisible(false);
  }

  private handleArrowClick(arrowKey: ArrowKey): void {
    // Find the transition for this arrow
    const transition = HALLWAY_TRANSITIONS.find(t => t.arrowKey === arrowKey);
    if (!transition || !this.onArrowClick) return;

    this.onArrowClick(arrowKey, transition.from, transition.to);
  }

  private layoutDotsForRoom(node: NodeKey, count: number): void {
    const group = this.roomDotGroups.get(node);
    if (!group) return;

    // Clear existing dots
    group.clear(true, true);

    const center = this.roomCenters[node];
    const { perRow, spacing, radius, color, yOffset } = ROOM_DOTS;

    for (let i = 0; i < Math.max(0, count); i++) {
      const row = Math.floor(i / perRow);
      const col = i % perRow;
      const dx = (col - (perRow - 1) / 2) * spacing;
      const dy = (row - 1) * spacing + yOffset;

      const dot = this.scene.add.circle(
        center.x + dx,
        center.y + dy,
        radius,
        color
      );
      group.add(dot);
    }
  }
}
