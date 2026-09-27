import { TestBed } from '@angular/core/testing';
import { DEMO_PROGRAM } from './demo-program';
import { Pose, ProgramRunnerService } from './program-runner.service';
import { RobotModelService } from './robot-model.service';

describe('ProgramRunnerService', () => {
  let robot: RobotModelService;
  let runner: ProgramRunnerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    robot = TestBed.inject(RobotModelService);
    runner = TestBed.inject(ProgramRunnerService);
  });

  /** Simula cuadros de `dt` segundos hasta que `promise` termine (máx. `maxSeconds`). */
  async function simulate<T>(promise: Promise<T>, dt = 1 / 60, maxSeconds = 120): Promise<T> {
    let done = false;
    void promise.then(() => (done = true));
    for (let t = 0; t < maxSeconds && !done; t += dt) {
      robot.step(dt);
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
      }
    }
    expect(done).toBe(true);
    return promise;
  }

  it('la secuencia de demostración termina y deja el robot en 0°', async () => {
    const finished = await simulate(runner.run(DEMO_PROGRAM));
    expect(finished).toBe(true);
    expect(runner.running()).toBe(false);
    expect(Object.values(robot.axes).every((a) => a.feedback === 0)).toBe(true);
  });

  it('termina aunque los cuadros sean irregulares', async () => {
    expect(await simulate(runner.run(DEMO_PROGRAM), 0.137)).toBe(true);
  });

  it('termina con destinos fuera de rango o con dos decimales (antes quedaba esperando)', async () => {
    const program: Pose[] = [
      [
        { axis: 'RotatingColumn', point: 500, speed: 97.5 },
        { axis: 'EndEffector', point: 10.25, speed: 177 },
      ],
    ];
    expect(await simulate(runner.run(program))).toBe(true);
    expect(robot.axes.RotatingColumn.feedback).toBe(170);
    expect(robot.axes.EndEffector.feedback).toBe(10.25);
  });

  it('no inicia una segunda ejecución mientras hay otra en curso', async () => {
    const first = runner.run(DEMO_PROGRAM);
    expect(runner.running()).toBe(true);
    expect(await runner.run(DEMO_PROGRAM)).toBe(false);
    await simulate(first);
  });

  it('stop() cancela la secuencia y permite ejecutar otra', async () => {
    const first = runner.run(DEMO_PROGRAM);
    robot.step(0.5);
    runner.stop();
    robot.resetTargets();
    expect(runner.running()).toBe(false);
    expect(await simulate(first)).toBe(false);
    expect(await simulate(runner.run(DEMO_PROGRAM))).toBe(true);
  });
});
