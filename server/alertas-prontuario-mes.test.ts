import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('contador mensal de prontuários atrasados', () => {
  const dbSource = readFileSync(fileURLToPath(new URL('./db.ts', import.meta.url)), 'utf8');
  const routerSource = readFileSync(fileURLToPath(new URL('./routers.ts', import.meta.url)), 'utf8');
  const agendaSource = readFileSync(
    fileURLToPath(new URL('../client/src/pages/Agenda.tsx', import.meta.url)),
    'utf8',
  );

  it('filtra o atendimento pelo mês da sessão e pelos profissionais selecionados', () => {
    expect(dbSource).toContain("String(a.data).slice(0, 7) !== mesReferencia");
    expect(dbSource).toContain("profissionalIds.includes(a.profissionalId)");
    expect(dbSource).toContain("agora > dataLimite && !a.liberadoPorMaster && a.status === 'agendado'");
  });

  it('expõe os filtros no procedimento protegido e os envia pela Agenda', () => {
    expect(routerSource).toContain('mesReferencia: z.string().regex(/^\\d{4}-\\d{2}$/).optional()');
    expect(routerSource).toContain('profissionalIds: z.array(z.number().int()).optional()');
    expect(agendaSource).toContain("mesReferencia: format(dataSelecionadaMaster, 'yyyy-MM')");
    expect(agendaSource).toContain('profissionalIds: idsProfissionaisParaConsulta.length > 0 ? idsProfissionaisParaConsulta : undefined');
  });
});
