# Execução assistida Bradesco — decisão de arquitetura

## Estado observado no piloto

O piloto da guia SADT do Theo foi concluído pelo Portal do Referenciado com confirmação humana antes da transmissão. O portal exige autenticação de pessoa jurídica e pode solicitar reCAPTCHA; a sessão também expira em pouco tempo. Esses mecanismos exigem que o desafio de segurança seja resolvido pela pessoa usuária, sem tentativa de contorno automatizado.

O retorno foi gravado no sistema como `enviado_portal`, com protocolo de acompanhamento, sem antecipar uma autorização definitiva. A análise posterior é necessária porque a Bradesco informa que certas solicitações dependem de avaliação médica e administrativa e podem ser negadas por documentação incompleta, carência ou pertinência técnica.[1]

## Decisão da clínica

A clínica escolheu a **execução assistida sob demanda**. Portanto, uma guia pronta só será aberta no Portal do Referenciado quando houver uma pessoa disponível para resolver eventuais desafios de autenticação e confirmar a transmissão. O sistema continua responsável por preparar a fila, preencher os dados validados, anexar o encaminhamento e registrar o retorno oficial na guia de série.

## Alternativas para as próximas guias

| Alternativa | Funcionamento | Vantagens | Limites |
| --- | --- | --- | --- |
| Execução assistida sob demanda | A usuária abre uma sessão, resolve login/reCAPTCHA quando solicitado e o sistema preenche, anexa e pausa para confirmação de envio. | Mantém controle humano, não exige serviço contínuo e já foi validada no piloto. | Depende de uma sessão aberta e de acompanhamento pontual. |
| Executor persistente com fila | Uma fila segura coordena as guias prontas e mantém um navegador dedicado; a usuária só é chamada para reCAPTCHA, expiração de sessão e confirmação de transmissão. | Reduz trabalho repetitivo ao processar diversas guias elegíveis e registra cada etapa. | Requer infraestrutura contínua e aprovação de custo; o reCAPTCHA permanece humano. |

## Requisitos inegociáveis

1. A automação não deve tentar resolver, terceirizar ou contornar reCAPTCHA.
2. A transmissão deve continuar exigindo confirmação humana explícita por guia.
3. O protocolo representa solicitação em análise, não autorização final; senha, validade e sessões autorizadas só podem ser gravadas quando o portal efetivamente as devolver.
4. A execução deve continuar limitada a guias Bradesco de setembro de 2026 até nova decisão da clínica. Guias de agosto não podem ser alteradas.

## Referências

[1] [Bradesco Saúde — Autorização de Procedimentos Médicos](https://www.bradescoseguros.com.br/clientes/produtos/plano-saude/autorizacao-procedimentos-medicos)
