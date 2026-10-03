import { describe, expect, it } from 'vitest';
import { consolidarPacientesElegiveisAnamnese } from '../shared/envioLoteAnamnese';

describe('Envio em lote de anamnese', () => {
  it('mantém somente um link por paciente e exclui pacientes sem contacto', () => {
    const elegiveis = consolidarPacientesElegiveisAnamnese([
      { pacienteId: 2, nome: 'BRUNO', whatsapp: null, telefone: '5592999999999' },
      { pacienteId: 2, nome: 'BRUNO', whatsapp: '5592988888888', telefone: '5592999999999' },
      { pacienteId: 3, nome: 'CARLA', whatsapp: null, telefone: null },
      { pacienteId: 1, nome: 'AMANDA', whatsapp: '5592977777777', telefone: null },
    ]);

    expect(elegiveis).toEqual([
      { pacienteId: 1, nome: 'AMANDA', telefone: '5592977777777' },
      { pacienteId: 2, nome: 'BRUNO', telefone: '5592999999999' },
    ]);
  });
});
