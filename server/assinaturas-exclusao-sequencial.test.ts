import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const fonteDb = readFileSync(new URL('./db.ts', import.meta.url), 'utf8');

describe('exclusão sequencial de assinaturas', () => {
  it('não mantém transação aberta nas exclusões legada e SADT', () => {
    const legada = fonteDb.slice(fonteDb.indexOf('export async function excluirAssinaturaGuia'), fonteDb.indexOf('export async function duplicarAssinaturaGuiaParaData'));
    const sadt = fonteDb.slice(fonteDb.indexOf('export async function excluirAssinaturaSadt'), fonteDb.indexOf('export async function editarDataAssinaturaGuia'));
    expect(legada).not.toContain('db.transaction');
    expect(sadt).not.toContain('db.transaction');
    expect(legada).toContain('const tx = db;');
    expect(sadt).toContain('const tx = db;');
  });
});
