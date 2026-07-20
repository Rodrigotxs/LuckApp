# Barbearia Luck

Sistema de agendamento multi-tenant, multi-unidade, com barbeiros individuais. Backend NestJS + Frontend Next.js mobile-first fiel ao design entregue pelo Claude Design.

## Stack

- **Backend:** Node.js + TypeScript + NestJS + PostgreSQL + Prisma ORM
- **Frontend:** React + Next.js 16 (App Router) + Tailwind + CSS puro (design tokens)
- **Auth:** JWT (donos) + OTP via WhatsApp (clientes)
- **Integrações:** Google Calendar API (OAuth 2.0) + WhatsApp (Evolution API / Twilio)
- **Infra:** Docker Compose (PostgreSQL + Redis)

## Identidade visual — tokens (`frontend/app/globals.css`)

| Token | Hex | Uso |
|---|---|---|
| `--red` | `#C0392B` | CTAs, bordas de destaque, cor principal do cliente |
| `--red-soft` | `#C0392B14` | Fundos suaves de estado ativo do cliente |
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

O frontend é uma SPA client-side (`app/page.tsx`) que age como state-machine de telas — o mesmo padrão do handoff. Todas as telas ficam em `frontend/components/screens/` e o design system em `frontend/components/luck/`.

## Como rodar

### 1. Infraestrutura
```bash
docker compose up -d
```

### 2. Backend
```bash
cd backend
npm install
npx prisma migrate deploy   # aplica migrations (Owner, Unit, Barber, Service, Appointment...)
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
- 2 unidades (Atlântica RJ, Bom Pastor SP), 3 barbeiros e 4 serviços já configurados.

## Endpoints principais

### Auth
- `POST /auth/owner/register` · `POST /auth/owner/login`
- `POST /auth/client/send-otp` · `POST /auth/client/verify-otp`
- `GET /auth/google` (OAuth) · `GET /auth/google/callback`

### Unidades (novo)
- `GET /units/public/:ownerId` — lista pública para agendamento
- `GET|POST|PATCH|DELETE /units` (autenticado)

### Barbeiros (novo)
- `GET /barbers/public/:ownerId?unitId=` — lista pública (filtro por unidade)
- `GET|POST|PATCH|DELETE /barbers` (autenticado)

### Serviços
- `GET /services/public/:ownerId` (público) · `GET|POST|PATCH|DELETE /services` (autenticado)

### Agendamentos
- `GET /appointments/available-slots?ownerId&date&serviceId&barberId&unitId`
- `POST /appointments` (aceita `unitId` / `barberId` opcionais)
- `GET /appointments/owner` · `GET /appointments/client`
- `PATCH /appointments/:id/status` · `PATCH /appointments/:id/payment` · `DELETE /appointments/:id`

### Financeiro
- `GET /financial/summary?period=today|week|month`
- `GET /financial/report?startDate&endDate`
- `GET|PATCH /financial/goals`

## Telas (SPA em `/`)

**Cliente:** Splash → RolePicker → UnitPicker → Signup (WhatsApp/E-mail) → OTP → Done → Services (múltipla) → BarberPicker → Schedule → Confirm → Home (logado) → Reschedule → Profile.

**Dono:** Signup + Unit → Calendar setup → Services setup → Done → Dashboard (agenda do dia) → AgendaEditor (bloqueio de dia/horário) → NewMenu (bottom-sheet) → BookForm / BlockForm → Finance (semana/mês/ano, export CSV) → Profile.

## Cron de lembretes

`backend/src/modules/integrations/whatsapp/whatsapp-reminder.service.ts` roda a cada 5 min (`@Cron('*/5 * * * *')`) e dispara lembretes 1 h antes de cada agendamento pendente.

## Lógica de slots disponíveis

`backend/src/modules/appointments/slots.service.ts`:
1. Carrega serviço e horário de funcionamento do dia da semana.
2. Se `barberId` for informado, olha apenas a agenda daquele barbeiro; senão, agrega a agenda inteira do dono.
3. Mescla agendamentos do banco (excluindo cancelados) com eventos ocupados do Google Calendar.
4. Gera slots contíguos de `service.durationMin` minutos entre `startTime` e `endTime`; marca como indisponível qualquer slot que colida com um período ocupado ou já esteja no passado.
