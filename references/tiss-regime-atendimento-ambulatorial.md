# Regime de atendimento — referência TISS

## Fonte primária consultada

- ANS — [Padrão TISS, maio de 2025](https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/padrao-tiss-maio-2025), consultado em 20/08/2026.

A ANS indica que o componente de **Representação de Conceitos em Saúde** consolida os termos TUSS usados nas mensagens TISS e disponibiliza o respectivo arquivo oficial de terminologias.

## Confirmação do código

No catálogo da ANS, a **Tabela 76 — Regime de atendimento** relaciona o código **`01`** a **Ambulatorial**. O XML TISS deve, portanto, emitir `<ans:regimeAtendimento>01</ans:regimeAtendimento>` para as guias ambulatoriais da CLÍNICA CLIPSI.

- ANS — [Tabela 76 — Regime de atendimento](https://fhir-hm.ans.gov.br/CodeSystem-tuss-76.html), consultada em 20/08/2026.
