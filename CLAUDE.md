# Caderneta — guia para quem vai mexer no código

Leia este arquivo inteiro antes de mudar qualquer coisa. Ao mudar arquitetura, formato de dados ou uma das decisões abaixo, atualize este arquivo no mesmo commit.

## O que é, e o que não pode mudar

- **Um app só (PWA)**, usado por mais de uma pessoa da mesma família. Cada pessoa entra com a própria conta Google e só enxerga os próprios dados. Nunca separar em dois apps, nem criar dados compartilhados entre contas.
- Os dados de cada pessoa ficam **no aparelho** (localStorage) **e no Google Drive dela**, com o escopo `drive.file` — o app só enxerga os arquivos que ele mesmo criou. Não existe servidor próprio.
- As mesmas funcionalidades para todas as contas.
- Interface, textos, commits e conversa em **português do Brasil**.

## Como trabalhar com o dono do projeto

- Ele escreve rápido, muitas vezes ditando, e as frases admitem mais de uma leitura. Antes de uma mudança grande — arquitetura, fluxo, qualquer coisa que ele vá notar — devolva o pedido numa frase simples e espere a confirmação. Detalhe pequeno: decida e siga.
- Ele prefere design sóbrio e profissional, e escolhe pelo argumento funcional: traga o porquê junto de cada proposta visual.
- Explique em linguagem simples. Ele não é programador.
- **Nunca peça senha, token ou chave secreta no chat.** Autorizações do GitHub e do Google são sempre feitas por ele, no navegador.
- Não coloque dados pessoais ou financeiros dele neste repositório: ele é público.

## Arquitetura

`index.html` é a fonte — tudo num arquivo, sem build. Edite direto. Ordem do `<script>`:

1. **Utilitários** — dinheiro em centavos (`fmt`, `toCents`), datas (`ymOf`, `ymShift`), `norm`/`deacc`.
2. **Padrões** — categorias de gasto (`CATS` + palavras-chave `KW`), de entrada (`ECATS` + `EKW`), contas (`ACCTS`), formas de pagamento (`CARDS`), `DEFAULTS()`.
3. **Conta, armazenamento e sincronização** — estado `S`, `loadLocal`/`saveLocal`/`touch`, `mergeData`, login (Google Identity Services), Drive (`gfetch`, `ensureFolder`, `writeJson`), `syncNow`, porta de entrada (`showGate`), cabeçalho (`renderSyncBadge`, `openAccount`), instalação, service worker, `boot`.
4. **Leitura da fala** — `parseOne`: números por extenso, parcelas, forma de pagamento, cartão (inclusive apelidos aprendidos), valor, "pra quem", descrição, categoria (`guessCat`: a palavra que aparece primeiro na frase manda). `splitUtterance` separa vários lançamentos por ponto final.
5. **Gravação e consultas** — `commit`, `removeTx`, `txOf`, `balanceOf`, `cardInvoice`, `cardOwed`, `monthStats`, `projectMonth`, `futureMonths`, `openPlans`, `buildInsights`.
6. **Gráficos SVG** — `chartBarsH`, `chartPace`, `chartCols`, `chartStack`, `bindTips`, `tableView`.
7. **Telas e fichas** — `render()` chama `renderPainel/Lancar/Mes/Contas/Futuro/Meta/Ajustes`; fichas com `sheet()`: `openTx`, `openManual`, `openAcct`, `openPay`, `openTransfer`, `openCard`, `openCat`, `openEcat`, `openFix`, `openKw`, `openRestore`, `openGoal`, `openDeposit`.
8. **Partida** — `boot()` no fim do arquivo.

Outros arquivos:
- `sw.js` — guarda o app (`APP`) para uso offline. Página com `cache: "no-cache"` e `config.js` com `"no-store"`: rede primeiro, cópia guardada se não houver internet. Ícones: cópia guardada primeiro. Fontes do Google: cache próprio. APIs do Google: nunca passam pelo cache.
- `config.js` — `googleClientId`. Vazio = app funciona só no aparelho, sem login.

## Formato dos dados (por conta)

- localStorage `caderneta:dados:<id>` → `{cfg, months, syncedAt, dirty}`. O id é `g:<sub do Google>` ou `l:<aleatório>` (conta só do aparelho). Contas conhecidas em `caderneta:contas`; a ativa em `caderneta:ativa`.
- `months["AAAA-MM"].tx[id]` → `{d, t, v, desc, cat, method, card, acct, acct2, k, plan, i, n, total, fix, ref, to, u}`
  - `v` em **centavos, inteiro**.
  - `k`: `g` gasto · `e` entrada · `p` pagamento de fatura · `t` transferência entre contas.
  - `u`: momento da última alteração (ms). Excluir = `{del:1, u}` (lápide). Nunca apague a chave: a lápide é o que faz a exclusão chegar aos outros aparelhos.
  - Compra parcelada: uma linha por mês com o mesmo `plan`, `i`/`n` e `total`. O dia do fechamento do cartão empurra a compra para a fatura seguinte.
  - Compra no crédito não sai da conta no dia; sai no pagamento da fatura (`k:"p"`, `ref` = mês da fatura).
- `cfg` — renda, teto, meta de saldo, contas (saldo inicial + acertos), cartões, categorias (com limite), categorias de entrada, gastos fixos, palavras aprendidas (`kwCat`, `kwCard`), meta de poupança; `cfg.u` = última alteração.
- **Junção entre aparelhos** (`mergeData`): lançamentos pela união por id; em conflito vence o `u` maior. O `cfg` inteiro vence pelo `u` maior. Toda escrita precisa passar por `commit`, `saveCfg` ou `saveMonth`, que atualizam `u` e agendam a sincronização.
- Campo novo: sempre com valor padrão em `DEFAULTS()`. Os dados antigos entram por `Object.assign(DEFAULTS(), cfg)`.
- Restaurar backup aceita `app` = `caderneta`, `caderneta-casa` ou `meu-caixa` (versões antigas) e **junta** com o que já existe.

## Google

- Projeto Google Cloud "Caderneta", na conta do dono. Cliente OAuth do tipo **Aplicativo da Web**, origem autorizada `https://rgbittencourt.github.io`, sem URIs de redirecionamento.
- Escopos: `openid email profile https://www.googleapis.com/auth/drive.file`. **Não adicione escopos amplos** (Drive inteiro, Gmail): eles obrigam a verificação do Google.
- Branding: página inicial `/caderneta/`, `privacidade.html`, `termos.html`, domínio autorizado `rgbittencourt.github.io`. **Sem logotipo** — com logotipo o Google exige verificação.
- `privacidade.html` e `termos.html`: não renomeie nem remova; mantenha o texto fiel ao que o app faz.
- Login pelo *token client* do Google Identity Services (janela pop-up). `requestAccessToken` precisa ser chamado direto do toque, senão o navegador bloqueia a janela. O token dura cerca de uma hora; depois o selo mostra *Sincronizar* e um toque renova.
- Drive: pasta `Caderneta` criada pelo app, com `caderneta-dados.json` (atual) e `backup-AAAA-MM.json` (uma cópia por mês).
- **Ainda não testado:** o login no iPhone com o app instalado na tela de início.

## Visual

- Paleta **ardósia e azul-aço**, com tokens para tema claro e escuro (bloco `:root`, depois `prefers-color-scheme` e `[data-theme]`). Acento `#2563A8` no claro, `#5B9BD5` no escuro.
- Categórica validada: azul → cobre → roxo (`--c1`, `--c2`, `--c3`). Azul e roxo ficam indistinguíveis sob deuteranopia se ficarem encostados: a ordem da pilha é fixa, com o cobre no meio.
- Gasto por categoria é magnitude: barras de uma cor só. Bom, atenção e ruim sempre acompanhados de rótulo.
- Fontes: IBM Plex Sans (interface) e IBM Plex Mono (valores).
- Celular: abas embaixo. A partir de 960px: menu lateral.

## Publicar

1. `git pull` antes de começar — o dono pode ter mexido a partir de outro computador.
2. Edite, teste localmente e faça o commit em português.
3. Se mudou algum arquivo guardado para uso offline (`index.html`, `sw.js`, `manifest.webmanifest`, ícones), suba `VERSAO` em `sw.js` (`caderneta-vN`). Os aparelhos mostram *Nova versão da Caderneta · Atualizar*.
4. `git push`. O GitHub Pages publica em um ou dois minutos. Nesse intervalo a CDN ainda pode entregar a versão anterior (cache de 10 minutos).

Primeira publicação num computador novo: o dono autoriza no navegador (Git Credential Manager no Windows; no Mac, `gh auth login` ou Git Credential Manager). Os commits usam o e-mail privado do GitHub (`…@users.noreply.github.com`) — configure com `git config user.email` no repositório.

## Testar

- O service worker só funciona em `localhost` ou HTTPS. Sirva a pasta do repositório:
  - Mac ou Linux: `python3 -m http.server 8765`
  - Windows: um servidor estático qualquer em `localhost`
- Roteiro mínimo:
  - duas contas *só neste aparelho*, com dados isolados entre elas;
  - lançar por fala (*Ver exemplo* na aba Lançar);
  - restaurar um backup antigo (`app: "caderneta-casa"`);
  - sincronização com `fetch` simulado para a API do Drive: dois "aparelhos" com lançamentos diferentes → o Drive tem que terminar com a união.
- O login real com o Google só funciona na origem autorizada. Para testar em `localhost`, é preciso incluir `http://localhost:8765` nas origens do cliente OAuth.

## Histórico

Começou como dois artifacts do Claude ("Caderneta da Casa" e "Meu Caixa"), por um erro de leitura do pedido: o dono queria um app só, com contas separadas. Os artifacts antigos servem apenas para exportar o backup e trazer os dados para cá.
