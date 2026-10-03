# Profissional executante — TISS 4.02.00

## Fonte oficial consultada

- Página ANS do padrão TISS: <https://www.gov.br/ans/pt-br/assuntos/prestadores/padrao-para-troca-de-informacao-de-saude-suplementar-2013-tiss/padrao-tiss-maio-2025>
- Arquivo oficial consultado: **Componente de Comunicação TISS 4.02.00**, XSD `tissGuiasV4_02_00.xsd` e `tissComplexTypesV4_02_00.xsd`.

## Estrutura confirmada

Na Guia SP/SADT, `dadosExecutante` aceita exclusivamente `contratadoExecutante` e `CNES`. Os dados completos de cada profissional que executou o procedimento devem ser emitidos como `equipeSadt` **dentro de `procedimentoExecutado`**, após `valorTotal`.

```xml
<ans:equipeSadt>
  <ans:grauPart>...</ans:grauPart>
  <ans:codProfissional>
    <ans:codigoPrestadorNaOperadora>...</ans:codigoPrestadorNaOperadora>
  </ans:codProfissional>
  <ans:nomeProf>...</ans:nomeProf>
  <ans:conselho>...</ans:conselho>
  <ans:numeroConselhoProfissional>...</ans:numeroConselhoProfissional>
  <ans:UF>...</ans:UF>
  <ans:CBOS>...</ans:CBOS>
</ans:equipeSadt>
```

Essa sequência corresponde ao tipo `ct_identEquipeSADT` e deve ser preservada para validação XSD.
