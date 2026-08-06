/**
 * Pre-voo da migration 20240701000000_hardening_seguranca_e_integridade.
 *
 * Essa migration cria duas garantias que o banco antes nao tinha:
 *   - e-mail unico por cliente
 *   - nenhum agendamento sobreposto (constraint EXCLUDE)
 *
 * Constraint nao pode ser criada sobre dados que ja a violam. Por isso a
 * migration limpa antes: zera e-mails duplicados e apaga o agendamento mais
 * novo de cada par sobreposto.
 *
 * Num banco de desenvolvimento isso costuma nao valer nada. Mas "costuma" nao
 * e garantia, e apagar linha sem avisar e o tipo de conveniencia que queima
 * confianca. Este script mostra o estrago ANTES, sem alterar nada.
 *
 * Uso:
 *   cd backend && node scripts/verificar-antes-de-migrar.js
 *
 * Saida 0 = nada seria perdido. Saida 2 = ha dados que a migration removeria.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

const SENTINELA = '00000000-0000-0000-0000-000000000000';

/*
 * As datas sao formatadas no proprio Postgres, com to_char.
 *
 * As colunas sao `timestamp without time zone`. Se viessem cruas, o driver as
 * transformaria em Date usando o fuso local e o toISOString somaria o offset
 * de volta — um agendamento das 10:15 apareceria como 13:15. Num relatorio do
 * que vai ser APAGADO, mostrar o horario errado e pior que nao mostrar nada.
 */
const SQL_EMAILS_DUPLICADOS = `
  SELECT c.id, c.name, c.email,
         to_char(c."createdAt", 'DD/MM/YYYY HH24:MI') AS criado_em
    FROM "Client" c
   WHERE c.email IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM "Client" o
        WHERE o.email = c.email
          AND o."createdAt" < c."createdAt"
     )
   ORDER BY c.email, c."createdAt"`;

const SQL_AGENDAMENTOS_SOBREPOSTOS = `
  SELECT a.id AS id_removido,
         b.id AS id_mantido,
         to_char(a."startAt", 'DD/MM/YYYY HH24:MI') AS inicio,
         to_char(a."endAt",   'HH24:MI')            AS fim,
         a.status,
         cli.name AS cliente
    FROM "Appointment" a
    JOIN "Appointment" b
      ON a.id > b.id
     AND a."ownerId" = b."ownerId"
     AND COALESCE(a."barberId", '${SENTINELA}') = COALESCE(b."barberId", '${SENTINELA}')
     AND a.status <> 'CANCELLED'
     AND b.status <> 'CANCELLED'
     AND a."startAt" < b."endAt"
     AND a."endAt"   > b."startAt"
    LEFT JOIN "Client" cli ON cli.id = a."clientId"
   ORDER BY a."startAt"`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL ausente. Rode a partir da pasta backend/, com o .env no lugar.');
    process.exit(1);
  }

  const db = new Client({ connectionString: url });
  try {
    await db.connect();
  } catch (e) {
    console.error(`Nao consegui conectar em ${url.replace(/:[^:@]+@/, ':***@')}`);
    console.error(`  ${e.message}`);
    console.error('  O Postgres esta no ar? "docker compose up -d"');
    process.exit(1);
  }

  // Banco vazio (primeira execucao) nao tem o que perder.
  const { rows: existe } = await db.query(`SELECT to_regclass('public."Appointment"') AS t`);
  if (!existe[0].t) {
    console.log('Banco ainda sem as tabelas — nada a perder. Pode migrar.');
    await db.end();
    process.exit(0);
  }

  // Consulta pg_constraint, nao information_schema: constraint EXCLUDE e
  // extensao do Postgres e nao aparece nas views do padrao SQL.
  const { rows: jaAplicada } = await db.query(
    `SELECT 1 FROM pg_constraint WHERE conname = 'Appointment_sem_sobreposicao'`,
  );
  if (jaAplicada.length) {
    console.log('A migration de hardening ja esta aplicada neste banco. Nada a fazer.');
    await db.end();
    process.exit(0);
  }

  const emails = (await db.query(SQL_EMAILS_DUPLICADOS)).rows;
  const sobrepostos = (await db.query(SQL_AGENDAMENTOS_SOBREPOSTOS)).rows;

  console.log('\n  PRE-VOO DA MIGRATION DE HARDENING\n');

  if (emails.length === 0) {
    console.log('  E-mails duplicados .......... nenhum');
  } else {
    console.log(`  E-mails duplicados .......... ${emails.length} cliente(s) teriam o e-mail ZERADO:`);
    for (const c of emails) {
      console.log(`      ${c.email}  ->  ${c.name} (criado em ${c.criado_em})`);
    }
    console.log('      O registro mais ANTIGO de cada e-mail e preservado.');
  }

  if (sobrepostos.length === 0) {
    console.log('  Agendamentos sobrepostos .... nenhum');
  } else {
    console.log(`  Agendamentos sobrepostos .... ${sobrepostos.length} agendamento(s) seriam APAGADOS:`);
    for (const a of sobrepostos) {
      console.log(
        `      ${a.inicio} as ${a.fim}  ${a.cliente || '(sem cliente)'}` +
          `  [${a.status}]  id=${a.id_removido}`,
      );
      console.log(`         colide com id=${a.id_mantido}, que fica`);
    }
  }

  const total = emails.length + sobrepostos.length;
  console.log('');

  if (total === 0) {
    console.log('  Nada seria perdido. Pode rodar o dev.cmd tranquilo.\n');
    await db.end();
    process.exit(0);
  }

  console.log('  Se algum desses dados importa, faca backup antes:');
  console.log('    docker exec barbearia_luck_db pg_dump -U postgres barbearia_luck > backup.sql\n');
  await db.end();
  process.exit(2);
}

main().catch((e) => {
  console.error('Falha inesperada:', e.message);
  process.exit(1);
});
