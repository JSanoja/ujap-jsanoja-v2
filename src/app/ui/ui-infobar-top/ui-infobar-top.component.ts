import { Component, OnInit } from "@angular/core";
import { match } from "assert";
import { EngineService } from "src/app/engine/engine.service";

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
