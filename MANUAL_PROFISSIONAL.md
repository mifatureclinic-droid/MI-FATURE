# Manual Operacional do Profissional — Portal MIFATURE

## 1. Introdução e Acesso ao Sistema

O portal **Mifature** é a plataforma integrada de gestão clínica, agendamentos, prontuários eletrônicos e controle de repasses financeiros, desenvolvida para assegurar conformidade com as diretrizes da ANS (TISS 4.02.00) e otimizar a rotina assistencial.

Ao realizar o login no sistema utilizando as credenciais institucionais fornecidas pela administração, o profissional é redirecionado automaticamente para a **Agenda do Dia**, garantindo acesso imediato aos atendimentos programados [1]. O painel inicial do profissional exibe uma saudação personalizada contendo o nome e o total de consultas agendadas para a data corrente.

---

## 2. Visão Geral da Agenda e Identificação de Status

A interface da agenda foi projetada para permitir o monitoramento visual rápido do fluxo de atendimento e do estado operacional de cada sessão. Cada card de agendamento exibe indicadores codificados por cor e etiquetas informativas que facilitam a tomada de decisão pela equipe clínica e de recepção.

### Tabela de Cores e Estados dos Agendamentos

| Status do Atendimento | Cor de Fundo / Indicador | Descrição Operacional |
| :--- | :--- | :--- |
| **Aguardando** | Azul | O paciente compareceu à clínica e aguarda o chamamento na sala de espera. |
| **Atendido** | Verde | A sessão foi realizada pelo profissional. Dispara automaticamente o fluxo para o repasse. |
| **Faltou** | Vermelho | O paciente não compareceu à sessão agendada. Se houver 2 faltas consecutivas, o sistema dispara um alerta preventivo. |
| **Cancelado** | Tom Neutro / Cinza | O agendamento foi cancelado previamente por solicitação do paciente ou da clínica. |
| **Assinado** | Ícone Roxo / Badge Verde | Indica que a guia/sessão possui assinatura digital válida registrada pelo paciente para o respectivo dia. |

---

## 3. Gestão de Prontuários Eletrônicos e Vinculação de Datas

O preenchimento do prontuário é uma etapa obrigatória e constitui pré-requisito para o cálculo e liberação do repasse financeiro do profissional.

### 3.1. Acesso ao Prontuário do Paciente
1. Na agenda do dia, localize o paciente atendido e acesse o menu de ações do agendamento.
2. O sistema filtra automaticamente o tipo de prontuário de acordo com a especialidade vinculada ao cadastro do profissional (por exemplo, profissionais de psicologia visualizam exclusivamente o prontuário psicológico) [2].
3. O botão de preenchimento de prontuário permanece visível apenas para os atendimentos pendentes de registro, sendo ocultado automaticamente após a conclusão da evolução clínica.

### 3.2. Vinculação com a Data do Atendimento
* Ao abrir o formulário de prontuário, o sistema preenche e vincula a evolução clínica à **data exata do atendimento** agendado, assegurando a rastreabilidade cronológica e impedindo divergências de faturamento [3].
* O profissional pode revisar os dados históricos de atendimentos anteriores do paciente por meio do botão **Visualizar**, que exibe um modal consolidado com queixa, diagnóstico, tratamento e observações restritas às evoluções registradas por sua especialidade.

---

## 4. Integração com Faturamento e Repasses Financeiros

O sistema Mifature integra o atendimento clínico diretamente ao módulo financeiro e de faturamento TISS, garantindo transparência nos repasses aos profissionais.

* **Cálculo por Sessão Realizada**: O valor do repasse é calculado por sessão concluída, respeitando os percentuais cadastrados (por exemplo, repasses específicos para convênios e para pacientes particulares).
* **Fluxo de Conclusão**: Assim que o profissional finaliza o prontuário do atendimento, o sistema atualiza o status para "Atendido" e encaminha automaticamente o registro para o fechamento de repasse, sem necessidade de intervenções manuais complexas.
* **Convênios Especiais**: Para convênios específicos que dispensam assinatura digital (conforme regras contratuais configuradas pela administração), o fluxo de prontuário e repasse ocorre de forma otimizada, garantindo que o profissional seja remunerado pontualmente.

---

## 5. Alertas Importantes e Diretrizes de Conduta

1. **Contrato Terapêutico e Faltas Consecutivas**: Caso um paciente registre **2 faltas consecutivas** no período de 30 dias, o sistema gera um alerta visual imediato para o master e a recepção, sugerindo o envio de uma mensagem padronizada via WhatsApp para avaliação da continuidade do tratamento.
2. **Exclusão de Registros**: Por questões de segurança e conformidade normativa, **apenas o usuário administrador (Master)** possui permissão para excluir prontuários ou guias de atendimento do sistema.
3. **Rastreabilidade**: Todas as movimentações na agenda, emissões de guias e edições de prontuários registram o carimbo de tempo e o identificador do usuário responsável, garantindo total auditoria interna.

---

## Referências

[1] MIFATURE Portal de Gestão em Saúde. *Módulo de Agenda Inteligente e Faturamento TISS 4.02.00*. Disponível em: Sistema Interno de Gestão, 2026.  
[2] MIFATURE Portal de Gestão em Saúde. *Configuração de Especialidades e Prontuários Clínicos*. Disponível em: Sistema Interno de Gestão, 2026.  
[3] MIFATURE Portal de Gestão em Saúde. *Regras de Validação Cronológica e Fuso Horário (Manaus UTC-4)*. Disponível em: Sistema Interno de Gestão, 2026.
