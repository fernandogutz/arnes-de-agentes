import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { diaSemana, esFechaValida, fechaLocal, localAUtc, offsetMinutos } from "./fechas.ts";

describe("fechas (America/Santiago -> UTC)", () => {
  it("convierte hora local a UTC en horario de verano (UTC-3)", () => {
    // 23 sep 2026: Chile ya está en horario de verano.
    assert.equal(localAUtc("2026-09-23", "08:00").toISOString(), "2026-09-23T11:00:00.000Z");
  });

  it("convierte hora local a UTC en horario de invierno (UTC-4)", () => {
    assert.equal(localAUtc("2026-06-15", "09:00").toISOString(), "2026-06-15T13:00:00.000Z");
  });

  it("calcula el offset correcto en cada estación", () => {
    assert.equal(offsetMinutos(new Date("2026-01-15T12:00:00Z")), -180);
    assert.equal(offsetMinutos(new Date("2026-06-15T12:00:00Z")), -240);
  });

  it("devuelve la fecha local de un instante UTC (cruce de medianoche)", () => {
    // 02:00Z del 24 sep = 23:00 del 23 sep en Chile (UTC-3).
    assert.equal(fechaLocal(new Date("2026-09-24T02:00:00Z")), "2026-09-23");
  });

  it("valida fechas YYYY-MM-DD", () => {
    assert.equal(esFechaValida("2026-09-23"), true);
    assert.equal(esFechaValida("2026-02-30"), false);
    assert.equal(esFechaValida("23-09-2026"), false);
    assert.equal(esFechaValida("hoy"), false);
  });

  it("obtiene el día de la semana", () => {
    assert.equal(diaSemana("2026-09-23"), 3); // miércoles
    assert.equal(diaSemana("2026-09-26"), 6); // sábado
    assert.equal(diaSemana("2026-09-27"), 0); // domingo
  });
});
