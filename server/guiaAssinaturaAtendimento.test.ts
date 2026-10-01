import { describe, expect, it } from 'vitest';
import { selecionarGuiaParaAssinatura } from '../shared/guiaAssinaturaAtendimento';

describe('selecionarGuiaParaAssinatura', () => {
  const atendimento = {
    id: 12,
    pacienteId: 8,
    profissionalId: 4,
    convenioId: 20,
    guiaId: 102,
    data: '2026-08-25',
  };

  it('prioriza a guia explicitamente vinculada ao atendimento', () => {
    const guia = selecionarGuiaParaAssinatura(atendimento, [
      { id: 101, pacienteId: 8, profissionalId: 4, convenioId: 10, status: 'rascunho', dataEmissao: '2026-08-01' },
      { id: 102, pacienteId: 8, profissionalId: 4, convenioId: 20, status: 'rascunho', dataEmissao: '2026-08-25' },
    ]);

    expect(guia?.id).toBe(102);
  });

  it('nunca reutiliza guia de outro convênio quando o vínculo está ausente', () => {
    const guia = selecionarGuiaParaAssinatura({ ...atendimento, guiaId: null }, [
      { id: 101, pacienteId: 8, profissionalId: 4, convenioId: 10, status: 'rascunho', dataEmissao: '2026-08-25' },
      { id: 102, pacienteId: 8, profissionalId: 4, convenioId: 20, status: 'emitida', dataEmissao: '2026-08-20' },
    ]);

    expect(guia?.id).toBe(102);
  });
});
