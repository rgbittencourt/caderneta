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

**Importar fatura do cartão, canhoto ou boleto** (aba Lançar): fotografe ou escolha o arquivo, em PDF ou foto. O app lê no próprio aparelho, monta os lançamentos e mostra para você conferir: o que parece já lançado vem desmarcado, e as parcelas da fatura (ex.: `03/10`) já reservam as seguintes. A compra no cartão conta como gasto no mês em que foi feita e não tira dinheiro da conta corrente; só o pagamento da fatura tira.

**Importar extrato da conta** (aba Ajustes, no topo): escolha a conta e o PDF (ou OFX/CSV). A conferência aparece ali mesmo e traz o que só o banco mostra — tarifa, juros, IOF, débito automático. O pagamento da fatura sai da conta, mas não conta como gasto; o BB Rende Fácil fica de fora, porque é o mesmo dinheiro da conta. Escolheu o documento na aba errada? O app avisa e leva para a certa. O PDF baixado do app do banco é o que lê melhor. Boleto: pelo código de barras ou digitando a linha digitável. Em canhoto e boleto, diga em *Pago com* como pagou — débito, Pix, boleto ou um cartão —, e os lançamentos daquele documento já vêm assim; na conferência ainda dá para mudar um a um.
- **OFX e CSV:** se o banco oferece "exportar extrato" nesses formatos, também servem — é um bom plano B quando o PDF não abre.
- **PDF com senha** (comum em fatura e extrato de banco): o app pede a senha e abre o arquivo ali mesmo, sem guardar.
- **Foto de extrato ou fatura:** uma página por vez. Depois de ler a primeira, toque em *Fotografar mais uma página*.
- **Não conseguiu ler?** O app mostra uma *amostra sem seus dados* — números viram 9 e nomes viram x. Copie e mande ao Claude para ele ajustar o leitor ao seu banco.

**Importar meses anteriores** (extratos e faturas em PDF):
1. **Recomece** (recomendado): Ajustes → *Recomeçar os lançamentos*. O app sincroniza com o Drive, guarda um backup lá e apaga, em todos os aparelhos, os lançamentos, os gastos fixos e as dívidas (dá para manter os dois últimos, e os gastos em dinheiro, desmarcando/marcando na ficha). Ficam contas, cartões, categorias, renda, teto e metas. Ali mesmo, informe a data do primeiro extrato (01/01/2026) e o saldo de cada conta no dia anterior — o *saldo anterior* que aparece nesse extrato. O salário automático fica pausado até você importar o extrato do mês atual.
2. Para acertar o saldo inicial depois: Ajustes → *Saldo de cada conta* → **Saldo inicial**. Para acertar o saldo de hoje: **Corrigir saldo**.
3. Em Ajustes, confira os cartões (dia de fechamento e de vencimento) e as contas, inclusive poupança ou investimento.
4. Cadastre os consignados com a data real do empréstimo e 0 parcelas já descontadas, e desmarque *Lançar o depósito* — ele virá no extrato.
5. Teste com um documento só (o extrato de janeiro). Se não ler, mande a amostra sem dados.
6. Os extratos da conta corrente, **do mais antigo para o mais novo** (Ajustes → *Importar extrato da conta*). Depois, as faturas de cada cartão (Lançar → *Importar fatura do cartão*), em qualquer ordem. Nada é descontado duas vezes: as compras da fatura não tiram dinheiro da conta, e o pagamento do extrato não conta como gasto.
7. O BB escreve só "Pagto cartão crédito", sem dizer o cartão. Se a fatura ainda não foi importada, a conferência avisa *confira o cartão*; quando a fatura chegar, o app liga o pagamento ao cartão cuja fatura tem o mesmo valor. O extrato de janeiro traz o pagamento das faturas de dezembro: ele sai da conta corrente e não mexe no limite do cartão. Não precisa importar as faturas de dezembro.
8. Depois de cada extrato da conta, a conferência do saldo deve dizer "está batendo". Se não bater, falta ou sobra algo naquele mês.
9. No extrato, pagamento de fatura e aplicação ou resgate não contam como gasto nem renda. Parcelas que o app já reservou vêm desmarcadas sozinhas. O salário do extrato precisa estar na categoria *Salário* para o desconto do consignado ser registrado.
10. Errou? Ajustes → *Restaurar de um backup* lista os backups do Drive; o de antes de recomeçar traz tudo de volta.

**Fixo todo mês:** marque na conferência — ou em *Tornar fixo*, ao editar um lançamento — o que se repete todo mês: aluguel, escola, assinaturas.

**Salário:** a renda líquida de Ajustes entra sozinha no primeiro dia útil de cada mês (pulando fim de semana e feriado nacional), na conta escolhida ali. Em mês com parcela de consignado, ela entra já descontada. Se você lançar o salário à mão, o app não lança de novo. Dá para desligar em Ajustes.
Teve aumento ou correção? Mude o valor em Ajustes: o app pergunta a partir de que mês vale. Os meses anteriores e os salários já lançados continuam com o valor antigo, e o histórico aparece embaixo do campo.

**Método 50-30-20** (aba Meta): divide a renda líquida em Necessidades, Desejos e Futuro. A rosca mostra a meta (anel de fora) e para onde a renda foi (anel de dentro); abaixo, o que tem em cada grupo. Os percentuais e o grupo de cada categoria são ajustáveis.

**Análises** (no menu lateral, ou em *Mais* no celular):
- **Diagnóstico do mês, com sugestões:** o ritmo contra o teto, o 50-30-20, quanto da renda já sai comprometida, os gastos que parecem fixos, o cartão perto do limite e a categoria que vem subindo.
- **Compras parceladas:** quando cada uma termina e quanto sobra por mês depois.
- **Gastos por cartão e forma de pagamento.**
- **Dívidas:** o app estima o saldo e os juros que faltam, mostra quando termina e quanto você economiza adiantando um pouco por mês.
  - **Consignado:** informe o valor do empréstimo, a data, a conta onde caiu, o número de parcelas e o valor da parcela. O empréstimo entra no saldo da conta, sem contar como renda. A partir do salário seguinte, o salário entra já com a parcela descontada, e a parcela aparece em *Dívidas e empréstimos* — uma vez por mês, até a última. Se ele já vinha sendo descontado, diga quantas parcelas saíram antes deste mês. Sem o juro, o app calcula.
  - **Empréstimo ou financiamento pago por boleto ou débito:** diga *Já estou pagando* — "parcela 4 de 12" — ou *Ainda vou começar*, com a data da primeira. A parcela entra sozinha nos gastos fixos até a última.

**Extrato** (aba Contas): é o lugar de ver os movimentos. Toque numa conta ou em *Ver fatura* de um cartão. Na conta, aparece o saldo anterior, cada entrada e saída com o saldo depois dela, e o saldo no fim do mês — só o que sai da conta, sem as compras no crédito. No cartão, a fatura daquele mês, com compras que podem ser do mês anterior. Toque em qualquer linha para corrigir o lançamento. Importar e acertar saldo ficam em Ajustes (extrato) e em Lançar (fatura).
- **Conferência do saldo:** depois de importar um extrato, quando ele traz o saldo impresso pelo banco, o app compara com o que calculou, mostra a diferença e pergunta se pode acertar.
- **Repetidos** (no alto do extrato): procura, no mês, dois lançamentos iguais no mesmo lugar. Ele mostra os dois lado a lado e pergunta se é a mesma coisa; só apaga se você mandar. Parcelas de compras parceladas ficam de fora dessa busca.

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
