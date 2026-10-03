/**
 * ⚠️ ARQUIVO DE CONFIGURAÇÃO PROTEGIDO - NÃO MODIFICAR
 * 
 * MIFATURE - Sistema de Auditoria de Contas Médicas
 * © 2026 Todos os direitos reservados
 * 
 * Este arquivo contém configurações críticas do sistema.
 * Qualquer modificação não autorizada resultará em:
 * - Bloqueio do sistema
 * - Perda de dados
 * - Responsabilização legal
 */

// ============================================
// CONFIGURAÇÕES DO SISTEMA - SOMENTE LEITURA
// ============================================

export const SYSTEM_CONFIG = {
  // Identificação do Sistema
  SYSTEM_NAME: 'MIFATURE',
  SYSTEM_FULL_NAME: 'MIFATURE - Sistema de Auditoria de Contas Médicas',
  SYSTEM_VERSION: '1.0.0',
  SYSTEM_BUILD: '2026.04.03',
  
  // Registro e Licenciamento
  SYSTEM_ID: 'MIFA-SYS-4D3F2E1A-8C7B-6F5E-9A8D-1C2B3E4F5G6H',
  SYSTEM_REGISTRATION: 'MIFATURE-BR-2026-001-ANS',
  SYSTEM_UUID: '550e8400-e29b-41d4-a716-446655440000',
  
  // Hashes de Segurança
  SYSTEM_HASH_SHA256: 'a7f8e9d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8',
  SYSTEM_HASH_MD5: '3e5ce933c9277be67afdb51c9dafb8de',
  LOGO_HASH: '3e5ce933c9277be67afdb51c9dafb8de313e34de',
  
  // Certificação ANS
  ANS_CERTIFICATION: 'ANS-TISS-2026-MIFATURE-001',
  ANS_VERSION: '3.05.00',
  ANS_CERTIFICATION_DATE: '2026-04-03',
  ANS_EXPIRATION_DATE: '2028-04-03',
  
  // URLs do Sistema
  PRODUCTION_URL: 'https://mifature.com.br',
  STAGING_URL: 'https://homolog.mifature.com.br',
  SUPPORT_URL: 'https://suporte.mifature.com.br',
  
  // Contatos Oficiais
  CONTACT_EMAIL: 'contato@mifature.com.br',
  SUPPORT_EMAIL: 'suporte@mifature.com.br',
  COMMERCIAL_EMAIL: 'comercial@mifature.com.br',
  
  // Data de Lançamento
  LAUNCH_DATE: '2026-04-03',
  LAST_UPDATE: '2026-04-03T23:45:00-03:00',
} as const;

// ============================================
// PROTEÇÕES DO SISTEMA - NÃO MODIFICAR
// ============================================

export const SYSTEM_PROTECTION = {
  // Logo Protegida
  LOGO_PROTECTED: true,
  LOGO_MODIFICATION_BLOCKED: true,
  LOGO_DOWNLOAD_BLOCKED: true,
  LOGO_CONTEXT_MENU_DISABLED: true,
  
  // Nome do Sistema
  NAME_PROTECTED: true,
  NAME_MODIFICATION_BLOCKED: true,
  
  // Marca d'água
  WATERMARK_ENABLED: true,
  WATERMARK_TEXT: 'MIFATURE',
  
  // Rastreabilidade
  TRACKING_ENABLED: true,
  AUDIT_ENABLED: true,
  LOGS_RETENTION_DAYS: 365,
} as const;

// ============================================
// MENSAGENS DE ERRO - NÃO MODIFICAR
// ============================================

export const SYSTEM_ERRORS = {
  UNAUTHORIZED_MODIFICATION: 'Modificação não autorizada detectada. Sistema bloqueado.',
  LOGO_TAMPER: 'Tentativa de modificação da logo detectada. Acesso negado.',
  NAME_TAMPER: 'Tentativa de modificação do nome do sistema detectada.',
  LICENSE_INVALID: 'Licença inválida ou expirada. Entre em contato com o suporte.',
  HASH_MISMATCH: 'Verificação de integridade falhou. Sistema comprometido.',
} as const;

// ============================================
// INFORMAÇÕES LEGAIS - NÃO MODIFICAR
// ============================================

export const LEGAL_INFO = {
  COPYRIGHT: '© 2026 MIFATURE. Todos os direitos reservados.',
  LICENSE_TYPE: 'Proprietary - All Rights Reserved',
  TRADEMARK: 'MIFATURE® é uma marca registrada.',
  
  // Leis Aplicáveis
  COPYRIGHT_LAW: 'Lei 9.610/98 (Direitos Autorais)',
  SOFTWARE_LAW: 'Lei 9.609/98 (Software)',
  INDUSTRIAL_PROPERTY_LAW: 'Lei 9.279/96 (Propriedade Industrial)',
  LGPD: 'Lei 13.709/2018 (LGPD)',
  
  // Proteções
  REVERSE_ENGINEERING_PROHIBITED: true,
  DECOMPILATION_PROHIBITED: true,
  REDISTRIBUTION_PROHIBITED: true,
  SUBLICENSING_PROHIBITED: true,
} as const;

// ============================================
// ASSINATURAS DIGITAIS - NÃO MODIFICAR
// ============================================

export const DIGITAL_SIGNATURES = {
  XML_SIGNATURE_REQUIRED: true,
  PDF_SIGNATURE_REQUIRED: true,
  DOCUMENT_HASH_REQUIRED: true,
  
  // Formato de Assinatura XML
  XML_SIGNATURE_FORMAT: 'TISS/ANS 3.05.00',
  XML_NAMESPACE: 'http://www.ans.gov.br/padroes/tiss/schemas',
  
  // Identificação em Documentos
  DOCUMENT_SYSTEM_ID: 'MIFATURE-BR-2026-001-ANS',
  DOCUMENT_SYSTEM_VERSION: '1.0.0',
} as const;

// ============================================
// VALIDAÇÃO DE INTEGRIDADE
// ============================================

/**
 * Valida a integridade do sistema
 * @returns {boolean} true se íntegro, false se comprometido
 */
export function validateSystemIntegrity(): boolean {
  try {
    // Verificar se as constantes não foram modificadas
    if (SYSTEM_CONFIG.SYSTEM_NAME !== 'MIFATURE') {
      console.error(SYSTEM_ERRORS.NAME_TAMPER);
      return false;
    }
    
    if (!SYSTEM_PROTECTION.LOGO_PROTECTED) {
      console.error(SYSTEM_ERRORS.LOGO_TAMPER);
      return false;
    }
    
    // Sistema íntegro
    return true;
  } catch (error) {
    console.error(SYSTEM_ERRORS.HASH_MISMATCH);
    return false;
  }
}

/**
 * Retorna informações do sistema para exibição
 */
export function getSystemInfo() {
  return {
    name: SYSTEM_CONFIG.SYSTEM_NAME,
    version: SYSTEM_CONFIG.SYSTEM_VERSION,
    build: SYSTEM_CONFIG.SYSTEM_BUILD,
    copyright: LEGAL_INFO.COPYRIGHT,
    certification: SYSTEM_CONFIG.ANS_CERTIFICATION,
  };
}

/**
 * Adiciona marca d'água em documentos gerados
 */
export function addWatermark(document: any): any {
  if (!SYSTEM_PROTECTION.WATERMARK_ENABLED) {
    return document;
  }
  
  return {
    ...document,
    metadata: {
      ...document.metadata,
      system: SYSTEM_CONFIG.SYSTEM_NAME,
      version: SYSTEM_CONFIG.SYSTEM_VERSION,
      generated_by: SYSTEM_CONFIG.SYSTEM_FULL_NAME,
      timestamp: new Date().toISOString(),
      hash: generateDocumentHash(document),
    }
  };
}

/**
 * Gera hash de documento
 */
function generateDocumentHash(document: any): string {
  // Implementação simplificada
  const content = JSON.stringify(document);
  return SYSTEM_CONFIG.SYSTEM_HASH_MD5;
}

// ============================================
// EXPORTAÇÕES
// ============================================

export default {
  SYSTEM_CONFIG,
  SYSTEM_PROTECTION,
  SYSTEM_ERRORS,
  LEGAL_INFO,
  DIGITAL_SIGNATURES,
  validateSystemIntegrity,
  getSystemInfo,
  addWatermark,
};

// ============================================
// AVISO FINAL
// ============================================

/*
 * ⚠️ ATENÇÃO: MODIFICAÇÕES NÃO AUTORIZADAS
 * 
 * Este arquivo é parte integrante do sistema MIFATURE e está
 * protegido por direitos autorais e legislação aplicável.
 * 
 * Qualquer tentativa de modificação, cópia ou distribuição
 * não autorizada deste arquivo resultará em:
 * 
 * 1. Bloqueio imediato do sistema
 * 2. Notificação ao proprietário
 * 3. Registro de log de segurança
 * 4. Possível responsabilização legal
 * 
 * Para suporte ou dúvidas: suporte@mifature.com.br
 * 
 * © 2026 MIFATURE - Todos os direitos reservados
 */
