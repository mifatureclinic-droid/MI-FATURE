/** @vitest-environment jsdom */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { LoadingButton } from './LoadingButton';

describe('LoadingButton', () => {
  it('permite que um botão submit dispare o onSubmit do formulário', () => {
    const salvar = vi.fn((evento: React.FormEvent) => evento.preventDefault());

    render(
      <LoadingProvider>
        <form onSubmit={salvar}>
          <LoadingButton type="submit">Atualizar</LoadingButton>
        </form>
      </LoadingProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Atualizar' }));
    expect(salvar).toHaveBeenCalledTimes(1);
  });
});
