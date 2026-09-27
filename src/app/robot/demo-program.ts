import { AXIS_NAMES } from './robot.config';
import { Pose } from './program-runner.service';

/** Pose con la misma velocidad para los 5 ejes; `points` en orden A1–A5. */
function pose(speed: number, points: readonly [number, number, number, number, number]): Pose {
  return AXIS_NAMES.map((axis, i) => ({ axis, point: points[i], speed }));
}

/** Secuencia de prueba de 6 poses (botón "Execute"), la misma de la versión 2021. */
export const DEMO_PROGRAM: readonly Pose[] = [
  pose(30, [-56, 50, -60, -9.2, 0]),
  pose(60, [0, 0, 0, 0, 0]),
  pose(60, [4, -21, -70, 100, 100]),
  pose(30, [-56, 50, -60, -9.2, 0]),
  pose(60, [4, -21, -70, 100, 100]),
  pose(60, [0, 0, 0, 0, 0]),
];
