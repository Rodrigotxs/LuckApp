# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [2.0.0] - 2026-08-02

Endurecimento de segurança e integridade, mais login social. É MAJOR porque a
aplicação passou a **recusar subir** com configuração que antes era aceita, e
porque uma migration remove dados que violam as novas garantias.

### ⚠️ Mudanças que quebram

- **A API não sobe sem `JWT_SECRET` real.** Valor vazio, de exemplo
  (`seu-secret-aqui`) ou com menos de 32 caracteres em produção agora aborta a
  inicialização. Gere com `openssl rand -hex 32`.
- **`CORS_ORIGINS` passou a ser obrigatória em produção.** Sem ela a API não
  sobe. Em desenvolvimento continua caindo no padrão `http://localhost:3000`.
- **A migration `20240701000000` apaga dados conflitantes.** Para poder criar a
  restrição de horário único e o e-mail único, ela remove o agendamento mais
  novo de cada par sobreposto e zera e-mails duplicados de clientes.
  Rode `npm run db:prevoo` antes para ver exatamente o que seria afetado.
- **`Owner.passwordHash` virou nulável** (migration `20240801000000`), para
  comportar dono que entrou por login social e nunca escolheu senha. Código que
  assumia a coluna como obrigatória precisa tratar `null`.
- **Swagger desligado em produção.** Continua disponível fora dela.

### Adicionado

- **Login social com Google e Facebook**, para cliente e dono. O botão só
  aparece quando o provedor está configurado. Passo a passo em
  [LOGIN-SOCIAL.md](LOGIN-SOCIAL.md).
- **Suíte de testes**, de zero para 156 casos, incluindo teste de integração
  contra PostgreSQL real e uma corrida com 8 conexões simultâneas disputando o
  mesmo horário.
- **CI no GitHub Actions** com PostgreSQL de serviço: typecheck, migrations,
  testes com cobertura, build do frontend e auditoria de dependência.
- **`dev.cmd`** — sobe Postgres, backend e frontend com um comando no Windows,
  corrigindo sozinho `.env` ausente, segredo fraco, dependência faltando e
  porta presa.
- **`npm run db:prevoo`** — mostra o que a migration de hardening removeria,
  sem alterar nada.
- Endpoint `GET /auth/social/providers`, que lista os provedores configurados.

### Corrigido

- **Double-booking.** A verificação de conflito fazia `SELECT` e depois
  `INSERT`; dois pedidos simultâneos passavam os dois. Agora uma constraint
  `EXCLUDE` no banco arbitra por dono, barbeiro e intervalo.
- **Login social era cenário.** Os botões chamavam uma função que exibia
  "Conectando com Google..." por 1,8 s e não fazia nada — não havia backend.
- **Rate limit não existia.** O módulo estava configurado, mas nenhum guard o
  aplicava: login, OTP e reset de senha estavam abertos.
- **OTP previsível.** Era gerado com `Math.random()`, sem limite de tentativas.
  Agora usa CSPRNG, comparação em tempo constante e trava após 5 erros.
- **Enumeração de conta.** O envio de OTP do dono respondia "não encontramos
  uma conta com este WhatsApp", permitindo varrer números.
- **Rota nova nascia pública em silêncio.** Os guards eram aplicados um a um, o
  que tornava o `@Public()` decorativo. Agora são globais.
- **Token de reset de senha era guardado em texto puro** no banco.
- **Agendamento fora do expediente.** A validação só existia na tela de slots;
  um POST direto marcava de madrugada ou em cima de um bloqueio.
- **Fidelidade acumulável sem atendimento.** Marcar concluído e pago e depois
  cancelar mantinha o ponto. E dois resgates simultâneos entregavam dois
  prêmios com um débito só.
- **E-mail de cliente duplicado** tornava o login por e-mail ambíguo.
- **`schema.prisma` fora de sincronia com as migrations.** A migration do login
  social criava as colunas, mas o schema não as declarava — o client gerado
  saía sem elas e o build quebrava. Schema e migrations conferidos campo a
  campo.
- **Stack trace vazava para o usuário** em erro não tratado.
- **Zoom bloqueado no celular** (`maximumScale=1`), quebrando a WCAG 1.4.4.
- Contraste abaixo de 4.5:1 no divisor "OU" da tela de login.

### Segurança

- `helmet`, CORS por variável de ambiente e desligamento gracioso.
- Vínculo de login social a conta existente exige e-mail **verificado** pelo
  provedor — sem isso, criar conta no provedor com o e-mail da vítima daria
  acesso à conta dela.
- O `state` do OAuth é um JWT assinado e carrega o papel, impedindo trocar
  `client` por `owner` na URL de retorno.
- O token de sessão volta no fragmento da URL, que não entra em log de acesso
  nem em cabeçalho `Referer`.

### Ainda não verificado

Honestidade sobre o alcance dos testes:

- O E2E do Playwright está escrito mas **nunca foi executado**.
- O fluxo OAuth **nunca rodou contra o Google ou o Facebook reais** — os 25
  testes usam provedor simulado.
- O `EmailService` **não envia e-mail**. Pior: definir `SMTP_HOST` faz ele
  registrar "Enviado" no log sem enviar nada. Deixe a variável vazia até a
  implementação existir.
- Cliente que entra pelo social fica sem WhatsApp real, e a tela que pede o
  número ainda não existe — sem ela, não há confirmação nem lembrete.

## [1.0.0] - anterior

Versão inicial: agendamento multi-tenant e multi-unidade, com barbeiros
individuais, fidelidade, financeiro e integrações de WhatsApp e Google Calendar.
