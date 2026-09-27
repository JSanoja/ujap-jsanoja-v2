import { Component } from '@angular/core';
import { EngineComponent } from './engine/engine.component';
import { UiComponent } from './ui/ui.component';

@Component({
  selector: 'app-root',
  imports: [EngineComponent, UiComponent],
  templateUrl: './app.html',
})
export class App {}
