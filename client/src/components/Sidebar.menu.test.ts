import { describe, expect, it } from 'vitest';
import { menuItems } from './Sidebar';

describe('menu lateral', () => {
  it('mantém a rota de notificações com o rótulo Status de Assinatura', () => {
    expect(menuItems.find((item) => item.id === 'notificacoes')).toMatchObject({
      id: 'notificacoes',
      label: 'Status de Assinatura',
    });
  });
});
