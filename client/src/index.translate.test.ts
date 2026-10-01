import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

describe('documento raiz do portal', () => {
  it('protege a árvore React contra traduções automáticas que alteram o DOM', () => {
    expect(html).toContain('<meta name="google" content="notranslate" />');
    expect(html).toContain('<html lang="pt-BR" translate="no" class="notranslate">');
    expect(html).toContain('<div id="root" class="notranslate" translate="no"></div>');
  });
});
