import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.ts";
import { abrirDb, sembrar } from "./db/conexion.ts";
import type { Reserva } from "./tipos.ts";

const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("API Nébula Dental", () => {
  const db = abrirDb(":memory:");
  const app = createApp(db);

  before(() => sembrar(db)); // segunda siembra: debe ser idempotente

  it("GET /api/health", async () => {
    const res = await app.request("/api/health");
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true, servicio: "nebula-api" });
  });

  it("GET /api/sucursales devuelve las 4 sucursales con horario (siembra idempotente)", async () => {
    const res = await app.request("/api/sucursales");
    const sucursales = await res.json();
    assert.equal(sucursales.length, 4);
    assert.deepEqual(
      sucursales.map((s: { slug: string }) => s.slug),
      ["las-condes", "providencia", "nunoa", "vina-del-mar"],
    );
    assert.deepEqual(sucursales[2].horario, { lunVie: "09:00-19:00", sab: null, dom: null });
  });

  it("GET /api/sucursales/:slug y 404", async () => {
    const ok = await app.request("/api/sucursales/vina-del-mar");
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).ciudad, "Valparaíso");

    const noExiste = await app.request("/api/sucursales/maipu");
    assert.equal(noExiste.status, 404);
    assert.deepEqual(await noExiste.json(), { error: "sucursal_no_encontrada" });
  });

  it("GET /api/servicios devuelve los 8 servicios", async () => {
    const res = await app.request("/api/servicios");
    const servicios = await res.json();
    assert.equal(servicios.length, 8);
    assert.deepEqual(servicios[4], {
      id: 5,
      slug: "ortodoncia-invisible",
      nombre: "Ortodoncia invisible",
      categoria: "ortodoncia",
      descripcion: servicios[4].descripcion,
      duracionMin: 45,
      precioDesde: 1900000,
    });
  });

  it("GET /api/disponibilidad valida parámetros", async () => {
    const sinParams = await app.request("/api/disponibilidad");
    assert.equal(sinParams.status, 400);
    assert.deepEqual(await sinParams.json(), {
      error: "validacion",
      detalles: ["falta el parámetro sucursal", "falta el parámetro fecha"],
    });

    const fechaMala = await app.request("/api/disponibilidad?sucursal=nunoa&fecha=2026-13-40");
    assert.equal(fechaMala.status, 400);

    const sucursalMala = await app.request("/api/disponibilidad?sucursal=maipu&fecha=2026-09-23");
    assert.equal(sucursalMala.status, 404);
  });

  it("GET /api/disponibilidad devuelve slots en UTC y vacío los domingos", async () => {
    const res = await app.request("/api/disponibilidad?sucursal=providencia&fecha=2026-09-23");
    const cuerpo = await res.json();
    assert.equal(cuerpo.sucursal, "providencia");
    assert.equal(cuerpo.fecha, "2026-09-23");
    assert.equal(cuerpo.slots.length, 22); // 09:00-20:00
    assert.equal(cuerpo.slots[0], "2026-09-23T12:00:00.000Z");

    const domingo = await app.request("/api/disponibilidad?sucursal=providencia&fecha=2026-09-27");
    assert.deepEqual((await domingo.json()).slots, []);
  });

  it("POST /api/reservas crea, GET por código la devuelve y el slot desaparece de la disponibilidad", async () => {
    const inicio = "2026-09-23T13:00:00.000Z"; // 10:00 local
    const res = await app.request(
      "/api/reservas",
      json({
        sucursal: "las-condes",
        servicio: "limpieza",
        inicio,
        paciente: { nombre: "Camila Rojas", email: "camila@ejemplo.cl", telefono: "+56 9 8765 4321" },
      }),
    );
    assert.equal(res.status, 201);
    const reserva = (await res.json()) as Reserva;
    assert.match(reserva.codigo, /^[A-HJ-NP-Z2-9]{6}$/);
    assert.equal(reserva.sucursal, "las-condes");
    assert.equal(reserva.servicio, "limpieza");
    assert.equal(reserva.inicio, inicio);
    assert.equal(reserva.estado, "confirmada");
    assert.equal(reserva.paciente.nombre, "Camila Rojas");
    assert.ok(!Number.isNaN(Date.parse(reserva.creadaEn)));

    const porCodigo = await app.request(`/api/reservas/${reserva.codigo.toLowerCase()}`);
    assert.equal(porCodigo.status, 200);
    assert.deepEqual(await porCodigo.json(), reserva);

    const disp = await app.request("/api/disponibilidad?sucursal=las-condes&fecha=2026-09-23");
    const { slots } = await disp.json();
    assert.equal(slots.length, 25);
    assert.ok(!slots.includes(inicio));

    // Otra sucursal a la misma hora sigue libre.
    const otra = await app.request("/api/disponibilidad?sucursal=providencia&fecha=2026-09-23");
    assert.ok((await otra.json()).slots.includes(inicio));
  });

  it("POST /api/reservas responde 409 si el horario ya está tomado o está fuera del horario", async () => {
    const paciente = { nombre: "Diego Soto", email: "diego@ejemplo.cl", telefono: "987654321" };
    const repetida = await app.request(
      "/api/reservas",
      json({ sucursal: "las-condes", servicio: "urgencias", inicio: "2026-09-23T13:00:00.000Z", paciente }),
    );
    assert.equal(repetida.status, 409);
    assert.deepEqual(await repetida.json(), { error: "horario_no_disponible" });

    // 03:00 local: la sucursal está cerrada.
    const fueraDeHorario = await app.request(
      "/api/reservas",
      json({ sucursal: "las-condes", servicio: "urgencias", inicio: "2026-09-23T06:00:00.000Z", paciente }),
    );
    assert.equal(fueraDeHorario.status, 409);
  });

  it("POST /api/reservas responde 400 con detalles si el body es inválido o la sucursal/servicio no existen", async () => {
    const invalido = await app.request("/api/reservas", json({ sucursal: "las-condes" }));
    assert.equal(invalido.status, 400);
    const cuerpo = await invalido.json();
    assert.equal(cuerpo.error, "validacion");
    assert.ok(cuerpo.detalles.length >= 4);

    const inexistentes = await app.request(
      "/api/reservas",
      json({
        sucursal: "maipu",
        servicio: "tatuajes",
        inicio: "2026-09-23T13:00:00.000Z",
        paciente: { nombre: "Ana Pérez", email: "ana@ejemplo.cl", telefono: "912345678" },
      }),
    );
    assert.equal(inexistentes.status, 400);
    assert.deepEqual(await inexistentes.json(), {
      error: "validacion",
      detalles: ['la sucursal "maipu" no existe', 'el servicio "tatuajes" no existe'],
    });

    const noJson = await app.request("/api/reservas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{esto no es json",
    });
    assert.equal(noJson.status, 400);
  });

  it("GET /api/reservas/:codigo responde 404 si no existe", async () => {
    const res = await app.request("/api/reservas/ZZZZZZ");
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: "reserva_no_encontrada" });
  });

  it("404 JSON genérico para rutas desconocidas", async () => {
    const res = await app.request("/api/pacientes");
    assert.equal(res.status, 404);
    assert.deepEqual(await res.json(), { error: "ruta_no_encontrada" });
  });

  it("CORS permite orígenes localhost", async () => {
    const res = await app.request("/api/health", { headers: { origin: "http://localhost:5173" } });
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
  });
});
