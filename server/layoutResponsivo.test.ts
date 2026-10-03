import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Testes estruturais de responsividade mobile.
 * Verificam que os componentes de layout contêm as classes/lógica
 * necessárias para o comportamento responsivo (sidebar off-canvas,
 * botão de menu no header e área imprimível isolada).
 *
 * São testes de "fonte" (leem o código-fonte) porque o layout depende
 * de classes Tailwind aplicadas condicionalmente, e o ambiente de teste
 * não renderiza o app completo (que exige sessão OAuth).
 */

const clientSrc = resolve(__dirname, '../client/src');

function readComponent(rel: string): string {
  return readFileSync(resolve(clientSrc, rel), 'utf-8');
}

describe('Sidebar responsiva', () => {
  const sidebar = readComponent('components/Sidebar.tsx');

  it('esconde a sidebar fixa no mobile e mostra apenas no desktop (md:flex)', () => {
    expect(sidebar).toContain('hidden md:flex');
  });

  it('possui painel deslizante off-canvas exclusivo do mobile (md:hidden)', () => {
    expect(sidebar).toContain('md:hidden');
    expect(sidebar).toContain("translateX(-100%)");
    expect(sidebar).toContain("translateX(0)");
  });

  it('renderiza overlay quando aberto no mobile', () => {
    expect(sidebar).toContain('mobileOpen');
    expect(sidebar).toContain('bg-black/60');
  });

  it('fecha o menu ao navegar (chama onCloseMobile após onNavigate)', () => {
    expect(sidebar).toContain('onCloseMobile');
    expect(sidebar).toMatch(/onNavigate\(id\);\s*onCloseMobile\?\.\(\)/);
  });
});

describe('Header responsivo', () => {
  const header = readComponent('components/Header.tsx');

  it('possui botão de menu (hambúrguer) visível somente no mobile', () => {
    expect(header).toContain('md:hidden');
    expect(header).toContain('onToggleMenu');
    expect(header).toContain('Abrir menu');
  });

  it('oculta o subtítulo longo em telas pequenas (hidden sm:block)', () => {
    expect(header).toContain('hidden sm:block');
  });

  it('oculta o rótulo "Sair" em telas pequenas mantendo o ícone', () => {
    expect(header).toContain('hidden sm:inline');
  });
});

describe('Impressão da guia (área imprimível)', () => {
  const indexCss = readComponent('index.css');

  it('define regras @media print que isolam a área imprimível', () => {
    expect(indexCss).toContain('@media print');
    expect(indexCss).toContain('.print-area');
    expect(indexCss).toContain('visibility: hidden');
    expect(indexCss).toContain('visibility: visible');
  });

  it('neutraliza o overlay e o recorte de modais Radix na impressão', () => {
    expect(indexCss).toContain('dialog-overlay');
    expect(indexCss).toContain('dialog-content');
  });

  it('a guia SP/SADT de pré-faturamento está marcada como print-area', () => {
    const guia = readComponent('components/GuiaSPSADTPrefaturamento.tsx');
    expect(guia).toContain('print-area');
  });

  it('a guia de visualização está marcada como print-area', () => {
    const guiaVis = readComponent('components/GuiaVisualizacao.tsx');
    expect(guiaVis).toContain('print-area');
  });
});
