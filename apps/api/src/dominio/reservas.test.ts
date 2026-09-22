import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ALFABETO_CODIGO, generarCodigo, validarNuevaReserva } from "./reservas.ts";

describe("generarCodigo", () => {
  it("produce 6 caracteres legibles (sin O, 0, I ni 1)", () => {
    for (let i = 0; i < 200; i++) {
      const codigo = generarCodigo();
      assert.match(codigo, /^[A-HJ-NP-Z2-9]{6}$/);
      for (const ch of codigo) assert.ok(ALFABETO_CODIGO.includes(ch));
    }
  });
});

describe("validarNuevaReserva", () => {
  const valido = {
    sucursal: "las-condes",
    servicio: "limpieza",
    inicio: "2026-09-23T14:00:00.000Z",
    paciente: { nombre: "Ana Pérez", email: "ana@ejemplo.cl", telefono: "+56 9 1234 5678" },
  };

  it("acepta un body correcto y normaliza el inicio a ISO UTC", () => {
    const r = validarNuevaReserva({ ...valido, inicio: "2026-09-23T11:00:00-03:00" });
    assert.ok(r.ok);
    assert.equal(r.datos.inicio, "2026-09-23T14:00:00.000Z");
  });

  it("acumula todos los problemas en detalles", () => {
    const r = validarNuevaReserva({ paciente: { nombre: "Al", email: "sin-arroba", telefono: "123" } });
    assert.ok(!r.ok);
    assert.deepEqual(r.detalles, [
      "sucursal es obligatoria",
      "servicio es obligatorio",
      "inicio es obligatorio",
      "paciente.nombre debe tener al menos 3 caracteres",
      "paciente.email no es un correo válido",
      "paciente.telefono debe tener al menos 8 dígitos",
    ]);
  });

  it("rechaza un inicio que no es ISO 8601", () => {
    const r = validarNuevaReserva({ ...valido, inicio: "mañana a las 10" });
    assert.ok(!r.ok);
    assert.equal(r.detalles.length, 1);
    assert.match(r.detalles[0], /ISO 8601/);
  });
});
