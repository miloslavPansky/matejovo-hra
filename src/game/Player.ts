import Phaser from 'phaser';
import { PLAYER } from '../config';
import type { ControlState } from './Controls';

/** Matěj: run with acceleration, variable-height jump, coyote time and jump buffering. */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private coyote = 0;
  private jumpBuffer = 0;
  private rising = false;
  private invulnUntil = 0;
  private stunUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero-a');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);
    this.arcadeBody.setSize(12, 30).setOffset(5, 4);
    this.arcadeBody.setMaxVelocity(PLAYER.runSpeed, PLAYER.maxFall);
  }

  get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  /** Advances the player one frame. Returns true when a jump started this frame. */
  step(c: ControlState, now: number, delta: number): boolean {
    const b = this.arcadeBody;
    // Only real terrain counts as ground. Arcade overlaps (coins, enemies) also set
    // body.touching.down, which used to let Matěj jump again off a coin in mid-air.
    const onGround = b.blocked.down;
    let jumped = false;
    this.coyote = onGround ? PLAYER.coyoteMs : this.coyote - delta;
    this.jumpBuffer = c.jumpPressed ? PLAYER.jumpBufferMs : this.jumpBuffer - delta;

    const stunned = now < this.stunUntil;
    const dir = stunned ? 0 : (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (dir !== 0) {
      const turning = dir * b.velocity.x < 0;
      b.setAccelerationX(dir * PLAYER.accel * (turning ? 2 : 1));
      b.setDragX(0);
      this.setFlipX(dir < 0);
    } else {
      b.setAccelerationX(0);
      b.setDragX(stunned ? 200 : PLAYER.drag);
    }

    if (!stunned && this.jumpBuffer > 0 && this.coyote > 0) {
      b.setVelocityY(-PLAYER.jumpVelocity);
      this.jumpBuffer = 0;
      this.coyote = 0;
      this.rising = true;
      jumped = true;
    }
    if (this.rising && !c.jump && b.velocity.y < 0) {
      b.setVelocityY(b.velocity.y * PLAYER.jumpCut);
      this.rising = false;
    }
    if (b.velocity.y >= 0) this.rising = false;

    if (!onGround) {
      this.anims.stop();
      this.setTexture('hero-jump');
    } else if (Math.abs(b.velocity.x) > 12) {
      this.anims.play('hero-walk', true);
    } else {
      this.anims.stop();
      this.setTexture('hero-a');
    }

    this.setAlpha(now < this.invulnUntil ? (Math.floor(now / 80) % 2 ? 0.35 : 1) : 1);
    return jumped;
  }

  bounce(): void {
    this.arcadeBody.setVelocityY(-PLAYER.stompBounce);
    this.rising = false;
  }

  isInvulnerable(now: number): boolean {
    return now < this.invulnUntil;
  }

  hit(fromX: number, now: number): void {
    this.invulnUntil = now + PLAYER.invulnMs;
    this.stunUntil = now + PLAYER.stunMs;
    this.arcadeBody.setVelocity(fromX < this.x ? 140 : -140, -200);
  }

  respawnAt(x: number, y: number, now: number): void {
    this.arcadeBody.reset(x, y);
    this.arcadeBody.setAcceleration(0, 0);
    this.invulnUntil = now + PLAYER.invulnMs;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.rising = false;
  }
}
