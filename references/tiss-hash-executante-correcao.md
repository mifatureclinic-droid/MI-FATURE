# Correção de executante e hash TISS

## Estrutura do executante

O retorno do validador Bradesco de 20/08/2026 rejeitou `nomeContratadoExecutante` e, depois, `profissionalExecutante` dentro de `dadosExecutante`. O XSD oficial TISS 4.02.00 define somente `contratadoExecutante` e `CNES` nesse bloco da Guia SP/SADT.

- ANS — [Padrão TISS, maio de 2025](https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/padrao-tiss-maio-2025), consultado em 20/08/2026.

## Integridade do hash

O hash MD5 do epílogo deve ser calculado pela concatenação dos textos dos elementos-folha, em ordem de documento, codificada em UTF-8. Espaços que pertencem a valores são preservados; nomes de tags e atributos não integram o digest.

- Referência técnica: [TISS_ANS_hash — especificação](https://github.com/petrinhu/TISS_ANS_hash/blob/main/docs/SPEC.md), consultada em 20/08/2026.

## Tipo de atendimento

O XSD TISS 4.02.00 não admite o código legado `05` em `dm_tipoAtendimento`. Para preservar a classificação de exame da guia existente, o gerador normaliza esse valor para `23`, código válido de Exame na Tabela 50 da ANS.

- ANS — [Tabela 50 — Tipo de atendimento](https://fhir-hm.ans.gov.br/CodeSystem-tuss-50.html), consultada em 20/08/2026.
