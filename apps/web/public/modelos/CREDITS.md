# Modelos 3D de Nébula Dental

**No hay modelos externos en esta carpeta, y por eso no hay nada que atribuir.**

Toda la geometría dental del sitio (el molar del hero y las 14 piezas de la arcada del
escáner) se genera por código en `src/tres/geometriaDiente.ts`:

- corona como aros apilados sobre un perfil vertical (Catmull-Rom) con sección
  superelíptica — cuadrada-redondeada en molares, aplanada en incisivos;
- tapa oclusal con cúspides, surcos y fosa central (4 cúspides en molares, 2 en
  premolares, una punta en caninos, borde incisal en incisivos);
- raíces como tubos curvados por bézier, afinados hasta el ápice (dos divergentes en
  molares, una en el resto).

Por qué procedimental y no un `.glb` descargado:

1. Bajar assets binarios de terceros a este repo necesita el visto bueno explícito del
   dueño (licencia + revisión del archivo). No se hizo en esta pasada, así que no se
   descargó nada.
2. Peso: la geometría se construye en el cliente en ~2 ms y suma **0 bytes** de descarga,
   contra los 0,3–1,5 MB de un `.glb` dental típico (y sin loaders extra tipo Draco/meshopt
   ni dependencias nuevas).
3. Es paramétrica: con una sola función salen los 4 tipos de pieza que necesita la arcada,
   en tres resoluciones (vidrio, sólido, wireframe).

Si más adelante se quiere un escaneo real (por ejemplo de [NIH 3D](https://3d.nih.gov),
dominio público), el reemplazo es acotado: dejar el `.glb` en esta carpeta, cargarlo con
`useGLTF` dentro de `<Suspense>` y anotar autor + licencia + URL acá.
