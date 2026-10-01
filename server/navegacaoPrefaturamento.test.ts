import { describe, expect, it } from 'vitest';
import { lerGuiaPrefaturamentoDirecionada, obterGuiaUnicaParaPrefaturamento } from '@shared/navegacaoPrefaturamento';

describe('navegação para pré-faturamento direcionado', () => {
  it('aceita apenas um identificador inteiro e positivo de guia', () => {
    expect(lerGuiaPrefaturamentoDirecionada('2070020')).toBe(2070020);
    expect(lerGuiaPrefaturamentoDirecionada('0')).toBeNull();
    expect(lerGuiaPrefaturamentoDirecionada('guia-inválida')).toBeNull();
    expect(lerGuiaPrefaturamentoDirecionada(null)).toBeNull();
  });

  it('direciona a única guia criada ou reutilizada pela Agenda', () => {
    expect(obterGuiaUnicaParaPrefaturamento([
      [{ guiaId: 5250030 }],
      [{ guiaId: 5250030 }],
    ])).toBe(5250030);
  });

  it('não escolhe uma guia quando a criação envolve séries diferentes', () => {
    expect(obterGuiaUnicaParaPrefaturamento([
      [{ guiaId: 11 }],
      [{ guiaId: 12 }],
    ])).toBeNull();
  });

  it('ignora resultados sem identificador válido de guia', () => {
    expect(obterGuiaUnicaParaPrefaturamento([[{ guiaId: null }, {}]])).toBeNull();
  });
});
