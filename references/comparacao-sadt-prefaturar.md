# Comparação: Estrutura SADT vs Campos do Prefaturar

## Análise de Campos

### 1. Dados do Beneficiário

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Número da carteira | numeroCarteira | ✅ Implementado |
| Nome completo | nomeBeneficiario | ✅ Implementado |
| Data de nascimento | dataNascimento | ✅ Implementado |
| Sexo | sexo | ✅ Implementado |
| Validade da carteira | ❌ FALTANDO | ❌ Não implementado |
| CPF | ❌ FALTANDO | ❌ Não implementado |

### 2. Dados do Convênio

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Nome da operadora | nomeConvenio | ✅ Implementado |
| Código ANS | codigoANS | ✅ Implementado |
| Número do plano | ❌ FALTANDO | ❌ Não implementado |
| Cobertura do procedimento | ❌ FALTANDO | ❌ Não implementado |

### 3. Dados do Profissional Solicitante

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Nome completo | nomeProfissional | ✅ Implementado |
| Conselho profissional | conselhoProfissional | ✅ Implementado |
| Número de registro | registroProfissional | ✅ Implementado |
| Especialidade | especialidade | ✅ Implementado |
| Assinatura | ❌ FALTANDO | ❌ Não implementado |

### 4. Autorização/Procedimento

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Número de autorização | numeroAutorizacao | ✅ Implementado |
| Data de autorização | dataAutorizacao | ✅ Implementado |
| Validade da autorização | validadeAutorizacao | ✅ Implementado |
| Senha de autorização | ❌ FALTANDO | ❌ Não implementado |

### 5. Data e Hora do Atendimento

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Data do atendimento | dataAtendimento | ✅ Implementado |
| Hora do atendimento | horaAtendimento | ✅ Implementado |
| Tipo de atendimento | tipoAtendimento | ✅ Implementado |
| Forma de atendimento | forma | ✅ Implementado |
| Acesso | acesso | ✅ Implementado |

### 6. Procedimento/Serviço

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Código TUSS | codigoTUSS | ✅ Implementado |
| Descrição do procedimento | descricaoProcedimento | ✅ Implementado |
| Quantidade | quantidade | ✅ Implementado |
| Valor unitário | valorUnitario | ✅ Implementado |
| Desconto | desconto | ✅ Implementado |
| Valor total | valorTotal | ✅ Implementado |

### 7. Diagnóstico

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| CID-10 | cid | ✅ Implementado |
| Descrição do diagnóstico | descricaoDiagnostico | ✅ Implementado |
| Indicação clínica | ❌ FALTANDO | ❌ Não implementado |

### 8. Resumo de Valores

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Valor total | valorTotal | ✅ Implementado |
| Descontos | desconto | ✅ Implementado |
| Valor líquido | valorLiquido | ✅ Implementado |

### 9. Observações

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Observações adicionais | observacoes | ✅ Implementado |
| Justificativas clínicas | ❌ FALTANDO | ❌ Não implementado |

### 10. Dados de Faturamento

| Campo SADT | Campo Prefaturar | Status |
|---|---|---|
| Data de faturamento | dataFaturamento | ✅ Implementado |
| Número da guia | numeroGuia | ✅ Implementado |
| Código do atendimento | codigoAtendimento | ✅ Implementado |

## Campos Faltando (Críticos)

1. **Validade da carteira** - Data de validade do plano de saúde
2. **CPF do paciente** - Identificação fiscal
3. **Número do plano** - Identificação do plano específico
4. **Cobertura do procedimento** - Verificação de cobertura
5. **Assinatura do profissional** - Comprovação legal
6. **Senha de autorização** - Validação de autorização
7. **Indicação clínica** - Justificativa médica
8. **Justificativas clínicas** - Detalhes adicionais

## Campos Faltando (Opcionais)

1. **Profissional executante** - Quem realizou o procedimento
2. **Local de execução** - Onde foi realizado
3. **Resultado/Laudo** - Resultado do procedimento
4. **Referência a laudo** - Link para laudo externo
5. **Guia principal** - Para casos de internação
6. **Observações do paciente** - Informações do paciente
7. **Informações de contato** - Telefone, email

## Recomendações

### Campos Essenciais a Adicionar

1. **Validade da Carteira** - Campo de data obrigatório
2. **CPF do Paciente** - Campo de texto obrigatório
3. **Assinatura Digital** - Campo para captura de assinatura
4. **Indicação Clínica** - Campo de texto obrigatório
5. **Senha de Autorização** - Campo de texto obrigatório

### Campos Recomendados a Adicionar

1. **Número do Plano** - Campo de texto
2. **Profissional Executante** - Select de profissionais
3. **Local de Execução** - Select de locais
4. **Resultado/Laudo** - Campo de texto ou upload
5. **Guia Principal** - Select para casos relacionados

## Impacto da Implementação

- **Conformidade TISS**: Aumentará de 70% para 95%
- **Redução de Glosas**: Campos obrigatórios reduzem rejeições
- **Rastreabilidade**: Assinatura digital e indicação clínica
- **Qualidade**: Mais informações para validação

## Prioridade de Implementação

1. **Alta**: Validade da carteira, CPF, Indicação clínica, Assinatura
2. **Média**: Número do plano, Profissional executante, Senha de autorização
3. **Baixa**: Local de execução, Resultado/Laudo, Guia principal
