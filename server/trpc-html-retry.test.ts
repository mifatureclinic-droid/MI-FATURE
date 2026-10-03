import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('cliente tRPC — resposta HTML inesperada', () => {
  it('tenta novamente antes de interpretar HTML como JSON', () => {
    const main = readFileSync(resolve(process.cwd(), 'client/src/main.tsx'), 'utf8');
    expect(main).toContain('contentType.includes("text/html") && attempt < retries - 1');
    expect(main).toContain('respondeu HTML em vez de JSON');
  });
});
