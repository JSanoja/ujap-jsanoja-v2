import { Injectable } from '@angular/core';
import { AXES, AXIS_NAMES, AxisName } from './robot.config';

/** Estado de un eje. Ángulos en grados, velocidad en grados por segundo. */
export interface AxisState {
  setpoint: number;
  feedback: number;
  min: number;
  max: number;
  speed: number;
}

/**
 * Estado articular del robot y su movimiento. No depende de three.js:
 * la escena lee `feedback` de cada eje y lo aplica a los modelos.
 */
@Injectable({ providedIn: 'root' })
export class RobotModelService {
  readonly axes: Record<AxisName, AxisState> = createAxisStates();

  private waiters: (() => void)[] = [];

  /** Fija el destino y la velocidad de un eje. */
  setTarget(axis: AxisName, point: number, speed: number): void {
    this.axes[axis].speed = speed;
    this.axes[axis].setpoint = point;
  }

  /** Lleva todos los ejes a 0°. */
  resetTargets(): void {
    for (const axis of AXIS_NAMES) {
      this.axes[axis].setpoint = 0;
    }
  }

  /** `true` si todos los ejes están en su setpoint (limitado a su rango). */
  isAtSetpoint(): boolean {
    return AXIS_NAMES.every((axis) => {
      const a = this.axes[axis];
      return a.feedback === clamp(a.setpoint, a.min, a.max);
    });
  }

  /** Se resuelve cuando todos los ejes llegan a su setpoint. */
  whenAtSetpoint(): Promise<void> {
    if (this.isAtSetpoint()) {
      return Promise.resolve();
    }
    return new Promise((resolve) => this.waiters.push(resolve));
  }

  /**
   * Avanza el movimiento `dt` segundos: cada eje gira hacia su setpoint a su
   * velocidad, sin pasarse. Al llegar, `feedback` queda exactamente en el setpoint.
   */
  step(dt: number): void {
    for (const axis of AXIS_NAMES) {
      const a = this.axes[axis];
      a.setpoint = clamp(a.setpoint, a.min, a.max);
      const error = a.setpoint - a.feedback;
      const maxDelta = a.speed * dt;
      a.feedback =
        Math.abs(error) <= maxDelta ? a.setpoint : a.feedback + Math.sign(error) * maxDelta;
    }

    if (this.waiters.length > 0 && this.isAtSetpoint()) {
      const waiters = this.waiters;
      this.waiters = [];
      waiters.forEach((resolve) => resolve());
    }
  }
}

function createAxisStates(): Record<AxisName, AxisState> {
  const entries = AXIS_NAMES.map((axis) => {
    const { min, max, speed } = AXES[axis];
    return [axis, { setpoint: 0, feedback: 0, min, max, speed }] as const;
  });
  return Object.fromEntries(entries) as Record<AxisName, AxisState>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
