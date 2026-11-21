import Phaser from 'phaser';

/** Written by the on-screen touch buttons (UIScene), read by Controls. */
export const touch = { left: false, right: false, jump: false, jet: false };

export interface ControlState {
  left: boolean;
  right: boolean;
  /** Jump button is held. */
  jump: boolean;
  /** Jump button went down this frame. */
  jumpPressed: boolean;
  /** Rocket backpack button (Shift or BATOH) is held. */
  jet: boolean;
}

type KeyName = 'left' | 'right' | 'up' | 'space' | 'a' | 'd' | 'w' | 'shift';

/** Merges keyboard (arrows, WASD, space, Shift) and touch buttons into one state per frame. */
export class Controls {
  private readonly keys: Record<KeyName, Phaser.Input.Keyboard.Key> | null;
  private prevJump = false;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    this.keys = kb
      ? (kb.addKeys({ left: 'LEFT', right: 'RIGHT', up: 'UP', space: 'SPACE', a: 'A', d: 'D', w: 'W', shift: 'SHIFT' }) as Record<KeyName, Phaser.Input.Keyboard.Key>)
      : null;
  }

  read(): ControlState {
    const k = this.keys;
    const left = touch.left || !!k && (k.left.isDown || k.a.isDown);
    const right = touch.right || !!k && (k.right.isDown || k.d.isDown);
    const jump = touch.jump || !!k && (k.up.isDown || k.space.isDown || k.w.isDown);
    const jet = touch.jet || !!k && k.shift.isDown;
    const jumpPressed = jump && !this.prevJump;
    this.prevJump = jump;
    return { left, right, jump, jumpPressed, jet };
  }

  reset(): void {
    touch.left = touch.right = touch.jump = touch.jet = false;
    this.prevJump = true; // a held jump key must be released before the next jump
  }
}
