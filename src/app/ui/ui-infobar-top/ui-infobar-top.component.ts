import { Component, inject } from '@angular/core';
import { SceneService } from '../../engine/scene.service';
import { DEMO_PROGRAM } from '../../robot/demo-program';
import { ProgramRunnerService } from '../../robot/program-runner.service';
import { RobotModelService } from '../../robot/robot-model.service';

@Component({
  selector: 'app-ui-infobar-top',
  templateUrl: './ui-infobar-top.component.html',
})
export class UiInfobarTopComponent {
  private readonly sceneService = inject(SceneService);
  private readonly robot = inject(RobotModelService);
  protected readonly runner = inject(ProgramRunnerService);

  resetView(): void {
    this.sceneService.resetView();
  }

  /** Cancela la secuencia en curso y lleva el robot a 0°. */
  resetRobot(): void {
    this.runner.stop();
    this.robot.resetTargets();
  }

  execute(): void {
    void this.runner.run(DEMO_PROGRAM);
  }
}
