import { describe, expect, it } from 'vitest';
import { extrairIdDaGuiaCriada } from '@shared/vinculoGuiaAtendimento';

describe('vínculo do atendimento à guia individual criada', () => {
  it('aceita os formatos de insertId retornados pelo banco', () => {
    expect(extrairIdDaGuiaCriada({ insertId: 3180001 })).toBe(3180001);
    expect(extrairIdDaGuiaCriada([{ insertId: '3180002' }])).toBe(3180002);
  });

  it('recusa retornos sem identificador válido', () => {
    expect(extrairIdDaGuiaCriada({ insertId: 0 })).toBeNull();
    expect(extrairIdDaGuiaCriada(null)).toBeNull();
  });
});
