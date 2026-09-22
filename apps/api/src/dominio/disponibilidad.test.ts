import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { calcularSlots } from "./disponibilidad.ts";
import type { Horario } from "../tipos.ts";

const LAS_CONDES: Horario = { lunVie: "08:00-21:00", sab: "09:00-14:00", dom: null };
const NUNOA: Horario = { lunVie: "09:00-19:00", sab: null, dom: null };

describe("calcularSlots", () => {
  it("genera slots de 30 min dentro del horario de lunes a viernes, en UTC", () => {
    const slots = calcularSlots(LAS_CONDES, "2026-09-23"); // miércoles, UTC-3
    assert.equal(slots.length, 26); // 13 horas * 2
    assert.equal(slots[0], "2026-09-23T11:00:00.000Z"); // 08:00 local
    assert.equal(slots.at(-1), "2026-09-23T23:30:00.000Z"); // 20:30 local, último que cabe antes de las 21:00
  });

  it("usa el horario de sábado", () => {
    const slots = calcularSlots(LAS_CONDES, "2026-09-26");
    assert.equal(slots.length, 10); // 09:00 a 14:00
    assert.equal(slots[0], "2026-09-26T12:00:00.000Z");
  });

  it("devuelve vacío cuando la sucursal está cerrada ese día", () => {
    assert.deepEqual(calcularSlots(LAS_CONDES, "2026-09-27"), []); // domingo
    assert.deepEqual(calcularSlots(NUNOA, "2026-09-26"), []); // sábado en Ñuñoa
  });

  it("quita los slots ya reservados", () => {
    const reservado = "2026-09-23T11:30:00.000Z";
    const slots = calcularSlots(LAS_CONDES, "2026-09-23", [reservado]);
    assert.equal(slots.length, 25);
    assert.ok(!slots.includes(reservado));
  });

  it("respeta el cambio de hora: el mismo horario local da otro UTC en invierno", () => {
    const slots = calcularSlots(NUNOA, "2026-06-15"); // lunes, UTC-4
    assert.equal(slots[0], "2026-06-15T13:00:00.000Z"); // 09:00 local
    assert.equal(slots.length, 20);
  });
});
