import { RobotModelService } from './robot-model.service';

describe('RobotModelService', () => {
  let robot: RobotModelService;

  beforeEach(() => {
    robot = new RobotModelService();
  });

  it('empieza con todos los ejes en 0° y los límites de la configuración', () => {
    expect(robot.isAtSetpoint()).toBe(true);
    expect(robot.axes.LinkArm).toMatchObject({
      setpoint: 0,
      feedback: 0,
      min: -40,
      max: 110,
      speed: 91,
    });
  });

  it('gira a la velocidad indicada', () => {
    robot.setTarget('RotatingColumn', -56, 30);
    robot.step(1);
    expect(robot.axes.RotatingColumn.feedback).toBeCloseTo(-30);
    expect(robot.isAtSetpoint()).toBe(false);
  });

  it('llega exactamente al setpoint sin pasarse', () => {
    robot.setTarget('Wrist', -9.2, 30);
    for (let i = 0; i < 100; i++) {
      robot.step(1 / 60);
    }
    expect(robot.axes.Wrist.feedback).toBe(-9.2);
    expect(robot.isAtSetpoint()).toBe(true);
  });

  it('limita el setpoint al rango del eje', () => {
    robot.setTarget('Arm', 500, 89);
    robot.step(10);
    expect(robot.axes.Arm.setpoint).toBe(65);
    expect(robot.axes.Arm.feedback).toBe(65);
    expect(robot.isAtSetpoint()).toBe(true);
  });

  it('whenAtSetpoint se resuelve al llegar', async () => {
    robot.setTarget('EndEffector', 10.25, 177);
    let reached = false;
    const promise = robot.whenAtSetpoint().then(() => (reached = true));
    robot.step(0.01);
    await Promise.resolve();
    expect(reached).toBe(false);
    robot.step(1);
    await promise;
    expect(reached).toBe(true);
  });

  it('whenAtSetpoint se resuelve de inmediato si ya está en el setpoint', async () => {
    await expect(robot.whenAtSetpoint()).resolves.toBeUndefined();
  });

  it('resetTargets lleva todos los setpoints a 0°', () => {
    robot.setTarget('LinkArm', 50, 30);
    robot.setTarget('Arm', -60, 30);
    robot.resetTargets();
    expect(Object.values(robot.axes).every((a) => a.setpoint === 0)).toBe(true);
  });
});
