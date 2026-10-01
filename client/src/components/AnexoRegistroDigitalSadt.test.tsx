/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnexoRegistroDigitalSadt } from './AnexoRegistroDigitalSadt';

describe('AnexoRegistroDigitalSadt', () => {
  it('concentra no anexo os dados da sessão, a assinatura e a declaração legal', () => {
    const { container } = render(
      <AnexoRegistroDigitalSadt
        numeroGuia="1830889678"
        paciente="Laura Maia"
        profissional="Dra. Exemplo"
        procedimento="50000470"
        assinaturas={[{
          id: 11,
          sessaoNumero: 1,
          datasAtendimento: '["2026-08-12"]',
          dataAssinatura: '2026-08-12 09:32:00',
          assinaturaPacienteUrl: 'https://exemplo.test/assinatura.png',
          hashAssinatura: 'abc123def456',
        }]}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Anexo à Guia SADT' })).toBeTruthy();
    expect(screen.getByText('Registro Digital de Assinaturas')).toBeTruthy();
    expect(container.querySelector('[data-sadt-document="anexo"]')).toBeTruthy();
    expect(screen.getByText('Guia:')).toBeTruthy();
    expect(screen.getByText('1830889678')).toBeTruthy();
    expect(screen.getByText('Procedimento:')).toBeTruthy();
    expect(screen.getByText('Próxima sessão:')).toBeTruthy();
    expect(screen.getByText('Total de sessões:')).toBeTruthy();
    expect(screen.getByText('1ª sessão — 12/08/2026')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Assinatura do paciente — sessão 1' })).toBeTruthy();
    expect(screen.getByText('Hash SHA-256 da assinatura')).toBeTruthy();
    expect(screen.getByText('abc123def456')).toBeTruthy();
    expect(screen.getByText('Este comprovante foi gerado digitalmente e possui validade legal.')).toBeTruthy();
    expect(screen.getByText(/^Gerado em:/)).toBeTruthy();
  });
});
