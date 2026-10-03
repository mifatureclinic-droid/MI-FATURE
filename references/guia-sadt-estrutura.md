# Estrutura da Guia SADT (SP/SADT)

## O que é Guia SADT?

A Guia SADT (Serviço Auxiliar de Diagnóstico e Terapia) ou SP/SADT (Serviço Profissional / Serviço Auxiliar de Diagnóstico e Terapia) é um documento padronizado pela ANS (Agência Nacional de Saúde Suplementar) utilizado para:

- Registrar solicitação de procedimentos diagnósticos e terapêuticos
- Obter autorização de operadoras de saúde
- Faturar serviços realizados
- Garantir reembolso adequado

## Padrão TISS

A guia segue o padrão TISS (Troca de Informações na Saúde Suplementar), um modelo que padroniza a comunicação entre prestadores de serviços de saúde e operadoras de planos.

## Seções Principais da Guia SADT

### 1. Dados do Beneficiário
- Número da carteira/CPF
- Nome completo
- Data de nascimento
- Sexo
- Validade da carteira

### 2. Dados do Convênio
- Nome da operadora
- Código ANS (Registro ANS)
- Número do plano
- Cobertura do procedimento

### 3. Dados do Profissional Solicitante
- Nome completo
- Conselho profissional (CRM, CREF, etc.)
- Número de registro no conselho
- Especialidade
- Assinatura

### 4. Autorização/Procedimento
- Número de autorização (se necessário)
- Data de autorização
- Validade da autorização
- Senha de autorização (se aplicável)

### 5. Data e Hora do Atendimento
- Data do atendimento
- Hora do atendimento
- Tipo de atendimento (consulta, exame, terapia, etc.)
- Forma de atendimento (presencial, telemedicina, etc.)

### 6. Procedimento/Serviço
- Código TUSS (Tabela de Procedimentos - Saúde Suplementar)
- Descrição do procedimento
- Quantidade
- Valor unitário
- Desconto (se houver)
- Valor total

### 7. Diagnóstico
- CID-10 (Classificação Internacional de Doenças)
- Descrição do diagnóstico
- Indicação clínica

### 8. Resumo de Valores
- Valor total do procedimento
- Descontos aplicáveis
- Valor líquido a faturar

### 9. Observações
- Informações adicionais relevantes
- Justificativas clínicas
- Referências a laudos ou resultados

### 10. Dados de Faturamento
- Data de faturamento
- Número da guia
- Identificação do atendimento
- Código do atendimento

## Campos Obrigatórios

- Número da carteira do paciente
- Nome do paciente
- Data de nascimento
- Código ANS da operadora
- Nome da operadora
- Procedimento/código TUSS
- Data do atendimento
- Profissional solicitante
- CID (diagnóstico)
- Valores
- Assinatura do profissional

## Campos Condicionais

Alguns campos são obrigatórios apenas em determinadas situações:
- Número de autorização (quando exigido pela operadora)
- Senha de autorização (quando exigida)
- Número da guia principal (em casos de SADT em pacientes internados)

## Erros Comuns a Evitar

1. **Omissão de campos obrigatórios** - Causa principal de glosas
2. **Datas inconsistentes** - Solicitação com data futura ou execução anterior à autorização
3. **Código TUSS incorreto** - Usar tabela errada ou código inexistente
4. **Guia duplicada** - Número repetido causa rejeição por duplicidade
5. **Falta de vínculo entre guias** - Em casos de internação ou tratamentos contínuos
6. **Ausência de laudo** - Algumas operadoras exigem laudo anexado
7. **Faturamento em atraso** - Não enviar no prazo definido pela operadora
8. **Erros de digitação** - Um caractere fora de lugar pode inviabilizar o envio

## Fluxo de Processamento

1. **Solicitação médica** - Médico identifica necessidade e prescreve
2. **Registro de dados** - Informações do paciente e procedimento são registradas
3. **Autorização prévia** - Guia é enviada para operadora (quando necessário)
4. **Agendamento** - Procedimento é agendado após aprovação
5. **Realização** - Serviço é executado conforme agendado
6. **Faturamento** - Guia é finalizada e enviada para reembolso

## Tipos de Procedimentos SADT

- Exames laboratoriais
- Procedimentos de imagem (tomografia, ultrassom, ressonância)
- Terapias (fisioterapia, fonoaudiologia, psicologia)
- Hemodiálise
- Diálise peritoneal
- Outros procedimentos diagnósticos e terapêuticos

## Conformidade Legal

- Seguir padrão TISS aprovado pela ANS
- Manter atualização de versões TISS
- Garantir confidencialidade e segurança dos dados (LGPD)
- Permitir rastreabilidade com assinaturas eletrônicas
- Respeitar prazos de apresentação e contestação
- Associar laudos e resultados quando exigido

## Integração com Sistema de Gestão

Um sistema de gestão médica eficiente deve:
- Validar campos obrigatórios automaticamente
- Integrar com tabelas TUSS/CBHPM atualizadas
- Verificar autorizações e bloqueios por operadora
- Associar procedimentos realizados às guias
- Gerar relatórios de status das guias
- Facilitar envio eletrônico para operadoras
- Rastrear glosas e retrabalho
- Manter histórico completo de cada guia
