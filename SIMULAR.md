# Como simular a Barbearia Luck localmente

Guia passo a passo para rodar tudo (backend + frontend + banco) na sua máquina e testar os fluxos end-to-end.

## Pré-requisitos

Confira antes de começar:

```bash
node -v      # precisa >= 20
docker -v    # precisa Docker + docker compose
git -v
```

Se faltar Node 20, use [nvm](https://github.com/nvm-sh/nvm): `nvm install 20 && nvm use 20`.

## Passo 1 — Clonar

```bash
git clone https://github.com/Rodrigotxs/LuckApp.git
cd LuckApp
git checkout claude/barbearia-luck-app-LzpRD
```

## Passo 2 — Subir Postgres + Redis

```bash
docker compose up -d
docker compose ps    # confirme que ambos ficaram "healthy"
```

## Passo 3 — Backend

Em um terminal:

```bash
cd backend
npm install
npx prisma migrate deploy      # cria as tabelas
npx prisma db seed             # dono demo + 2 unidades + 3 barbeiros + 4 serviços
npm run start:dev              # sobe em http://localhost:3001
```

Aguarde a mensagem `🚀 Barbearia Luck API rodando na porta 3001`. Docs Swagger em http://localhost:3001/api/docs.

**Todas as integrações externas rodam em modo mock:**
- **WhatsApp:** cada mensagem que seria enviada aparece no log do backend com o prefixo `[WhatsApp] API não configurada. Mensagem para <numero>: <texto>`. Copie o código OTP direto de lá.
- **E-mail:** mesmo comportamento, prefixo `[E-mail] SMTP não configurado`.
- **Google Calendar:** o botão de conectar mostra estado desconectado (é OK, só não sincroniza eventos externos).

## Passo 4 — Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev    # sobe em http://localhost:3000
```

Abra http://localhost:3000 no navegador (use o **modo responsivo** F12 → toolbar de dispositivo para simular tela de celular).

## Passo 5 — Credenciais de teste

Após o seed:

- **Dono demo:** `demo@barbearialuck.com` / `123456`
- **Owner ID (para link público):** aparece no fim do seed, algo tipo `http://localhost:3000/agendar/<uuid>` — mas nossa versão atual é SPA, então o link direto é só `http://localhost:3000/`.

## Passo 6 — Checklist de smoke tests

### A) Fluxo do cliente novo (WhatsApp)

1. Abre `/` → **Sou cliente**
2. Escolhe unidade **Atlântica**
3. Preenche nome + WhatsApp qualquer (ex.: `11987654321`) → **Enviar código**
4. **Vai no terminal do backend** e copia o código de 6 dígitos do log
5. Digite o código na tela de OTP
6. Escolhe serviço (ex.: **Combo Premium**)
7. Escolhe barbeiro (ex.: **Diego Monteiro**)
8. Escolhe uma data + horário livre (os slots vêm reais do backend)
9. Confirma → **CONFIRMAR VIA WHATSAPP**
10. Deve ver "Agendamento enviado!"

### B) Fluxo do cliente novo (E-mail)

Igual ao A, mas no passo 3 escolha o toggle **E-MAIL** e informe um endereço. O código também sai no log do backend, prefixo `[E-mail]`.

### C) Fluxo do dono

1. Volta para `/` (splash)
2. **Já tem conta? Entrar** → toggle **FUNCIONÁRIO** → e-mail `demo@barbearialuck.com` + senha `123456`
3. Deve cair no **Dashboard** com os agendamentos que você criou no fluxo A/B
4. Toque no botão ↻ no header (com badge vermelha se houver pedidos de reagendamento pendentes)
5. Toque no ícone 📅 → **AgendaEditor** → bloqueie um dia inteiro e um slot; volta pro dashboard e cria um novo agendamento como cliente para conferir que o slot bloqueado sumiu
6. Toque no `+` → **Agendar atendimento** → cria manualmente um agendamento para outro cliente (preenche nome + WhatsApp; o backend cria o Client automaticamente)
7. No dashboard, toque num agendamento e mude status para **Concluído** e pagamento para **Pago** (via Swagger ou próxima release do frontend com botões)
8. Volta ao cliente e verifica que os pontos de fidelidade subiram

### D) Fluxo de reagendamento

1. Como cliente, vá em **HOME** → toque no ícone 📅 (calendário) → escolha novo horário → **SOLICITAR ALTERAÇÃO**
2. Log do backend mostra a mensagem WhatsApp que iria pro dono
3. Como dono, dashboard → badge com "1" → toque para ver o pedido → **APROVAR E REMARCAR**
4. Log do backend mostra mensagem de confirmação indo pro cliente

### E) Relatório financeiro

1. Como dono → tela de finance
2. Marque alguns agendamentos como COMPLETED+PAID (via Swagger `PATCH /appointments/:id/status` e `.../payment`)
3. Volta na tela — o total e o gráfico devem atualizar
4. Toque em **EXPORTAR BASE (EXCEL/CSV)** → deve baixar `relatorio-barbearia-luck-<periodo>.csv`

## Troubleshooting

| Sintoma | Causa provável | Solução |
|---|---|---|
| `ECONNREFUSED 5432` no backend | Postgres não subiu | `docker compose logs postgres` |
| `prisma migrate` reclama | Banco não vazio | `docker compose down -v && docker compose up -d` |
| Frontend não conecta com backend | CORS ou URL | Confirme `NEXT_PUBLIC_API_URL=http://localhost:3001` em `frontend/.env.local` |
| OTP nunca chega | Log do WhatsApp está no terminal errado | Verifique o terminal do `npm run start:dev` |
| Login OTP dono retorna erro | Nunca cadastrou WhatsApp | Use email+senha `demo@barbearialuck.com`/`123456` primeiro |
| Botão Google Calendar não funciona | Credenciais ausentes | Deixe pra depois (integração real precisa `GOOGLE_CLIENT_ID/SECRET`) |

## Endpoints úteis para debug

Todos autenticados exigem `Authorization: Bearer <token>` — pegue no localStorage do browser (`token`).

- `http://localhost:3001/api/docs` — Swagger interativo
- `GET /appointments/owner` — todos agendamentos
- `GET /reschedule-requests/owner` — pedidos pendentes
- `GET /availability/blocks` — bloqueios ativos
- `GET /loyalty/me` — pontos do cliente logado
- `GET /financial/summary?period=week` — resumo financeiro

## Parar tudo

```bash
# Nos terminais do backend e frontend: Ctrl+C
docker compose down          # mantém volume (dados persistem)
docker compose down -v       # remove volume (banco zera)
```
