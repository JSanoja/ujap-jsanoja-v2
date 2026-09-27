# Emulador de brazo robótico — App 1 (referencia)

Emulador 3D de un brazo robótico de 5 ejes inspirado en el LabVolt 5250, desarrollado como parte del
Trabajo Especial de Grado de Juan Sanoja (Especialización en Automatización Industrial, Universidad
"José Antonio Páez", UJAP).

Esta aplicación se inició en 2021 con Angular 12 y three.js r129 y se conserva actualizada como
**versión de referencia**. Las funciones nuevas (programas TXT, pinza y editor) se desarrollan en
una aplicación aparte.

## Ejes

| Eje | Pieza | Giro | Mín (°) | Máx (°) | Vel. (°/s) |
|---|---|---|---|---|---|
| A1 | RotatingColumn (base) | z | −170 | 170 | 97,5 |
| A2 | LinkArm (hombro) | y | −40 | 110 | 91 |
| A3 | Arm (codo) | y | −90 | 65 | 89 |
| A4 | Wrist (muñeca) | y | −140 | 100 | 90 |
| A5 | EndEffector (giro de herramienta) | z | −175 | 175 | 177 |

## Uso

- **Reset View:** devuelve la cámara a la vista inicial.
- **Default Position:** lleva todos los ejes a 0°.
- **Execute:** reproduce una secuencia de prueba de 6 poses.
- Panel derecho: setpoint, realimentación y velocidad de cada eje.
- Ratón: botón izquierdo gira, rueda acerca, botón derecho desplaza.

## Desarrollo

Requiere Node 22.22+ o 24.15+.

```bash
npm ci
npm start          # http://localhost:4200/
npm run build      # salida en dist/ujap-jsanoja-v2/browser
npx ng lint
```

Cada push a `master` se publica en GitHub Pages mediante `.github/workflows/pages.yml`.

## Versiones

| Etiqueta | Contenido |
|---|---|
| `v0-legacy` | Estado 2021: Angular 12 + three.js r129 (requiere Node 14) |
| `v1-angular-22` | Angular 22, standalone, builder `application`; three.js aún en 0.129 |

## Créditos y licencia

Basado en la plantilla [ng-three-template](https://github.com/JohnnyDevNull/ng-three-template) de
Philipp John, bajo licencia MIT (ver `LICENSE.md`).
