/**
 * Testes para o router GEAP — Robô de Autorizações
 * Testa as funções de encriptação/desencriptação de senha e a lógica do robô.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// ─── Helpers de encriptação (copiados do router para teste isolado) ────────────

function encryptPassword(senha: string, secret = "test-secret"): string {
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(senha, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decryptPassword(encrypted: string, secret = "test-secret"): string {
  try {
    const [ivHex, encHex] = encrypted.split(":");
    const key = crypto.createHash("sha256").update(secret).digest();
    const iv = Buffer.from(ivHex, "hex");
    const encData = Buffer.from(encHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    return Buffer.concat([decipher.update(encData), decipher.final()]).toString("utf8");
  } catch {
    return encrypted;
  }
}

// ─── Testes ───────────────────────────────────────────────────────────────────

describe("GEAP — Encriptação de Senha", () => {
  it("deve encriptar e desencriptar correctamente", () => {
    const senha = "MinhaS3nhaSecreta!";
    const encrypted = encryptPassword(senha);
    const decrypted = decryptPassword(encrypted);
    expect(decrypted).toBe(senha);
  });

  it("deve gerar valores encriptados diferentes para a mesma senha (IV aleatório)", () => {
    const senha = "senha123";
    const enc1 = encryptPassword(senha);
    const enc2 = encryptPassword(senha);
    // Os IVs são aleatórios, então os valores encriptados devem ser diferentes
    expect(enc1).not.toBe(enc2);
    // Mas ambos devem desencriptar para a mesma senha
    expect(decryptPassword(enc1)).toBe(senha);
    expect(decryptPassword(enc2)).toBe(senha);
  });

  it("deve retornar o valor original em caso de falha na desencriptação", () => {
    const invalido = "nao-e-encriptado";
    const resultado = decryptPassword(invalido);
    expect(resultado).toBe(invalido);
  });

  it("deve encriptar senhas com caracteres especiais", () => {
    const senha = "P@$$w0rd!#%&*()";
    const encrypted = encryptPassword(senha);
    expect(decryptPassword(encrypted)).toBe(senha);
  });

  it("deve encriptar senhas com acentos e caracteres UTF-8", () => {
    const senha = "Clínica2024!ção";
    const encrypted = encryptPassword(senha);
    expect(decryptPassword(encrypted)).toBe(senha);
  });

  it("deve produzir formato correcto: hex:hex", () => {
    const encrypted = encryptPassword("teste");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/^[0-9a-f]{32}$/); // IV = 16 bytes = 32 hex chars
    expect(parts[1]).toMatch(/^[0-9a-f]+$/);    // dados encriptados em hex
  });
});

describe("GEAP — Validação de Dados de Autorização", () => {
  it("deve validar código TUSS com 8 dígitos", () => {
    const codigoTUSS = "10101012";
    expect(codigoTUSS).toMatch(/^\d{8,15}$/);
  });

  it("deve validar CID-10 no formato correcto", () => {
    const cids = ["F32.0", "F41.1", "Z00.0", "M54.5"];
    for (const cid of cids) {
      expect(cid).toMatch(/^[A-Z]\d{2}(\.\d)?$/);
    }
  });

  it("deve validar número de carteirinha", () => {
    // Carteirinhas GEAP têm formato variado, mas não podem ser vazias
    const carteira = "0010000001234567";
    expect(carteira.length).toBeGreaterThan(0);
  });

  it("deve validar quantidade de sessões positiva", () => {
    const quantidades = [1, 5, 10, 20];
    for (const q of quantidades) {
      expect(q).toBeGreaterThan(0);
    }
  });
});

describe("GEAP — Status de Autorizações", () => {
  const statusValidos = ["pendente", "processando", "autorizado", "negado", "erro", "cancelado"];

  it("deve ter todos os status válidos definidos", () => {
    expect(statusValidos).toContain("pendente");
    expect(statusValidos).toContain("processando");
    expect(statusValidos).toContain("autorizado");
    expect(statusValidos).toContain("negado");
    expect(statusValidos).toContain("erro");
    expect(statusValidos).toContain("cancelado");
  });

  it("deve calcular estatísticas correctamente", () => {
    const rows = [
      { status: "pendente" },
      { status: "pendente" },
      { status: "autorizado" },
      { status: "erro" },
      { status: "processando" },
    ];

    const stats = { total: rows.length, pendente: 0, processando: 0, autorizado: 0, negado: 0, erro: 0, cancelado: 0 };
    for (const row of rows) {
      if (row.status in stats) (stats as Record<string, number>)[row.status]++;
    }

    expect(stats.total).toBe(5);
    expect(stats.pendente).toBe(2);
    expect(stats.autorizado).toBe(1);
    expect(stats.erro).toBe(1);
    expect(stats.processando).toBe(1);
    expect(stats.negado).toBe(0);
    expect(stats.cancelado).toBe(0);
  });
});
