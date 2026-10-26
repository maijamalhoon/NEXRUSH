import type { InputFrame } from "../sim/types";

export type ControlKey = "steerLeft" | "steerRight" | "throttle" | "brake" | "handbrake" | "boost";

export interface KeyBindings {
  throttle: string[];
  brake: string[];
  steerLeft: string[];
  steerRight: string[];
  handbrake: string[];
  boost: string[];
  reset: string[];
  pause: string[];
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  throttle: ["KeyW", "ArrowUp"],
  brake: ["KeyS", "ArrowDown"],
  steerLeft: ["KeyA", "ArrowLeft"],
  steerRight: ["KeyD", "ArrowRight"],
  handbrake: ["Space"],
  boost: ["ShiftLeft", "ShiftRight", "KeyE"],
  reset: ["KeyR"],
  pause: ["Escape", "KeyP"],
};

export class InputManager {
  private activeKeys = new Set<string>();
  private bindings: KeyBindings = { ...DEFAULT_KEY_BINDINGS };

  // Virtual touch control states
  private touchThrottle = 0;
  private touchBrake = 0;
  private touchSteer = 0;
  private touchHandbrake = false;
  private touchBoost = false;

  // Steering sensitivity & assist
  public steeringSensitivity = 1.0;

  // Callback hooks
  public onResetRequest?: () => void;
  public onPauseRequest?: () => void;

  private onKeyDown = (e: KeyboardEvent) => {
    // Prevent default scrolling for game keys
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }

    if (this.bindings.reset.includes(e.code) && !e.repeat) {
      this.onResetRequest?.();
      return;
    }
    if (this.bindings.pause.includes(e.code) && !e.repeat) {
      this.onPauseRequest?.();
      return;
    }

    this.activeKeys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.activeKeys.delete(e.code);
  };

  private onWindowBlur = () => {
    this.activeKeys.clear();
    this.resetTouch();
  };

  public attach(target: Window = window): void {
    target.addEventListener("keydown", this.onKeyDown);
    target.addEventListener("keyup", this.onKeyUp);
    target.addEventListener("blur", this.onWindowBlur);
  }

  public detach(target: Window = window): void {
    target.removeEventListener("keydown", this.onKeyDown);
    target.removeEventListener("keyup", this.onKeyUp);
    target.removeEventListener("blur", this.onWindowBlur);
    this.activeKeys.clear();
  }

  public setTouchSteer(steer: number): void {
    this.touchSteer = Math.max(-1.0, Math.min(1.0, steer));
  }

  public setTouchThrottle(val: number): void {
    this.touchThrottle = Math.max(0.0, Math.min(1.0, val));
  }

  public setTouchBrake(val: number): void {
    this.touchBrake = Math.max(0.0, Math.min(1.0, val));
  }

  public setTouchHandbrake(active: boolean): void {
    this.touchHandbrake = active;
  }

  public setTouchBoost(active: boolean): void {
    this.touchBoost = active;
  }

  public resetTouch(): void {
    this.touchThrottle = 0;
    this.touchBrake = 0;
    this.touchSteer = 0;
    this.touchHandbrake = false;
    this.touchBoost = false;
  }

  private isActionPressed(actionKeys: string[]): boolean {
    for (const key of actionKeys) {
      if (this.activeKeys.has(key)) return true;
    }
    return false;
  }

  /**
   * Reads Gamepad API if available.
   */
  private readGamepad(): { steer: number; throttle: number; brake: number; handbrake: boolean; boost: boolean } {
    if (typeof navigator === "undefined" || !navigator.getGamepads) {
      return { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false };
    }

    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        // Left stick X: gp.axes[0]
        let steer = gp.axes[0] || 0;
        if (Math.abs(steer) < 0.12) steer = 0; // deadzone

        // Right trigger (RT): gp.buttons[7] or axis
        const throttleBtn = gp.buttons[7]?.value || 0;
        // Left trigger (LT): gp.buttons[6]
        const brakeBtn = gp.buttons[6]?.value || 0;

        // Button A / Cross: gp.buttons[0] (Boost)
        const boost = gp.buttons[0]?.pressed || false;
        // Button B / Circle or X: gp.buttons[1] or gp.buttons[2] (Handbrake)
        const handbrake = (gp.buttons[1]?.pressed || gp.buttons[2]?.pressed) || false;

        return { steer, throttle: throttleBtn, brake: brakeBtn, handbrake, boost };
      }
    }

    return { steer: 0, throttle: 0, brake: 0, handbrake: false, boost: false };
  }

  /**
   * Produces a unified InputFrame by combining Keyboard, Touch, and Gamepad.
   */
  public getInputFrame(tick: number): InputFrame {
    // 1. Keyboard
    let kbSteer = 0;
    if (this.isActionPressed(this.bindings.steerLeft)) kbSteer -= 1;
    if (this.isActionPressed(this.bindings.steerRight)) kbSteer += 1;

    const kbThrottle = this.isActionPressed(this.bindings.throttle) ? 1.0 : 0.0;
    const kbBrake = this.isActionPressed(this.bindings.brake) ? 1.0 : 0.0;
    const kbHandbrake = this.isActionPressed(this.bindings.handbrake);
    const kbBoost = this.isActionPressed(this.bindings.boost);

    // 2. Gamepad
    const gp = this.readGamepad();

    // 3. Merge inputs with priority / max
    const steer = Math.max(
      -1.0,
      Math.min(1.0, (kbSteer || gp.steer || this.touchSteer) * this.steeringSensitivity)
    );
    const throttle = Math.max(kbThrottle, gp.throttle, this.touchThrottle);
    const brake = Math.max(kbBrake, gp.brake, this.touchBrake);
    const handbrake = kbHandbrake || gp.handbrake || this.touchHandbrake;
    const boost = kbBoost || gp.boost || this.touchBoost;

    return {
      steer,
      throttle,
      brake,
      handbrake,
      boost,
      tick,
    };
  }
}
