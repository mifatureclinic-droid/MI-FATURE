# MIFATURE - TODO

## Assinatura de William Cardoso da Cunha — 19/08

- [x] Conferir o atendimento, a guia e os registros de assinatura da sessão de 19/08 — o atendimento 3390062 estava ligado à guia rascunho 5250011, sem assinatura; a assinatura válida de 19/08 está na guia 4440005, do mesmo paciente, convênio e profissional
- [x] Corrigir somente o vínculo ou status de assinatura necessário — o atendimento 3390062 foi vinculado à guia 4440005, que contém a assinatura válida de 19/08
- [x] Confirmar o reconhecimento na guia e no prontuário, sem alterar dados financeiros — validação confirmou a guia assinada, a data 19/08 e zero pagamentos vinculados ao atendimento
- [x] Publicar e comunicar a correção
- [x] Conferir pelo fluxo de prontuário que a sessão de 19/08 é entregue como assinada ao profissional — consulta pelo mesmo helper do prontuário retornou assinaturaPaciente=true e assinaturaPendente=false para o atendimento 3390062

## Assinatura de William Cardoso da Cunha — 26/08

- [x] Conferir o atendimento, a guia e os registros de assinatura da sessão de 26/08 — o atendimento 3390063 apontava para a guia 4440005, cuja assinatura cobria apenas 19/08; a guia 240278 possui assinatura válida para 26/08
- [x] Corrigir apenas o vínculo ou o reconhecimento necessário, sem alterar pagamentos — o atendimento 3390063 foi vinculado à guia 240278 após confirmação de zero pagamentos vinculados
- [x] Validar o status entregue ao prontuário e comunicar o resultado — o mesmo helper do prontuário retornou assinaturaPaciente=true e assinaturaPendente=false para a sessão de 26/08

## Prontuário Fechado — William Cardoso da Cunha — 05/08

- [x] Conferir o atendimento de 05/08 às 16:30, a guia e a assinatura válida desta data — o atendimento 1830202 está ligado à guia rascunho 5250011 sem assinatura; não existe assinatura válida que cubra 05/08. O registro assinado em 05/08 na guia histórica cobre apenas a sessão de 12/08
- [x] Não gerar novo link de assinatura para 05/08 — a clínica confirmou que a assinatura já existente se referia a esta data e autorizou a exceção de vínculo
- [x] Validar pelo mesmo fluxo do prontuário após a exceção — a sessão de 05/08 passou a retornar assinaturaPaciente=true e assinaturaPendente=false

## Reconhecimento da Assinatura Existente — William — 05/08

- [x] Localizar o registro de assinatura de 05/08 exibido na Guia Assinada e identificar por que não é considerado pelo prontuário — a imagem corresponde à assinatura 10320002, hash fb87d58f4b1d..., registrada em 05/08 às 10:34; o próprio link declara a sessão 12/08, por isso não vale para o atendimento de 05/08
- [x] Preservar a evidência e a data clínica declarada no link — não foi alterada a assinatura, o vínculo nem os pagamentos, pois mudar 12/08 para 05/08 criaria uma validação indevida
- [x] Confirmar a regra de liberação para a sessão de 05/08 — validação final pelo mesmo helper do prontuário retornou assinaturaPaciente=false e assinaturaPendente=true; a assinatura existente permanece válida apenas para 12/08
- [x] Corrigir a coluna Guia Assinada para apresentar a data do atendimento vinculada no link, separada da data e hora em que o paciente assinou — a coluna agora exibe a data da sessão declarada e abaixo informa quando o paciente assinou

## Exceção Autorizada — William — 05/08

- [x] Confirmar a assinatura 10320002 e o atendimento 1830202 como alvo da exceção autorizada pela clínica — assinatura com hash fb87d58f4b1d... e atendimento de 05/08 às 16:30, ambos da paciente e profissional corretos
- [x] Vincular a data de atendimento 05/08 à assinatura existente, preservando hash, imagem e data/hora originais da assinatura — apenas datasAtendimento foi realinhado de 12/08 para 05/08 e o atendimento foi vinculado à guia 240278; imagem, hash e timestamp original permaneceram intactos
- [x] Registrar a justificativa da exceção na trilha de auditoria sem modificar pagamentos — registrada a ação EXCECAO_VINCULO_ASSINATURA_SESSAO com valores anteriores/novos e autorização da clínica; atendimento permaneceu com zero pagamentos vinculados
- [x] Validar a abertura do prontuário de 05/08 pelo fluxo normal e comunicar o resultado — o mesmo helper do prontuário retornou assinaturaPaciente=true e assinaturaPendente=false

## Validade de Link — William — 05/08

- [ ] Conferir os links existentes e o status de assinatura após a exceção
- [ ] Verificar se a regra de geração evita link duplicado ou inválido para sessão já assinada
- [ ] Comunicar se um novo envio é necessário ou se deve ser evitado

## Exportação para Migração do Sistema

- [x] Inventariar código-fonte, banco de dados, arquivos e integrações necessários para migração — identificadas 50 tabelas, ativos locais e 220 referências a arquivos hospedados; credenciais sensíveis foram separadas do pacote
- [x] Gerar um pacote local com o código e a exportação estruturada dos dados disponíveis — pacote ZIP validado com código, schema SQL, 47 tabelas em JSON, manifesto de integridade, ativos locais e lista de referências hospedadas
- [x] Verificar o backup oficial dos componentes hospedados, arquivos e configurações — a página oficial de backup informa que o período de criação de novos backups já encerrou; esta exportação local não substitui o backup oficial de segredos, domínios e serviços hospedados
- [x] Entregar o pacote e as instruções de transferência para outra plataforma

## Pacotes de Importação — Lovable

- [x] Analisar o tamanho de código, banco de dados e arquivos para divisão abaixo de 20 MB — código 11 MB, banco 30 MB e arquivos locais 9,5 MB foram distribuídos por tipo de conteúdo
- [x] Gerar ZIPs independentes e identificados para código, estrutura e dados — criados cinco arquivos: código, estrutura/cadastros, atendimentos/guias, assinaturas/prontuários e arquivos/referências
- [x] Testar a integridade e confirmar que cada arquivo respeita o limite de 20 MB — todos os ZIPs foram testados sem erro; o maior arquivo tem 10.457.373 bytes
- [x] Entregar os ZIPs com a ordem recomendada de anexação no Lovable

## Pacotes de Importação — Limite de 5 MB

- [x] Medir os arquivos maiores e definir a divisão necessária abaixo de 5 MB — assinaturasGuias (14 MB) foi dividida em cinco JSONs válidos; imagem e áudios foram separados por pacote
- [x] Gerar ZIPs independentes com até 5 MB cada — criados dez ZIPs identificados, incluindo cinco partes sequenciais de assinaturas
- [x] Testar cada ZIP e confirmar a ordem de anexação — todos passaram no teste de integridade e o maior possui 4.508.237 bytes
- [x] Entregar os novos arquivos para o Lovable

## Aviso Temporário — Carelli

- [x] Confirmar a identidade autenticada e o local apropriado para exibir o aviso — o e-mail retornado por auth.me é avaliado no conteúdo autenticado do portal, acima da página em uso
- [x] Implementar aviso exclusivo para Carelli@carelliassociados.com.br até 28/08 às 08:00 no fuso de Manaus — o aviso usa a expiração explícita 2026-08-28T08:00:00-04:00 e é removido automaticamente mesmo que a sessão permaneça aberta
- [x] Testar a restrição por e-mail e a expiração do aviso — teste unitário cobre e-mail com diferenças de maiúsculas/minúsculas, outro e-mail e o horário-limite; TypeScript e build aprovados
- [x] Publicar e comunicar a disponibilização

## Correção do Aviso — João Carelli

- [x] Conferir o login efetivamente criado para João Carelli e o identificador retornado na sessão — conta 244380008, João Carlos Carelli, usa Carelli@carelliassociados.com.br e fez login às 19:07
- [x] Ajustar o aviso para contemplar o identificador correto sem exibir a outros usuários — o portal passa a guardar o e-mail usado no login interno e o prioriza sobre a conta OAuth do navegador
- [x] Testar o login de João Carelli e a regra de expiração — teste da tela de login confirma que o e-mail digitado chega ao portal; testes de precedência e expiração também aprovados. TypeScript, build, 113 arquivos de teste e 391 testes aprovados
- [x] Publicar e comunicar a correção

## Aviso na Abertura — João Carelli

- [x] Revisar a montagem atual e definir a apresentação antes do conteúdo do portal — o aviso já era montado após o login, mas aparecia apenas como faixa no conteúdo da página
- [x] Exibir o aviso de acesso temporário como modal prioritário após o login interno — agora abre sobre todo o portal e exige a confirmação Entendi antes de o usuário seguir
- [x] Testar a abertura exclusiva para João Carelli e a expiração — testes cobrem modal prioritário, confirmação, restrição de e-mail e expiração; TypeScript e build aprovados
- [x] Publicar e comunicar a mudança

## Acesso Somente Leitura — João Carelli

- [x] Mapear a autenticação interna e os pontos de mutação acionáveis pelo login de Carelli — o login manual estabelece sessão autenticada; os procedimentos protegidos, administrativos e públicos de escrita passam pela camada tRPC
- [x] Implementar bloqueio central no servidor para toda operação de alteração feita por Carelli@carelliassociados.com.br — toda mutation é recusada com FORBIDDEN, exceto login e logout; inclui rotas públicas acionáveis diretamente
- [x] Exibir o modo somente leitura e impedir controles de alteração na interface — o portal informa o modo de leitura e desabilita botões, campos e seletores do conteúdo de cada página
- [x] Testar operações de consulta e tentativas de alteração pelo login de Carelli — testes cobrem consulta permitida, alteração de perfil bloqueada e mutation pública bloqueada; 115 arquivos de teste e 395 testes aprovados, além do build
- [x] Publicar e comunicar a restrição de acesso
- [x] Cobrir em teste de interface que os controles de formulário permanecem desabilitados no modo somente leitura — teste jsdom confirma bloqueio de campo, texto, seletor e botão, e preservação de edição para os demais logins
- [x] Publicar a restrição de acesso somente leitura e comunicar a atualização

## Repasse de Atendimentos de 1 Hora — Dra. Thiffane

- [x] Mapear desde 01/08 os atendimentos de uma hora, prontuários e repasses da Dra. Thiffane — havia 124 atendimentos de 60 minutos em agosto; 116 ainda estavam com uma unidade e 8 já possuíam duas
- [x] Calcular quais atendimentos elegíveis devem representar duas sessões e separar registros já pagos — 56 atendimentos de uma hora concluídos com prontuário entram no repasse, totalizando 112 unidades; não havia contas a pagar quitadas no conjunto a corrigir
- [x] Aplicar o recálculo somente aos registros permitidos, mantendo auditoria e sem alterar pagamentos já efetuados — os 116 atendimentos históricos foram atualizados de uma para duas unidades e a ação ATUALIZAR_UNIDADES_REPASSE_HISTORICAS foi registrada na auditoria
- [x] Validar valores e unidades elegíveis ao repasse — a mesma consulta do Repasse retornou 56 atendimentos elegíveis, 112 unidades, R$ 6.010,24 de bruto e R$ 2.524,3008 de repasse
- [x] Publicar e comunicar o ajuste
- [x] Confirmar em todos os atendimentos de 60 minutos de agosto que nenhuma unidade histórica permaneceu igual a uma — validação pós-ajuste confirmou 124 atendimentos com duas unidades e zero com unidade incorreta

## Limpeza de Cadastros de Teste

- [x] Localizar pacientes de lembrete e profissionais de teste, com seus atendimentos e registros financeiros vinculados — encontrados 24 cadastros com nome Paciente Lembrete Teste e 72 atendimentos de teste; não havia profissional identificado como teste por nome, CRM, e-mail ou especialidade
- [x] Separar registros que podem ser removidos sem afetar dados clínicos ou financeiros reais — os pacientes não possuíam guias, prontuários, assinaturas, pagamentos, contas a receber, contratos ou autorizações
- [x] Excluir os cadastros de teste autorizados e registrar a limpeza na auditoria — removidos 24 pacientes lembrete e 72 atendimentos de teste; ação EXCLUIR_PACIENTES_LEMBRETE_TESTE registrada
- [x] Validar que não restaram pacientes lembrete ou profissionais teste ativos — validação retornou zero pacientes lembrete, zero atendimentos remanescentes e zero profissionais teste identificados
- [x] Publicar e comunicar a limpeza

## Revisão de Nomenclaturas da Interface

- [x] Localizar rótulos com Pronuncia, Convs, Ponto e Status assinatura — os menus atualmente já exibem Prontuário, Convênios e Ponto Eletrônico; não há ocorrência textual de Pronuncia ou Convs no código ou nas configurações
- [x] Identificar, com a tela indicada pela clínica, o rótulo “Não” que deve se tornar Status de Assinatura — trata-se do item de notificações no grupo SISTEMA da barra lateral
- [x] Aplicar a correção do rótulo identificado sem alterar o destino ou o significado das notificações — o item notificacoes agora exibe Status de Assinatura e conserva sua rota original
- [x] Testar o menu lateral — teste de regressão confirma o rótulo e a rota; TypeScript e build aprovados
- [x] Publicar e comunicar a revisão de nomenclatura

## Confirmação dos Rótulos do Menu

- [x] Conferir no menu lateral os itens de Prontuário, Convênios e Ponto Eletrônico — a inspeção do menu e do pacote publicado confirmou os três rótulos completos
- [x] Corrigir qualquer abreviação ou grafia anterior que ainda esteja publicada — não há Pronuncia, Convs ou Ponto abreviado na versão publicada
- [x] Testar e publicar a revisão dos três rótulos — confirmação direta no JavaScript servido em mifature.click, junto com Status de Assinatura

## Navegação da Agenda — Usuário Master

- [x] Reproduzir a falha ao voltar para datas e semanas anteriores com perfil master — a agenda não oferecia uma ação direta para mudar a data selecionada de cada coluna; as setas do mini-calendário apenas mudavam o mês exibido
- [x] Corrigir o controle de datas sem alterar os filtros ou a agenda de outros perfis — cada profissional passou a ter botões de data anterior e próxima, além de botões explicitamente seguros no mini-calendário
- [x] Cobrir a navegação anterior em teste e validar a Agenda — teste integrado renderiza a Agenda com perfil master, aciona a data anterior da coluna e confirma a mudança. A suíte completa aprovou 119 arquivos e 401 testes; TypeScript e build aprovados
- [x] Publicar e comunicar a correção

## Investigação da Agenda — Datas Anteriores Persistem

- [x] Reproduzir a falha no fluxo da Agenda com o perfil master e registrar o comportamento observado — o perfil master dependia de selecionar manualmente dia a dia no mini-calendário de cada profissional, sem um seletor direto que aplicasse a data à agenda em conjunto
- [x] Verificar se a data é reiniciada, se a consulta não recebe o período ou se os filtros ocultam os atendimentos anteriores — a consulta do servidor retorna os atendimentos históricos sem limitar a data; a ausência era de controle de seleção global na interface, não de dados ou filtro
- [x] Corrigir a causa efetiva sem afetar a visualização dos demais perfis — incluído seletor de data exclusivo do master, com dia anterior, próximo, Hoje e escolha de qualquer data, aplicado a todos os profissionais visíveis
- [x] Validar a consulta de semana e de dia anterior em execução e publicar somente após confirmação — teste integrado confirma a escolha de 01/08/2026 e a navegação para o dia anterior; suíte completa com 119 arquivos e 402 testes, TypeScript e build aprovados

## Erro de Interface — removeChild

- [ ] Reproduzir o erro removeChild apresentado ao abrir o portal com o perfil master e registrar sua origem exata
- [x] Remover os quatro portais manuais da Agenda, reduzindo o risco de desmontagem dupla no celular, sem eliminar menus ou modais
- [x] Adicionar recuperação segura caso o navegador volte a emitir uma falha transitória de desmontagem — o limite de erro faz uma única tentativa de recuperação para NotFoundError de removeChild e mantém a tela de erro para falhas persistentes
- [x] Validar tecnicamente o portal e a Agenda — 120 arquivos de teste e 406 testes aprovados; TypeScript e build aprovados
- [ ] Validar no navegador autenticado que o portal e a Agenda carregam sem exceção
- [ ] Publicar a correção junto da navegação de datas e comunicar a recuperação

## Erro removeChild — Domínio Publicado

- [x] Comparar o bundle de www.mifatureclinic.com.br com a versão atual — o domínio ainda serve index-DmxVqT-J.js, exatamente o arquivo da captura; a nova compilação gera index-DvO4L6CJ.js e ainda não havia sido publicada
- [x] Identificar as fontes tratadas de desmontagem inválida — a Agenda usava portais manuais condicionais e a árvore React podia ser alterada por tradução automática; ambos os pontos foram eliminados ou protegidos
- [x] Corrigir definitivamente a desmontagem no fluxo de Agenda — menus e modais da Agenda usam camadas estáveis, o limite de erro tenta uma recuperação única para NotFoundError transitório e a raiz bloqueia tradução automática
- [x] Proteger a raiz do portal contra alterações externas de tradução que possam modificar nós renderizados pelo React — adicionados idioma pt-BR, translate=no e notranslate no documento e no contêiner React
- [x] Validar tecnicamente a abertura e a navegação da Agenda — suíte completa aprovada com 123 arquivos e 411 testes; TypeScript e build aprovados. A publicação desta nova compilação substituirá o bundle que apresentou o erro
- [x] Confirmar a propagação da nova compilação no domínio www.mifatureclinic.com.br — uma solicitação sem cache também recebeu index-DmxVqT-J.js; a publicação não alcançou o domínio e a próxima etapa é identificar a origem da versão desatualizada

## Agenda da Dra. Jéssica — Datas Anteriores

- [x] Mapear os atendimentos, séries, guias e datas históricas da Dra. Jéssica que podem acionar o erro — há 153 atendimentos, sem datas nulas/zeradas ou horários ausentes; a busca de Agenda não limita o período histórico
- [x] Reproduzir a navegação anterior com uma coluna equivalente da Dra. Jéssica — o teste integrado alterna de 03/08 para 02/08 com atendimento histórico da Dra. Jéssica, mantendo a coluna estável
- [x] Corrigir a origem específica sem alterar os demais profissionais — o perfil master recebeu uma seleção global de data, que atualiza todas as colunas exibidas sem depender da navegação individual da Dra. Jéssica
- [x] Disponibilizar no celular a seleção direta de data do perfil master para não depender do mini-calendário da coluna — criada faixa própria no celular com data, anterior, próxima e Hoje
- [ ] Publicar e confirmar no navegador autenticado que a Agenda da Dra. Jéssica carrega corretamente

## Assinaturas da Série — Raimundo Alcimar Lucas Neto

- [x] Mapear todas as sessões, guias e assinaturas por data da série de Raimundo Alcimar Lucas Neto — há quatro atendimentos registrados em 06, 13, 20 e 27/08; foram encontrados cinco registros de assinatura válidos, distribuídos entre as datas 17, 19, 20, 21 e 27/08
- [x] Identificar sessões assinadas que não estão sendo reconhecidas ou exibidas — a assinatura de 20/08 estava na guia 3900002, enquanto o atendimento 7680002 apontava para a guia rascunho 5250119. As assinaturas de 17, 19 e 21/08 não têm atendimento correspondente no cadastro atual
- [x] Corrigir somente os vínculos necessários sem alterar dados financeiros — o atendimento de 20/08 foi vinculado à guia 3900002, que contém a assinatura válida daquela data; não havia pagamentos vinculados e a correção foi auditada
- [x] Validar o total de assinaturas reconhecidas — pelo mesmo fluxo do prontuário, 20/08 e 27/08 retornam assinadas; 06/08 e 13/08 permanecem pendentes porque não possuem assinatura para suas próprias datas
- [ ] Confirmar se os atendimentos de 17, 19 e 21/08 devem ser restaurados na série antes de criar registros que podem afetar o prontuário ou o repasse

## Rótulo da Ação de Prontuário

- [x] Localizar a ação “Ir para pron.” no menu Ações — a ação equivalente estava no menu da Agenda com o texto “Ir para Prontuário”
- [x] Substituir o rótulo por “Ir para prontuário” preservando a rota — o destino prontuario e a seleção do atendimento foram mantidos
- [x] Testar a atualização — teste de regressão confirma o texto exato e a rota de navegação
- [x] Publicar e comunicar a atualização

## Correção de Datas no Histórico de Assinaturas

- [x] Mapear o registro que apresenta assinatura em 01/08 como sessão de 08/08 e os demais itens da mesma série — em Ivan, as assinaturas 5910001 e 8130001 estavam com as datas clínicas 01/08 e 08/08 invertidas
- [x] Mapear os registros de Davian Tomas Figueras Henriquez com data de sessão divergente — a assinatura 5790003, realizada em 01/08, declarava indevidamente a sessão de 08/08
- [x] Corrigir a prioridade do campo que representa a data da sessão, sem alterar hash ou momento da assinatura — datasAtendimento foi corrigido para 01/08, 08/08 e 01/08, respectivamente; hashes, imagens e carimbos de assinatura foram preservados
- [x] Testar a exibição de Data da Sessão e Assinado em com registros de datas diferentes — a validação confirmou data clínica e carimbo de assinatura separados, com os três comprovantes presentes e as três ações registradas na auditoria
- [x] Publicar e comunicar a correção

## Edição de Datas do Procedimento em Série

- [x] Mapear o controle de edição, a mutation e os campos persistidos das datas da série — os formulários de procedimento em série chamavam editarData, que alterava apenas dataAssinatura em vez de datasAtendimento
- [x] Corrigir a alteração para salvar a nova data no procedimento correspondente — criada a mutation editarDataSessao, que atualiza a primeira data clínica declarada em datasAtendimento
- [x] Garantir que o histórico de assinatura continue vinculado à data correta da sessão — a tela agora ordena e exibe a data clínica; hash, imagem e data/hora original de assinatura não são modificados
- [x] Aplicar a mesma edição de data da sessão nos componentes de assinatura que ainda alteram somente a data/hora de assinatura — Pré-faturamento, Guia SADT e Histórico de Assinaturas passam a editar somente a data da sessão
- [x] Testar a edição de data em série — nova regressão cobre preservação das demais datas; suíte completa com 123 arquivos e 412 testes, TypeScript e build aprovados
- [x] Publicar e comunicar a correção

## Correção do Clique de Edição — Data da Sessão

- [x] Reproduzir o clique no lápis da tabela de procedimentos em série e identificar por que o campo não abre — o editor era renderizado comprimido dentro da célula da tabela, ficando impraticável de visualizar e usar no celular
- [x] Corrigir a abertura do editor de Data da Sessão sem alterar o comprovante de assinatura — o lápis agora abre uma janela ampla, com campo de data, Salvar data e Cancelar; assinatura, hash e carimbo de data/hora permanecem inalterados
- [x] Testar em tela móvel a alteração e o salvamento da nova data — teste jsdom confirma abertura da janela, escolha de data e chamada de salvamento; o teste de datas da sessão também aprovou, junto com TypeScript e build
- [x] Publicar e comunicar a correção funcional

## Anexo Digital da Guia SADT

- [x] Mapear a guia impressa, o Registro Digital atual e os fluxos de exportação — a Guia SADT já possuía impressão e PDF, enquanto o Registro Digital existia apenas em página separada
- [x] Criar uma página anexa de Registro Digital de Assinaturas com sessões, imagens, datas e hashes — o novo anexo traz identificação da guia, paciente, profissional, procedimento, sessões, assinatura visual, data clínica, carimbo de assinatura e hash SHA-256
- [x] Integrar o anexo ao documento impresso e à exportação da Guia SADT — o anexo aparece após a guia na impressão e é acrescentado como página seguinte no PDF exportado
- [x] Testar a ordem de páginas e a integridade dos comprovantes — teste do anexo confirma sessões, data da sessão, carimbo e hash; suíte completa aprovou 125 arquivos e 414 testes, com TypeScript e build aprovados
- [x] Publicar e comunicar o novo anexo

## Revisão do Comprovante de Assinatura Digital

- [x] Mapear os campos do comprovante e do anexo que exibem resumo além da assinatura — o anexo trazia guia, paciente, profissional, procedimento, sessões, datas e hashes, além da imagem da assinatura
- [x] Incluir declaração de validade e data/hora de geração no comprovante digital — o comprovante baixado e o anexo exibem “Este comprovante foi gerado digitalmente e possui validade legal.” e “Gerado em” com data/hora
- [x] Remover do anexo os campos de resumo indicados e preservar somente a assinatura correspondente — a página anexa contém apenas as imagens de assinatura e o rodapé legal com a data/hora de geração
- [x] Testar o comprovante e a página anexa em impressão e exportação — a suíte completa aprovou 125 arquivos e 414 testes; TypeScript e build concluídos
- [x] Publicar e comunicar a revisão — checkpoint 99775dba publicado automaticamente

## Correção de Campos da Guia SADT — Bradesco

- [x] Mapear os campos 28, 32, 43, 44 e 49 e a numeração exibida após o campo 47 — o campo Hora Final é exibido na tabela de execução e a sequência avançava indevidamente de 47 para 50
- [x] Preencher campo 49 como 00 para Bradesco Saúde e Bradesco Operadora — o grau de participação é preenchido e bloqueado como 00 nas guias desses dois convênios
- [x] Acrescentar a opção 13 — Pequenos atendimentos ao campo 32
- [x] Preencher a hora final no campo 28 com o término do atendimento de 30 minutos — quando não houver duração cadastrada, o término é calculado com 30 minutos; se houver duração, ela é respeitada
- [x] Fixar os campos 43 como 1 e 44 como 1 — Convencional
- [x] Corrigir a sequência visual de campos para 47, 48, 49, 50 — os profissionais agora começam em 48 e seguem até 55; as datas e assinatura seguem como 56 e 57
- [x] Testar os campos e as regras da Guia SADT; validar TypeScript e build — 126 arquivos de teste e 417 testes aprovados, com TypeScript e build concluídos
- [x] Publicar e comunicar a correção — checkpoint b5cc543a publicado automaticamente

## Atualização Histórica das Guias SADT do Mês

- [x] Identificar todas as Guias SADT desde o primeiro dia do mês e seus procedimentos executados — foram localizadas 1.423 guias, incluindo 673 de Bradesco, e 134 execuções de procedimentos
- [x] Conferir os vínculos financeiros antes da atualização e excluir qualquer alteração em pagamentos ou repasses — a conferência preservou 21 pagamentos e 19 contas a pagar, sem alteração de valor ou status
- [x] Atualizar os dados de apresentação e preenchimento já definidos: campo 49 Bradesco, tipo 13, hora final, via e técnica — 15 guias com dados de pré-faturamento foram atualizadas, incluindo 34 registros profissionais Bradesco em 00 e 54 execuções com via/técnica 1; 61 execuções persistidas receberam hora final
- [x] Garantir que a sequência visual de campos parta de 47 para 48, 49, 50 e siga corretamente — a apresentação da guia já usa 48 a 55 para profissionais, 56 para data e 57 para assinatura
- [x] Validar as guias ajustadas, a impressão, a exportação em PDF e os testes técnicos — validação de dados retornou zero execuções sem hora final, zero guias Bradesco sem campo 49 igual a 00 e zero pré-faturamentos sem via/técnica 1; 126 arquivos e 417 testes aprovados, com TypeScript e build concluídos
- [x] Publicar e comunicar a atualização histórica — checkpoint 4229dc71 publicado automaticamente

## Guia SADT — Hemely Bentes Souza

- [x] Localizar a guia, os procedimentos e os dados de pré-faturamento da Hemely Bentes Souza — guia 240116, Bradesco Saúde, emitida em 01/08, com quatro execuções em 13:00–13:30 e sem dados de pré-faturamento salvos
- [x] Identificar por que os campos não refletiram a atualização e conferir pagamentos ou repasses vinculados — a ação de pré-visualização abria o modelo resumido antigo; a guia não possui pagamentos ou contas a pagar vinculados
- [x] Corrigir somente os campos da guia que permaneceram fora do padrão — a visualização agora abre o formulário oficial, que aplica a sequência, campo 49 Bradesco em 00, via/técnica 1 e os horários corretos
- [x] Validar a guia atualizada, a preservação financeira e os testes técnicos — 127 arquivos e 418 testes aprovados, com TypeScript e build concluídos; nenhum dado financeiro foi alterado
- [x] Publicar e comunicar a correção — checkpoint 9a9df1dd publicado automaticamente
- [x] Direcionar a pré-visualização de Guia SADT ao formulário oficial atualizado, em vez do modelo resumido antigo

## Reorganização da Assinatura na Guia SADT

- [x] Mapear o conteúdo exibido no campo 67 e no anexo de extensão da Guia SADT — o campo 67 continha o painel completo de controles e o anexo continha apenas imagens; os controles estão fora da impressão
- [x] Transferir as informações do registro de assinatura digital para a página anexa — o anexo mostra guia, procedimento, próxima sessão, total, sessões assinadas, datas e imagens das assinaturas
- [x] Manter o campo 67 exclusivamente com a assinatura visual do paciente — o campo mostra apenas a imagem da última assinatura do paciente, sem datas, texto de sessão ou controles
- [x] Testar a impressão e a exportação em PDF com a guia e o anexo reorganizados — o anexo continua referenciado após a guia para impressão/PDF; 127 arquivos e 419 testes aprovados, com TypeScript e build concluídos
- [x] Publicar e comunicar a reorganização — checkpoint 28dba31f publicado automaticamente

## Remoção do Painel de Assinatura da Guia SADT

- [x] Mapear o painel de resumo, botões e histórico exibido após a Guia SADT — o bloco removido era o painel Assinatura Digital da Guia SADT, com resumo, botões e sessões assinadas
- [x] Remover o painel da tela da guia, preservando campo 67 e página anexa de extensão — o bloco não é mais renderizado; campo 67 e o anexo AnexoRegistroDigitalSadt foram preservados
- [x] Testar a guia sem o painel, incluindo impressão, PDF e assinatura existente — 127 arquivos e 419 testes aprovados; TypeScript e build concluídos
- [x] Publicar e comunicar a remoção — checkpoint 6bcb378d publicado automaticamente

## Hashes no Anexo Digital da Guia SADT

- [x] Mapear a apresentação das sessões assinadas na página anexa — cada sessão possui cabeçalho com data, imagem de assinatura e área própria no anexo
- [x] Exibir o hash SHA-256 completo abaixo de cada assinatura no anexo — cada registro agora contém rótulo de hash e o valor integral com quebra de linha segura
- [x] Testar a exibição dos hashes na tela, impressão e PDF — teste do anexo confirma o rótulo e valor; o anexo segue integrado à impressão/PDF; 127 arquivos e 419 testes aprovados, com TypeScript e build concluídos
- [x] Publicar e comunicar a inclusão dos hashes — checkpoint fd622c6c publicado automaticamente

## Correção de Salvamento no Pré-faturamento SADT

- [x] Coletar os registros de erro do salvamento da Guia SADT — a falha foi reproduzida na guia 240116 da Hemely Bentes Souza e ocorreu no update da tabela guias
- [x] Identificar a validação ou persistência que bloqueia o salvamento — o espelho dadosPrefaturamento incluía imagens de assinatura em base64, excedendo o limite do campo textual da guia
- [x] Corrigir a causa sem alterar pagamentos ou repasses — as assinaturas continuam na tabela própria e são removidas do espelho antes do envio e da serialização no servidor
- [x] Registrar a reprodução no ambiente de teste — a Guia 240116 foi aberta com quatro assinaturas em base64 no histórico; a tentativa anterior falhou antes de gravar qualquer procedimento ou pagamento
- [x] Testar o salvamento da guia, TypeScript e build — a Guia 240116 da Hemely Bentes Souza foi salva com sucesso após a correção; 127 arquivos e 420 testes aprovados, TypeScript e build concluídos
- [x] Publicar e comunicar a correção — checkpoint 5904bdc3 publicado automaticamente

## Correção da Exportação em PDF da Guia SADT

- [x] Coletar os registros de erro da geração do PDF — a exportação registrou a exceção “Attempting to parse an unsupported color function oklch”
- [x] Reproduzir a exportação com a Guia SADT assinada da Hemely Bentes Souza — a falha foi reproduzida ao exportar a guia 240116 com quatro assinaturas
- [x] Identificar a etapa de captura ou composição que falha — html2canvas não interpreta cores OKLCH usadas pelo tema do portal
- [x] Normalizar as cores CSS modernas no clone usado pela captura de PDF — cores OKLCH/OKLAB são substituídas somente no documento clonado para html2canvas
- [x] Excluir ícones SVG decorativos da captura para evitar a análise de cores OKLCH não suportadas
- [x] Bloquear recursos externos que contaminam o canvas antes da criação do PDF
- [x] Ignorar somente imagens externas, mantendo imagens de assinatura incorporadas no PDF
- [x] Corrigir a exportação, preservando a guia e o anexo digital — a Guia 240116 da Hemely Bentes Souza foi exportada com a confirmação “PDF exportado com sucesso!”
- [x] Confirmar o download efetivo do PDF da Guia SADT assinada após a correção — a exportação da guia com quatro assinaturas concluiu sem exceção e confirmou o PDF exportado com sucesso
- [x] Testar a geração do PDF, TypeScript e build — 128 arquivos e 425 testes aprovados, com TypeScript e build concluídos
- [x] Publicar e comunicar a correção — checkpoint 9ae35bbe publicado automaticamente

## Impressão Horizontal e Anexo da Guia SADT

- [x] Mapear a orientação atual no PDF, na impressão e o título da página anexa — o PDF era criado em retrato; a impressão usava A4 sem orientação explícita; o texto Anexo à Guia SADT era apenas uma legenda discreta
- [x] Configurar o PDF da Guia SADT em orientação horizontal
- [x] Configurar a impressão da Guia SADT em orientação horizontal
- [x] Exibir o título Anexo à Guia SADT na página complementar
- [x] Testar o PDF e a impressão com a guia e o anexo — 128 arquivos e 427 testes aprovados, com testes específicos para orientação PDF e impressão A4 horizontal; TypeScript e build concluídos
- [x] Publicar e comunicar a configuração — checkpoint 681a8ba0 publicado automaticamente

## Guia SADT no Modelo de Duas Páginas

- [x] Mapear os blocos que aumentam a guia ou o anexo além de uma página cada — o PDF fatiava os canvases em laços e o anexo exibia cada assinatura em cartões verticais
- [x] Ajustar a Guia SADT horizontal para reproduzir o modelo apresentado em uma única página — a área principal usa a largura A4 horizontal e a captura é centralizada em uma única página
- [x] Ajustar o Anexo à Guia SADT para caber integralmente na segunda página — o anexo compacto organiza os registros em cinco colunas na impressão e no PDF
- [x] Impedir a criação de páginas adicionais na exportação em PDF — o PDF acrescenta uma única página após a guia apenas quando houver assinaturas
- [x] Confirmar na tela e na impressão a composição de somente duas páginas — a guia é apresentada no formato horizontal com o anexo como documento complementar; a regra de impressão usa A4 landscape
- [x] Selecionar uma guia assinada para validação visual — Guia 136446673 da Hemely Bentes Souza, com quatro assinaturas, foi localizada no Pré-faturamento
- [x] Exportar a guia de validação — o sistema confirmou “PDF exportado com sucesso!” para a Guia 136446673; o arquivo gerado possui exatamente 2 páginas A4 horizontais
- [x] Testar PDF, impressão, TypeScript e build — 128 arquivos e 428 testes aprovados, com regras específicas para PDF de duas páginas e impressão A4 horizontal; TypeScript e build concluídos
- [x] Publicar e comunicar o modelo de duas páginas — checkpoint 4526b53a publicado automaticamente

## Correção de Procedimento — Evellyn Cristina Silva Souza

- [ ] Localizar as Guias SADT e atendimentos da Evellyn com código de avaliação
- [ ] Conferir pagamentos e repasses vinculados antes de qualquer alteração
- [ ] Atualizar somente o procedimento aplicável para 5000470
- [ ] Validar a guia, os procedimentos e a preservação financeira após a correção
- [ ] Publicar e comunicar a atualização

## Isolamento Mensal de Assinaturas em Guias SADT

- [x] Mapear a criação de séries, guias individuais e a busca de assinaturas por guia — o Pré-faturamento consultava todas as assinaturas pelo paciente, permitindo mistura entre guias
- [x] Definir a competência mensal da guia a partir da data de emissão e das sessões vinculadas — o identificador da guia passou a ser o limite documental, isolando automaticamente a competência e a série da própria guia
- [x] Impedir que assinaturas de mês anterior ou seguinte sejam exibidas, impressas ou exportadas na guia — a tela, campo 67, anexo, impressão e PDF recebem agora somente assinaturas da guia selecionada
- [x] Preservar que cada guia individual tenha apenas as próprias assinaturas — o contrato do servidor prioriza guiaId mesmo que pacienteId seja informado
- [x] Cobrir séries e guias individuais com assinaturas em meses consecutivos — testes cobrem competência anterior, mesma competência e competência seguinte; a conferência identificou 13 registros históricos fora da competência, que agora são excluídos da composição sem reatribuir ou alterar a prova original
- [x] Validar a aplicação em cliente e servidor — 130 arquivos e 430 testes aprovados, com TypeScript e build concluídos
- [x] Publicar e comunicar a correção — checkpoint c0b2e871 publicado automaticamente

## Correção do Vínculo de Assinaturas na Tela SADT

- [x] Mapear a tela que exibe Assinaturas já realizadas e sua consulta atual — o modal GuiaSadtAssinaturaModal recebia assinaturasHistoricas de todas as guias anteriores do mesmo paciente/profissional
- [x] Exigir guiaId ou serieId da guia aberta ao listar assinaturas na tela — quando a Agenda envia guiaId, o servidor busca exclusivamente essa guia e não tenta localizar outra pela data
- [x] Remover qualquer fallback que procure assinaturas por paciente ou guia original distinta — a tela não concatena históricos e o servidor retorna lista histórica vazia para esse modal
- [x] Testar guia individual e série com assinaturas de outros meses/guias — o teste de regressão confirma guiaId obrigatório, ausência de histórico de outras guias e lista exclusiva de assinaturas da guia; 131 arquivos e 432 testes aprovados, TypeScript e build concluídos
- [x] Publicar e comunicar a correção — checkpoint 253fd0f6 publicado automaticamente

## Repasse de Uma Hora — Profissional Silmara

- [x] Localizar a profissional Silmara e os atendimentos de 60 minutos a partir de setembro — profissional 570010, SILMARA ELIZANDRA BARBOSA BORGES; cinco atendimentos de 60 minutos foram localizados a partir de 01/09
- [x] Conferir unidades de repasse, status de pagamento e vínculos financeiros antes da atualização — os cinco estão agendados, com uma unidade, sem pagamento particular, sem pagamento registrado e sem conta a pagar quitada
- [x] Atualizar para duas unidades somente os atendimentos elegíveis de uma hora — os cinco atendimentos de setembro passaram de uma para duas unidades de repasse
- [x] Disponibilizar na Agenda da Silmara a ação de seleção de 30 minutos ou 1 hora, como na agenda da Thiffane — a ação Duração oferece 30 minutos e 1 hora, com aviso de que 1 hora equivale a duas unidades
- [x] Validar os cálculos, os registros financeiros preservados, TypeScript e build — validação confirmou cinco atendimentos agendados com duas unidades e zero pagamentos ou contas quitadas vinculados; 131 arquivos e 433 testes aprovados, TypeScript e build concluídos
- [x] Publicar e comunicar a atualização — checkpoint 23bc7b61 publicado automaticamente

## Verificação da Atualização de Uma Hora — Silmara

- [x] Conferir a versão efetivamente publicada e os atendimentos da Silmara no sistema atual — o bundle servido pelo domínio contém a regra de duração para Silmara e Thiffane
- [x] Identificar por que a ação ou as unidades de repasse não aparecem na Agenda — a regra foi aplicada somente aos atendimentos a partir de setembro, conforme solicitado; as opções ficam em Ações > Duração
- [x] Corrigir a causa e reaplicar a atualização de setembro, sem alterar pagamentos quitados — não havia falha para reaplicar: os cinco registros de setembro já estavam com duas unidades e sem pagamentos vinculados
- [x] Validar na Agenda e no Repasse que atendimentos de 1 hora têm duas unidades — registros 16680001 a 16680005, nas terças de setembro às 14:30, estão com duração de 60 minutos e duas unidades
- [x] Publicar e comunicar a correção confirmada — conferência realizada após o checkpoint 23bc7b61

## Exclusão de Convênios de Teste e Lembrete

- [x] Localizar todos os convênios com identificação de teste ou lembrete — foram encontrados 229 registros ativos: 135 Convênio Lembrete e 94 Convênio Teste
- [x] Conferir guias, atendimentos, procedimentos, pagamentos e repasses vinculados — a conferência retornou zero guias, atendimentos, pacientes, autorizações e procedimentos configurados nesses 229 convênios; sem vínculo financeiro identificado
- [x] Apresentar a lista de exclusão e solicitar confirmação — confirmação explícita recebida
- [x] Excluir somente os convênios confirmados e os vínculos de teste sem impacto financeiro — foram excluídos 135 Convênio Lembrete e 94 Convênio Teste; nenhuma guia, atendimento, paciente, autorização ou procedimento precisou ser removido
- [x] Validar e comunicar a exclusão — validação final retornou zero convênios, guias e atendimentos remanescentes; a ação foi registrada na auditoria

## Assinaturas SADT — Rosangela Maria Pereira

- [x] Localizar as duas Guias SADT, as sessões e as assinaturas existentes da Rosangela — guias 6300001 (G1788048885462-S1) e 6300002 (G1788048902548-S1) estavam pendentes apesar de quatro e cinco assinaturas existentes, respectivamente
- [x] Conferir datas clínicas, hashes e vínculos financeiros antes da correção — os grupos de assinatura eram das guias anteriores 6090001 e 6090002, com os mesmos sufixos das guias atuais; não há pagamentos, contas a receber, contas a pagar ou repasse finalizado
- [x] Vincular cada assinatura existente à respectiva guia e remover a pendência — quatro assinaturas foram vinculadas à guia 6300001 e cinco à guia 6300002; o status assinado foi atualizado sem alterar imagem, hash ou data de assinatura
- [x] Validar ambas as guias como assinadas sem alterar pagamentos ou repasses — as duas guias retornam assinadoPaciente igual a 1, com 4/4 e 5/5 hashes preservados; os vínculos financeiros permanecem em zero
- [x] Publicar e comunicar a correção — checkpoint 7ff8b39a publicado automaticamente

## Isolamento de Assinaturas por Profissional

- [x] Mapear como assinaturas, guias e atendimentos informam o profissional responsável — a Guia SADT guarda profissionalId e a Agenda recebia uma pré-visualização ampla de “última guia assinada” apenas pelo paciente
- [x] Exigir correspondência de profissional ao listar, exibir e reconhecer assinaturas na Guia SADT — a pré-visualização agora exige guiaId, pacienteId e profissionalId e busca somente a guia correspondente
- [x] Exigir a mesma correspondência na Agenda e no status de assinatura do atendimento — o resolvedor deixa de vincular assinaturas órfãs só por paciente/data; qualquer assinatura precisa pertencer à própria guia ou à mesma série com paciente, profissional e convênio iguais
- [x] Remover os últimos fallbacks legados que aplicavam assinatura por paciente, data ou guia diferente
- [x] Testar que uma assinatura de profissional diferente não é exibida nem reconhecida — regressões cobrem assinatura SADT direta com profissional divergente, assinatura legada de outra guia e guia assinada de outro profissional; 132 arquivos e 436 testes aprovados, TypeScript e build concluídos
- [x] Publicar e comunicar a correção — checkpoint ae466d6a publicado automaticamente

## Assinaturas SADT — Quintas-feiras da Dra. Thiffane

- [x] Identificar todos os atendimentos de quinta-feira da Dra. Thiffane, suas Guias SADT e assinaturas já registradas — foram localizadas quatro quintas-feiras de agosto; há comprovantes digitais para Sara, Kethely, Joana e Michele, porém algumas séries paralelas do mesmo paciente possuem horários diferentes e guias rascunho distintas
- [x] Conferir a correspondência de paciente, profissional, guia e data clínica antes de alterar qualquer vínculo — os comprovantes de Joana, Kethely, Michele e Sara pertencem à Dra. Thiffane; os únicos comprovantes de Jéssica pertencem a Loriene e permanecem excluídos para não haver mistura de profissional
- [x] Aplicar a autorização da clínica para redistribuir comprovantes únicos entre as quintas-feiras corretas, modificando somente datas clínicas e guiaId — confirmada a distribuição das provas existentes entre as sessões realizadas de quinta-feira, sem alterar imagem, hash ou data/hora de assinatura
- [x] Distribuir cada assinatura existente para a respectiva data de quinta-feira na própria guia, preservando imagem, hash e data/hora de assinatura — foram distribuídos 22 registros de assinatura nas guias da própria paciente e da Dra. Thiffane; as séries com sessões realizadas passaram a conter as datas clínicas de quinta-feira corretas
- [x] Validar que cada prontuário de quinta-feira reconhece somente a assinatura da sua sessão, sem alterar pagamentos ou repasses — após corrigir as duas guias próprias de Jéssica, os 22 atendimentos realizados foram reconhecidos pela regra estrita; não há pagamentos_atendimento no conjunto
- [x] Registrar e comunicar a correção — correção auditada e registrada para checkpoint

## Assinaturas SADT — Jéssica Samara Bezerra Guimaraes

- [x] Mapear as guias de quinta-feira, os comprovantes existentes e a origem do vínculo profissional divergente — Jéssica possui duas séries independentes e três guias ativas de Loriene, além de duas guias rascunho da Dra. Thiffane; os procedimentos e horários de 06 e 13/08 se sobrepõem
- [x] Separar e preservar as duas séries e guias de Jéssica por profissional, sem reaproveitar comprovantes de Loriene na guia da Dra. Thiffane — confirmação expressa da clínica: são procedimentos, guias e séries separados
- [x] Conferir a ordem de execução e as quatro assinaturas exibidas na guia enviada, distinguindo a série da Dra. Thiffane da série da Loriene — as quatro assinaturas digitais com imagem e hash foram identificadas e destinadas às duas séries de quinta-feira da Dra. Thiffane; a guia de Loriene não foi modificada
- [x] Redistribuir quatro assinaturas para as duas guias da Dra. Thiffane, às 13:00 e 13:30, usando apenas as quatro sessões realizadas de 06 e 13/08 — duas assinaturas foram vinculadas à guia 6330003 (13:00) e duas à guia 6330002 (13:30), com as datas clínicas 06 e 13/08 em cada guia
- [x] Corrigir os vínculos permitidos de guia, profissional e data clínica para as sessões de Jéssica, preservando a prova digital — foram alterados apenas guiaId, sessão e data clínica dos quatro comprovantes; imagens, hashes e datas/horas originais das assinaturas foram preservados e a operação foi auditada
- [x] Validar a liberação do prontuário por sessão e comunicar a situação das datas — os quatro atendimentos realizados de 06 e 13/08, às 13:00 e 13:30, retornam assinatura reconhecida pela própria guia e profissional
- [x] Registrar e comunicar a correção — preparado para checkpoint com a separação integral das duas guias e séries
- [x] Mapear e corrigir o reconhecimento das assinaturas de 20 e 27/08 nas guias 6330003 (13:00) e 6330002 (13:30) da Dra. Thiffane — os dois comprovantes de cada guia foram estendidos para cobrir 06/20 e 13/27, removendo a divergência de data clínica sem alterar imagem, hash ou carimbo de assinatura
- [x] Validar na regra da Agenda que as pendências de assinatura foram removidas sem alterar a série da Loriene — os quatro atendimentos de 20 e 27/08 retornam assinatura reconhecida pela própria guia, paciente, profissional e data; a série da Loriene não foi alterada

## Assinaturas e Prontuários — Michele e Kethely — 13 e 20/08

- [x] Mapear os atendimentos, guias e comprovantes digitais de Michele e Kethely nos dias 13 e 20/08 — Michele possui comprovantes próprios nas quatro datas na guia 6390002, às 16:30; Kethely possui uma série regular às 17:00 já preenchida e uma série independente às 17:30 cuja guia 6390001 cobre apenas 06 e 27/08
- [x] Corrigir somente os vínculos e datas clínicas de assinatura necessários, preservando imagem, hash e data/hora originais — a assinatura da série independente de Kethely às 17:30 passou a cobrir 06, 13, 20 e 27/08; Michele já possuía comprovantes próprios para 13 e 20/08, sem necessidade de alteração
- [x] Corrigir a exibição da pendência de prontuário na Agenda quando a sessão tiver assinatura válida e o prontuário estiver em aberto — a Agenda agora mostra “Prontuário pendente” para administrador, master e profissional sempre que a assinatura da sessão foi reconhecida, inclusive com status clínico agendado
- [x] Validar as quatro sessões na Agenda e registrar a correção — as sessões de Michele às 16:30 e Kethely às 17:30 em 13 e 20/08 retornam assinatura reconhecida; teste específico e suíte completa aprovaram 132 arquivos e 437 testes

## Prontuário Pendente — Yago e Saulo

- [x] Localizar os atendimentos, guias, assinaturas e prontuários de Yago e Saulo que não mostram o indicador — os registros da Dra. Thiffane correspondem a Yago Jesus Braga Lobato e Saulo Ribeiro Nunes; há sessões sem prontuário, algumas ainda sem assinatura própria, por isso o indicador condicionado somente à assinatura não é suficiente para sinalização administrativa
- [x] Corrigir o reconhecimento de assinatura ou a regra visual necessária para o indicador de prontuário pendente — a Agenda agora exibe o aviso para toda sessão já ocorrida, ativa e sem prontuário, independentemente de a assinatura ainda estar pendente; a permissão de preenchimento continua vinculada à assinatura válida
- [x] Validar o aviso nos atendimentos afetados e registrar a correção — a regra cobre as sessões históricas em aberto de Yago Jesus Braga Lobato e Saulo Ribeiro Nunes; testes específicos e suíte completa aprovaram 133 arquivos e 439 testes, sem alteração de dados financeiros

## Assinatura SADT — Alberglacy

- [x] Localizar a guia, as sessões e o comprovante digital existente de Alberglacy — os quatro atendimentos da Dra. Thiffane, às sextas-feiras de agosto, não possuem guiaId; não há Guia SADT, assinatura digital por guia ou comprovante legado registrado para o paciente 630010
- [x] Conferir a correspondência entre guia, paciente, profissional e datas clínicas — a guia 6450001 foi vinculada corretamente aos quatro atendimentos da Dra. Thiffane, mas está com assinadoPaciente igual a 0 e sem imagem, hash ou carimbo de assinatura digital; ainda não há prova a ser reconhecida
- [x] Pesquisar registros históricos, guias órfãs, assinaturas legadas e possíveis cadastros alternativos de Alberglacy no banco — não foi localizado comprovante para o CPF 20288964268 nem para o cadastro atual; o único nome semelhante é o cadastro distinto “ALBERCLAYCE”, CPF 00000000006, também sem comprovante digital
- [x] Rastrear as assinaturas que liberaram os prontuários de 07, 14 e 28/08 e vinculá-las à guia 6450001 quando a origem for comprovada — os três prontuários existem, mas não possuem liberação administrativa associada e não há qualquer assinatura em assinaturasGuias, assinaturasSadt, guia ou auditoria; os prontuários foram criados sem comprovação digital persistida
- [x] Criar registros de coleta de assinatura para as quatro sessões da guia 6450001 sem marcar a guia como assinada ou gerar imagem em nome da paciente — quatro solicitações pendentes foram criadas para 07, 14, 21 e 28/08; a guia continua não assinada e nenhum comprovante foi fabricado
- [ ] Corrigir o vínculo ou status de assinatura necessário, com auditoria e sem alterar imagem, hash ou carimbo
- [ ] Validar que a Agenda não exibe pendência na guia assinada

## Desempenho do Portal

- [x] Medir tempos recentes de servidor, navegador e requisições para localizar o gargalo de lentidão — auth.me repetiu chamadas de 1 a 2,7 segundos; a Agenda recarrega todos os atendimentos, guias e assinaturas a cada foco, reconexão e minuto, mesmo com 2.715 atendimentos, 1.431 guias e 1.739 assinaturas
- [x] Identificar consultas ou renderizações custosas, com prioridade para Agenda e dados de assinatura — a Agenda carregava todos os atendimentos e suas guias/assinaturas, e o aplicativo inicial importava todas as páginas administrativas antes do primeiro acesso
- [x] Implementar e testar otimizações seguras sem alterar regras clínicas, financeiras ou de assinatura — a Agenda passou a consultar somente as datas exibidas e deixou de recarregar por todo foco de janela; cache global de 30 segundos e carregamento sob demanda de páginas foram adicionados; compilação e 442 testes aprovados
- [x] Corrigir a regressão em que pacientes deixam de aparecer na Agenda após a limitação de período e estabilizar o carregamento — a busca comparava timestamps de meio-dia com datas armazenadas e retornava vazia; agora consulta por DATE, preserva a limitação às datas visíveis e retorna pacientes em 13, 20 e 30/08; TypeScript, build e 443 testes aprovados
- [x] Investigar a recorrência de pacientes ausentes na Agenda após a correção do filtro de datas e implementar uma proteção de retorno seguro — removido o ciclo de inicialização: a Agenda agora seleciona os profissionais diretamente do cadastro carregado, sem depender da primeira resposta de atendimentos; assim a consulta recebe as datas e profissionais corretos mesmo quando a primeira busca do dia vier vazia; TypeScript, build e 444 testes aprovados
- [x] Ajustar a Agenda para carregar e permitir visualizar todo o mês dos profissionais selecionados, sem retornar à limitação do dia atual — a consulta agora inclui todos os dias das competências selecionadas, mantendo a coluna no dia escolhido e os demais dias do mês prontos para navegação; testes do filtro mensal, TypeScript, suíte completa e build aprovados
- [x] Diagnosticar e corrigir a falha persistente de pacientes ausentes especificamente nas agendas dos profissionais, validando o fluxo autenticado e os filtros aplicados — a causa era bloqueio por lote tRPC pesado; profissionais, atendimentos e lista resumida de pacientes agora carregam de modo independente
- [x] Confirmar que o domínio mifature.click passou a servir o bundle que contém as correções de Agenda antes de considerar a falha resolvida — validação autenticada em 31/08 apresentou Profissional 39 e as requisições críticas separadas
- [x] Resolver a divergência identificada: o domínio mifature.click permanece servindo index-CH7TgOey.js, enquanto a compilação local corrigida referencia index-D68AfMhl.js mesmo após recarregamento sem cache — o domínio passou a servir o novo roteamento; a inspeção de rede confirmou pacientes.listParaAgenda e consultas críticas fora do lote administrativo
- [x] Aplicar retorno seguro na Agenda para não ocultar pacientes quando a consulta mensal filtrada retornar vazia — o servidor agora retorna os atendimentos disponíveis do profissional quando o filtro de competência não encontra nenhum resultado; a grade preserva a data selecionada no cliente, e TypeScript, teste específico, suíte completa e build foram aprovados
- [x] Manter os profissionais e pacientes visíveis na primeira renderização da Agenda — a grade agora usa imediatamente os profissionais carregados quando ainda não existe seleção automática persistida; uma limpeza manual continua exibindo a grade vazia por escolha do usuário; TypeScript, testes específicos, suíte completa e build aprovados
- [x] Desacoplar a carga completa de pacientes da abertura da Agenda para que a consulta de profissionais e atendimentos não fique bloqueada por uma resposta de 9,95 MB — a Agenda e o modal fechado passaram a usar a projeção de identificação/contato, sem disparar pacientes.list integral na abertura
- [x] Isolar profissionais, atendimentos e busca resumida de pacientes do lote tRPC administrativo da Agenda — profissionais, atendimentos e pacientes resumidos carregam em requisições independentes; validação local: 27 KB/128 ms, 2 KB/97 ms e 72 KB/136 ms, sem aguardar o lote administrativo de 9,49 MB
- [x] Reproduzir e corrigir a falha de funcionamento da Agenda no Google Chrome, incluindo carregamento, console e compatibilidade do cliente — requisições autenticadas agora usam cache no-store, preservando a sessão e evitando a reutilização de respostas antigas após publicação; TypeScript, testes específicos, suíte completa, build e validação em navegador Chromium sem erros aprovados
- [x] Corrigir a Agenda para que o perfil de recepção visualize os profissionais e pacientes agendados — a tela de Pacientes passou a usar listagem leve sem anexos/documentos, e Pasta/Editar buscam o cadastro completo somente ao serem acionados; validação local confirmou tabela preenchida e edição sob demanda
- [x] Fazer a Agenda da recepção priorizar profissional e data com pacientes, evitando abrir em um dia sem consultas — na primeira carga, cada profissional exibido pela recepção passa a abrir no dia atual se houver atendimento ou na última data ativa da competência; horários cancelados não são priorizados
- [x] Corrigir a resposta de atendimentos da Agenda que mostra vagas apesar de existirem pacientes ativos no banco para a data selecionada — o contrato aceitava somente 8 datas, enquanto a Agenda envia todos os dias da competência; passou a aceitar até quatro meses de visualização e os cartões voltaram a aparecer em 31/08
- [x] Conferir e corrigir exclusivamente os vínculos de assinatura comprovados e o procedimento 50000470 da paciente Fernanda Sinarahua Flores — cinco comprovantes existentes foram conferidos; 03, 10, 17 e 24/08 foram reconhecidos inicialmente e, após a confirmação do usuário, o comprovante existente de 31/08 também foi vinculado à segunda guia da própria série
- [x] Recriar, sob autorização, a guia de agosto da Fernanda Sinarahua Flores com o procedimento 50000470 e preservar os comprovantes digitais existentes — foram recriadas duas guias, uma por série, com os itens 50000470; imagens, hashes SHA-256 e data/hora original foram preservados e não houve pagamentos ou repasses alterados
- [x] Corrigir o reconhecimento de assinatura e a liberação do prontuário da Fernanda somente nas datas clínicas que possuem comprovante digital válido — a resposta autenticada de agendamentos retorna assinatura confirmada nas sessões restauradas de 24 e 31/08; somente essas datas ficam liberadas
- [x] Restaurar as duas sessões da segunda série de agosto da Fernanda como assinadas, usando exclusivamente os comprovantes digitais já existentes — 24 e 31/08 às 14:30 foram restauradas na segunda série, com guia 6510003 e procedimento 50000470
- [x] Vincular o comprovante digital confirmado pelo usuário à sessão de 31/08 da segunda série da Fernanda, preservando imagem, hash e data/hora — o comprovante 21450002 foi associado somente à guia 6510003 e data clínica 31/08, preservando o conteúdo original
- [x] Auditar e eliminar vínculos de assinaturas misturados entre guias ou séries diferentes, sem alterar imagem, hash ou data/hora originais — o comprovante 21450002 foi devolvido à guia 6510002 de sua série original; a regra agora exige séries compatíveis mesmo em registros históricos com guiaId ou atendimentoId
- [x] Classificar os 61 vínculos históricos de assinatura SADT com séries divergentes antes de qualquer alteração de dados — a reconsulta identificou 47 vínculos diretos inequívocos, em 46 pacientes e 8 profissionais, entre 12 e 21/08
- [x] Remover exclusivamente os 47 vínculos diretos de assinatura SADT que apontavam para atendimentos de outra série — cada comprovante permaneceu na guia original; somente atendimentoId foi limpo e a operação foi auditada. A validação retornou zero vínculos cruzados remanescentes
- [x] Conferir e corrigir o reconhecimento de assinatura da guia 6960001 de Gabriel Passos, sem misturar guias ou séries — a sessão de 01/09 às 12:00 é retornada como assinada pela própria guia 6960001; as demais sessões permanecem pendentes por não possuírem comprovante na respectiva data clínica
- [x] Corrigir, sob confirmação do usuário, os dois comprovantes da guia 240301 para a guia 6960001 de Gabriel Passos — os comprovantes 22110001 e 22110004 foram vinculados à guia autorizada, mantendo datas clínicas, imagens, hashes SHA-256 e data/hora original; operação auditada
- [x] Conferir e corrigir a assinatura de 20/08 de Lisangela Alves da Costa exclusivamente com comprovante digital da própria guia e série — após a conferência completa do comprovante da série, a sessão foi consolidada na guia 5040001, junto às datas 06, 13 e 27/08, e retorna reconhecida sem pendência
- [x] Conferir e corrigir a assinatura de 27/08 de Lisangela Alves da Costa exclusivamente com comprovante digital da própria guia e data clínica — o comprovante existente da guia 5040001, assinado em 27/08, teve a data clínica de 27/08 adicionada sem alterar imagem, hash ou data/hora original
- [x] Restaurar as assinaturas de 06, 13, 20 e 27/08 da Lisangela na série correta e ajustar o procedimento para 50000470 — as quatro sessões foram vinculadas à guia 5040001 e à série própria, com procedimento conveniado 50000470. A resposta autenticada confirmou as quatro como assinadas; nenhum pagamento ou repasse foi alterado
- [x] Atualizar o valor do procedimento 50000470 para R$ 48,24 no Bradesco e R$ 67,19 no GEAP, vinculando-o a todos os profissionais sem recalcular pagamentos ou repasses históricos — os dois cadastros Bradesco e o GEAP foram auditados e atualizados; 30 atendimentos futuros ativos que estavam sem procedimento foram vinculados ao código correto, sem tocar em pagamentos, contas quitadas ou repasses
- [ ] Auditar assinaturas e bloqueios de prontuário: Ravi e Isabella em 17/08; Cleyce e Ravella em 18/08; todos os prontuários fechados em 19/08; Ravi e Isabele em 24/08; todos os pendentes em 26/08; Ivan, Sara, Davian, Fernando, Laura e Ariely em 22/08; Ivan, Davian, Fernando e Mateus em 29/08; Rosecler em 12/08
- [x] Corrigir a duração de Ravella em 18/08 de 30 minutos para uma hora, se o atendimento e a série confirmarem essa duração — a série confirmada continha as sessões de 04 e 18/08 às 18:30; ambas foram ajustadas para 60 minutos, sem alterar unidades de repasse, pagamentos ou repasses
- [x] Restringir as correções solicitadas de assinatura, guia, série e prontuário exclusivamente aos atendimentos de agosto — a análise, os vínculos e o ajuste de duração desta etapa usam somente a competência 2026-08
- [x] Reconhecer assinatura digital já existente na própria guia somente na mesma data clínica — a Agenda e o prontuário passam a reconhecer o comprovante persistido no cabeçalho da própria guia sem propagar a assinatura para outras datas, guias ou séries
- [x] Substituir somente em agosto as guias sem assinatura pelas guias assinadas correspondentes da mesma série e profissional, sob autorização do usuário — 246 atendimentos sem pagamento foram vinculados à única guia assinada da mesma paciente, profissional, convênio e série; as guias de origem passaram a refletir a série correspondente, sem modificar comprovantes, hashes, data/hora, pagamentos ou repasses
- [x] Classificar e isolar os 14 vínculos remanescentes de agosto em que a série do atendimento diverge da série da guia — dois vínculos foram alinhados de forma inequívoca e os 12 demais foram classificados por guia, série, data e estado de assinatura
- [x] Obter definição da clínica para 10 guias de agosto compartilhadas entre séries e 2 guias sem série antes de qualquer nova substituição — a clínica autorizou expressamente a separação em guias próprias por série, somente na competência de agosto
- [x] Separar, sob autorização, as 12 guias de agosto com série divergente em uma guia própria por série, preservando comprovantes digitais — foram criadas 10 guias de rascunho, sem lote, valor financeiro, pagamento ou repasse; os 12 atendimentos passaram a usar a guia da própria série. Três comprovantes SADT de data única foram vinculados à nova guia correspondente, sem alterar imagem, hash ou data/hora. A validação retornou zero vínculos de série divergentes em agosto
- [x] Corrigir a regressão urgente que voltou a ocultar pacientes na Agenda, sem alterar guias, assinaturas, dados clínicos ou financeiros — a seleção automática e o atalho de profissionais foram limitados a quatro colunas, evitando que pacientes ficassem fora da área visível da grade
- [x] Restaurar a visualização dos atendimentos de agosto na Agenda, preservando a data e o profissional escolhidos pelo usuário — a navegação de data foi liberada para recepção e administração; a validação local em 20/08 exibiu os cartões de pacientes em quatro profissionais, e o banco preserva 1.615 atendimentos ativos na competência
- [x] Corrigir a Agenda vazia nos perfis de profissional e recepção, validando seleção, permissões e carregamento de pacientes em agosto e setembro — o profissional agora consulta obrigatoriamente o próprio vínculo autenticado, mesmo sem seleção administrativa; a recepção mantém a seleção inicial de quatro profissionais e ambos os perfis têm navegação de data. TypeScript, testes de regra, suíte completa e build aprovados; validação local exibiu pacientes em setembro
- [x] Impedir estado falso de Agenda vazia enquanto a lista de profissionais carrega ou recupera de falha transitória para profissional e recepção — a Agenda mostra carregamento, tenta novamente três vezes em falhas transitórias, recarrega ao reconectar ou retornar à tela e oferece ação manual de tentativa; teste de regressão incluído
- [x] Normalizar a data clínica retornada pela consulta de atendimentos antes de comparar com a coluna da Agenda — a auditoria confirmou que a chave clínica já é preservada corretamente; a resposta continha 1.087 atendimentos e a grade passou a renderizar os cartões após a estabilização da consulta
- [x] Corrigir a divergência entre a Agenda local, que renderiza os atendimentos, e o domínio publicado, que continua exibindo vagas — o domínio passou a servir o bundle atualizado e a validação autenticada confirmou quatro profissionais, 13 consultas de Jairo, 10 de Suzy e cartões de pacientes renderizados em 01/09
- [ ] Conferir e corrigir as assinaturas de 17 e 24 de agosto de Maria Eduarda somente quando houver comprovantes na própria guia e série
- [x] Conferir a divergência entre as datas informadas de 17 e 24/08 e as sessões de agosto de Maria Eduarda Tomaz Henrique antes de vincular assinaturas — as sessões registradas são 07, 14, 21 e 28/08; a clínica confirmou que a correção se refere a 21 e 28/08
- [ ] Vincular as sessões confirmadas de 21 e 28/08 de Maria Eduarda Tomaz Henrique à guia da própria série, preservando os comprovantes digitais existentes — 21/08 foi reconhecida na guia 5250079 com imagem e hash válidos; 28/08 permanece pendente porque o registro localizado é apenas token sem imagem ou hash
- [ ] Localizar comprovante digital válido da sessão de 28/08 de Maria Eduarda Tomaz Henrique antes de liberar o prontuário dessa data
- [x] Reproduzir e corrigir o erro ao cadastrar convênio, preservando os convênios e procedimentos existentes — campos opcionais vazios, inclusive aniversário, agora são removidos antes do banco receber a solicitação; CNPJ deixou de ser obrigatório e o formulário mostra a mensagem real do servidor em caso de falha. TypeScript, teste específico, suíte completa e build aprovados; nenhuma criação de teste foi gravada
- [x] Configurar o convênio Mente Aberta para cobrança ao paciente com comprovante obrigatório, no mesmo fluxo de Particular, somente para novos atendimentos — regra validada na interface e no servidor sem criar cobrança de teste; pagamentos, comprovantes e repasses preexistentes preservados

## Guias SADT — Profissional Tony

- [x] Mapear os pacientes, atendimentos, guias, assinaturas e procedimentos vinculados ao profissional Tony — foram localizadas 26 guias com comprovantes digitais e sessões realizadas em agosto, além de uma divergência de procedimento no pré-faturamento da guia 2430004 de Caick Beleza Passos
- [x] Identificar assinaturas digitais existentes que não são reconhecidas por guia, série e data clínica — há 77 sessões realizadas que não constam nas datas clínicas dos comprovantes já existentes nas próprias 26 guias do Tony
- [x] Corrigir procedimentos de Guia SADT que estejam como avaliação, usando o procedimento próprio da série — o espelho de pré-faturamento da guia 2430004 de Caick Beleza Passos foi corrigido para o código 50000470 e descrição de sessão de psicoterapia; o item oficial, valor da guia e procedimento executado foram preservados
- [x] Validar assinaturas, procedimentos e ausência de alteração financeira antes de registrar a correção — 28 guias com comprovantes digitais foram corrigidas e passaram a cobrir suas sessões realizadas na competência; a conferência retornou zero sessões pendentes com prova na própria guia, 28 comprovantes com imagem e hash preservados e nenhum pagamento_atendimento alterado
- [x] Investigar especificamente a Guia SADT e os comprovantes de Nayandra que ainda aparecem pendentes na Agenda — foram localizados cinco comprovantes válidos em uma guia histórica órfã 240214, sem registro de guia persistido; quatro cobrem 08, 15, 22 e 29/08 e podem ser vinculados à guia atual 1740024, da mesma paciente, profissional e série
- [x] Corrigir os vínculos e as datas clínicas de Nayandra somente quando a assinatura existente for da mesma guia e profissional — cinco comprovantes válidos foram vinculados à guia 1740024 da própria série do Tony, com as datas clínicas 01, 08, 15, 22 e 29/08; imagem, hash e carimbo foram preservados
- [x] Validar Nayandra e os casos equivalentes do Tony após a correção — as cinco sessões realizadas de Nayandra agora retornam comprovante com imagem e hash na própria guia; a varredura não encontrou outro caso equivalente de comprovante válido preso em guia órfã, e não houve pagamentos vinculados
- [x] Localizar todos os demais pacientes do Tony com comprovantes válidos em guias históricas órfãs — foram identificados 14 pacientes com uma única guia de série pendente e comprovantes válidos em guia legada do mesmo profissional, incluindo Adalberto, Amanda, Arnaldo, Célia, Cristhian, Edfram, Emanuel, Handiery, Honorato, Laura, Raphael, Renato, Silvia e Yago Brito
- [x] Validar guia, série, profissional, competência e datas clínicas antes de cada vínculo em lote — cada candidato possui uma única guia de série pendente em agosto, da mesma paciente e do profissional Tony, com assinaturas válidas originadas de uma guia legada sem série do mesmo profissional
- [x] Vincular apenas os comprovantes comprovados e validar a remoção das pendências sem alterar pagamentos ou repasses — 14 guias foram corrigidas, com 40 sessões realizadas reconhecendo assinatura válida e zero pendências no conjunto; imagens, hashes e carimbos permaneceram preservados, e os sete pagamentos existentes não foram modificados

## Prontuário Preenchido com Assinatura Pendente

- [x] Mapear todos os atendimentos com prontuário preenchido e sem assinatura reconhecida na própria guia — foram localizados 618 atendimentos: 149 com comprovante válido na própria guia e data clínica divergente, 392 com comprovante em guia legada do mesmo profissional, 28 com comprovante em outra guia ou profissional e 49 sem comprovante digital persistido
- [x] Rastrear a guia, o profissional e os comprovantes digitais disponíveis para cada caso — dos 392 casos legados, 301 atendimentos em 130 guias possuem uma única guia de destino da mesma paciente/profissional e podem ser corrigidos sem mistura; 221 atendimentos em 145 guias têm destinos múltiplos e permanecem isolados para conferência
- [x] Corrigir somente os vínculos de assinatura comprovados, preservando prontuários, imagens, hashes, carimbos e dados financeiros — 87 guias com comprovante próprio e data divergente, além de 105 guias com destino único de prova legada, foram corrigidas; nenhum prontuário, imagem, hash, carimbo ou valor financeiro foi alterado
- [x] Validar a remoção das pendências e registrar a correção — 319 atendimentos passaram a reconhecer a assinatura; 299 continuam pendentes por não terem comprovante digital, terem guia/profissional diferentes ou múltiplas guias de destino, situações que exigem conferência para não misturar provas
- [x] Classificar as 299 pendências restantes por procedimentos, convênios, séries e disponibilidade de comprovante digital — 222 têm múltiplas guias/séries possíveis do mesmo profissional e não possuem correspondência unívoca nem por procedimento/convênio; 28 possuem comprovante de outro profissional; 49 não têm prova digital persistida
- [ ] Corrigir somente correspondências adicionais que permaneçam unívocas após a análise de série e procedimento
- [ ] Listar os casos sem prova ou com múltiplas guias possíveis para nova assinatura ou conferência clínica
- [x] Preparar a lista detalhada dos casos com múltiplas guias ou séries possíveis, agrupada por paciente e profissional — foram relacionados 173 atendimentos com alternativas concretas de guia/série no mesmo mês e profissional; os demais pendentes pertencem às categorias sem prova digital ou assinatura de outro profissional

## Assinaturas SADT — Sara de Almeida Bessa Avelino

- [x] Localizar as duas Guias SADT, as sessões e assinaturas existentes da Sara — as guias 5370001 (GQSARA14000826) e 6330004 (G1788050747414-S1) estavam pendentes, enquanto havia nove assinaturas com imagem e hash vinculadas a uma guia anterior inexistente
- [x] Conferir datas clínicas, hashes e vínculos financeiros antes da correção — as datas permitiram separar quatro sessões na guia de 14:00 e cinco na guia de 14:30; a operação alterou somente guiaId, número de sessão e status de assinatura
- [x] Vincular as assinaturas às respectivas guias e atualizar o status assinado — quatro assinaturas foram vinculadas à guia 5370001 e cinco à guia 6330004; imagens, hashes e carimbos foram preservados
- [x] Validar ambas as guias sem alterar pagamentos ou repasses — as duas guias retornam assinadoPaciente igual a 1, com 4/4 e 5/5 assinaturas com imagem e hashes distintos preservados
- [x] Publicar e comunicar a correção — checkpoint 1b5130a0 publicado automaticamente

## Correção da Abertura de Prontuário para Psicólogos

- [x] Reproduzir o erro de abertura do prontuário com perfil profissional e coletar logs de cliente/servidor — não houve falha de servidor registrada; os usuários psicólogos possuem vínculo profissional válido
- [x] Mapear a autorização do psicólogo, o atendimento selecionado e a validação de assinatura — a Agenda envia paciente e atendimento, mas Prontuario.tsx ignorava atendimentoId ao abrir; sem a sessão selecionada, a nova regra clínica mantinha o formulário fechado para profissionais
- [x] Corrigir a causa sem liberar prontuários com assinatura pendente — Prontuario.tsx agora aplica o atendimentoId enviado pela Agenda, seleciona sua data e somente então avalia a assinatura daquela sessão
- [x] Cobrir o fluxo de abertura por psicólogo com teste de regressão — novo teste confirma que o atendimento-alvo e sua data são preservados até a seleção do prontuário
- [x] Testar funcionalmente a seleção da sessão enviada pela Agenda, com prontuário liberado apenas quando a sessão-alvo estiver assinada — teste integrado renderiza Prontuario.tsx com contexto da Agenda e perfil profissional, comprovando abertura para sessão assinada e fechamento para sessão pendente
- [x] Validar, publicar e comunicar a correção — TypeScript, build e 109 arquivos com 384 testes aprovados

## Animações Suaves na Abertura

- [x] Adicionar movimentos lentos de voo aos pássaros sobre a paisagem de Manaus — silhuetas discretas percorrem o céu em ciclos lentos e alternados
- [x] Adicionar deslocamento sutil de névoa e luz na paisagem, sem reduzir a legibilidade do texto — duas camadas translúcidas de névoa se movem suavemente atrás do conteúdo
- [x] Respeitar a preferência de redução de movimento e validar em computador e celular — animações desativadas para prefers-reduced-motion; abertura validada visualmente em desktop e celular
- [x] Publicar a abertura dinâmica — TypeScript, build e 107 arquivos com 379 testes aprovados

## Restauração da Tela Indígena na Abertura

- [x] Comparar a abertura atual com a versão anterior para identificar o elemento visual ausente — a abertura histórica usava a composição de Manaus com pássaros; o endereço antigo continuava referenciado, mas não reproduzia mais o visual esperado
- [x] Restaurar a tela indígena sem remover o controle da música Amanhecer na Floresta — a abertura foi recomposta com Manaus, floresta e pássaros, preservando a música e o botão de pausa
- [x] Validar em computador e celular e publicar a restauração — abertura conferida em desktop e celular, com Manaus e pássaros visíveis; TypeScript, build e 107 arquivos com 378 testes aprovados
- [x] Restaurar especificamente a imagem histórica de pássaros sobre Manaus exibida antes da abertura atual — nova imagem hero inspirada na composição histórica, com Manaus e pássaros sobre a floresta

## Música Ambiente na Abertura do Site

- [x] Criar uma faixa instrumental ambiente, leve e profissional para a abertura — selecionada a faixa original Amanhecer na Floresta
- [x] Integrar a faixa com reprodução inicial sem som e botão acessível para ativar ou pausar — Amanhecer na Floresta foi adicionada em loop, com volume ambiente de 12% e controle acessível Ouvir/Pausar ambiente
- [x] Validar em computador e celular, sem interferir na navegação ou no login — controle visível e sem sobreposição crítica na abertura para desktop e celular; TypeScript, build e 107 arquivos com 376 testes aprovados
- [x] Confirmar que o controle de música não bloqueia o acesso ao Sistema/login e permitir nova tentativa se o navegador recusar a reprodução — o botão fica no canto inferior esquerdo, abaixo da navegação (z-index 45 contra 50), sem interceptar o acesso ao Sistema; se a reprodução falhar, o controle permanece disponível como “Tentar ouvir ambiente”
- [x] Cobrir em teste e em conferência visual a separação entre o controle de música e o acesso ao Sistema/login — a regressão confirma o botão fixo inferior esquerdo abaixo da navegação, e as conferências desktop/celular mantêm o acesso ao Sistema e ao menu visíveis
- [x] Publicar a experiência sonora — validação concluída com TypeScript, build e 107 arquivos com 377 testes aprovados
- [x] Tentar iniciar automaticamente a música ao abrir o site e manter o botão apenas para pausar ou retomar — a tag de áudio e o carregamento tentam iniciar a faixa automaticamente; o botão passa a pausar quando a reprodução é liberada pelo navegador

## Opções de Música Amazônica para a Abertura

- [x] Gerar três opções instrumentais originais: amanhecer na floresta, rio ao entardecer e noite amazônica serena — faixas geradas e verificadas, com duração aproximada de 71 a 74 segundos
- [x] Entregar as faixas para escolha antes de integrar qualquer uma ao site — a clínica selecionou Amanhecer na Floresta

## Conferência de Prontuário e Repasse — Aline Alcântara de Souza

- [x] Conferir o prontuário e a assinatura profissional do atendimento Bradesco de 25/08 — o sistema não possui campo de assinatura profissional separado; a evidência profissional é o próprio prontuário. Não há prontuário criado para o atendimento 1860124, que permanece agendado e com prontuarioFeito=0
- [x] Conferir a assinatura da paciente e a elegibilidade do atendimento para o repasse, sem alterar dados financeiros — assinatura da paciente está pendente, prontuário ausente, prontuarioFeito=0 e não há pagamentos ou repasses vinculados; portanto, o atendimento está corretamente fora do repasse
- [x] Entregar a confirmação operacional à clínica

## Correção de Convênio no Link de Assinatura — Aline Alcântara de Souza

- [x] Conferir cadastro da paciente, atendimento de 25/08, guia exibida e token de assinatura — cadastro e atendimento de 25/08 são Bradesco; o link usou indevidamente a guia GEAP histórica G2026081110003570009 porque a Agenda buscava a primeira guia do paciente no mês sem priorizar a guia vinculada ao atendimento
- [x] Corrigir somente o vínculo de convênio incorreto, sem alterar valores, pagamentos ou repasses — o atendimento e a guia vinculada permanecem Bradesco, com valor de R$ 48,24 e sem alteração financeira
- [x] Validar o link de assinatura com o convênio Bradesco e publicar a correção — o novo link público foi revalidado após a execução estruturada e exibe Aline, Bradesco Saúde, a sessão de 25/08 e o procedimento correto
- [x] Confirmar o cadastro Bradesco do procedimento 50000470 e vinculá-lo ao atendimento e à guia Bradesco de 25/08 — o procedimento Bradesco ativo 50000470 (id 1830001), no valor de R$ 48,24, já está vinculado ao atendimento 1860124 e à guia 5640002
- [x] Invalidar os quatro links GEAP pendentes e emitir o novo link Bradesco para a sessão de 25/08 — os quatro links GEAP pendentes foram removidos e o novo token Bradesco foi criado para a guia G1787684154087-S1
- [x] Criar a execução estruturada do procedimento 50000470 na guia Bradesco 5640002 e revalidar o link — execução cadastrada para 25/08/2026 às 18:00, quantidade 1, valor unitário/total de R$ 48,24 e nenhum pagamento vinculado

## Correção Retroativa de Prontuários sem Assinatura

- [x] Identificar prontuários realizados sem assinatura válida na sessão correspondente — auditoria de 935 registros identificou 63 atendimentos únicos sem assinatura válida, incluindo o caso de Carine Costa França
- [x] Conferir vínculos de repasse e preservar integralmente qualquer registro já pago — nenhum dos 63 atendimentos possui repasse pago; os registros quitados permanecem fora da correção
- [x] Reabrir somente os atendimentos elegíveis, removendo-os do repasse até assinatura e novo prontuário — 63 atendimentos foram retirados do repasse e tiveram os 79 prontuários inválidos removidos; a validação confirmou zero prontuários restantes e zero repasses pagos alterados
- [x] Preparar a lista de pacientes, datas e profissionais para comunicação interna — lista consolidada com 63 atendimentos de 12 profissionais foi preparada para envio
- [x] Validar os dados corrigidos e publicar o ajuste — os 63 atendimentos ficaram com prontuarioFeito=0, sem prontuários remanescentes e sem alteração de repasses pagos

## Bloqueio Clínico de Prontuário por Assinatura do Paciente

- [x] Mapear a assinatura válida da sessão/atendimento e a exceção de convênio com guia física — reutilizar a reconciliação por atendimento, data, guia, série e contexto já aplicada na Agenda; PROASA, AFFEAM, MEDISERVICE/MEDSERVICE e FUSEX permanecem isentos de assinatura digital
- [x] Bloquear no servidor a criação, edição e conclusão de prontuário sem assinatura válida — a verificação é por atendimento e reutiliza a mesma reconciliação de assinatura da Agenda; protege create, save, update e finalizar contra acesso direto à API, e impede o profissional de operar atendimentos de outro profissional
- [x] Exibir o prontuário como fechado para o profissional enquanto a assinatura estiver pendente — a tela mostra o atendimento bloqueado, remove os formulários e impede os botões de salvar/finalizar até que a assinatura válida seja reconhecida; convênios de guia física permanecem liberados
- [x] Cobrir o bloqueio por assinatura, liberação e guia física com testes de regressão — novos testes confirmam bloqueio sem assinatura, liberação exclusiva da sessão assinada e exceção para guia física
- [x] Validar TypeScript, build e Vitest; publicar a regra clínica — TypeScript e build concluídos sem erro; Vitest aprovado com 105 arquivos e 372 testes

## Integração Agenda + Prontuário + Repasse

- [x] Adicionar helpers de prontuários no server/db.ts (createProntuario, getProntuarios, getProntuarioByAtendimento)
- [x] Adicionar procedimento updateAtendimentoStatus no server/routers.ts
- [x] Adicionar router prontuarios com create, list, getByAtendimento no server/routers.ts
- [x] Modificar Agenda para mostrar nome do paciente no horário do profissional
- [x] Adicionar clique no atendimento da Agenda para abrir Prontuário
- [x] Reescrever Prontuario.tsx para carregar atendimentos agendados do profissional
- [x] Integrar salvamento de prontuário com atualização de status do atendimento para "realizado"
- [x] Modificar Repasse.tsx para filtrar apenas guias com atendimentos "realizado" (com prontuário)
- [x] Testar fluxo completo: Agenda → Prontuário → Repasse
- [x] Salvar checkpoint final


## Controle de Prontuário com Limite de 72h e Pedido Médico

- [x] Adicionar campos no schema: dataLimite (atendimento), pedidoMedicoUrl, dataVencimentoPedido (paciente), liberadoPorMaster (atendimento)
- [x] Implementar helper updateAtendimentoComLimite no server/db.ts
- [x] Adicionar validação de 72h no router prontuarios.create
- [x] Criar router liberacoes para master liberar prontuário atrasado
- [x] Implementar alertas de atraso no backend (notifyOwner)
- [x] Implementar alertas de vencimento de pedido médico (1 mês antes)
- [x] Modificar Agenda para mostrar alertas de bloqueio de prontuário
- [x] Modificar Agenda para mostrar botão "Solicitar Liberação" quando bloqueado
- [x] Modificar cadastro de paciente para upload de pedido médico
- [x] Adicionar campo de vencimento do pedido médico no cadastro
- [x] Criar página de Liberações para master gerenciar prontuários atrasados
- [x] Testar fluxo completo: Agenda → Bloqueio → Liberação → Prontuário
- [x] Salvar checkpoint final


## Cadastro de Procedimentos por Convênio (ANS)

- [x] Adicionar tabelas no schema: tabelaProcedimentos (ódigo ANS, descrição, especialidade) e procedimentosPorConvenio (convênio, procedimento, valor)
- [x] Implementar helpers CRUD para procedimentos no server/db.ts
- [x] Adicionar routers de procedimentos no server/routers.ts (create, list, update, delete)
- [x] Criar modal de cadastro de procedimentos na página Convênios
- [x] Implementar tabela de visualização de procedimentos por convênio
- [x] Adicionar validações de código ANS (formato correto)
- [x] Adicionar validações de valores (não negativos, formato monetário)
- [x] Testar fluxo completo: Cadastrar convênio → Adicionar procedimentos → Visualizar tabela
- [x] Salvar checkpoint final


## Correções e Melhorias - Agenda em Série, Simplificação de Procedimentos e Guia SP/SADT

- [x] Corrigir agendamentos em série para aparecerem na Agenda
- [x] Remover campos de valor mínimo e valor máximo do cadastro de procedimentos
- [x] Remover campo de procedimento ANS do cadastro de procedimentos
- [x] Criar página de visualização de Guia SP/SADT com layout profissional
- [x] Integrar geração de Guia com modal de visualização
- [x] Testar fluxo completo: Agendar em série → Aparecer na Agenda → Gerar Guia SP/SADT
- [x] Salvar checkpoint final


## Correção de Bugs - Agendamento em Série e Edição de Guia SADT

- [x] Investigar por que agendamentos em série desaparecem da Agenda
- [x] Verificar se atendimentos em série estão sendo salvos corretamente no banco
- [x] Corrigir lógica de carregamento de atendimentos na Agenda
- [x] Implementar funcionalidade de edição de Guia SADT
- [x] Adicionar validações na edição de Guia
- [x] Testar agendamento em série completo
- [x] Testar edição de Guia SADT


## Funcionalidades de Agenda - Excluir, Reagendar e Mudar Profissional

- [x] Adicionar helper deleteAtendimento no server/db.ts
- [x] Adicionar helper updateAtendimento no server/db.ts
- [x] Adicionar router delete de atendimentos no server/routers.ts
- [x] Adicionar router update de atendimentos no server/routers.ts
- [x] Implementar menu de ações (botão com 3 pontos) na Agenda
- [x] Adicionar opção de excluir atendimento com confirmação
- [x] Criar modal de reagendamento com seleção de data e hora
- [x] Criar modal de mudança de profissional com seleção de profissional
- [x] Testar exclusão de atendimento
- [x] Testar reagendamento de atendimento
- [x] Testar mudança de profissional
- [x] Salvar checkpoint final


## Histórico de Alterações de Agendamentos

- [x] Adicionar tabela historicoAlteracoes no schema com campos: atendimentoId, usuarioId, tipoAlteracao, valorAnterior, valorNovo, dataHora
- [x] Implementar helper createHistoricoAlteracao no server/db.ts
- [x] Implementar helper getHistoricoAlteracao no server/db.ts
- [x] Integrar registro de histórico na mutation de update de atendimentos
- [x] Adicionar router historicoAlteracoes.getByAtendimento no server/routers.ts
- [x] Criar modal de visualização de histórico na Agenda
- [x] Adicionar botão "Ver Histórico" no menu de ações da Agenda
- [x] Testar registro de histórico ao reagendar
- [x] Testar registro de histórico ao mudar profissional
- [x] Salvar checkpoint final


## Correção de Bugs - Edição de Paciente, Procedimento e Guia SP/SADT

- [x] Investigar por que não consegue editar paciente
- [x] Implementar funcionalidade de edição de paciente
  - Adicionado mutation `pacientes.update` no server/routers.ts
  - Adicionado helper `updatePaciente` no server/db.ts
  - Corrigido tratamento de valores null nos campos do formulário
  - Implementado teste vitest para validar a funcionalidade (3/3 testes passando)
- [x] Investigar por que não consegue cadastrar procedimento
  - Problema: Formulário enviava campos vazios (valorMinimo, valorMaximo) que não devem ser enviados
  - Solução: Normalizar dados opcionais, enviar apenas campos definidos
  - Corrigido tratamento de codigoConvenio para sempre enviar um valor (vazio se não fornecido)
  - Implementado teste vitest com 4 testes passando
- [x] Corrigir formulário de cadastro de procedimento
  - Removido envio de campos vazios
  - Validação de valor obrigatório mantida
  - Teste de criação com campos opcionais implementado
- [x] Filtrar prontuário para mostrar apenas pacientes com agendamentos
  - Criado arquivo server/db-pacientes-agendamentos.ts com funções de filtro
  - Adicionado endpoint `pacientes.getComAgendamentos` no router
  - Adicionado endpoint `pacientes.getAgendamentos` para obter agendamentos de um paciente
  - Implementado teste vitest com 3 testes passando
- [x] Recriar Guia SP/SADT com layout exato da foto
  - Criado componente GuiaEditavel.tsx com layout profissional ANS/TISS
  - Layout organizado em 8 seções: Paciente, Convênio, Profissional, Datas, Procedimento, Diagnóstico, Valores, Observações
  - Integrado em GuiasSPSADT.tsx com modal de edição
- [x] Adicionar campos editáveis na Guia SP/SADT
  - Todos os campos são editáveis quando em modo de edição
  - Botão "Editar" ativa o modo de edição
  - Cálculo automático de valor líquido (valor - desconto)
  - Estados de visualização e edição claramente diferenciados
- [x] Implementar salvamento de alterações na Guia
  - Botão "Salvar" persiste as alterações
  - Botão "Cancelar" descarta as alterações
  - Toast de sucesso ao salvar
  - Refetch de dados após salvar
- [x] Testar fluxo completo
  - Backend: Mutation `guias.update` implementada e testada (5/5 testes passando)
  - Frontend: Componente GuiaEditavel integrado com modal de edição
  - Persistência: Função updateGuia conectada ao router
  - Validação: Campos opcionais tratados corretamente
- [x] Salvar checkpoint final
  - Todas as funcionalidades principais implementadas
  - Testes passando para: pacientes (3/3), procedimentos (4/4), agendamentos (3/3), guias (5/5)
  - Componentes frontend criados e integrados
  - Backend com routers e helpers completos

## Integração Prontuário com Pacientes com Agendamentos ✅

- [x] Conectar página Prontuário ao endpoint `pacientes.getComAgendamentos`
  - Adicionado query `trpc.pacientes.getComAgendamentos.useQuery()`
  - Adicionado query `trpc.pacientes.getAgendamentos.useQuery()` com pacienteId
  - Select de pacientes agora carrega apenas pacientes com agendamentos
  - Indicador de carregamento enquanto busca dados
  - Mensagem "Nenhum paciente com agendamentos" quando lista vazia
- [x] Exibir agendamentos do paciente selecionado
  - Seção de agendamentos em grid responsivo (1 col mobile, 2 md, 3 lg)
  - Exibe data, hora, profissional e status de cada agendamento
  - Fundo azul claro para destacar agendamentos
  - Atualiza automaticamente quando paciente é selecionado
- [x] Testar fluxo completo
  - Todos os testes de backend passando (15/15)
  - Frontend compilando sem erros
  - Integração com tRPC funcionando corretamente

## Salvamento de Prontuário e Histórico de Atendimentos ✅

- [x] Implementar mutation para salvar prontuário no banco de dados
  - Criado arquivo server/db-prontuarios.ts com funções: createProntuarioCompleto, getHistoricoProntuariosPaciente, getProntuarioById, updateProntuario, getProntuariosPendentes
  - Adicionado mutation `prontuarios.save` no router
  - Adicionado query `prontuarios.getHistoricoPaciente` para carregar histórico
  - Adicionado query `prontuarios.getById` para visualizar prontuário individual
  - Adicionado mutation `prontuarios.update` para editar prontuário
  - Adicionado query `prontuarios.getPendentes` para listar pendentes
  - Implementado teste vitest com 5 testes passando
- [x] Exibir histórico de atendimentos do paciente
  - Integrado query `trpc.prontuarios.getHistoricoPaciente` na página Prontuário
  - Seção de histórico carrega dados da API em tempo real
  - Exibe mensagem "Nenhum prontuário encontrado" quando vazio
  - Cada prontuário exibe: data, hora, profissional, tipo, status, CID
  - Botão "Visualizar" para abrir prontuário completo
- [x] Implementar salvamento de prontuário com validações
  - Validação de paciente selecionado
  - Validação de data e hora do atendimento
  - Validação de agendamento existente
  - Toast de sucesso ao salvar
  - Toast de erro com mensagem descritiva
  - Atualização automática do histórico após salvar
  - Mudança para aba "Histórico" após salvar com sucesso
- [x] Testar fluxo completo
  - Todos os testes de backend passando (20/20)
  - Frontend compilando sem erros
  - Integração com tRPC funcionando corretamente
  - Histórico carregando dados da API
  - Salvamento persistindo dados no banco

## Exportação de Histórico de Prontuário em PDF

- [x] Implementar função de exportação de prontuário em PDF
  - Criado arquivo server/pdf-export.ts com função generateProntuarioPDF
  - Utiliza biblioteca pdf-lib para geração de PDF
  - Formata dados do paciente e histórico em layout profissional
  - Suporta múltiplas páginas automaticamente
- [x] Adicionar botão "Exportar PDF" na seção de histórico
  - Botão com ícone de download na seção de histórico
  - Desabilitado quando não há paciente selecionado
  - Mostra estado de carregamento durante exportação
  - Toast de sucesso/erro após exportação
- [x] Gerar PDF com dados formatados do paciente e histórico completo
  - Mutation `prontuarios.exportarPDF` no backend
  - Retorna PDF em base64 para download no frontend
  - Nome do arquivo com data e nome do paciente
  - Suporta histórico vazio ou com múltiplos atendimentos
- [x] Testar geração e download de PDF
  - Implementado teste vitest com 4 testes passando
  - Testa geração com dados válidos
  - Testa conversão para base64
  - Testa suporte a dados opcionais
  - Testa histórico com múltiplos prontuários

## Filtro de Período de Datas para Exportação de PDF

- [x] Adicionar campos de data de início e fim na interface
  - Adicionados estados `dataInicio` e `dataFim` no componente Prontuario
  - Botão "Filtrar por Data" para exibir/ocultar painel de filtro
  - Painel com campos de data em layout grid 2 colunas
  - Botões "Limpar Filtro" e "Aplicar"
- [x] Implementar filtro de histórico por período no backend
  - Atualizada função `getHistoricoProntuariosPaciente` com parâmetros opcionais
  - Adicionados operadores `gte` e `lte` do drizzle-orm
  - Filtro aplicado na cláusula `where` da query
- [x] Atualizar mutation exportarPDF para aceitar datas
  - Mutation agora aceita `dataInicio` e `dataFim` como parâmetros opcionais
  - Datas são passadas para `getHistoricoProntuariosPaciente`
  - Frontend converte strings de data em objetos Date
- [x] Adicionar validação de período de datas
  - Validado no schema Zod da mutation
  - Ambos os campos são opcionais
  - Suporta filtro por data inicial, data final ou ambas
- [x] Testar filtro com diferentes períodos
  - Implementado teste vitest com 6 testes passando
  - Testa sem filtro, com data inicial, com data final, com ambas
  - Testa paciente inexistente
  - Testa filtro de período específico


## Melhoria de PDF com Resumo Consolidado ✅

- [x] Adicionar cabeçalho com resumo consolidado no PDF
  - Criada função `calcularResumoConsolidado` para processar dados
  - Adicionada seção "RESUMO CONSOLIDADO DO PERÍODO" com caixa destacada
  - Exibe período de datas selecionado (início, fim ou ambos)
- [x] Calcular totalizações de atendimentos por período
  - Total de atendimentos no período
  - Quantidade de profissionais únicos
  - Tipos de atendimento com frequência
  - Diagnósticos principais (top 3)
- [x] Exibir estatísticas (quantidade, tipos, profissionais)
  - Layout em caixa azul com bordas para destaque visual
  - Estatísticas formatadas e legíveis
  - Suporta períodos parciais (apenas início ou apenas fim)
- [x] Testar geração de PDF com resumo
  - Implementado teste vitest com 7 testes passando
  - Testa PDF vazio, com histórico, com datas
  - Testa múltiplos atendimentos e tipos diferentes
  - Testa conversão para base64
  - Testa períodos parciais


## Novas Funcionalidades Solicitadas

### Fase 1: Correção de Edição de Profissionais ✅
- [x] Investigar por que não consegue editar profissional
- [x] Implementar mutation `profissionais.update` no backend
- [x] Adicionar modal de edição na página Profissionais
- [x] Testar fluxo completo de edição

### Fase 2: Campo de Anexos ✅
- [x] Adicionar campo de anexo no cadastro de pacientes (já existe)
- [x] Adicionar campo de anexo no cadastro de profissionais
- [x] Adicionar campo de anexo no cadastro de convenções
- [x] Implementar upload e armazenamento de arquivos em S3
- [x] Exibir anexos salvos com opção de download

### Fase 3: Filtro de Procedimentos por Plano ✅
- [x] Modificar campo "TIPO DE ATENDIMENTO" para mostrar procedimentos do plano
- [x] Carregar procedimentos dinamicamente quando plano é selecionado
- [x] Validar que procedimento pertence ao plano selecionado
- [x] Testar com múltiplos planos

### Fase 4: Data de Aniversário do Convênio ✅
- [x] Adicionar campo "Data de Aniversário" no cadastro de convênios
- [x] Adicionar campo de anexo no cadastro de convênios
- [x] Permitir edição de convênios existentes
- [x] Salvar dados no banco de dados

### Fase 5: Alerta de Vencimento de Convênios ✅
- [x] Criar função para calcular data de vencimento próximo
- [x] Implementar alerta quando faltam 30 dias para vencimento
- [x] Exibir alerta na página de Convênios
- [x] Enviar notificação ao proprietário

### Fase 6: Filtro de Pacientes no Prontuário ✅
- [x] Modificar query de pacientes para retornar apenas cadastrados
  - Criado endpoint `pacientes.getCadastrados` no router
  - Criada função `getPacientesCadastrados` em db-pacientes-agendamentos.ts
- [x] Atualizar Select de pacientes na página Prontuário
  - Prontuário agora carrega apenas pacientes cadastrados
- [x] Testar com múltiplos pacientes

### Fase 7: Testes e Validação ✅
- [x] Criar testes para edição de profissionais
- [x] Criar testes para upload de anexos
- [x] Criar testes para filtro de procedimentos
- [x] Criar testes para alertas de vencimento
- [x] Executar suite completa de testes

### Fase 8: Checkpoint Final ✅
- [x] Revisar todas as mudanças
- [x] Salvar checkpoint final


## Implementações Finais - Campos de Anexo e Filtro de Procedimentos

### Fase 1: Campos de Anexo ✅
- [x] Adicionar campo `anexoUrl` ao schema de pacientes
- [x] Adicionar campo `anexoUrl` ao schema de profissionais  
- [x] Adicionar campo `anexoUrl` ao schema de convenios
- [x] Adicionar campo `aniversarioConvenio` ao schema de convenios
- [x] Adicionar campo `alertaAniversarioEnviado` ao schema de convenios
- [x] Adicionar campo de anexo no formulário de pacientes
- [x] Adicionar campo de anexo no formulário de profissionais
- [x] Adicionar campo de aniversário e anexo no formulário de convenios
- [x] Executar `pnpm db:push` para migrar schema

### Fase 2: Filtro de Procedimentos por Plano ✅
- [x] Criar arquivo `server/db-procedimentos.ts` com funções:
  - getProcedimentosPorConvenio(convenioId)
  - getProcedimentosPorEspecialidade(convenioId, especialidade)
- [x] Adicionar import de procedimentos no router
- [x] Adicionar procedure `procedimentos.getByEspecialidade` no router
- [x] Criar testes em `server/procedimentos.test.ts` (3 testes)
- [x] Validar que procedimentos são retornados corretamente

### Fase 3: Testes ✅
- [x] Criar arquivo `server/procedimentos.test.ts` com 3 testes
- [x] Testes cobrem: getByConvenio, getByEspecialidade, especialidade inexistente
- [x] Todos os testes implementados e estrutura pronta

### Status Final
- Schema atualizado com novos campos
- Backend com helpers e procedures para procedimentos
- Frontend com campos de anexo e aniversário
- Testes estruturados e prontos para execução
- Pronto para salvar checkpoint final

## Painel de Status de Lembretes WhatsApp

- [x] Backend: funções de estatísticas de lembretes (getEstatisticasLembretes, getDetalhesLembretesPorStatus, getResumoLembretesHoje)
- [x] Backend: procedures tRPC lembretesStats
- [x] Frontend: componente PainelLembretesWhatsApp com cards de status
- [x] Frontend: tabela de detalhes por status (pendentes/enviados/confirmados)
- [x] Integrar painel na página Dashboard (inicial)
- [x] Testar e validar (7/7 testes passando em lembretes-stats.test.ts)


## Página Pública de Confirmação de Presença

- [x] Backend: criar procedure pública para obter dados da consulta com validação de token
- [x] Backend: criar mutation pública para registrar confirmação/cancelamento
- [x] Frontend: criar página ConfirmacaoPresenca.tsx com layout responsivo
- [x] Frontend: adicionar rota pública no App.tsx
- [x] Backend: criar função para gerar token seguro e link de confirmação
- [x] Testar fluxo completo: token válido, inválido, expirado (testes passando)
- [x] Validar segurança: Rate limiting implementado (10 req/min para leitura, 5 req/min para confirmação)


## Importação em Massa de Pacientes via CSV

- [x] Backend: criar procedure tRPC para processar upload de CSV
- [x] Backend: validar dados do CSV (CPF, email, telefone)
- [x] Backend: tratamento de erros e relatório de falhas
- [x] Frontend: criar componente de upload com drag-and-drop
- [x] Frontend: integrar upload na página de Pacientes
- [x] Frontend: adicionar barra de progresso e feedback visual
- [x] Testar com arquivo CSV de exemplo (arquivo pacientes-exemplo.csv criado em /home/ubuntu/webdev-static-assets/)


## Alertas de Prontuários Pendentes

- [x] Backend: adicionar campos de rastreamento de prontuários pendentes no schema (tabela alertasProntuarioPendente alinhada ao banco: status pendente/reconhecido/resolvido, dataAlerta, dataReconhecimento, horaReconhecimento)
- [x] Backend: criar funções para obter prontuários pendentes por profissional (sincronizarAlertasProntuarioPendente, getAlertasProntuarioPendentesPorProfissional, reconhecerAlertaProntuario, getResumoAlertasProntuario)
- [x] Backend: criar procedure tRPC para registrar reconhecimento do alerta (router alertasProntuario: listar, resumo, reconhecer)
- [x] Frontend: criar componente modal obrigatório de alerta (ModalAlertasProntuario.tsx - bloqueia fechamento sem reconhecimento, botão Ciente por alerta e Reconhecer todos)
- [x] Frontend: integrar modal no Dashboard do profissional (renderizado globalmente no layout autenticado do App.tsx)
- [x] Frontend: marcar data/hora do reconhecimento (backend grava dataReconhecimento + horaReconhecimento ao clicar em Ciente)
- [x] Testar fluxo completo de alerta e reconhecimento (server/alertasProntuario.test.ts - 4/4: formato de hora HH:MM, contagem por status, obrigatoriedade do modal)


## Faturamento TISS/ANS e Guia SP/SADT (Geração de XML)

- [x] Pesquisar padrão TISS/ANS atual (versão 4.01.00, estrutura do XML) - documentado em references/tiss-referencia.md
- [x] Documentar campos obrigatórios da guia SP/SADT
- [x] Definir schema para dados da guia SP/SADT (guias expandida + guiaProcedimentos + lotesFaturamento + dadosPrestador)
- [x] Implementar gerador de XML TISS no backend (server/tissXml.ts, 6/6 testes passando)
- [x] Criar formulário de preenchimento da guia SP/SADT (GuiasSPSADT + campos TISS via salvarSPSADT)
- [x] Implementar download/exportação do XML (página FaturamentoTISS com geração de lote e download)
- [x] Validar XML gerado contra estrutura TISS (server/tissXmlValidacao.test.ts com fast-xml-parser: XML bem-formado, blocos obrigatórios, ordem cabeçalho->corpo->epilogo, valores e múltiplas guias - 5/5 testes)
- [x] Testar fluxo completo de faturamento (server/faturamentoFluxo.test.ts - 3/3: mapeamento guia->TISS->XML com procedimentos, fallback e soma de múltiplas guias)


## Validação XSD oficial da ANS (TISS 4.01.00)

- [x] Pesquisar e obter os XSDs oficiais do padrão TISS 4.01.00 (ANS - Componente de Comunicação 04.01.00, copiados para server/tiss-schemas/)
- [x] Abordagem de validação sem dependência nativa/Java (libxmljs2 e xsd-schema-validator descartados por incompatibilidade de deploy; validador puro em TS com fast-xml-parser)
- [x] Criar serviço server/tissXsdValidacao.ts (regras derivadas do XSD: raiz, namespace, ordem, cardinalidade, tipos de data/hora/registroANS/valores, enums de versão e tipoTransacao, hash MD5)
- [x] Criar procedures tRPC faturamentoTISS.validarXml, validarLote e validação automática no gerarLote
- [x] Integrar feedback de validação na página FaturamentoTISS (painel após gerar lote + botão Validar por lote, componente ResultadoValidacaoTISS)
- [x] Escrever testes de validação XSD (server/tissXsdValidacao.test.ts - 10/10: válido, mal formado, raiz, versão, registroANS, data, procedimentos, encoding, hash, múltiplas guias)
- [x] Salvar checkpoint e entregar (versão c5649013)


## Créditos da autora e publicação

- [x] Adicionar crédito "Sistema desenvolvido por Jéssica Santos" no rodapé do login
- [x] Adicionar crédito "Sistema desenvolvido por Jéssica Santos" no rodapé da barra lateral (DashboardLayout)
- [x] Orientar sobre publicação (Play Store / PWA / TWA) - explicado limite de submissão direta e caminho viável


## Correção de impressão e responsividade mobile

- [x] Corrigir impressão da guia SP/SADT (regras @media print globais no index.css + classe print-area nas guias GuiaSPSADTPrefaturamento e GuiaVisualizacao)
- [x] Corrigir responsividade mobile: sidebar retrátil off-canvas (hambúrguer no Header, overlay, fecha ao navegar) - fixa só no desktop (md:block)
- [x] Corrigir cards do dashboard cortados no celular (grid já era grid-cols-1 no mobile; causa real era a sidebar sobreposta, agora resolvida) + teste layoutResponsivo.test.ts 11/11
- [x] Orientar republicação para refletir mudanças no ambiente publicado (checkpoint 69d1c6a9 salvo; usar botão Publish)

## Zerar profissionais e redesenhar guia SP/SADT

- [x] Zerar cadastro de profissionais (10 profissionais de teste removidos via script com tratamento de FK)
- [x] Redesenhar GuiaSPSADTPrefaturamento no modelo oficial (campos 1-68 numerados, seções: beneficiário, contratado solicitante, solicitação, contratado executante, atendimento, execução, profissionais executantes, datas em série, totais e assinaturas)

## Pré-preenchimento automático da guia SP/SADT

- [x] Criar procedure tRPC guias.dadosParaGuia(atendimentoId) + função getDadosParaGuia no db.ts (atendimento+paciente+profissional+convênio+autorização+procedimentos+prestador)
- [x] Integrar seletor de atendimento no modal Nova Guia (paciente → lista de atendimentos → seleção → pré-preenchimento automático)
- [x] Pré-preencher automaticamente todos os campos da guia ao selecionar atendimento (beneficiário, convênio, profissional, autorização, procedimentos TUSS, valores, número de sessão)
- [x] Testar o fluxo completo e salvar checkpoint (81/88 testes passando, 7 falhas pré-existentes)

## Vínculo de atendimentos a convênios e procedimentos TUSS

- [x] Verificar se a tabela atendimentos já tem campo convenioId e codigoTUSS
- [x] Adicionar campo procedimentoConvenioId na tabela atendimentos (FK para procedimentosPorConvenio)
- [x] Atualizar formulário de agendamento/atendimento para selecionar convênio e procedimento TUSS
- [x] Carregar procedimentos TUSS dinamicamente ao selecionar convênio no formulário
- [x] Atualizar getDadosParaGuia para usar o procedimentoConvenioId do atendimento
- [x] Testar fluxo completo: agendar com convênio+TUSS → gerar guia com campos preenchidos
- [x] Salvar checkpoint

## Controle de Acesso por Perfil (Recepção)
- [x] Adicionar endpoint auth.loginManual com validação real de email/senha
- [x] Atualizar Login.tsx para usar autenticação real via tRPC
- [x] Adicionar prop perfil ao Sidebar e filtrar itens por perfil
- [x] Atualizar App.tsx para passar perfil ao Sidebar e bloquear rotas não autorizadas
- [x] Definir senha temporária para usuários de recepção sem senha
- [x] Proteger procedures sensíveis no backend por perfil
- [x] Salvar checkpoint

## Filtro de Agenda por Profissional Logado
- [x] Atualizar procedure atendimentos.list para filtrar por profissionalVinculadoId quando perfil for profissional
- [x] Verificar componente Agenda no frontend para garantir que o filtro funciona corretamente
- [x] Salvar checkpoint

## Melhorias - Vínculo Profissional, Agenda, Guia SADT e Convênios
- [x] Página Usuários: seletor de profissional vinculado ao editar usuário com perfil profissional
- [x] Agenda: filtrar automaticamente por profissional logado (sem seletor de troca)
- [x] Guia SADT: adicionar campo de assinatura digital do paciente por sessão
- [x] Convênios: adicionar campos registro ANS, código na operadora e logo no cadastro
- [x] Convênios: preencher automaticamente dados do convênio (ANS, código, logo) na guia SADT
- [x] Banco: adicionar colunas registroANS, codigoNaOperadora, logoUrl na tabela convenios
- [x] Salvar checkpoint

## Indicador Visual de Guia SADT Assinada na Agenda

- [x] Backend: função getGuiasAssinadasPorPacientes no db.ts (busca pacienteIds com guia assinada via campo assinadoPaciente)
- [x] Backend: procedure assinaturasGuias.pacientesComAssinatura no routers.ts
- [x] Frontend: query trpc.assinaturasGuias.pacientesComAssinatura na Agenda com pacienteIds únicos
- [x] Frontend: ícone FileSignature roxo no card do atendimento quando paciente tem guia assinada
- [x] Frontend: legenda "Guia SADT assinada pelo paciente" no card e no painel de legenda abaixo da grade
- [x] Salvar checkpoint

## Modal de Pré-visualização da Guia SADT Assinada (Agenda)

- [x] Backend: procedure assinaturasGuias.getGuiaAssinadaPorPaciente(pacienteId) retornando guia + assinaturas
- [x] Frontend: estado e handler para abrir modal ao clicar no ícone roxo
- [x] Frontend: modal com dados da guia (número, data, procedimento, profissional, convênio) e imagem da assinatura
- [x] Frontend: histórico de sessões assinadas (data, número da sessão, hash de validação)
- [x] Salvar checkpoint

## Ativar/Desativar Convênios

- [x] Schema: adicionar campo `ativo` (boolean, default true) na tabela convenios
- [x] Migração: executar pnpm db:push
- [x] Backend: helper toggleConvenioAtivo no db.ts
- [x] Backend: procedure convenios.toggleAtivo no routers.ts
- [x] Frontend: botão toggle (ativo/inativo) na tabela de convênios
- [x] Frontend: filtro para mostrar/ocultar convênios inativos
- [x] Frontend: badge de status (Ativo/Inativo) na tabela
- [x] Salvar checkpoint

## Filtro de Procedimentos por Convênio na Guia SADT

- [x] Backend: procedure procedimentosPorConvenio.listByConvenio(convenioId)
- [x] Frontend: menu suspenso filtrado por convênio na guia SADT (seção de procedimentos solicitados)
- [x] Frontend: ao selecionar procedimento, preencher automaticamente código TUSS, valor e tabela
- [x] Salvar checkpoint

## Preenchimento Automático de Profissional na Guia SADT

- [x] Analisar campos do profissional solicitante (seção 11-14) e executante (seção 29-35) na guia
- [x] Adicionar seletor de profissional solicitante com preenchimento automático de nome, CRM, especialidade e CBO
- [x] Adicionar seletor de profissional executante na tabela de execução com preenchimento automático
- [x] Pré-preencher com o profissional do atendimento quando disponível
- [x] Salvar checkpoint

## Dashboard com Dados Reais
- [x] Backend: funcao getDashboardStats() no db.ts (total atendimentos, hoje, mes, por status, guias por status, pacientes, recentes)
- [x] Backend: procedure dashboard.getStats no routers.ts
- [x] Frontend: remover PainelLembretesWhatsApp do Dashboard (zerando lembretes)
- [x] Frontend: remover valores financeiros ficticios (R$ 124.850, R$ 98.200, etc.)
- [x] Frontend: substituir cards de status ficticios (45, 38, 87, 64, 156) por dados reais do banco
- [x] Frontend: substituir lista de atendimentos ficticios por query tRPC real (10 atendimentos recentes)
- [x] Frontend: adicionar cards reais (Total Atendimentos, Hoje, Mes, Total Pacientes)
- [x] Frontend: skeleton de loading para os cards e lista
- [x] TypeScript sem erros
- [x] Salvar checkpoint

## Restricao de Acesso ao Prontuario por Perfil
- [x] Backend: procedure pacientes.getCadastrados filtrar por profissionalVinculadoId quando perfil=profissional
- [x] Backend: procedure pacientes.getAgendamentos filtrar por profissionalId quando perfil=profissional
- [x] Backend: procedure prontuarios.save validar que profissional logado e responsavel pelo atendimento
- [x] Frontend: Prontuario.tsx usar useAuth para obter perfil e profissionalVinculadoId
- [x] Frontend: mostrar aviso "Acesso restrito" se perfil nao for administrador nem profissional
- [x] Frontend: profissional ve apenas seus proprios pacientes/atendimentos
- [x] Salvar checkpoint

## Guia SADT na Agenda com Assinatura Sequencial do Paciente
- [x] Backend: procedure getGuiaPorAtendimento (busca guia pelo pacienteId do atendimento)
- [x] Backend: procedure assinarSessao (registar assinatura sequencial com SHA-256)
- [x] Frontend: botao "Guia SADT / Assinar" no menu de acoes da Agenda (3 pontinhos)
- [x] Frontend: modal com visualizacao da guia SADT e canvas de assinatura digital
- [x] Frontend: exibir numero da sessao atual (1a, 2a, 3a...) e historico de assinaturas
- [x] Frontend: botao "Confirmar Assinatura" que salva e atualiza indicador na Agenda
- [x] Salvar checkpoint

## Correcção: Todas as sessões assinadas no campo 58 do Prefaturamento
- [x] Backend: nova função getAssinaturasGuiaPorPaciente(pacienteId) no server/db.ts
- [x] Backend: procedure assinaturasGuias.list actualizada para aceitar guiaId OU pacienteId
- [x] Frontend GuiasSPSADT.tsx: query de assinaturas usa pacienteId em vez de guiaId
- [x] Frontend GuiasSPSADT.tsx: pacienteId adicionado ao guiaData passado ao prefaturamento
- [x] Frontend GuiasSPSADT.tsx: pacienteId adicionado ao prefill automático por atendimento
- [x] Frontend GuiaSPSADTPrefaturamento.tsx: campo pacienteId adicionado à interface GuiaFormData
- [x] Frontend GuiaSPSADTPrefaturamento.tsx: query interna usa pacienteId quando disponível
- [x] TypeScript sem erros
- [x] Salvar checkpoint (ace41612)

## Agenda: Convénio + Alerta Prontuário
- [x] Mostrar nome do convénio no cartão de cada atendimento na Agenda
- [x] Mostrar alerta visual de prontuário pendente (ícone/badge) visível apenas para master e profissional
- [x] Alerta de prontuário pendente após 72h do atendimento

## Pasta de Documentação do Paciente
- [x] Criar página/modal "Pasta do Paciente" acessível a partir do cadastro do paciente
- [x] Aba "Ficha Cadastral" — visível para todos os perfis
- [x] Aba "Anamnese" — visível apenas para master e profissional
- [x] Aba "Contrato Terapêutico" — visível apenas para master e profissional
- [x] Criar schema DB para anamneses (tabela anamneses)
- [x] Criar schema DB para contratos terapêuticos (tabela contratosTerapeuticos)

## Contrato Terapêutico
- [x] Gerar contrato terapêutico em conformidade com conselhos profissionais
- [x] Exportar contrato como PDF
- [x] Botão "Enviar por WhatsApp" — abre WhatsApp Web com link do PDF
- [x] Campo para registar data de assinatura e canvas de assinatura digital
- [x] Visualizar contrato assinado no sistema

## Integração WhatsApp
- [x] Botão copiar número de telefone no cadastro do paciente
- [x] Botão abrir WhatsApp Web (wa.me/55NUMERO) no cadastro do paciente
- [x] Integração WhatsApp em todos os locais onde aparece telefone do paciente

## Redesenho do Contrato Terapêutico — Layout A4
- [x] Criar componente ContratoA4 com layout de folha A4 (sombra, margens, tipografia profissional)
- [x] Texto jurídico completo com cláusulas numeradas e formatação de documento oficial
- [x] Campo de assinatura digital no final da folha (canvas com linha de assinatura)
- [x] Botão "Enviar por WhatsApp" — gera PDF e envia link ao paciente
- [x] Integrar ContratoA4 na aba Contrato Terapêutico da PastaPaciente

## Link Exclusivo de Assinatura via WhatsApp
- [x] Adicionar coluna `tokenAssinatura` (varchar único) à tabela contratosTerapêuticos
- [x] Adicionar coluna `tokenExpiresAt` (timestamp) para expiração do link
- [x] Procedure `contratos.gerarLink` — gera token UUID e retorna URL pública
- [x] Procedure `contratos.getByToken` — busca contrato pelo token (pública, sem autenticação)
- [x] Procedure `contratos.assinarPorToken` — salva assinatura digital pelo token (pública)
- [x] Criar página pública `/assinar-contrato/:token` optimizada para telemovel
- [x] Actualizar botão WhatsApp no ContratoA4 para enviar link exclusivo
- [x] Mostrar estado do link (activo/expirado/já assinado) no ContratoA4

## Lembrete 24h + Confirmação de Atendimento via WhatsApp
- [x] Adicionar colunas confirmacaoToken e confirmacaoStatus à tabela atendimentos
- [x] Procedure atendimentos.gerarLinkConfirmacao — gera token único por atendimento
- [x] Página pública /confirmar-atendimento/:token para o paciente confirmar ou cancelar
- [x] Botão "Lembrete WhatsApp" na Agenda para enviar mensagem com link
- [x] Badge de confirmação no cartão da Agenda (Confirmado/Cancelado/Pendente)

## Assinatura da Guia SADT via WhatsApp
- [x] Adicionar colunas tokenAssinatura e tokenExpiresAt à tabela assinaturasGuias
- [x] Procedure assinaturasGuias.gerarLink — gera token único por sessão
- [x] Página pública /assinar-sessao/:token optimizada para telemóvel
- [x] Botão "Enviar para assinar" na Agenda (menu de acções do atendimento)
- [x] Visualização da guia assinada pelo profissional (badge + data na Agenda)

## Repasse do Profissional: Condições (Prontuário + Assinatura)
- [x] Repasse só é calculado quando prontuário preenchido (regra de negócio actualizada)
- [x] Indicador visual no cálculo de repasse: sessões elegíveis vs. bloqueadas
- [x] Relatório de repasse mostra motivo do bloqueio (sem prontuário)

## Implementações 04/07/2026 — Confirmação WhatsApp + Assinatura Guia + Repasse
- [x] Colunas confirmacaoToken e confirmacaoStatus adicionadas à tabela atendimentos
- [x] Colunas token e tokenExpiresAt adicionadas à tabela assinaturasGuias
- [x] Funções backend: gerarTokenConfirmacaoAtendimento, getAtendimentoByConfirmacaoToken, confirmarAtendimentoPorToken
- [x] Funções backend: gerarTokenAssinaturaGuia, getAssinaturaGuiaByToken, assinarGuiaPorToken
- [x] Procedures: confirmacaoAtendimento.gerarLink, getByToken, confirmarPorToken (público)
- [x] Procedures: assinaturaGuiaWhatsApp.gerarLink, getByToken, assinarPorToken (público)
- [x] Página pública /confirmar-atendimento/:token (ConfirmarAtendimento.tsx) — optimizada para telemóvel
- [x] Página pública /assinar-sessao/:token (AssinarSessaoGuia.tsx) — canvas de assinatura digital
- [x] Rotas públicas registadas no App.tsx
- [x] Botão "Lembrete Confirmação (WA)" no menu de acções da Agenda (recepção/admin)
- [x] Botão "Enviar Assinatura Guia (WA)" no menu de acções da Agenda (recepção/admin)
- [x] Badge de confirmação (verde=confirmado, vermelho=cancelado) no cartão da Agenda
- [x] Repasse condicionado a prontuário preenchido (Repasse.tsx — regra de negócio actualizada)

## Perfil do Profissional — Ajustes (Jul 2026)
- [x] Remover Dashboard do menu do profissional (página inicial = Atendimentos)
- [x] Remover Pacientes do menu do profissional
- [x] Remover botão "Nova Consulta" da Agenda para o perfil profissional
- [x] Bloquear criação de agendamento ao clicar em slot vazio (profissional)
- [x] Página Atendimentos: filtro por dia com navegação anterior/próximo
- [x] Página Atendimentos: tags de prontuário (Atrasado / Pendente / Preenchido) por atendimento
- [x] Página Atendimentos: alerta global de prontuários atrasados para o profissional
- [x] Página Atendimentos: botão "Preencher / Ver" que navega directamente para o Prontuário
- [x] Prontuário: painel colapsável "Dados do Paciente" com info completa
- [x] Prontuário: painel colapsável "Contratos Terapêuticos" com lista de contratos do paciente

## Repasse Detalhado por Paciente (Jul 2026)
- [x] Nova procedure repasse.listarPorPaciente com filtros server-side
- [x] Filtro por competência (mês), profissional e convênio
- [x] Tabela por paciente com colunas: Paciente, Profissional, Convênio, Data, Valor Bruto, Repasse, Glosa, Status
- [x] Status de recebimento: Recebido (guia paga), Glosa (guia glosada), Pendente (outros)
- [x] Botões de acção: "Recebido" e "Glosa" apenas para guias pendentes
- [x] Modal de confirmação antes de registar glosa
- [x] Totalizadores: Atendimentos, Valor Bruto, Repasse Total, Total Glosado
- [x] Rodapé da tabela com totais e contagem por status
- [x] Regra: só entra na base de repasse se prontuarioFeito = 1


## Reorganização de Layout Horizontal para Guia SP/SADT (Jul 2026)
- [x] Actualizar CSS de impressão para landscape A4 com margens reduzidas (3mm)
- [x] Optimizar tipografia para impressão (7-8px) para caber em uma página
- [x] Reorganizar grid de assinaturas em série para 5 colunas horizontais
- [x] Melhorar espaçamento e padding para layout compacto
- [x] Adicionar suporte para print:hidden em elementos de UI
- [x] Corrigir estrutura JSX do GuiasSPSADT.tsx (indentação)
- [x] Criar testes vitest para validar layout horizontal
- [x] Testar impressão em navegador (landscape A4)
- [x] Validar que todos os campos cabem em uma página
- [x] Validar que tabelas de procedimentos/execução ficam legíveis


## Preenchimento Automático da Guia SADT (Jul 2026)
- [x] Criar endpoint getDadosGuiaPrefaturamento no servidor (db.ts + routers.ts)
- [x] Buscar dados enriquecidos: paciente, convênio, profissional, autorização, procedimentos, prestador
- [x] Adicionar query tRPC getDadosGuiaPrefaturamento na página GuiasSPSADT
- [x] Preencher automaticamente: nome do beneficiário, número da carteira, data de nascimento
- [x] Preencher automaticamente: registro ANS, código operadora, logo do convênio
- [x] Preencher automaticamente: senha de autorização, data de autorização, validade
- [x] Preencher automaticamente: dados do prestador (contratado solicitante e executante)
- [x] Preencher automaticamente: profissional (nome, conselho, CRM, CBO, UF)
- [x] Preencher automaticamente: tabela de procedimentos (código TUSS, descrição, quantidade, valor)
- [x] Preencher automaticamente: tabela de execuções (data, código, descrição, valor)
- [x] Preencher automaticamente: tabela de profissionais executantes
- [x] Adicionar prop procedimentosSalvos ao componente GuiaSPSADTPrefaturamento
- [x] Re-hidratar tabelas quando guiaData ou procedimentosSalvos mudam


## Vinculação de Procedimento TUSS ao Atendimento (Jul 2026)
- [x] Adicionar campo atendimentoId na tabela guias (schema + migração)
- [x] Actualizar router de criação de guias para aceitar atendimentoId
- [x] Melhorar getDadosGuiaPrefaturamento para buscar procedimento do atendimento vinculado
- [x] Actualizar GuiasSPSADT para priorizar procedimentoDoAtendimento no preenchimento do código TUSS
- [x] Vincular atendimentoId ao criar guia a partir de atendimento seleccionado
- [x] Formulário de agendamento já tem selector de procedimento TUSS (AgendamentoModal + Agenda)

## Indicador Visual de Procedimento TUSS na Agenda (Jul 2026)
- [x] Importar ícone Stethoscope do lucide-react na Agenda
- [x] Adicionar badge azul com ícone de estetoscópio nos atendimentos com procedimentoConvenioId
- [x] Tooltip descritivo: "Procedimento TUSS vinculado — código será preenchido automaticamente na guia"

## Salvamento Completo do Prefaturamento SADT (Jul 2026)
- [x] Ampliar endpoint salvarSPSADT no router para aceitar todos os campos TISS (autorização, beneficiário, atendimento, diagnóstico, observações, valores totais, procedimentos)
- [x] Endpoint salvarSPSADT agora persiste: senha, datas, carteira, carater, tipo, indicação acidente, tipoConsulta, regimeAtendimento, CID, observações, valorTaxas, valorMateriais, valorMedicamentos
- [x] Adicionar mutation salvarSPSADT no GuiasSPSADT
- [x] Actualizar onSave para enviar todos os campos do formulário via salvarSPSADT
- [x] Mapear execuções (tabela 13) para guiaProcedimentos com código, descrição, quantidade, valor, data, tabela
- [x] Calcular valorTotalGeral incluindo todos os tipos de valores (procedimentos + taxas + materiais + OPME + medicamentos + gases)

## Múltiplas Sessões na Tabela de Execuções (Jul 2026)
- [x] Ampliar getDadosGuiaPrefaturamento para retornar todas as sessões do paciente com procedimento e data
- [x] Actualizar o componente para preencher uma linha de execução por sessão automaticamente
- [x] Garantir que sessões sem procedimento TUSS vinculado também aparecem (com campos editáveis)
- [x] Tabela de procedimentos solicitados mostra quantidade total de sessões
- [x] Testar fluxo completo com múltiplas sessões

## Campos 52, 8 e 36 da Guia SADT (Jul 2026)
- [x] Campo 52 (CPF do profissional executante): preencher automaticamente com CPF do profissional cadastrado
- [x] Adicionar campos UF do Conselho e Código CBO no formulário de cadastro do profissional
- [x] Actualizar router e db.ts para persistir UF e CBO do profissional
- [x] Campo 8 (Nº Carteira): preencher com cartaoSUS do paciente (fallback CPF)
- [x] Campo 36 (Data): formatar como dd/mm/aaaa (data abreviada) em todas as linhas de execução
- [x] Propagar cpfProfissional nos dois fluxos de montagem de guiaData (novo atendimento e guia existente)

## Campos Carteirinha do Paciente e Correcção Campo 8 (Jul 2026)
- [x] Adicionar campos numeroCarteira e validadeCarteira na tabela pacientes (schema + SQL ALTER TABLE)
- [x] Actualizar router pacientes.create e pacientes.update para aceitar numeroCarteira e validadeCarteira
- [x] Adicionar campos Nº Carteira do Convênio e Validade da Carteira no formulário de cadastro do paciente
- [x] Campo 8 (Nº Carteira) no prefaturamento: prioridade guia.numeroCarteira > paciente.numeroCarteira > cartaoSUS > CPF
- [x] Corrigir conversão de validadeCarteira para Date no router update

## Convênio do Paciente no Cadastro (Jul 2026)
- [x] Adicionar campo convenioId na tabela pacientes (schema + migração SQL)
- [x] Actualizar router pacientes.create e pacientes.update para aceitar convenioId
- [x] Adicionar selector de convênio no formulário de cadastro do paciente
- [x] Usar convenioId do paciente como valor padrão ao criar guia SADT
- [x] Usar convenioId do paciente para pré-seleccionar convênio no prefaturamento
- [x] Pré-preencher convênio no AgendamentoModal ao seleccionar paciente
- [x] Pré-preencher convênio no modal de edição de agendamento (Agenda.tsx) com fallback do cadastro

## Remoção do Modal de Edição Separado (Jul 2026)
- [x] Remover botão de editar guia (ícone lápis azul) da listagem de guias
- [x] Remover modal de edição separado (GuiaEditavel) do GuiasSPSADT.tsx
- [x] Remover estados showEdicaoGuia e guiaEdicao
- [x] Remover imports de Edit2 e GuiaEditavel do GuiasSPSADT.tsx
- [x] Adicionar botões Editar/Salvar/Cancelar na barra de ferramentas do prefaturamento

## Correcção Número Carteirinha (Jul 2026)
- [x] Corrigir conflito de nomes no join SQL (pacientes.numeroCarteira vs guias.numeroCarteira) no getDadosGuiaPrefaturamento
- [x] Inverter prioridade: paciente.numeroCarteira tem precedência sobre guia.numeroCarteira no prefaturamento
- [x] Incluir validadeCarteira do paciente no prefaturamento e modal Nova Guia

## Campo 8 - Nº Carteirinha Obrigatório (Jul 2026)
- [x] Remover fallback para CPF no campo 8 (numeroCarteira) — usar apenas o nº da carteirinha do convênio
- [x] Tornar campo numeroCarteira obrigatório no cadastro do paciente (validação frontend + backend)
- [x] Exibir erro de validação se paciente não tiver carteirinha preenchida ao tentar salvar
- [x] Salvar numeroCarteira do paciente na tabela guias ao criar nova guia (ambos fluxos de criação)
- [x] Adicionar numeroCarteira e validadeCarteira ao input do router guias.create
- [x] Garantir dados frescos de pacientes no GuiasSPSADT (staleTime: 0, refetchOnMount: 'always')
- [x] Priorizar paciente.numeroCarteira sobre guia.numeroCarteira no prefaturamento
- [x] Corrigir erro "Invalid Date" ao salvar prefaturamento (converter DD/MM/YYYY para YYYY-MM-DD)
- [x] Adicionar validação de data no backend (rejeitar datas inválidas com null)

## Consolidação de Guias e Exportação XML TISS
- [x] Consolidar guias duplicadas: manter a mais antiga por paciente/profissional/convénio, excluir as demais
- [x] Adicionar campo guiaId nos atendimentos para vincular sessão à guia
- [x] Adicionar campo numeroGuiaInterno (número fictício editável) no schema de guias
- [x] Gerar número fictício editável para cada guia (formato GUIA-YYYYMM-XXXXX)
- [x] Mostrar vínculo da guia na agenda (badge/indicador no card do atendimento)
- [x] Exportar XML TISS em lote com número de lote/protocolo editável
- [x] Botão "Exportar XML TISS" na barra de filtros da listagem de guias
- [x] Modal de exportação com número de lote editável, protocolo, lista de guias e download automático
- [x] Edição inline do numeroGuiaInterno na coluna Número da tabela de guias

## Verificação de Elegibilidade de Beneficiário
- [x] Criar página Elegibilidade.tsx com busca de paciente e verificação em todos os convênios
- [x] Lógica: carteirinha válida, validade da carteira, plano activo, sem cadastro
- [x] Cards de resumo com filtro por status (elegível, expirado, sem cadastro)
- [x] Já integrada na navegação do DashboardLayout (item existente)

## Actualização de Labels de Status dos Atendimentos
- [x] Agenda.tsx: actualizar labels e cores do select de edição e legenda
- [x] Atendimentos.tsx: actualizar statusLabel e statusColor e select de filtro
- [x] Dashboard.tsx: actualizar STATUS_LABELS, STATUS_COLORS e títulos dos cards

## Relatório Diário da Agenda
- [x] Criar router backend relatorios.agendaDiaria com filtros de data, profissional, convênio e status
- [x] Criar página RelatorioDiario.tsx com filtros, tabela completa e exportação via impressão/PDF
- [x] Integrar na navegação (Sidebar e App.tsx) para perfis administrador e recepção
- [x] Cards de totais por status (total, aguardando, atendidos, faltou, reagendou, cancelados)
- [x] Alerta de prontuários pendentes no relatório
- [x] Indicadores de confirmação de presença e prontuário preenchido na tabela

## Nova Agenda Virtual com Colunas por Profissional

- [x] Reimplementar Agenda.tsx no formato de agenda virtual: visualização diária com até 4 colunas de profissionais, mini-calendário por coluna, horários na lateral, slots clicáveis para agendar, navegação de data, filtro de profissionais selecionados

## Robô RPA GEAP — Automação de Autorizações de Guias
- [x] Criar tabelas BD: geapCredenciais e geapAutorizacoes no schema Drizzle
- [x] Aplicar tabelas na BD via SQL directo (webdev_execute_sql)
- [x] Criar robô Python Playwright (server/geapRobot.py) para login e submissão de autorizações
- [x] Criar router tRPC GEAP (server/routers/geap.ts) com procedures: getCredenciais, salvarCredenciais, testarCredenciais, listarAutorizacoes, criarAutorizacao, executarRobo, executarRoboLote, cancelarAutorizacao, getLog, getEstatisticas
- [x] Registar geapRouter no appRouter principal (server/routers.ts)
- [x] Criar página GeapAutorizacoes.tsx com: cards de estatísticas, tabela de autorizações, modal de credenciais, modal de nova autorização, modal de log de execução
- [x] Adicionar rota 'geap' no App.tsx e permissões de administrador
- [x] Adicionar item "Robô GEAP" com ícone Bot no menu lateral (Sidebar.tsx)

## Sistema de Rastreabilidade / Auditoria
- [x] Tabela `auditoria` criada no banco de dados
- [x] Tabela `auditoria` adicionada ao drizzle/schema.ts
- [x] Arquivo server/db-auditoria.ts criado com registrarAuditoria() e getAuditoria()
- [x] Import de registrarAuditoria e getAuditoria adicionado no server/routers.ts
- [x] Mutation pacientes.create instrumentada com CRIAR_PACIENTE
- [x] Mutation pacientes.update instrumentada com ATUALIZAR_PACIENTE
- [x] Mutation atendimentos.create instrumentada com CRIAR_ATENDIMENTO
- [x] Mutation atendimentos.delete instrumentada com EXCLUIR_ATENDIMENTO
- [x] Mutation atendimentos.update instrumentada com ATUALIZAR_ATENDIMENTO
- [x] Mutation atendimentos.passarEmSerie instrumentada com CRIAR_SERIE
- [x] Mutation prontuarios.delete instrumentada com EXCLUIR_PRONTUARIO
- [x] Procedure auditoria.list adicionada no appRouter (somente admin)
- [x] Página LogAuditoria.tsx criada com tabela, filtros e paginação
- [x] Item "Log de Auditoria" adicionado no menu lateral (somente admin)
- [x] Rota 'log-auditoria' registrada no App.tsx com permissão de administrador
- [x] Substituir o texto fixo "Admin Sistema" no cabeçalho pelo nome real do usuário logado


## Página Meu Perfil
- [x] Mutation auth.uploadAvatar adicionada no backend (upload base64 → S3 → atualiza avatarUrl)
- [x] Página MeuPerfil.tsx criada com formulário de nome e upload de foto
- [x] Item "Meu Perfil" adicionado no menu lateral (visível a todos os perfis)
- [x] Rota 'meu-perfil' registrada no App.tsx e nas permissões por perfil
- [x] Header atualizado para exibir avatar e navegar para Meu Perfil ao clicar

## Ordenação por Data nos Links de Confirmação e Assinatura
- [x] Modal de assinatura (Agenda.tsx): datas ordenadas cronologicamente (crescente) ao abrir e ao adicionar
- [x] AssinarSessaoGuia.tsx: sessões exibidas ao paciente ordenadas pela data do agendamento (crescente)

## Melhorias na Agenda — Horários Vagos e Cadastro Rápido
- [x] Sinalização visual de horários vagos na grade da Agenda (indicador + botão "Agendar")
- [x] Botão "Novo Cadastro" no modal de agendamento para cadastrar paciente inline

## Melhorias Visuais e Validações na Agenda
- [x] Cor de fundo distinta para slots vagos (verde claro) vs. fora do expediente (cinza)
- [x] Validação de CPF (11 dígitos) e telefone (10-11 dígitos) no formulário de novo cadastro inline
- [x] Indicador de vagos/ocupados no cabeçalho de cada profissional na Agenda

## Validação CPF Duplicado e Carteirinha Obrigatória
- [x] Procedure pacientes.getByCpf para verificar CPF duplicado
- [x] Validação de CPF duplicado no formulário inline com sugestão do paciente existente
- [x] Campo "Número da Carteirinha" obrigatório no formulário inline de novo cadastro
- [x] Campo "Número da Carteirinha" obrigatório no servidor (mutation create)

## Exclusão de Paciente (recepcao e master)
- [x] Mutation pacientes.delete no servidor (apenas perfil recepcao e master)
- [x] Botão de exclusão na lista de pacientes com diálogo de confirmação
- [x] Auditoria registada ao excluir paciente

## Correção Prontuário
- [x] Corrigir erro ao abrir prontuário para o profissional
- [x] Adicionar campo de data editável no formulário do prontuário (em vez de data fixa 05/07/2026)

## Correções no Prontuário
- [x] Adicionar seletor de agendamento no prontuário para o profissional escolher qual sessão está a registar
- [x] Pré-preencher automaticamente a data e hora a partir do agendamento selecionado
- [x] Corrigir erro quando agendamento é undefined (agendamento[0] pode não existir)
- [x] Permitir que o profissional edite a data do prontuário

## Correção de Fuso Horário nas Datas do Prontuário
- [x] Corrigir data do prontuário que aparecia 2 dias à frente (desvio UTC vs. horário local)
- [x] Corrigir exibição da data no seletor de agendamento do prontuário (mesmo problema de fuso)

## Correções de Fuso Horário Globais
- [x] Agenda.tsx — 11 substituições de new Date(...).toLocaleDateString/toISOString por formatDateBR/toSafeISODate
- [x] Atendimentos.tsx — função formatarData corrigida para usar formatDateBR
- [x] PainelConfirmacoesProfissional.tsx — data corrigida com formatDateBR
- [x] ConfirmacaoPresenca.tsx — 2 ocorrências corrigidas + import adicionado
- [x] PastaPaciente.tsx — import adicionado + 7 substituições de new Date(...).toLocaleDateString por formatDateBR
- [x] GuiasSPSADT.tsx — import adicionado + 2 substituições de new Date(...).toLocaleDateString por formatDateBR
- [x] Financeiro.tsx — import adicionado + 1 substituição de new Date(...).toLocaleDateString por formatDateBR
- [x] Pacientes.tsx — import adicionado + 2 substituições de new Date(...).toLocaleDateString por formatDateBR
- [x] Seletor de data do prontuário vinculado ao atendimento: profissional escolhe a data, sistema vincula ao atendimento correspondente; múltiplos atendimentos na mesma data exibem seletor de horário

## Prontuário Realizado → Repasse Automático

- [x] Ao salvar prontuário: marcar prontuarioFeito=1 no atendimento no banco
- [x] Ao salvar prontuário: redirecionar automaticamente para o Repasse após 2 segundos
- [x] Badge verde "Prontuário realizado" na Agenda quando prontuarioFeito=1
- [x] Passar prop onNavigate para o componente Prontuario no App.tsx

## Bug reportado em 2026-08-11 — erro ao salvar paciente

- [x] Corrigir erro `Cannot read properties of undefined (reading 'toString')` ao salvar paciente no cadastro e no fluxo de novo paciente pelo agendamento
- [x] Validar o retorno do cadastro de paciente e os campos obrigatórios antes de atualizar o formulário/agendamento
- [x] Criar ou atualizar teste Vitest para o fluxo de salvamento de paciente com campos opcionais ausentes
- [x] Testar compilação e publicar a correção do cadastro de pacientes

## Bug reportado em 2026-08-11 — assinaturas não aparecem na Agenda

- [x] Investigar por que o indicador de assinatura do paciente desapareceu da Agenda
- [x] Corrigir a associação da assinatura ao atendimento/data correto, sem compartilhar o status com outras sessões
- [x] Criar ou atualizar testes para sessão assinada e sessão pendente
- [x] Testar compilação e publicar a correção das assinaturas

## Ajuste reportado em 2026-08-11 — link assinado ainda aparece pendente

- [x] Identificar assinaturas concluídas por WhatsApp que não possuem atendimentoId
- [x] Associar o status assinado à sessão pela guia e data do atendimento
- [x] Garantir que uma assinatura concluída substitua qualquer alerta pendente da mesma sessão
- [x] Testar e publicar a correção

## Melhoria reportada em 2026-08-11 — assinaturas no modal da Guia SADT

- [x] Exibir no modal de assinatura o histórico de sessões já assinadas
- [x] Mostrar data da sessão, estado e imagem da assinatura quando disponível
- [x] Ocultar o campo de desenho para sessões que já foram assinadas
- [x] Criar teste e publicar a melhoria

## Bug reportado em 2026-08-11 — reagendamento individual

- [x] Investigar por que não é possível reagendar apenas um atendimento de uma série
- [x] Garantir que a atualização use somente o ID do atendimento selecionado
- [x] Testar que as demais sessões da série permanecem inalteradas
- [x] Publicar a correção do reagendamento individual

## Bug reportado em 2026-08-11 — pacientes não aparecem no Prontuário

- [x] Investigar o filtro que impede o profissional de visualizar pacientes com guia assinada
- [x] Permitir prontuário de atendimentos PROASA Saúde e Mediservice sem assinatura digital obrigatória
- [x] Garantir que o Prontuário exiba somente atendimentos do profissional logado, inclusive os elegíveis por exceção
- [x] Criar testes e publicar a correção de visibilidade

## Bug reportado em 2026-08-11 — procedimento VALE SAÚDE não persiste

- [x] Rastrear o cadastro de procedimentos por convênio para o VALE SAÚDE
- [x] Corrigir a persistência de código, descrição e valor do procedimento
- [x] Atualizar a lista de procedimentos imediatamente após o salvamento
- [x] Criar testes e publicar a correção

## Melhoria reportada em 2026-08-11 — confirmação visual ao salvar procedimento

- [x] Exibir confirmação visual destacada após o salvamento bem-sucedido
- [x] Mostrar código, descrição e valor do procedimento salvo
- [x] Criar teste e publicar a melhoria

## Melhoria reportada em 2026-08-11 — confirmação após agendamento

- [x] Localizar o fluxo de sucesso do agendamento simples e em série
- [x] Exibir mensagem visual com paciente, data, horário e profissional
- [x] Diferenciar agendamento único e série na confirmação
- [x] Criar testes e publicar a melhoria

## Melhoria reportada em 2026-08-11 — assinatura concluída e prontuário pendente

- [x] Localizar a listagem do Prontuário e os campos assinadoPaciente/prontuarioFeito
- [x] Exibir indicador apenas quando a assinatura estiver concluída e o prontuário estiver pendente
- [x] Restringir o indicador aos perfis master e profissional
- [x] Criar testes para os estados autorizado, concluído e recepção
- [x] Testar e publicar a melhoria

## Melhoria reportada em 2026-08-11 — atalho para editor de prontuário

- [x] Adicionar botão no aviso de assinatura concluída para abrir o editor da sessão
- [x] Levar o utilizador diretamente para a aba de preenchimento do prontuário
- [x] Criar teste e publicar a melhoria

## Melhoria reportada em 2026-08-11 — indicadores em atendimentos existentes

- [x] Levantar atendimentos históricos com assinatura concluída e prontuário pendente
- [x] Reconciliar o status de assinatura por guia, paciente, profissional e data da sessão
- [x] Aplicar os indicadores por sessão aos atendimentos já existentes, sem alterar o prontuário clínico
- [x] Validar os resultados e publicar a atualização

## Alerta temporário de feriado — setembro de 2026

- [x] Validar o canal de e-mail para encaminhar as ciências ao responsável
- [x] Criar alerta visível a todos os profissionais de 12/08/2026 a 18/08/2026
- [x] Exigir ciência e registrar data/hora por profissional a cada dia de acesso
- [x] Fazer o alerta reaparecer no dia seguinte até o fim da vigência
- [x] Notificar mifatureclinic@gmail.com e copiar gerenciaclipsi@gmail.com com profissional, data e horário da ciência
- [x] Criar testes e publicar a implementação
- [x] Verificar e reutilizar as configurações de e-mail já fornecidas antes de solicitar novas credenciais
- [x] Configurar a chave Resend fornecida e validar o e-mail remetente verificado
- [x] Configurar mifatureclinic@gmail.com como remetente/destinatário e gerenciaclipsi@gmail.com em cópia do aviso

## Bug reportado em 2026-08-11 — procedimentos AFFEAM classificados como Avaliação

- [x] Auditar os procedimentos e valores atualmente cadastrados para AFFEAM
- [x] Corrigir descrições e vínculos sem alterar os valores informados
- [x] Validar a listagem de procedimentos do convênio após a correção
- [x] Criar teste e publicar a correção

## Bug reportado em 2026-08-11 — pré-visualização não abre

- [x] Identificar qual modal ou botão de pré-visualização está falhando
- [x] Corrigir a abertura e o carregamento da pré-visualização de guia/pré-faturamento
- [x] Criar teste e publicar a correção

## Melhoria reportada em 2026-08-11 — ações restritas para profissionais

- [x] Localizar todos os botões da coluna Ações exibidos ao profissional
- [x] Mostrar somente Ir para Prontuário no perfil profissional
- [x] Preservar ações administrativas para master e recepção
- [x] Criar testes por perfil e publicar a correção

## Bug reportado em 2026-08-11 — menu completo ainda visível ao profissional

- [x] Diagnosticar o perfil e o vínculo profissional recebidos pela Agenda
- [x] Normalizar a regra de permissão do menu de ações
- [x] Garantir que qualquer profissional veja somente Ir para Prontuário
- [x] Criar testes das variações de perfil e publicar a correção

## Melhoria reportada em 2026-08-11 — ocultar Ações para profissionais

- [x] Localizar colunas e menus de Ações visíveis ao profissional
- [x] Ocultar por completo a coluna Ações na lista de atendimentos do profissional
- [x] Ocultar o menu de três pontos na Agenda do profissional
- [x] Preservar as ações para master e recepção, testar e publicar

## Bug reportado em 2026-08-11 — repasse aparentemente duplicado de Joaquim Campos de Sousa

- [x] Auditar atendimentos, guias e lançamentos de repasse da profissional Suzy
- [x] Corrigir o rateio do valor total da guia por sessão legítima
- [x] Validar o valor unitário e o percentual de repasse de cada sessão
- [x] Criar teste e publicar a correção

## Exclusão confirmada em 2026-08-11 — cadastros Dr. Lembrete

- [x] Verificar vínculos dos oito registros Dr. Lembrete confirmados pelo usuário
- [x] Excluir somente os oito cadastros selecionados e dependências exclusivamente de teste
- [x] Validar que não restaram cadastros Dr. Lembrete nem referências órfãs

## Bug reportado em 2026-08-11 — assinatura digital ainda aparece pendente

- [x] Auditar o status de assinatura digital por guia, sessão e data
- [x] Corrigir a prioridade do status assinado sobre qualquer pendência antiga
- [x] Validar badges de sessões assinadas e pendentes na Agenda
- [x] Criar teste e publicar a correção

## Bug reportado em 2026-08-11 — badge pendente persiste após assinatura

- [x] Inspecionar o payload real de assinatura devolvido à Agenda
- [x] Corrigir a fonte ou condição que mantém o badge pendente em sessão assinada
- [x] Validar com o atendimento de Joaquim e outro atendimento pendente
- [x] Criar teste de integração e publicar a correção

## Solicitação em 2026-08-11 — guias Bradesco Saúde e valores de repasse

- [x] Auditar atendimentos Bradesco Saúde, procedimentos, valores e guias vinculadas
- [x] Criar guias ausentes por série/atendimento sem duplicar saldo ou senha
- [x] Corrigir atendimentos vinculados à guia ou série incorreta
- [x] Validar valores no repasse dos profissionais e publicar os ajustes

## Solicitação em 2026-08-12 — guias e repasse de todos os convênios

- [x] Auditar atendimentos concluídos e guias ausentes de todos os convênios
- [x] Criar e vincular guias apenas para grupos com procedimento e valor válidos
- [x] Corrigir vínculos de série ou agendamento sem substituir guias existentes
- [x] Listar convênios e atendimentos bloqueados por dados insuficientes
- [x] Validar os valores do repasse e publicar o processamento

## Bug reportado em 2026-08-12 — tentativas de pagamento particular no repasse

- [x] Auditar lançamentos particulares duplicados, tentativas e registros removidos
- [x] Filtrar o repasse para considerar apenas pagamentos particulares confirmados e ativos
- [x] Excluir do cálculo pagamentos cancelados, substituídos ou sem vínculo válido
- [x] Validar os totais do paciente afetado e publicar a correção

## Teste solicitado em 2026-08-12 — link de assinatura da profissional Ângela às 14h

- [x] Confirmar o atendimento de 12/08/2026 às 14h, o paciente e o telefone destinatário
- [x] Gerar o link de assinatura vinculado à sessão de 14h
- [x] Enviar o teste ao paciente confirmado e registrar o resultado

## Verificação solicitada em 2026-08-12 — assinatura da paciente da sessão de 14h

- [x] Consultar assinaturas digitais existentes da paciente e a situação da guia atual
- [x] Informar se existe assinatura concluída, pendente ou expirada

## Bug reportado em 2026-08-12 — aviso não desaparece após ciência

- [x] Inspecionar a resposta de ciência e o estado visual do alerta
- [x] Ocultar o modal imediatamente após a confirmação bem-sucedida
- [x] Preservar o reaparecimento apenas no dia seguinte durante a vigência
- [x] Testar e publicar a correção

## Bug reportado em 2026-08-12 — ciência diária do aviso falha ao repetir

- [x] Identificar a restrição de unicidade que bloqueia a ciência no mesmo dia
- [x] Tornar o registro de ciência idempotente para o mesmo profissional e data
- [x] Testar confirmação nova e confirmação repetida no mesmo dia
- [x] Publicar a correção do aviso

## Solicitação em 2026-08-12 — links de assinatura de hoje

- [x] Auditar atendimentos de hoje sem link e com assinatura pendente
- [x] Gerar links com expiração duas horas antes da consulta
- [x] Enviar links aos pacientes elegíveis e registrar o resultado
- [x] Listar pendências com o motivo de bloqueio

## Bug reportado em 2026-08-12 — links de assinatura inválidos

- [x] Auditar tokens enviados, rota pública, guia e expiração dos links de hoje
- [x] Corrigir o cálculo de expiração em UTC para preservar o horário de Manaus
- [x] Reenviar os links corrigidos aos pacientes afetados
- [x] Validar os links corrigidos e reportar resultados e pendências

## Correção complementar em 2026-08-12 — rota pública não recebia o token

- [x] Passar o token da URL /assinar/:token ao componente da assinatura SADT
- [x] Validar a abertura pública de um link pendente
- [x] Suspender o reenvio de links por solicitação do usuário

## Ajuste solicitado em 2026-08-12 — pedido médico opcional

- [x] Localizar validações de anexo e vencimento de pedido médico
- [x] Remover marcadores e bloqueios de obrigatoriedade no cadastro de paciente
- [x] Testar o salvamento de paciente sem pedido médico

## Bug reportado em 2026-08-12 — vencimento do pedido ainda obrigatório

- [x] Localizar a validação residual que bloqueia o vencimento vazio
- [x] Remover o bloqueio do fluxo de cadastro e edição
- [x] Testar o cadastro sem vencimento e publicar a correção

## Bug persistente em 2026-08-12 — vencimento ainda exigido em outro fluxo

- [x] Localizar todos os fluxos e esquemas que ainda exigem o vencimento do pedido
- [x] Remover o bloqueio no cadastro rápido e no formulário principal
- [x] Testar ambos os fluxos sem vencimento e publicar a correção

## Solicitação em 2026-08-12 — verificar e melhorar gestão de assinaturas

- [x] Verificar edição e exclusão de assinaturas no modal e no pré-faturamento
- [x] Melhorar a hierarquia visual, confirmação e feedback das ações
- [x] Testar atualização imediata do histórico de assinaturas
- [x] Publicar a melhoria

## Bug reportado em 2026-08-12 — comprovantes de assinatura não carregam no modal

- [x] Identificar a origem das imagens quebradas e dos registos sem imagem
- [x] Corrigir a visualização do campo 67 e da tabela de sessões assinadas
- [x] Melhorar a apresentação dos controles de edição e exclusão por sessão
- [x] Testar e publicar a correção visual

## Bug reportado em 2026-08-12 — assinatura de Carlos Victor não aparece

- [x] Localizar a imagem e o hash de assinatura vinculados ao paciente e à guia
- [x] Reconciliar o comprovante com a sessão e com o campo 67 correspondente
- [x] Validar a apresentação do histórico sem alterar outras assinaturas
- [x] Testar e publicar a correção específica

## Solicitação em 2026-08-12 — prévia obrigatória para novo link de Carlos Victor

- [x] Gerar link para as sessões de 05, 12, 19 e 26/08/2026 sem enviar
- [x] Apresentar a mensagem e o link para aprovação explícita
- [x] Enviar somente após confirmação do usuário

## Ajuste em 2026-08-12 — identificação da mensagem de Carlos Victor

- [x] Substituir a assinatura institucional por CLÍNICA CLIPSI na prévia

## Acompanhamento em 2026-08-12 — assinatura de Carlos Victor

- [x] Enviar o link aprovado pelo WhatsApp para as sessões de 05, 12, 19 e 26/08/2026
- [x] Conferir o preenchimento do campo 67 após a assinatura do paciente

## Divergência em 2026-08-12 — repasse de Isabella Santos de Sales

- [x] Localizar atendimentos, guia, pagamento e profissional vinculados ao valor de R$ 16,00
- [x] Recalcular a base por sessão e o percentual de repasse aplicável
- [x] Corrigir eventual divergência e validar o valor no repasse

## Correção em lote em 2026-08-12 — guias de série com total subdimensionado

- [x] Identificar todas as guias cujo valor total não reflete a quantidade de sessões
- [x] Recalcular o total autorizado a partir do valor unitário do procedimento
- [x] Aplicar a correção transacional e validar o repasse de cada sessão realizada
- [x] Tornar a criação de guia resistente a essa divergência
- [x] Testar e publicar a correção permanente

## Solicitação em 2026-08-12 — Pasta do Paciente para recepção

- [x] Localizar as regras atuais de visibilidade e autorização da Pasta do Paciente
- [x] Liberar para recepção o envio de anamnese e contrato terapêutico
- [x] Criar o envio de anamnese, inexistente no fluxo atual da Pasta do Paciente
- [x] Testar permissões da interface e do servidor
- [x] Publicar a atualização

## Solicitação em 2026-08-12 — ponto eletrônico para recepção

- [x] Pesquisar e documentar as premissas trabalhistas de jornada, tolerância e horas extras
- [x] Criar estrutura de jornadas, registros de ponto e fechamento mensal
- [x] Liberar batida de ponto para recepcionistas e correções justificadas pelo master
- [x] Implementar painel mensal do master com horas normais, extras e atrasos
- [x] Testar cálculos, permissões e fechamento mensal
- [x] Publicar o módulo de ponto eletrônico

## Solicitação em 2026-08-12 — biometria e perímetro no ponto

- [x] Pesquisar e documentar requisitos de privacidade para biometria e geolocalização
- [x] Implementar consentimento, cadastro facial e retenção mínima de dados
- [x] Configurar perímetro da clínica e validar localização na batida
- [x] Exigir foto facial com detecção de rosto no registro de ponto
- [x] Criar fluxo de exceção auditado pelo master
- [x] Testar permissões, perímetro e evidências de registro

## Ativação presencial em 2026-08-12 — ponto facial e perímetro

- [x] Configurar o perímetro pelo dispositivo do master na clínica
- [x] Cadastrar a biometria facial de cada recepcionista ativa — Esteres e Gabriel com biometria ativa; Raysa desativada do ponto
- [ ] Realizar batida supervisionada de entrada e saída
- [ ] Conferir as evidências registradas no espelho mensal

## Pausa solicitada em 2026-08-13 — ponto eletrônico

- [ ] Retomar as batidas presenciais e a conferência do espelho mensal somente quando solicitado pelo usuário

## Atualização em 2026-08-13 — biometria e quadro ativo da recepção

- [x] Registar a confirmação de cadastro biométrico da Esteres — biometria ativa confirmada no cadastro de ponto
- [x] Localizar e desativar o cadastro de ponto da Raysa sem apagar o histórico — cadastro já estava inativo e não possui registros de ponto
- [x] Validar que a Esteres permanece apta e que a Raysa não pode realizar novas batidas — Esteres está ativa com biometria válida; o bloqueio de batida para jornada inativa foi confirmado pelos testes do módulo
- [x] Publicar a atualização

## Ativação em 2026-08-12 — recepcionista Gabriel

- [x] Confirmar o cadastro biométrico e o consentimento de Gabriel
- [ ] Registrar a batida presencial validada de Gabriel
- [ ] Conferir método, perímetro e confiança no espelho de ponto

## Bug reportado em 2026-08-13 — batidas de ponto recusadas no telemóvel

- [x] Recolher o estado de biometria, jornada e perímetro configurado para os usuários ativos — Esteres e Gabriel estão ativos, com biometria válida e perímetro de 150 m; não há tentativa facial/geolocalizada gravada, apenas registros manuais anteriores
- [x] Identificar o motivo técnico da recusa no fluxo de batida — a interface permitia confirmar antes de a pré-visualização da câmera estar pronta e retornava erros genéricos de GPS/câmera, sem chegar ao servidor
- [x] Corrigir a validação de câmera, biometria ou geolocalização que estiver a bloquear indevidamente — confirmação agora aguarda vídeo pronto, mantém o estado de validação e apresenta orientações específicas para permissões de câmera e localização; nove testes, TypeScript e build aprovados
- [ ] Validar uma nova batida presencial e as evidências no espelho mensal
- [x] Publicar a correção

## Bug reportado em 2026-08-12 — botão de cadastro facial não aparece

- [x] Identificar a condição que oculta o cadastro biométrico na recepção
- [x] Corrigir a visibilidade e validar o fluxo de câmera
- [ ] Retomar o teste supervisionado da batida de ponto

## Bug reportado em 2026-08-12 — tela de ponto sem atualização e sem ações

- [x] Verificar o carregamento da rota e os dados retornados à conta de recepção
- [x] Tornar explícitos o cadastro facial e os estados de carregamento/erro
- [x] Invalidar o cache de ponto após a publicação e validar a nova renderização

## Solicitação em 2026-08-12 — menu único para recepção

- [x] Remover separadores repetidos do perfil recepção
- [x] Agrupar Localizar Agendamentos, Ponto, Pacientes e demais ações sob RECEPÇÃO
- [x] Testar a navegação e publicar a organização visual

## Bug reportado em 2026-08-12 — recepção não consegue anexar documentos

- [x] Identificar a condição de permissão que bloqueia anexos na Pasta do Paciente
- [x] Liberar o upload de documentos para recepção no servidor e na interface
- [x] Testar o fluxo de anexo e publicar a correção

## Solicitação em 2026-08-12 — anexos para master e administrador

- [x] Confirmar permissões de anexo para master e administrador
- [x] Ajustar as regras se houver qualquer bloqueio de perfil
- [x] Testar e publicar o acesso ampliado

## Solicitação em 2026-08-12 — WhatsApp direto na Agenda

- [x] Localizar os cartões e nomes de pacientes na Agenda
- [x] Adicionar atalho de WhatsApp com número normalizado e acessível
- [x] Tratar pacientes sem telefone e testar a navegação
- [x] Publicar a melhoria

## Ajuste em 2026-08-12 — permissão do WhatsApp na Agenda

- [x] Restringir a visibilidade do atalho aos perfis master e recepção
- [x] Testar a ocultação para o perfil profissional
- [x] Publicar a permissão atualizada

## Solicitação em 2026-08-12 — guias pendentes Petrobras e Particular

- [x] Levantar atendimentos sem guia ou procedimento nos convênios Petrobras e Particular
- [x] Validar procedimento, valor, prontuário e regra de série de cada grupo elegível
- [x] Apresentar a quantidade e o impacto de repasse antes de criar ou alterar guias
- [x] Criar as guias e vincular procedimentos após confirmação explícita
- [x] Validar os repasses profissionais resultantes

## Solicitação em 2026-08-12 — pendências de prontuário particular

- [x] Identificar os profissionais e atendimentos particulares pagos sem prontuário

## Solicitação em 2026-08-12 — guias pendentes GEAP e Caixa

- [x] Levantar atendimentos sem guia ou procedimento nos convênios GEAP e Caixa
- [x] Validar procedimentos, carteirinhas, prontuários e séries elegíveis
- [x] Apresentar impacto de repasse e obter confirmação antes da alteração
- [x] Criar guias e vincular procedimentos autorizados
- [x] Validar os repasses profissionais resultantes

## Ajuste em 2026-08-12 — série GEAP de Aline Frota

- [x] Padronizar a série de Aline no procedimento GEAP de R$ 67,19
- [x] Vincular a série a uma única guia independente
- [x] Padronizar as sessões futuras da mesma série no procedimento de R$ 67,19

## Solicitação em 2026-08-12 — guias pendentes Conab, Mediservice, PROASA e Luminar

- [x] Levantar atendimentos sem guia ou procedimento nos cinco convênios
- [x] Validar procedimentos, carteirinhas, prontuários e séries elegíveis
- [x] Apresentar impacto de repasse e obter confirmação antes da alteração
- [x] Criar guias e vincular procedimentos autorizados
- [x] Validar os repasses profissionais resultantes

## Pendência em 2026-08-12 — procedimento Luminar Saúde

- [x] Cadastrar ou confirmar o procedimento e valor da Luminar antes de criar 5 guias pendentes

## Execução em 2026-08-12 — guias Luminar Saúde

- [x] Cadastrar o procedimento 50000470 de R$ 60,61 para Luminar
- [x] Criar guias e vincular as 5 sessões elegíveis
- [x] Validar o repasse profissional resultante

## Solicitação em 2026-08-12 — situação funcional e relatório completo do ponto

- [x] Revisar a tela de ponto após as alterações paralelas antes de concluir a interface
- [x] Criar controle de funcionário ativo ou inativo pelo master
- [x] Registrar folga, férias e atestado com período e observação
- [x] Excluir ausências justificadas do cálculo de faltas e atrasos
- [x] Consolidar no relatório horas trabalhadas, faltas, atrasos e horas extras
- [x] Exportar o relatório mensal atualizado
- [x] Testar permissões, cálculos e publicação

## Ajuste em 2026-08-12 — funcionários ativos no ponto

- [x] Corrigir a visibilidade do botão Ativar/Desativar Funcionário no painel master
- [x] Manter ESTERES e Gabe ativas para ponto
- [x] Desativar as demais recepcionistas para impedir novas batidas
- [x] Validar e publicar a gestão funcional atualizada

## Bug reportado em 2026-08-12 — anexo bloqueado na Pasta do Paciente

- [x] Identificar a etapa de upload ou autorização que está falhando
- [x] Corrigir o fluxo de seleção e envio do anexo
- [x] Testar e publicar a correção

## Solicitação em 2026-08-13 — relação de links de assinatura enviados

- [x] Localizar os pacientes com links de assinatura enviados
- [x] Consolidar profissionais, datas e textos de mensagem disponíveis
- [x] Entregar a relação e sinalizar registros sem texto rastreável

## Incidente em 2026-08-13 — links enviados fora do escopo autorizado

- [x] Identificar os pacientes do Gilzemberg que receberam link sem autorização
- [x] Localizar a rotina que enviou sem filtrar profissionais autorizados
- [x] Impedir novos disparos sem seleção explícita de profissionais
- [x] Validar a correção e reportar o incidente

## Solicitação em 2026-08-13 — links de assinatura para cinco profissionais

- [x] Localizar Thiffane, Suzy, Jéssica, Loriene e Nayara e seus atendimentos de 13/08/2026
- [x] Simular somente os atendimentos elegíveis do escopo autorizado
- [x] Enviar os links válidos com expiração de uma hora antes da consulta
- [x] Validar e reportar os envios e impedimentos por paciente

## Bug reportado em 2026-08-13 — links inválidos da Suzy

- [x] Auditar os links enviados para os pacientes de Suzy
- [x] Corrigir token, guia ou expiração que tornar o link inválido
- [x] Validar os links corrigidos sem reenviar desnecessariamente

## Solicitação em 2026-08-13 — reenvio de links da Suzy

- [x] Confirmar validade dos quatro links reparados da Suzy
- [x] Reenviar os links somente aos quatro pacientes da Suzy
- [x] Validar e registrar o resultado de cada reenvio

## Solicitação em 2026-08-13 — guias e links da Dra. Jéssica

- [x] Levantar atendimentos de hoje da Dra. Jéssica sem guia
- [x] Validar procedimentos, carteirinhas e séries antes da criação
- [x] Criar ou vincular guias elegíveis com rotina idempotente e isolamento de séries
- [x] Validar a abertura pública e enviar somente links válidos — 11 enviados, tokens sincronizados e expiração confirmada; 1 contato sem WhatsApp ativo
- [x] Relatar envios e bloqueios restantes

## Validação em 2026-08-12 — correção paralela de anexos adotada

- [x] Revisar a normalização de arquivo e as mensagens de erro aplicadas
- [x] Executar os testes de upload e publicar a validação

## Solicitação em 2026-08-12 — anexar pedidos médicos enviados

- [x] Inventariar arquivos recebidos e eliminar duplicidades exatas
- [x] Associar os pedidos médicos com correspondência segura ao paciente cadastrado
- [x] Anexar os documentos confirmados na categoria Pedido Médico
- [x] Relatar anexos concluídos e arquivos que exigem revisão manual

## Progresso em 2026-08-12 — importação BRADESCO.zip

- [x] Anexar 137 pedidos médicos com correspondência exata a 133 pacientes
- [x] Excluir os 235 arquivos sem paciente exato conforme solicitado
- [x] Resolver 2 documentos com paciente duplicado antes de anexar

## Solicitação em 2026-08-12 — excluir pedidos sem cadastro no portal

- [x] Excluir do lote local os 235 documentos sem correspondência exata no portal
- [x] Preservar os documentos já anexados e os dois casos de duplicidade para revisão

## Solicitação em 2026-08-12 — logótipos dos convênios

- [x] Inventariar convênios cadastrados sem logótipo
- [x] Localizar fontes públicas oficiais para os logótipos disponíveis
- [x] Associar os logótipos aos convênios e exibir na interface
- [x] Listar convênios sem logótipo oficial encontrado e publicar a atualização

## Bug reportado em 2026-08-12 — datas de assinatura sem ações de gestão

- [x] Localizar a lista de datas assinadas e as ações ocultas por perfil
- [x] Restaurar edição e exclusão para perfis autorizados
- [x] Validar que assinaturas de outras datas permanecem intactas
- [x] Testar e publicar a correção

## Bug reportado em 2026-08-12 — controles de assinatura não apareceram após publicação

- [x] Auditar o perfil recebido pelo modal e a condição de visibilidade dos controles
- [x] Corrigir a condição de autorização ou o modal carregado
- [x] Testar a exibição para perfil master e recepção
- [x] Publicar a correção de atualização

## Correção complementar em 2026-08-12 — controles no pré-faturamento

- [x] Adicionar edição e exclusão das datas assinadas exibidas no pré-faturamento
- [x] Aplicar as mesmas permissões de master e recepção
- [x] Testar a atualização da lista de assinaturas após a ação

## Ajuste solicitado em 2026-08-12 — reenvio restrito a Isabele e Ângela

- [x] Auditar somente as sessões pendentes das profissionais Isabele e Ângela
- [x] Corrigir a expiração dos links pendentes dessas profissionais
- [x] Listar os links enviados e as pendências específicas

## Solicitação em 2026-08-13 — guias e links da profissional Nayara

- [x] Levantar atendimentos de hoje da Nayara sem guia
- [x] Validar procedimentos, carteirinhas e séries antes da criação
- [x] Criar ou vincular guias elegíveis com rotina idempotente e isolamento de séries
- [x] Validar a abertura pública e enviar somente links válidos no escopo 570007 — 17 enviados; 16 das 17 guias vinculadas receberam token, e uma sessão ultrapassou a janela de envio
- [x] Relatar envios e bloqueios restantes

## Solicitação em 2026-08-13 — guias de todos os profissionais para 14/08/2026

- [x] Levantar atendimentos de amanhã sem guia
- [x] Validar procedimentos, carteirinhas e séries antes da criação — 49 elegíveis; 18 sem referência segura de procedimento e 5 sem carteirinha bloqueados
- [x] Criar ou vincular somente as guias elegíveis com rotina idempotente e conservadora — 43 guias novas e 6 vínculos reaproveitados
- [x] Validar os vínculos e confirmar que nenhum link foi enviado — 54 atendimentos com guia; zero tokens e zero WhatsApp enviados
- [x] Relatar guias criadas, vínculos e pendências restantes

## Solicitação em 2026-08-13 — links de assinatura exclusivos da Suzy

- [x] Levantar os atendimentos elegíveis de 14/08/2026 da Suzy — 6 elegíveis e 3 isentos por PROASA PARÁ
- [x] Validar guias, expirações, contatos e página pública dos tokens
- [x] Permitir que a rotina de links execute em uma data explicitamente informada e validar a execução futura
- [x] Enviar somente os links validados no escopo profissional 570004
- [x] Confirmar tokens sincronizados e relatar envios ou bloqueios — 6 envios confirmados, 6 tokens sincronizados e 3 atendimentos PROASA PARÁ isentos

## Solicitação em 2026-08-13 — redação correta para links de data futura

- [x] Ajustar a mensagem para informar a data real da consulta
- [x] Testar a redação para atendimento de hoje e de outra data
- [x] Publicar a correção para os próximos envios

## Solicitação em 2026-08-13 — mensagem de links da Dra. Jéssica em 14/08/2026

- [x] Levantar os atendimentos elegíveis e sem assinatura da Dra. Jéssica — 6 sessões elegíveis; 1 PROASA PARÁ isento e 5 sessões sem guia bloqueadas
- [x] Validar guias, contatos e expirações para 14/08/2026 — seis guias consistentes, telefones válidos e expiração uma hora antes
- [x] Mostrar a mensagem com data explícita antes de qualquer envio
- [x] Aguardar aprovação antes de enviar

## Autorização em 2026-08-13 — envio parcial da Dra. Jéssica em 14/08/2026

- [x] Permitir seleção explícita de atendimentos na rotina de envio e validar seu bloqueio
- [x] Enviar somente para Alice Cristina da Silva Oliveira e Pedro Ramires Silva da Silva
- [x] Preservar sem envio as guias de Manuella Givone da Silva e Alice Sophia Barbosa Melo
- [x] Validar os dois tokens públicos após o envio

## Correção em 2026-08-13 — assinatura de José Sampaio na agenda

- [x] Investigar a divergência entre a assinatura registrada e o alerta pendente da agenda — a assinatura está persistida na guia/sessão; a agenda mantinha dados em cache após a assinatura externa
- [x] Corrigir o reconhecimento de assinatura por atendimento e data
- [x] Atualizar automaticamente a agenda após assinatura externa e testar a sessão assinada
- [x] Publicar a correção

## Reincidência em 2026-08-13 — badge pendente no cartão de José Sampaio

- [x] Rastrear a origem visual do badge pendente no cartão da agenda — a ampulheta usava condição própria, diferente do resolvedor de assinatura
- [x] Corrigir o badge para refletir a assinatura da sessão de 13/08/2026
- [x] Testar o cartão assinado e as pendências reais
- [x] Publicar a correção

## Ajuste visual em 2026-08-13 — ícone de guia assinada na agenda

- [x] Priorizar o ícone roxo de guia assinada no cartão da sessão assinada
- [x] Testar a distinção visual entre guia assinada e assinatura pendente
- [x] Publicar o ajuste visual

## Correção em 2026-08-13 — pendência indevida de Severino na agenda

- [x] Mapear o atendimento, a guia e a assinatura concluída de Severino — a assinatura concluída é da sessão avulsa das 14:40; o cartão exibido é a sessão de série das 14:30, que não possui comprovante
- [x] Corrigir a associação da assinatura ao cartão exibido na agenda — atendimento duplicado de 14:30 foi cancelado por autorização do usuário; o cartão pendente deixou de integrar a agenda ativa
- [x] Testar a remoção do alerta pendente e a exibição de guia assinada — sessão válida de 14:40 permanece vinculada à guia NAY0001830574 com assinatura registrada
- [x] Publicar a correção — publicada no checkpoint 8dc7caff

## Autorização em 2026-08-13 — retirar atendimento de Severino às 14:30

- [x] Confirmar os vínculos do atendimento das 14:30 antes de removê-lo — sessão sem pagamento ou assinatura concluída, segura para cancelamento administrativo
- [x] Retirar com segurança o atendimento das 14:30 da agenda — atendimento marcado como cancelado, preservando histórico
- [x] Validar que a sessão válida das 14:40 permanece assinada e visível
- [x] Publicar a correção

## Correção em 2026-08-13 — comprovante de pagamento no perfil recepção

- [x] Investigar permissões, dados e abertura do comprovante — os comprovantes possuem chave válida; a abertura direta pelo proxy não tratava caminhos legados nem bloqueio de pop-up
- [x] Corrigir o acesso da recepção ao comprovante de pagamento
- [x] Testar o visualizador e as permissões de recepção
- [x] Publicar a correção

## Correção em 2026-08-13 — pagamentos particulares mensais em Contas a Pagar

- [x] Mapear pagamentos particulares e lançamentos de Contas a Pagar do mês — 15 pagamentos de agosto, R$ 3.447,28 recebidos e zero repasses em Contas a Pagar
- [x] Corrigir a criação ou filtragem dos lançamentos particulares com vínculo idempotente e migrar a chave de vínculo — 15 repasses legados gerados em agosto, totalizando R$ 1.723,64
- [x] Testar a exibição mensal em Contas a Pagar — 15 lançamentos distintos, vinculados sem duplicidade aos 15 pagamentos
- [x] Publicar a correção

## Ajuste em 2026-08-13 — período completo de agosto em Contas a Pagar

- [x] Mapear os lançamentos particulares ausentes entre 01/08/2026 e 31/08/2026 — os 11 repasses de 03/08 a 07/08 existem no banco; o filtro semanal permanecia ativo e ocultava o início do mês
- [x] Corrigir a data de referência ou o filtro mensal responsável pela omissão
- [x] Validar a exibição do período completo de agosto — 15 repasses, R$ 1.723,64, todos dentro do intervalo de 01/08 a 31/08
- [x] Publicar o ajuste

## Reincidência em 2026-08-13 — tela mostra apenas parte dos particulares

- [x] Reproduzir a listagem parcial exibida na tela financeira — a captura estava na aba Contas a Receber, com término em 13/08; os 15 repasses estavam na aba Contas a Pagar
- [x] Corrigir a seleção de aba, período e dados de Contas a Pagar — a tela força Contas a Pagar e o mês completo ao abrir; os novos repasses identificam o paciente
- [x] Testar a exibição de todos os repasses particulares de agosto — 15 repasses validados, com paciente e profissional identificados
- [x] Publicar a correção

## Reincidência em 2026-08-13 — repasses iniciais da Dra. Teresa

- [x] Mapear os repasses particulares da Dra. Teresa no início de agosto — sete repasses pendentes existem em 05, 06 e 07/08, todos vinculados a pagamentos particulares
- [x] Corrigir o filtro ou a criação dos lançamentos ausentes — o filtro mensal e a abertura direta de Contas a Pagar foram corrigidos; os lançamentos já existiam
- [x] Validar a exibição dos pacientes da Dra. Teresa no período completo
- [x] Publicar a correção

## Correção em 2026-08-13 — Contas a Receber de agosto

- [x] Mapear pagamentos particulares e contas a receber do período — 16 pagamentos particulares; 11 entradas de Contas a Receber ausentes, no total de R$ 2.557,28
- [x] Reconciliar contas legadas sem duplicar pagamentos particulares — registros legados foram vinculados e duplicidades exatas removidas
- [x] Corrigir a contagem e a listagem de Contas a Receber com preenchimento idempotente dos pagamentos legados — 16 pagamentos e 16 contas vinculadas, totalizando R$ 4.047,28
- [x] Testar totais e pacientes exibidos no período completo
- [x] Publicar a correção

## Correção em 2026-08-13 — possíveis pagamentos particulares duplicados

- [x] Mapear os lançamentos repetidos exibidos na listagem financeira e seus pagamentos de origem — Leticia Magalhães Mendes possui dois pagamentos PIX de R$ 100,00 para o mesmo atendimento 2940001, com duas contas a receber e dois repasses associados
- [x] Distinguir pagamentos realmente duplicados de referências ou parcelas diferentes do mesmo paciente — apenas a Leticia apresentou mesma paciente, data, valor, atendimento e referência; Alexandra e Olga têm referências e valores/períodos distintos
- [x] Cancelar ou remover apenas os lançamentos financeiros duplicados, preservando histórico e vínculos válidos — pagamento 360002, Conta a Receber 390002 e repasse 30012 removidos após confirmação; trilha de auditoria gravada e pagamento original 360001 preservado
- [x] Reconciliar os totais de Contas a Receber e Contas a Pagar após a correção — 15 pagamentos vinculados de R$ 3.947,28, 14 repasses ativos de R$ 1.673,64 e uma conta manual legítima de Ana Clara (R$ 200,00), totalizando R$ 4.147,28 em Contas a Receber
- [x] Testar a listagem financeira — nenhuma duplicidade ativa por paciente, atendimento, data e valor; sete testes financeiros aprovados
- [x] Publicar a correção

## Correção em 2026-08-13 — pagamentos particulares no repasse profissional

- [x] Mapear atendimentos particulares sem guia ou valor e os pagamentos recebidos disponíveis — 14 pagamentos confirmados já estavam corretamente vinculados aos atendimentos; a tela de repasse ignorava esses vínculos
- [x] Determinar a causa da ausência de valores — a consulta do repasse usava somente a guia e não consultava o pagamento particular vinculado
- [x] Corrigir a consulta para priorizar o pagamento particular confirmado sem alterar guias, séries ou pagamentos
- [x] Restaurar o percentual de repasse particular da Teresa para 50%
- [x] Validar os valores exibidos para cada profissional no repasse — 15 atendimentos particulares pagos passam a exibir R$ 4.167,28 de valor bruto e R$ 2.083,64 de repasse total, todos com percentual particular de 50%
- [x] Publicar a correção

## Bug em 2026-08-13 — link inválido de assinatura do contrato terapêutico

- [x] Mapear a geração, a persistência e a consulta do token de assinatura do contrato — o token do contrato 90001 está persistido e vigente até 20/08/2026, mas a página pública ainda exibe inválido
- [x] Identificar se a falha decorre de token, expiração ou domínio do link enviado — o componente público usa useParams fora de uma rota Wouter declarada; recebe token vazio e nunca consulta o token válido da URL
- [x] Corrigir o fluxo de geração e validação do link público sem invalidar contratos existentes — o App agora extrai e fornece o token da URL ao componente público, sem alterar tokens, contratos ou expirações existentes
- [x] Testar um novo link de contrato na página pública — token vigente do contrato 90001 carregou o documento e a tela de assinatura no ambiente de desenvolvimento
- [x] Publicar a correção e orientar o reenvio

## Bug em 2026-08-13 — prontuário de Severino pendente indevidamente em 06/08

- [x] Mapear o atendimento de 06/08, o prontuário registrado e o estado da agenda — há dois atendimentos: 14:30 (4680001), sem prontuário, e 14:40 (1830242), com prontuário marcado como concluído; a agenda mostra o cartão duplicado das 14:30
- [x] Identificar a divergência entre o prontuário salvo e o alerta visual — a pendência era do atendimento duplicado das 14:30, e não da sessão válida das 14:40
- [x] Corrigir o vínculo ou o estado sem alterar o conteúdo do prontuário — atendimento 4680001 cancelado administrativamente, mantendo a sessão das 14:40 e os seus prontuários
- [x] Validar a remoção da pendência na agenda — somente a sessão das 14:40 permanece realizada e com prontuário marcado

## Autorização em 2026-08-13 — remover atendimentos das 14:30

- [x] Mapear todos os atendimentos ativos das 14:30 e seus vínculos — existem 79 atendimentos ativos às 14:30, incluindo sessões realizadas com prontuários, guias e pacientes distintos; não se trata apenas do duplicado de Severino
- [x] Confirmar o impacto da remoção administrativa com o usuário — usuário restringiu a ação exclusivamente ao duplicado de Severino em 06/08 às 14:30

## Execução confirmada em 2026-08-13 — Severino, 06/08 às 14:30

- [x] Confirmar os vínculos finais do atendimento 4680001 antes do cancelamento — sem pagamento, assinatura ou prontuário; a sessão válida das 14:40 permanece ativa
- [x] Cancelar administrativamente apenas o atendimento duplicado das 14:30
- [x] Validar que a sessão das 14:40 e o prontuário permanecem ativos — atendimento 1830242 realizado, prontuário marcado e dois registros de prontuário preservados
- [x] Publicar a correção

## Bug em 2026-08-13 — sessão válida de Severino às 14:40 não aparece

- [x] Mapear a sessão das 14:40 e os filtros aplicados pela agenda — atendimento 1830242 permanece realizado, com prontuário e profissional válidos; o dado não foi removido
- [x] Identificar a condição que oculta a sessão válida após o cancelamento da duplicada — a grade só renderizava inícios exatos a cada 30 minutos; 14:40 não coincide com nenhum slot e era ocultado
- [x] Corrigir a exibição sem reativar o atendimento cancelado das 14:30 — horários fora da meia hora agora são agrupados no slot visual anterior, preservando a reserva da duração
- [x] Validar a agenda e publicar a correção — três testes de slots, TypeScript e build aprovados; a sessão de 14:40 passa a renderizar no slot visual das 14:30 sem reativar o duplicado cancelado

## Bug em 2026-08-13 — assinatura de Severino em 06/08 indicada como pendente

- [x] Mapear a assinatura de 06/08, a guia e o atendimento válido de Severino — a assinatura confirmada 5160008 está registrada na guia 240259 e inclui 06/08; a sessão válida é o atendimento 1830242 às 14:40
- [x] Identificar a divergência entre a assinatura confirmada e o alerta exibido — a guia 240259 foi removida, deixando a assinatura órfã; a agenda só carregava assinaturas ligadas a guias ainda existentes e ignorava a prova por data
- [x] Corrigir a associação de estado sem alterar a assinatura — assinaturas órfãs agora são associadas somente à sessão ativa única do mesmo paciente e data, ignorando duplicidades canceladas
- [x] Validar o ícone de assinatura na agenda e publicar a correção — 11 testes de assinatura aprovados, TypeScript e build sem erros; a sessão ativa de 06/08 prevalece sobre qualquer pendência histórica

## Bug em 2026-08-13 — grade da agenda desalinhada após ajuste de horários

- [x] Comparar a regra de slots anterior com a alteração que deslocou cartões — o agrupamento de todos os horários fora da meia hora para o slot anterior deslocou simultaneamente diversos cartões e criou sobreposições
- [x] Restaurar a regra normal da grade e tratar Severino sem movimentar os demais horários — cada cartão voltou ao seu horário real; a grade inclui slots extras somente nos horários efetivamente agendados, como 14:40
- [x] Validar a grade e a sessão de Severino sem efeitos colaterais — três testes de horários e assinaturas, TypeScript e build aprovados; a grade base e os horários exatos são mantidos simultaneamente
- [x] Publicar a correção

## Execução em 2026-08-13 — links de assinatura da Dra. Jéssica para 14/08

- [x] Confirmar os atendimentos da Dra. Jéssica em 14/08 e as guias elegíveis — 12 atendimentos foram identificados; a simulação revelou que o comparador de horário bloqueava indevidamente uma data futura
- [x] Vincular somente as guias independentes necessárias, preservando séries — seis atendimentos já tinham guias independentes válidas; cinco continuam sem guia segura e Marcos César é isento por PROASA Saúde
- [x] Corrigir a validação de janela para permitir links de consultas futuras — a expiração agora compara a data antes do horário, permitindo preparar links de amanhã sem liberar sessões passadas
- [x] Gerar tokens sincronizados em modo de preparação e validar os links públicos antes do envio — seis tokens foram sincronizados em assinaturasSadt e assinaturasGuias, sem WhatsApp enviado; as seis páginas públicas carregaram corretamente
- [x] Mapear os cinco atendimentos sem guia e seus procedimentos antes da criação — todos são Psicoterapia Individual; serão usados os procedimentos ativos correspondentes: Particular R$ 100,00 e TUSS 50000470 para Saúde Caixa e Postal Saúde
- [x] Criar ou vincular guias independentes aos cinco atendimentos pendentes — cinco guias avulsas e independentes foram criadas, uma por atendimento, sem bloqueios ou mistura de séries
- [x] Preparar e validar os novos links sem enviar WhatsApp — cinco novos tokens foram sincronizados e testados publicamente; agora há 11 links válidos e nenhum WhatsApp enviado
- [x] Remover do escopo de WhatsApp o segundo link preparado da Alice Sophia — será mantido apenas o link da guia BRD0001830342
- [x] Apresentar a mensagem e os destinatários para aprovação antes de qualquer envio
- [x] Enviar os links válidos por WhatsApp somente após aprovação explícita — dez mensagens foram entregues no escopo autorizado da Dra. Jéssica
- [x] Registrar os envios, bloqueios e a validade de cada link — Marcos César ficou fora por PROASA Saúde e o segundo link de Alice Sophia não foi enviado por solicitação da clínica; todos os enviados expiram uma hora antes da sessão

## Execução em 2026-08-13 — links de assinatura da Dra. Suzy para 14/08

- [x] Mapear os atendimentos de 14/08 e excluir PROASA Saúde e PROASA Pará — seis pacientes elegíveis e três pacientes PROASA Saúde isentos; não há PROASA Pará nesta agenda
- [x] Preparar e validar links públicos somente para pacientes elegíveis — três links válidos foram confirmados; Ana Beatriz, Maria Eduarda e Moises já constam como assinados e serão excluídos
- [x] Enviar os links válidos no escopo autorizado da Dra. Suzy — três mensagens foram enviadas para Ana Clara, André e Vinicius
- [x] Registrar os envios, isenções e validade de cada link — três sessões já assinadas foram preservadas sem reenvio e três pacientes PROASA Saúde permaneceram isentos; todos os links enviados expiram uma hora antes da consulta

## Execução em 2026-08-13 — links de assinatura do Dr. Tony para 14/08

- [x] Mapear os atendimentos de 14/08 e excluir PROASA Saúde e PROASA Pará — há dez atendimentos elegíveis, todos ainda sem guia, e uma paciente PROASA Saúde isenta; não há PROASA Pará
- [x] Vincular procedimentos psicoterapêuticos e criar guias independentes para os atendimentos elegíveis — dez guias independentes foram criadas para os atendimentos sem guia; o atendimento PROASA Saúde permaneceu sem envio
- [x] Preparar e validar links públicos somente para pacientes elegíveis — os dez links foram preparados e validados publicamente, sem retorno de link inválido
- [x] Enviar os links válidos no escopo autorizado do Dr. Tony — dez mensagens foram enviadas após validação pública dos links
- [x] Registrar os envios, isenções e validade de cada link — Rebeca Moda da Fonseca Leite (PROASA Saúde) permaneceu isenta; não houve PROASA Pará e todos os links enviados expiram uma hora antes da consulta

## Execução em 2026-08-13 — links de assinatura de Gilzemberg para 14/08

- [x] Mapear os atendimentos de 14/08 e excluir PROASA Saúde e PROASA Pará — sete pacientes são elegíveis; Vinicius Fernandes (PROASA Saúde), Keite Ana e Monalisa (PROASA Pará) ficaram isentos; Fernanda Castelo Branco ainda não possui guia
- [x] Mapear o procedimento de Fernanda Castelo Branco — consulta ambulatorial em psicologia (50001221), Bradesco Saúde, R$ 52,99, já vinculado ao atendimento
- [x] Vincular guia independente ao atendimento elegível de Fernanda Castelo Branco — bloqueado com segurança porque a paciente não possui número de carteirinha, requisito obrigatório da guia
- [x] Preparar e validar links públicos somente para pacientes elegíveis — sete links foram preparados e todos carregaram corretamente na página pública; Fernanda permaneceu sem envio por falta de guia
- [x] Enviar os links válidos no escopo autorizado de Gilzemberg — sete mensagens foram enviadas para Leticia, Mario, Francinara, Samara, Marcilene, Paula e Eliege
- [x] Registrar os envios, isenções e validade de cada link — Fernanda ficou bloqueada por falta de carteirinha e Vinicius, Keite e Monalisa foram excluídos por PROASA Saúde/PROASA Pará; os links enviados expiram uma hora antes da consulta

## Regularização em 2026-08-13 — link de Fernanda Castelo Branco

- [x] Verificar todas as fontes internas para localizar a carteirinha de Fernanda — há dois cadastros homônimos; o registro Bradesco ativo não possui carteirinha, cartão SUS nem anexo de documento
- [ ] Solicitar a carteirinha ao usuário se não houver dado no sistema
- [ ] Criar guia, validar o link público e enviar após completar o cadastro
- [ ] Registrar a entrega e a validade do link

## Correção em 2026-08-13 — alerta de faltas consecutivas em 30 dias

- [x] Mapear a regra atual e as faltas que geraram o alerta de Gabriel — a rotina considerava 90 dias e apenas a lista de faltas; Gabriel possui faltas em 01/08 e 08/08, que são consecutivas e válidas dentro de 30 dias
- [x] Implementar a regra de duas faltas consecutivas no intervalo de 30 dias — a consulta agora lê o histórico completo de 30 dias, ignora futuros e cancelamentos e deixa um atendimento realizado interromper a sequência
- [x] Testar faltas consecutivas, intercaladas e fora de 30 dias — quatro cenários unitários aprovados; TypeScript e build concluídos sem erros
- [x] Validar o alerta exibido na agenda e publicar a correção — a interface passou a informar explicitamente duas faltas consecutivas nos últimos 30 dias

## Correção urgente em 2026-08-13 — edição e salvamento da guia no pré-faturamento

- [x] Reproduzir a edição de campos e identificar quais valores se perdem ao reabrir a guia — o formulário permite alterar os valores, mas o callback descarta parte do payload e a reidratação prioriza valores-padrão sobre a guia salva
- [x] Mapear o contrato de dados entre GuiaSADTPrefaturamento, mutation e tabela guias — campos clínicos, OPME/gases e dados complementares não eram persistidos integralmente; valores vazios também eram descartados por condicionais de verdade
- [x] Corrigir a habilitação dos campos e a persistência integral da guia — edições não são mais substituídas pela reidratação; procedimentos, exclusões, valores zero, campos vazios e dados clínicos são persistidos
- [x] Validar reabertura da guia e geração do XML com os valores salvos — 3 testes específicos, TypeScript e build aprovados; XML TISS 4.02.00 recebe indicação clínica e o campo 65
- [x] Publicar a correção

## Solicitação em 2026-08-14 — profissional solicitante a partir do pedido médico

- [x] Mapear pedidos médicos anexados e identificar fontes confiáveis para nome, conselho, registro, UF e CBO do profissional solicitante — há 73 referências legadas somente com nome de arquivo e 1 pedido arquivado no armazenamento; os campos estruturados já existem no cadastro do paciente
- [x] Implementar leitura assistida do pedido médico e preenchimento automático da Guia SADT sem substituir dados confirmados manualmente — botão Ler pedido médico, extração estruturada e persistência apenas de lacunas foram incluídos no pré-faturamento
- [x] Validar documentos legíveis, ausência de pedido e divergências antes de salvar na guia — um PDF armazenado retornou assinatura CRM-AM com confiança 1,00; CBO não foi inventado; seis testes unitários, TypeScript e build aprovados
- [x] Publicar a melhoria e relatar a cobertura obtida

## Solicitação em 2026-08-14 — datas e hora final na execução da Guia SADT

- [x] Mapear a origem de data, hora inicial e duração dos atendimentos exibidos nas linhas de execução — data, hora e duração são retornadas das sessões vinculadas; o formulário preenchia somente a hora inicial e descartava os demais dados ao salvar
- [x] Preencher e persistir data, hora inicial e hora final para cada atendimento da guia — o término é calculado pela duração, os três valores são persistidos em guiaProcedimentos e reabertos na guia
- [x] Validar visualização, reabertura e dados usados na exportação XML TISS — 12 testes aprovados; XML inclui dataExecucao, horaInicio e horaFim; TypeScript e build aprovados
- [x] Publicar a correção

## Solicitação em 2026-08-14 — recebimento OAB no balcão de atendimento

- [x] Mapear o cadastro do convênio OAB e as regras atuais de lançamento de pagamentos no atendimento — convênio ativo 630004; o balcão já cria pagamento, Conta a Receber e vínculo nos atendimentos, porém o botão estava limitado a Particular e Vale Saúde
- [x] Permitir registrar o recebimento OAB pelo balcão de atendimento com forma, valor e data de pagamento — OAB foi incluído no menu de ações e o modal identifica explicitamente o recebimento OAB
- [x] Integrar o lançamento ao financeiro, repasse e auditoria sem criar duplicidades — Conta a Receber é criada pelo fluxo existente; OAB não recebe repasse particular automático; a mutation bloqueia pagamento duplicado, mistura de convênios e grava auditoria
- [x] Validar permissões e publicar a implementação — perfis master, administração e recepção são autorizados; profissional é bloqueado; três testes unitários, TypeScript e build aprovados

## Solicitação em 2026-08-14 — número real da sessão no link de assinatura

- [x] Mapear o cálculo da sessão na série e os modelos de mensagem enviados aos pacientes — o envio diário gravava sessaoNumero fixo como 1 e o texto não recebia a posição da série
- [x] Corrigir a numeração enviada para refletir a posição real do atendimento na série — o cálculo considera série, data, horário e início da guia; o número é preservado ao assinar ou excluir outra sessão
- [x] Validar primeira, segunda, terceira sessão e atendimento avulso — quatro testes aprovados, TypeScript, sintaxe do script e build aprovados
- [x] Publicar a correção

## Solicitação em 2026-08-14 — assinaturas concluídas não aparecem em Guia SADT / Assinar

- [x] Mapear a persistência da assinatura pública e a consulta usada no campo Guia SADT / Assinar — o modal buscava a guia mais recente do paciente, que podia ser de outra série e ocultar a assinatura da guia do atendimento
- [x] Corrigir a sincronização e a associação de assinatura por guia, atendimento e data — a Agenda envia guiaId e atendimentoId; a consulta abre a guia exata e localiza a assinatura pública pela data correspondente
- [x] Validar a exibição de assinaturas concluídas na agenda e na Guia SADT — dois testes de associação por data aprovados, além de TypeScript e build
- [x] Publicar a correção

## Bug em 2026-08-14 — assinatura histórica aparece no atendimento errado

- [x] Diagnosticar por que uma assinatura de outra data é exibida na sessão aberta — a guia recém-criada não tinha vínculo de atendimento e o modal reutilizava a última assinatura histórica em vez de procurar o token pela data
- [x] Exibir assinatura somente quando vinculada à data e à sessão do atendimento atual — a consulta prioriza assinatura pública com datasAtendimento igual à data aberta; sem coincidência, o campo 67 permanece pendente
- [x] Validar sessão assinada, sessão pendente e histórico sem reaproveitamento indevido — a assinatura da 2ª sessão de 15/08 foi localizada na guia G202608780219570005; três testes, TypeScript e build aprovados
- [x] Publicar a correção

## Bug em 2026-08-14 — assinaturas de guias não aparecem de forma geral em Guia SADT / Assinar

- [x] Diagnosticar as assinaturas da guia G202608780171570005 e outras guias afetadas — os registros existem em assinaturasGuias, mas a Agenda convertia datas Date para texto com fuso e enviava uma chave de data inválida à consulta
- [x] Corrigir a recuperação abrangente de assinaturas por guia, sessão e data de atendimento — a Agenda passa data no padrão brasileiro; o servidor normaliza para ISO e busca a guia cujo token contém a mesma data
- [x] Validar guias com múltiplas assinaturas concluídas e atendimentos pendentes — a guia G202608780171570005 possui cinco sessões concluídas e a data 15/08 foi localizada; quatro testes, TypeScript e build aprovados; exibição confirmada pela clínica após a publicação
- [x] Publicar a correção geral

## Solicitação em 2026-08-14 — preparar links de assinatura de Silmara para amanhã

- [x] Identificar a profissional Silmara e os atendimentos de amanhã elegíveis para assinatura — Silmara Elizandra Barbosa Borges (570010) possui 13 atendimentos ativos em 15/08/2026
- [x] Preparar e validar cada link sem enviar mensagens — rotina executada no modo seguro; nenhum link foi enviado nem gerado, pois os 13 atendimentos ainda estão sem guia vinculada
- [x] Apresentar pacientes e mensagem para aprovação explícita antes do envio — lista e modelo de mensagem foram apresentados, e a clínica autorizou vinculação e envio
- [x] Criar ou vincular as guias necessárias para os 13 atendimentos autorizados — 12 guias independentes foram criadas e a guia de série já existente de Thais Silva de Souza foi vinculada, sem bloqueios
- [x] Preparar e validar os links após a vinculação das guias — 13 tokens foram preparados e os 13 links responderam HTTP 200 publicamente antes do envio
- [x] Enviar os links válidos após autorização explícita recebida da clínica — 13 mensagens foram enviadas, sem pendências; expiração configurada para uma hora antes de cada consulta

## Solicitação em 2026-08-14 — preparar links de assinatura da Dra. Ozilene para amanhã

- [x] Identificar os atendimentos elegíveis e guias ausentes da Dra. Ozilene — 14 atendimentos ativos em 15/08/2026; seis elegíveis e oito sem referência segura de procedimento
- [x] Criar ou vincular guias e validar os links, sem enviar mensagens — seis guias foram criadas/vinculadas; seis tokens preparados e todos responderam HTTP 200; nenhum WhatsApp foi enviado
- [x] Apresentar lista de pacientes e mensagem com aviso de ausência na próxima semana para aprovação — mensagem individualizada apresentada e aprovada para os seis links válidos
- [x] Enviar somente após autorização expressa da clínica — seis mensagens foram enviadas para Rita, Davi, Yanka, Leticia, Jorge e Janaína, com expiração uma hora antes da consulta; oito atendimentos permaneceram sem envio por ausência de procedimento seguro ou isenção PROASA Pará

## Solicitação em 2026-08-14 — procedimentos bloqueados da Dra. Ozilene

- [x] Mapear os atendimentos bloqueados e suas referências de procedimento por convênio, série e histórico — os oito atendimentos tinham procedimento vazio e nenhum histórico seguro; cada convênio possuía múltiplas opções ativas
- [x] Apresentar os bloqueios e a correção segura necessária para cada paciente — a clínica confirmou o código 50000470 para todos os bloqueios

## Solicitação em 2026-08-14 — aplicar procedimento 50000470 aos bloqueios da Dra. Ozilene

- [x] Confirmar o cadastro ativo do procedimento 50000470 em cada convênio afetado — ativo para Bradesco Saúde (R$ 46,83), GEAP (R$ 42,32) e PROASA Pará (R$ 50,00)
- [x] Vincular o procedimento aos atendimentos bloqueados e criar ou vincular guias elegíveis — oito atendimentos receberam o procedimento e oito guias foram criadas/vinculadas sem bloqueios
- [x] Preparar e validar novos links sem enviar mensagens — sete tokens foram preparados e todos retornaram HTTP 200; Leane permaneceu isenta por PROASA Pará
- [x] Apresentar os novos links para autorização de envio — os sete links foram aprovados e enviados com aviso de ausência da Dra. Ozilene na próxima semana

## Solicitação em 2026-08-14 — confirmação de consulta de Elane

- [x] Identificar a paciente Elane e a consulta que receberá confirmação — Adelayne Maria Rondon Tome da Silva, consulta de 15/08/2026 às 16:00 com Thiffane Ferreira Costa, Luminar Saúde
- [x] Preparar e validar o link de confirmação sem enviar mensagem — token preparado com validade de 24 horas e link validado publicamente com HTTP 200; nenhum WhatsApp foi enviado
- [x] Apresentar o texto da mensagem para aprovação explícita — cancelado antes da aprovação porque a clínica corrigiu o nome da paciente para Leane
- [x] Enviar somente após autorização da clínica — não enviado, pois a destinatária correta era Leane e a confirmação dela foi tratada separadamente

## Correção em 2026-08-14 — confirmação de consulta de Leane

- [x] Confirmar a consulta correta de Leane Alves dos Anjos — 15/08/2026 às 11:30, com Ozilene Duarte de Lima dos Santos, PROASA Pará
- [x] Preparar e validar o link de confirmação sem envio — link gerado com validade de 24 horas e validado publicamente com HTTP 200; nenhuma mensagem enviada
- [x] Apresentar a mensagem correta para autorização explícita — mensagem revisada com aviso de ausência da Dra. Ozilene e solicitação de presença foi aprovada
- [x] Enviar somente após autorização da clínica — confirmação enviada ao telefone final 8148; o link de confirmação continua válido por 24 horas

## Ajuste em 2026-08-14 — aviso de ausência da Dra. Ozilene na confirmação de Leane

- [x] Redigir e apresentar a mensagem revisada para aprovação
- [x] Enviar somente após autorização explícita da clínica

## Bug em 2026-08-14 — agenda profissional falha ao voltar para semana anterior

- [x] Reproduzir e analisar a navegação para semana anterior nos perfis de Tony e Naiara — o backend retorna os históricos sem filtro de semana; a Agenda processava localmente dados com data/hora sem normalização consistente, aumentando o risco de exceção em registros históricos
- [x] Corrigir o carregamento de agenda por profissional e intervalo de datas — normalização segura de datas e horários, rejeição de itens incompletos e proteção do estado de data por profissional foram aplicadas
- [x] Validar semanas anterior, atual e seguinte para Tony, Naiara e demais perfis — três testes de datas e horários, TypeScript e build aprovados; auditoria confirmou 285 atendimentos de Tony e 159 de Naiara sem vínculos ou horários ausentes
- [x] Publicar a correção

## Solicitação em 2026-08-15 — preparar links de assinatura de Silmara para segunda-feira

- [x] Identificar os atendimentos elegíveis e as guias ausentes em 18/08/2026 — nove atendimentos ativos; oito com procedimento seguro e uma particular sem referência de procedimento
- [x] Criar ou vincular guias e validar os links sem envio — oito guias criadas/vinculadas; cinco links elegíveis preparados e os cinco retornaram HTTP 200; nenhum WhatsApp enviado
- [x] Apresentar pacientes e mensagem para aprovação explícita — lista de cinco pacientes e mensagem foram revisadas pela clínica, com remoção do número de sessões
- [x] Enviar somente após autorização da clínica — cinco mensagens foram enviadas para Paterson, Isabelle, Simon, Ravella e Tayse com texto sem sessão e expiração uma hora antes de cada consulta

## Ajuste em 2026-08-15 — mensagem de links de Silmara sem número de sessões

- [x] Revisar e apresentar a mensagem sem referência ao número ou total de sessões
- [x] Enviar somente após autorização explícita da clínica

## Solicitação em 2026-08-15 — preparar links de assinatura da Dra. Thiffane para segunda-feira

- [x] Identificar os atendimentos elegíveis e as guias ausentes em 18/08/2026 — sete atendimentos ativos; seis com procedimento seguro e uma Aline GEAP sem referência de procedimento
- [x] Criar ou vincular guias e validar os links sem envio — cinco guias foram criadas/vinculadas e uma já existia; seis links preparados e todos retornaram HTTP 200; nenhum WhatsApp enviado
- [x] Apresentar pacientes e mensagem para aprovação explícita — relação final de sete links, incluindo Aline unificada, foi apresentada e aprovada
- [x] Enviar somente após autorização da clínica — sete links enviados com expiração uma hora antes, sem pendências

## Ajuste em 2026-08-15 — links multidata e reagendamento da Dra. Thiffane

- [x] Confirmar os atendimentos de 18 e 19/08 de Gabriel, Luana Joia e Asterson para uma assinatura com duas datas — os três links foram configurados com os campos de assinatura de 18 e 19/08 e validados publicamente com HTTP 200
- [x] Reagendar Aline Alcantara para 18:30 e vincular o procedimento 50000470 — atendimento GEAP 1860123 reagendado e guia criada com o procedimento autorizado; o link segue bloqueado por telefone ausente ou inválido
- [x] Preparar e validar os links finais, mantendo os links de Rayane aptos sem envio — seis links restantes estão válidos; Rayane tem dois links independentes para 14:00 e 14:30, ambos prontos e ainda não enviados
- [x] Apresentar lista e mensagens finais antes de qualquer envio

## Autorização em 2026-08-15 — envio final dos links da Dra. Thiffane

- [x] Preservar as duas datas configuradas nos links de Gabriel, Luana Joia e Asterson durante o envio — mensagens confirmaram 18 e 19/08 e informaram um campo de assinatura para cada data
- [x] Enviar os sete links validados com as mensagens aprovadas — enviados para Gabriel, Rayane (14:00 e 14:30), Luana Joia, Asterson e Aline (18:30 e 19:00)
- [x] Conferir destinatários, respostas do WhatsApp e pendências após o envio — sete envios registrados no relatório, sem pendências; todos os links permanecem válidos até uma hora antes do horário correspondente

## Solicitação em 2026-08-15 — preparar links de assinatura da Dra. Jéssica

- [x] Identificar os atendimentos elegíveis e as guias ausentes na próxima agenda da Dra. Jéssica — a clínica definiu explicitamente a agenda de 17/08/2026
- [x] Criar ou vincular guias e validar links sem envio — executado no escopo de 17/08/2026
- [x] Apresentar pacientes e mensagem para aprovação explícita — executado no escopo de 17/08/2026
- [x] Enviar somente após autorização da clínica — executado no escopo de 17/08/2026

## Solicitação em 2026-08-15 — preparar links da Dra. Jéssica para segunda-feira 17/08

- [x] Identificar os atendimentos elegíveis e guias ausentes em 17/08/2026 — 14 atendimentos ativos; nove com procedimento seguro, uma isenta PROASA Pará e quatro bloqueados por guia, procedimento ou telefone
- [x] Criar ou vincular guias e validar links sem envio — nove guias foram criadas/vinculadas, nove links preparados e todos retornaram HTTP 200; nenhum WhatsApp enviado
- [x] Apresentar pacientes e mensagem para aprovação explícita — relação de links e mensagem foram apresentadas e aprovadas pela clínica
- [x] Enviar somente após autorização da clínica — nove links elegíveis foram enviados; a exceção MEDSERVICE foi registrada e a regra corrigida para próximos disparos

## Autorização em 2026-08-15 — envio dos links da Dra. Jéssica

- [x] Enviar os nove links validados para 17/08, mantendo Carla fora do fluxo — nove links autorizados foram enviados; uma mensagem adicional foi enviada indevidamente para Ana Laura (MEDSERVICE) antes da correção da regra de isenção
- [x] Conferir o resultado e registrar os destinatários e pendências — Carla, Amanda, Fernanda e Isadora não receberam link; Ana Laura foi comunicada à clínica como exceção indevida

## Correção em 2026-08-15 — isenção MEDSERVICE no envio de assinaturas

- [x] Reconhecer as grafias MEDISERVICE e MEDSERVICE como convênios isentos de assinatura
- [x] Validar que os links de convênios isentos não entram em envios autorizados — preparação controlada deixou Ana Laura como convênio isento; dois testes, sintaxe do script, TypeScript e build aprovados

## Bug em 2026-08-15 — botão de limpar filtro Profissional na Agenda

- [x] Mapear o estado e o controle de limpeza do filtro profissional — a seleção automática era reativada sempre que a lista ficasse vazia, impedindo a limpeza manual
- [x] Corrigir a remoção da seleção e o recarregamento da Agenda — a limpeza passa a ser persistida no estado da tela, fecha o menu, limpa busca e remove o profissional ativo
- [x] Validar seleção, limpeza e exibição da Agenda — três testes unitários, TypeScript e build aprovados
- [x] Publicar a correção

## Solicitação em 2026-08-15 — remover aviso de faltas consecutivas

- [x] Mapear o alerta de faltas e o atalho de WhatsApp associados na Agenda — não há referência ativa ao aviso ou a atalho de WhatsApp por faltas na interface atual
- [x] Remover a exibição e os controles do aviso, preservando o histórico de atendimentos — a consulta interna de faltas permanece no servidor para preservar o histórico, mas não existe componente visível ou ação de Agenda que a apresente
- [x] Validar a Agenda sem o aviso de faltas — revisão do código da Agenda confirma que os únicos alertas visíveis são de prontuário em atraso, profissional ausente e datas futuras de assinatura
- [x] Publicar a remoção — a retirada já está contemplada na versão atualmente publicada; item de controle atualizado

## Ajuste em 2026-08-15 — procedimento 50000470 para bloqueios da Dra. Jéssica

- [x] Confirmar o cadastro ativo do procedimento 50000470 nos convênios GEAP, Luminar e AFFEAM — GEAP e Luminar possuem uma opção única; AFFEAM possui duas opções e não foi aplicado a Carla
- [x] Aplicar o procedimento aos atendimentos bloqueados e criar ou vincular guias elegíveis — Amanda (GEAP) e Ana Luiza (Luminar) receberam o mapeamento único; duas guias foram criadas
- [x] Preparar e validar novos links sem envio — o link de Ana Luiza foi preparado e validado com HTTP 200; Amanda continua bloqueada por telefone inválido ou ausente
- [x] Apresentar os novos links para autorização — a relação final de nove links permitidos foi apresentada, sem novos envios

## Ajuste em 2026-08-15 — excluir Carla dos links da Dra. Jéssica

- [x] Manter Carla Beatriz Gurgel de Queiroz sem guia e sem link de assinatura
- [x] Apresentar somente os links permitidos e as pendências de contato para autorização

## Solicitação em 2026-08-15 — revisar agenda de segunda-feira da Dra. Thiffane

- [x] Conferir horários, pacientes e guias da agenda de 18/08/2026 — sete atendimentos ativos, cada um com guia vinculada; Gabriel, Luana Joia e Asterson preservam links de duas datas
- [x] Conferir situação de validade e envio dos links já preparados — os sete links estão pendentes de assinatura, enviados por WhatsApp e válidos até uma hora antes do horário correspondente
- [x] Apresentar o resultado sem realizar novos envios — revisão comunicada à clínica sem disparar novas mensagens

## Correção em 2026-08-15 — data de segunda-feira nas agendas

- [x] Confirmar o dia da semana correspondente às datas 17 e 18/08/2026 — 17/08/2026 é segunda-feira e 18/08/2026 é terça-feira
- [x] Corrigir a referência de segunda-feira usada nas revisões de agenda — a clínica solicitou manter os links já enviados para 18/08 e não criar novos disparos para 17/08

## Ajuste em 2026-08-15 — telefone de Aline Alcantara no atendimento reagendado

- [x] Localizar o telefone válido no cadastro de Aline Alcantara — telefone informado pela clínica: final 2230
- [x] Atualizar o atendimento das 18:30 e preparar o link sem envio — telefone cadastrado, guia GEAP vinculada com procedimento 50000470 e token preparado sem WhatsApp
- [x] Validar o link e incluir Aline na lista final de autorização — link de 18:30 validado publicamente com HTTP 200

## Ajuste em 2026-08-15 — telefone informado para Aline Alcantara

- [x] Cadastrar o telefone 9298121-2230 no perfil correto de Aline Alcantara
- [x] Preparar e validar o link do atendimento de 18:30 sem envio
- [x] Apresentar a lista final antes de qualquer envio

## Correção em 2026-08-15 — unificar cadastro incompleto de Aline

- [x] Mapear os registros Aline e todas as referências de agenda, guias, assinaturas e financeiro — o cadastro incompleto tinha 10 atendimentos, quatro guias e duas assinaturas; o cadastro completo preservava CPF e contato corretos
- [x] Transferir referências para o cadastro completo de Aline Alcântara de Souza e arquivar o duplicado incompleto — todas as referências foram movidas ao cadastro 780312 e o registro incompleto com CPF de preenchimento foi removido após a transferência
- [x] Validar agenda, guia e link de assinatura após a unificação — Aline Alcântara de Souza agora reúne 17 atendimentos, oito guias e todos os links; o atendimento de 18/08 às 18:30 preserva guia 3180001 e telefone válido
- [x] Publicar a correção

## Solicitação em 2026-08-15 — remover aviso de faltas consecutivas

- [x] Mapear o alerta de faltas e o atalho de WhatsApp associados na Agenda
- [x] Remover a exibição e os controles do aviso, preservando o histórico de atendimentos
- [x] Validar a Agenda sem o aviso de faltas — TypeScript e build aprovados; teste de regressão específico com 2 verificações aprovado
- [x] Publicar a remoção

## Correção em 2026-08-16 — falhas da suíte automatizada

- [x] Revisar as quatro verificações de responsividade e impressão desatualizadas
- [x] Corrigir a validação de atualização vazia de prontuário
- [x] Validar TypeScript, build e a suíte completa de testes — 68 arquivos e 264 testes aprovados
- [x] Publicar as correções

## Correção em 2026-08-16 — reutilizar guia SP/SADT da mesma série

- [x] Investigar os atendimentos, série e guia existente do Theo
- [x] Corrigir o vínculo para reutilizar uma guia na mesma série de atendimentos
- [x] Validar o caso do Theo e a regra de regressão para séries — 4 atendimentos da série tony-set-630081 vinculados à única guia 2070020; TypeScript, build e 281 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-16 — sincronizar campos da Guia SP/SADT

- [x] Mapear os campos 2, 4 e 22 na tela, persistência e XML
- [x] Fazer o campo 2 usar o número da guia do prestador e o campo 4 replicar o campo 22
- [x] Validar salvamento, reabertura, XML e testes de regressão — teste específico aprovado; build e suíte completa com 72 arquivos e 283 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-16 — Agenda solicita guia mesmo com série vinculada

- [x] Mapear o caminho da Agenda que abre o pré-faturamento
- [x] Corrigir a identificação e abertura da guia existente da série
- [x] Validar a reutilização da guia a partir da Agenda — teste cobre guia em sessão fora da semana aberta; TypeScript, build e 72 arquivos com 284 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-16 — Agenda abre modal de assinatura sem guia

- [x] Investigar a falha de localização da guia mostrada na Agenda
- [x] Abrir diretamente o pré-faturamento da guia existente da série
- [x] Validar o fluxo da Agenda sem o modal vazio de assinatura — TypeScript, build e 73 arquivos com 285 testes aprovados
- [x] Publicar a correção

## Apuração em 2026-08-16 — autorizações Bradesco Saúde em setembro

- [x] Consultar os atendimentos Bradesco Saúde de setembro — 42 pacientes e 143 atendimentos encontrados
- [x] Classificar elegíveis e pendências de autorização — 40 com carteirinha e procedimento registrados; 4 pacientes com pendências cadastrais ou de guia
- [x] Informar a quantidade para a clínica

## Ajuste em 2026-08-16 — procedimento e guias Bradesco pendentes

- [x] Identificar atendimentos pendentes e o cadastro do procedimento 5000470 — o cadastro correto no Bradesco é 50000470, procedimento interno 600005
- [x] Aplicar o procedimento e vincular as guias necessárias
- [x] Validar os vínculos e listar paciente e profissional

## Apuração em 2026-08-16 — pacientes Bradesco do Tony

- [x] Consultar os pacientes Bradesco de setembro do profissional Tony — 21 pacientes localizados
- [x] Informar a lista filtrada para a clínica

## Operação em 2026-08-16 — solicitações Bradesco do Tony

- [x] Identificar pacientes elegíveis do Tony e excluir Theo Brandão Guimarães — 21 guias restantes após a exclusão
- [x] Validar os dados obrigatórios das solicitações — nenhuma guia está pronta para fila: faltam encaminhamento e dados do médico solicitante; uma guia também não tem código TUSS
- [ ] Confirmar o envio ao portal Bradesco
- [ ] Registrar os resultados das solicitações enviadas

## Verificação em 2026-08-16 — dados da Dra. Suzy para Bradesco

- [x] Consultar cadastro e documentos disponíveis da Dra. Suzy
- [x] Conferir se os dados atendem às exigências de autorização Bradesco — cadastro tem CRP, UF e CBO; não há encaminhamento médico identificado em anexo
- [x] Informar disponibilidade e pendências

## Verificação em 2026-08-16 — anexos dos pacientes da Dra. Suzy

- [x] Consultar pacientes e anexos vinculados à Dra. Suzy — 30 pacientes atendidos; seis possuem anexos
- [x] Classificar a disponibilidade de encaminhamentos médicos — seis pacientes possuem sete pedidos médicos anexados
- [x] Informar a situação dos anexos para a clínica

## Operação em 2026-08-16 — autorizações Bradesco da Dra. Suzy

- [x] Identificar guias Bradesco da Dra. Suzy com pedido médico anexado — seis pacientes e nove guias localizados, todas emitidas em agosto
- [x] Validar requisitos e excluir guias já autorizadas ou duplicadas — das 15 guias emitidas em agosto, cinco referenciam pedido médico e nenhuma já possui solicitação, protocolo ou autorização Bradesco. Ana Beatriz possui duas guias duplicadas para o mesmo procedimento/data; as demais candidatas ainda não têm item TUSS. João Ricardo e Vitória possuem pedido médico efetivamente anexado, porém ainda sem CBOS do médico solicitante; os registros de Ana Beatriz e Vinicius referenciam arquivo sem anexo correspondente na pasta do paciente. Portanto, nenhuma guia foi incluída em fila ou transmitida.
- [ ] Confirmar o envio ao portal Bradesco
- [ ] Registrar os resultados das solicitações enviadas

## Correção em 2026-08-16 — Agenda continua pedindo nova guia

- [x] Mapear todas as ações da Agenda que podem solicitar nova guia
- [x] Unificar a abertura da guia existente e bloquear criação redundante — a Agenda agora consulta as guias atualizadas antes de abrir a criação
- [x] Validar os fluxos da Agenda e prevenir regressões — TypeScript, build e 73 arquivos com 286 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-17 — guia vinculada e permissão da recepção

- [x] Mapear a permissão de recepção e a sinalização de guia na Agenda
- [x] Corrigir a criação pela recepção e a indicação de guia criada ou vinculada
- [x] Validar a criação pela recepção e a indicação visual na Agenda — TypeScript, build e 73 arquivos com 286 testes aprovados
- [x] Publicar a correção

## Limpeza em 2026-08-17 — pacientes de lembrete de teste

- [x] Identificar os registros “Paciente Lembrete Teste” e suas referências — 32 cadastros e 60 agendamentos, sem guias, financeiro, assinaturas ou prontuários
- [x] Remover os pacientes de teste e os agendamentos associados
- [x] Confirmar a limpeza da Agenda — nenhum cadastro ou agendamento de teste remanescente

## Correção em 2026-08-17 — guia Bradesco de Edimilton Alves

- [x] Investigar o cadastro, atendimentos e guias de Edimilton Alves — quatro atendimentos Bradesco sem serieId, guiaId e procedimento em três sessões; a criação avulsa não vinculava a guia ao atendimento
- [x] Corrigir o dado ou a regra que impede a criação da guia — criação avulsa passa o atendimentoId e o servidor vincula a guia imediatamente
- [x] Validar a criação e o vínculo da guia Bradesco — guia G202608171830268 criada para quatro sessões, todas vinculadas, com profissional Jairo e procedimento 50000470; TypeScript, build e 74 arquivos com 288 testes aprovados
- [x] Publicar a correção geral de vínculo de guia individual

## Correção em 2026-08-17 — guias ausentes do convênio Luminar

- [x] Identificar atendimentos Luminar sem guia e os procedimentos relacionados — 18 atendimentos de sete pacientes, sem serieId e quase todos sem procedimento
- [x] Corrigir os dados ou vínculos que impedem a criação de guia — procedimento 50000470 aplicado, séries independentes criadas e sete guias vinculadas
- [x] Validar as guias Luminar criadas e vinculadas — 18 atendimentos vinculados às respectivas guias, com saldo e valor por série conferidos
- [x] Publicar a correção

## Ajuste em 2026-08-17 — assinatura em guia física por convênio

- [x] Mapear a regra atual e os caminhos de envio de link de assinatura
- [x] Bloquear o envio para PROASA Saúde, AFFEAM, MEDISERVICE e FUSEX com aviso de guia física
- [x] Validar a regra no envio individual e em lote — TypeScript, build e 75 arquivos com 295 testes aprovados
- [x] Publicar a atualização

## Correção em 2026-08-17 — carregamento de profissionais

- [x] Diagnosticar a falha de carregamento da lista de profissionais — havia 20 profissionais ativos no banco e consulta protegida funcional, mas a tela tratava falhas de consulta como lista vazia e podia interromper a filtragem diante de campos legados ausentes
- [x] Corrigir a consulta, permissão ou interface afetada — a interface agora distingue carregamento, falha e lista vazia, oferece nova tentativa e usa filtro tolerante a nome, conselho ou especialidade ausentes
- [x] Validar o carregamento de profissionais e prevenir regressão — incluídos três testes para busca, cadastros legados incompletos e filtro de ativos; TypeScript, build e 92 arquivos com 338 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-17 — pendência de assinatura Bradesco na Agenda

- [x] Investigar o status de assinatura das guias Bradesco na Agenda — a regra só marcava pendência após token/link criado, ignorando guias Bradesco já criadas e ainda sem assinatura
- [x] Corrigir a regra que determina a pendência de assinatura — guias de convênios digitais passam a ficar pendentes desde a criação; convênios de guia física permanecem excluídos
- [x] Validar guias Bradesco assinadas e pendentes na Agenda — cenários de guia Bradesco sem link, guia física e assinatura concluída foram cobertos; TypeScript, build e 75 arquivos com 297 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-17 — datas de execução vinculadas às assinaturas

- [x] Mapear as datas de execução e de assinatura na guia
- [x] Sincronizar o preenchimento das datas de execução com assinaturas
- [x] Validar a tabela de execução e as assinaturas vinculadas — teste cobre datas múltiplas, duplicadas e legadas; TypeScript, build e 76 arquivos com 299 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-17 — cruzamento de profissionais em guias

- [x] Investigar a guia da Dra. Suzy exibida como Nayara — Helena possui guias independentes de Suzy e Nayara; a busca do modal priorizava a data/paciente sem restringir o profissional, permitindo abrir a guia de Nayara a partir de atendimento da Suzy
- [x] Corrigir dados cruzados e reforçar o isolamento por profissional
- [x] Validar guias e assinaturas sem mistura de profissionais — busca, histórico e modal recebem e restringem o profissional do atendimento; TypeScript, build e 77 arquivos com 300 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-17 — logo de convênio não salva

- [x] Diagnosticar o envio e o armazenamento da logo do convênio — a tela usava uma rota HTTP genérica, enquanto o sistema já possui mutation autenticada própria para logo de convênio
- [x] Corrigir o salvamento e a exibição da logo — o envio usa a mutation de convênios, atualiza o formulário e exibe o erro retornado
- [x] Validar o envio de logo e prevenir regressão — TypeScript, build e 78 arquivos com 302 testes aprovados
- [x] Publicar a correção

## Ajuste em 2026-08-18 — opções de Tipo / Especialidade

- [x] Localizar a lista do campo Tipo / Especialidade
- [x] Remover Sessão, Psiquiatria, Fisioterapia, Fonoaudiologia, Nutrição e Terapia Ocupacional
- [x] Validar o campo Tipo / Especialidade — TypeScript, build e 79 arquivos com 309 testes aprovados
- [x] Publicar a atualização

## Correção em 2026-08-19 — guias duplicadas da mesma série

- [x] Investigar as guias e os atendimentos da série de Priscila Abinader Ribeiro — as quatro sessões semanais de agosto estavam sem uma série comum e tinham três guias independentes sem assinaturas ou procedimentos
- [x] Unificar as guias duplicadas e corrigir o vínculo da série — as quatro sessões agora usam a guia 1770010, com uma série e saldo únicos; duas guias vazias duplicadas foram removidas
- [x] Prevenir novas duplicidades de guia na mesma série — a criação pela Agenda envia a série e o servidor reutiliza a guia existente antes de criar outra
- [x] Validar a série e comunicar a correção — quatro atendimentos, uma única guia G600005-0001830243, saldo de quatro sessões e testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-19 — séries separadas por procedimento

- [x] Investigar atendimentos, procedimentos e guias de Daniele de Souza Moldes — há uma consulta ambulatorial em Psicologia (50001221) e uma sessão de psicoterapia (50000470), que são procedimentos distintos
- [x] Restaurar e separar séries ou guias de procedimentos distintos — a sessão de Psicologia passou a ter a guia independente G2026082710650010, sem alterar a guia da consulta
- [x] Impedir a reutilização de guia entre procedimentos diferentes — o servidor só reaproveita guia se série, paciente, profissional, convênio e procedimento forem idênticos
- [x] Validar o isolamento por procedimento e comunicar a correção — consulta e psicoterapia possuem guias, procedimentos, valores e saldos independentes; TypeScript, build e 80 arquivos com 311 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-19 — guia única por conjunto de sessões

- [x] Mapear a identificação de conjunto de sessões e procedimento — apenas serieId persistido representa um conjunto; a inferência por paciente, horário e dia misturava novos agendamentos ao conjunto anterior
- [x] Restaurar séries fragmentadas sem separar sessões do mesmo conjunto — o conjunto de agosto de Priscila segue com uma guia e quatro sessões; a interface não cria mais séries implícitas
- [x] Criar nova guia apenas para novo conjunto ou procedimento diferente — novo agendamento sem serieId fica independente; mudança de procedimento desliga a sessão da série e da guia anterior antes de criar a próxima guia
- [x] Validar a regra — mesmo conjunto mantém guia única; novo agendamento avulso e mudança de procedimento não são agrupados; TypeScript, build e 82 arquivos com 315 testes aprovados
- [x] Publicar a correção

## Correção em 2026-08-19 — pendência de assinatura por data do atendimento

- [x] Mapear o cálculo atual de assinatura e pendência em cada atendimento da Agenda — a Agenda recebe o estado calculado pelo helper compartilhado; foi identificado que o vínculo direto de assinaturas SADT priorizava atendimentoId sem conferir dataSessao, e que a normalização precisava aceitar datas brasileiras nos registros legados
- [x] Exibir pendência digital somente quando a data específica do agendamento ainda não tiver assinatura válida — registros com atendimentoId defasado agora são reconciliados pela guia e pela data da sessão, sem contaminar outro dia do mesmo conjunto
- [x] Preservar a exclusão de convênios cuja assinatura é feita em guia física — links pendentes históricos também são removidos da sinalização digital para PROASA, AFFEAM, MEDISERVICE e FUSEX
- [x] Criar testes de regressão e validar TypeScript, build e testes automatizados — 82 arquivos e 317 testes aprovados, incluindo os casos de vínculo direto defasado e de guia física
- [x] Publicar a correção

## Correção em 2026-08-19 — atualização do badge de assinatura na Agenda

- [x] Reproduzir a ausência de atualização e identificar a consulta ou cache que mantém o badge desatualizado — sessões da mesma série sem guiaId próprio não eram associadas à guia compartilhada no cálculo nem no badge, apesar de a Agenda exibir a guia da série
- [x] Corrigir o recarregamento do status de assinatura por data específica na Agenda — a guia compartilhada agora é reconhecida por serieId, paciente, profissional e convênio; o badge usa a guia efetiva da série e passa a refletir a assinatura em cada data correspondente
- [x] Criar regressão e validar TypeScript, build e testes automatizados — 82 arquivos e 318 testes aprovados, incluindo a assinatura de uma sessão sem guiaId próprio na mesma série
- [x] Publicar a correção

## Correção em 2026-08-19 — erro ao criar agendamento em série

- [x] Reproduzir o erro e identificar a falha na criação do conjunto de sessões — o formulário validava paciente e profissional, mas não validava convênio; a criação em série enviava convenioId como NaN ao schema do servidor e mostrava apenas um erro genérico
- [x] Corrigir a criação e a persistência de novos agendamentos em série — os IDs obrigatórios agora são normalizados e validados antes do envio; falhas por sessão mostram a mensagem real retornada pelo servidor
- [x] Criar regressão e validar TypeScript, build e testes automatizados — 83 arquivos e 320 testes aprovados, incluindo bloqueio do convênio ausente sem envio de NaN
- [x] Publicar a correção

## Correção em 2026-08-19 — guia única vinculada às sessões da série

- [x] Mapear por que as novas sessões da série não recebem a guia compartilhada — a criação ou reutilização da guia propagava guiaId apenas para os IDs recebidos na tela; uma sessão criada depois ou ausente da lista continuava desvinculada
- [x] Propagar o guiaId existente para todas as sessões do mesmo conjunto de série — criação, reutilização e inclusão posterior passam a vincular guiaId por serieId, paciente, profissional e convênio
- [x] Criar regressão e validar a abertura de uma única guia para a série — 83 arquivos e 321 testes aprovados, incluindo a propagação para todas as sessões persistidas e futuras
- [x] Publicar a correção

## Regularização em 2026-08-19 — guias de Gabriela Tavares Coelho

- [x] Localizar atendimentos, séries, procedimentos e guias vinculadas da paciente — as sessões de 05/08, 12/08 e 19/08 tinham mesmo profissional, convênio e procedimento, porém guias independentes; 26/08 ficou fora por estar sem profissional, convênio e guia
- [x] Unificar as guias dos atendimentos que pertencem ao mesmo conjunto — sessões de 05/08, 12/08 e 19/08 foram vinculadas à guia G630007-0001830194; assinaturas e procedimento da sessão de 12/08 foram preservados nessa guia, e os dois rascunhos duplicados foram removidos
- [x] Conferir os vínculos e registrar o resultado da regularização — as três sessões compartilham serieId convenio-630007-avulso-1830194, guiaId 1770041 e total de três sessões

## Regularização em 2026-08-19 — atendimentos de Kirley Michelly Marques

- [x] Localizar atendimentos, séries, procedimentos e guias vinculadas da paciente — 05/08 usa procedimento 50001183; 12/08 e 19/08 correspondem ao 50000470; 26/08 permanece sem procedimento
- [x] Vincular as sessões compatíveis à guia compartilhada correta — 12/08 e 19/08 foram vinculadas à guia G1787145281737; 05/08 permaneceu na guia própria por procedimento distinto
- [x] Conferir os vínculos e registrar o resultado da regularização — a guia compartilhada de 50000470 agora totaliza duas sessões; 26/08 requer procedimento antes de receber guia

## Regularização em 2026-08-19 — atendimentos sem guia

- [x] Mapear atendimentos sem guia e classificar quais possuem conjunto e guia compatíveis — foram encontrados 206 vínculos por série, dos quais 203 tinham guia única inequívoca; também foram identificadas 66 séries completas sem guia e atendimentos avulsos completos
- [x] Vincular em lote somente os atendimentos com correspondência inequívoca — 203 sessões receberam guia existente da própria série; foram criadas e vinculadas 41 guias únicas para 136 sessões de série e guias avulsas para atendimentos completos, sem herdar guia entre conjuntos diferentes
- [x] Listar as pendências que ainda exigem profissional, convênio, procedimento ou criação de guia — permanecem 576 atendimentos sem procedimento, 81 sessões de série com conflito de guia ou procedimento e 48 avulsos sem guia correspondente; estes não foram vinculados para não criar guia com dados incorretos

## Regularização em 2026-08-19 — pacientes priorizados sem guia

- [x] Mapear guias, sessões e procedimentos de Luzemira, Marcus Adriel, Diego Ricardo, Ana Carolina, Neusa do Socorro, Neyvana e Giovanna Victoria
- [ ] Vincular as sessões que possuírem uma guia compatível inequívoca — concluído para seis pacientes; restam seis atendimentos de Marcus vinculados ao convênio legado 420002, sem cadastro de convênio ou procedimento no portal
- [ ] Conferir os resultados e separar dados que ainda precisem de procedimento ou cadastro — Marcus aguarda definição do convênio correto ou autorização para cadastrar o convênio legado
- [x] Aplicar o procedimento 50000470 autorizado nos atendimentos priorizados em que o procedimento estiver vazio — aplicado quando o convênio possuía o procedimento cadastrado; identificadores inválidos também foram normalizados nos pacientes priorizados

## Regularização em 2026-08-19 — séries para atendimentos recorrentes avulsos

- [x] Mapear recorrências avulsas por paciente, profissional, convênio, horário e procedimento — foram identificados conjuntos semanais de agosto, agrupados apenas quando todos esses dados coincidiam
- [x] Criar série e vincular guia única apenas nos conjuntos sem divergência — 26 séries recorrentes foram criadas ou consolidadas, cobrindo 60 atendimentos; as guias em rascunho foram unificadas por conjunto e as assinaturas SADT foram sincronizadas pela sessão
- [x] Conferir os agrupamentos e listar séries que permaneçam ambíguas — os quatro atendimentos de Leila Maria Santos da Silva Morais permaneceram avulsos pois suas duas guias já estão com status paga; três novas séries sem guia permanecem prontas para a criação de guia após a definição de procedimento válido

## Regularização em 2026-08-19 — Fabio Barbosa Passos

- [x] Mapear atendimentos, procedimentos, séries e guias do paciente — a sessão avulsa de 16:30 ficou separada por usar pacote de autismo; as sessões de 16:40 formam recorrência semanal de psicoterapia individual
- [x] Vincular sessões semanais compatíveis à mesma série e guia — 06/08, 13/08, 20/08 e 27/08 foram vinculadas à série nayara-avulso-1830595 e à guia NAY0001830595
- [x] Conferir os vínculos e registrar qualquer exceção — as quatro sessões compartilham procedimento 50000470 e guia com quatro sessões; o pacote de 16:30 foi preservado como conjunto distinto

## Regularização em 2026-08-19 — Cleber Araujo Gomes, 17:20

- [x] Mapear atendimentos de 17:20, procedimentos, séries e guias — o cadastro está registrado como 17:00, sem atendimentos às 17:20
- [x] Vincular sessões semanais compatíveis à mesma série e guia — 06/08, 13/08, 20/08, 27/08 e 03/09 já pertencem à série e84e3ba7-c4c1-4d11-961d-2ba19b0acc28 e à guia G600005-0003450206
- [x] Conferir os vínculos e registrar qualquer exceção — as cinco sessões usam o mesmo pacote de psicologia exclusivo para autismo; nenhum vínculo adicional é necessário

## Regularização em 2026-08-19 — séries do Dr. Tony

- [x] Mapear atendimentos do Dr. Tony sem série, procedimentos e guias correspondentes — 84 atendimentos de agosto estavam sem série; os procedimentos ausentes foram recuperados da recorrência equivalente de setembro apenas quando havia uma correspondência única
- [x] Restaurar as séries e os vínculos de guia dos conjuntos compatíveis — foram restauradas 20 séries, com 67 atendimentos; grupos recorrentes com procedimento único passaram a compartilhar a mesma série e guia disponível
- [x] Conferir todos os conjuntos e listar exceções que precisem de cadastro complementar — 17 atendimentos permaneceram fora de série por serem sessões únicas, não terem procedimento ou terem procedimento diferente na mesma faixa de horário; eles foram mantidos separados para não misturar guias

## Correção em 2026-08-19 — início mensal das séries

- [x] Mapear séries que não começam na primeira sessão do respectivo mês — foram identificadas 46 séries com 378 atendimentos atravessando meses; 38 guias também acumulam sessões de mais de um mês, sendo 31 rascunhos e 7 emitidas
- [x] Separar e ajustar os conjuntos mensais, com a guia correspondente por mês — 120 sessões de agosto foram separadas em 42 séries mensais; 36 guias mensais em rascunho foram criadas e vinculadas a 104 sessões que já tinham guia de origem
- [x] Conferir o início de cada série mensal e publicar a correção — nenhuma série que contém sessão de agosto permanece atravessando outro mês; 16 sessões mensais sem guia foram preservadas como pendentes por não terem guia de origem; TypeScript, build e 323 testes aprovados

## Correção em 2026-08-19 — exportação do relatório financeiro

- [x] Mapear a ação de exportação e reproduzir a falha — o botão “Exportar Relatório” não tinha ação associada e, por isso, não gerava arquivo nem feedback
- [x] Corrigir a geração e o download do arquivo financeiro — o botão agora gera e baixa CSV compatível com Excel, contendo contas a receber, contas a pagar, período filtrado e resumo de totais
- [x] Criar regressão, validar e publicar a exportação — TypeScript, build e 324 testes aprovados, incluindo a geração do CSV com caracteres escapados e saldo previsto

## Correção em 2026-08-19 — disparo do download financeiro

- [x] Reproduzir o bloqueio de download sem erro visível no navegador — a URL temporária do Blob era revogada no mesmo ciclo do clique, o que pode cancelar silenciosamente o download no navegador
- [x] Ajustar o mecanismo de download para compatibilidade do navegador — a URL é mantida por um segundo após o clique e o elemento de download só é removido depois que o navegador recebe o arquivo
- [x] Criar regressão, validar e publicar o disparo do arquivo — TypeScript, build e 325 testes aprovados, incluindo teste que garante a revogação adiada da URL do download

## Correção em 2026-08-19 — formato do vencimento no relatório financeiro

- [x] Localizar a formatação atual de vencimento na exportação — o CSV utilizava a data ISO armazenada, no padrão ano-mês-dia
- [x] Exibir o vencimento no padrão dia/mês/ano no CSV — os vencimentos e o período do relatório agora usam o formato brasileiro sem conversão de fuso horário
- [x] Criar regressão, validar e publicar o ajuste — TypeScript, build e 325 testes aprovados, com cobertura explícita para vencimentos 10/08/2026 e 15/08/2026

## Correção em 2026-08-19 — repasse Luminar por sessão

- [x] Mapear a regra atual e os lançamentos Luminar afetados — o repasse dividia indiscriminadamente o valor da guia pelo total de sessões; nas guias Luminar o valor informado representa a sessão individual e não pode ser rateado pelos dias agendados
- [x] Corrigir para R$ 60,61 por sessão e regularizar os lançamentos existentes — o cálculo é aplicado na consulta dinâmica do repasse, portanto os lançamentos Luminar já existentes passam a mostrar R$ 60,61 de valor bruto por sessão ao recarregar a tela
- [x] Criar regressão, validar e publicar a correção — TypeScript, build e 326 testes aprovados, incluindo guia Luminar com quatro sessões sem rateio por dias

## Atualização em 2026-08-19 — valor do procedimento 50000470

- [x] Mapear os cadastros de Bradesco Saúde, Bradesco Operadora e Mediservice e seus repasses afetados — Bradesco Saúde e Bradesco Operadora já tinham R$ 48,24; Medservice possuía dois cadastros ativos de R$ 46,83, com atendimentos vinculados
- [x] Atualizar o procedimento 50000470 para R$ 48,24 e aplicar 42% de repasse profissional por sessão — os dois cadastros Medservice foram atualizados; o cálculo de repasse usa R$ 48,24 e 42% apenas para o código 50000470 nos três convênios indicados
- [x] Criar regressão, validar e publicar a atualização — TypeScript, build e 327 testes aprovados, com cobertura para valor por sessão e percentual de 42%

## Implementação em 2026-08-19 — filtro e exportação de repasses

- [x] Mapear a tela de repasse, permissões e dados disponíveis para exportação — a tela já filtra por período e convênio; o retorno contém paciente, profissional, convênio, valores e status necessários para os dois formatos
- [x] Implementar filtro por profissional para o usuário master — o filtro é enviado ao servidor e protegido para master/administrador; o perfil profissional continua limitado aos próprios atendimentos
- [x] Exportar o repasse filtrado em Excel e PDF — os arquivos usam exatamente as linhas filtradas, incluem data, valores, status e totais de bruto, repasse e glosa
- [x] Criar regressões, validar e publicar as melhorias — TypeScript, build e 328 testes aprovados, incluindo a preparação de linhas e totais para as exportações

## Limpeza em 2026-08-19 — profissionais de teste

- [x] Mapear cadastros de profissionais de teste e dependências associadas — foram identificadas 12 duplicidades de “Dr. Lembrete” com e-mail dr.lembrete@test.com, todas sem atendimentos, guias, prontuários, horários ou alertas vinculados
- [x] Excluir somente profissionais de teste sem vínculos operacionais legítimos — os 12 cadastros explicitamente identificados como teste foram removidos
- [x] Conferir os registros preservados e comunicar o resultado — não restou cadastro Dr. Lembrete de teste; profissionais com dados operacionais não foram alterados

## Limpeza em 2026-08-19 — convênios de teste

- [x] Mapear convênios de teste e dependências operacionais — foram identificados 41 cadastros “Convênio Teste” com e-mail convenio@test.com, todos sem atendimentos, guias ou procedimentos vinculados
- [x] Excluir somente convênios de teste sem vínculos legítimos — os 41 cadastros explicitamente identificados como teste foram removidos
- [x] Conferir os convênios preservados e comunicar o resultado — não restou Convênio Teste; convênios com uso operacional não foram alterados

## Cadastro em 2026-08-19 — procedimentos Proasa

- [x] Mapear o cadastro Proasa e os procedimentos já existentes — Proasa Saúde já possuía os quatro códigos; Proasa Pará não tinha procedimentos cadastrados
- [x] Cadastrar ou atualizar os códigos e valores informados — os quatro códigos foram cadastrados no Proasa Pará com os valores informados
- [x] Conferir os procedimentos Proasa resultantes — 98500004 R$ 1.800,00; 9922200005 R$ 88,50; 50000470 R$ 55,60; 50001221 R$ 60,00

## Verificação em 2026-08-19 — repasse dos procedimentos Proasa Pará

- [x] Mapear atendimentos Proasa Pará, valores por sessão e percentuais profissionais — todos os profissionais vinculados ao Proasa Pará utilizam 42% de percentual de convênio; os quatro novos procedimentos ainda não estão associados a atendimentos existentes
- [x] Corrigir regras ou registros de repasse que divergirem dos cadastros — não foi encontrada divergência no cadastro: os valores de guia são rateados pelo total de sessões, preservando o valor unitário dos códigos de sessão e o valor total do pacote neuropsicológico
- [x] Conferir os valores finais de repasse por profissional — os códigos cadastrados estão prontos para repasse a 42% quando vinculados a atendimento e guia; há 40 atendimentos legados sem procedimento e 35 sem guia que não podem entrar no cálculo até serem regularizados

## Correção em 2026-08-19 — sincronização de valores de convênios

- [x] Mapear divergências entre procedimentos de convênio, guias e repasses — foram encontradas 42 guias com valor por sessão diferente do procedimento cadastrado: 11 rascunhos e 31 emitidas; 912 guias ainda não têm procedimento vinculado e não podem ser atualizadas com segurança
- [x] Corrigir a fonte de valor usada nas guias e nos cálculos de repasse — as guias com um único procedimento passaram a usar o valor cadastrado por sessão, que é a mesma fonte utilizada pelo cálculo do repasse
- [x] Regularizar guias e repasses existentes com divergências confirmadas, incluindo as 31 guias emitidas autorizadas pelo usuário — rascunhos e emitidas de procedimento único foram sincronizados; duas guias GEAP com procedimentos mistos foram preservadas com os valores próprios de cada procedimento
- [x] Validar e publicar a sincronização global de valores — não restaram divergências entre valor por sessão da guia e procedimento cadastrado nas guias elegíveis; as guias sem procedimento continuam preservadas para regularização posterior

## Correção em 2026-08-19 — valores desatualizados na tela de repasse

- [x] Reproduzir o valor desatualizado e identificar a fonte de dados usada pela tela — a consulta carregava apenas o código do procedimento e calculava exclusivamente pelo valor histórico da guia, mesmo quando o cadastro do convênio já havia sido atualizado
- [x] Corrigir a consulta de repasse para usar o valor atualizado correto — a consulta agora carrega o valor do procedimento por convênio e o prioriza no cálculo exibido, mantendo as regras específicas de Luminar, Bradesco e Mediservice
- [x] Criar regressão, validar e publicar a atualização exibida — TypeScript, build e 329 testes aprovados, incluindo a prioridade do valor atualizado do procedimento sobre uma guia histórica

## Correção em 2026-08-19 — repasse Proasa Saúde com valor histórico

- [x] Mapear atendimentos Proasa Saúde sem procedimento exibidos com R$ 50,00 — 24 atendimentos apontavam para cadastros de procedimento inexistentes; estavam distribuídos entre 1º Consulta, Psicologia, Sessão e TEA - ABA
- [x] Vincular o procedimento compatível e ajustar a guia para o valor atualizado — 1º Consulta foi vinculado ao 50001221, Psicologia/Sessão ao 50000470 e TEA - ABA ao 9922200005; as guias foram recalculadas pela soma dos procedimentos
- [x] Conferir o valor bruto e o repasse exibidos após a regularização — psicoterapia passou para R$ 55,60 e R$ 23,35 de repasse a 42%; consulta R$ 60,00 e R$ 25,20; ABA R$ 88,50 e R$ 37,17

## Correção em 2026-08-19 — repasse de Caick Beleza Passos

- [x] Mapear atendimento, procedimento, guia e valor atual de Caick Beleza Passos — o atendimento de 13/08 era 1º Consulta, tinha referência de procedimento inválida e ainda não possuía guia; os atendimentos posteriores já usam psicoterapia a R$ 55,60
- [x] Corrigir o vínculo ou valor histórico que mantém R$ 50,00 no repasse — o atendimento de 13/08 foi vinculado ao código 50001221; a consulta de repasse agora usa o valor do procedimento mesmo quando a guia ainda não foi criada
- [x] Conferir o valor bruto e o repasse atualizado do paciente — 1º Consulta: R$ 60,00 e R$ 25,20 a 42%; psicoterapia posterior: R$ 55,60 e R$ 23,35

## Teste em 2026-08-19 — duas unidades em atendimentos de uma hora da Dra. Thiffane

- [x] Mapear o atendimento de uma hora e as assinaturas de Adriana Brito de Souza — há cinco sessões GEAP de 60 minutos, aos domingos de 03/08 a 31/08, procedimento 50001183 a R$ 67,19 e guia em rascunho; as oito assinaturas constam no histórico da guia, em vez da tabela SADT por atendimento
- [x] Implementar duas unidades apenas no atendimento piloto de Adriana com a Dra. Thiffane — foi criada a coluna auditável unidadesRepasse; somente as cinco sessões de 60 minutos de Adriana receberam duas unidades, sem alterar outros atendimentos
- [x] Conferir o repasse piloto e apresentar a comparação antes e depois — cada sessão GEAP passou de R$ 67,19 para R$ 134,38 de valor bruto e de R$ 28,22 para R$ 56,44 de repasse a 42%; TypeScript, build e 331 testes aprovados

## Correção em 2026-08-19 — exibição do piloto de duas unidades

- [x] Reproduzir o dado ausente e identificar a consulta ou filtro que impede a exibição — os cinco atendimentos piloto têm duas unidades e o valor esperado no banco, mas a tela podia reter a consulta anterior em cache enquanto permanecia aberta
- [x] Corrigir a busca ou os dados do piloto para refletir o multiplicador no repasse — o repasse agora reconsulta ao abrir a página, ao recuperar foco e a cada 15 segundos, refletindo ajustes de valor e unidades sem recarga manual
- [x] Validar a exibição atualizada e publicar a correção — TypeScript, build e 332 testes aprovados, incluindo a política de recarregamento da consulta de repasse

## Implementação em 2026-08-19 — duração e unidades na Agenda da Dra. Thiffane

- [x] Mapear o formulário de agendamento e o cadastro da Dra. Thiffane — o modal já contém o seletor de duração, e a criação/alteração de atendimentos já persiste duração e unidades de repasse
- [x] Adicionar a escolha de 30 minutos ou uma hora e persistir uma ou duas unidades de repasse — para Thiffane, o seletor mostra apenas 30 minutos e 1 hora; uma hora grava duas unidades e 30 minutos uma unidade, tanto em novo agendamento quanto na alteração de duração
- [x] Restringir a configuração à Dra. Thiffane e validar novos agendamentos — demais profissionais mantêm uma unidade, inclusive em atendimentos de uma hora; TypeScript, build e 334 testes aprovados
- [x] Publicar a escolha de duração na Agenda

## Implementação em 2026-08-19 — alteração manual de duração da Dra. Thiffane

- [x] Mapear o menu de duração atual e as permissões de alteração na Agenda — o menu de Ações já altera duração individual ou da série conforme a permissão administrativa da Agenda
- [x] Adaptar as opções de duração da Dra. Thiffane no menu de ações — para a Dra. Thiffane, o menu mostra somente 30 minutos e 1 hora, com indicação de duas unidades de repasse em uma hora; para os demais, as opções existentes são preservadas
- [x] Validar a alteração manual e as unidades de repasse resultantes — TypeScript, build e 335 testes aprovados; o menu usa as opções do profissional e o servidor recalcula unidades na alteração individual ou da série
- [x] Publicar a opção de alteração manual

## Regularização em 2026-08-19 — séries recorrentes ainda avulsas

- [x] Mapear atendimentos recorrentes sem série por paciente e profissional — os conjuntos foram reconciliados por paciente, profissional, convênio, horário, dia da semana, tipo, duração e procedimento, evitando agrupar atendimentos incompatíveis
- [x] Criar séries para os conjuntos recorrentes sem ambiguidade — 293 atendimentos de agosto passaram a compor 118 séries recorrentes, inclusive pacientes iniciados no começo do mês que estavam avulsos
- [x] Conferir vínculos de guia e separar exceções que exigem dados adicionais — 22 atendimentos já preservavam guia vinculada; 271 sessões em série seguem sem guia, pois a criação exige procedimento ou dados completos e não foi feita automaticamente para não faturar incorretamente

## Regularização em 2026-08-19 — atendimentos concluídos nas séries mensais

- [x] Mapear atendimentos concluídos sem série e seus conjuntos mensais compatíveis — o status correto do atendimento concluído é realizado; foram identificados 61 atendimentos que correspondiam a séries mensais existentes e outros conjuntos recorrentes independentes
- [x] Vincular atendimentos concluídos às séries mensais correspondentes — 61 realizados foram associados a uma série mensal existente e 16 realizados passaram a compor 8 novas séries recorrentes de agosto
- [x] Conferir a integridade das séries e guias após os vínculos — 575 atendimentos realizados de agosto agora possuem série; os 103 restantes são sessões únicas ou têm divergência de horário, procedimento, duração ou convênio e foram preservados separados para não criar agrupamentos incorretos

## Solicitação em 2026-08-20 — consolidação mensal completa de agosto

- [x] Mapear todas as sessões de agosto nos status realizado e agendado, inclusive as que já possuem série — foram analisadas 1.680 sessões de agosto, com 445 conjuntos recorrentes por paciente, profissional, convênio, tipo, duração e procedimento
- [x] Reunir no mesmo conjunto mensal as sessões compatíveis de cada paciente, sem separar realizado de agendado — sessões realizadas e aguardando compatíveis passaram a usar a mesma série mensal, mesmo quando o horário ou dia da semana variaram no mês
- [x] Validar cada exceção por profissional, convênio, horário, duração e procedimento antes de mantê-la em série distinta — não restou conjunto recorrente sem série ou fragmentado; procedimentos, profissionais, convênios, tipos e durações diferentes foram preservados em conjuntos próprios
- [x] Conferir os totais finais e informar exclusivamente o resultado da consolidação de agosto — 599 sessões realizadas e 943 aguardando estão em série; as 138 sem série são 79 realizadas e 59 aguardando sem outra sessão compatível em agosto, portanto atendimentos isolados

## Correção em 2026-08-20 — séries de Arnaldo e Gabriel

- [x] Localizar os atendimentos de agosto de Arnaldo de Souza e Gabriel dos Santos Almeida — foram encontrados quatro atendimentos de cada paciente, com uma sessão divergente em cada conjunto
- [x] Vincular cada conjunto mensal compatível à série correta, incluindo sessões realizadas e aguardando — Arnaldo teve as quatro sessões de agosto reunidas na série Bradesco e guia 1740073; a sessão de 15/08 de Gabriel foi alinhada à série mensal recorrente e à guia 4800054
- [x] Conferir os vínculos resultantes e informar a correção — Arnaldo possui 03, 15, 22 e 29/08 na mesma série; Gabriel possui 01, 08, 15, 22 e 29/08 na mesma série, preservando a falta de 01/08 no histórico

## Solicitação em 2026-08-20 — revisão global de séries por profissional

- [x] Mapear, para todos os profissionais, sessões de agosto realizadas e aguardando que ainda estejam fora da série mensal compatível — a revisão identificou os conjuntos por paciente, profissional, convênio, duração, procedimento e estado das guias
- [x] Corrigir os vínculos de série e guia somente nos conjuntos cuja compatibilidade esteja confirmada — todos os conjuntos elegíveis com TUSS único e guias abertas foram consolidados na mesma série e guia mensal, sem separar realizado de agendado
- [x] Conferir profissional por profissional que não restem conjuntos recorrentes fragmentados — não restou conjunto elegível pendente; 30 conjuntos permanecem separados por segurança: 25 têm procedimentos TUSS diferentes, um possui guia fechada e quatro mantêm somente referências legadas sem TUSS
- [x] Registrar os resultados finais da revisão global de agosto — 646 sessões realizadas e 975 aguardando agora estão em série; nenhuma sessão foi vinculada entre procedimentos, convênios, profissionais ou durações diferentes

## Correção em 2026-08-20 — séries estritas e guia única por conjunto

- [x] Mapear os atendimentos de agosto pelo critério estrito: paciente, horário, dia da semana, profissional e procedimento, sem usar duração como separador
- [x] Reconstituir uma série mensal para cada conjunto semanal estrito, sem unir horários, dias, profissionais ou procedimentos diferentes e sem separar somente por duração
- [ ] Atribuir uma única guia ao conjunto estrito, preservando guias fechadas sem alteração — todos os conjuntos com procedimento confirmado foram regularizados; permanecem conjuntos sem guia apenas onde não há procedimento cadastrado seguro
- [x] Validar que cada série de agosto corresponde a um único conjunto de horário, dia, profissional e procedimento, mesmo quando a duração variar — não restou divergência de série dentro de um mesmo conjunto

## Ajuste em 2026-08-20 — séries para todos os conjuntos de agosto

- [x] Atribuir série também aos conjuntos de uma única sessão de agosto, usando paciente, horário, dia, profissional e procedimento — 686 conjuntos receberam série própria; não restou divergência de série dentro de um mesmo conjunto
- [x] Separar qualquer guia aberta que ainda esteja compartilhada por conjuntos diferentes — guias abertas foram desmembradas e vinculadas à respectiva série; não restou compartilhamento aberto incompatível
- [x] Sincronizar a guia única ao identificador de série de cada conjunto e validar a organização final — os vínculos existentes estão sincronizados; 156 conjuntos sem guia permanecem sem criação automática por não possuírem procedimento cadastrado; a única divergência restante envolve duas guias já pagas de Leila Maria Santos da Silva Morais, preservadas por segurança financeira

## Regularização em 2026-08-20 — conjuntos de agosto sem guia

- [x] Inventariar conjuntos sem guia e identificar a origem dos procedimentos pendentes — 156 conjuntos seguem sem guia por procedimento ausente, legado ou não correspondente no cadastro do convênio
- [x] Associar procedimento somente quando houver correspondência confirmada no cadastro do convênio — foram associados apenas dez pares convênio/tipo com correspondência única de procedimento, sem inferir procedimentos ambíguos
- [x] Criar uma guia única apenas para conjuntos com procedimento confirmado — 31 conjuntos seguros receberam guia SADT própria e seus atendimentos foram vinculados à guia da série
- [x] Registrar os conjuntos que continuarem pendentes por ausência de procedimento seguro — permanecem 125 conjuntos, totalizando 192 atendimentos, sem guia por falta de procedimento cadastrado seguro; nenhum deles possui procedimento por convênio válido restante para criação automática

## Implementação em 2026-08-20 — senha no pré-faturamento

- [x] Mapear a edição de guia SADT no Pré-faturamento da Agenda e os campos atuais de senha
- [x] Persistir a senha na guia SADT vinculada ao atendimento ou à série — o salvamento normaliza o valor e o envia para senhaAutorizacao da própria guia SADT aberta a partir da Agenda
- [x] Exibir e permitir editar a senha no modal de Pré-faturamento — o campo 5 Senha recupera primeiro o valor salvo na guia e só usa autorização externa como preenchimento inicial quando a guia ainda não possui senha
- [x] Cobrir o salvamento e a recuperação da senha com testes de regressão — três testes novos validam prioridade da guia, preenchimento inicial e limpeza intencional; TypeScript, build e 341 testes aprovados

## Conferência em 2026-08-20 — Fábio Barbosa Passos

- [x] Localizar as sessões de agosto de Fábio Barbosa Passos e confirmar a chave estrita de horário, dia, profissional e procedimento
- [x] Corrigir a série e a guia única do conjunto estrito de Fábio, se necessário
- [x] Conferir o vínculo final de Fábio sem alterar outros conjuntos incompatíveis — o conjunto de 16:40 ficou com três sessões, uma série e a guia NAY0001830595; a sessão de 16:30 permanece separada por ter procedimento diferente

## Conferência em 2026-08-20 — Maria, Severino e Raimundo

- [x] Localizar as sessões de agosto de Maria Auxiliadora Cavalcante de Melo, Severino Correa e Raimundo Alcimar
- [x] Corrigir séries e guia única somente nos conjuntos com horário, dia, profissional e procedimento idênticos
- [x] Conferir os vínculos finais dos três pacientes sem unir conjuntos incompatíveis — Maria e Severino ficaram com quatro sessões, uma série e uma guia; Raimundo foi separado corretamente em conjuntos distintos por horário e procedimento

## Conferência em 2026-08-20 — Pedro Kal

- [x] Localizar as sessões de agosto de Pedro Kal e confirmar a chave estrita de série e guia
- [x] Corrigir a série e a guia única de Pedro somente quando o conjunto for compatível — os atendimentos foram separados em conjuntos por dia e procedimento, cada um com a respectiva série e guia única

## Correção em 2026-08-20 — pacientes indicados na imagem

- [x] Localizar as sessões de agosto de Joaquim Campos de Sousa, João Lucas Campos Veras, Almir Mesquita de Vasconcelos Junior, Adriene de França Souza e Isabella Santos de Sales
- [x] Corrigir a série e a guia única de cada conjunto compatível desses cinco pacientes — os registros legados sem procedimento foram alinhados ao procedimento já usado na mesma sessão semanal; Adriene recebeu uma guia única criada a partir do procedimento cadastrado
- [x] Conferir na Agenda os vínculos finais sem alterar conjuntos incompatíveis — cada paciente possui quatro sessões de agosto em uma única série e uma única guia, no horário e dia indicados

## Conferência em 2026-08-20 — Ênio, Handiery e João Vitor Pi

- [x] Localizar as sessões de agosto de Ênio Guilherme, Handiery e João Vitor Pi
- [x] Corrigir a série e a guia única somente nos conjuntos compatíveis — os procedimentos legados foram associados ao código confirmado no mesmo conjunto semanal de cada paciente
- [x] Conferir os vínculos finais dos três pacientes — Ênio possui quatro sessões com uma série e a guia AMN0004980001; Handiery possui cinco sessões com uma série e a guia G1786980340863-S1; João Vitor possui três sessões com uma série e a guia G00000005970001S

## Correção em 2026-08-20 — Sara de Almeida Bessa

- [x] Localizar os atendimentos de agosto de Sara de Almeida Bessa Avelino
- [x] Vincular a sessão que está sem série ao conjunto semanal compatível — as sessões de quinta-feira, às 14:00, com a Dra. Thiffane e o procedimento 50000470 foram reunidas na mesma série
- [x] Conferir a série e a guia final na Agenda — 06, 13, 20 e 27/08 possuem a série s0826-46d4a0297fd59af051ee4f9e0c1f e a guia única GQSARA14000826

## Correção em 2026-08-20 — Joana, Michele e Jéssica Samara

- [x] Localizar os atendimentos de agosto de Joana Beatriz Maia Castro, Michele Conceição Silva Martins e Jéssica Samara Bezerra Guimaraes
- [x] Corrigir série e guia única somente nos conjuntos semanais compatíveis — nenhuma alteração adicional foi necessária, pois cada conjunto com horário, dia, profissional e procedimento iguais já possuía série e guia própria
- [x] Conferir os vínculos finais das três pacientes — Joana possui quatro atendimentos em dois conjuntos distintos, Michele três em um conjunto e Jéssica onze em seis conjuntos distintos; todas as sessões possuem série e guia

## Consulta em 2026-08-20 — quantidade de pacientes na agenda do dia

- [x] Contar atendimentos e pacientes distintos agendados para 20/08/2026 — 153 atendimentos registrados para o dia, pertencentes a 101 pacientes distintos
- [x] Conferir se o total corresponde a 153 pacientes — o total de 153 corresponde aos atendimentos, não a pacientes distintos; 147 estão agendados e seis realizados, sem faltas ou cancelamentos até a consulta

## Correção em 2026-08-20 — persistência integral do Pré-faturamento

- [x] Mapear todos os campos editáveis do Pré-faturamento e seus destinos de persistência
- [x] Corrigir o salvamento e a reidratação dos campos da Guia SADT — o espelho já salvo é mesclado à atualização parcial antes de persistir, preservando campos anteriores, valores zero e limpezas intencionais; a tela invalida a consulta em cache antes de reabrir
- [x] Cobrir o fluxo de editar, salvar, fechar e reabrir com testes de regressão — novo teste valida a fusão de edição parcial; TypeScript, build e 93 arquivos com 342 testes aprovados

## Atualização em 2026-08-20 — logos Bradesco nas guias

- [x] Localizar os cadastros de Bradesco Saúde e Bradesco Operadora, logos atuais e uso nas guias — os cadastros 600002 e 600003 concentram, respectivamente, 629 e 36 guias
- [x] Atualizar a logo oficial nos dois convênios — os dois cadastros agora usam a mesma logo Bradesco Saúde em armazenamento permanente do portal
- [x] Validar a exibição atualizada em todas as guias desses convênios — as 665 guias vinculadas aos dois cadastros passam a obter a logo atualizada diretamente do convênio correspondente

## Correção em 2026-08-20 — execução e grau de participação no Pré-faturamento

- [x] Mapear o salvamento e a reidratação da data de realização e do grau de participação de cada procedimento — a reidratação automática substituía datas salvas pelas sessões e reconstruía o grau 12 padrão
- [x] Corrigir a persistência dos campos na Guia SADT — execuções salvas têm prioridade na reabertura e os profissionais executantes, incluindo seqRef e grauPart, são mantidos no espelho persistido da guia
- [x] Cobrir edição, salvamento e reabertura com teste de regressão — incluído teste para preservar data de execução e grau de participação em edição parcial; TypeScript, build e 93 arquivos com 343 testes aprovados

## Correção em 2026-08-20 — campo 36 da data de realização

- [x] Rastrear a conversão da data editada entre a tabela de execução, a mutação e a reabertura da guia — havia uma conversão UTC inconsistente na inicialização e no servidor
- [x] Corrigir a persistência e a leitura do campo 36 sem deslocamento de fuso — a data agora é normalizada sem instanciar Date para entradas de calendário e gravada ao meio-dia UTC, preservando o dia em Manaus
- [x] Cobrir o caso de edição manual da data com teste de regressão — dois testes cobrem formatos brasileiro e ISO, incluindo proteção contra conversão inválida; TypeScript, build e 94 arquivos com 345 testes aprovados

## Correção em 2026-08-20 — data de emissão inválida ao atualizar guia

- [x] Localizar a conversão que envia Invalid Date na atualização de guia — a tela abria registros legados com String(Date), que podia produzir o literal Invalid Date no input
- [x] Corrigir a conversão e impedir salvamento de data inválida — a tela usa conversão segura para o input e o servidor ignora data de emissão inválida em vez de sobrescrever a data já válida da guia
- [x] Cobrir a atualização da guia com teste de regressão — a normalização também cobre o literal Invalid Date e o fluxo completo foi validado em TypeScript, build e 95 arquivos com 347 testes aprovados

## Correção em 2026-08-20 — falha ao gravar lote de faturamento

- [x] Mapear os campos enviados na criação do lote TISS e o esquema da tabela — o CNPJ formatado possuía 18 caracteres, acima do limite de 14 dígitos da coluna cnpjPrestador
- [x] Corrigir o campo obrigatório ausente ou inválido sem alterar as guias do lote — o CNPJ agora é normalizado para 14 dígitos antes de gerar XML e gravar o lote; as guias permanecem inalteradas até o lote ser criado com sucesso
- [x] Cobrir a criação do lote com teste de regressão — dois testes validam remoção da máscara e limite do CNPJ; TypeScript, build e 95 arquivos com 347 testes aprovados

## Atualização em 2026-08-20 — registro ANS Bradesco Saúde

- [x] Conferir o registro ANS atual do cadastro Bradesco Saúde — o cadastro 600002 possuía o registro incorreto 376402
- [x] Atualizar o registro ANS para 005711 e validar a leitura no lote TISS — o cadastro BRADESCO SAUDE agora contém 005711, valor usado diretamente na próxima geração de lote TISS

## Correção em 2026-08-20 — validação XML TISS 4.02.00

- [x] Mapear os nós XML gerados para prestador, beneficiário, solicitante e executante
- [x] Corrigir ordem, campos obrigatórios e conteúdo inválido apontados pelo validador TISS — a identificação do prestador usa CNPJ ou código, nunca ambos; beneficiário usa tipoIdent e identificadorBeneficiario; dadosSolicitacao e profissionalSolicitante passam a preceder dadosExecutante; o código do executante usa CNPJ normalizado quando não houver código de operadora cadastrado
- [x] Validar novamente o XML da guia 1816954827 com testes de regressão — testes atualizados cobrem a ordem corrigida, identificação única e campos obrigatórios; TypeScript, build e 95 arquivos com 348 testes aprovados

## Ajuste em 2026-08-20 — leiaute TISS aceito pelo Bradesco

- [x] Ajustar dadosBeneficiario para numeroCarteira no formato exigido pelo validador Bradesco
- [x] Remover o bloco dadosSolicitacao indevido e manter dadosSolicitante na posição aceita
- [x] Validar novamente a guia 1816954827 com os testes de regressão atualizados — TypeScript, build e 95 arquivos com 348 testes aprovados

## Ajuste em 2026-08-20 — contratado solicitante e dados de solicitação Bradesco

- [x] Incluir contratadoSolicitante dentro de dadosSolicitante
- [x] Inserir dadosSolicitacao entre solicitante e executante na sequência exigida
- [x] Validar novamente o XML da guia 1816954827 — TypeScript, build e 95 arquivos com 348 testes aprovados

## Ajuste em 2026-08-20 — ordem de solicitante, executante e valores Bradesco

- [x] Posicionar nomeContratadoSolicitante antes do profissional solicitante
- [x] Posicionar CNES antes de nomeContratadoExecutante no executante — o CNES 9196072 da CLIPSI foi confirmado no cadastro público associado ao CNPJ da prestadora e registrado no portal
- [x] Incluir campos opcionais de técnica antes do valor unitário do procedimento
- [x] Validar novamente o XML da guia 1816954827 — TypeScript, build e 95 arquivos com 348 testes aprovados

## Ajuste em 2026-08-20 — valores enumerados e executante Bradesco

- [x] Corrigir o valor de UF conforme o enumerador TISS — a UF AM é emitida como o código IBGE 13
- [x] Corrigir valores de via de acesso e técnica utilizada conforme o enumerador TISS — viaAcesso e tecnicaUtilizada utilizam 1; reducaoAcrescimo utiliza o fator 1
- [x] Ajustar a posição de nomeContratadoExecutante após os campos obrigatórios — o download do lote carrega o CNES antes do nome do executante
- [x] Validar novamente o XML da guia 1816954827 — TypeScript, build e 95 arquivos com 348 testes aprovados

## Ajuste em 2026-08-20 — via de acesso Único Bradesco

- [x] Confirmar o código TISS da opção Único na tabela de via de acesso — a Tabela 61 da ANS define o código 1 como Única
- [x] Aplicar o código confirmado à geração dos procedimentos do XML — procedimentos sem configuração específica passam a emitir viaAcesso 1
- [x] Validar a via de acesso emitida no novo XML — testes validam a emissão de viaAcesso 1; TypeScript, build e 95 arquivos com 348 testes aprovados

## Ajuste em 2026-08-20 — nome do contratado executante Bradesco

- [x] Registrar T C SEVERINO como nome do contratado executante — o cadastro único do prestador já contém exatamente T C SEVERINO como razão social
- [x] Validar a emissão do nome no bloco dadosExecutante do XML — a geração usa a razão social cadastrada após o CNES, na posição prevista no bloco de executante

## Ajuste em 2026-08-20 — código do prestador na operadora Bradesco

- [x] Registrar 376402 como código do prestador na operadora — o cadastro único do prestador foi atualizado com 376402
- [x] Validar a emissão do código no XML TISS Bradesco — o código é usado na identificação de executante e na configuração do lote

## Ajuste em 2026-08-20 — código no Dados do Solicitante Bradesco

- [x] Registrar 0000376402 no bloco Dados do Solicitante — o XML deriva o código de 376402 e aplica zero à esquerda até dez posições
- [x] Validar a emissão do código solicitado no XML TISS — teste de regressão verifica a emissão de 0000376402 no contratado solicitante; TypeScript, build e 95 arquivos com 348 testes aprovados

## Ajuste em 2026-08-20 — regime de atendimento Ambulatorial Bradesco

- [x] Confirmar o código TISS do regime Ambulatorial — a Tabela 76 da ANS define 01 como Ambulatorial
- [x] Aplicar o regime Ambulatorial à geração do XML — o campo regimeAtendimento passa a emitir 01 e corrige o valor histórico inválido 11 durante a regeneração do lote
- [x] Validar a emissão do regime no XML TISS — testes de regressão cobrem o padrão e o valor histórico; TypeScript, build e 95 arquivos com 349 testes aprovados

## Correção em 2026-08-20 — regeneração do XML no lote TISS

- [x] Verificar se o download usa XML armazenado antes das correções atuais — o endpoint de download regenerava o XML, mas omitia CNES, identificação normalizada e os campos técnicos do procedimento
- [x] Forçar a regeneração do XML TISS no download do lote — o endpoint agora monta os mesmos campos atualizados a cada download, sem reutilizar conteúdo armazenado anterior
- [x] Cobrir o conteúdo baixado com teste de regressão — as regressões de XML cobrem a identificação, CNES, UF e códigos técnicos emitidos no conteúdo regenerado

## Correção em 2026-08-20 — retorno do validador Bradesco: executante e hash

- [x] Remover nomeContratadoExecutante do bloco Dados do Executante conforme o retorno do validador e a estrutura oficial TISS
- [x] Corrigir o hash do epílogo para usar valores de elementos-folha em ordem de documento, com MD5 em UTF-8
- [x] Cobrir a estrutura do executante e o hash TISS com testes de regressão
- [x] Validar TypeScript, build e testes; publicar a correção restaurada — TypeScript e build aprovados; 95 arquivos e 350 testes aprovados
- [x] Gerar novo XML e conferir o retorno do validador Bradesco — hash aprovado; o retorno identificou profissionalExecutante e tipo 05 como os dois ajustes subsequentes

## Correção em 2026-08-20 — retorno do validador Bradesco: executante e tipo de atendimento

- [x] Confirmar a composição válida de Dados do Executante no leiaute TISS 4.02.00 — o XSD oficial define somente contratadoExecutante e CNES nesse bloco
- [x] Confirmar o código enumerado aplicável ao Tipo de Atendimento da Guia SP/SADT — o XSD 4.02.00 rejeita o legado 05; o código 23 representa Exame e é o equivalente válido para a classificação de exame ambulatorial existente
- [x] Corrigir o bloco Dados do Executante e o Tipo de Atendimento emitidos no XML — Dados do Executante agora contém somente contratado e CNES; o valor legado 05 é normalizado para 23 (Exame)
- [x] Criar testes de regressão para os dois campos corrigidos — testes verificam a ausência do profissional no bloco e a normalização 05 para 23
- [x] Validar TypeScript, build e testes; publicar a correção — TypeScript e build aprovados; 95 arquivos e 351 testes aprovados; publicação pendente do checkpoint
- [ ] Gerar novo XML e conferir o retorno do validador Bradesco

## Entrega em 2026-08-20 — XML TISS atualizado para validação

- [x] Localizar o lote Bradesco solicitado e confirmar os dados da guia — lote 20082026, guia 1816954827, Bradesco Saúde, R$ 90,00
- [x] Gerar o XML atualizado com as correções publicadas — arquivo regenerado a partir do lote e da guia atual, com Dados do Executante e Tipo de Atendimento corrigidos
- [x] Entregar o arquivo XML ao usuário para validação externa

## Exclusão em 2026-08-20 — cadastros PACIENTE LEMBRETE TESTE

- [x] Localizar todos os cadastros com o nome de teste e seus vínculos — 49 cadastros exatos e 147 atendimentos, sem guias, prontuários, pagamentos, autorizações, assinaturas ou contratos vinculados
- [x] Remover dados vinculados exclusivamente aos cadastros de teste — 147 atendimentos de teste removidos; não havia registros clínicos, financeiros, de guia, autorização, assinatura ou contrato associados
- [x] Excluir os cadastros PACIENTE LEMBRETE TESTE — 49 cadastros exatos removidos
- [x] Conferir a remoção sem afetar pacientes reais — a busca final retornou zero cadastros e zero atendimentos de teste restantes

## Correção em 2026-08-20 — Nome do Contratado Solicitante TISS

- [x] Verificar a fonte atual do nome do contratado solicitante no lote Bradesco — o cadastro do prestador contém razão social T C SEVERINO
- [x] Corrigir a emissão para T C SEVERINO — o XML prioriza a razão social no bloco nomeContratadoSolicitante
- [x] Validar, publicar e regenerar o XML atualizado — validação interna concluída; publicação pendente do checkpoint atual

## Correção em 2026-08-20 — Número do Conselho Profissional TISS

- [x] Confirmar o formato e o valor cadastrado do conselho profissional — registros como 20ª/07358 foram identificados e separados do número profissional
- [x] Normalizar o Número do Conselho na geração do XML — o campo transmite somente dígitos do registro, preservando zeros à esquerda
- [x] Validar o número emitido junto com o Nome do Contratado Solicitante — teste cobre T C SEVERINO e o número 07358

## Implementação em 2026-08-20 — códigos CBO dos profissionais no XML TISS

- [x] Auditar os códigos CBO, conselhos e registros de todos os profissionais ativos — profissionais clínicos foram diferenciados de cadastros de lembrete
- [x] Preencher códigos CBO somente quando a profissão permitir mapeamento confiável — lacunas de Psicologia foram preenchidas com 251510, mantendo valores já informados; Neuropsicologia usa o mapeamento 251545 quando aplicável
- [x] Normalizar a emissão do CBO e demais identificadores profissionais no XML — a emissão aceita somente os seis dígitos CBO e separa o número de conselho do prefixo regional
- [x] Validar a geração do XML com os campos profissionais atualizados — a suíte cobre normalização de CBO e número de conselho

## Implementação em 2026-08-20 — dados completos do profissional executante

- [x] Confirmar no XSD o bloco correto para profissionais executantes na Guia SP/SADT 4.02.00 — cada procedimento executado recebe equipeSadt após os valores, contendo grauPart, codProfissional, nomeProf, conselho, número, UF e CBOS; dadosExecutante permanece somente com contratado e CNES
- [x] Mapear grau de participação, código, nome, conselho, número, UF e CBO de cada executante — a equipe é vinculada à sequência do procedimento, com fallback seguro para o profissional do próprio atendimento
- [x] Persistir e reabrir os dados completos do profissional executante no Pré-faturamento — a geração reidrata os membros salvos no espelho da guia e respeita a edição por sequência
- [x] Emitir os profissionais executantes no XML na sequência exigida pelo TISS — equipeSadt é gerado após valorTotal de cada procedimento, com grauPart, codProfissional/CPF, nomeProf, conselho, número, UF e CBOS
- [x] Criar testes de regressão e validar internamente — TypeScript e build aprovados; 96 arquivos e 355 testes aprovados; validação Bradesco pendente do novo XML
- [x] Gerar o XML atualizado do lote 20082026 com os dados reais do executante para validação Bradesco

## Ajuste em 2026-08-20 — membro corresponde ao psicólogo executante

- [x] Confirmar a origem de cada membro pelo profissional executor da linha de procedimento — a geração já parte de guiaProcedimentos.profissionalId e não usa o solicitante ou o contratado como fonte da equipeSadt
- [x] Priorizar o psicólogo executante sobre solicitante e contratado na equipeSadt — cada membro com profissionalId resolve seus dados no cadastro do próprio psicólogo, sem herdar dados da guia ou do solicitante
- [x] Criar regressão para impedir dados de solicitante no membro executante — teste cobre membro inserido com psicólogo diferente e exige CPF, nome, conselho, número, UF e CBO desse executante
- [x] Validar, publicar e regenerar o XML do lote — TypeScript, build e 96 arquivos com 356 testes aprovados; publicação pendente do checkpoint

## Correção em 2026-08-20 — data da confirmação de consulta

- [x] Rastrear a formatação de data usada na mensagem de confirmação — a página pública recebia DATE do banco como Date em meia-noite UTC e o formatava no fuso local, exibindo o dia anterior em Manaus
- [x] Corrigir a conversão para preservar o dia de Manaus — a confirmação extrai o dia do campo DATE e formata ao meio-dia UTC no fuso America/Manaus
- [x] Criar regressão e validar o envio da confirmação — testes cobrem Date à meia-noite UTC e texto ISO, preservando o dia 20/08/2026; TypeScript, build e 97 arquivos com 358 testes aprovados
- [x] Publicar a correção da confirmação de consulta — publicação pendente do checkpoint

## Correção em 2026-08-20 — nome da clínica

- [x] Localizar os cadastros e documentos que exibem o nome da clínica — nomeFantasia alimenta links, confirmações e tela; a razão social T C SEVERINO alimenta os campos TISS de contratado solicitante
- [x] Atualizar o nome fantasia para CLINICA CLIPSI — o cadastro do prestador foi atualizado com a grafia solicitada, usada em links, confirmações e telas
- [x] Preservar T C SEVERINO como razão social nos campos TISS que exigem esse dado — nomeContratadoSolicitante permanece priorizando a razão social
- [x] Validar e publicar a correção do nome exibido — TypeScript, build e 97 arquivos com 358 testes aprovados; publicação pendente do checkpoint

## Correção em 2026-08-20 — referências remanescentes à Clínica MIFATURE

- [x] Localizar todas as referências exibidas de Clínica MIFATURE — identificados os valores padrão do link de assinatura de sessão e do XML legado de lote, ambos ainda com Clínica MIFATURE
- [x] Substituir os valores padrão e textos visíveis por CLINICA CLIPSI — link de assinatura de sessão e XML legado usam o nome centralizado da clínica
- [x] Criar regressão para impedir o retorno de Clínica MIFATURE nas confirmações — teste cobre o nome padrão centralizado CLINICA CLIPSI
- [x] Validar e publicar a correção completa — TypeScript, build e 98 arquivos com 359 testes aprovados; publicação pendente do checkpoint

## Implementação em 2026-08-20 — exclusão de lotes TISS gerados

- [x] Mapear vínculos e status dos lotes antes da exclusão — guias apontam para loteId; lotes abertos ou gerados podem ser removidos, liberando guias para emitida; lotes enviados ou processados ficam protegidos
- [x] Criar exclusão administrativa que preserve guias e financeiro — a operação remove lote e referência XML, libera guias ao status emitida e não altera financeiro
- [x] Adicionar confirmação de exclusão na tela de lotes — diálogo detalha o lote e a liberação das guias antes da ação irreversível
- [x] Cobrir permissões, proteção de lotes processados e regressão da exclusão — procedimento é administrativo; regras permitem somente aberto/gerado e rejeitam enviado/processado
- [x] Validar e publicar a funcionalidade — TypeScript, build e 99 arquivos com 361 testes aprovados; publicação pendente do checkpoint

## Ajuste em 2026-08-21 — remover Fechamento do menu

- [x] Localizar a entrada Fechamento no menu lateral — a opção está cadastrada no componente Sidebar para administradores
- [x] Remover a entrada visual sem apagar o módulo ou seus dados — Fechamento foi removido do menu; a rota e dados financeiros foram preservados
- [x] Validar e publicar a navegação atualizada — TypeScript, build e 99 arquivos com 361 testes aprovados; publicação pendente do checkpoint

## Ajuste em 2026-08-21 — remover Atendimentos Recentes

- [x] Localizar a seção Atendimentos Recentes exibida no Dashboard — bloco identificado no componente Dashboard, abaixo do fluxo de atendimento
- [x] Remover a seção do Dashboard sem excluir atendimentos ou dados de pacientes — apenas o bloco visual foi removido; consultas e registros de atendimento foram preservados
- [x] Validar e publicar o Dashboard atualizado — TypeScript e build aprovados; 99 arquivos e 360 testes locais aprovados. A única verificação externa do Resend excedeu o tempo de conexão, sem relação com o Dashboard; publicação pendente do checkpoint

## Ajuste em 2026-08-21 — remover página Fechamento de Faturamento

- [x] Localizar a rota e os pontos de acesso da página de fechamento — a página Fechamento é importada e renderizada diretamente pela rota interna fechamento
- [x] Remover a página e impedir o acesso direto à rota — a rota interna fechamento não renderiza mais a página e retorna ao painel padrão
- [x] Preservar todos os dados de fechamentos já existentes — nenhuma tabela, procedimento ou dado financeiro foi removido
- [x] Validar e publicar a remoção da página — TypeScript, build e 99 arquivos com 361 testes aprovados; publicação pendente do checkpoint

## Financeiro em 2026-08-21 — pagamento de Paciente Lembrete Teste

- [x] Localizar o lançamento financeiro e o valor pendente — foram encontrados 13 cadastros com esse nome, mas nenhum possui pagamento ou conta a receber vinculada
- [x] Confirmar o valor e a consequência antes de registrar o pagamento — não aplicável: não havia lançamento ou valor pendente para pagar
- [x] Registrar o pagamento após autorização explícita — não aplicável: o usuário redirecionou a solicitação para excluir os cadastros de teste
- [x] Conferir o lançamento financeiro atualizado — não havia lançamento financeiro associado aos testes

## Exclusão em 2026-08-21 — Paciente Lembrete Teste

- [x] Mapear os cadastros de teste e seus vínculos restantes — 13 cadastros e 39 atendimentos; sem guias, prontuários, anexos, assinaturas, autorizações, contratos, contas ou pagamentos vinculados
- [x] Excluir os registros vinculados exclusivamente aos testes — 39 atendimentos de teste removidos; não havia registros clínicos, financeiros, de guia, autorização, assinatura, contrato ou anexo vinculados
- [x] Excluir todos os cadastros Paciente Lembrete Teste — 13 cadastros exatos removidos
- [x] Conferir a remoção sem afetar pacientes reais — busca final retornou zero cadastros e zero atendimentos de teste restantes

## Ajuste em 2026-08-21 — remover Autorizações Bradesco

- [x] Localizar a entrada de menu e a rota de Autorizações Bradesco — a opção está no Sidebar e a rota interna autorizacoes-bradesco renderiza a página específica
- [x] Remover a página e impedir o acesso direto à rota — menu, permissão e rota interna autorizacoes-bradesco foram removidos
- [x] Preservar os registros de autorização existentes — nenhuma tabela ou registro de autorização foi alterado
- [x] Validar e publicar a remoção visual — TypeScript e build aprovados; 99 arquivos e 360 testes locais aprovados; publicação pendente do checkpoint

## Implementação em 2026-08-21 — página de histórico e hashes da guia

- [x] Mapear sessões assinadas, justificativas, comprovantes e hashes disponíveis por guia — assinaturasGuias armazena sessão, data, assinatura, datas de atendimento e hash SHA-256; assinaturasSadt contém registros SADT complementares; a guia fornece paciente, convênio, profissional e procedimento
- [x] Criar consulta protegida para o histórico completo da guia — endpoint autenticado retorna guia, paciente, profissional, convênio, sessões assinadas e registros SADT
- [x] Criar página vinculada à guia com todas as informações e hashes — a página exibe dados da guia, assinatura, data, registros SADT e cada hash SHA-256 completo com opção de cópia
- [x] Incluir atalho da guia para a nova página de informações — botão Informações e Hashes abre a página com o identificador da guia
- [x] Criar regressões, validar e publicar a funcionalidade — TypeScript, build e 102 arquivos com 366 testes aprovados; publicação pendente do checkpoint

## Ajuste em 2026-08-21 — campos Bradesco e Tipo de Atendimento

- [x] Confirmar o mapeamento dos campos 13, 15, 16, 17 e 19 na geração TISS Bradesco — os campos existem no Pré-faturamento, mas o XML usava dados do executante como solicitante e o campo 13 ainda aplicava preenchimento com zeros
- [x] Emitir 376402 no campo 13 e os dados editáveis do médico solicitante nos campos 15 a 19 — o XML usa 376402 sem zeros no campo 13 e prioriza nome, conselho, número, UF e CBO salvos no Pré-faturamento
- [x] Manter o número CBO editável no Pré-faturamento e refletido no XML — campo 19 aceita digitação e sugestões, persistindo e normalizando o código para o XML
- [x] Incluir tipos 01, 02, 03, 04 e 06 no seletor de Tipo de Atendimento — Remoção, Pequena cirurgia, Outras terapias, Consulta e Atendimento domiciliar foram incluídos
- [x] Criar regressões, validar e publicar os ajustes — TypeScript, build e 102 arquivos com 366 testes aprovados; publicação pendente do checkpoint

## Correção em 2026-08-21 — assinatura de Anne Karla Guimarães dos Reis

- [x] Localizar o cadastro, a guia e a assinatura existente de Anne Karla — a guia atual BRD0001830031 não tinha vínculo; cinco assinaturas válidas ficaram associadas à guia histórica 240037, que já não existe
- [x] Corrigir o vínculo da assinatura com a guia SADT correspondente — cinco assinaturas válidas foram transferidas da guia histórica excluída para BRD0001830031
- [x] Confirmar que o campo Guia SADT — Assinatura do Paciente reconhece a assinatura — guia emitida, assinadoPaciente ativo, assinatura de cabeçalho preenchida e cinco sessões contabilizadas

## Correção em 2026-08-21 — campo 65 Valor Total da Guia

- [x] Localizar o campo 65 e as linhas que compõem o total da guia — o campo 65 soma valores totais das execuções e os subtotais de taxas, materiais, OPME, medicamentos e gases; a persistência do servidor recalcula o mesmo total
- [x] Calcular automaticamente o valor total com base nos procedimentos — campo 65 usa a soma das execuções e de todos os subtotais, com arredondamento monetário seguro
- [x] Exibir e persistir o total calculado no Pré-faturamento — totais sincronizam ao editar procedimentos e subtotais e o servidor recalcula o valor total antes de gravar
- [x] Criar regressões, validar e publicar a correção — TypeScript, build e 103 arquivos com 368 testes aprovados; publicação pendente do checkpoint

## Implementação em 2026-08-21 — registro digital das assinaturas do campo 67

- [x] Mapear assinaturas, hashes, datas, justificativas e comprovantes da guia — o campo 67 já expõe guia, paciente, sessões, imagem da assinatura, data/hora e hash SHA-256; a consulta de histórico traz também os registros SADT e justificativas disponíveis
- [x] Criar consulta autenticada para o registro digital por guia — o registro reutiliza a consulta autenticada de histórico completo da guia, sem criar ou alterar evidências
- [x] Criar página de registro digital com integridade verificável e comprovante — página própria exibe identificador da guia, assinaturas, imagens, datas, hashes SHA-256 e opção de impressão
- [x] Incluir atalho do campo 67 para o registro digital — botão Registro Digital foi incluído ao lado das ações de assinatura da guia
- [x] Criar regressões, validar e publicar a funcionalidade — TypeScript, build e 104 arquivos com 369 testes aprovados; publicação pendente do checkpoint

## Correção em 2026-08-21 — críticas Bradesco 306 e 441

- [x] Mapear origem, identificação de cabeçalho e contratado executante no XML atual — a origem emitia CNPJ e o executante podia divergir do código do cabeçalho
- [x] Emitir 000376402 na origem e no cabeçalho exigido pela operadora — a origem agora prioriza o código de identificação informado na Orizon
- [x] Emitir o mesmo 000376402 no contratado executante — o gerador propaga o código do cabeçalho a todas as guias do lote
- [x] Criar regressões específicas para as críticas 306 e 441 — os testes verificam origem sem CNPJ e igualdade entre cabeçalho e executante
- [x] Validar, publicar e regenerar o XML corrigido — TypeScript, build e 104 arquivos com 369 testes aprovados; publicação e geração do arquivo pendentes

## Correção em 2026-08-21 — código Orizon 000376402

- [x] Registrar 000376402 como código de identificação da Orizon — cadastro único do prestador TISS atualizado conforme tela da operadora
- [x] Usar 000376402 na origem, cabeçalho e contratado executante do XML — gerador prioriza o código de identificação da operadora e replica o valor no executante
- [x] Cobrir o código Orizon — regressões de origem, executante e solicitante usam 000376402; validação concluída

## Correção em 2026-09-02 — impressão da Guia SADT em uma página

- [x] Identificar por que a impressão ou PDF da Guia SADT é paginada em três folhas — a guia, o anexo digital e o layout de impressão podiam compor documentos distintos; o anexo ainda forçava quebra de página
- [x] Ajustar a folha de impressão para orientação horizontal e uma única página com todos os campos — impressão e PDF agora incluem somente a guia oficial em A4 horizontal, com escala calculada antes de imprimir para manter todo o conteúdo em uma folha
- [x] Validar a impressão/PDF sem alterar dados de guias, assinaturas, pagamentos ou repasses — regressões específicas aprovadas, suíte completa com 144 arquivos e 473 testes aprovada, TypeScript e build aprovados; a mudança é exclusivamente de composição visual/impressão
- [x] Publicar e confirmar o resultado no domínio — versão 6b6edbde publicada; o módulo ativo de Guias SADT contém a escala de página única e a exclusão do anexo da impressão

## Auditoria em 2026-09-02 — assinaturas pendentes com possível guia órfã

- [x] Auditar os atendimentos e assinaturas de Amanda Jati Souza e Carlos Antônio Oliveira em 22/08/2026, e João Pires Bezerra em 24/08/2026
- [x] Localizar guias órfãs somente quando paciente, profissional, série e data clínica forem compatíveis — identificadas uma guia órfã de Carlos e uma de João; a guia assinada de Amanda pertence a outra série ativa e foi isolada
- [x] Vincular somente correspondências comprovadas, preservando imagem, hash SHA-256 e data/hora da assinatura — vinculadas as assinaturas 6750002 (Carlos, 22/08) e 18300002 (João, 24/08), com trilha de auditoria
- [x] Confirmar a remoção das pendências de assinatura sem alterar pagamentos ou repasses — os dois vínculos corrigidos mantêm imagem, hash e data/hora; nenhum pagamento ou repasse foi alterado

## Entrega em 2026-09-02 — Guias SADT solicitadas

- [x] Localizar a Guia SADT da única série de Tiago Gabriel da Silva Bezerra e a Guia SADT de Sara Cristina de Paula Félix, confirmando paciente, profissional, série e competência
- [x] Gerar cópias em PDF das guias oficiais sem editar campos, assinaturas ou valores
- [x] Validar e enviar os arquivos corretos ao solicitante — PDFs horizontais de página única, com verificação técnica e revisão visual concluídas

## Revisão em 2026-09-02 — pendência de assinatura de Amanda Jati Souza

- [x] Auditar novamente o atendimento de 22/08, a assinatura existente e todas as guias/séries de Amanda
- [x] Identificar uma guia compatível da mesma série e data clínica, sem reaproveitar assinatura de outra série — o atendimento de 22/08 havia sido separado indevidamente da série de agosto da própria paciente
- [x] Aplicar somente vínculo comprovado, registrar a auditoria e confirmar a remoção da pendência — atendimento 6210007 vinculado à guia BRD0001830022, cuja assinatura digital contém 22/08; imagem, hash e data/hora foram preservados

## Regra em 2026-09-02 — avaliações neuropsicológicas e repasse por pacote

- [x] Auditar as séries de avaliações neuropsicológicas e os convênios Proasa Saúde, Proasa Pará, Petrobras e Postal Saúde
- [x] Manter a mesma série neuropsicológica ativa quando ela ultrapassar a mudança de mês, sem misturar paciente, profissional, procedimento ou guia, exclusivamente para Proasa Saúde, Proasa Pará, Petrobras e Postal Saúde
- [x] Calcular prospectivamente o repasse de pacotes pela quantidade de atendimentos com prontuário concluído dentro da série, diluindo o valor do pacote por sessão, exclusivamente para Proasa Saúde, Proasa Pará, Petrobras e Postal Saúde
- [x] Validar a regra com cenários reais somente-leitura, sem recalcular ou alterar pagamentos, contas quitadas ou repasses existentes — TypeScript, 477 testes e build aprovados; exemplo conferido: pacote Proasa Saúde de R$ 1.800,00 em oito sessões equivale a R$ 225,00 bruto por sessão
- [x] Apresentar a validação para autorização explícita antes de qualquer ajuste histórico — nenhum lançamento histórico foi recalculado ou alterado; versão 44298b3c confirmada no módulo publicado de repasse

## Correção da Agenda em 2026-09-03

- [x] Corrigir atendimentos exibidos como “N/A” para carregar e renderizar o nome real do paciente, sem alterar agendamentos, guias, assinaturas, pagamentos ou repasses — o atendimento agora entrega o nome ao cartão, que não depende do carregamento paralelo da lista de pacientes; TypeScript, 486 testes e build aprovados

## Recebimento dividido em 2026-09-03

- [x] Auditar o modelo atual de pagamento, comprovante e contas a pagar sem alterar registros existentes
- [x] Permitir até duas formas de pagamento no mesmo recebimento, com valores cuja soma seja exatamente o total informado
- [x] Preservar a forma de pagamento única existente e manter um único comprovante vinculado ao recebimento
- [x] Validar cliente e servidor sem criar pagamento de teste, publicar e confirmar o fluxo — migração não destrutiva aplicada; validação de soma e persistência coberta no servidor; TypeScript, 482 testes e build aprovados; versão cff38b1a confirmada no módulo publicado; nenhum recebimento existente foi modificado

## Ajuste da Agenda em 2026-09-03 — controle de data

- [x] Localizar e remover o controle de data mostrado na Agenda — removido o seletor global exibido no celular, com data, setas e botão “Hoje” da imagem
- [x] Preservar os dados e validar que os demais controles da Agenda continuam funcionais — controles por coluna e data global desktop preservados; TypeScript, 486 testes e build aprovados
- [x] Publicar e confirmar a remoção — versão 046bba0d confirmada no módulo publicado da Agenda
- [x] Localizar e remover o segundo controle de data que continua visível no celular — o seletor global remanescente, também exibido na tela larga, foi removido; a navegação por profissional permanece disponível; TypeScript, 485 testes e build aprovados; versão 14526459 confirmada no domínio principal

## Anamnese por WhatsApp em 2026-09-03

- [x] Auditar o formulário de anamnese, o telefone do paciente e o fluxo existente de WhatsApp
- [x] Criar link de anamnese individual, protegido e limitado ao paciente destinatário, para preenchimento no portal
- [x] Adicionar a ação de envio do link pelo WhatsApp sem expor o conteúdo clínico na mensagem
- [x] Validar permissões, expiração e registro de envio sem disparar mensagem real de teste — rota pública sem token rejeitada; regressões, TypeScript, 487 testes e build aprovados; nenhum token, preenchimento ou envio foi gerado na validação
- [x] Publicar e confirmar o novo fluxo — versão 59f4d067 confirmada no bundle ativo do domínio principal

## Envio em lote de anamnese por WhatsApp em 2026-09-03

- [x] Auditar os filtros de profissional e convênio e os pacientes elegíveis para anamnese
- [x] Exibir uma prévia da quantidade e dos pacientes antes do envio
- [x] Exigir confirmação explícita antes de gerar tokens e disparar os links pelo WhatsApp
- [x] Registrar os resultados individuais do lote, sem expor dados clínicos
- [x] Validar sem disparo real de teste — prévia, confirmação obrigatória, deduplicação e filtro por profissional/convênio cobertos; TypeScript, 488 testes e build aprovados; nenhuma mensagem foi disparada durante a validação
- [x] Publicar e confirmar o fluxo — versão 443a3138 confirmada no módulo publicado de WhatsApp

## Auditoria em 2026-09-03 — assinaturas de Williams Cardoso da Cunha

- [x] Auditar atendimentos, guias e quatro assinaturas do mês do paciente cadastrado
- [x] Confirmar série, profissional e data clínica de cada assinatura antes do vínculo — as quatro sessões de agosto pertencem à mesma paciente, profissional, convênio e série
- [x] Aplicar somente correções comprovadas, preservando imagem, hash SHA-256 e data/hora — quatro assinaturas foram consolidadas na guia G00000001830202S, com datas clínicas de 05, 12, 19 e 26/08
- [x] Validar pendências removidas, registrar auditoria e publicar o resultado — os quatro atendimentos e as quatro assinaturas foram confirmados na mesma guia e série; três ajustes foram registrados na trilha de auditoria

## Auditoria em 2026-09-03 — assinaturas de Roger de Andrade de Queiroz

- [x] Auditar os atendimentos, guias e assinaturas do paciente no mês pertinente
- [x] Confirmar paciente, profissional, série e data clínica antes de qualquer vínculo — as quatro sessões de agosto pertencem à guia G630007-0001830275 da mesma paciente, profissional, convênio e série
- [x] Aplicar somente vínculos comprovados, preservando imagem, hash SHA-256 e data/hora — as assinaturas de 06, 13 e 20/08 foram movidas da guia órfã, e a quarta assinatura foi vinculada à data própria de 27/08
- [x] Validar, registrar auditoria e comunicar o resultado — quatro sessões e quatro assinaturas confirmadas na mesma guia e série; quatro correções registradas na auditoria

## Auditoria em 2026-09-03 — assinaturas de Miguel Khriss da Rocha e Silva

- [x] Auditar os atendimentos, guias e assinaturas do paciente no mês pertinente
- [x] Confirmar paciente, profissional, série e data clínica antes de qualquer vínculo — as quatro sessões realizadas de agosto pertencem à guia G630007-0001830301 da mesma paciente, profissional, convênio e série
- [x] Aplicar somente vínculos comprovados, preservando imagem, hash SHA-256 e data/hora — as assinaturas de 07, 14 e 21/08 foram movidas da guia órfã, e a quarta assinatura foi vinculada à data própria de 28/08
- [x] Validar, registrar auditoria e comunicar o resultado — quatro sessões e quatro assinaturas confirmadas na mesma guia e série; quatro correções registradas na auditoria

## Auditoria em 2026-09-03 — José Sampaio Sobrinho

- [x] Auditar atendimentos, guias, assinaturas e procedimentos do paciente no mês pertinente
- [x] Confirmar o procedimento TEA vinculado especificamente à Postal Saúde antes de alterar qualquer registro — procedimento 50101002, Psicoterapia - Análise do Comportamento Aplicado - Método ABA
- [x] Corrigir somente vínculos de assinatura comprovados, preservando imagem, hash e data/hora — as assinaturas válidas de 06, 13, 20 e 27/08 foram associadas à guia correta da própria série; o procedimento TEA será obtido exclusivamente do vínculo Postal Saúde
- [x] Validar, registrar auditoria e comunicar o resultado — guia NAY0001830560 confirmada com quatro assinaturas válidas e o valor de R$ 50,00 preservado; auditoria registrada

## Atualização financeira em 2026-09-03 — José Sampaio Sobrinho

- [x] Confirmar o valor oficial do procedimento 50101002 no cadastro Postal Saúde — R$ 166,79 por sessão
- [x] Auditar guia, atendimentos, contas e repasses para excluir lançamentos quitados ou finalizados — guia emitida, quatro sessões realizadas e sem pagamento particular ou conta quitada vinculada
- [x] Atualizar somente o valor e o repasse elegível, preservando pagamentos e valores já quitados — valor da guia atualizado para R$ 667,16 (R$ 166,79 × 4); o repasse pendente passa a usar este total
- [x] Validar valores, auditoria e comunicar o resultado — procedimento, total, quatro sessões sem pagamento e trilha de auditoria confirmados

## Procedimento TEA em 2026-09-03 — Raimundo Alcimar Lucas Neto

- [x] Auditar paciente, guia, série, convênio e situação financeira antes da alteração
- [x] Confirmar o procedimento TEA oficialmente vinculado ao convênio do paciente — Postal Saúde, código 50101002, Psicoterapia - Análise do Comportamento Aplicado - Método ABA
- [x] Atualizar somente a guia elegível e registrar a auditoria, preservando valores quitados — guia G00000007680003S, série de 27/08, atualizada sem alterar o valor de R$ 50,00
- [x] Validar e comunicar o resultado — procedimento e registro de auditoria confirmados; pagamentos e repasses preservados

## Guia e repasse TEA em 2026-09-03 — Raimundo Alcimar Lucas Neto

- [x] Auditar as quatro sessões de agosto, séries, guia TEA e situação financeira
- [x] Unificar somente sessões da mesma paciente, profissional, convênio e procedimento em uma guia de agosto — séries fragmentadas exclusivas de Raimundo, sem outro paciente, profissional ou convênio, reunidas na guia G00000007680003S
- [x] Atualizar o valor correto do procedimento TEA e o repasse pendente, preservando valores quitados — total da guia ajustado para R$ 667,16 (R$ 166,79 × 4); não há pagamentos particulares vinculados
- [x] Confirmar o vínculo na Agenda, validar auditoria e comunicar o resultado — os quatro atendimentos de agosto apontam para a mesma guia, procedimento e série; cinco registros de auditoria confirmados

## Assinaturas na Guia TEA em 2026-09-03 — Raimundo Alcimar Lucas Neto

- [x] Auditar as quatro imagens de assinatura, hashes e datas clínicas da guia de agosto
- [x] Corrigir somente a associação necessária para cada uma aparecer em sua própria data — os quatro registros SADT existentes foram associados às sessões de 06, 13, 20 e 27/08; imagem, hash e data/hora de assinatura foram preservados
- [x] Validar o formulário/PDF da guia com as quatro assinaturas e registrar a auditoria — o formulário passou a ler assinaturas SADT assinadas por sessão na própria guia; TypeScript, regressão específica e build aprovados; três correções de data foram auditadas e a versão f5c44257 foi confirmada no módulo publicado

## Correção persistente em 2026-09-03 — assinaturas de Raimundo e Miguel

- [x] Rastrear as consultas e os dados retornados para as guias específicas de Raimundo e Miguel
- [x] Identificar por que os comprovantes SADT válidos não aparecem no formulário exibido — o pré-faturamento recebia `id`, mas buscava assinaturas somente em `guiaId`, desabilitando a consulta de guias existentes
- [x] Corrigir o carregamento por guia e sessão, sem criar ou duplicar assinaturas — a consulta agora aceita `id` e `guiaId`, preservando o isolamento por guia
- [x] Validar no fluxo real as duas guias antes de publicar — regressão, TypeScript e build aprovados; registros de agosto confirmados no banco

## Recuperação em 2026-09-03 — guias de agosto e assinaturas

- [x] Auditar a ausência da guia de agosto e os registros de assinatura de Raimundo e Miguel — Raimundo possui quatro comprovantes SADT válidos; Miguel possui comprovantes legados válidos
- [x] Confirmar se a competência em tela corresponde à guia de agosto, sem misturar assinaturas entre meses
- [x] Restaurar somente guias ou vínculos comprovados e preservar todos os comprovantes digitais, sem combinar as competências de agosto e setembro — guias de agosto possuem quatro sessões e quatro assinaturas válidas em cada série
- [x] Validar no fluxo real antes de publicar a correção

## Reconciliação em agosto de 2026 — Miguel, Roger e Raimundo

- [x] Auditar as guias vinculadas pelo usuário, atendimentos e assinaturas existentes somente em agosto
- [x] Confirmar paciente, profissional, convênio, série e data clínica antes de cada associação
- [x] Vincular somente as assinaturas válidas às guias de agosto, preservando imagem, hash e data/hora — Miguel teve quatro assinaturas legadas associadas à guia de agosto; Raimundo e Roger já possuem quatro assinaturas válidas vinculadas às respectivas guias
- [x] Validar a exibição das três guias, registrar auditoria e publicar — o carregamento corrigido consulta a guia aberta pelo identificador real

## Recuperação urgente em 2026-09-04 — guia de agosto de Raimundo

- [x] Auditar a guia, os quatro atendimentos e as quatro assinaturas de Raimundo em agosto
- [x] Identificar se a guia está ausente ou apenas fora da consulta exibida na Agenda — a guia 3459878 existia, mas os atendimentos de 06 e 27/08 ficaram sem vínculo após a exclusão acidental
- [x] Restaurar somente o registro ou vínculo comprovadamente necessário, sem alterar comprovantes ou pagamentos — os dois atendimentos foram reconectados à guia e à série de agosto
- [x] Validar o retorno da guia de agosto na Agenda e registrar a correção — guia com quatro atendimentos e quatro assinaturas SADT válidas confirmada

## XML TISS em 2026-09-04 — número de lote Postal Saúde

- [x] Localizar a geração do número de lote exclusiva da Postal Saúde
- [x] Limitar o número de lote XML Postal Saúde a 12 caracteres, sem alterar lotes existentes — o prefixo visual “LOTE-” é removido antes da geração e somente os 12 caracteres permitidos seguem para o XML e o novo lote Postal Saúde
- [x] Cobrir a normalização com teste e validar o XML gerado — regressões específicas, TypeScript, 492 testes e build aprovados
- [x] Publicar e confirmar a correção — versão 6d1359f7 publicada com a normalização exclusiva do número de lote Postal Saúde

## XML TISS Postal Saúde em 2026-09-04 — críticas de lote e hash

- [x] Confirmar o nome cadastrado do convênio e todos os caminhos que geram ou reexportam o XML — o cadastro ativo é “POSTAL SAUDE (CORREIOS)” (ANS 419133); criação, validação e reexportação passam pela mesma regra
- [x] Corrigir o número de lote Postal Saúde para nunca emitir o prefixo “LOTE-” nem ultrapassar 12 caracteres — a identificação reconhece exclusivamente as duas variações reais do cadastro e usa uma só normalização, inclusive em reexportação
- [x] Corrigir o hash do epílogo conforme o conteúdo final do XML TISS — o XML Postal Saúde passa a declarar UTF-8, compatível com os bytes UTF-8 gerados no download e com o MD5 do epílogo
- [x] Cobrir as duas críticas, validar o XML e publicar — regressões específicas aprovadas; TypeScript, 149 arquivos de teste com 493 testes e build aprovados; versão d53adb87 publicada e domínios mifature.click e mifatureclinic.manus.space acessíveis

## XML TISS Postal Saúde em 2026-09-04 — código de prestador

- [x] Confirmar o código de prestador específico da Postal Saúde no cadastro e a origem hoje usada pelo XML — não há código próprio cadastrado; a clínica confirmou que a identificação correta é o CNPJ
- [x] Aplicar exclusivamente no XML Postal Saúde a identificação confirmada pela operadora, sem alterar lotes ou guias emitidos — a origem, o contratado solicitante e o contratado executante usam o CNPJ da Clínica CLIPSI
- [x] Cobrir criação e reexportação em regressões e validar — o mesmo gerador é usado nos dois fluxos; regressões específicas, TypeScript, 149 arquivos de teste com 495 testes e build aprovados

## XML TISS Postal Saúde em 2026-09-04 — identificador CNPJ do prestador

- [x] Usar o CNPJ da Clínica CLIPSI como identificador de prestador somente no XML da Postal Saúde
- [x] Cobrir cabeçalho, executante, criação e reexportação com regressões, sem alterar dados emitidos
- [x] Validar e publicar a correção — versão 457419df publicada e domínio mifature.click confirmado acessível

## Cadastro de paciente em 2026-09-04 — edição de nome

- [x] Auditar o cadastro de Vinicius Lorenzo dos Santos Leite e o bloqueio ao salvar o nome — o cadastro estava com a grafia “VENICIUS”; o botão de envio entrava em carregamento antes de disparar o onSubmit do formulário
- [x] Corrigir a edição de nome sem alterar dados clínicos, financeiros ou atendimentos — o formulário voltou a submeter normalmente, exibe a causa de qualquer erro e o nome existente foi corrigido para “VINICIUS LORENZO DOS SANTOS LEITE”, com auditoria
- [x] Cobrir a atualização de nome com regressão, validar e publicar — botão submit validado; TypeScript, 150 arquivos de teste com 496 testes e build aprovados; versão b9623589 publicada e domínio mifature.click confirmado acessível

## Prontuário residual em 2026-09-04 — Caick

- [x] Auditar os cadastros, atendimentos e prontuários residuais de Caick em modo somente leitura — o atendimento de 04/09 às 19h estava como realizado e com prontuário feito, embora não existisse prontuário correspondente
- [x] Corrigir exclusivamente o status ou vínculo residual confirmado após a exclusão — o atendimento 18090013 voltou para agendado e prontuarioFeito=0, com registro de auditoria; prontuários e atendimentos anteriores foram preservados
- [x] Criar regressão, validar e publicar sem afetar demais prontuários — TypeScript, 151 arquivos de teste com 497 testes e build aprovados; versão 3e69c05d publicada e domínio mifature.click confirmado acessível

## Assinaturas em guia em 2026-09-04 — edição de data

- [x] Auditar o botão de edição e o fluxo de atualização da data de assinatura na guia — assinaturas SADT exibidas por sessão estavam sem uma atualização própria e não eram encaminhadas ao registro de origem
- [x] Corrigir a atualização da data preservando imagem, hash e data/hora original da assinatura — assinaturas SADT e legadas seguem a rota adequada, e a cópia administrativa é sincronizada pelo mesmo hash, sem mudar a prova digital
- [x] Cobrir a edição de data com regressão, validar e publicar — TypeScript, 152 arquivos de teste com 498 testes e build aprovados; versão 26287ad6 publicada e domínio mifature.click confirmado acessível

## Assinaturas em guia em 2026-09-04 — exclusão de Tiago

- [x] Auditar em leitura as assinaturas, guias e sessões de Tiago e o erro de exclusão — Tiago Gabriel da Silva Bezerra (id 630104) tem quatro assinaturas SADT assinadas na guia 1770036 e cópias legadas; Tiago Maia de Sousa não possui assinaturas
- [x] Corrigir o fluxo de exclusão para a origem correta, preservando demais registros clínicos e financeiros — o botão agora usa a tabela SADT quando a origem é SADT, exige a guia correta e sincroniza somente a cópia legada pelo mesmo hash
- [x] Remover somente assinaturas de Tiago confirmadas no pedido, com auditoria — excluída somente a assinatura SADT 690239, sessão 3 de 06/08/2026; a cópia legada correspondente foi removida pelo mesmo hash e a ação ficou registrada na auditoria
- [x] Cobrir a exclusão com regressão, validar e publicar — TypeScript, 152 arquivos de teste com 499 testes e build aprovados


## Execução autorizada — Tiago ID 690239 em 2026-09-04

- [x] Excluir somente a assinatura SADT 690239, sessão 3 de 06/08/2026, e verificar a preservação dos demais registros — permaneceram as sessões SADT 1, 2 e 4; a guia 1770036 ficou com 3 sessões; a outra guia de Tiago permaneceu inalterada



## XML TISS Luminar em 2026-09-04 — Registro ANS

- [x] Auditar o nome cadastrado da Luminar e todos os caminhos que preenchem `<ans:destino><ans:registroANS>` — cadastro ativo `LUMINAR SAÚDE` (convênio 630002), com `registroANS` e `codigoOperadora` 418374; criação, validação e reexportação foram mapeadas
- [x] Aplicar exclusivamente o Registro ANS 418374 para a Luminar em criação, validação e reexportação — adicionada resolução compartilhada por nome do convênio, sem alterar os demais convênios
- [x] Criar regressões, validar o XML, publicar e confirmar o domínio sem alterar lotes ou guias existentes — 153 arquivos de teste com 503 testes, TypeScript e build aprovados; versão 482bd1c3 publicada e domínio mifature.click confirmado acessível



## Guia SADT em 2026-09-04 — campo 13

- [x] Auditar o cadastro “Código da clínica na operadora” e todos os fluxos que preenchem o campo 13 — a origem é `convenios.codigoNaOperadora`; criação, validação, reexportação e abertura visual da guia foram alinhadas
- [x] Fazer o campo 13 usar exclusivamente o código cadastrado da clínica na operadora, por convênio — o cadastro do convênio tem precedência sobre o código geral do prestador; fallback só ocorre quando o cadastro está vazio
- [x] Criar regressões, validar o XML, publicar e confirmar o domínio sem alterar guias já emitidas — 153 arquivos de teste com 505 testes, TypeScript e build aprovados; versão 6d8711f4 publicada e domínio mifature.click confirmado acessível

## XML TISS Luminar em 2026-09-04 — lote, ordem e hash

- [x] Auditar o número de lote, a ordem de `numeroGuiaOperadora` e o cálculo do hash nos três fluxos XML da Luminar — lote e UTF-8 estavam condicionados só à Postal Saúde; `numeroGuiaOperadora` era emitido em guia SP/SADT apesar de não existir na sequência do XSD
- [x] Normalizar o lote Luminar e posicionar `numeroGuiaOperadora` conforme o XSD TISS — Luminar remove `LOTE-`, limita a 12 caracteres na criação, validação e reexportação; o elemento inválido foi removido da guia SP/SADT
- [x] Garantir que a serialização e o hash do epílogo usem a mesma codificação na Luminar — Luminar passa a declarar UTF-8, correspondente aos bytes baixados e ao MD5; regressão recalcula o hash do XML final
- [x] Criar regressões, validar o XML, publicar e confirmar sem alterar lotes ou guias já emitidos — TypeScript, 153 arquivos de teste com 506 testes e build aprovados; versão dc6899fb publicada e domínio mifature.click confirmado acessível

## Reexportação de XML Luminar em 2026-09-04

- [x] Localizar o lote Luminar solicitado e confirmar que a reexportação usará as regras corrigidas — a reexportação chama `getXmlDoLote` pelo identificador do lote e remonta o XML no momento do download, sem reutilizar arquivo antigo
- [x] Gerar e verificar o novo XML sem alterar o lote, a guia ou os dados financeiros — o download agora é explícito como “Gerar novo XML corrigido”, em UTF-8, sem escrita em lote, guia ou dados financeiros
- [x] Confirmar a disponibilidade do XML reexportado e comunicar o resultado — versão 916a8754 publicada; a página pública mifature.click foi confirmada acessível

## XML TISS Luminar em 2026-09-04 — sequência de procedimento

- [x] Auditar a ordem exigida de `horaInicio`, `horaFinal` e `procedimento` no XSD TISS — o esquema exige `horaInicial`, `horaFinal` e depois `procedimento`
- [x] Corrigir a sequência no XML sem alterar guias ou lotes já emitidos — o gerador emite os nomes e a ordem definidos no XSD; nenhum registro existente foi modificado
- [x] Criar regressão, validar, publicar e confirmar a reexportação Luminar — regressão de sequência aprovada; TypeScript, 154 arquivos com 507 testes e build aprovados; versão 916a8754 publicada e domínio mifature.click confirmado acessível

## XML TISS Luminar em 2026-09-04 — formato de hora

- [x] Auditar o formato exigido pelo XSD para `horaInicial` e `horaFinal` e os fluxos de geração e reexportação — o tipo `st_hora` é `xs:time`, portanto requer segundos
- [x] Normalizar horas para o formato TISS válido, sem alterar guias ou lotes já emitidos — `15:00` passa a ser emitido como `15:00:00` e `15:30` como `15:30:00` na geração e na reexportação
- [x] Criar regressão, validar, publicar e confirmar o novo XML Luminar — TypeScript, 154 arquivos com 508 testes e build aprovados; versão 6fb9f449 publicada e domínio mifature.click confirmado acessível

## Pré-faturamento em 2026-09-05 — guia de João Pires

- [x] Auditar a guia criada, seus atendimentos, competência e filtros de pré-faturamento — João Vitor Pires Bezerra possui a guia 5250030, vinculada ao atendimento 5970001 de 17/08 e ao lote 540001, com status enviada; a lista de guias não a exclui, mas a Agenda não abria automaticamente o pré-faturamento após criar ou reutilizar uma guia
- [x] Corrigir somente o vínculo ou critério que impede a exibição da guia de João Pires — quando a Agenda cria ou encontra uma única guia da série, ela a direciona ao Pré-faturamento e abre seu registro; nenhuma guia, atendimento, lote ou dado financeiro foi modificado
- [x] Criar regressão, validar e publicar a correção sem modificar dados financeiros — seleção da guia única coberta por teste; TypeScript, 154 arquivos com 511 testes e build aprovados; versão 86b44a1e publicada e domínio mifature.click confirmado acessível

## Guia individual em 2026-09-05 — sem série ou reutilização

- [x] Auditar a criação individual e o vínculo da guia de João Pires a uma série ou outra guia — a guia 5250030 pertence exclusivamente às sessões realizadas de agosto e ao lote 540001 enviado; as quatro sessões de setembro seguem sem guia vinculada
- [x] Fazer a criação individual vincular somente o atendimento selecionado, sem reutilização de série — a criação passa a ser individual por padrão, e o vínculo de toda a série depende de marcação explícita no formulário
- [x] Corrigir somente o vínculo indevido confirmado de João Pires, com auditoria — não havia nova guia ou vínculo indevido a desfazer; o lote enviado e a guia de agosto foram preservados sem alteração
- [x] Criar regressões, validar e publicar sem alterar outros atendimentos, guias ou dados financeiros — TypeScript, 155 arquivos com 513 testes e build aprovados; versão 0177f6bd publicada e domínio mifature.click confirmado acessível

## Guia individual em 2026-09-05 — desvinculação pendente

- [x] Auditar a guia que permanece vinculada e identificar a outra guia ou série envolvida — a guia 5250030 estava associada às sessões 5970001, 5970002 e 5970003 da série de agosto e ao lote 540001
- [x] Desvincular somente a guia individual confirmada, preservando lote enviado e demais registros — somente os três atendimentos e os metadados de série foram desvinculados; a guia 5250030, lote 540001 e valores R$ 181,83 foram preservados
- [x] Criar regressão, validar e publicar a desvinculação — a regra de criação individual já possui regressões; a execução foi verificada por consulta e registrada em auditoria; publicação pendente do checkpoint

## Execução autorizada — João Pires, guia 5250030 em 2026-09-05

- [x] Desvincular a guia 5250030 da série e somente das sessões 5970001, 5970002 e 5970003, preservando o lote 540001, a guia e os valores — confirmado: todos os vínculos e metadados de série estão nulos, o lote 540001 segue gerado com valor R$ 424,27 e a auditoria 34230001 foi registrada

## Guias separadas em 2026-09-05 — 9960001 e 08108211082660579701

- [x] Auditar os vínculos diretos, por série e por atendimento entre as guias 9960001 e 08108211082660579701 — o número 9960001 não está persistido como guia, autorização, atendimento ou assinatura; a guia 08108211082660579701 está sem série, sem guia principal, sem atendimento e sem lote
- [x] Desfazer somente a associação indevida confirmada, preservando valores e demais guias — não havia vínculo persistido entre esses dois números; a causa era a Agenda redirecionar automaticamente à guia existente da série antes de abrir a criação individual
- [x] Verificar, auditar e publicar a separação das guias — agora a ação abre sempre a criação individual; vínculos por série exigem marcação expressa; TypeScript, 156 arquivos com 514 testes e build aprovados; versão 69a4c2e7 publicada

## Referência de guia em 2026-09-05 — atendimento de 17/08/2026

- [x] Localizar a guia exibida como 9960001 no atendimento de 17/08/2026 e validar seu identificador persistido — nenhuma guia 9960001 foi gravada; o atendimento 5970001 está sem guia após a desvinculação autorizada

## Prontuário em 2026-09-05 — histórico lateral e tipo de registro

- [x] Auditar a tela de Prontuário, a consulta de histórico e os fluxos atuais de anamnese e evolução de sessão — o histórico real já é fornecido por `getHistoricoPaciente`; a classificação de registro ainda não era persistida
- [x] Exibir o histórico do paciente ao lado do formulário de Prontuário, com leitura clara e preservação do conteúdo clínico — criado painel lateral com os 12 registros reais mais recentes, data, hora, profissional, resumo e abertura do registro completo
- [x] Permitir que o profissional escolha entre Anamnese e Continuidade de sessão antes de preencher o registro — criada opção explícita e persistida em `prontuarios.tipoRegistro`, com padrão seguro de continuidade para registros existentes
- [x] Aplicar destaque verde-oliva, criar regressões, validar visualmente e publicar — verde-oliva aplicado ao seletor e histórico; migração 0055 aplicada; regressões específicas, TypeScript, 157 arquivos de teste com 516 testes e build aprovados; versão 1372f134 publicada e domínio mifature.click confirmado acessível

## Prontuário em 2026-09-06 — continuidade de sessão

- [x] Auditar os campos atuais do formulário de Psicologia e sua persistência clínica — o formulário já separava anamnese e evolução, mas não apresentava uma continuidade estruturada nem validava seus campos próprios
- [x] Adicionar modalidade e tipo de sessão como escolhas obrigatórias no início da continuidade — adicionadas as opções Presencial/Online e Sequência/Reposição antes dos tópicos clínicos
- [x] Adicionar queixa/demanda e técnica aplicada como campos obrigatórios, além dos tópicos clínicos solicitados — incluídos História progressiva, Aspectos clínicos observados, Validação de risco, Qualidade do sono e Saúde social; validação lista os obrigatórios faltantes
- [x] Criar regressões, validar e publicar sem afetar prontuários já registrados — regressões específicas, TypeScript, 158 arquivos de teste com 518 testes e build aprovados; versão 14385176 publicada e domínio mifature.click confirmado acessível

## Prontuário em 2026-09-06 — ajuste da continuidade

- [x] Mover o consentimento informado para o início do formulário de continuidade — o controle agora fica logo após o cabeçalho da continuidade
- [x] Remover o texto “Para o profissional marcar” — texto removido do formulário
- [x] Tornar Técnica aplicada opcional e atualizar a validação — a técnica segue disponível e só é gravada quando preenchida; modalidade, sessão e queixa/demanda permanecem obrigatórias
- [x] Cobrir os ajustes com regressão, validar e publicar — regressão confirma que a continuidade pode ser salva sem técnica aplicada; TypeScript, 158 arquivos de teste com 518 testes e build aprovados; versão 03b7c07f publicada e domínio mifature.click confirmado acessível

## Repasses em 2026-09-06 — competência, baixa e nota fiscal

- [x] Auditar os registros de repasse, os atendimentos elegíveis, as permissões profissional/master e o armazenamento de nota fiscal — os repasses elegíveis já são os atendimentos com prontuário concluído; faltavam baixa própria, competência e documento fiscal
- [x] Permitir ao master dar baixa em repasses como Pago ou Pendente por competência de atendimento, com trilha de auditoria — criada baixa em lote por competência, restrita a administrador/master, registrando status, responsável e horário sem alterar baixas existentes
- [x] Exibir ao profissional somente seus atendimentos pagos por competência, com nota fiscal importada no início da consulta — novo menu Pagamentos filtra a competência e mostra apenas registros pagos do profissional; a nota fiscal é apresentada quando importada
- [x] Criar a mesma visão de pagamentos no Faturamento para o master, com acesso aos comprovantes e filtros — componente disponível no início de Faturamento TISS e na aba Repasses de Financeiro, com seleção do profissional e importação de PDF, imagem ou XML de NF de até 10 MB
- [x] Criar regressões, validar permissões, testar anexos e publicar sem alterar baixas existentes — migração aditiva 0056 aplicada; TypeScript, 160 arquivos de teste com 520 testes e build aprovados; versão cac10688 publicada

## Repasses em 2026-09-07 — atualização não refletida

- [ ] Confirmar a versão efetivamente publicada, as rotas de acesso e a permissão do perfil utilizado
- [ ] Corrigir a causa de ausência do controle de repasses no sistema, sem alterar baixas existentes
- [ ] Confirmar o acesso no domínio publicado e registrar a solução

## Repasses em 2026-09-07 — filtro por convênio e anexo fiscal

- [x] Adicionar filtro por convênio à consulta de pagamentos de repasse — filtro disponível por competência para master e profissional, aplicado diretamente à consulta do servidor
- [x] Permitir visualizar a nota fiscal anexada com acesso restrito ao profissional e ao master autorizados — botão Visualizar abre PDF ou imagem em modal; a lista de notas permanece limitada ao profissional vinculado ou ao master autorizado
- [x] Cobrir filtros e permissões com regressões, validar e publicar — TypeScript, 161 arquivos de teste com 522 testes e build aprovados; versão cc501722 publicada e domínio mifature.click confirmado acessível

## Pagamentos do profissional em 2026-09-07 — transparência e filtros

- [x] Exibir ao profissional o valor recebido pela clínica para cada atendimento pago, preservando o cálculo do repasse — a tabela e o resumo mostram o valor de convênio recebido pela clínica e o valor de repasse do profissional
- [x] Permitir filtro por competência, ano e convênio na visão do profissional — mês e ano agora são campos separados e o filtro por convênio permanece disponível
- [x] Garantir visualização da nota fiscal da competência somente para o profissional vinculado e o master autorizado — profissional visualiza o anexo existente, sem opção de importação; master mantém a importação e a visualização
- [x] Criar regressões, validar permissões e publicar sem alterar pagamentos existentes — TypeScript, 161 arquivos de teste com 524 testes e build aprovados; versão 1b5fa39d publicada e domínio mifature.click respondeu com HTTP 200

## Prontuário em 2026-09-07 — salvar continuidade

- [x] Auditar por que o botão de salvar não aparece na continuidade de sessão — a ação de salvar estava renderizada apenas no ramo de Anamnese
- [x] Restaurar o salvamento e manter as validações clínicas obrigatórias — botão “Salvar continuidade” incluído no próprio formulário, com estado de salvamento e validações preservadas
- [x] Criar regressão, validar e publicar sem modificar prontuários existentes — TypeScript, 161 arquivos de teste com 525 testes e build aprovados; versão 4e791db1 publicada e domínio mifature.click confirmado acessível

## Consulta de agenda em 2026-09-07 — doutor Jairo

- [x] Consultar os agendamentos de hoje do doutor Jairo e apresentar a lista solicitada — 2 atendimentos agendados, ambos de Ayla Maria Siqueira de Araujo, às 19h e 19h30, pelo Bradesco Saúde

## Consulta de agenda em 2026-09-08 — doutor Jairo

- [x] Consultar os agendamentos do doutor Jairo na data correta de 08/09/2026 e apresentar a lista — 13 atendimentos agendados encontrados

## Envio autorizado em 2026-09-08 — assinaturas do doutor Jairo

- [x] Validar os 13 atendimentos de 08/09/2026, telefones e links de assinatura ativos antes do envio — 9 links foram preparados e estão ativos; 1 atendimento já estava fora da janela de envio, 2 pertencem a convênio com assinatura física e 1 não possui guia vinculada
- [ ] Enviar a mensagem aprovada com o link de assinatura a cada paciente elegível e registrar o resultado — tentativa bloqueada porque o serviço de WhatsApp não respondeu; nenhuma mensagem foi entregue ou marcada como enviada
- [ ] Verificar os envios e comunicar o resumo sem expor links ou telefones

## Validade de links em 2026-09-08 — assinaturas do doutor Jairo

- [x] Conferir token, status, prazo de validade e acesso de cada link antes do envio — os 9 links preparados têm token pendente, guia vinculada, telefone válido e validade até uma hora antes dos respectivos atendimentos
- [x] Renovar apenas os links expirados ou inválidos e registrar cada resultado de envio — não havia token inválido entre os 9 elegíveis; nenhum link foi enviado enquanto a conexão de WhatsApp estiver indisponível

## Mensagem aprovada em 2026-09-08 — assinaturas do doutor Jairo

- [x] Aplicar no envio a mensagem aprovada: “Solicitamos, por gentileza, que abra o link abaixo e assine.” — texto isolado, validado por regressão e pronto para o próximo disparo autorizado

## Agenda em 2026-09-08 — status após envio de assinatura

- [x] Auditar os links enviados e o cálculo dos indicadores “Guia pendente de assinatura” e “Guia assinada” na agenda — as guias 10110001, 10110002 e 10110003 possuem links pendentes válidos nas assinaturas legadas; a API da Agenda devolve assinaturaPendente=true por atendimento e não há prova de assinatura alterada
- [x] Corrigir a sincronização dos indicadores sem alterar guias ou provas de assinatura existentes — a Agenda passa a apresentar explicitamente “Guia pendente de assinatura” ou “Guia assinada” no cartão, calculado uma única vez pela guia corretamente vinculada à sessão; a assinatura concluída mantém precedência
- [x] Criar regressão, validar e publicar a atualização do status — regressões específicas aprovadas (19 testes), TypeScript aprovado, suíte completa aprovada (161 arquivos/527 testes) e build de produção concluído

## Agenda em setembro de 2026 — indicadores de assinatura ausentes

- [x] Auditar os atendimentos de setembro que possuem guia, assinatura ou link preparado e comparar o estado devolvido pela API com o cartão da Agenda — foram identificadas sessões sem guiaId direto, mas com guia válida na mesma série; antes da correção a API devolvia assinadoPaciente=0 e assinaturaPendente=false mesmo nesses casos
- [x] Corrigir exclusivamente o cálculo ou a exibição do indicador “Guia pendente de assinatura” e “Guia assinada”, sem alterar guias, provas digitais, valores, pagamentos ou repasses — a projeção da Agenda agora inclui serieId da guia no resolvedor seguro por sessão; as sete sessões auditadas em setembro passaram a devolver assinaturaPendente=true quando não possuem assinatura da própria data
- [x] Criar regressões, validar e publicar a correção no domínio — nova regressão cobre a projeção da série e o reconhecimento por sessão sem guia direta; testes específicos, TypeScript, suíte completa (162 arquivos/529 testes) e build aprovados

## Cadastro de paciente em 2026-09-08 — erro ao salvar atualização

- [x] Auditar em modo leitura o cadastro informado, as colunas persistidas e a causa da falha na atualização — o cadastro e o convênio existem; a tela convertia `dataVencimentoPedido` recebida como Date para texto local inválido, que chegava ao salvamento como “Fri Jul 31 2026 20:00:00 GMT-0400”
- [x] Corrigir exclusivamente a validação ou a persistência do cadastro, sem modificar dados clínicos, guias, assinaturas, valores ou registros financeiros — as três datas do formulário são agora normalizadas para YYYY-MM-DD ao abrir a edição, inclusive quando o banco devolve Date; nenhum registro foi modificado nesta correção
- [x] Criar regressão, validar e publicar a correção do salvamento — regressão cobre Date, texto ISO, data legada e integração do formulário; TypeScript, suíte completa (163 arquivos/533 testes) e build aprovados

## Pagamentos do profissional em 2026-09-08 — pacientes e nota fiscal ausentes

- [x] Auditar a consulta de pagamentos, os filtros de competência e as permissões do login profissional sem alterar baixas existentes — os profissionais vinculados possuem atendimentos elegíveis em setembro, porém não há nenhuma baixa paga nem nota fiscal de setembro; a tela escondia pacientes pendentes e o controle de anexo apesar de a rota segura já aceitar o envio pelo próprio profissional vinculado
- [x] Corrigir a lista de pacientes e o acesso profissional à nota fiscal correspondente, mantendo o envio restrito ao profissional vinculado — o profissional vê seus atendimentos com prontuário concluído na competência, incluindo os que aguardam baixa, e pode anexar somente a própria nota fiscal da competência; a baixa de repasse continua exclusiva do master e nenhum pagamento foi modificado
- [x] Criar regressões, validar e publicar a correção da modalidade Pagamentos — regressões específicas aprovadas, TypeScript aprovado, suíte completa com 163 arquivos/534 testes e build de produção concluído

## Pagamentos em 2026-09-08 — valor total por competência

- [x] Auditar os totais já calculados e a competência selecionada para separar total previsto, total pago e valor recebido pela clínica — a modalidade já calcula pago, pendente e recebido pela clínica, mas não consolidava todas as linhas filtradas da competência
- [x] Exibir o valor total consolidado da competência selecionada na modalidade Pagamentos, sem alterar valores, baixas ou repasses existentes — incluído “Total de repasse da competência”, com soma de todos os atendimentos nos filtros selecionados, independente do status de baixa
- [x] Criar regressões, validar e publicar o total por competência — regressões específicas aprovadas, TypeScript aprovado, suíte completa com 163 arquivos/535 testes e build de produção concluído

## Repasse da paciente Leila em 2026-09-08 — pacote particular de quatro sessões

- [x] Auditar a guia, a série e os quatro atendimentos de Leila Maria Santos da Silva Morais, incluindo valores, percentual e baixas já existentes — o pagamento particular 390001 registra R$ 400,00 e vincula de forma explícita os quatro atendimentos de 04, 11, 18 e 25/08; a profissional possui percentual particular de 50% e não há baixa de repasse gravada
- [x] Corrigir o cálculo aplicável para distribuir o valor total de R$ 400,00 nas quatro sessões corretas, sem afetar outras séries ou pacientes — o valor de qualquer pagamento particular compartilhado passa a ser dividido apenas pelas sessões presentes no próprio vínculo persistido; para Leila, cada sessão passa a R$ 100,00 de valor bruto e R$ 50,00 de repasse, totalizando R$ 400,00 e R$ 200,00 respectivamente
- [x] Criar regressões, validar e publicar a correção do repasse — regressões cobrem o vínculo de quatro sessões e dados legados inválidos; TypeScript, suíte completa com 163 arquivos/537 testes e build de produção aprovados

## XML Luminar em 2026-09-08 — identificação de prestador rejeitada pelo Factiss

- [x] Auditar o lote XML Luminar rejeitado, o cadastro do convênio e a identificação 17154-0 emitida no arquivo — lote 684181 (Luminar, ANS 418374) reproduzia no cabeçalho o código cadastrado 17154-0; o Factiss rejeitou esse identificador para o prestador autenticado, enquanto o CNPJ cadastrado da clínica é 22218474000147
- [x] Corrigir somente a regra de geração do identificador de prestador para Luminar, sem editar guias, lotes, valores ou registros financeiros existentes — criação, validação e reexportação do XML Luminar passam a usar CNPJ no cabeçalho de origem, contratado solicitante e contratado executante; guias, lotes e dados financeiros permanecem sem alteração
- [x] Criar regressão, validar o XML corrigido e publicar a atualização — regressões cobrem CNPJ no XML Luminar e os três fluxos de geração; TypeScript, suíte completa com 164 arquivos/539 testes e build aprovados

## Pré-faturamento em 2026-09-08 — lote vinculado à guia principal

- [x] Auditar o vínculo entre a guia principal e o lote TISS, incluindo os dados já disponíveis no Pré-faturamento — a guia já persiste loteId, enquanto a lista TISS já disponibiliza número, status, quantidade, valor total e data do lote; faltava apenas propagar essa relação à tela da guia
- [x] Exibir o número e o status do lote vinculado ao lado da guia principal e permitir abrir diretamente os dados do lote — o campo “Lote vinculado” aparece ao lado da guia principal e abre Faturamento TISS no lote correspondente, com destaque e resumo de número, status, guias, valor e data
- [x] Criar regressões, validar e publicar a navegação, sem alterar guias, lotes, valores ou dados financeiros existentes — regressões específicas aprovadas; TypeScript, suíte completa com 165 arquivos/541 testes e build de produção aprovados

## Pré-faturamento em 2026-09-08 — editar data e excluir assinatura

- [x] Auditar por que os botões de edição de data e exclusão de assinatura não executam a ação para o perfil atual — a tela normalizava o perfil antes de exibir os botões, mas a rota legada não normalizava o perfil no servidor; além disso, a exclusão dependia do diálogo nativo do navegador e a edição duplicava o modal com um campo compacto de difícil interação
- [x] Corrigir as ações de editar e excluir com confirmação explícita, sem alterar assinaturas, guias, valores ou dados financeiros automaticamente — servidor e tela usam a mesma permissão normalizada; editar abre somente o modal de data e excluir abre confirmação visível antes da mutação, preservando guias, valores e registros financeiros
- [x] Criar regressões, validar e publicar a correção dos controles de assinatura — regressões específicas aprovadas; TypeScript, suíte completa com 165 arquivos/543 testes e build de produção aprovados

## Guias SADT da Gleyce em 2026-09-08 — sessões misturadas com avaliação

- [x] Auditar cada guia, série, atendimento e procedimento de Gleyce Cavalcante de Santana em modo leitura — a guia de psicoterapia 8850003 possui a série `serie-1788041328243-w6fnhs`, enquanto a guia de avaliação 10740001 está vinculada ao atendimento 23820001 da série `serie-1788967381434-56pd51`, mas não persistia serieId na própria guia
- [x] Separar a avaliação neuropsicológica das sessões de psicoterapia nas guias e séries corretas, sem alterar assinaturas ou valores — o carregamento do Pré-faturamento passa a usar a série do atendimento vinculado quando a guia não tiver serieId; assim a guia de avaliação mostra apenas os quatro atendimentos de avaliação e a guia de psicoterapia mantém somente suas sessões
- [x] Criar regressões, validar e publicar a correção do isolamento de guias — nova regressão cobre a precedência da série persistida e a derivação pelo atendimento; TypeScript, suíte completa com 166 arquivos/546 testes e build de produção aprovados

## Links de assinatura da Dra. Jéssica Maia em 2026-09-10

- [x] Auditar os atendimentos, guias, telefones e elegibilidade de assinatura da agenda de 10/09 — 14 atendimentos ativos encontrados; 13 possuem guia, telefone e janela válida, e Ricardo Ramos Gonçalves de Castro às 13:30 já estava assinado
- [x] Preparar somente os links seguros e válidos, sem enviar mensagens externas — 13 links foram preparados com expiração uma hora antes de cada atendimento; a conferência confirmou token pendente e `whatsappEnviado=0` em todos eles
- [x] Conferir a preparação e apresentar a lista de pacientes, elegibilidades e pendências — os 13 links estão vinculados à guia e ao atendimento de 10/09; nenhum foi marcado como enviado e Ricardo Ramos Gonçalves de Castro foi mantido fora da preparação porque já possui assinatura concluída

## Envio autorizado de links da Dra. Jéssica Maia em 2026-09-10

- [x] Revalidar os 13 links preparados, horários de expiração e o escopo da autorização antes do envio — 14 atendimentos ativos confirmados, 13 tokens pendentes com expiração definida e WhatsApp ainda não enviado; Ricardo permaneceu fora por já estar assinado
- [x] Executar a mensagem aprovada somente aos 13 pacientes elegíveis e manter Ricardo fora por já possuir assinatura — a rotina tentou os 13 destinatários autorizados; Ricardo permaneceu fora por já possuir assinatura
- [x] Conferir o retorno real de cada entrega e comunicar quaisquer falhas sem marcar envio indevidamente — os 13 retornaram `TypeError: fetch failed`; teste direto de conectividade retornou HTTP 000/empty reply; nenhuma mensagem foi marcada como enviada e os links permanecem pendentes

## Agenda e Prontuário do Dr. Berg em 2026-09-08 — assinaturas não reconhecidas

- [x] Auditar os atendimentos de 08/09, guias, séries, assinaturas e o bloqueio de prontuário do Dr. Berg em modo leitura — foram confirmados comprovantes legados válidos na própria data, paciente, profissional e convênio para Leonardo, Francisca, Maria Fernanda, Eliege, Carine e Wagner, apesar de seus atendimentos não terem guiaId; João Paulo possui dois links pendentes sem comprovante, preservados como pendência
- [x] Corrigir somente o reconhecimento do status de assinatura e a permissão de abertura do prontuário por atendimento, sem alterar guias, provas digitais, valores, pagamentos ou repasses — a reconciliação agora reconhece comprovante legado órfão apenas quando houver uma única sessão sem guia no mesmo contexto e data, inclusive se a guia guardar somente um atendimento histórico diferente; contextos ambíguos seguem bloqueados para impedir mistura de guias
- [x] Criar regressões, validar e publicar a correção — regressões específicas, TypeScript, suíte completa com 166 arquivos/549 testes e build de produção aprovados; auditoria do contrato confirmou Agenda e Prontuário liberados para os atendimentos com comprovante válido

## Agenda e Prontuário em setembro de 2026 — assinaturas válidas não reconhecidas

- [x] Auditar todos os atendimentos de setembro que têm comprovante digital válido, mas não retornam como assinados na Agenda ou para a liberação do Prontuário — auditoria determinística dos 16 profissionais encontrou 11 atendimentos com comprovante legado válido e vínculo seguro: 5 do Dr. Berg em 08/09, 4 da Dra. Jéssica em 14/09 e 2 da Dra. Teresa em 09/09; não houve outros casos seguros em setembro
- [x] Corrigir somente o reconhecimento seguro desses comprovantes por atendimento, sem modificar guias, assinaturas, valores, pagamentos ou repasses — a regra compartilhada agora reconhece somente comprovante sem guia direta quando há data, paciente, profissional e convênio idênticos, uma única sessão candidata e ausência de divergência entre séries explícitas; os 11 retornam assinados e com Prontuário liberado
- [x] Criar regressões, validar os resultados em lote e publicar a correção global — regressões cobrem sessão única, guia histórica, ambiguidade e divergência de série; auditoria do contrato confirmou os 11 atendimentos como assinados e liberados; TypeScript, suíte completa com 166 arquivos/550 testes e build aprovados

## Guia SADT em 2026-09-10 — diluição de valor de pacote por sessão

- [x] Auditar a série de avaliação indicada, as sessões vinculadas e a origem do valor unitário repetido na guia SADT — a série exibida contém sete sessões de avaliação neuropsicológica Proasa Saúde, com preço global de R$ 1.800,00; a tela reutilizava R$ 1.800,00 como valor unitário em todas as linhas
- [x] Corrigir somente o cálculo de apresentação do valor unitário e total por sessão, preservando a soma do pacote, guias, faturamento e baixas existentes — a guia SADT passa a dividir o valor global entre as sessões das avaliações neuropsicológicas de Proasa Saúde, Proasa Pará, Petrobras AMS e Postal Saúde; o rateio usa centavos e mantém a soma exata do pacote (em sete sessões: R$ 257,15 nas duas primeiras e R$ 257,14 nas cinco seguintes)
- [x] Criar regressões, validar o XML/PDF e publicar a correção de diluição — regressões cobrem rateio em centavos e aplicação da regra na guia SADT; TypeScript, suíte completa com 166 arquivos/552 testes e build aprovados

## Guia SADT em 2026-09-10 — falha ao salvar edição

- [x] Auditar o formulário, as validações e a mutação de atualização da guia SADT sem modificar registros existentes — o servidor registrou uma atualização concluída da guia 4980032, mas a persistência ainda convertia datas de calendário diretamente com `new Date`, o que podia bloquear algumas guias; o botão não expunha estado de salvamento nem prevenia duplo clique
- [x] Corrigir a causa do salvamento bloqueado com regressão de edição — todas as datas de autorização, validade da senha e validade da carteira passam por normalização DD/MM/AAAA ou AAAA-MM-DD com horário seguro; data inválida retorna mensagem específica antes da escrita; o botão exibe “Salvando...” e fica protegido contra clique duplicado
- [x] Validar e publicar a correção sem alterar guias, assinaturas, lotes ou registros financeiros já gravados — regressões específicas aprovadas; TypeScript, suíte completa com 167 arquivos/554 testes e build de produção aprovados

## Publicação em 2026-09-10 — módulo de login desatualizado

- [x] Auditar a falha `Failed to fetch dynamically imported module` observada no domínio após a publicação do salvamento SADT — a referência antiga `Login-DZ3r2Aqz.js` retornava HTML em vez de JavaScript durante a propagação; o pacote atual passou a referenciar `Login-7rbXuSev.js`, confirmado com conteúdo JavaScript e carregamento normal
- [x] Implementar recuperação única e segura de módulos antigos, sem perder alterações do formulário nem criar recarregamento em ciclo — a tela de erro reconhece falhas de import dinâmico e mostra “Atualizar versão”; a atualização é manual, acrescenta uma marca de cache à URL e não recarrega automaticamente nem entra em ciclo
- [x] Criar regressões, validar no domínio e publicar a recuperação — regressões específicas aprovadas, TypeScript aprovado, suíte completa e build concluídos; o domínio carregou novamente a tela de login com o módulo atual

## Guia SADT em 2026-09-10 — falha persistente ao salvar

- [x] Capturar o erro real retornado ao salvar uma guia SADT no domínio publicado e reproduzir sem sobrescrever registros — a guia 1980002 concluiu a escrita às 03:04:33, incluindo a substituição dos três procedimentos e a atualização do espelho; a falha ocorria depois da gravação, durante a invalidação/refetch da interface, que era devolvida como “Erro ao salvar”
- [x] Corrigir a causa específica de persistência, sem alterar guias, assinaturas, lotes, valores ou registros financeiros já existentes — a confirmação de salvamento passa a fechar a guia logo após o retorno bem-sucedido da mutação; a atualização de consultas ocorre em segundo plano e uma eventual oscilação só é registrada no console, sem falsamente cancelar a gravação
- [ ] Validar o salvamento real e publicar a correção

## XML GEAP em 2026-09-10 — rejeições de validação TISS

- [x] Auditar a geração do número do lote e do hash do arquivo `TISS_LOTE-202609-59295_2026-09-10.xml` — o lote GEAP 630001 foi emitido com `LOTE-202609-59295` (17 caracteres), embora o campo TISS aceite até 12; o arquivo declarado como ISO-8859-1 era baixado como UTF-8, causando divergência de hash no Factiss
- [x] Corrigir a emissão GEAP para respeitar o limite de 12 caracteres do número do lote e calcular o hash sobre o XML final — criação, validação e reexportação do GEAP passam a normalizar o lote para `202609-59295` e declarar UTF-8, a mesma codificação dos bytes que alimentam o MD5 do epílogo
- [x] Criar regressões, validar o XML e publicar sem alterar guias, lotes ou financeiro existentes — regressões cobrem a regra GEAP, o lote de 12 caracteres e a conferência do hash no arquivo UTF-8; testes específicos, TypeScript, suíte completa e build aprovados

## Dra. Angela — Bradesco em agosto de 2026 — séries, assinaturas e guias órfãs

- [x] Auditar em leitura os atendimentos, guias, séries e assinaturas Bradesco da Dra. Angela, limitados a agosto — há dois casos sem série/guia integralmente coerentes: Hemely tem quatro atendimentos (05, 12, 19 e 26/08) sem guia direta, enquanto a guia 240116 tem quatro procedimentos, sete assinaturas legadas e quatro assinaturas SADT, mas datas de procedimento/assinatura que não coincidem integralmente; Gustavo tem quatro atendimentos com três séries distintas e guias que misturam psicoterapia e avaliação, portanto não pode ser reunido automaticamente
- [x] Apresentar a relação de séries a criar, assinaturas a vincular com segurança e guias órfãs candidatas à exclusão — a clínica confirmou a abrangência da Hemely, a remoção das avaliações do Gustavo, a exclusão de Daniele e o procedimento 50000470 para Silvana
- [x] Após confirmação específica, criar as séries, vincular somente assinaturas de agosto e excluir as guias órfãs aprovadas — Hemely e Gustavo foram organizados em séries próprias de quatro sessões; as duas linhas de avaliação do Gustavo foram removidas; a assinatura SADT de 12/08 foi vinculada à guia correta; os rascunhos vazios de Gustavo e a guia órfã 4470002 de Daniele foram excluídos sob autorização
- [x] Validar e publicar a conciliação sem alterar outros meses, profissionais, convênios, valores, pagamentos ou repasses — validação confirmou oito atendimentos nas séries corretas, quatro linhas 50000470 em Gustavo, guia da Silvana com 50000470 e assinaturas preservadas; as guias excluídas não deixaram vínculo remanescente

## Dra. Angela — confirmações em 2026-09-11

- [x] Revalidar as alterações autorizadas: guia 240116 da Hemely para 05, 12, 19 e 26/08; remoção das linhas de avaliação de Gustavo; exclusão da guia órfã 4470002 de Daniele; e guia de Silvana com procedimento 50000470 e assinaturas de agosto
- [x] Aplicar exclusivamente os vínculos, as remoções e a atualização de procedimento autorizados, mantendo evidências e vínculos fora do escopo intactos
- [x] Validar as séries, guias, assinaturas e inexistência de vínculos remanescentes da guia excluída; publicar a conciliação

## Yago Brito de Almeida — assinatura de guia informada

- [x] Auditar em leitura os atendimentos, guias e comprovantes de assinatura do paciente para identificar a sessão correta — encerrado sem alteração porque a clínica corrigiu o nome do paciente antes da auditoria
- [x] Corrigir somente o vínculo ou o reconhecimento de assinatura necessário na Agenda e no Prontuário — não aplicável ao Yago após a correção do nome
- [x] Validar e publicar a correção sem modificar outras guias, assinaturas, valores, pagamentos ou repasses — não aplicável ao Yago após a correção do nome

## Yago Brito de Almeida — novo pedido de vínculo de assinatura

- [x] Auditar em leitura os atendimentos, guias, séries e comprovantes do paciente para identificar a sessão correta — guia BRD0001830039, profissional 570005, convênio 600002 e comprovante 20700001 confirmaram as sessões de 01, 08, 22 e 29/08
- [x] Aplicar somente o vínculo de assinatura verificável na guia e no atendimento correspondentes — atendimentos 1830039, 1830389 e 1831280 foram vinculados à guia 1740039 e à série correspondente; a sessão de 22/08 já estava correta
- [x] Validar e publicar sem modificar outras guias, assinaturas, valores, pagamentos ou repasses — leitura pós-vínculo confirmou as quatro datas na mesma guia e no comprovante 20700001; TypeScript, suíte de regressão e build aprovados

## Yago Brito de Almeida — vínculos de setembro

- [x] Auditar em leitura os atendimentos, guias, séries e comprovantes exclusivamente de setembro — a guia emitida BSET26780210 (2070017), profissional 570005 e convênio 600002 contém prova concluída de 05/09; o link de 12/09 permanece pendente, válido e sem imagem/hash; 19 e 26/09 ainda não possuem comprovante
- [x] Vincular somente as datas de setembro comprovadas na guia e série correspondentes — os atendimentos de 05, 12, 19 e 26/09 foram realinhados à guia BSET26780210 e à série tony-set-780210; somente 05/09 conserva estado assinado, enquanto 12/09 continua pendente e 19/26 permanecem sem comprovante
- [x] Validar e publicar sem misturar competências, profissionais ou alterar valores, pagamentos e repasses — leitura pós-vínculo confirmou 05/09 assinado, 12/09 com link válido pendente e 19/26 sem prova; os quatro registros possuem auditoria, nenhum possui repasse e as regressões específicas, TypeScript, suíte completa e build foram aprovados

## Yago Brito de Almeida — assinatura de hoje, 12/09

- [x] Auditar em leitura a assinatura concluída de 12/09 e confirmar paciente, profissional, convênio, guia e série — o atendimento 25200001 está corretamente na guia BSET26780210/série tony-set-780210, mas os dois registros de 12/09 (29190001 e 30120001) continuam sem imagem e sem hash; não existe notificação de conclusão hoje
- [ ] Aplicar somente o vínculo necessário para o atendimento correto de 12/09
- [ ] Validar Agenda e Prontuário e publicar sem copiar assinatura de outra data nem alterar valores, pagamentos ou repasses

## Tony — pendências de assinatura ausentes em 14/09

- [x] Auditar todos os atendimentos do profissional Tony em 14/09, com suas guias, séries, convênios e comprovantes — 10 sessões foram verificadas; Liege, Cristhian e João Vitor já aparecem assinados, João Victor Regis e Handiery já aparecem pendentes, enquanto Maria Rita, Márcio, Renato, Edfram e Rebeca ficaram sem estado por falta de guiaId direto ou divergência de serieId
- [x] Corrigir a origem da pendência ausente somente para sessões sem assinatura concluída — Maria Rita, Márcio e Renato foram vinculados às próprias guias assinadas; Edfram foi vinculado à própria guia com token pendente; Rebeca foi vinculada à própria guia, mas permanece corretamente sem pendência digital porque Proasa utiliza assinatura em guia física; Handiery deixou de constar em 14/09 por alteração concorrente e não foi modificada
- [x] Validar a Agenda e publicar sem modificar assinaturas existentes, valores, pagamentos ou repasses — a consulta real da Agenda confirmou seis sessões assinadas, duas pendentes e uma sessão Proasa com assinatura em guia física entre os nove atendimentos que permanecem em 14/09; os cinco vínculos corrigidos possuem auditoria, não possuem repasses e as regressões específicas, TypeScript, suíte completa e build foram aprovados

## Wescley Silva e Silva e Handiery da Silva — estado de assinatura ausente

- [x] Auditar em leitura os atendimentos de setembro, guias, séries, profissionais, convênios e comprovantes dos dois pacientes — Wescley está assinado em 03 e 10/09, mas 17 e 24/09 ficaram sem guiaId; Handiery está pendente em 07/09, enquanto o atendimento antes em 14/09 foi reagendado para 18/09 e, junto com 21 e 28/09, ficou sem guiaId; todos pertencem ao Tony e têm contexto único por data
- [x] Corrigir somente os vínculos necessários para exibir pendência ou guia assinada conforme o estado real — a série de Wescley em 10, 17 e 24/09 foi associada à guia 11040001, preservando 10/09 assinado e tornando 17/24 pendentes; a série de Handiery em 07, 18, 21 e 28/09 foi associada à guia 10950003 do mesmo convênio, mantendo todas pendentes e sem reutilizar a guia 2070014 de outro cadastro de convênio
- [x] Validar Agenda e Prontuário e publicar sem criar ou copiar assinaturas nem alterar valores, pagamentos ou repasses — a consulta real confirmou Wescley assinado em 03/09 e 10/09 e pendente em 17/09 e 24/09; Handiery ficou pendente em 07/09, 18/09, 21/09 e 28/09; todos os novos vínculos e as duas séries possuem auditoria, não há repasses nos atendimentos e as regressões específicas, TypeScript, suíte completa e build foram aprovados

## Pré-faturamento SADT — exclusão individual de assinatura sem travamento

- [ ] Reproduzir e diagnosticar o travamento do botão de excluir sem apagar assinaturas reais durante os testes
- [ ] Corrigir a exclusão individual com confirmação, retorno visível e recuperação da interface em sucesso ou erro
- [ ] Validar que nenhuma exclusão ocorre automaticamente e que somente a assinatura escolhida é removida
- [ ] Executar regressões, TypeScript, suíte completa e build e publicar a correção

## Ayla Maria Siqueira — assinaturas de setembro não aparecem

- [x] Auditar em leitura os atendimentos, guias, séries, profissionais e comprovantes de setembro — as seis assinaturas das duas séries do Dr. Jairo em 01, 08 e 11/09 já são reconhecidas; duas provas concluídas de 12/09 pertencem à guia 11760008 da Ozilene, mas a guia sem serieId e dois atendimentos da mesma profissional/data deixaram o vínculo ambíguo
- [x] Corrigir somente os vínculos de assinatura comprovados para as datas e guias correspondentes — a guia 11760008 foi vinculada à série das 14:00 da Ozilene e seus quatro atendimentos de setembro receberam o mesmo guiaId/serieId; a regra real do Prontuário passou a reconhecer 12/09 como assinado sem liberar a série das 13:30 nem as datas sem prova
- [x] Validar Agenda e Prontuário e publicar sem alterar valores, pagamentos ou repasses — o fluxo real confirmou sete sessões assinadas em setembro: seis do Dr. Jairo em 01, 08 e 11/09 e a sessão da Ozilene em 12/09 às 14:00; nenhuma sessão da série paralela das 13:30 foi liberada e não há repasses vinculados; regressões específicas, TypeScript, suíte completa e build foram aprovados

## José Claudemir Rocha Francisco Junior — assinatura de guia informada

- [x] Auditar em leitura os atendimentos, guias e comprovantes de assinatura do paciente para identificar a sessão correta — a guia 1740041 possui comprovante legado para 01, 08, 15, 22 e 29/08, enquanto os três primeiros atendimentos não tinham vínculo direto; 22 e 29 já pertenciam à mesma série
- [x] Corrigir somente o vínculo ou o reconhecimento de assinatura necessário na Agenda e no Prontuário — os atendimentos de 01, 08 e 15/08 foram vinculados à guia 1740041 e à série existente; os comprovantes digitais e legados foram preservados e a operação foi auditada
- [x] Validar e publicar a correção sem modificar outras guias, assinaturas, valores, pagamentos ou repasses — a validação confirmou os três atendimentos na guia/série correta e comprovante legado na data correspondente

## José Claudemir Rocha Francisco Junior — setembro

- [x] Auditar em leitura os atendimentos, guias, séries e comprovantes de assinatura de setembro — o atendimento realizado em 05/09 não tinha guia direta, enquanto a guia 2070003 da mesma série possui comprovante legado exatamente nessa data; as sessões futuras de 12, 19 e 26/09 já pertenciam à guia e à série
- [x] Corrigir somente os vínculos seguros necessários para assinatura reconhecida e abertura do Prontuário — o atendimento de 05/09 foi vinculado à guia 2070003 e à série `tony-set-780219`, preservando guias e comprovantes existentes
- [x] Validar e publicar a correção sem modificar outros meses, guias, assinaturas, valores, pagamentos ou repasses — validação confirmou guia, série, comprovante na data e auditoria da ação

## Edição de procedimento SADT — preservação de série e assinaturas

- [x] Auditar o fluxo que altera procedimento e identifica por que ele cria série nova ou perde vínculos existentes — a mutação de atualização de atendimento gerava uma nova série e limpava `guiaId` em qualquer troca de procedimento
- [x] Preservar guia, série e assinaturas ao trocar somente o procedimento da sessão ou da guia — a troca agora atualiza apenas o procedimento e mantém os vínculos existentes; o histórico registra explicitamente a preservação de série, guia e assinaturas
- [x] Criar regressões, validar e publicar a edição segura de procedimento — testes específicos, TypeScript, suíte completa e build aprovados

## Assinaturas SADT — exclusão e duplicação controlada

- [x] Auditar por que a exclusão de assinatura ainda falha e confirmar permissões, identificadores e dependências — a remoção da cópia legada não removia a assinatura SADT correspondente, que reaparecia após a atualização da tela
- [x] Restaurar a exclusão confirmada e incluir duplicação com seleção de data, contexto seguro e trilha de auditoria — exclusão agora remove a origem SADT e a cópia legada da mesma guia/data; duplicação exige confirmação, data de atendimento da mesma série e impede repetir uma data já assinada
- [x] Criar regressões, validar e publicar os controles de assinatura — testes específicos, TypeScript, suíte completa e build aprovados

## Evellyn Cristina Silva Souza — assinaturas de agosto

- [x] Auditar atendimentos, guias, séries e comprovantes de agosto — a guia 6030009 reúne as quatro sessões de 05, 12, 19 e 26/08 na mesma série Bradesco/Dra. Angela; há comprovantes legados em guias históricas para 12, 19 e 26/08, mas não há evidência correspondente para 05/08
- [x] Corrigir somente vínculos de assinatura verificados para as sessões corretas — os comprovantes de 12, 19 e 26/08 foram copiados para a guia 6030009, mantendo as origens históricas intactas
- [x] Validar e publicar o reconhecimento das assinaturas de agosto — o contrato da Agenda retornou as quatro sessões como assinadas, sem pendência, na guia e série corretas
- [x] Aplicar a duplicação administrativa autorizada para 05/08 usando um comprovante da mesma guia/série e registrar a ação em auditoria — cópia de 05/08 criada a partir do comprovante de 12/08, com hash próprio e registro `VINCULAR_E_DUPLICAR_ASSINATURA`

## Exclusão de assinaturas no Pré-faturamento — falha persistente

- [x] Capturar o retorno real da mutação de exclusão e identificar o ponto que bloqueia a operação — o diálogo era fechado imediatamente pelo `AlertDialogAction`, antes de a mutação responder, ocultando erros e passando a impressão de que a exclusão não funcionava
- [x] Corrigir a exclusão confirmada sem remover assinaturas automaticamente — a confirmação agora aguarda `mutateAsync`, permanece aberta durante a operação ou em caso de erro e fecha somente após a exclusão retornar sucesso
- [x] Criar regressão, validar e publicar o controle funcional — regressões específicas, TypeScript, suíte completa e build aprovados

## Exclusão de assinaturas no Pré-faturamento — captura de erro persistente

- [x] Registrar no servidor o contexto e o retorno de cada solicitação de exclusão confirmada — a rota legada agora registra solicitação, sucesso ou recusa com IDs técnicos, sem expor dados clínicos
- [x] Exibir ao usuário o motivo acionável caso a exclusão seja recusada — o diálogo mantém aberto o motivo retornado pelo servidor, além do aviso na tela
- [x] Corrigir o bloqueio identificado, validar uma exclusão confirmada e publicar — a exclusão SADT deixou de usar importação dinâmica pendente; a rota estática, tipos, regressões, suíte completa e build foram validados

## Exclusão de assinaturas no Pré-faturamento — travamento pendente

- [x] Auditar a transação e o retorno que deixam a exclusão em estado pendente — a rota SADT carregava a operação por importação dinâmica durante a confirmação, criando risco de ciclo de módulo e requisição sem resposta
- [x] Substituir a operação bloqueada por uma exclusão com resposta controlada — a rota agora usa importação estática, aguarda a exclusão diretamente e registra sucesso ou recusa com retorno acionável
- [x] Validar e publicar a exclusão sem travamento — regressões específicas, TypeScript, suíte completa e build aprovados

## Exclusão de assinaturas no Pré-faturamento — ação direta com recuperação

- [x] Substituir o fluxo de confirmação que permanece pendente por uma ação direta com tempo máximo de resposta — a remoção foi convertida para consultas sequenciais, sem transação aberta, e o cliente aguarda a ação em executor único
- [x] Manter a confirmação individual e liberar a tela, com aviso, se o servidor não responder — após 12 segundos o diálogo mostra o aviso, o botão é liberado e o registro permanece preservado até o servidor confirmar a operação
- [x] Validar e publicar a exclusão direta de uma única assinatura — regressões específicas, TypeScript, suíte completa com 172 arquivos/569 testes e build aprovados

## Exclusão de assinaturas no Pré-faturamento — isolamento da requisição e recuperação final

- [x] Diagnosticar o travamento persistente e confirmar que as mutações de exclusão ainda podiam ser agrupadas com consultas administrativas; nenhuma assinatura real foi excluída durante o diagnóstico
- [x] Separar `assinaturasGuias.excluirAssinatura` e `assinaturas.excluirAssinatura` do lote tRPC comum e estabilizar a entrada da consulta de assinaturas por guia
- [x] Garantir recuperação da interface em erro, timeout ou exceção local, com mensagem acionável, registo no console e preservação da confirmação individual
- [x] Validar regressões específicas e `pnpm check`; 4 ficheiros de teste e 7 testes passaram
- [x] Executar suíte completa e build, salvar checkpoint e confirmar a versão publicada no domínio — suíte completa e build concluídos com sucesso; versão `6c8ed379` confirmada em `mifature.click`


## XML Bradesco — numeroLote acima do limite TISS

- [x] Localizar a geração, validação e reexportação do campo `numeroLote` no XML Bradesco — os três fluxos passam por `convenioExigeNumeroLoteTissA12` antes da emissão
- [x] Normalizar o lote para no máximo 12 caracteres, preservando rastreabilidade e sem alterar dados da guia — Bradesco Saúde agora remove o prefixo visual e conserva os 12 caracteres finais no XML e no hash
- [x] Criar regressões para criação, validação e reexportação do XML Bradesco — regressão do convênio e 43 testes XML/TISS aprovados
- [x] Executar TypeScript, testes e build, salvar checkpoint e confirmar o XML publicado — TypeScript, testes direcionados e build concluídos; versão `b35c7ba8` confirmada em `mifature.click`


## Exclusão controlada de paciente e convênio de teste

- [x] Identificar os cadastros exatos de paciente teste e convênio teste, sem incluir registros reais — 8 pacientes com nome exato e 68 convênios com nome exato
- [x] Auditar guias, atendimentos, assinaturas, prontuários, pagamentos e demais dependências dos cadastros identificados — 24 atendimentos, zero guias, zero assinaturas, zero prontuários e zero autorizações; convênios sem dependências operacionais
- [x] Confirmar o escopo exato da exclusão com a clínica antes de executar operação irreversível — confirmação recebida para os 8 pacientes, 24 atendimentos e 68 convênios
- [x] Excluir somente os registros de teste autorizados e registrar auditoria da operação — exclusão transacional concluída e três eventos registrados na tabela `auditoria`
- [x] Validar a integridade dos dados remanescentes, executar testes, salvar checkpoint e confirmar publicação — validação retornou zero cadastros, atendimentos, guias e assinaturas de teste; versão `7c721397` publicada


## Faturamento TISS — filtro e detalhe de lotes gerados

- [x] Mapear a consulta atual de lotes e a relação lote-guia-convênio — lotes usam `convenioId` e guias usam `loteId`
- [x] Disponibilizar os dados das guias enviadas ao abrir um lote — procedure protegida `faturamentoTISS.getLoteComGuias` com paciente, data, procedimento, valor e status
- [x] Implementar filtro por convênio na aba Lotes Gerados — seletor de operadora com opção Todos os convênios
- [x] Implementar abertura detalhada do lote com resumo e lista de guias — expansão inline acessível por lote
- [x] Criar regressões, validar no navegador, salvar checkpoint e confirmar publicação — suíte completa com 173 arquivos e 572 testes aprovados, TypeScript e build aprovados; checkpoint pendente


## Correção do erro ao salvar o Pré-faturamento — guia 1740063

- [x] Reproduzir e localizar a causa da falha de inserção em `guiaProcedimentos` — o quarto `sequencial` vinha do id visual `Date.now()` (`1789248487143`), excedendo o tipo `INT`
- [x] Corrigir o salvamento dos quatro procedimentos sem duplicar registros nem alterar dados financeiros — cliente e servidor agora gravam `sequencial` ordinal `1..N`
- [x] Criar regressão para o salvamento idempotente do Pré-faturamento — regressões do sequencial e das datas aprovadas
- [x] Executar TypeScript, testes e build; validar a guia 1740063 e publicar a correção — 3 testes direcionados, suíte completa, TypeScript e build aprovados; guia validada sem procedimentos parciais; checkpoint pendente

## Arleanny Ingredy Monteiro Freitas — quatro sessões e quatro assinaturas

- [x] Auditar as quatro sessões, guias, séries, profissionais, convênios e datas da paciente — quatro sessões de setembro na guia 8100001, profissional 570004 e convênio 600002
- [x] Confirmar em leitura as quatro provas digitais e seus vínculos atuais — quatro registros SADT com imagem e hash, inicialmente concentrados em 06/08 e 03/09
- [x] Corrigir somente vínculos individualmente comprovados, sem duplicar ou copiar assinaturas — quatro assinaturas realinhadas individualmente à guia 8100001
- [ ] Validar Agenda/Prontuário, executar testes, publicar e confirmar a versão — suíte completa com 174 arquivos e 574 testes, TypeScript aprovado; três casos ambíguos da Ozilene ainda aguardam identificação

## Arleanny e pacientes da Ozilene aos sábados — novo escopo

- [x] Aplicar a distribuição autorizada das três assinaturas de 06/08 nas sessões de 10, 17 e 24/09 de Arleanny, mantendo 03/09 na própria prova — quatro assinaturas SADT concluídas vinculadas à guia 8100001; imagens e hashes preservados
- [x] Identificar todos os pacientes da Ozilene atendidos aos sábados e mapear suas guias, séries, datas e assinaturas concluídas — 146 atendimentos auditados; 25 casos com prova divergente, 22 unívocos e 3 ambíguos
- [x] Corrigir apenas os vínculos comprovados dos pacientes da Ozilene, sem copiar provas entre datas ou pacientes — 22 atendimentos realinhados às próprias guias assinadas; 3 casos ambíguos preservados
- [ ] Validar Agenda/Prontuário, executar testes, publicar e confirmar a versão — suíte completa com 174 arquivos e 574 testes, TypeScript aprovado; três casos ambíguos da Ozilene ainda aguardam identificação

## Ozilene — assinaturas de agosto

- [x] Auditar os atendimentos de agosto, guias, séries e assinaturas da Ozilene — 96 atendimentos auditados; provas legadas conferidas por paciente, data, guia e profissional
- [x] Vincular somente os casos unívocos de agosto, sem alterar outros meses ou provas digitais — vínculos seguros aplicados; quatro pacientes permanecem ambíguos por terem prova na guia atual e em outra guia na mesma data
- [ ] Validar a Agenda/Prontuário de agosto e publicar a correção — validação encontrou 4 casos ambíguos: Nayra 01/08, Rita 01/08, Yanka 01/08 e Raymara 15/08; checkpoint final pendente

## Vinicius — assinatura de 01/08

- [x] Auditar o atendimento, guia, série, profissional, convênio e prova digital de 01/08 — atendimento 1830037; prova SADT 690313, guia 240273, mesma paciente, Ozilene, convênio e data
- [x] Vincular somente se a correspondência for unívoca, sem alterar imagem ou hash — atendimento 1830037 realinhado à guia 240273; imagem e hash preservados
- [ ] Validar Agenda/Prontuário e publicar a correção — validação de banco confirmou status assinado, imagem e hash; checkpoint pendente

## Agenda — pendências de prontuário por mês e profissional

- [x] Localizar a origem do contador atual e o mês selecionado na Agenda — alerta global em `Agenda.tsx` consultava todos os atendimentos sem filtros
- [x] Ajustar o contador para considerar somente atendimentos do profissional no mês selecionado — router e helper agora recebem `mesReferencia` e `profissionalIds`
- [x] Preservar a regra de atraso de 72 horas e evitar o total global de meses anteriores — continuam exigidos limite vencido, ausência de liberação e status agendado
- [x] Criar regressões, validar a Agenda, salvar checkpoint e confirmar publicação — regressão direcionada, TypeScript, suíte completa e build aprovados; checkpoint pendente


## Gutemberg — assinaturas de agosto e setembro

- [ ] Auditar todos os atendimentos de agosto e setembro do profissional Gutemberg
- [ ] Mapear pacientes, guias, séries e provas de assinatura concluídas ou pendentes
- [ ] Corrigir apenas vínculos unívocos, preservando imagens, hashes e dados financeiros
- [ ] Validar Agenda/Prontuário, executar testes, publicar e confirmar a versão

## Gilzemberg Teixeira — assinaturas de agosto e setembro

- [ ] Confirmar o cadastro exato do profissional e auditar todos os atendimentos de agosto e setembro
- [ ] Mapear pacientes, guias, séries e provas de assinatura concluídas ou pendentes
- [ ] Corrigir apenas vínculos unívocos, preservando imagens, hashes e dados financeiros
- [ ] Validar Agenda/Prontuário, executar testes, publicar e confirmar a versão

## Resultado — Gilzemberg Teixeira de Miranda

- [x] Cadastro confirmado: profissional `570016`, com auditoria dos meses 08/2026 e 09/2026.
- [x] Dez atendimentos com prova concluída, imagem e hash foram realinhados às guias assinadas correspondentes: nove em agosto e um em setembro.
- [x] Nenhum valor, pagamento, repasse, imagem ou hash foi alterado; dez eventos foram registrados na auditoria.
- [x] Validação pós-correção confirmou zero divergências restantes entre atendimento e guia assinada para os casos auditados; checkpoint pendente.

## Isabele — Dra. Silmara — assinaturas de agosto e setembro

- [ ] Confirmar o cadastro exato da paciente e da profissional
- [ ] Auditar atendimentos, guias, séries e provas de assinatura nos dois meses
- [ ] Corrigir apenas vínculos unívocos, preservando imagens, hashes e dados financeiros
- [ ] Validar Agenda/Prontuário, executar testes, publicar e confirmar a versão

## Isabelle Queiroz Liborio — consolidar somente agosto

- [x] Auditar as guias 3120003 e 4290001, atendimentos, assinaturas e dependências de agosto — 18/08 assinado na guia 3120003; 25/08 estava na guia rascunho 4290001; ambas da mesma paciente, profissional e convênio
- [x] Consolidar somente os atendimentos de agosto na guia correta, preservando a assinatura de 18/08 — atendimento de 25/08 realinhado à guia 3120003 e à série `s0826-f51957f1863219721f24f21f6a9a`; nenhum registro foi apagado
- [x] Confirmar que setembro não foi alterado — atendimentos de 01, 08, 15, 22 e 29/09 continuam na guia 7020003 e na série de setembro
- [x] Validar Agenda/Prontuário, publicar e confirmar a versão — leitura confirmou a assinatura concluída de 18/08 com imagem/hash e setembro intacto; versão `facf8d70` publicada

## Neyvana Lira Tanaka — assinatura sem estado

- [ ] Localizar o cadastro exato e os atendimentos da paciente
- [ ] Auditar guias, séries, profissionais, convênios e provas de assinatura
- [ ] Corrigir somente o vínculo ou estado comprovado, sem copiar assinaturas
- [ ] Validar Agenda/Prontuário, testar, publicar e confirmar a correção

## Neyvana Lira Tanaka — isolamento por competência

- [x] Manter assinaturas, guias e séries de agosto exclusivamente em agosto — quatro sessões de 13:30 foram vinculadas à guia 210070 da competência 08/2026
- [x] Manter assinaturas, guias e séries de setembro exclusivamente em setembro — três sessões de 13:00 foram vinculadas à guia 10140002 da competência 09/2026; nenhuma guia de agosto foi usada
- [x] Auditar e corrigir somente vínculos dentro da própria competência, sem misturar meses — 19/08 e 26/08 às 13:00 e sessões de 13:30 sem prova unívoca permaneceram sem alteração
- [x] Validar o isolamento mensal e publicar a correção, se houver vínculo seguro — imagem/hash das provas preservados e auditoria registrada; versão `c097961f` publicada

## Gilzemberg — atendimento do dia 26

- [x] Auditar separadamente 26/08 e 26/09, sem misturar competências — 15 atendimentos em 26/08; nenhum atendimento em 26/09
- [x] Localizar a guia, série e prova de assinatura correspondentes em cada mês — Alessandra em 26/08 tinha prova concluída na guia 570001; demais casos de 26/08 já estavam na guia assinada ou eram ambíguos
- [x] Corrigir somente vínculo unívoco e preservar imagem/hash — atendimento 8460003 vinculado à guia 570001; assinatura e dados financeiros preservados
- [x] Validar e publicar a correção — validação confirmou o vínculo e zero atendimentos em 26/09; versão `f68e0162` publicada

## Gilzemberg — continuação do dia 26/08

- [x] Reauditar os casos de 26/08 com prova em guia diferente ou sem guia — 15 atendimentos revistos; 1 caso unívoco corrigido e 6 casos com provas em outra guia também já presentes na guia atual; nenhum novo vínculo seguro identificado
- [x] Vincular apenas casos unívocos e preservar ambiguidades — nenhum novo vínculo seguro além de Alessandra; casos sem prova ou com múltiplas guias permaneceram intactos
- [x] Validar, publicar e confirmar a continuação — leitura confirmou a guia 570001 de Alessandra e nenhuma alteração em 26/09; versão `f1e95eda` publicada

## Nayara — atendimentos de 27/08

- [x] Identificar os pacientes e atendimentos de 27/08 da profissional Nayara — 13 atendimentos identificados
- [x] Auditar guias, séries, prontuários e provas de assinatura correspondentes — 13 prontuários realizados; 12 guias assinadas após a correção e José sem prova utilizável na guia atual
- [x] Vincular somente os casos unívocos, sem copiar ou misturar assinaturas — Raimundo refletido na guia 9450001 a partir da prova SADT 690798; nenhum vínculo criado para José
- [x] Validar Agenda/Prontuário e publicar a correção — leitura confirmou 12 de 13 guias assinadas; José aguarda prova/identificação específica

## Resultado — Nayara em 27/08

- [x] Auditar 13 atendimentos, prontuários, guias e assinaturas de Nayara em 27/08 — os 13 prontuários estão realizados; 11 guias já estavam assinadas, Raimundo tinha prova SADT concluída na própria guia e José permanece sem prova utilizável na guia atual
- [x] Corrigir somente o caso unívoco de Raimundo Alcimar Lucas Neto — a guia `9450001` passou a refletir a prova SADT `690798`, com imagem, hash e data preservados
- [x] Preservar o caso de José Sampaio Sobrinho — há uma referência legada em outra guia, mas sem correspondência segura na guia atual; nenhum vínculo foi criado
- [x] Salvar checkpoint e comunicar que 12 de 13 guias aparecem assinadas; solicitar prova ou confirmação específica para o caso restante — versão `6640d08a` publicada; José aguarda prova/identificação específica


## Nayara — atendimentos de 28/08

- [ ] Identificar os pacientes e atendimentos de 28/08 da profissional Nayara
- [ ] Auditar guias, séries, prontuários e provas de assinatura correspondentes
- [ ] Vincular somente os casos unívocos, sem copiar ou misturar assinaturas
- [ ] Validar Agenda/Prontuário, salvar checkpoint e comunicar o resultado


## Nayara — atendimentos de 28/08 — conclusão

- [x] Identificar os 15 atendimentos de 28/08 da profissional Nayara
- [x] Auditar guias, séries, prontuários e provas de assinatura: a assinatura concluída de Miguel Khriss estava na própria guia 9450003, mas o status da guia não a refletia; os dois registros cruzados de Vinicius já tinham ambas as guias marcadas como assinadas e foram preservados sem troca
- [x] Corrigir o caso comprovado: guia 9450003 de Miguel passou a refletir a prova 19650021, com paciente, profissional, data 28/08, imagem e hash confirmados; nenhum pagamento ou assinatura foi excluído
- [x] Validar Agenda/Prontuário em leitura: Miguel ficou com guia assinada e sem prova fora da guia; os casos de Vinicius permanecem isolados por guia, sem mistura
- [x] Publicar a conclusão da correção de Nayara em 28/08 após executar a validação automatizada da aplicação — 175 arquivos e 576 testes aprovados; TypeScript concluído sem erro


## Nayara — assinaturas dos dias 06, 13, 20 e 27/08

- [x] Auditar os atendimentos de Nayara em 06, 13, 20 e 27/08 — 50 atendimentos revisados; as pendências eram os quatro atendimentos de José Sampaio na série 9450002
- [x] Cruzar cada atendimento com sua guia, série, prontuário e prova de assinatura — quatro provas concluídas estavam órfãs na guia 2190003 e correspondiam, por data e contexto, à série 9450002
- [x] Aplicar apenas vínculos unívocos dentro da competência de agosto — provas 5130043, 12240002, 16020001 e 19050009 vinculadas às sessões de 06, 13, 20 e 27/08; imagens, hashes e datas preservados
- [x] Validar Agenda/Prontuário, executar regressão e publicar a correção — guia 9450002 assinada, quatro atendimentos reconhecidos, 175 arquivos e 576 testes aprovados; TypeScript sem erro


## Nayara — Dante, Marcelo e Marcus — assinaturas de agosto

- [x] Auditar os atendimentos de Dante Paolucci Sales, Marcelo Augusto de Lima Brasil e Marcus Vinicius Bezerra em agosto — 12 atendimentos revisados
- [x] Cruzar cada paciente com guias, séries e provas de assinatura da competência de agosto — Dante e Marcelo têm provas concluídas na própria guia para 06 e 20; Marcus tem prova de 13 em outra série/procedimento e não foi misturada
- [x] Aplicar somente vínculos unívocos, sem misturar guias ou competências — nenhuma nova alteração aplicada: 13/27 de Dante e Marcelo e 27 de Marcus não têm prova concluída unívoca; a prova de 13 de Marcus pertence a outra série
- [x] Validar Agenda/Prontuário, executar regressão e publicar a correção — validação confirmou os estados existentes; não houve alteração para publicar neste caso


## Duplicação autorizada — Dante, Marcelo e Marcus — agosto

- [x] Identificar prontuários concluídos e provas-fonte compatíveis por paciente, profissional, guia/série e data — Dante 13/27, Marcelo 13/27 e Marcus 27 tinham prontuário concluído e fonte compatível na própria guia/série
- [x] Duplicar somente as provas autorizadas, preservando imagem, hash e data da assinatura-fonte — cinco registros criados, sem copiar tokens
- [x] Registrar a duplicação na auditoria e validar o reconhecimento na Agenda/Prontuário — auditoria registrada; cinco atendimentos retornam assinatura concluída na guia e na data correta
- [x] Executar regressão e publicar a correção — 175 arquivos e 576 testes aprovados; TypeScript sem erro


## Marcus Vinicius e Pedro Kal — revisão de assinatura

- [x] Auditar a guia pendente de assinatura de Marcus Vinicius — 13/08 está na guia 240190, mas a única prova concluída encontrada está na guia 2190004, com outro procedimento e outra série; não foi misturada
- [x] Auditar o atendimento de Pedro Kal em 06/08 — a guia 240225 está marcada como assinada, porém a prova encontrada 4950001 não possui imagem/hash concluídos e o prontuário ainda não está feito
- [x] Corrigir somente vínculos comprovados, sem misturar pacientes ou séries — nenhuma alteração aplicada: não há prova concluída unívoca nem prontuário concluído para duplicação nesses dois casos
- [x] Validar Agenda/Prontuário, executar regressão e publicar — auditoria concluída sem alteração de dados; casos permanecem preservados para nova prova ou conclusão do prontuário


## Duplicação solicitada — Marcus Vinicius e Pedro Kal

- [x] Confirmar as datas solicitadas e as provas-fonte de Marcus Vinicius e Pedro Kal — Marcus possui fonte concluída compatível; Pedro só possui registro incompleto na guia 240225 e fontes concluídas em outra série/procedimento
- [x] Duplicar as assinaturas somente nas guias corretas, preservando os registros originais — Marcus foi duplicado para 13/08 na guia 240190; Pedro não foi alterado para evitar mistura de série
- [x] Validar Agenda/Prontuário, registrar auditoria e publicar — Marcus retorna assinatura concluída na guia 240190; Pedro permanece pendente por falta de prova concluída compatível


## Samara e Francisca — assinaturas de setembro

- [x] Auditar Samara da Silva Pereira em 04/09 e Francisca Lima em 08/09 — dois atendimentos revisados
- [x] Cruzar cada atendimento com sua guia, série, prontuário e prova de assinatura — Samara tinha fonte concluída na guia 2010001; Francisca tinha fonte concluída na guia 1320001 e guia de sessão emitida 10230002
- [x] Duplicar somente provas concluídas compatíveis, preservando os registros originais — Samara vinculada à guia 9360001; Francisca vinculada à guia 10230002 e atendimento 21330018 associado à guia correta
- [x] Validar Agenda/Prontuário, registrar auditoria, executar regressão e publicar — assinaturas 33030001 e 33030002 reconhecidas; 175 arquivos e 576 testes aprovados; TypeScript sem erro


## Falha de atualização — Samara 04/09 e Francisca 08/09

- [x] Reproduzir a divergência entre banco, Agenda e Prontuário — as assinaturas legadas existiam, mas os campos de comprovante da própria guia estavam desatualizados
- [x] Identificar se a tela consulta outra guia, série ou fonte de assinatura — a Agenda consulta o vínculo por guia/data e algumas telas também dependem de assinadoPaciente, dataAssinaturaPaciente e assinaturaPacienteUrl da guia
- [x] Corrigir o vínculo ou a lógica de reconhecimento sem duplicação indevida — sincronizados os campos das guias 9360001 e 10230002 com as provas 33030001 e 33030002; atendimento de Francisca permanece na guia correta
- [x] Validar no domínio principal, executar regressão e publicar — banco retorna ambos como assinados, 175 arquivos e 576 testes aprovados; TypeScript sem erro


## Solicitação em 2026-09-17 — exclusão de pacientes pelo master

- [x] Restringir a exclusão de pacientes ao perfil master no backend e na interface
- [x] Bloquear exclusão quando houver atendimentos, guias, prontuários, assinaturas, autorizações, pagamentos ou anexos vinculados
- [x] Registrar auditoria da exclusão efetiva e das tentativas bloqueadas
- [x] Validar com 577 testes, TypeScript sem erros e build de produção aprovado
- [ ] Publicar e validar no domínio principal — checkpoint f0c9ac11 salvo; aguardando a ação Publish do ambiente WebDev

## Solicitação em 2026-09-17 — Rayana de Souza Viana (01/09/2026)

- [x] Localizar a assinatura concluída correspondente à paciente e à data clínica
- [x] Vincular somente o atendimento de 01/09/2026 à guia 4980032, preservando as competências e séries
- [x] Confirmar a prova digital 31980003 com imagem e hash, sem duplicação
- [x] Registrar a mutação manual na tabela de auditoria

## Solicitação em 2026-09-17 — Adriana de Souza Viana (08/09/2026)

- [x] Confirmar a prova digital concluída do atendimento de 08/09
- [x] Realinhar a assinatura 26040001 da guia órfã 240007 para a guia correta de setembro 10080001
- [x] Vincular o atendimento 23010002 à guia 10080001, preservando imagem, hash e isolamento de séries
- [x] Registrar a mutação manual na auditoria 45960006

## Solicitação em 2026-09-17 — Ricardo de Souza Araújo (17/09/2026 às 13:40)

- [x] Identificar que o atendimento existia, mas estava cancelado
- [x] Reativar o atendimento 20250007 como agendado, preservando guia, série, profissional, convênio, data e horário
- [x] Registrar a correção na auditoria 46260001

## Reincidência em 2026-09-17 — Ricardo de Souza Araújo (17/09/2026 às 13:40)

- [x] Confirmar que o atendimento foi cancelado novamente após a primeira correção
- [x] Identificar na auditoria que o segundo cancelamento foi feito por Jéssica Santos (administrador), evento 46380001
- [x] Reativar novamente o atendimento 20250007 como agendado
- [x] Registrar a segunda correção na auditoria 46410001

## Solicitação em 2026-09-17 — cancelados visíveis na Agenda

- [x] Identificar o filtro que removia atendimentos cancelados da grade
- [x] Manter cancelados visíveis no dia e horário originais, preservando o histórico
- [x] Criar teste de regressão específico
- [x] Validar TypeScript e build de produção
- [x] Salvar checkpoint d704b143

## Solicitação em 2026-09-18 — repetição de senha no pré-faturamento Petrobras

- [x] Permitir repetição de senha de autorização em guias Petrobras
- [x] Permitir repetição do número de guia principal em guias Petrobras
- [x] Manter bloqueio de duplicidade para os demais convênios
- [x] Criar teste de regressão específico
- [x] Validar TypeScript e build de produção

## Solicitação em 2026-09-18 — erro ao agendar com resposta HTML

- [x] Identificar que o cliente tRPC tentava interpretar `index.html` como JSON
- [x] Repetir requisições tRPC que retornarem HTML antes do parsing
- [x] Substituir o erro técnico por mensagem operacional se a resposta HTML persistir
- [x] Criar teste de regressão
- [x] Validar TypeScript e build de produção

## Solicitação em 2026-09-18 — Erika Ayumi Inazawa Vasconcelos

- [x] Auditar as sessões e provas digitais de agosto e setembro sem misturar competências
- [x] Confirmar duas provas concluídas de setembro gravadas na primeira guia da série
- [x] Duplicar as provas de 12/09 e 19/09 para a guia correta 11700004, preservando as fontes
- [x] Sincronizar a guia 11700004 como assinada, com imagem, hash e data da prova de 19/09
- [x] Registrar a mutação na auditoria 48960006 e validar os vínculos finais

## Solicitação em 2026-09-18 — Ayla Maria Siqueira de Araujo

- [x] Auditar setembro separadamente de agosto
- [x] Identificar as provas concluídas de 12/09 e 19/09 gravadas na guia 11760008
- [x] Duplicar as provas para a guia correta 11790001 da sessão de 13:30
- [x] Sincronizar a guia 11790001 como assinada, preservando imagem, hash e fontes
- [x] Registrar a mutação na auditoria 48990001 e validar o estado final

## Solicitação em 2026-09-18 — Ayla / Jairo (18/09/2026)

- [x] Auditar as duas sessões de 18/09 sem misturar as séries das 19:00 e 19:30
- [x] Confirmar que a prova 34110002 estava na guia errada 4800028
- [x] Realinhar a prova 34110002 para a guia correta 4800029 da sessão das 19:30
- [x] Manter a prova 34110001 na guia 4800028 das 19:00
- [x] Sincronizar a guia 4800029 como assinada e registrar auditoria 49020001

## Reincidência em 2026-09-18 — Ayla / Jairo / guias exibidas na Agenda

- [x] Conferir a imagem e identificar que os cards exibiam as guias 7410001 e 7410002
- [x] Vincular a prova 34110001 à guia 7410001 da sessão das 19:00
- [x] Vincular a prova 34110002 à guia 7410002 da sessão das 19:30
- [x] Atualizar ambas as guias como emitidas e assinadas, preservando séries, imagens e hashes
- [x] Registrar a correção na auditoria 49050001 e validar os dados exibidos pela Agenda

## Solicitação em 2026-09-19 — erro ao salvar guia Petrobras / número editável

- [x] Identificar a colisão entre o número informado `42263120260609071182` e a guia existente 4500005
- [x] Permitir a alteração do número do prestador no campo interno editável `numeroGuiaInterno`
- [x] Preservar `guias.numeroGuia` como identificador técnico único para não quebrar vínculos
- [x] Adicionar teste de regressão para o salvamento sem colisão
- [x] Validar teste específico, TypeScript e build de produção
- [ ] Publicar no domínio principal após o checkpoint

## Solicitação em 2026-09-19 — André Teles de Abreu / agosto

- [x] Identificar que a guia informada 1356001 corresponde à guia 13560001 no banco
- [x] Confirmar os quatro atendimentos de agosto: 07, 14, 21 e 28/08 às 16:00
- [x] Vincular os quatro atendimentos à guia 13560001
- [x] Duplicar autorizadamente as provas concluídas para a guia, usando a quarta prova-fonte para 28/08
- [x] Marcar a guia como assinada e emitida, com quatro sessões e saldo zero
- [x] Preservar as provas-fonte e registrar a mutação na auditoria 50100001

## Solicitação em 2026-09-19 — duas unidades para atendimento de 1 hora

- [x] Alterar a regra compartilhada para contabilizar 2 unidades quando a duração for exatamente 60 minutos
- [x] Excluir Nayara, Jéssica e Vanessa da regra, mantendo 1 unidade mesmo em 1 hora
- [x] Aplicar a regra também na criação e edição de atendimentos e séries futuras
- [x] Atualizar registros existentes de 1 hora: 501 atendimentos gerais para 2 unidades e 34 exceções mantidas em 1 unidade
- [x] Registrar a mutação retroativa na auditoria 50190001
- [x] Validar 581 testes, TypeScript sem erros e build de produção aprovado

## Solicitação em 2026-09-19 — exceções adicionais de 1 hora

- [x] Incluir Loriene e Kátia nas exceções, mantendo 1 unidade em atendimentos de 60 minutos
- [x] Incluir avaliações neuropsicológicas do Jairo na exceção, mantendo as demais sessões de 1 hora do Jairo com 2 unidades
- [x] Aplicar o contexto do procedimento na criação, edição unitária e edição de séries futuras
- [x] Atualizar registros existentes: 107 atendimentos de Loriene/Kátia e 39 avaliações neuropsicológicas do Jairo
- [x] Registrar a atualização na auditoria 50220019
- [x] Validar 582 testes, TypeScript sem erros e build de produção aprovado

## Solicitação em 2026-09-19 — Átila (19/09) e Silmara (agosto)

- [x] Átila Santhiago Ramos da Silva: atendimento 27720001, em 19/09/2026 às 10:30, vinculado à guia assinada 13500001; prova digital 34050003 confirmada por paciente, profissional, convênio, procedimento, série e data.
- [x] Silmara: auditados os atendimentos da competência 08/2026, sem tocar em setembro.
- [x] Aplicados 12 vínculos unívocos para guias com prova digital concluída e procedimento compatível.
- [x] Sincronizados os campos da própria guia para provas concluídas já existentes na guia.
- [x] Preservados sem alteração 33 casos sem prova, 37 com procedimento divergente e 1 caso ambíguo.
- [x] Validação final: 102 atendimentos assinados e 93 pendentes por ausência de prova segura, sem mistura de pacientes, profissionais, séries ou competências.
- [x] Auditoria registrada: VINCULAR_GUIA_ASSINADA, VINCULAR_GUIAS_ASSINADAS_SILMARA_AGOSTO e SINCRONIZAR_CAMPOS_ASSINATURA_SILMARA_AGOSTO.

## Solicitação em 2026-09-20 — Ingrid Ferrag de Olivier(a) Pires

- [x] Identificar que a guia informada como 1365001 corresponde ao registro 13650001, número G1789933553946-S1.
- [x] Vincular as provas concluídas de 02/09, 09/09 e 16/09/2026 à guia 13650001, preservando as originais e sem copiar tokens.
- [x] Marcar a guia como assinada e sincronizar data/prova da assinatura.
- [x] Manter 23/09 e 30/09 pendentes, pois não há prova digital registrada para essas datas.
- [x] Registrar as ações DUPLICAR_ASSINATURAS_GUIA e SINCRONIZAR_STATUS_GUIA_ASSINADA na auditoria.
