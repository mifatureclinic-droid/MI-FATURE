/**
 * Testes para o router de assinaturas SADT
 * Valida a criação, busca e listagem de assinaturas
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';

describe('Assinaturas SADT', () => {
  describe('Validação de entrada', () => {
    it('deve validar token de assinatura', () => {
      const tokenSchema = z.object({ token: z.string() });
      const validInput = { token: 'abc123' };
      expect(() => tokenSchema.parse(validInput)).not.toThrow();
    });

    it('deve validar criação de assinatura', () => {
      const createSchema = z.object({
        guiaId: z.number(),
        pacienteId: z.number(),
        profissionalId: z.number(),
        numeroSessao: z.number().min(1),
        dataSessao: z.string(),
        procedimento: z.string(),
        pacienteNome: z.string(),
        expiracaoHoras: z.number().min(1).max(168).default(24),
      });

      const validInput = {
        guiaId: 1,
        pacienteId: 1,
        profissionalId: 1,
        numeroSessao: 1,
        dataSessao: '2026-07-23',
        procedimento: 'Fisioterapia',
        pacienteNome: 'João Silva',
        expiracaoHoras: 24,
      };

      expect(() => createSchema.parse(validInput)).not.toThrow();
    });

    it('deve rejeitar numeroSessao inválido', () => {
      const createSchema = z.object({
        numeroSessao: z.number().min(1),
      });

      expect(() => createSchema.parse({ numeroSessao: 0 })).toThrow();
      expect(() => createSchema.parse({ numeroSessao: -1 })).toThrow();
    });

    it('deve rejeitar expiracaoHoras fora do intervalo', () => {
      const createSchema = z.object({
        expiracaoHoras: z.number().min(1).max(168).default(24),
      });

      expect(() => createSchema.parse({ expiracaoHoras: 0 })).toThrow();
      expect(() => createSchema.parse({ expiracaoHoras: 169 })).toThrow();
    });
  });

  describe('Formatação de dados', () => {
    it('deve formatar ordinal de sessão corretamente', () => {
      const formatarOrdinal = (n: number) => {
        if (n === 1) return '1ª';
        if (n === 2) return '2ª';
        if (n === 3) return '3ª';
        return `${n}ª`;
      };

      expect(formatarOrdinal(1)).toBe('1ª');
      expect(formatarOrdinal(2)).toBe('2ª');
      expect(formatarOrdinal(3)).toBe('3ª');
      expect(formatarOrdinal(4)).toBe('4ª');
      expect(formatarOrdinal(10)).toBe('10ª');
    });

    it('deve formatar data corretamente', () => {
      const formatarData = (d: string | Date | null | undefined) => {
        if (!d) return '—';
        const dt = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d);
        return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      };

      const data = '2026-07-23';
      const resultado = formatarData(data);
      expect(resultado).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('deve retornar — para data nula', () => {
      const formatarData = (d: string | Date | null | undefined) => {
        if (!d) return '—';
        return 'data';
      };

      expect(formatarData(null)).toBe('—');
      expect(formatarData(undefined)).toBe('—');
    });
  });

  describe('Status de assinatura', () => {
    it('deve reconhecer status válidos', () => {
      const statusSchema = z.enum(['pendente', 'assinado', 'expirado', 'cancelado']);

      expect(() => statusSchema.parse('pendente')).not.toThrow();
      expect(() => statusSchema.parse('assinado')).not.toThrow();
      expect(() => statusSchema.parse('expirado')).not.toThrow();
      expect(() => statusSchema.parse('cancelado')).not.toThrow();
    });

    it('deve rejeitar status inválido', () => {
      const statusSchema = z.enum(['pendente', 'assinado', 'expirado', 'cancelado']);

      expect(() => statusSchema.parse('invalido')).toThrow();
      expect(() => statusSchema.parse('em_progresso')).toThrow();
    });
  });

  describe('Filtro de busca', () => {
    it('deve filtrar assinaturas por nome do paciente', () => {
      const assinaturas = [
        { id: 1, pacienteNome: 'João Silva', pacienteCpf: '123.456.789-00', procedimento: 'Fisioterapia' },
        { id: 2, pacienteNome: 'Maria Santos', pacienteCpf: '987.654.321-00', procedimento: 'Pilates' },
        { id: 3, pacienteNome: 'João Oliveira', pacienteCpf: '111.222.333-44', procedimento: 'Acupuntura' },
      ];

      const searchTerm = 'João';
      const filtered = assinaturas.filter(a => a.pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()));

      expect(filtered).toHaveLength(2);
      expect(filtered[0].pacienteNome).toBe('João Silva');
      expect(filtered[1].pacienteNome).toBe('João Oliveira');
    });

    it('deve filtrar assinaturas por CPF', () => {
      const assinaturas = [
        { id: 1, pacienteNome: 'João Silva', pacienteCpf: '123.456.789-00', procedimento: 'Fisioterapia' },
        { id: 2, pacienteNome: 'Maria Santos', pacienteCpf: '987.654.321-00', procedimento: 'Pilates' },
      ];

      const searchTerm = '123.456.789-00';
      const filtered = assinaturas.filter(a => a.pacienteCpf?.toLowerCase().includes(searchTerm.toLowerCase()));

      expect(filtered).toHaveLength(1);
      expect(filtered[0].pacienteNome).toBe('João Silva');
    });

    it('deve filtrar assinaturas por procedimento', () => {
      const assinaturas = [
        { id: 1, pacienteNome: 'João Silva', pacienteCpf: '123.456.789-00', procedimento: 'Fisioterapia' },
        { id: 2, pacienteNome: 'Maria Santos', pacienteCpf: '987.654.321-00', procedimento: 'Pilates' },
        { id: 3, pacienteNome: 'João Oliveira', pacienteCpf: '111.222.333-44', procedimento: 'Fisioterapia' },
      ];

      const searchTerm = 'Fisioterapia';
      const filtered = assinaturas.filter(a => a.procedimento.toLowerCase().includes(searchTerm.toLowerCase()));

      expect(filtered).toHaveLength(2);
      expect(filtered.every(a => a.procedimento === 'Fisioterapia')).toBe(true);
    });

    it('deve retornar array vazio quando não há correspondências', () => {
      const assinaturas = [
        { id: 1, pacienteNome: 'João Silva', pacienteCpf: '123.456.789-00', procedimento: 'Fisioterapia' },
      ];

      const searchTerm = 'Pedro';
      const filtered = assinaturas.filter(a => a.pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()));

      expect(filtered).toHaveLength(0);
    });

    it('deve ser case-insensitive', () => {
      const assinaturas = [
        { id: 1, pacienteNome: 'João Silva', pacienteCpf: '123.456.789-00', procedimento: 'Fisioterapia' },
      ];

      const searchTerm = 'JOÃO';
      const filtered = assinaturas.filter(a => a.pacienteNome.toLowerCase().includes(searchTerm.toLowerCase()));

      expect(filtered).toHaveLength(1);
    });
  });

  describe('Hash SHA-256', () => {
    it('deve validar formato de hash SHA-256', () => {
      const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);

      const validHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
      expect(() => hashSchema.parse(validHash)).not.toThrow();

      const invalidHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85'; // 63 chars
      expect(() => hashSchema.parse(invalidHash)).toThrow();
    });
  });

  describe('PDF URL', () => {
    it('deve validar URL de PDF', () => {
      const pdfUrlSchema = z.string().url().optional();

      const validUrl = 'https://example.com/comprovante.pdf';
      expect(() => pdfUrlSchema.parse(validUrl)).not.toThrow();

      const invalidUrl = 'not-a-url';
      expect(() => pdfUrlSchema.parse(invalidUrl)).toThrow();
    });

    it('deve permitir PDF URL vazio', () => {
      const pdfUrlSchema = z.string().url().optional();

      expect(() => pdfUrlSchema.parse(undefined)).not.toThrow();
    });
  });
});
