# Nébula Dental — web

Sitio de una clínica dental ficticia "de nueva generación": Vite + React 19 + TypeScript, escena 3D con Three.js
(`@react-three/fiber` + `drei`), CSS propio (sin Tailwind) y tests con Vitest + Testing Library.

## Correr

```bash
# desde la raíz del monorepo
npm install
npm run dev -w apps/web        # http://localhost:5173
npm run typecheck -w apps/web
npm test -w apps/web
npm run build -w apps/web      # tsc -b && vite build → dist/
```

La web llama a `/api/...` y Vite lo reenvía a `http://localhost:3001` (ver `server.proxy` en `vite.config.ts`).
Si la API no está arriba, **la web no se rompe**: usa los datos de `src/datos/respaldo.ts` (los mismos del contrato
en `docs/API-CONTRATO.md`), genera horas de respaldo y muestra un aviso discreto "API sin conexión".

## Rutas

| Ruta | Qué hay |
|---|---|
| `/` | Hero 3D, tecnología (con segunda escena 3D), servicios, sucursales, equipo, testimonios, CTA |
| `/servicios` | Grilla completa con filtros por categoría, precios "desde" en CLP |
| `/sucursales` | 4 sucursales con estado Abierta/Cerrada en hora de Santiago y link a Google Maps |
| `/reservar` | Wizard: sucursal → servicio → fecha y hora (`/api/disponibilidad`) → datos → `POST /api/reservas` |
| `/reserva/:codigo` | Confirmación con el código grande |

## Estructura

```
src/
  componentes/   piezas de UI chicas (Nav, Hero, TarjetaSucursal, ...)
  paginas/       una por ruta (Inicio, Reservar, Confirmacion, ...)
  tres/          escenas Three.js (EscenaHero, EscenaEscaner) + detección de WebGL
  datos/         respaldo.ts (espejo del contrato) y contenido.ts (textos, equipo, testimonios)
  lib/           api.ts (cliente + hooks), fechas.ts (UTC → America/Santiago), precio.ts, validacion.ts, tipos.ts
  estilos/       variables.css, base.css, componentes.css, paginas.css
  test/          setup (mocks de 3D e IntersectionObserver) + 6 archivos de tests
public/img/      fotos (Wikimedia Commons / Unsplash, ver CREDITS.md)
```

## Decisiones

- Todas las horas viajan en UTC y se muestran en `America/Santiago` con `Intl.DateTimeFormat` (sin librerías de fechas).
- Las escenas 3D se cargan con `React.lazy` en un chunk aparte (~1.1 MB min, ~320 KB gzip) y se pausan cuando salen
  de pantalla. Sin WebGL o con `prefers-reduced-motion` hay un fallback CSS.
- En tests las escenas se mockean (`src/test/setup.ts`): jsdom no tiene WebGL.
