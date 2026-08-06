# Login social — Google e Facebook

## O que existe agora

Login social real para **cliente e dono**, nos dois provedores. Antes disto os
botões eram cenário: chamavam uma função `simulate()` que mostrava
"Conectando com Google..." por 1,8 s e não fazia nada.

Os botões só aparecem quando o provedor está configurado. Sem `GOOGLE_CLIENT_ID`
e `GOOGLE_CLIENT_SECRET`, o botão do Google simplesmente não é renderizado —
é proposital, botão que não leva a lugar nenhum custa mais confiança do que a
ausência dele.

## Como ligar

### Google

1. <https://console.cloud.google.com/apis/credentials>
2. **Criar credenciais → ID do cliente OAuth → Aplicativo da Web**
3. Em **URIs de redirecionamento autorizados**, adicione exatamente:
   - `http://localhost:3001/auth/social/google/callback` (desenvolvimento)
   - `https://SEU-DOMINIO-DA-API/auth/social/google/callback` (produção)
4. Copie o ID e o segredo para o `backend/.env`:

```env
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
API_PUBLIC_URL="http://localhost:3001"
```

O `redirect_uri` é montado a partir do `API_PUBLIC_URL` e precisa bater
**caractere por caractere** com o que está cadastrado no Google. Barra a mais
no final já é motivo de `redirect_uri_mismatch`.

### Facebook

1. <https://developers.facebook.com/apps> → criar app do tipo **Consumidor**
2. Adicionar o produto **Login do Facebook**
3. Em **URIs de redirecionamento OAuth válidos**:
   - `https://SEU-DOMINIO-DA-API/auth/social/facebook/callback`
4. Copiar para o `.env`:

```env
FACEBOOK_CLIENT_ID="..."
FACEBOOK_CLIENT_SECRET="..."
```

Duas restrições do Facebook que costumam pegar de surpresa:

- **Exige HTTPS** fora de `localhost`. Não dá para testar num IP de rede local
  ou num domínio sem certificado.
- **App Review.** Enquanto o app estiver em modo de desenvolvimento, só contas
  listadas como administrador, desenvolvedor ou testador conseguem entrar. Para
  o público geral, a permissão `email` precisa passar por revisão da Meta, o que
  leva dias e exige política de privacidade publicada e um vídeo demonstrando o
  fluxo.

Por isso o Google costuma ir ao ar bem antes do Facebook.

## Como funciona

```
Tela  --GET /auth/social/google?papel=client-->  API
API   --redirect-->  Google  --usuário autoriza-->
Google --redirect--> GET /auth/social/google/callback?code&state
API   troca code por token, lê o perfil, resolve a conta
API   --redirect--> /auth/callback#token=...  (frontend)
Tela  salva a sessão e limpa o fragmento da URL
```

### Regra de vínculo de conta

Aplicada igual para cliente e dono:

1. Já existe conta com aquele **id do provedor** → é ela, entra.
2. Existe conta com aquele **e-mail** → vincula **somente se o provedor
   confirmou o e-mail**.
3. Não existe nada → cria conta nova.

O passo 2 é o ponto sensível. Vincular só pela igualdade de e-mail, sem exigir
verificação, permite tomada de conta: o atacante cria uma conta no provedor
usando o e-mail da vítima e entra como ela. Quando o e-mail não vem verificado,
a API recusa e orienta a pessoa a entrar pelo fluxo normal e vincular depois.

Para **criar** conta de dono, a exigência é ainda maior: e-mail obrigatório e
verificado. A conta do dono controla agenda, dados pessoais de clientes e
faturamento — criar uma a partir de e-mail não confirmado é abrir a porta para
alguém ocupar o e-mail de um negócio real antes do próprio dono.

### Decisões de segurança

- **O `state` é um JWT assinado, válido por 10 minutos**, e carrega o papel
  pretendido. Protege contra CSRF de login e impede que alguém troque
  `papel=client` por `papel=owner` na URL de callback.
- **O token volta no fragmento (`#`), não na query string.** O fragmento não é
  enviado ao servidor: não entra em log de acesso nem em cabeçalho `Referer`.
  Token em query string vaza pelos dois caminhos, silenciosamente.
- **A página de callback apaga o fragmento do histórico** logo após ler, para
  o token não ficar num "voltar" nem num favorito.
- **Dono criado pelo social fica sem senha** (`passwordHash` nulo) em vez de
  receber o hash de uma string aleatória. Uma senha que ninguém conhece mas que
  existe é um alvo sem dono.
- **Erro do provedor nunca é propagado ao usuário** — a resposta pode conter o
  `client_secret` na URL. Vira mensagem genérica e log no servidor.

## O que ficou pendente

- **Vincular provedor a partir do perfil**, para quem já tem conta com senha e
  quer passar a entrar pelo Google. Hoje o vínculo só acontece durante o login,
  e exige e-mail verificado.
- **Desvincular** um provedor. Faltando isso, quem só tem login social e perde
  o acesso ao provedor perde a conta — o dono sem senha é o caso mais grave.
- **Cliente novo pelo social entra sem WhatsApp real** (o campo recebe o
  placeholder `email:...`). A resposta traz `cadastroIncompleto: true` para a
  tela pedir o número, mas **essa tela ainda não foi construída**. Sem WhatsApp
  o cliente não recebe confirmação nem lembrete de agendamento.
- **Nada disto foi exercitado contra o Google ou o Facebook de verdade.** Os 25
  testes cobrem a lógica com o provedor simulado; o fluxo real depende de
  credenciais que só existem na sua conta.
