# Validação da rota direta do painel Bradesco — 16/08/2026

## Evidência observada

Na sessão autenticada de Jéssica Santos, a abertura direta de `/autorizacoes-bradesco` no ambiente de desenvolvimento retornou visualmente o **Dashboard MIFATURE**, embora a URL tenha permanecido em `/autorizacoes-bradesco`.

## Impacto

O painel Bradesco pode estar acessível pela navegação interna, mas a rota direta não apresenta a tela esperada após recarga/navegação direta. Até a correção, a validação visual do contador de liberações deve ser tratada como parcial.

## Próximo passo

Inspecionar o roteamento de `App.tsx` e a navegação do layout para garantir que a rota direta renderize `AutorizacoesBradesco` e, então, repetir a validação autenticada sem reiniciar o servidor.
