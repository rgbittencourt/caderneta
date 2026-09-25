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
4. **Leitura da fala** — `textoDaFala` junta os pedaços do ditado: cada navegador entrega de um jeito, e o do dono repete a frase inteira crescendo a cada pedaço ("325", "325 pago", "325 pago para…"). Somar tudo virava uma frase gigante e um valor absurdo (R$ 325.325.325.325.325,00). Agora, se o pedaço novo começa com o que já existe, ele substitui; se repete o fim, é ignorado. `parseOne`: números por extenso, parcelas, forma de pagamento, cartão (inclusive apelidos aprendidos), valor, "pra quem", descrição, categoria (`guessCat`: a palavra que aparece primeiro na frase manda). `splitUtterance` separa vários lançamentos por ponto final.
5. **Gravação e consultas** — `commit`, `removeTx`, `txOf`, `balanceOf`, `cardInvoice`, `cardOwed`, `fixedFor`, `monthStats`, `projectMonth`, `futureMonths`, `openPlans`, `buildInsights`.
6. **Gráficos SVG** — `chartBarsH`, `chartPace`, `chartCols`, `chartStack`, `bindTips`, `tableView`.
7. **Telas e fichas** — `render()` chama `renderPainel/Lancar/Mes/Contas/Futuro/Meta/Analises/Ajustes`; fichas com `sheet()`: `openTx`, `openManual`, `openAcct` (nome, tipo, excluir), `openSaldoInicial`, `openCorrigirSaldo`, `openCorrigirFatura`, `openPay`, `openTransfer`, `openCard`, `openCat`, `openEcat`, `openFix`, `openKw`, `openRestore`, `openGoal`, `openDeposit`.
8. **Método 50-30-20, ler documento, análises e dívidas**
   - 50-30-20: `grupoDe`, `migrarCfg`, `resumo5030`, `arco` + `chartDonut5030` (a rosca), `render5030`, `openMetodo`.
   - Ler documento: `htmlLeitorDoc(kind)`, `montarLeitorDoc`, `lerDoc(arquivo, op)`, `mostrarLidos`, `rascunhosDoc`, `pareceRepetido`, `openLinhaBoleto`, `docNoLeitorErrado`.
   - Aba Análises: `renderAnalises` → `diagnostico` + `diagHTML` (achados com gravidade e botões de ação, guardados em `ACOES`), `htmlPagamentos`, `htmlParcelados`, `htmlDividas`.
   - Dívidas: `TIPOS_DIVIDA`, `saldoPrice`, `quitar`, `normDivida`, `vencDivida`, `estadoDivida`, `consignadoNoMes`, `simulacao`, `openDivida`. Gastos que se repetem: `recorrentes`, `tornarFixo`.
   - Extrato por conta e fatura do cartão, na aba Contas: `movsConta`, `linhaExt`, `htmlExtrato`, `bindExtrato` (a seleção fica em `S.ext`; `card:<id>` é cartão). Fatura: `faturaDe`, `comprasDaFatura`, `cardInvoice`.
   - Importar, acertar e repetidos: `saldoDoDoc` + `openAcerto` (acerto pelo saldo impresso no extrato), `dupHTML` (a pergunta na conferência) e `repetidosDe`/`procurarRepetidos`/`openRepetido` (repetidos já lançados).
   - Fatura **prevista**: enquanto a fatura daquele mês não foi importada (`cfg.faturasLidas["<cartão>|<AAAA-MM>"]`), o valor é só a previsão pelas compras e parcelas que o app conhece — ela aparece como *prevista*, nunca como *atrasada*, e não entra na conta de "passaram do vencimento" no Painel.
   - Ajustes → Dados mostra a **versão instalada** (`mostrarVersao` lê o nome do cache `caderneta-vNN`) e tem *Procurar atualização*: serve para saber se o aparelho já está na versão nova.
   - Contas a pagar do mês: `contasDoMes` junta gastos fixos (pagos = têm lançamento com `fix`), parcelas de dívida, consignado em folha (só informativo) e a fatura de cada cartão (vencimento no mês seguinte quando `due < closing`); `linhaConta`, `htmlContas` (seção da aba Mês), `htmlProximas` (bloco do Painel, dez dias à frente), `lancarFixoUm`, `bindContas`.
   - Salário e consignado: `primeiroDiaUtil` (+ `feriado`, `pascoa`), `garantirSalario`, `descontarConsignados`, `estadoCons`, `consDoMes`, `consVirtuais`, `rendaPrevista`, `lancarDesconto`, `lancamentoDoFixo`, `migrar2`.
   - Ler documento, além do básico: `pedirSenhaPdf`, `diagnosticoDoc` + `amostraSemDados`.
   - Importar meses anteriores: `classificarLinhaExtrato`, `religarPagamentos`, `mesDaFatura`, `camposDoRascunho`.
   - Recomeçar e restaurar: `openRecomecar`, `backupAntesDeRecomecar`, `ehDinheiro`; `openRestore` + `listarBackupsDrive` + `restaurarPacote`.
9. **Partida** — `boot()` no fim do arquivo.

Outros arquivos:
- `leitor.js` — leitor de documentos, 100% no aparelho. PDF com texto: pdf.js 3.11.174 (cdnjs). Foto ou PDF escaneado: Tesseract.js 5.1.1 (jsdelivr), idioma `por`. Boleto: `BarcodeDetector` (formato ITF) quando existe, senão a linha digitável reconhecida no texto; aceita só código que passa nos dígitos verificadores (módulo 10/11; fator de vencimento com o ciclo que recomeçou em 22/02/2025). Expõe `window.Leitor` (`ler`, `lerLancamentos`, `lerCupom`, `lerBoleto`, `adivinharTipo`). As bibliotecas baixam na primeira vez e ficam no cache `caderneta-libs`.
  - Fatura: parcela `03/10` vira `i0=3, n=10`; `commit` cria da 3ª à 10ª a partir do mês da fatura (`d.ym`). Pagamento da fatura e estornos ficam de fora.
  - Extrato: C/D e sinal decidem entrada ou saída; sem marca, palavras como *recebido*, *salário* e *estorno* indicam entrada; a coluna de saldo é ignorada.
  - `saldosDoExtrato` lê o saldo que o banco imprime (*saldo anterior* e *saldo final/do dia/em DD/MM*, com a data quando existe). Depois de gravar os lançamentos, o app compara com o calculado e oferece o acerto (`openAcerto`). O acerto nunca é automático.
  - PDF com senha: `textoDoPdf` devolve um erro com `senha: true`, e `lerDoc` abre `pedirSenhaPdf`. A senha só abre o arquivo no aparelho — nunca é guardada nem enviada.
  - Formatos de `lerLancamentos`: data no começo (12/08, 12 AGO); um código curto ou dia da semana antes da data; duas colunas na mesma linha do PDF (quebra em `RE_OUTRA_COLUNA`); extrato agrupado por dia (a data sozinha vale para as linhas seguintes); sufixos `D`, `C`, `-`, `(+)` e `(-)`.
  - **Extrato do Banco do Brasil** (`ehExtratoEmBlocos` → `lerExtratoEmBlocos`; conferido com o PDF real de jan/2026): cada lançamento tem o histórico numa linha ("Compra com Cartão"), a linha `DD/MM/AAAA lote documento valor (+)/(-)` e o detalhe embaixo ("03/01 17:06 LOJA"). O PDF às vezes põe o histórico ou o detalhe na mesma linha do valor; as linhas soltas entre dois lançamentos são repartidas entre o detalhe do anterior e o histórico do seguinte. Descrição: "Compra com Cartão" vira só o nome da loja; o resto fica "Histórico · detalhe", sem hora, CPF e CNPJ. Data = dia do lançamento na conta (não a da compra), para o saldo bater dia a dia. Cabeçalho de página, *Saldo Anterior*, *Saldo do dia* e *S A L D O* não são lançamentos.
  - **BB Rende Fácil — conta própria (regra do dono, 24/09/2026).** O banco zera a conta corrente todo dia e guarda a sobra na aplicação. As linhas do Rende Fácil entram como **transferência** entre a conta corrente e uma conta de investimento com o nome da aplicação (`aplic` na linha lida → `contaDaAplicacao`, que cria a conta na primeira importação e avisa na conferência). Assim a conta corrente do app fica **igual ao saldo impresso no extrato**, dia a dia, e `saldosDoExtrato` volta a valer para qualquer mês.
  - **Rendimento:** não existe linha de rendimento no extrato — ele volta escondido dentro dos resgates (o banco devolve mais do que tirou). Quando a conta da aplicação fica negativa, essa diferença é o rendimento: `perguntarRendimento` pergunta ao dono, depois do acerto de saldo, e lança como entrada de categoria `rend` na conta da aplicação, zerando-a. Nunca lança sozinho. Conferido com jan e fev/2026: aplicado 45.844,83, resgatado 45.854,69, rendimento 9,86 — sem isso, a conta fechava 9,86 abaixo do extrato.
  - Antes da v20 esses movimentos ficavam de fora e o saldo do app era "conta + Rende Fácil": quem importou assim precisa importar o extrato de novo (as outras linhas vêm marcadas como repetidas).
  - **Mês da fatura (corrigido em 24/09/2026):** é o mês do fechamento impresso nela (`mesDaFatura` usa `r.fechada`). Nas faturas reais do dono (Ourocard Visa Infinite e Elo Nanquim), o fechamento é dia 4-6 e o vencimento é dia 16 **do mesmo mês** — a fatura que fecha em 06/01 é a fatura de janeiro, paga em 16/01. Juros, IOF e tarifas vêm com data do mês seguinte ao fechamento e antes jogavam a fatura inteira um mês para a frente — a fatura que fechou em 23/12 virava "fatura de janeiro", ficava sem o pagamento que a quitou e aparecia como atrasada no Painel. Sem o fechamento no documento, vale a compra mais recente. `dataNoInicio` também entende "05/01" numa fatura fechada em dezembro como janeiro do ano seguinte.
  - **Parcelas: o banco não repete o centavo nem o mês.** Conferido nas faturas reais do dono: a parcela `01/06` sai 232,00 e a `02/06`, 231,98; e uma parcela pode não vir na fatura prevista (a `02/02` da compra de 02/01 não veio na fatura que fechou em 04/02). Por isso `parcelaReservada` procura a parcela reservada em **qualquer mês**, pelo plano, número e cartão, com folga de 2% (mínimo R$ 1) no valor; `ajustarParcelaReservada` acerta o valor pelo da fatura e, se ela caiu em outra fatura, move a parcela; e `empurrarParcelasNaoCobradas` joga para a fatura seguinte as parcelas que o app tinha reservado e a fatura importada não traz (junto com as seguintes do mesmo plano). Sem isso, a fatura do app fica maior que a do banco e o pagamento não é reconhecido.
  - **Saldo da fatura anterior (regra do dono, 24/09/2026):** a fatura abre com *SALDO FATURA ANTERIOR* e o *PAGAMENTO EM DÉBITO EM CONTA* que a quitou. Nenhum dos dois é compra: o leitor guarda os dois (`saldoAnterior`, `pagoAnterior`) e ignora as linhas. Se a soma dá zero, a anterior foi paga. O que sobrar é o que faltou pagar, que o banco cobra de novo — `rascunhosDoc` lança isso como *Saldo da fatura anterior* na fatura atual, **só quando a fatura anterior não está no app**; se estiver, é ela que mostra o que falta pagar, e lançar de novo contaria o gasto duas vezes. A conferência diz qual dos dois casos aconteceu.
  - A fatura ensina o dia do fechamento: ao importar, um cartão sem `closing` recebe o dia de `r.fechada` (avisado na conferência). Sem `closing`, a fatura do mês vence no mês seguinte (`contasDoMes`, `pagamentoJaLancado`), que é o comum no Brasil.
  - **Fatura do BB (Ourocard)**: só as linhas depois do cabeçalho `Data Descrição País Valor` contam (o resto é resumo, juros e avisos); linhas com `%` e valor zero ficam de fora; a coluna País (`BR`) sai da descrição. A data de *Fatura fechada em* dá o ano das compras sem ano e é o mês da fatura quando só há parcelas (`r.fechada`). Crédito que anula uma cobrança de mesmo valor e mesma parcela (o *DESC AUTOMATICO ANUD.* da anuidade) tira os dois (`anulados`). "OUROCARD MASTERCARD Final 1234" (`r.cartao`) escolhe o cartão cadastrado pelo final ou pela bandeira, mesmo que outro esteja selecionado.
  - `adivinharTipo`: extrato em blocos → extrato; marcas fortes de fatura (*pagamento mínimo*, *total da fatura*) antes do boleto, porque a fatura traz a linha digitável; extrato antes da palavra solta "fatura", porque o extrato tem "Pagamento Fatura de Água".
  - Nada reconhecido ou erro: `diagnosticoDoc` explica e mostra uma amostra **sem dados** (`amostraSemDados`: números viram 9; palavras que não são termos bancários viram x). O dono copia e manda; ajuste o leitor por ela, nunca peça o documento original.
  - Foto de extrato ou fatura: uma página por vez. *Fotografar mais uma página* soma à conferência (`S.docMais`, `mostrarLidos(r, op, anexar)`). O seletor de arquivo aceita vários de uma vez.
  - `saldosDoExtrato` também lê o saldo final com data no começo da linha (`28/02/2026 S A L D O 3.629,98 (-)`), que vale mais que o último *Saldo do dia*.
  - Extrato da conta: `classificarLinhaExtrato` transforma pagamento de fatura em `k:"p"` (cartão pelo nome na descrição, senão o cartão cuja fatura tem exatamente esse valor — o BB escreve só "Pagto cartão crédito"; "fatura de água/luz/telefone" não é cartão; `ref` = mês anterior ao pagamento, ou o mesmo mês se `due > closing`) e aplicação ou resgate em `k:"t"` (para a conta de investimento ou poupança, se existir; senão o lado vazio = fora do app). Nenhum dos dois conta como gasto ou renda — sem isso, importar extrato **e** fatura contaria as compras do cartão em dobro.
  - Fatura: o mês vem das compras (`mesDaFatura`: a compra mais recente, fora as parcelas de compras antigas), não do mês na tela — permite importar meses anteriores. Linha `01/03 126,67` é valor **por parcela** (`porParcela` em `commit`); na fala, o valor dito é o total. Parcela que o app já reservou (mesmo número, valor e cartão no mês) vem desmarcada e marcada como já reservada, com *mudar*.
  - A conferência aceita os quatro tipos (`camposDoRascunho`): gasto, entrada, pagamento de fatura e entre contas. `commit` com `k:"t"` preserva conta vazia (fora do app).
  - Consignado e importação: o desconto do mês só é registrado quando entra um salário de categoria `sal`, e a agenda anda pelos descontos já feitos — importe os meses do mais antigo para o mais novo.
  - OFX e CSV exportados pelo banco: `lerArquivoTexto` (em `index.html`, usa `parseStatement`) monta as linhas e manda para a mesma conferência. Fatura se o OFX tem `<CCSTMTRS>` ou se o tipo escolhido é fatura; na fatura só entram as compras (no OFX, os valores negativos; no CSV, o sinal da maioria). O antigo *Importar extrato* de Ajustes, que colava texto e gravava sem conferência, foi removido — hoje Ajustes só aponta para a aba Contas.
  - Comprovante de conta paga: `lerCupom` prefere a data da linha que fala de pagamento. Boleto lido entra com a data de hoje; o vencimento fica no texto.
  - Tudo cai na conferência (`S.drafts`), com a caixa *Incluir* — desmarcada quando `pareceRepetido` acha o mesmo valor em até 3 dias ou a mesma parcela — e *Fixo todo mês*, que cria um gasto fixo ligado ao lançamento (`fix`).
  - **Onde se importa (decidido com o dono em 24/09/2026):** tudo na aba **Lançar**, nesta ordem — *Lançar por fala*, **Importar extrato da conta** (com a conta do extrato) e **Importar fatura do cartão, canhoto ou boleto**. Ajustes não importa nada: fica só com os saldos e a configuração. São dois cartões `[data-leitor="extrato"|"gastos"]` com os mesmos campos em **classe** (`.docTipo`, `.docConta`, `.docCard`, `.docPago`, `.docArq`, `.docCam`, `.docStatus`), e `montarLeitorDoc` liga cada um passando o que foi escolhido em `op` para `lerDoc(arquivo, op)` — nada de ids globais, porque os dois vivem na mesma tela. O mês da fatura não se escolhe: vem das compras. Documento no leitor errado (`adivinharTipo`): `docNoLeitorErrado` pergunta e relê com os campos do outro cartão.
  - Em Lançar, os campos aparecem conforme o tipo escolhido (atributo `data-doc`). Canhoto e boleto têm *Pago com* (guardado em `S.docPago`): essa escolha vence o que o documento diz e define débito, Pix, boleto ou cartão. Em branco, vale o que está escrito no documento. Cada linha ainda pode ser mudada uma a uma na conferência.
- `sw.js` — guarda o app (`APP`) para uso offline. Página com `cache: "no-cache"` e `config.js` com `"no-store"`: rede primeiro, cópia guardada se não houver internet. Ícones: cópia guardada primeiro. Fontes do Google: cache próprio. Bibliotecas do leitor (cdnjs, jsdelivr): cache `caderneta-libs-2`, sempre pedidas como CORS e guardadas só com resposta `ok` — uma resposta opaca guardada quebrava o worker do pdf.js em alguns navegadores. APIs do Google: nunca passam pelo cache.
- `config.js` — `googleClientId`. Vazio = app funciona só no aparelho, sem login.

## Formato dos dados (por conta)

- localStorage `caderneta:dados:<id>` → `{cfg, months, syncedAt, dirty}`. O id é `g:<sub do Google>` ou `l:<aleatório>` (conta só do aparelho). Contas conhecidas em `caderneta:contas`; a ativa em `caderneta:ativa`.
- `months["AAAA-MM"].tx[id]` → `{d, t, v, desc, cat, method, card, acct, acct2, k, plan, i, n, total, fix, ref, to, u, fat?, aj?, cons?, emp?}`
  - `method: "folha"` = desconto em folha: conta como gasto, mas não sai da conta. `cons` liga o desconto ao consignado; `emp` liga o depósito do empréstimo.
  - Chaves fixas criadas pelo app: `sal-AAAA-MM` (salário automático) e `cons-<id>-AAAA-MM` (desconto do consignado).
  - `v` em **centavos, inteiro**.
  - `k`: `g` gasto · `e` entrada · `p` pagamento de fatura · `t` transferência entre contas.
  - `u`: momento da última alteração (ms). Excluir = `{del:1, u}` (lápide). Nunca apague a chave: a lápide é o que faz a exclusão chegar aos outros aparelhos.
  - Compra parcelada: uma linha por mês com o mesmo `plan`, `i`/`n` e `total`.
  - **Compra no crédito (regra do dono, 15/09/2026):** conta como gasto **no mês do dia da compra** e fica guardada nesse mês; `fat` = mês da fatura que a cobra (o dia do fechamento empurra para a seguinte, `txMonth`). Parcela k: gasto no mês da compra + k−1, fatura na da 1ª + k−1. Numa fatura importada, parcela com a data da compra original (antes do mês anterior à fatura) anda o mês do gasto junto com o número da parcela; o gasto nunca fica depois da fatura. Tudo que é fatura usa `faturaDe(t)` (`t.fat`, ou `t.ym` em lançamento antigo, que foi guardado no mês da fatura): `cardInvoice`, `comprasDaFatura`, `cardOwed`, `pareceRepetido`, parcela reservada. Mudar a data em `openTx` não muda a fatura.
  - Compra no crédito não sai da conta no dia; sai no pagamento da fatura (`k:"p"`, `ref` = mês da fatura). Nas listas, a linha leva a marca *crédito · não sai da conta* ou *débito*, e o extrato da conta mostra no rodapé quanto foi no crédito naquele mês.
  - **O pagamento da fatura nunca pode sair duas vezes da conta (regra do dono, 23/09/2026).** Ele chega pelo extrato do banco ("Pagto cartão crédito", sem dizer o cartão) e também pelo botão *Pagar fatura*. `pagamentoJaLancado(cartão, mês, valor)` procura um `k:"p"` perto do vencimento (±25 dias), com o valor igual ou até 2% diferente, que ainda não esteja contado nessa fatura; `ligarPagamento` só muda `card` e `ref` do lançamento que já existe — não cria outro. Onde isso entra: *Pagar fatura* avisa e oferece **É este pagamento**; ao salvar uma fatura importada, `perguntarPagamentoDaFatura` pergunta antes de deixar a fatura em aberto; na conferência, `pareceRepetido` usa janela de 6 dias para `k:"p"`. Para o que já estava duplicado, `pagamentosRepetidos` + `conferirPagamentosRepetidos` (uma vez por sessão, na partida) mostram os dois lado a lado e só apagam se o dono mandar; um "são diferentes" fica em `cfg.pagPares`.
  - `religarPagamentos`: pagamento importado do extrato antes da fatura fica com *confira o cartão* no `raw`; ao salvar uma fatura, ele vai para o cartão cuja fatura tem exatamente o valor pago.
- `cfg` — renda, teto, meta de saldo, contas (saldo inicial + acertos), cartões, categorias (com limite), categorias de entrada, gastos fixos, palavras aprendidas (`kwCat`, `kwCard`), meta de poupança; `cfg.u` = última alteração.
- **Conferência contra o que já foi lançado:** toda linha lida de um documento passa por `pareceRepetido` — mesmo tipo, valor a até 1 centavo e data a até 3 dias (6 no pagamento de fatura), nos meses em volta. Achou: a linha vem desmarcada, com a pergunta (`dupHTML`). No crédito, cartão diferente só casa quando a descrição tem uma palavra em comum — na fala é fácil dizer o cartão errado. Parcelas têm regra própria (`parcelaReservada`). Conferido com os documentos reais: quatro lançamentos feitos à mão (débito, Pix e dois no crédito, um deles no cartão errado) foram todos reconhecidos ao importar o extrato e a fatura.
- **Acerto de saldo (regra do dono, 16/09/2026): em qualquer conta e em qualquer mês**, para o mês seguinte já começar certo. Ajustes → *Saldo de cada conta e cartão* → *Corrigir saldo* (`openCorrigirSaldo`): escolhe o mês, o app mostra o saldo calculado no último dia (hoje, no mês atual) e o dono digita o do banco ou da carteira. `acertarSaldo(conta, dia, valor)`: antes do `openDate`, soma a diferença em `a.opening` e guarda `{d, delta}` em `a.adjust` (é o saldo inicial); a partir dele, grava um lançamento `k:"t"`, `aj:1`, *Acerto de saldo*, às 23:59 do dia, entre a conta e "fora do app" (`acct` ou `acct2` vazio) — mexe no saldo só dali em diante e não conta como gasto nem renda. O acerto pelo saldo impresso no extrato (`openAcerto`) usa o mesmo caminho. Aparece no extrato e se apaga tocando nele (`openTx` aceita *Fora do app* em transferência).
- **Apagar uma fatura inteira:** *Corrigir fatura* tem *Apagar esta fatura* (dois toques), que remove os lançamentos daquela fatura e, de uma compra parcelada, **aquela parcela e as seguintes** — as anteriores, que estão em faturas já conferidas, ficam. Não toca no pagamento. É o caminho para reimportar uma fatura que entrou errada, sem recomeçar do zero. (Até a v25 ele apagava o plano inteiro, inclusive parcelas de meses anteriores: o dono apagou a fatura de março e perdeu parcelas de janeiro e fevereiro.)
- **Acerto da fatura:** *Corrigir fatura* (`openCorrigirFatura` → `acertarFatura`) compara `cardInvoice(...).total` com o total do banco (compras, tarifas e encargos do período, sem saldo anterior nem pagamentos) e grava na fatura um gasto no crédito `aj:1`, *Acerto da fatura*, no dia do fechamento — com `v` **negativo** quando o banco cobrou menos (único caso de valor negativo; as somas já tratam). Não mexe na conta corrente. `recorrentes` e `repetidosDe` ignoram acertos.
- **Nunca apague lançamento por conta própria, nem acerte saldo sozinho:** duplicado e acerto sempre passam por uma pergunta ao dono (`dupHTML`, `openRepetido`, `openAcerto`).
- **Salário automático** (`cfg.salAuto`, ligado por padrão; `cfg.salConta`; `cfg.salDesde`): a renda líquida de Ajustes cai no primeiro dia útil do mês (`primeiroDiaUtil`: fins de semana, feriados nacionais, carnaval, sexta-feira santa e Corpus Christi). `garantirSalario` lança a renda menos as parcelas de consignado do mês, com chave `sal-AAAA-MM` — dois aparelhos geram a mesma chave e a junção fica com um só. Não lança se o mês já tem salário (categoria `sal`), se a chave existe como lápide (o dono apagou) ou, em conta Google, antes da primeira sincronização da sessão (senão duplicaria um salário lançado em outro aparelho).
- Salário lançado à mão ou pelo extrato passa por `descontarConsignados`: se veio o valor cheio da renda, tira a parcela; se já veio descontado, só registra a parcela.
- **Recomeçar do zero** (Ajustes → *Recomeçar os lançamentos*). O dono quer **tudo** apagado, não só lançamentos. Em conta Google, primeiro `sincronizarAgora` junta com o Drive — sem isso, o que só existia em outro aparelho voltava depois da exclusão; se não sincronizar, não apaga nada. Depois guarda `backup-antes-de-recomecar-AAAA-MM-DD.json` no Drive, troca cada lançamento por lápide `{del:1, u, zerado:1}`, limpa `cfg.deposits` e, marcados por padrão, `cfg.fixed` e `cfg.dividas`; "manter os gastos em dinheiro" vem desmarcado. Põe `openDate` e (se informado) `opening` nas contas, liga `cfg.salPausa` e sincroniza de novo. Ficam só contas, cartões, categorias, palavras aprendidas, renda, teto e metas. `jaTemChave` ignora lápide `zerado`, para salário e consignado poderem ser recriados. `salPausa` desliga quando a conferência grava uma linha de extrato do mês atual.
- Restaurar um backup com `antesDeRecomecar: true` renova o `u` dos lançamentos, para eles voltarem por cima das lápides. Em conta Google, a ficha lista os backups da pasta do Drive.
- Saldo inicial numa data: Ajustes → *Saldo de cada conta* → *Saldo inicial* (`openSaldoInicial`) grava `openDate` (lançamentos antes dela não contam no saldo) e `opening` (saldo no fim do dia anterior), e zera `adjust`.
- **Saque (regra do dono, 16/09/2026):** sai da conta corrente e vai para a carteira; não é gasto. Gasto é quando o dinheiro sai da carteira (lançado com *dinheiro*). No extrato, `classificarLinhaExtrato` transforma "saque" em `k:"t"` da conta para a conta do tipo `carteira` (sem carteira, "fora do app"); na fala, *saque/saquei/sacar* faz o mesmo (`parseOne`). Saques importados antes como gasto viram transferência uma vez (`cfg.m3`, em `migrarCfg`).
- Excluir conta pede um segundo toque (*Excluir mesmo?*): o botão fica onde as outras fichas têm *Cancelar* e *Depois*. Ao excluir, cartões e lançamentos daquela conta passam para a primeira conta que sobrou, e o `opening` vai junto — nada fica órfão.
- `repararContas()` (dentro de `migrarCfg`): se um cartão ou lançamento aponta para uma conta que não existe mais, ela volta vazia (id igual ao que estava guardado, "Conta corrente" quando o id é `cc` ou quando não há conta corrente) e uma ficha explica ao dono. Sem isso, `acctOf` mandava tudo para a primeira conta da lista. Aconteceu de verdade com o dono na v14: a conta corrente foi excluída com um toque e o salário só oferecia poupança e carteira.
- `cardOwed` ignora pagamento de fatura com `ref` anterior à primeira compra do cartão no app (fatura de antes do começo dos lançamentos): o dinheiro sai da conta, mas o limite não muda.
- **Renda com histórico:** `cfg.rendas = [{desde:"AAAA-MM", v}]` (`"2000-01"` = valor inicial; criado em `migrarCfg` a partir de `cfg.income`). **Todo cálculo por mês usa `rendaDoMes(ym)`**, nunca `cfg.income` direto — salário automático, consignado, 50-30-20, diagnóstico, meta. Ao mudar a renda em Ajustes, `perguntarDataRenda` pede o mês de início (sugere o mês que vem se o salário deste mês já entrou) e `definirRenda` grava; meses anteriores e salários já lançados não mudam. `cfg.income` fica com o valor do mês atual, só para a tela de Ajustes.
- Previsão do saldo (`projectMonth`): a renda que falta entra nos meses à frente; no mês atual, só antes do primeiro dia útil ou sem salário automático, e nunca durante a carga de extratos (`salPausa`).
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
- **Painel, logo no topo (pedido do dono, 25/09/2026):** `htmlBancoCartoes` — *No banco hoje* (soma das contas, com a carteira à parte e uma linha por conta) e *Lançado nos cartões* (a fatura do mês de cada cartão, com o que está em aberto e o limite livre). Tocar numa linha abre o extrato daquela conta ou cartão na aba Contas.
- **Cadastrar dívida fica em Lançar**, no fim, junto com as importações (`htmlDividasLancar`): é coisa que se faz uma vez por dívida. O acompanhamento (saldo, juros, simulação) continua em Análises.
- Abas: **Lançar** = fala, gasto/entrada na mão, transferência, importar extrato da conta, importar fatura/canhoto/boleto, cadastrar dívidas e a conferência. **Contas** = só ver: onde o dinheiro está, cartões (*Pagar fatura*, *Ver fatura*) e o extrato com *Repetidos*. **Ajustes** = *Saldo de cada conta e cartão* (*Saldo inicial*, *Corrigir saldo*, *Corrigir fatura*, *Editar*) e depois meta, cartões, categorias, fixos e dados.

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

- **Publicado:** `caderneta-v29` (25/09/2026). O que existe está descrito acima; os commits contam a ordem.
- **O que o dono está fazendo:** carregando os extratos da conta corrente e as faturas dos cartões (Visa, Mastercard, Elo) de janeiro a setembro de 2026, todos em PDF, no MacBook Air, depois de usar *Recomeçar do zero*. O passo a passo está no README, em *Importar meses anteriores*.
- **Documentos reais (15/09/2026):** o dono mandou, por iniciativa própria, o extrato da conta corrente do BB de jan/2026 e uma fatura Ourocard Mastercard. Até a v14 o extrato vinha com descrições erradas (lote e documento no lugar do nome) e o Rende Fácil contado como gasto e entrada; a fatura lia taxas de juros como compras. Os formatos estão descritos acima e foram conferidos com os dois PDFs, que **não** estão no repositório. A fatura recebida só tinha anuidade e desconto; compras parceladas no formato do BB foram testadas com linhas simuladas. Se outro documento falhar, peça a *amostra sem dados*.
- **Consignados:** ele tem dois — um pagando a 4ª de 12 em setembro de 2026, outro com a 1ª parcela em 01/10/2026. Depois do Recomeçar, precisam ser cadastrados de novo, com a data real do empréstimo e 0 já descontadas, antes de importar janeiro.
- **Não testado:** login no iPhone com o app instalado.
- **Regras que ele definiu** (não mude sem falar com ele): a renda líquida cai no primeiro dia útil; consignado sai do salário e aparece em Dívidas e empréstimos, sem descontar duas vezes; aumento de renda vale só dali em diante; duplicado nunca é apagado sem perguntar; "recomeçar" apaga tudo, menos contas, cartões, categorias e ajustes; compra no crédito conta no mês da compra e só sai da conta corrente no pagamento da fatura, uma vez só; importar extrato e fatura fica em Lançar (extrato antes da fatura), saldos e configuração em Ajustes, Contas só para ver movimentos; o dinheiro do BB Rende Fácil é dele, mas fica numa conta própria, para a conta corrente bater com o extrato; saque vai da conta para a carteira e só o gasto com o dinheiro é gasto; *Corrigir saldo* existe para toda conta e *Corrigir fatura* para todo cartão, por mês.

### Continuar no MacBook Air

As conversas até a v14 aconteceram num PC com Windows, que não fica mais ligado. O histórico daquelas conversas não vem junto: este arquivo e os commits são a memória do projeto.

1. No app do Claude, aba Code, escolha uma pasta (Documentos, por exemplo) e peça para clonar `https://github.com/rgbittencourt/caderneta` e ler este arquivo. Se o Mac oferecer instalar as ferramentas de linha de comando (git), o dono aceita.
2. No repositório: `git config user.name "Rogério Bittencourt"` e `git config user.email 302640362+rgbittencourt@users.noreply.github.com`.
3. Teste local: `python3 -m http.server 8765` na pasta e abra `http://localhost:8765`. Entre uma versão e outra, desregistre o service worker e limpe os caches do site no navegador; senão ele continua servindo o `leitor.js` antigo.
4. Publicar: suba `VERSAO` em `sw.js`, commit em português, `git push`. Na primeira vez, o GitHub pede autorização no navegador — quem autoriza é o dono. Confira no ar abrindo `https://rgbittencourt.github.io/caderneta/sw.js` e vendo a versão nova.

## Histórico

Começou como dois artifacts do Claude ("Caderneta da Casa" e "Meu Caixa"), por um erro de leitura do pedido: o dono queria um app só, com contas separadas. Os artifacts antigos servem apenas para exportar o backup e trazer os dados para cá.
