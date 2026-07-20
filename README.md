# Barbearia Luck

Sistema de agendamento multi-tenant, multi-unidade, com barbeiros individuais. Backend NestJS + Frontend Next.js mobile-first fiel ao design entregue pelo Claude Design.

## Stack

- **Backend:** Node.js + TypeScript + NestJS + PostgreSQL + Prisma ORM
- **Frontend:** React + Next.js 16 (App Router) + Tailwind + CSS puro (design tokens)
- **Auth:** JWT — cliente por OTP WhatsApp, dono por e-mail+senha **OU** OTP WhatsApp
- **Integrações:** Google Calendar (OAuth 2.0) + WhatsApp (Evolution API / Twilio)
- **Infra:** Docker Compose (PostgreSQL + Redis)

## Módulos do backend

| Módulo | Responsabilidade |
|---|---|
| `auth` | Registro/login owner (e-mail+senha ou WhatsApp OTP), OTP cliente, reset de senha |
| `owners` | Perfil do dono (dados pessoais, meta, unidade) |
| `clients` | Cadastro do cliente + self-service (PATCH /clients/me) + listagem para o dono |
| `units` | CRUD de unidades (filiais) |
| `barbers` | CRUD de barbeiros por unidade (rating, avatar) |
| `services` | CRUD de serviços do dono + horários de funcionamento |
| `appointments` | CRUD de agendamentos + cálculo de slots disponíveis |
| `availability` | Bloqueios de agenda (dia inteiro ou slot específico) |
| `reschedule` | Pedidos de reagendamento pendentes (cliente propõe, dono aprova/recusa) |
| `loyalty` | Programa de fidelidade (1 ponto por atendimento concluído+pago) |
| `financial` | Resumo, relatório, meta, export CSV |
| `integrations/google-calendar` | OAuth + sincronização de eventos |
| `integrations/whatsapp` | Envio de OTP/confirmação/lembrete + cron 1 h antes |

## Modelo de dados (diagrama simplificado)

```
Owner ─┬── Unit ── Barber ─┬── Appointment ── Service
       ├── Service          │
       ├── WorkingHours     │
       ├── AvailabilityBlock (opcional: por Unit + Barber)
       └── RescheduleRequest ┘

Client (global) ── Appointment
Client ── RescheduleRequest
Client ── loyaltyPoints (Int)
```

## Identidade visual — tokens (`frontend/app/globals.css`)

| Token | Hex | Uso |
|---|---|---|
| `--red` | `#C0392B` | CTAs, bordas de destaque, cor do cliente |
| `--red-soft` | `#C0392B14` | Fundos suaves de estado ativo |
| `--navy` | `#1A3A6B` | CTAs do dono, elementos secundários |
| `--navy-soft` | `#1A3A6B14` | Fundos suaves do dono |
| `--bg` / `--bg2` | `#FFFFFF` / `#F5F5F5` | Fundo principal / secundário |
| `--gray` / `--gray-soft` | `#BDBDBD` / `#E8E8E8` | Divisores / borders |
| `--ink` | `#2C2C2C` | Texto principal |
| `--whatsapp` | `#25D366` | CTA WhatsApp |

**Tipografia:** Playfair Display (títulos), Inter (corpo), Bebas Neue (eyebrow), JetBrains Mono (código/hora), Dancing Script (assinatura "Luck").

## Estrutura

```
barbearia-luck/
├── backend/          # NestJS API (porta 3001)
├── frontend/         # Next.js SPA (porta 3000)
└── docker-compose.yml
```

O frontend é uma SPA client-side (`app/page.tsx`) que age como state-machine de telas — o mesmo padrão do handoff do Claude Design. Todas as telas ficam em `frontend/components/screens/` e o design system em `frontend/components/luck/`.

## Como rodar

### 1. Infraestrutura
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma migrate deploy   # aplica migrations
npx prisma db seed          # cria dono demo + 2 unidades + 3 barbeiros + 4 serviços
npm run start:dev
```
- API: http://localhost:3001
- Docs Swagger: http://localhost:3001/api/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
- App: http://localhost:3000

## Conta demo (após `prisma db seed`)

- E-mail: `demo@barbearialuck.com`
- Senha: `123456`
- 2 unidades (Atlântica RJ, Bom Pastor SP), 3 barbeiros e 4 serviços pré-configurados.

## Endpoints principais

### Auth
- `POST /auth/owner/register` · `POST /auth/owner/login`
- `POST /auth/owner/send-otp` · `POST /auth/owner/verify-otp` **(novo — login por WhatsApp)**
- `POST /auth/owner/password-reset/request` · `POST /auth/owner/password-reset/confirm` **(novo)**
- `POST /auth/client/send-otp` · `POST /auth/client/verify-otp`
- `GET /auth/google` (OAuth) · `GET /auth/google/callback`

### Unidades
- `GET /units/public/:ownerId` — lista pública
- `GET|POST|PATCH|DELETE /units` (autenticado)

### Barbeiros
- `GET /barbers/public/:ownerId?unitId=` — lista pública filtrada
- `GET|POST|PATCH|DELETE /barbers` (autenticado)

### Serviços
- `GET /services/public/:ownerId` (público) · `GET|POST|PATCH|DELETE /services`

### Clientes
- `GET /clients` (dono lista clientes)
- `GET /clients/me` · `PATCH /clients/me` **(novo — self-service)**

### Agendamentos
- `GET /appointments/available-slots?ownerId&date&serviceId&barberId&unitId`
- `POST /appointments` (aceita `unitId` / `barberId` opcionais)
- `GET /appointments/owner` · `GET /appointments/client`
- `PATCH /appointments/:id/status` · `PATCH /appointments/:id/payment` · `DELETE /appointments/:id`

### Disponibilidade **(novo)**
- `GET /availability/blocks?from=&to=&barberId=`
- `POST /availability/blocks` (intervalo custom)
- `POST /availability/blocks/day` (dia inteiro)
- `POST /availability/blocks/slot` (slot específico)
- `DELETE /availability/blocks/:id`

### Reagendamentos **(novo)**
- `POST /reschedule-requests` — cliente solicita
- `GET /reschedule-requests/client` — cliente lista seus pedidos
- `GET /reschedule-requests/owner?status=` — dono lista recebidos
- `PATCH /reschedule-requests/:id` — dono aprova/recusa
- `DELETE /reschedule-requests/:id` — cliente cancela pedido pendente

### Fidelidade **(novo)**
- `GET /loyalty/me` — status (pontos, meta, recompensa)
- `POST /loyalty/me/redeem` — resgatar recompensa (10 pts → corte grátis)

### Financeiro
- `GET /financial/summary?period=today|week|month|year&serviceId=&paymentMethod=`
- `GET /financial/report?startDate=&endDate=&serviceId=&paymentMethod=`
- `GET /financial/export.csv?startDate=&endDate=&...` **(novo — CSV para Excel)**
- `GET|PATCH /financial/goals`

## Regras de negócio principais

**Slots disponíveis** (`slots.service.ts`):
1. Carrega serviço + horário de funcionamento do dia da semana.
2. Se `barberId` informado, olha só a agenda daquele barbeiro; senão, do dono todo.
3. Mescla agendamentos do banco (excluindo cancelados) + eventos do Google Calendar + bloqueios manuais (`AvailabilityBlock`).
4. Gera slots contíguos de `service.durationMin` entre `startTime` e `endTime`; marca indisponível quem colide com período ocupado ou já passou.

**Fidelidade** (`loyalty.service.ts`):
- Toda vez que um agendamento vira `COMPLETED` **e** `PAID`, concede 1 ponto ao cliente.
- Idempotente: flag `loyaltyPointsGiven` no Appointment evita contar duas vezes.
- Meta = 10 pontos → cliente resgata "corte grátis" (`POST /loyalty/me/redeem` zera 10 pts).

**Reagendamento pendente** (`reschedule.service.ts`):
- Cliente propõe novo horário → dono recebe notificação WhatsApp.
- Ao aprovar, backend verifica conflito no novo horário antes de mover o Appointment.
- Ao recusar, envia mensagem ao cliente.
- Pedidos anteriores pendentes do mesmo agendamento são automaticamente cancelados.

**Cron de lembretes**: `whatsapp-reminder.service.ts` roda a cada 5 min (`@Cron('*/5 * * * *')`) e dispara lembretes 1 h antes de cada agendamento pendente.
