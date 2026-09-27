import { Injectable, inject, signal } from '@angular/core';
import { AxisName } from './robot.config';
import { RobotModelService } from './robot-model.service';

/** Movimiento de un eje dentro de una pose. */
export interface AxisMove {
  axis: AxisName;
  /** Destino en grados. */
  point: number;
  /** Velocidad en grados por segundo. */
  speed: number;
}

/** Una pose: movimientos que arrancan juntos; la siguiente espera a que terminen todos. */
export type Pose = readonly AxisMove[];

/** Ejecuta una secuencia de poses sobre el robot. */
@Injectable({ providedIn: 'root' })
export class ProgramRunnerService {
  private readonly robot = inject(RobotModelService);

  private readonly runningSignal = signal(false);
  readonly running = this.runningSignal.asReadonly();

  /** Identifica la ejecución en curso; `stop()` lo cambia para cancelarla. */
  private runId = 0;

  /**
   * Ejecuta el programa. Devuelve `true` si terminó y `false` si se canceló
   * o si ya había otro en ejecución.
   */
  async run(program: readonly Pose[]): Promise<boolean> {
    if (this.runningSignal()) {
      return false;
    }
    const id = ++this.runId;
    this.runningSignal.set(true);
    try {
      for (const pose of program) {
        for (const move of pose) {
          this.robot.setTarget(move.axis, move.point, move.speed);
        }
        await this.robot.whenAtSetpoint();
        if (id !== this.runId) {
          return false;
        }
      }
      return true;
    } finally {
      if (id === this.runId) {
        this.runningSignal.set(false);
      }
    }
  }

  /** Cancela el programa en curso; el robot termina el movimiento actual. */
  stop(): void {
    this.runId++;
    this.runningSignal.set(false);
  }
}
