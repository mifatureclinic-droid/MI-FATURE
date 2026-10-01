# Referência TISS/ANS — Geração de XML e Guia SP/SADT

## O que é o TISS
TISS (Troca de Informações na Saúde Suplementar) é o padrão obrigatório criado pela ANS (RN 305/2012) para padronizar a comunicação eletrônica entre prestadores (clínicas, hospitais) e operadoras (planos de saúde). O faturamento é enviado em arquivos **XML**, agrupados em **lotes** de guias.

## Versões
- Versão obrigatória atual amplamente adotada: **4.01.00** (algumas operadoras já usam 4.03.00).
- Encoding: a maioria das operadoras exige **ISO-8859-1**; algumas versões novas aceitam UTF-8.
- Neste projeto adotaremos a versão **4.01.00** e encoding **ISO-8859-1** como padrão configurável.

## Tipos de guia
- **Guia de Consulta**: consultas eletivas sem procedimento.
- **Guia SP/SADT** (Serviço Profissional / Serviço Auxiliar de Diagnóstico e Terapia): exames, terapias, pequenas cirurgias, consulta com procedimento, atendimento domiciliar etc. **É a guia deste projeto.**
- Guia de Solicitação de Internação, Resumo de Internação, Honorário Individual, Outras Despesas.

## Anatomia do XML TISS (4 grandes blocos)
1. **Cabeçalho (`ans:cabecalho`)** — identificação da transação (tipo, sequencial, data/hora), origem (prestador) e destino (registro ANS da operadora), versão do padrão.
2. **Prestador para operadora (`ans:prestadorParaOperadora`)** — contém o `loteGuias` com `numeroLote` e uma ou mais guias.
3. **Guias** — dentro do lote, cada `guiaSP-SADT` com dados do beneficiário, contratado/executante, procedimentos executados (TUSS), valores.
4. **Epílogo (`ans:epilogo`)** — `hash` (MD5) calculado sobre a concatenação do CONTEÚDO das tags (sem as tags em si). Qualquer alteração posterior invalida o hash.

## Estrutura simplificada (namespace ans:)
```
<ans:mensagemTISS xmlns:ans="http://www.ans.gov.br/padroes/tiss/schemas" ...>
  <ans:cabecalho>
    <ans:identificacaoTransacao>
      <ans:tipoTransacao>ENVIO_LOTE_GUIAS</ans:tipoTransacao>
      <ans:sequencialTransacao>...</ans:sequencialTransacao>
      <ans:dataRegistroTransacao>AAAA-MM-DD</ans:dataRegistroTransacao>
      <ans:horaRegistroTransacao>HH:MM:SS</ans:horaRegistroTransacao>
    </ans:identificacaoTransacao>
    <ans:origem>
      <ans:identificacaoPrestador>
        <ans:codigoPrestadorNaOperadora>...</ans:codigoPrestadorNaOperadora>
      </ans:identificacaoPrestador>
    </ans:origem>
    <ans:destino>
      <ans:registroANS>NNNNNN</ans:registroANS>
    </ans:destino>
    <ans:Padrao>4.01.00</ans:Padrao>
  </ans:cabecalho>
  <ans:prestadorParaOperadora>
    <ans:loteGuias>
      <ans:numeroLote>...</ans:numeroLote>
      <ans:guiasTISS>
        <ans:guiaSP-SADT>
          <ans:cabecalhoGuia>
            <ans:registroANS>...</ans:registroANS>
            <ans:numeroGuiaPrestador>...</ans:numeroGuiaPrestador>
          </ans:cabecalhoGuia>
          <ans:numeroGuiaOperadora>...</ans:numeroGuiaOperadora>
          <ans:dadosAutorizacao>
            <ans:senha>...</ans:senha>
            <ans:dataValidadeSenha>...</ans:dataValidadeSenha>
          </ans:dadosAutorizacao>
          <ans:dadosBeneficiario>
            <ans:numeroCarteira>...</ans:numeroCarteira>
            <ans:atendimentoRN>N</ans:atendimentoRN>
            <ans:nomeBeneficiario>...</ans:nomeBeneficiario>
          </ans:dadosBeneficiario>
          <ans:dadosSolicitante> ... </ans:dadosSolicitante>
          <ans:contratadoExecutante>
            <ans:codigoPrestadorNaOperadora>...</ans:codigoPrestadorNaOperadora>
            <ans:nomeContratado>...</ans:nomeContratado>
            <ans:CNES>...</ans:CNES>
          </ans:contratadoExecutante>
          <ans:dadosAtendimento>
            <ans:tipoAtendimento>...</ans:tipoAtendimento>
            <ans:indicacaoAcidente>9</ans:indicacaoAcidente>
            <ans:caraterAtendimento>1</ans:caraterAtendimento>  <!-- 1=Eletivo, 2=Urgência -->
            <ans:regimeAtendimento>...</ans:regimeAtendimento>
          </ans:dadosAtendimento>
          <ans:procedimentosExecutados>
            <ans:procedimentoExecutado>
              <ans:dataExecucao>AAAA-MM-DD</ans:dataExecucao>
              <ans:procedimento>
                <ans:codigoTabela>22</ans:codigoTabela>
                <ans:codigoProcedimento>TUSS</ans:codigoProcedimento>
                <ans:descricaoProcedimento>...</ans:descricaoProcedimento>
              </ans:procedimento>
              <ans:quantidadeExecutada>1</ans:quantidadeExecutada>
              <ans:valorUnitario>0.00</ans:valorUnitario>
              <ans:valorTotal>0.00</ans:valorTotal>
            </ans:procedimentoExecutado>
          </ans:procedimentosExecutados>
          <ans:valorTotal>
            <ans:valorProcedimentos>0.00</ans:valorProcedimentos>
            <ans:valorTotalGeral>0.00</ans:valorTotalGeral>
          </ans:valorTotal>
        </ans:guiaSP-SADT>
      </ans:guiasTISS>
    </ans:loteGuias>
  </ans:prestadorParaOperadora>
  <ans:epilogo>
    <ans:hash>MD5_DO_CONTEUDO</ans:hash>
  </ans:epilogo>
</ans:mensagemTISS>
```

## Campos-chave da Guia SP/SADT (para preenchimento)
- **Registro ANS da operadora** (6 dígitos)
- **Número da guia no prestador** (único, não repetir)
- **Número da guia na operadora** e **senha de autorização** (quando exigidos)
- **Beneficiário**: número da carteira, validade, nome, atendimento RN (S/N)
- **Solicitante / Executante**: código na operadora, nome do contratado, CNES
- **Profissional executante**: nome, conselho (CRM=06, etc.), número, UF, CBO-S
- **Dados do atendimento**: tipo de atendimento, indicação de acidente, caráter (eletivo/urgência), regime, tipo de consulta
- **Procedimentos executados**: data, tabela (22=TUSS), código TUSS, descrição, quantidade, valor unitário, valor total
- **Diagnóstico (CID-10)** quando aplicável
- **Valores totais**: procedimentos, taxas, materiais, medicamentos, total geral

## Cálculo do Hash
O hash (MD5) é calculado sobre a **concatenação apenas do conteúdo (valores) das tags**, desprezando as próprias tags XML. O resultado vai no `ans:epilogo/ans:hash`. Serve para garantir integridade — se qualquer valor mudar, o hash precisa ser recalculado, senão a operadora rejeita.

## Fluxo de faturamento
1. Realizar atendimentos → gerar guias SP/SADT preenchidas.
2. Agrupar guias em **lote** (geralmente até 100 guias).
3. Gerar o **XML** do lote com cabeçalho, guias e hash.
4. Enviar via portal da operadora ou web service.
5. Operadora processa e retorna Demonstrativo de Análise e Demonstrativo de Pagamento (glosas quando houver).

## Decisões de implementação para o MIFATURE
- Configurar dados do prestador (CNPJ, código na operadora, CNES) — pode reutilizar cadastro existente.
- Guia SP/SADT: reaproveitar dados já existentes de paciente, profissional, convênio, atendimento e procedimentos.
- Gerar XML no servidor (Node/TS) usando montagem de string ou lib de XML, com encoding ISO-8859-1 e hash MD5.
- Disponibilizar: (1) formulário de preenchimento/edição da guia; (2) geração e download do XML do lote.
- Versão TISS configurável (default 4.01.00). Validar campos obrigatórios antes de gerar.
