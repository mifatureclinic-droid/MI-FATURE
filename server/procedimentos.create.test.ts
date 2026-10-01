import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('Procedimentos Create', () => {
  let testConvenioId: number;

  beforeAll(async () => {
    // Create a test convenio
    const uniqueCnpj = `${Date.now().toString().slice(-8)}.0000-00`;
    const result = await db.createConvenio({
      nome: 'Convênio Teste',
      cnpj: uniqueCnpj,
      codigoOperadora: '123456',
      email: 'convenio@test.com',
      telefone: '1133334444',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
    });
    
    testConvenioId = (result as any).insertId || 1;
  });

  it('should create procedimento with required fields only', async () => {
    const result = await db.createProcedimentoConvenio({
      convenioId: testConvenioId,
      tabelaProcedimentoId: 1,
      valor: '150.00',
    });

    expect(result).toBeDefined();
  });

  it('should create procedimento with all optional fields', async () => {
    const result = await db.createProcedimentoConvenio({
      convenioId: testConvenioId,
      tabelaProcedimentoId: 1,
      codigoConvenio: 'PROC001',
      descricaoConvenio: 'Procedimento de Teste',
      valor: '250.50',
      valorMinimo: '200.00',
      valorMaximo: '300.00',
    });

    expect(result).toBeDefined();
  });

  it('should create procedimento with partial optional fields', async () => {
    const result = await db.createProcedimentoConvenio({
      convenioId: testConvenioId,
      tabelaProcedimentoId: 1,
      codigoConvenio: 'PROC002',
      valor: '175.75',
    });

    expect(result).toBeDefined();
  });

  it('should retrieve procedimentos by convenio', async () => {
    const procedimentos = await db.getProcedimentosPorConvenio(testConvenioId);
    
    expect(Array.isArray(procedimentos)).toBe(true);
    expect(procedimentos.length).toBeGreaterThan(0);
  });
});
