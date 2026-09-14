# Caderneta

Controle de gastos por fala, para uso pessoal e familiar. **Um app só:** cada pessoa entra com a própria conta Google, e os dados dela ficam no Google Drive dela. Ninguém vê os dados de ninguém.

**Endereço:** https://rgbittencourt.github.io/caderneta/

## Usar

**Instalar**
- **iPhone e iPad:** abra o endereço no Safari → Compartilhar (quadrado com seta para cima) → *Adicionar à Tela de Início*.
- **Android:** abra no Chrome → *Instalar app* (ou menu ⋮ → Instalar app).
- **Computador e Mac:** abra no Chrome ou no Edge → ícone de instalar no fim da barra de endereço.

**Entrar:** toque em *Entrar com Google* e deixe marcada a permissão do Google Drive.

**Lançar falando** (pelo 🎤 do teclado ou pelo botão Microfone), separando lançamentos com ponto final:
- "trinta e cinco reais, almoço no restaurante, cartão de crédito Visa"
- "trezentos reais na loja de ferramentas, em três vezes no Mastercard"
- "transferi duzentos reais para o João"
- "caiu o salário, três mil reais" — palavras como *caiu*, *recebi* e *salário* viram entrada

**Ler documento** (aba Lançar): fotografe ou escolha a fatura do cartão, o extrato do banco, um canhoto ou um boleto, em PDF ou foto. O app lê no próprio aparelho, monta os lançamentos e mostra para você conferir: o que parece já lançado vem desmarcado, e as parcelas da fatura (ex.: `03/10`) já reservam as seguintes. O PDF baixado do app do banco é o que lê melhor. Boleto: pelo código de barras ou digitando a linha digitável. Em canhoto e boleto, diga em *Pago com* como pagou — débito, Pix, boleto ou um cartão —, e os lançamentos daquele documento já vêm assim; na conferência ainda dá para mudar um a um.
- **PDF com senha** (comum em fatura e extrato de banco): o app pede a senha e abre o arquivo ali mesmo, sem guardar.
- **Foto de extrato ou fatura:** uma página por vez. Depois de ler a primeira, toque em *Fotografar mais uma página*.
- **Não conseguiu ler?** O app mostra uma *amostra sem seus dados* — números viram 9 e nomes viram x. Copie e mande ao Claude para ele ajustar o leitor ao seu banco.

**Importar meses anteriores** (extratos e faturas em PDF):
1. Em Ajustes, confira os cartões (dia de fechamento e de vencimento) e as contas, inclusive poupança ou investimento.
2. Cadastre os consignados antes, com a data real do empréstimo e 0 parcelas já descontadas, e desmarque *Lançar o depósito* — ele virá no extrato.
3. Teste com um documento só (o extrato de janeiro). Se não ler, mande a amostra sem dados.
4. Mês a mês, **do mais antigo para o mais novo**: primeiro a fatura de cada cartão (no extrato do cartão, *Importar fatura*), depois o extrato da conta corrente. A fatura vai sozinha para o mês das compras.
5. No primeiro extrato da conta, aceite *Acertar* o saldo: é o ponto de partida. Nos seguintes, a conferência do saldo deve dizer "está batendo"; se não bater, falta ou sobra algo naquele mês.
6. No extrato, pagamento de fatura e aplicação ou resgate não contam como gasto nem renda. Parcelas que o app já reservou vêm desmarcadas sozinhas. O salário que vier no extrato precisa estar na categoria *Salário* para o desconto do consignado ser registrado.

**Fixo todo mês:** marque na conferência — ou em *Tornar fixo*, ao editar um lançamento — o que se repete todo mês: aluguel, escola, assinaturas.

**Salário:** a renda líquida de Ajustes entra sozinha no primeiro dia útil de cada mês (pulando fim de semana e feriado nacional), na conta escolhida ali. Em mês com parcela de consignado, ela entra já descontada. Se você lançar o salário à mão, o app não lança de novo. Dá para desligar em Ajustes.

**Método 50-30-20** (aba Meta): divide a renda líquida em Necessidades, Desejos e Futuro. A rosca mostra a meta (anel de fora) e para onde a renda foi (anel de dentro); abaixo, o que tem em cada grupo. Os percentuais e o grupo de cada categoria são ajustáveis.

**Análises** (no menu lateral, ou em *Mais* no celular):
- **Diagnóstico do mês, com sugestões:** o ritmo contra o teto, o 50-30-20, quanto da renda já sai comprometida, os gastos que parecem fixos, o cartão perto do limite e a categoria que vem subindo.
- **Compras parceladas:** quando cada uma termina e quanto sobra por mês depois.
- **Gastos por cartão e forma de pagamento.**
- **Dívidas:** o app estima o saldo e os juros que faltam, mostra quando termina e quanto você economiza adiantando um pouco por mês.
  - **Consignado:** informe o valor do empréstimo, a data, a conta onde caiu, o número de parcelas e o valor da parcela. O empréstimo entra no saldo da conta, sem contar como renda. A partir do salário seguinte, o salário entra já com a parcela descontada, e a parcela aparece em *Dívidas e empréstimos* — uma vez por mês, até a última. Se ele já vinha sendo descontado, diga quantas parcelas saíram antes deste mês. Sem o juro, o app calcula.
  - **Empréstimo ou financiamento pago por boleto ou débito:** diga *Já estou pagando* — "parcela 4 de 12" — ou *Ainda vou começar*, com a data da primeira. A parcela entra sozinha nos gastos fixos até a última.

**Extrato** (aba Contas): escolha a conta ou o cartão. Na conta, aparece o saldo anterior, cada entrada e saída com o saldo depois dela, e o saldo no fim do mês; no cartão, a fatura daquele mês. Toque em qualquer linha para corrigir o lançamento. No alto do extrato há três atalhos:
- **Importar extrato / Importar fatura:** já abre o leitor sabendo de que conta ou cartão é o documento — é só escolher o arquivo ou a foto.
- **Corrigir saldo:** quando o extrato traz o saldo impresso pelo banco, o app compara com o que ele calculou, mostra a diferença e pergunta se pode acertar. Faça isso depois de conferir os lançamentos.
- **Repetidos:** procura, no mês, dois lançamentos iguais no mesmo lugar. Ele mostra os dois lado a lado e pergunta se é a mesma coisa; só apaga se você mandar. Parcelas de compras parceladas ficam de fora dessa busca.

**Contas a pagar** (aba Mês): tudo o que vence no mês, em ordem de data — gastos fixos, parcelas de dívidas, o consignado que sai do salário e a fatura de cada cartão. Cada linha mostra o dia, o valor e como está: *pago*, *vence hoje* ou *atrasada*. O botão *Lançar* dá baixa no gasto fixo, e *Pagar* abre o pagamento da fatura. No Painel aparece um resumo, *Próximos vencimentos*, com o que vence em até dez dias e o que já passou.

**Sem internet** funciona normalmente: tudo é salvo no aparelho e vai para o Drive quando a conexão volta. O acesso ao Drive dura cerca de uma hora; depois disso aparece *Sincronizar* no topo — um toque e pronto.

## Onde ficam os dados

No aparelho e no Google Drive de cada pessoa, numa pasta chamada **Caderneta** (`caderneta-dados.json`, mais uma cópia por mês, `backup-AAAA-MM.json`). Não existe servidor. O app só enxerga os arquivos que ele mesmo criou no Drive. Detalhes na [política de privacidade](privacidade.html).

## Atualizações

Não precisa reinstalar nunca. Ao abrir com internet, o app já abre atualizado ou mostra *Nova versão da Caderneta · Atualizar* — um toque. Os dados não são afetados.

## Custos

Nenhum. O GitHub Pages é gratuito, o login e o acesso ao Drive são gratuitos, e os dados usam o espaço gratuito do Drive de cada pessoa (poucos megabytes por ano).

## Pedir mudanças

Pelo Claude Code, numa conversa aberta na pasta deste repositório, em português, do jeito que você fala. O [`CLAUDE.md`](CLAUDE.md) tem tudo o que a conversa precisa saber.

**Em outro computador:** peça ao Claude, numa conversa nova, para clonar `https://github.com/rgbittencourt/caderneta` e ler o `CLAUDE.md`. Na primeira publicação feita daquele computador, o GitHub pede sua autorização uma vez, pelo navegador.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | O app inteiro: HTML, CSS e JavaScript num arquivo só, sem etapa de build |
| `sw.js` | Service worker: guarda o app para uso offline e cuida das atualizações |
| `manifest.webmanifest` | Nome, ícones e modo tela cheia do app instalado |
| `config.js` | ID do cliente OAuth do Google (público por natureza, não é segredo) |
| `privacidade.html`, `termos.html` | Páginas cadastradas na tela de consentimento do Google |
| `icons/` | Ícones do app |
| `CLAUDE.md` | Guia técnico para quem for mexer no código, inclusive o Claude |
