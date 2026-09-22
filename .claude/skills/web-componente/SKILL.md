---
name: web-componente
description: >
  Cómo agregar o modificar un componente o una página de la web de Nébula Dental (`apps/web`, Vite + React 19 + TS + Three.js).
  Trigger: cualquier task que toque la interfaz: componente nuevo, página nueva, ruta nueva, cambio visual o de datos en el front.
metadata:
  auto_invoke: "Agregar o modificar un componente o página de la web (`apps/web`)"
---

## Dónde va cada cosa

```
apps/web/src/
  App.tsx         el router (react-router-dom): una <Route> por página; las nuevas se registran aquí
  paginas/        un archivo por ruta (Inicio, PaginaSucursales, PaginaServicios, Reservar, Confirmacion, NoEncontrada)
  componentes/    piezas reutilizables (Nav, Footer, TarjetaSucursal, TarjetaServicio, CTA, Reveal…)
  tres/           todo lo de Three.js (EscenaHero, EscenaEscaner, soporte.ts); nada de `three` fuera de aquí
  test/           los tests (`<Nombre>.test.tsx`) y `setup.ts` (jest-dom)
  lib/api.ts      cliente de la API (`api.sucursales()`, `api.reserva(codigo)`…) + hooks `useSucursales`, `useServicios`
  lib/tipos.ts    tipos del contrato (Sucursal, Servicio, Reserva…); lib/validacion.ts = validación del paciente
  lib/fechas.ts   UTC → America/Santiago para mostrar (`horaLocal`, `fechaLarga`, `estaAbierta`, `textoEstado`)
  datos/respaldo.ts  SUCURSALES_RESPALDO / SERVICIOS_RESPALDO si la API no responde; datos/contenido.ts = textos fijos
  estilos/        variables.css (tokens) · base.css · componentes.css
```

Una **página** = componente en `paginas/` + `<Route>` en `App.tsx`. Un **componente** = archivo en `componentes/` con su test en `test/<Nombre>.test.tsx`. Antes de crear uno, mira si ya existe algo parecido en `componentes/` (p. ej. `TarjetaSucursal` ya calcula abierta/cerrada y el link al mapa).

## Reglas del área

- **Estilos con variables CSS** definidas en `estilos/` (`var(--color-primario)`, `var(--espacio-2)`…). Nada de colores ni tamaños hardcodeados en el componente. Sin librerías de UI nuevas.
- **Datos**: primero la API, si falla el respaldo. Eso ya lo resuelve `useRecurso` en `lib/api.ts` (`useSucursales()` devuelve `{ datos, cargando, deRespaldo }`). Un componente nunca hace `fetch` directo: recibe los datos por props o usa esos hooks.
- **Fechas (D-02)**: la API entrega ISO UTC. Para mostrar, siempre `lib/fechas.ts` (`horaLocal(iso)`, `fechaLarga(iso)`, `estaAbierta(horario, ahora)`, `textoEstado(horario, ahora)`). Si necesitas una función nueva de fecha, va ahí con su test; no uses `new Date().getHours()` ni `toLocaleString` sueltos en un componente. Las funciones reciben `ahora: Date` como parámetro para que el test la fije.
- **Rutas** en español, en kebab-case: `/sucursales/:slug`, `/reserva/:codigo`. Los links a páginas de detalle se construyen desde el `slug`/`codigo`, nunca desde el `id`.
- **Accesibilidad mínima**: cada imagen con `alt`, cada botón con texto, cada formulario con `label`. Los tests buscan por rol y texto, así que esto es también lo que los hace posibles.

## Tests (vitest + testing-library)

```tsx
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PaginaSucursal } from '../paginas/PaginaSucursal'

describe('PaginaSucursal', () => {
  it("muestra 'Sucursal no encontrada' con un slug inexistente", () => {
    render(
      <MemoryRouter initialEntries={['/sucursales/no-existe']}>
        <Routes><Route path="/sucursales/:slug" element={<PaginaSucursal />} /></Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: /sucursal no encontrada/i })).toBeInTheDocument()
  })
})
```

- **Mock del 3D**: Three.js no corre en jsdom. Cualquier test que renderice una página con escena mockea el módulo de `tres/` (`vi.mock('../tres/EscenaHero', () => ({ EscenaHero: () => null }))`). Nunca importes `three` en un test.
- **Mock de la API**: `vi.spyOn(api, 'sucursales').mockResolvedValue([...])` o `vi.mock('../lib/api')` devolviendo los datos de `datos/respaldo.ts`. Los tests no llaman a `localhost:3001`.
- Hora "ahora" en tests de abierto/cerrado: los componentes reciben `ahora?: Date` como prop (ver `TarjetaSucursal`) y el test la fija: `ahora={new Date('2026-09-22T13:00:00.000Z')}`. Sin fake timers salvo que no haya otra forma.
- Estilo: comillas simples, sin punto y coma (el código existente); `describe`/`it`/`expect` importados de `vitest`.
- Cada `R<n>` del spec tiene al menos un `it(...)` que lo nombra.

## QA del área (obligatoria antes de commitear)

```bash
npm run typecheck -w apps/web && npm test -w apps/web && npm run build -w apps/web
```

Verde = `tsc` sin errores, tests `passed`, `vite build` termina sin warnings de tamaño nuevos. Para verlo: `npm run dev -w apps/web` → `http://localhost:5173`.

Al terminar, commitea con la skill `commit` (`feat(web): …`). No pushees ni mergees.
