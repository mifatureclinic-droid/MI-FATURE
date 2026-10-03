import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const fonteRouter = readFileSync(new URL('./routers.ts', import.meta.url), 'utf8');

describe('guias.salvarSPSADT — datas de calendário', () => {
  it('normaliza as datas antes de persistir e rejeita formatos inválidos com mensagem clara', () => {
    expect(fonteRouter).toContain('function converterDataCalendarioParaBanco');
    expect(fonteRouter).toContain("message: `Data inválida em ${campo}. Use DD/MM/AAAA.`");
    expect(fonteRouter).toContain("'Data da Autorização'");
    expect(fonteRouter).toContain("'Data de Validade da Senha'");
    expect(fonteRouter).toContain("'Validade da Carteira'");
    expect(fonteRouter).toContain('T12:00:00.000Z');
  });
});
