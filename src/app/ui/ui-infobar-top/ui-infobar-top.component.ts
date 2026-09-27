import { Component, OnInit } from "@angular/core";
import { EngineService } from "../../engine/engine.service";

@Component({
  selector: "app-ui-infobar-top",
  templateUrl: "./ui-infobar-top.component.html",
})
export class UiInfobarTopComponent implements OnInit {
  public constructor(private engineService: EngineService) {}

  public ngOnInit(): void {}
  resetView() {
    this.engineService.resetView();
  }
  resetRobot() {
    this.engineService.resetRobot();
  }
  execute() {
    this.engineService.executeAction();
  }
}
