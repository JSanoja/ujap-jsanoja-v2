import { Injectable, NgZone, inject } from '@angular/core';
import GUI from 'lil-gui';
import * as THREE from 'three';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RobotModelService } from '../robot/robot-model.service';
import { AXES, AXIS_NAMES, AxisName, MODEL_SCALE, PARTS, PartName } from '../robot/robot.config';

const CAMERA_START = new THREE.Vector3(0, 400, 800);

/** Escena three.js: carga los modelos, dibuja el robot y el panel de control. */
@Injectable({ providedIn: 'root' })
export class SceneService {
  private readonly ngZone = inject(NgZone);
  private readonly robot = inject(RobotModelService);

  readonly options = { showAnnotations: true };

  private renderer?: THREE.WebGLRenderer;
  private camera?: THREE.PerspectiveCamera;
  private scene?: THREE.Scene;
  private controls?: TrackballControls;
  private gui?: GUI;
  private timer?: THREE.Timer;
  private frameId?: number;
  private annotations?: Record<AxisName, HTMLElement>;

  /** Modelo OBJ cargado de cada pieza. */
  private readonly objects = new Map<PartName, THREE.Group>();
  /** Grupo que gira con cada eje. Solo existe cuando todos los modelos cargaron. */
  private readonly axisGroups = new Map<AxisName, THREE.Group>();

  private readonly onResize = (): void => this.resize();

  /** Crea la escena sobre `canvas` y arranca el bucle de render. */
  init(canvas: HTMLCanvasElement, annotations: Record<AxisName, HTMLElement>): void {
    this.annotations = annotations;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.timer = new THREE.Timer();
    this.timer.connect(document);

    this.scene = new THREE.Scene();

    // Luces físicas (three.js r155+): intensidades de r129 × PI y PointLight sin
    // atenuación (decay = 0) para conservar el aspecto original.
    this.scene.add(new THREE.AmbientLight(0xcccccc, 0.4 * Math.PI));
    this.scene.add(new THREE.AmbientLight(0x404040, Math.PI));

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    this.camera.position.copy(CAMERA_START);
    this.camera.add(new THREE.PointLight(0xffffff, 0.8 * Math.PI, 0, 0));
    this.scene.add(this.camera);

    this.scene.add(new THREE.GridHelper(1200, 60, 0xff4444, 0x404040));

    this.controls = new TrackballControls(this.camera, canvas);
    this.controls.rotateSpeed = 1.4;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;

    this.gui = this.createGui();
    this.loadModels();

    window.addEventListener('resize', this.onResize);
    // El bucle corre fuera de Angular para no disparar detección de cambios en cada cuadro.
    this.ngZone.runOutsideAngular(() => {
      this.frameId = requestAnimationFrame(this.render);
    });
  }

  /** Detiene el render y libera la escena, los listeners y el panel. */
  dispose(): void {
    if (this.frameId !== undefined) {
      cancelAnimationFrame(this.frameId);
      this.frameId = undefined;
    }
    window.removeEventListener('resize', this.onResize);
    this.controls?.dispose();
    this.gui?.destroy();
    this.timer?.dispose();
    this.scene?.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        node.geometry.dispose();
        (node.material as THREE.Material).dispose();
      }
    });
    this.renderer?.dispose();
    this.objects.clear();
    this.axisGroups.clear();
    this.renderer = this.camera = this.scene = this.controls = this.gui = this.timer = undefined;
    this.annotations = undefined;
  }

  /** Devuelve la cámara a la vista inicial. */
  resetView(): void {
    this.controls?.reset();
  }

  private readonly render = (): void => {
    this.frameId = requestAnimationFrame(this.render);
    if (!this.renderer || !this.scene || !this.camera || !this.controls || !this.timer) {
      return;
    }
    this.timer.update();
    if (this.axisGroups.size > 0) {
      this.robot.step(this.timer.getDelta());
      this.applyAxisRotations();
      this.updateAnnotations();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private createGui(): GUI {
    const gui = new GUI();
    for (const axis of AXIS_NAMES) {
      const state = this.robot.axes[axis];
      const folder = gui.addFolder(axis);
      folder
        .add(state, 'setpoint', state.min, state.max, 0.1)
        .name('Setpoint [°]')
        .decimals(1)
        .listen();
      // Solo lectura: lo calcula el modelo en cada cuadro.
      folder
        .add(state, 'feedback', state.min, state.max, 0.1)
        .name('Feedback [°]')
        .decimals(1)
        .listen()
        .disable();
      folder.add(state, 'speed', 1, 200, 0.1).name('Speed [°/s]').decimals(1).listen();
    }
    gui.add(this.options, 'showAnnotations').name('Annotations');
    return gui;
  }

  private loadModels(): void {
    const manager = new THREE.LoadingManager(() => this.assembleRobot());
    const loader = new OBJLoader(manager);
    for (const name of Object.keys(PARTS) as PartName[]) {
      const part = PARTS[name];
      const material = new THREE.MeshPhongMaterial({ color: part.color, flatShading: true });
      loader.load(
        part.file,
        (obj) => {
          // Mueve la geometría para que el punto de giro quede en el origen.
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.translate(...part.position);
              child.material = material;
            }
          });
          obj.scale.setScalar(MODEL_SCALE);
          this.objects.set(name, obj);
        },
        undefined,
        (error) => console.error(`No se pudo cargar ${part.file}`, error),
      );
    }
  }

  /** Arma la jerarquía base → columna → brazo de enlace → brazo → muñeca → efector. */
  private assembleRobot(): void {
    if (!this.scene || this.objects.size !== Object.keys(PARTS).length) {
      return;
    }
    const obj = (name: PartName): THREE.Group => this.objects.get(name)!;
    const axisGroup = (axis: AxisName, parts: PartName[], parent: PartName | null): THREE.Group => {
      const group = new THREE.Group();
      parts.forEach((name) => group.add(obj(name)));
      group.position.copy(pivot(axis)).sub(parent ? pivot(parent) : new THREE.Vector3());
      this.axisGroups.set(axis, group);
      return group;
    };

    const endEffector = axisGroup('EndEffector', ['EndEffector'], 'Wrist');
    const wrist = axisGroup('Wrist', ['Wrist', 'Motor_EndEffector', 'Motor_Wrist'], 'Arm');
    wrist.add(endEffector);
    const arm = axisGroup('Arm', ['Arm', 'Motor_Arm'], 'LinkArm');
    arm.add(wrist);
    const linkArm = axisGroup('LinkArm', ['LinkArm'], 'RotatingColumn');
    linkArm.add(arm);
    const column = axisGroup(
      'RotatingColumn',
      ['RotatingColumn', 'Motor_RotatingColumn', 'Motor_LinkArm'],
      null,
    );
    column.add(linkArm);

    const base = new THREE.Group();
    base.add(obj('BaseFrame'), column);
    // Endereza el robot (el modelo tiene Z hacia arriba).
    base.rotation.x = -Math.PI / 2;
    this.scene.add(base);

    // El primer delta mediría todo el tiempo de carga y el robot "saltaría".
    this.timer?.reset();
  }

  /** Aplica el `feedback` de cada eje a su grupo. Solo gira un eje por grupo. */
  private applyAxisRotations(): void {
    for (const axis of AXIS_NAMES) {
      const group = this.axisGroups.get(axis)!;
      group.rotation[AXES[axis].rotationAxis] = THREE.MathUtils.degToRad(
        this.robot.axes[axis].feedback,
      );
    }
  }

  private updateAnnotations(): void {
    if (!this.annotations || !this.camera || !this.renderer) {
      return;
    }
    const canvas = this.renderer.domElement;
    const v = new THREE.Vector3();
    for (const axis of AXIS_NAMES) {
      const el = this.annotations[axis];
      el.style.visibility = this.options.showAnnotations ? 'visible' : 'hidden';
      if (!this.options.showAnnotations) {
        continue;
      }
      v.setFromMatrixPosition(this.axisGroups.get(axis)!.matrixWorld).project(this.camera);
      el.style.left = `${Math.round((0.5 + v.x / 2) * canvas.clientWidth)}px`;
      el.style.top = `${Math.round((0.5 - v.y / 2) * canvas.clientHeight)}px`;
      (el.firstElementChild ?? el).textContent = `${this.robot.axes[axis].feedback.toFixed(1)}°`;
    }
  }

  private resize(): void {
    if (!this.camera || !this.renderer || !this.controls) {
      return;
    }
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.controls.handleResize();
  }
}

/** Punto de giro de la pieza en la escena (escalado y con signo invertido, como en 2021). */
function pivot(name: PartName): THREE.Vector3 {
  return new THREE.Vector3(...PARTS[name].position).multiplyScalar(-MODEL_SCALE);
}
