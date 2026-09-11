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

**Ler documento** (aba Lançar): fotografe ou escolha a fatura do cartão, o extrato do banco, um canhoto ou um boleto, em PDF ou foto. O app lê no próprio aparelho, monta os lançamentos e mostra para você conferir: o que parece já lançado vem desmarcado, e as parcelas da fatura (ex.: `03/10`) já reservam as seguintes. O PDF baixado do app do banco é o que lê melhor. Boleto: pelo código de barras ou digitando a linha digitável.

**Fixo todo mês:** marque na conferência — ou em *Tornar fixo*, ao editar um lançamento — o que se repete todo mês: aluguel, escola, assinaturas.

**Método 50-30-20** (aba Meta): divide a renda líquida em Necessidades, Desejos e Futuro. Os percentuais e o grupo de cada categoria são ajustáveis.

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
