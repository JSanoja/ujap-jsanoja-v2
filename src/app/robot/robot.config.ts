/**
 * Configuración del brazo de 5 ejes: piezas (modelos OBJ) y ejes articulares.
 * Las posiciones están en las unidades del modelo (FreeCAD) antes de escalar.
 */

/** Ejes articulares, en orden A1–A5. */
export const AXIS_NAMES = ['RotatingColumn', 'LinkArm', 'Arm', 'Wrist', 'EndEffector'] as const;
export type AxisName = (typeof AXIS_NAMES)[number];

export type MotorName =
  'Motor_RotatingColumn' | 'Motor_LinkArm' | 'Motor_Arm' | 'Motor_Wrist' | 'Motor_EndEffector';
export type PartName = 'BaseFrame' | AxisName | MotorName;

export type RotationAxis = 'x' | 'y' | 'z';

export interface PartConfig {
  file: string;
  /** Punto de giro de la pieza en coordenadas del modelo. */
  position: readonly [number, number, number];
  color: number;
}

export interface AxisConfig {
  rotationAxis: RotationAxis;
  /** Límites en grados. */
  min: number;
  max: number;
  /** Velocidad por defecto en grados por segundo. */
  speed: number;
}

/** Factor de escala de los OBJ a la escena. */
export const MODEL_SCALE = 0.1;

const ORANGE = 0xff5d00;
const DARK_GREY = 0x303030;
const MODELS = 'assets/models/robot/';

export const PARTS: Readonly<Record<PartName, PartConfig>> = {
  BaseFrame: { file: `${MODELS}BaseFrame.obj`, position: [0, 0, 0], color: DARK_GREY },
  RotatingColumn: { file: `${MODELS}RotatingColumn.obj`, position: [0, 0, -555], color: ORANGE },
  Motor_RotatingColumn: {
    file: `${MODELS}Motor_RotatingColumn.obj`,
    position: [0, 0, -555],
    color: DARK_GREY,
  },
  LinkArm: { file: `${MODELS}LinkArm.obj`, position: [-500, 0, -1045], color: ORANGE },
  // Montado en RotatingColumn
  Motor_LinkArm: { file: `${MODELS}Motor_LinkArm.obj`, position: [0, 0, -755], color: DARK_GREY },
  Arm: { file: `${MODELS}Arm.obj`, position: [-500, 0, -2345], color: ORANGE },
  Motor_Arm: { file: `${MODELS}Motor_Arm.obj`, position: [-500, 0, -2345], color: DARK_GREY },
  Wrist: { file: `${MODELS}Wrist.obj`, position: [-1550, 0, -2345], color: ORANGE },
  Motor_Wrist: { file: `${MODELS}Motor_Wrist.obj`, position: [-1550, 0, -2345], color: DARK_GREY },
  EndEffector: { file: `${MODELS}EndEffector.obj`, position: [-1850, 0, -2145], color: 0x202020 },
  Motor_EndEffector: {
    file: `${MODELS}Motor_EndEffector.obj`,
    position: [-1550, 0, -2345],
    color: DARK_GREY,
  },
};

export const AXES: Readonly<Record<AxisName, AxisConfig>> = {
  RotatingColumn: { rotationAxis: 'z', min: -170, max: 170, speed: 97.5 },
  LinkArm: { rotationAxis: 'y', min: -40, max: 110, speed: 91 },
  Arm: { rotationAxis: 'y', min: -90, max: 65, speed: 89 },
  Wrist: { rotationAxis: 'y', min: -140, max: 100, speed: 90 },
  EndEffector: { rotationAxis: 'z', min: -175, max: 175, speed: 177 },
};
