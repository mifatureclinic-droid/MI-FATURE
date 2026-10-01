import { describe, expect, it } from 'vitest';
import { getAtendimentosComStatusAssinatura } from '../shared/assinaturasAgenda';

describe('reconciliação das assinaturas auditadas', () => {
  it('reconhece Carlos e João após vínculo na guia da própria série e mantém Amanda isolada', () => {
    const resultado = getAtendimentosComStatusAssinatura(
      [
        { id: 6210007, data: '2026-08-22', pacienteId: 780196, profissionalId: 570005, convenioId: 600002, serieId: 'serie-amanda', guiaId: 8310001, assinaturaDigitalObrigatoria: true },
        { id: 1830997, data: '2026-08-22', pacienteId: 780206, profissionalId: 570005, convenioId: 600005, serieId: 'serie-carlos', guiaId: 1920027, assinaturaDigitalObrigatoria: true },
        { id: 5970002, data: '2026-08-24', pacienteId: 2190001, profissionalId: 570005, convenioId: 630002, serieId: 'serie-joao', guiaId: 5250030, assinaturaDigitalObrigatoria: true },
      ],
      [
        { id: 8310001, pacienteId: 780196, profissionalId: 570005, convenioId: 600002, serieId: 'serie-amanda' },
        { id: 1740031, pacienteId: 780196, profissionalId: 570005, convenioId: 600002, serieId: 'serie-antiga-amanda' },
        { id: 1920027, pacienteId: 780206, profissionalId: 570005, convenioId: 600005, serieId: 'serie-carlos' },
        { id: 5250030, pacienteId: 2190001, profissionalId: 570005, convenioId: 630002, serieId: 'serie-joao' },
      ],
      [],
      [
        { guiaId: 1740031, pacienteId: 780196, datasAtendimento: '["2026-08-22"]', assinaturaPacienteUrl: 'assinatura-amanda' },
        { guiaId: 1920027, pacienteId: 780206, datasAtendimento: '["2026-08-22"]', assinaturaPacienteUrl: 'assinatura-carlos' },
        { guiaId: 5250030, pacienteId: 2190001, datasAtendimento: '["2026-08-24"]', assinaturaPacienteUrl: 'assinatura-joao' },
      ],
    );

    expect(resultado.assinados).toEqual(new Set([1830997, 5970002]));
    expect(resultado.pendentes).toEqual(new Set([6210007]));
  });
});
