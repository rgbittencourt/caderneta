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
- Diagnóstico e sugestões do app são educativos (orçamento, dívidas, hábitos). Nada de recomendar investimento específico.

## Arquitetura

`index.html` é a fonte — tudo num arquivo, sem build. Edite direto. Ordem do `<script>`:

1. **Utilitários** — dinheiro em centavos (`fmt`, `toCents`), datas (`ymOf`, `ymShift`), `norm`/`deacc`.
2. **Padrões** — categorias de gasto (`CATS` + palavras-chave `KW`), de entrada (`ECATS` + `EKW`), contas (`ACCTS`), formas de pagamento (`CARDS`), `DEFAULTS()`.
3. **Conta, armazenamento e sincronização** — estado `S`, `loadLocal`/`saveLocal`/`touch`, `mergeData`, login (Google Identity Services), Drive (`gfetch`, `ensureFolder`, `writeJson`), `syncNow`, porta de entrada (`showGate`), cabeçalho (`renderSyncBadge`, `openAccount`), instalação, service worker, `boot`.
4. **Leitura da fala** — `parseOne`: números por extenso, parcelas, forma de pagamento, cartão (inclusive apelidos aprendidos), valor, "pra quem", descrição, categoria (`guessCat`: a palavra que aparece primeiro na frase manda). `splitUtterance` separa vários lançamentos por ponto final.
5. **Gravação e consultas** — `commit`, `removeTx`, `txOf`, `balanceOf`, `cardInvoice`, `cardOwed`, `fixedFor`, `monthStats`, `projectMonth`, `futureMonths`, `openPlans`, `buildInsights`.
6. **Gráficos SVG** — `chartBarsH`, `chartPace`, `chartCols`, `chartStack`, `bindTips`, `tableView`.
7. **Telas e fichas** — `render()` chama `renderPainel/Lancar/Mes/Contas/Futuro/Meta/Analises/Ajustes`; fichas com `sheet()`: `openTx`, `openManual`, `openAcct`, `openPay`, `openTransfer`, `openCard`, `openCat`, `openEcat`, `openFix`, `openKw`, `openRestore`, `openGoal`, `openDeposit`.
8. **Método 50-30-20, ler documento, análises e dívidas**
   - 50-30-20: `grupoDe`, `migrarCfg`, `resumo5030`, `arco` + `chartDonut5030` (a rosca), `render5030`, `openMetodo`.
   - Ler documento: `htmlLeitorDoc`, `montarLeitorDoc`, `lerDoc`, `mostrarLidos`, `rascunhosDoc`, `pareceRepetido`, `openLinhaBoleto`.
   - Aba Análises: `renderAnalises` → `diagnostico` + `diagHTML` (achados com gravidade e botões de ação, guardados em `ACOES`), `htmlPagamentos`, `htmlParcelados`, `htmlDividas`.
   - Dívidas: `TIPOS_DIVIDA`, `saldoPrice`, `quitar`, `normDivida`, `vencDivida`, `estadoDivida`, `consignadoNoMes`, `simulacao`, `openDivida`. Gastos que se repetem: `recorrentes`, `tornarFixo`.
   - Extrato por conta e fatura do cartão, na aba Contas: `movsConta`, `linhaExt`, `htmlExtrato`, `bindExtrato` (a seleção fica em `S.ext`; `card:<id>` é cartão).
   - Importar, acertar e repetidos: `importarPara` (leva ao leitor já com tipo, cartão ou conta e mês), `saldoDoDoc` + `openAcerto` (acerto pelo saldo impresso no extrato), `dupHTML` (a pergunta na conferência) e `repetidosDe`/`procurarRepetidos`/`openRepetido` (repetidos já lançados).
   - Contas a pagar do mês: `contasDoMes` junta gastos fixos (pagos = têm lançamento com `fix`), parcelas de dívida, consignado em folha (só informativo) e a fatura de cada cartão (vencimento no mês seguinte quando `due < closing`); `linhaConta`, `htmlContas` (seção da aba Mês), `htmlProximas` (bloco do Painel, dez dias à frente), `lancarFixoUm`, `bindContas`.
   - Salário e consignado: `primeiroDiaUtil` (+ `feriado`, `pascoa`), `garantirSalario`, `descontarConsignados`, `estadoCons`, `consDoMes`, `consVirtuais`, `rendaPrevista`, `lancarDesconto`, `lancamentoDoFixo`, `migrar2`.
   - Ler documento, além do básico: `pedirSenhaPdf`, `diagnosticoDoc` + `amostraSemDados`, `abrirImportar`.
9. **Partida** — `boot()` no fim do arquivo.

Outros arquivos:
- `leitor.js` — leitor de documentos, 100% no aparelho. PDF com texto: pdf.js 3.11.174 (cdnjs). Foto ou PDF escaneado: Tesseract.js 5.1.1 (jsdelivr), idioma `por`. Boleto: `BarcodeDetector` (formato ITF) quando existe, senão a linha digitável reconhecida no texto; aceita só código que passa nos dígitos verificadores (módulo 10/11; fator de vencimento com o ciclo que recomeçou em 22/02/2025). Expõe `window.Leitor` (`ler`, `lerLancamentos`, `lerCupom`, `lerBoleto`, `adivinharTipo`). As bibliotecas baixam na primeira vez e ficam no cache `caderneta-libs`.
  - Fatura: parcela `03/10` vira `i0=3, n=10`; `commit` cria da 3ª à 10ª a partir do mês da fatura (`d.ym`). Pagamento da fatura e estornos ficam de fora.
  - Extrato: C/D e sinal decidem entrada ou saída; sem marca, palavras como *recebido*, *salário* e *estorno* indicam entrada; a coluna de saldo é ignorada.
  - `saldosDoExtrato` lê o saldo que o banco imprime (*saldo anterior* e *saldo final/do dia/em DD/MM*, com a data quando existe). Depois de gravar os lançamentos, o app compara com o calculado e oferece o acerto (`openAcerto`). O acerto nunca é automático.
  - PDF com senha: `textoDoPdf` devolve um erro com `senha: true`, e `lerDoc` abre `pedirSenhaPdf`. A senha só abre o arquivo no aparelho — nunca é guardada nem enviada.
  - Formatos de `lerLancamentos`: data no começo (12/08, 12 AGO); um código curto ou dia da semana antes da data; duas colunas na mesma linha do PDF (quebra em `RE_OUTRA_COLUNA`); extrato agrupado por dia (a data sozinha vale para as linhas seguintes); sufixos `D`, `C`, `-`, `(+)` e `(-)`.
  - Nada reconhecido ou erro: `diagnosticoDoc` explica e mostra uma amostra **sem dados** (`amostraSemDados`: números viram 9; palavras que não são termos bancários viram x). O dono copia e manda; ajuste o leitor por ela, nunca peça o documento original.
  - Foto de extrato ou fatura: uma página por vez. *Fotografar mais uma página* soma à conferência (`S.docMais`, `mostrarLidos(r, op, anexar)`). O seletor de arquivo aceita vários de uma vez. No extrato de cada conta ou cartão, *Importar* oferece foto ou arquivo (`abrirImportar`).
  - Comprovante de conta paga: `lerCupom` prefere a data da linha que fala de pagamento. Boleto lido entra com a data de hoje; o vencimento fica no texto.
  - Tudo cai na conferência (`S.drafts`), com a caixa *Incluir* — desmarcada quando `pareceRepetido` acha o mesmo valor em até 3 dias ou a mesma parcela — e *Fixo todo mês*, que cria um gasto fixo ligado ao lançamento (`fix`).
  - Os campos da ficha *Ler documento* aparecem conforme o tipo escolhido (atributo `data-doc`). Canhoto e boleto têm *Pago com* (guardado em `S.docPago`): essa escolha vence o que o documento diz e define débito, Pix, boleto ou cartão. Em branco, vale o que está escrito no documento. Cada linha ainda pode ser mudada uma a uma na conferência.
- `sw.js` — guarda o app (`APP`) para uso offline. Página com `cache: "no-cache"` e `config.js` com `"no-store"`: rede primeiro, cópia guardada se não houver internet. Ícones: cópia guardada primeiro. Fontes do Google: cache próprio. Bibliotecas do leitor (cdnjs, jsdelivr): cache `caderneta-libs-2`, sempre pedidas como CORS e guardadas só com resposta `ok` — uma resposta opaca guardada quebrava o worker do pdf.js em alguns navegadores. APIs do Google: nunca passam pelo cache.
- `config.js` — `googleClientId`. Vazio = app funciona só no aparelho, sem login.

## Formato dos dados (por conta)

- localStorage `caderneta:dados:<id>` → `{cfg, months, syncedAt, dirty}`. O id é `g:<sub do Google>` ou `l:<aleatório>` (conta só do aparelho). Contas conhecidas em `caderneta:contas`; a ativa em `caderneta:ativa`.
- `months["AAAA-MM"].tx[id]` → `{d, t, v, desc, cat, method, card, acct, acct2, k, plan, i, n, total, fix, ref, to, u, cons?, emp?}`
  - `method: "folha"` = desconto em folha: conta como gasto, mas não sai da conta. `cons` liga o desconto ao consignado; `emp` liga o depósito do empréstimo.
  - Chaves fixas criadas pelo app: `sal-AAAA-MM` (salário automático) e `cons-<id>-AAAA-MM` (desconto do consignado).
  - `v` em **centavos, inteiro**.
  - `k`: `g` gasto · `e` entrada · `p` pagamento de fatura · `t` transferência entre contas.
  - `u`: momento da última alteração (ms). Excluir = `{del:1, u}` (lápide). Nunca apague a chave: a lápide é o que faz a exclusão chegar aos outros aparelhos.
  - Compra parcelada: uma linha por mês com o mesmo `plan`, `i`/`n` e `total`. O dia do fechamento do cartão empurra a compra para a fatura seguinte.
  - Compra no crédito não sai da conta no dia; sai no pagamento da fatura (`k:"p"`, `ref` = mês da fatura).
- `cfg` — renda, teto, meta de saldo, contas (saldo inicial + acertos), cartões, categorias (com limite), categorias de entrada, gastos fixos, palavras aprendidas (`kwCat`, `kwCard`), meta de poupança; `cfg.u` = última alteração.
- Acerto de saldo: soma a diferença em `a.opening` e guarda `{d, delta}` em `a.adjust` (últimos 20). Vem da ficha da conta ou do saldo impresso no extrato. **Nunca apague lançamento por conta própria, nem acerte saldo sozinho:** duplicado e acerto sempre passam por uma pergunta ao dono (`dupHTML`, `openRepetido`, `openAcerto`).
- **Salário automático** (`cfg.salAuto`, ligado por padrão; `cfg.salConta`; `cfg.salDesde`): a renda líquida de Ajustes cai no primeiro dia útil do mês (`primeiroDiaUtil`: fins de semana, feriados nacionais, carnaval, sexta-feira santa e Corpus Christi). `garantirSalario` lança a renda menos as parcelas de consignado do mês, com chave `sal-AAAA-MM` — dois aparelhos geram a mesma chave e a junção fica com um só. Não lança se o mês já tem salário (categoria `sal`), se a chave existe como lápide (o dono apagou) ou, em conta Google, antes da primeira sincronização da sessão (senão duplicaria um salário lançado em outro aparelho).
- Salário lançado à mão ou pelo extrato passa por `descontarConsignados`: se veio o valor cheio da renda, tira a parcela; se já veio descontado, só registra a parcela.
- Projeções usam `rendaPrevista(ym)` (renda de Ajustes menos o consignado do mês) e `fixPendConta` (fixos sem o consignado, que não sai da conta).
- Gasto fixo: `cfg.fixed[]` → `{id, name, amount, day, cat, card, desde?, ate?, divida?}`. `desde` e `ate` (`AAAA-MM`) limitam os meses em que ele vale (`fixedFor`). Um lançamento ligado a ele (`fix` = id) marca o mês como pago. `openFix` preserva os campos extras ao salvar.
- **Dívidas:** `cfg.dividas[]` → `{id, nome, tipo, parcela, total, inicio, dia, juros, card, folha, fixId}`.
  - `parcela` em centavos; `total` = parcelas do contrato; `inicio` = mês (`AAAA-MM`) da 1ª parcela; `dia` = dia do vencimento ou do desconto; `juros` em % ao mês (`""` quando não informado).
  - **Dívida comum** (tudo que não é consignado) anda pelo calendário: a parcela `k` vence em `inicio + (k−1)` meses (`vencDivida`), e a que já venceu conta como paga. A ficha aceita *Já estou pagando* → "parcela 4 de 12" (o app deduz o `inicio`) ou *Ainda vou começar* → data da 1ª parcela. Cria um gasto fixo (`fixId`) na categoria `divida`, de `inicio` até `inicio + total − 1`.
  - **Consignado** (`tipo: "consignado"`, `modo: "salario"`) → `{valor, data, conta, total, parcela, jaDesc, juros, criado, depId}`. Do jeito que o dono definiu:
    - o `valor` do empréstimo cai na `conta` na `data`, como entrada de categoria `emprest`: entra no saldo, **não** conta como renda (`monthStats` exclui);
    - a partir do primeiro salário depois da `data` (ou do salário do mês do cadastro, se `jaDesc > 0`), o salário entra com a parcela descontada, e a parcela vira gasto `divida` com `method: "folha"` e `cons: <id>`;
    - `method: "folha"` conta como gasto (teto, 50-30-20, Dívidas), mas **não sai da conta** (`balanceOf` e `movsConta` ignoram) — a renda já veio sem ela;
    - **nunca dois descontos no mesmo mês:** chave fixa `cons-<id>-<AAAA-MM>` e a checagem `estadoCons().meses`;
    - `jaDesc` = parcelas descontadas **antes** do mês do cadastro; pagas = `jaDesc` + lançamentos com `cons`. Juros em branco → calculado pela tabela Price a partir de valor, parcela e número de parcelas (`consJuros`);
    - enquanto o desconto do mês não foi lançado, ele aparece como gasto fixo virtual (`consVirtuais`, dentro de `fixedFor`).
  - Consignado da versão anterior (pelo calendário) é convertido uma vez em `migrar2` (`cfg.m2`).
  - Formato da primeira versão (`restantes`/`desde`) vira o novo na leitura, em `normDivida`: `total = restantes`, `inicio = desde`.
  - Saldo pela tabela Price: `S = P·(1 − (1+i)^−n)/i`; juros que faltam = `P·n − S`. Sem juro informado: saldo = `P·n` e nenhuma simulação.
  - Simulação: adiantar 20% da parcela (mínimo R$ 50, arredondado em R$ 10). Meses até quitar pagando `Q`: `m = −ln(1 − S·i/Q)/ln(1+i)`. Economia = juros com `P` − juros com `P + E`.
- **Junção entre aparelhos** (`mergeData`): lançamentos pela união por id; em conflito vence o `u` maior. O `cfg` inteiro vence pelo `u` maior. Toda escrita precisa passar por `commit`, `saveCfg` ou `saveMonth`, que atualizam `u` e agendam a sincronização.
- Método 50-30-20: `cfg.metodo = {nec, des, fut}` (percentuais que somam 100) e `cats[].grupo` (`nec`, `des` ou `fut`; sem grupo vale `GRUPO_PADRAO`, e o resto é Desejo). Futuro realizado = gastos das categorias `fut` (inclusive `divida`) + o maior entre o que foi marcado em *Guardei um dinheiro* e o transferido para contas de poupança/investimento no mês — costumam ser o mesmo dinheiro. Necessidades e Desejos são tetos; Futuro é piso.
- Configuração que já existe nos aparelhos e ganha algo novo: acrescente em `migrarCfg()` sob uma marca nova (`cfg.m1`, `cfg.m2`…), sem desfazer escolha do dono.
- Campo novo: sempre com valor padrão em `DEFAULTS()`. Os dados antigos entram por `Object.assign(DEFAULTS(), cfg)`.
- Restaurar backup aceita `app` = `caderneta`, `caderneta-casa` ou `meu-caixa` (versões antigas) e **junta** com o que já existe.

## Aba Análises: regras do diagnóstico

Cada achado tem gravidade (crítico, atenção, informação, boa notícia), um texto curto e, quando dá, um botão de ação. Ordem na tela: crítico → atenção → informação → boa notícia.

- **Teto:** no mês corrente, a projeção pelo ritmo (`monthStats().pace`) contra o teto e o limite por dia que ainda cabe; em mês passado, quanto fechou acima ou abaixo.
- **50-30-20:** Necessidades ou Desejos acima da meta, com as duas maiores categorias do grupo; Futuro abaixo da meta, dizendo quanto da folga de Desejos cobriria a diferença.
- **Renda comprometida** = (parcelas do mês + fixos vigentes, inclusive dívidas) ÷ renda. Acima de 30%: atenção. Acima de 50%: crítico.
- **Consignado** soma no numerador e volta para o denominador, porque a renda lançada já vem sem ele: (parcelas + fixos + consignado) ÷ (renda + consignado).
- **Parcelas que terminam:** o primeiro mês, nos próximos 12, em que as parcelas caem pelo menos R$ 50 e 10% → "sobram R$ X por mês".
- **Parece gasto fixo** (`recorrentes`): mesma chave (as duas primeiras palavras com mais de duas letras da descrição) em pelo menos 2 dos últimos 3 meses, uma vez por mês, com valores a até 15% da média, e ainda não marcado como fixo → botão *Marcar como fixo*.
- **Assinaturas e telefone:** o valor do mês × 12.
- **Cartão:** limite usado, contando as parcelas futuras (`cardOwed`). Acima de 80%: atenção. Acima de 95%: crítico.
- **Dívida mais cara:** juros ≥ 3% ao mês: atenção; ≥ 8%: crítico. Mostra os juros que faltam e a economia de adiantar.
- **Categoria subindo** três meses seguidos, mais de 10% a cada mês, chegando a pelo menos R$ 100.

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
- Rosca só para parte de um todo, com até 6 fatias — hoje, só o 50-30-20. Ela tem um entalhe fixo de 5° no topo e 1,6° entre as fatias, para que o azul (Necessidades) e o roxo (Futuro) nunca se encostem. Anel fino de fora = meta; anel grosso de dentro = realizado; o que sobra da renda fica em cinza (*Sem destino*).
- Gasto por categoria, por cartão e por forma de pagamento é magnitude: barras de uma cor só. Bom, atenção e ruim sempre acompanhados de rótulo.
- Todo gráfico tem `tableView` logo abaixo, com os números.
- Fontes: IBM Plex Sans (interface) e IBM Plex Mono (valores).
- Celular: abas embaixo; Futuro, Meta, Análises e Ajustes ficam em *Mais*. A partir de 960px: menu lateral.

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
  - sincronização com `fetch` simulado para a API do Drive: dois "aparelhos" com lançamentos diferentes → o Drive tem que terminar com a união;
  - aba Análises com dados de exemplo: compra parcelada, uma dívida com juros, um gasto repetido em três meses (tem que aparecer *Parece gasto fixo*);
  - dívida das duas formas: "parcela 4 de 12" (tem que mostrar 4 pagas) e "1ª parcela em 01/10" (0 pagas, próxima na data);
  - extrato da conta: o saldo da última linha tem que bater com `balanceOf` no fim do mês.
- O login real com o Google só funciona na origem autorizada. Para testar em `localhost`, é preciso incluir `http://localhost:8765` nas origens do cliente OAuth.

## Situação e próximos passos

- **Publicado:** `caderneta-v9` (setembro de 2026). Lançamento por fala; leitura de documento por foto ou PDF (com senha, várias páginas e amostra sem dados); fixo todo mês; 50-30-20 com rosca; aba Análises; extrato por conta com importar, acertar saldo e repetidos; contas a pagar por vencimento; salário automático no primeiro dia útil e consignado descontado do salário.
- **PDF dos bancos dele:** até a v8 não abriam. A v9 trata senha, formatos novos e o cache da biblioteca, e mostra a amostra sem dados quando falhar — peça a amostra se ele disser que ainda não abre.
- **Falta testar com dados reais do dono:** a leitura das faturas e extratos dos bancos dele — até agora só com amostras — e o login no iPhone com o app instalado.
- **Para continuar em outro computador** (o dono também usa um MacBook Air): abra uma conversa do Claude Code na pasta do repositório, rode `git pull` e leia este arquivo. Se a pasta ainda não existe, clone `https://github.com/rgbittencourt/caderneta`.

## Histórico

Começou como dois artifacts do Claude ("Caderneta da Casa" e "Meu Caixa"), por um erro de leitura do pedido: o dono queria um app só, com contas separadas. Os artifacts antigos servem apenas para exportar o backup e trazer os dados para cá.
