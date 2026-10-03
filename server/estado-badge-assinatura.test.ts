import { describe, expect, it } from 'vitest';
import { resolverEstadoBadgeAssinatura } from '../shared/estadoBadgeAssinatura';

describe('estado visual do badge de assinatura', () => {
  it('prioriza assinatura concluída mesmo se um marcador pendente legado estiver presente', () => {
    expect(resolverEstadoBadgeAssinatura({ assinadoPaciente: 1, assinaturaPendente: true, guiaId: 12 })).toBe('assinado');
  });

  it('exibe pendência na sessão individual quando o atendimento possui sua própria guia vinculada', () => {
    expect(resolverEstadoBadgeAssinatura({ assinadoPaciente: 0, assinaturaPendente: true, guiaId: 10110001 })).toBe('pendente');
  });

  it('não exibe pendência quando não existe guia vinculada ou ela não está pendente', () => {
    expect(resolverEstadoBadgeAssinatura({ assinadoPaciente: 0, assinaturaPendente: false, guiaId: 12 })).toBeNull();
    expect(resolverEstadoBadgeAssinatura({ assinadoPaciente: 0, assinaturaPendente: true, guiaId: null })).toBeNull();
  });
});
