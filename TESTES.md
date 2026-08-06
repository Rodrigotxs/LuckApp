# Testes e qualidade — Barbearia Luck

## Resumo rápido

| Camada | Comando | Precisa de banco? |
|---|---|---|
| Unitários do backend | `cd backend && npm test` | não |
| Integração no PostgreSQL | `cd backend && npm run test:db` | sim |
| Cobertura | `cd backend && npm run test:cov` | sim (senão pula a integração) |
| Tipos | `npm run typecheck` (backend e frontend) | não |
| Build do frontend | `cd frontend && npm run build` | não |
| E2E | `cd frontend && npm run test:e2e` | sim, + API no ar |

## Rodando tudo do zero

```bash
docker compose up -d

cd backend
cp .env.example .env
# gere o segredo — a API recusa subir com o valor de exemplo
sed -i "s|JWT_SECRET=\"\"|JWT_SECRET=\"$(openssl rand -hex 32)\"|" .env
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm test                 # unitários
npm run test:cov         # com integração e cobertura
npm run start:dev

# noutro terminal
cd frontend
npm install
npx playwright install
npm run test:e2e
```

## O que cada suíte cobre

**`src/common/security/otp.util.spec.ts`** — geração de OTP e tokens.
Amarra que o código usa CSPRNG, mantém os 6 dígitos com zero à esquerda, que a
comparação é em tempo constante e que o token de reset guardado é o hash, não o
valor enviado.

**`src/config/env.validation.spec.ts`** — configuração.
Garante que a API não sobe com segredo ausente, de exemplo, curto demais em
produção, ou com CORS herdando localhost em produção.

**`src/modules/auth/auth.service.spec.ts`** — autenticação.
Senha sempre com bcrypt e nunca devolvida na resposta; mensagem idêntica para
conta inexistente e senha errada; contador de tentativas de OTP; ausência de
enumeração de conta; token de reset hasheado.

**`src/modules/appointments/appointments.service.spec.ts`** — agendamento.
Isolamento entre barbearias (IDOR), validação de expediente e bloqueio na
criação, tradução da violação de constraint em 409, e integrações que falham
sem derrubar o agendamento.

**`src/modules/loyalty/loyalty.service.spec.ts`** — fidelidade.
Idempotência da concessão, reversão do ponto quando o atendimento é desfeito, e
resgate atômico que não entrega dois prêmios em chamadas concorrentes.

**`test/rotas-protegidas.spec.ts`** — guarda estrutural.
Falha se alguma rota pública deixar de declarar `@Public()`, se a lista de rotas
públicas mudar sem revisão, ou se uma rota de autenticação ficar sem rate limit.
É o teste que impede a volta do buraco original, em que uma rota nova nascia
pública por esquecimento.

**`test/integration/agendamento-concorrente.spec.ts`** — PostgreSQL real.
Cobre a constraint de sobreposição em todas as formas de colisão, confirma que
horário adjacente e horário cancelado continuam livres, que barbeiros
diferentes não colidem entre si, e roda uma corrida com 8 conexões simultâneas
no mesmo horário para provar que só uma entra.

**`frontend/e2e/`** — ponta a ponta.
Roda nos três viewports (celular, tablet, desktop) no mesmo comando. Verifica
ausência de scroll horizontal, que nada vaza da janela, que o zoom não está
bloqueado, que nenhum controle é escondido por media query — a armadilha de
divergência web/mobile do workspace — e os contratos de API que a tela consome.

## Convenções

- Todo teste que corrige um bug tem um comentário dizendo qual regressão ele
  impede. Teste sem contexto vira teste deletado na primeira falha chata.
- Os unitários usam SWC e não dependem de `prisma generate`, então rodam mesmo
  em ambiente sem acesso ao CDN de engines do Prisma.
- Os testes de integração e E2E se **pulam sozinhos** quando o banco ou a API
  não estão disponíveis, em vez de falharem em vermelho e mascararem regressões
  de verdade.
