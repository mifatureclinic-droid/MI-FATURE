# Debug: Exclusão de Procedimentos não Persiste

## Problema
Utilizador exclui procedimentos no pré-faturamento, clica em "Salvar", mas quando recarrega a página os procedimentos excluídos reaparecem.

## Análise Realizada
1. **Componente GuiaSPSADTPrefaturamento.tsx**: Tem 3 tabelas (Procedimentos Solicitados, Execuções, Profissionais)
2. **Fluxo de salvamento**: 
   - Frontend: `handleSave()` envia `{procedimentos, execucoes, profissionais}` ao `onSave()`
   - GuiasSPSADT.tsx: `onSave()` constrói `procedimentosSolicitados` e `execucoesParaSalvar` e chama `salvarSPSADT()`
   - Backend: `salvarSPSADT()` chama `db.setGuiaProcedimentos(guiaId, todosProcedimentos)`
   - db.ts: `setGuiaProcedimentos()` executa `DELETE FROM guiaProcedimentos WHERE guiaId = ?` + `INSERT`

3. **Logs do servidor mostram**:
   - `[setGuiaProcedimentos] Deletando procedimentos da guia 210001`
   - `[setGuiaProcedimentos] Inserindo 1 procedimentos para guia 210001`
   - Mas os procedimentos antigos ainda aparecem após refetch

## Hipóteses
1. O delete não está sendo executado (erro silencioso)
2. Há múltiplas linhas com mesmo `guiaId` e delete não apaga todas
3. O `guiaId` passado é diferente do que está no banco
4. Há um problema de transação/commit no banco
5. O `procedimentosSalvos` que vem do `getDadosGuiaPrefaturamento` está retornando dados em cache

## Próximas Ações
- Adicionar transação MySQL explícita no `setGuiaProcedimentos`
- Usar `db.transaction()` para garantir atomicidade
- Validar que `guiaId` é válido antes de deletar
- Verificar se `getDadosGuiaPrefaturamento` está usando cache
- Testar com SQL direto: `DELETE FROM guia_procedimentos WHERE guia_id = 210001`
