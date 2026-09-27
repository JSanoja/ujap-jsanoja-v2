import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';
import { ProgramRunnerService } from '../robot/program-runner.service';
import { AXIS_NAMES, AxisName } from '../robot/robot.config';
import { SceneService } from './scene.service';

@Component({
  selector: 'app-engine',
  templateUrl: './engine.component.html',
})
export class EngineComponent implements AfterViewInit, OnDestroy {
  private readonly sceneService = inject(SceneService);
  private readonly runner = inject(ProgramRunnerService);

  protected readonly axes = AXIS_NAMES;
  private readonly rendererCanvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>('rendererCanvas');
  private readonly annotations = viewChildren<ElementRef<HTMLElement>>('annotation');

  ngAfterViewInit(): void {
    const elements = this.annotations().map((ref) => ref.nativeElement);
    const byAxis = Object.fromEntries(AXIS_NAMES.map((axis, i) => [axis, elements[i]]));
    this.sceneService.init(
      this.rendererCanvas().nativeElement,
      byAxis as Record<AxisName, HTMLElement>,
    );
  }

  ngOnDestroy(): void {
    this.runner.stop();
    this.sceneService.dispose();
  }
}
