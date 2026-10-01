/** @vitest-environment jsdom */
import React, { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditorDataSessaoModal } from './EditorDataSessaoModal';

describe('EditorDataSessaoModal', () => {
  it('abre um editor amplo, permite selecionar a data e salva a alteração', () => {
    const salvar = vi.fn();
    function Cenario() {
      const [data, setData] = useState('2026-08-05');
      return <EditorDataSessaoModal aberta data={data} onAlterarData={setData} onSalvar={() => salvar(data)} onCancelar={vi.fn()} />;
    }

    render(<Cenario />);
    expect(screen.getByRole('dialog', { name: 'Editar data da sessão' })).toBeTruthy();
    const campo = screen.getByLabelText('Nova data da sessão') as HTMLInputElement;
    fireEvent.change(campo, { target: { value: '2026-08-12' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar data' }));
    expect(salvar).toHaveBeenCalledWith('2026-08-12');
  });
});
