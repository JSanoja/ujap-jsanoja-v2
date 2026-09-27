# CLAUDE.md — Emulador de brazo robótico (App 1, código 2021)

Tesis de postgrado de Juan Sanoja (UJAP, Especialización en Automatización Industrial). Este repositorio es la **App 1**: emulador 3D de un brazo de 5 ejes inspirado en el LabVolt 5250, hecho en 2021 con Angular 12 + three.js r129 a partir de la plantilla MIT `ng-three-template`.

Contexto completo del proyecto en `..\docs\` (leer al empezar):
- `00-CONTEXTO-GENERAL.md` — historia, estado técnico, ejes.
- `01-WORKUNITS.md` — tablero de tareas; **actualizar estado y registro de decisiones al terminar cada workunit**.
- `03-ESPEC-FORMATO-TXT.md` — formato TXT (no aplica a la App 1).

## ✅ App 1 cerrada (2026-09-27)

Versión final `v3-limpieza`. No se le agregan funciones; el trabajo sigue en la App 2 (repo nuevo). Traspaso y lecciones en `..\docs\05-CIERRE-APP1-TRASPASO-APP2.md`. Solo se tocaría este repo para corregir un fallo del despliegue o de las dependencias.

## Alcance de la App 1 (decidido)

La App 1 se **actualiza y queda funcionando como referencia**. No se le agregan TXT, pinza ni editor (eso va en la App 2). Workunits: A1 → A2 → A3 → A4.

## Reglas

- Idioma: español para comentarios, commits y mensajes al usuario.
- No modificar código sin rama propia y commit previo. Una rama por workunit (`a2-angular`, `a3-three`, `a4-limpieza`).
- Commits pequeños y descriptivos. Etiquetar hitos (`v0-legacy`, `v1-angular-XX`, …).
- Antes de cada cambio grande, tomar capturas del estado actual (sirven para el Cap. IV de la tesis) en `..\docs\capturas\`.
- Windows: usar PowerShell. Finales de línea controlados por `.gitattributes`.

## Estado tras A4 (2026-09-27) — App 1 terminada

- `master` = Angular 22.2 (standalone, zoneless, builder `application`, Vitest, angular-eslint), TypeScript 6.0, Node 24; three **0.186.1**, @types/three 0.186.0 y lil-gui 0.21 (desde A3).
- Remotos: `upstream` = plantilla original; `origin` = `git@github.com:JSanoja/ujap-jsanoja-v2.git` (público; `gh` autenticado en WSL). Demo: https://jsanoja.github.io/ujap-jsanoja-v2/ (se despliega en cada push a `master`).
- Etiquetas: `v0-legacy` (Angular 12, requiere Node 14 + `npm install --legacy-peer-deps` con npm 8), `v1-angular-22`, `v2-three-186`, `v3-limpieza`.
- Código: `robot/` (config, `RobotModelService`, `ProgramRunnerService`, programa demo) y `engine/scene.service.ts`. TypeScript estricto; `ng lint` y `ng test` (12 pruebas) en verde; el workflow de Pages los ejecuta antes de publicar.
- Luces: intensidades de r129 × PI y `PointLight` con `decay = 0` para conservar el aspecto original (ver comentario en `engine.service.ts`).

## Estado conocido antes de A2 (2026-09-27, histórico)

- Dependencias: Angular 12.0.x, three 0.129, @types/three 0.128, TypeScript 4.2, Bootstrap 4.6, RxJS 6.6, TSLint, Protractor, Karma, `postinstall: ngcc`.
- Angular 12 requiere **Node 12.14+ o 14.15+**; con Node ≥ 18 probablemente falle (`ngcc`, OpenSSL de webpack 4/5 → `ERR_OSSL_EVP_UNSUPPORTED`).
- Git: `origin` apunta a `github.com/JohnnyDevNull/ng-three-template`. Los cambios propios **no están confirmados**. De 43 archivos marcados como modificados, solo 9 tienen cambios reales; el resto es CRLF/permisos. Ya existe `.gitattributes` (sin commit).
- Modelos OBJ en `src/assets/models/robot/` (≈11 MB, sin seguimiento en Git).
- Código propio casi todo en `src/app/engine/engine.service.ts`.

### Ejes

| Eje | Pieza | Giro | Mín (°) | Máx (°) | Vel. (°/s) |
|---|---|---|---|---|---|
| A1 | RotatingColumn (base) | z | −170 | 170 | 97,5 |
| A2 | LinkArm (hombro) | y | −40 | 110 | 91 |
| A3 | Arm (codo) | y | −90 | 65 | 89 |
| A4 | Wrist (muñeca) | y | −140 | 100 | 90 |
| A5 | EndEffector (giro herramienta) | z | −175 | 175 | 177 |

### Bugs conocidos en 2021 (✅ corregidos en A4)

- Espera de fin de movimiento: `setInterval` + `toFixed(1) == point` compara texto con número; puede no terminar nunca.
- Imports sin uso (`assert`, `timer`); `resize` registrado dos veces; `ngOnDestroy` no quita listeners; `Roboter: any`.

## Plan para "hacer funcionar la app vieja"

1. **A1 — línea base**
   - `git remote rename origin upstream`; `git add --renormalize .`; `git add -A`; commit "Estado 2021 del emulador (Angular 12 + three.js r129)"; tag `v0-legacy`.
   - Crear repo privado en GitHub (`gh repo create ujap-emulador-brazo --private --source . --remote origin --push`) y `git push origin --tags`.
   - Intentar correrla **tal cual**: instalar Node 14 LTS en paralelo (nvm-windows o Volta), `npm ci`, `npm start`. Si arranca, tomar capturas. Si no, anotar el error exacto.
2. **A2 — Angular actual**
   - Estrategia: `ng new` con la versión estable actual de Angular (standalone, builder `application`, SCSS, sin SSR) en una rama, y **portar** los archivos propios (engine, ui, estilos, assets). No encadenar `ng update` 12→13→…
   - Quitar `ngcc`, TSLint (→ angular-eslint), Protractor (eliminar e2e), Bootstrap 4 (→ 5 o quitar si no se usa), Sass `@import` → `@use`.
   - Mantener three en 0.129 durante A2 (se actualiza en A3) salvo que no compile; en ese caso documentarlo.
   - Aceptación: `ng build` sin errores ni advertencias de deprecación y `ng serve` muestra el robot moviéndose igual que la línea base.
3. **A3 — three.js actual:** imports `three/addons/...`, `dat.gui` → `lil-gui`, `outputColorSpace`, reajuste de luces, evaluar `OrbitControls`.
4. **A4 — bugs y limpieza** (ver arriba).
