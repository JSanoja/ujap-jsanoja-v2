import * as THREE from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { TrackballControls } from "three/addons/controls/TrackballControls.js";
import GUI from "lil-gui";
import { Mesh } from "three";

import { ElementRef, Injectable, NgZone, OnDestroy } from "@angular/core";
import { timer } from "rxjs";

@Injectable({ providedIn: "root" })
export class EngineService implements OnDestroy {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public camera: THREE.PerspectiveCamera;
  public scene: THREE.Scene;
  public light: THREE.AmbientLight;
  public controls: TrackballControls;
  public timer: THREE.Timer;
  public grid: THREE.GridHelper;
  private next: boolean = false;
  public gui_options: any = {
    plcControlActive: true,
    showAxes: true,
    showAnnotations: true,
  };
  public movingParts: Array<string> = [
    "RotatingColumn",
    "LinkArm",
    "Arm",
    "Wrist",
    "EndEffector",
  ];
  public gui: GUI;
  public objLoadingComplete: boolean = false;
  public Roboter: any = {
    BaseFrame: {
      filename: "assets/models/robot/BaseFrame.obj",
      position: new THREE.Vector3(0.0, 0.0, 0.0),
      rotAxis: "z",
      material: new THREE.MeshPhongMaterial({
        color: 0x303030,
        flatShading: true,
      }),
      addAxis: false,
    },
    RotatingColumn: {
      filename: "assets/models/robot/RotatingColumn.obj",
      position: new THREE.Vector3(0.0, 0.0, -555.0),
      rotAxis: "z",
      material: new THREE.MeshPhongMaterial({
        color: 0xff5d00,
        flatShading: true,
      }),
      rotation: {
        setpoint: 0.0,
        feedback: 0.0,
        min: -170.0,
        max: 170.0,
        speed: 97.5,
      },
      addAxis: false,
    },
    Motor_RotatingColumn: {
      filename: "assets/models/robot/Motor_RotatingColumn.obj",
      position: new THREE.Vector3(0.0, 0.0, -555.0),
      rotAxis: "",
      material: new THREE.MeshPhongMaterial({
        color: 0x303030,
        flatShading: true,
      }),
      addAxis: false,
    },
    LinkArm: {
      filename: "assets/models/robot/LinkArm.obj",
      position: new THREE.Vector3(-500.0, 0.0, -1045.0),
      rotAxis: "y",
      material: new THREE.MeshPhongMaterial({
        color: 0xff5d00,
        flatShading: true,
      }),
      rotation: {
        setpoint: 0.0,
        feedback: 0.0,
        min: -40.0,
        max: 110.0,
        speed: 91.0,
      },
      addAxis: false,
    },
    Motor_LinkArm: {
      filename: "assets/models/robot/Motor_LinkArm.obj",
      position: new THREE.Vector3(0.0, 0.0, -755.0), // mounted at RotatingColumn
      rotAxis: "",
      material: new THREE.MeshPhongMaterial({
        color: 0x303030,
        flatShading: true,
      }),
      addAxis: false,
    },
    Arm: {
      filename: "assets/models/robot/Arm.obj",
      position: new THREE.Vector3(-500.0, 0.0, -2345.0),
      rotAxis: "y",
      material: new THREE.MeshPhongMaterial({
        color: 0xff5d00,
        flatShading: true,
      }),
      rotation: {
        setpoint: 0.0,
        feedback: 0.0,
        min: -90.0,
        max: 65.0,
        speed: 89.0,
      },
      addAxis: false,
    },
    Motor_Arm: {
      filename: "assets/models/robot/Motor_Arm.obj",
      position: new THREE.Vector3(-500.0, 0.0, -2345.0), // mounted at Arm
      rotAxis: "",
      material: new THREE.MeshPhongMaterial({
        color: 0x303030,
        flatShading: true,
      }),
      addAxis: false,
    },
    Wrist: {
      filename: "assets/models/robot/Wrist.obj",
      position: new THREE.Vector3(-1550.0, 0.0, -2345.0),
      rotAxis: "y",
      material: new THREE.MeshPhongMaterial({
        color: 0xff5d00,
        flatShading: true,
      }),
      rotation: {
        setpoint: 0.0,
        feedback: 0.0,
        min: -140.0,
        max: 100.0,
        speed: 90.0,
      },
      addAxis: false,
    },
    Motor_Wrist: {
      filename: "assets/models/robot/Motor_Wrist.obj",
      position: new THREE.Vector3(-1550.0, 0.0, -2345.0), // mounted at Wrist
      rotAxis: "",
      material: new THREE.MeshPhongMaterial({
        color: 0x303030,
        flatShading: true,
      }),
      addAxis: false,
    },
    EndEffector: {
      filename: "assets/models/robot/EndEffector.obj",
      position: new THREE.Vector3(-1850.0, 0.0, -2145.0),
      rotAxis: "z",
      material: new THREE.MeshPhongMaterial({
        color: 0x202020,
        flatShading: true,
      }),
      rotation: {
        setpoint: 0.0,
        feedback: 0.0,
        min: -175.0,
        max: 175.0,
        speed: 177.0,
      },
      addAxis: false,
    },
    Motor_EndEffector: {
      filename: "assets/models/robot/Motor_EndEffector.obj",
      position: new THREE.Vector3(-1550.0, 0.0, -2345.0),
      rotAxis: "",
      material: new THREE.MeshPhongMaterial({
        color: 0x303030,
        flatShading: true,
      }),
      addAxis: false,
    },
  };
  private manager: THREE.LoadingManager = new THREE.LoadingManager(() =>
    this.allLoadersDone()
  );
  private frameId: number = null;
  private loader: OBJLoader;

  private action: IMove[][] = [
    [
      {
        axi: this.movingParts[0],
        move: {
          speed: 30,
          point: -56,
        },
      },
      {
        axi: this.movingParts[1],
        move: {
          speed: 30,
          point: 50,
        },
      },
      {
        axi: this.movingParts[2],
        move: {
          speed: 30,
          point: -60,
        },
      },
      {
        axi: this.movingParts[3],
        move: {
          speed: 30,
          point: -9.2,
        },
      },
      {
        axi: this.movingParts[4],
        move: {
          speed: 30,
          point: 0,
        },
      },
    ],
    [
      {
        axi: this.movingParts[0],
        move: {
          speed: 60,
          point: 0,
        },
      },
      {
        axi: this.movingParts[1],
        move: {
          speed: 60,
          point: 0,
        },
      },
      {
        axi: this.movingParts[2],
        move: {
          speed: 60,
          point: 0,
        },
      },
      {
        axi: this.movingParts[3],
        move: {
          speed: 60,
          point: 0,
        },
      },
      {
        axi: this.movingParts[4],
        move: {
          speed: 60,
          point: 0,
        },
      },
    ],
    [
      {
        axi: this.movingParts[0],
        move: {
          speed: 60,
          point: 4,
        },
      },
      {
        axi: this.movingParts[1],
        move: {
          speed: 60,
          point: -21,
        },
      },
      {
        axi: this.movingParts[2],
        move: {
          speed: 60,
          point: -70,
        },
      },
      {
        axi: this.movingParts[3],
        move: {
          speed: 60,
          point: 100,
        },
      },
      {
        axi: this.movingParts[4],
        move: {
          speed: 60,
          point: 100,
        },
      },
    ],
    [
      {
        axi: this.movingParts[0],
        move: {
          speed: 30,
          point: -56,
        },
      },
      {
        axi: this.movingParts[1],
        move: {
          speed: 30,
          point: 50,
        },
      },
      {
        axi: this.movingParts[2],
        move: {
          speed: 30,
          point: -60,
        },
      },
      {
        axi: this.movingParts[3],
        move: {
          speed: 30,
          point: -9.2,
        },
      },
      {
        axi: this.movingParts[4],
        move: {
          speed: 30,
          point: 0,
        },
      },
    ],
    [
      {
        axi: this.movingParts[0],
        move: {
          speed: 60,
          point: 4,
        },
      },
      {
        axi: this.movingParts[1],
        move: {
          speed: 60,
          point: -21,
        },
      },
      {
        axi: this.movingParts[2],
        move: {
          speed: 60,
          point: -70,
        },
      },
      {
        axi: this.movingParts[3],
        move: {
          speed: 60,
          point: 100,
        },
      },
      {
        axi: this.movingParts[4],
        move: {
          speed: 60,
          point: 100,
        },
      },
    ],
    [
      {
        axi: this.movingParts[0],
        move: {
          speed: 60,
          point: 0,
        },
      },
      {
        axi: this.movingParts[1],
        move: {
          speed: 60,
          point: 0,
        },
      },
      {
        axi: this.movingParts[2],
        move: {
          speed: 60,
          point: 0,
        },
      },
      {
        axi: this.movingParts[3],
        move: {
          speed: 60,
          point: 0,
        },
      },
      {
        axi: this.movingParts[4],
        move: {
          speed: 60,
          point: 0,
        },
      },
    ],
  ];

  public constructor(private ngZone: NgZone) {}

  public ngOnDestroy(): void {
    if (this.frameId != null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;
    this.loader = new OBJLoader(this.manager);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true, // transparent background
      antialias: true, // smooth edges
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // three.js r152+: gestión de color sRGB (valor por defecto, explícito como referencia)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Stopwatch for time measurement (THREE.Clock está en desuso desde r179)
    this.timer = new THREE.Timer();

    // create the scene
    this.scene = new THREE.Scene();

    // three.js r155+: luces físicas. Las intensidades de r129 se multiplican por PI
    // y la PointLight usa decay = 0 (sin atenuación) para conservar el aspecto original.
    var ambientLight = new THREE.AmbientLight(0xcccccc, 0.4 * Math.PI);
    this.scene.add(ambientLight);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    this.camera.position.z = 800;
    this.camera.position.y = 400;

    var pointLight = new THREE.PointLight(0xffffff, 0.8 * Math.PI, 0, 0);
    this.camera.add(pointLight);
    this.scene.add(this.camera);

    // soft white light
    this.light = new THREE.AmbientLight(0x404040, Math.PI);
    this.light.position.z = 10;
    this.scene.add(this.light);

    this.grid = new THREE.GridHelper(1200, 60, 0xff4444, 0x404040);
    this.scene.add(this.grid);

    var scale = new THREE.Vector3(0.1, 0.1, 0.1);

    window.addEventListener("DOMContentLoaded", () => {
      this.render();
    });

    window.addEventListener("resize", (e) => {
      this.resize();
    });

    this.loadModel(this.Roboter["BaseFrame"], scale);
    this.loadModel(this.Roboter["RotatingColumn"], scale);
    this.loadModel(this.Roboter["Motor_RotatingColumn"], scale);
    this.loadModel(this.Roboter["LinkArm"], scale);
    this.loadModel(this.Roboter["Motor_LinkArm"], scale);
    this.loadModel(this.Roboter["Arm"], scale);
    this.loadModel(this.Roboter["Motor_Arm"], scale);
    this.loadModel(this.Roboter["Wrist"], scale);
    this.loadModel(this.Roboter["Motor_Wrist"], scale);
    this.loadModel(this.Roboter["EndEffector"], scale);
    this.loadModel(this.Roboter["Motor_EndEffector"], scale);

    this.gui = new GUI();
    this.movingParts.forEach((name) => {
      var box = this.gui.addFolder(name);
      box
        .add(
          this.Roboter[name].rotation,
          "setpoint",
          this.Roboter[name].rotation.min,
          this.Roboter[name].rotation.max,
          0.1
        )
        .name("Setpoint [\xB0]")
        .decimals(1)
        .listen();
      box
        .add(
          this.Roboter[name].rotation,
          "feedback",
          this.Roboter[name].rotation.min,
          this.Roboter[name].rotation.max,
          0.1
        )
        .name("Feedback [\xB0]")
        .decimals(1)
        .listen();
      box
        .add(this.Roboter[name].rotation, "speed", 1.0, 200.0, 0.1)
        .name("Speed [\xB0/s]")
        .decimals(1)
        .listen();
      box.open();
    });
    /* this.gui
      .add(this.gui_options, "plcControlActive")
      .name("PLC control")
      .listen(); */
    /* this.showAxesController = this.gui
      .add(this.gui_options, "showAxes")
      .name("Show axes")
      .onFinishChange((value) => {
        this.movingParts.forEach((name) => {
          // Better: check for prototype.constructor == AxesHelper
          this.Roboter[name].obj.children[1].visible = value;
        });
      }); */
    this.gui
      .add(this.gui_options, "showAnnotations")
      .name("Annotations")
      .listen();
    /* 
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.canvas.appendChild(this.renderer.domElement);
    */
    this.createControls();
  }

  createControls() {
    this.controls = new TrackballControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.rotateSpeed = 1.4;
    this.controls.zoomSpeed = 1.2;
    this.controls.panSpeed = 0.8;
    this.controls.noZoom = false;
    this.controls.noPan = false;
    this.controls.staticMoving = true;
    this.controls.dynamicDampingFactor = 0.3;
    //this.controls.keys = ["KeyA", "KeyS", "KeyD"];
    // this.controls.addEventListener("change", () => this.render());
  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      if (document.readyState !== "loading") {
        this.controls.update();
        this.render();
      } else {
        window.addEventListener("DOMContentLoaded", () => {
          this.controls.update();
          this.render();
        });
      }

      window.addEventListener("resize", () => {
        this.resize();
      });
    });
    /* requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.render(); */
    this.controls.update();
    this.render();
  }

  public render(): void {
    this.frameId = requestAnimationFrame(() => {
      this.render();
    });
    if (this.objLoadingComplete == true) {
      this.actionRobot();
      this.updateAnnotations();
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  actionRobot() {
    // console.log("action robot");
    var curRot = 0.0;
    var deltaDegrees = 0.5;
    var sp, fb, er, deltaRot, deltaRad;
    this.timer.update();
    var deltaTime = this.timer.getDelta();

    this.movingParts.forEach((name) => {
      // Speed setpoint is in deg/s
      deltaDegrees = this.Roboter[name].rotation.speed * deltaTime;
      deltaRad = THREE.MathUtils.degToRad(deltaDegrees);
      // Get the rotation of the rotating axis
      if (this.Roboter[name].rotAxis == "x") {
        curRot = this.Roboter[name].group.rotation.x;
      } else if (this.Roboter[name].rotAxis == "y") {
        curRot = this.Roboter[name].group.rotation.y;
      } else if (this.Roboter[name].rotAxis == "z") {
        curRot = this.Roboter[name].group.rotation.z;
      } else {
        curRot = 0.0;
      }
      // Limit the position setpoint to min/max values
      this.Roboter[name].rotation.setpoint = THREE.MathUtils.clamp(
        this.Roboter[name].rotation.setpoint,
        this.Roboter[name].rotation.min,
        this.Roboter[name].rotation.max
      );
      this.Roboter[name].rotation.feedback = THREE.MathUtils.radToDeg(curRot);
      sp = this.Roboter[name].rotation.setpoint;
      fb = this.Roboter[name].rotation.feedback;
      er = sp - fb;
      deltaRot = 0.0;

      if (er < 0.0) {
        deltaRot = -deltaDegrees;
        if (deltaRot < er) {
          deltaRot = er;
        }
      } else if (er > 0.0) {
        deltaRot = deltaDegrees;
        if (deltaRot > er) {
          deltaRot = er;
        }
      }
      deltaRad = THREE.MathUtils.degToRad(deltaRot);
      // Rotate the axis by the calculated values
      if (deltaRad != 0.0) {
        if (this.Roboter[name].rotAxis == "x") {
          this.Roboter[name].group.rotateX(deltaRad);
        } else if (this.Roboter[name].rotAxis == "y") {
          this.Roboter[name].group.rotateY(deltaRad);
        } else if (this.Roboter[name].rotAxis == "z") {
          this.Roboter[name].group.rotateZ(deltaRad);
        }
      }
    });
  }

  updateAnnotations() {
    // console.log("anotation");
    var annotation;
    var vector = new THREE.Vector3();
    this.movingParts.forEach((name) => {
      vector.setFromMatrixPosition(this.Roboter[name].obj.matrixWorld);
      vector.project(this.camera);
      vector.x = Math.round(
        (0.5 + vector.x / 2) * (window.innerWidth / window.devicePixelRatio)
      );
      vector.y = Math.round(
        (0.5 - vector.y / 2) * (window.innerHeight / window.devicePixelRatio)
      );

      annotation = document.querySelector("." + name);
      annotation.style.top = vector.y + "px";
      annotation.style.left = vector.x + "px";
      annotation.style.visibility = this.gui_options.showAnnotations
        ? "visible"
        : "hidden";

      document.getElementById(name).innerHTML =
        "<p>" + this.Roboter[name].rotation.feedback.toFixed(1) + "\xB0</p>";
    });
  }

  public resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.controls.handleResize();
  }

  allLoadersDone() {
    console.log("*** allLoadersDone ***");
    this.manager = new THREE.LoadingManager(this.allLoadersDone);
    // Add the robotarm elements to groups which are moved together
    var xyz = 1.0;
    var scale = new THREE.Vector3(xyz, xyz, xyz);
    var offset = new THREE.Vector3();

    this.Roboter["EndEffector"].group = new THREE.Group();
    this.Roboter["Wrist"].group = new THREE.Group();
    this.Roboter["Arm"].group = new THREE.Group();
    this.Roboter["LinkArm"].group = new THREE.Group();
    this.Roboter["RotatingColumn"].group = new THREE.Group();
    this.Roboter["BaseFrame"].group = new THREE.Group();

    // EndEffector
    this.Roboter["EndEffector"].group.add(this.Roboter["EndEffector"].obj);
    offset.copy(this.Roboter["Wrist"].position);
    this.fixGroupPivot(this.Roboter["EndEffector"], offset);

    // Wrist
    this.Roboter["Wrist"].group.add(this.Roboter["Wrist"].obj);
    this.Roboter["Wrist"].group.add(this.Roboter["Motor_EndEffector"].obj);
    this.Roboter["Wrist"].group.add(this.Roboter["Motor_Wrist"].obj);
    offset.copy(this.Roboter["Arm"].position);
    this.fixGroupPivot(this.Roboter["Wrist"], offset);
    this.Roboter["Wrist"].group.add(this.Roboter["EndEffector"].group);

    // Arm
    this.Roboter["Arm"].group.add(this.Roboter["Arm"].obj);
    this.Roboter["Arm"].group.add(this.Roboter["Motor_Arm"].obj);
    offset.copy(this.Roboter["LinkArm"].position);
    this.fixGroupPivot(this.Roboter["Arm"], offset);
    this.Roboter["Arm"].group.add(this.Roboter["Wrist"].group);

    // LinkArm
    this.Roboter["LinkArm"].group.add(this.Roboter["LinkArm"].obj);

    offset.copy(this.Roboter["RotatingColumn"].position);
    this.fixGroupPivot(this.Roboter["LinkArm"], offset);
    this.Roboter["LinkArm"].group.add(this.Roboter["Arm"].group);

    // RotatingColumn
    this.Roboter["RotatingColumn"].group.add(
      this.Roboter["RotatingColumn"].obj
    );
    this.Roboter["RotatingColumn"].group.add(
      this.Roboter["Motor_RotatingColumn"].obj
    );
    this.Roboter["RotatingColumn"].group.add(this.Roboter["Motor_LinkArm"].obj);
    this.fixGroupPivot(this.Roboter["RotatingColumn"], new THREE.Vector3());
    this.Roboter["RotatingColumn"].group.add(this.Roboter["LinkArm"].group);

    // BaseFrame
    this.Roboter["BaseFrame"].group.add(this.Roboter["BaseFrame"].obj);
    this.Roboter["BaseFrame"].group.add(this.Roboter["RotatingColumn"].group);

    // upright the whole robot
    this.Roboter["BaseFrame"].group.rotation.set(-Math.PI / 2, 0, 0);

    // Fix rotation from XYZ to YXZ
    // -> I have no idea why this is only neccessary on some groups and not all.
    //    Without this the groups rotate only from -Pi/2 to +Pi/2
    this.Roboter["LinkArm"].group.rotation.copy(
      new THREE.Euler(0, 0, 0, "YXZ")
    );
    this.Roboter["Arm"].group.rotation.copy(new THREE.Euler(0, 0, 0, "YXZ"));
    this.Roboter["Wrist"].group.rotation.copy(new THREE.Euler(0, 0, 0, "YXZ"));

    this.scene.add(this.Roboter["BaseFrame"].group);
    this.objLoadingComplete = true;
  }
  fixGroupPivot(robotPart: any, offset: THREE.Vector3) {
    var p = new THREE.Vector3();
    p.copy(robotPart.position);
    p.add(offset.negate());
    robotPart.group.position.copy(p);
  }
  loadModel(robotPart, scale) {
    this.loader.load(robotPart.filename, (obj) => {
      robotPart.obj = obj;
      robotPart.obj.traverse((child: Mesh) => {
        if (child.isMesh) {
          // Adjust the pivot point for rotation.
          // Moves the objects thus the pivot point is on the origin.
          console.log(
            "Mesh: " +
              child.name +
              " adjusting position: " +
              robotPart.position.toArray()
          );
          child.geometry.translate(
            robotPart.position.x,
            robotPart.position.y,
            robotPart.position.z
          );
          child.material = robotPart.material;
        }
      });

      // Move object back, take the scale factor into account
      robotPart.position.multiply(scale);
      robotPart.position.negate();
      robotPart.obj.scale.copy(scale);

      if (robotPart.addAxis == true) {
        // X-Axis = red
        // Y-Axis = green
        // Z-Axis = blue
        var robotAxis = new THREE.AxesHelper(1000);
        robotPart.obj.add(robotAxis);
      }
    });
  }
  resetView() {
    this.camera.position.set(0, 400, 800);
    this.camera.rotation.set(-0.46, 0, 0);
    this.controls.reset();
    this.controls.update();
  }
  resetRobot() {
    this.movingParts.forEach((name) => {
      this.Roboter[name].rotation.setpoint = 0;
    });
  }
  executeOne(axi: string, rc: IAction) {
    this.Roboter[axi].rotation.speed = rc.speed;
    this.Roboter[axi].rotation.setpoint = rc.point;
  }
  async executeAction(action = null) {
    action = this.action;
    async function asyncForEach(array, callback) {
      for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
      }
    }
    asyncForEach(action, async (count: IMove[]) => {
      count.forEach((move: IMove) => {
        this.executeOne(move.axi, move.move);
      });

      const t = await new Promise((resolve, reject) => {
        var a = setInterval(() => {
          if (
            this.Roboter[count[0].axi].rotation.feedback.toFixed(1) ==
              count[0].move.point &&
            this.Roboter[count[1].axi].rotation.feedback.toFixed(1) ==
              count[1].move.point &&
            this.Roboter[count[2].axi].rotation.feedback.toFixed(1) ==
              count[2].move.point &&
            this.Roboter[count[3].axi].rotation.feedback.toFixed(1) ==
              count[3].move.point &&
            this.Roboter[count[4].axi].rotation.feedback.toFixed(1) ==
              count[4].move.point
          ) {
            clearInterval(a);
            resolve("");
          }
        }, 500);
      });

      console.log(count);
    });
  }
}
export interface IAction {
  speed: number;
  point: number;
}
export interface IMove {
  axi: string;
  move: IAction;
}
