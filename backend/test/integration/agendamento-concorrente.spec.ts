import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Teste de integração contra PostgreSQL de verdade.
 *
 * Valida a garantia que NÃO dá para testar com mock: a constraint que impede
 * dois agendamentos sobrepostos. A checagem em código tem janela de corrida
 * entre o SELECT e o INSERT — só o banco arbitra isso.
 *
 * Roda com:
 *   docker compose up -d
 *   TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barbearia_luck_test" npm run test:db
 *
 * Sem TEST_DATABASE_URL o teste é pulado, para não quebrar o CI de quem
 * não tem banco disponível.
 */

const URL = process.env.TEST_DATABASE_URL;
const descreve = URL ? describe : describe.skip;

const MIGRATIONS = path.join(__dirname, '..', '..', 'prisma', 'migrations');
const SENTINELA = '00000000-0000-0000-0000-000000000000';

descreve('integridade do agendamento no banco', () => {
  let db: Client;

  beforeAll(async () => {
    db = new Client({ connectionString: URL });
    await db.connect();

    // Recria o schema do zero a partir das migrations versionadas.
    await db.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    const migs = fs
      .readdirSync(MIGRATIONS)
      .filter((d) => fs.statSync(path.join(MIGRATIONS, d)).isDirectory())
      .sort();
    for (const m of migs) {
      await db.query(fs.readFileSync(path.join(MIGRATIONS, m, 'migration.sql'), 'utf8'));
    }
  }, 60_000);

  afterAll(async () => { if (db) await db.end(); });

  beforeEach(async () => {
    await db.query('TRUNCATE "Appointment","Service","Client","Barber","Unit","Owner" CASCADE');
    await db.query(
      `INSERT INTO "Owner"(id,name,email,"passwordHash",whatsapp,"barbershopName","updatedAt")
       VALUES('o1','Dono','d@luck.com','h','5511','Luck',now())`,
    );
    await db.query(`INSERT INTO "Client"(id,name,whatsapp,"updatedAt") VALUES('c1','Cliente','5599',now())`);
    await db.query(`INSERT INTO "Client"(id,name,whatsapp,"updatedAt") VALUES('c2','Outro','5588',now())`);
    await db.query(
      `INSERT INTO "Service"(id,"ownerId",name,price,"durationMin","updatedAt")
       VALUES('s1','o1','Corte',50,30,now())`,
    );
    await db.query(
      `INSERT INTO "Unit"(id,"ownerId",name,address,"updatedAt") VALUES('u1','o1','Centro','Rua X, 100',now())`,
    );
    await db.query(
      `INSERT INTO "Barber"(id,"ownerId","unitId",name,"updatedAt") VALUES('b1','o1','u1','Barbeiro 1',now())`,
    );
    await db.query(
      `INSERT INTO "Barber"(id,"ownerId","unitId",name,"updatedAt") VALUES('b2','o1','u1','Barbeiro 2',now())`,
    );
  });

  const marcar = (
    id: string, inicio: string, fim: string,
    { status = 'SCHEDULED', barberId = null as string | null, clientId = 'c1' } = {},
  ) =>
    db.query(
      `INSERT INTO "Appointment"(id,"ownerId","clientId","serviceId","barberId","startAt","endAt",status,"updatedAt")
       VALUES($1,'o1',$2,'s1',$3,$4,$5,$6::"AppointmentStatus",now())`,
      [id, clientId, barberId, inicio, fim, status],
    );

  const D = (h: string) => `2030-06-04 ${h}`;

  it('aceita o primeiro agendamento do horário', async () => {
    await expect(marcar('a1', D('10:00'), D('10:30'))).resolves.toBeDefined();
  });

  it('bloqueia agendamento idêntico', async () => {
    await marcar('a1', D('10:00'), D('10:30'));
    await expect(marcar('a2', D('10:00'), D('10:30'))).rejects.toMatchObject({ code: '23P01' });
  });

  it('bloqueia sobreposição parcial no início', async () => {
    await marcar('a1', D('10:00'), D('10:30'));
    await expect(marcar('a2', D('09:45'), D('10:15'))).rejects.toMatchObject({ code: '23P01' });
  });

  it('bloqueia sobreposição parcial no fim', async () => {
    await marcar('a1', D('10:00'), D('10:30'));
    await expect(marcar('a2', D('10:15'), D('10:45'))).rejects.toMatchObject({ code: '23P01' });
  });

  it('bloqueia agendamento que engloba outro', async () => {
    await marcar('a1', D('10:00'), D('10:30'));
    await expect(marcar('a2', D('09:00'), D('12:00'))).rejects.toMatchObject({ code: '23P01' });
  });

  it('bloqueia agendamento contido em outro', async () => {
    await marcar('a1', D('10:00'), D('11:00'));
    await expect(marcar('a2', D('10:15'), D('10:30'))).rejects.toMatchObject({ code: '23P01' });
  });

  it('ACEITA horário adjacente — fim de um é início do outro', async () => {
    await marcar('a1', D('10:00'), D('10:30'));
    await expect(marcar('a2', D('10:30'), D('11:00'))).resolves.toBeDefined();
  });

  it('ACEITA remarcar em cima de um horário cancelado', async () => {
    await marcar('a1', D('10:00'), D('10:30'), { status: 'CANCELLED' });
    await expect(marcar('a2', D('10:00'), D('10:30'))).resolves.toBeDefined();
  });

  it('ACEITA o mesmo horário para barbeiros diferentes', async () => {
    await marcar('a1', D('10:00'), D('10:30'), { barberId: 'b1' });
    await expect(marcar('a2', D('10:00'), D('10:30'), { barberId: 'b2' })).resolves.toBeDefined();
  });

  it('bloqueia o mesmo horário para o MESMO barbeiro', async () => {
    await marcar('a1', D('10:00'), D('10:30'), { barberId: 'b1' });
    await expect(
      marcar('a2', D('10:00'), D('10:30'), { barberId: 'b1' }),
    ).rejects.toMatchObject({ code: '23P01' });
  });

  it('agenda "sem barbeiro" é independente da agenda de um barbeiro', async () => {
    await marcar('a1', D('10:00'), D('10:30'), { barberId: null });
    await expect(marcar('a2', D('10:00'), D('10:30'), { barberId: 'b1' })).resolves.toBeDefined();
  });

  it('recusa intervalo invertido (fim antes do início)', async () => {
    await expect(marcar('a1', D('11:00'), D('10:00'))).rejects.toMatchObject({ code: '23514' });
  });

  it('recusa duração zero', async () => {
    await expect(marcar('a1', D('10:00'), D('10:00'))).rejects.toMatchObject({ code: '23514' });
  });

  it('CORRIDA REAL: 8 pedidos simultâneos no mesmo horário, só 1 entra', async () => {
    // Este é o cenário que a checagem em código não cobre — todas as conexões
    // fazem o SELECT antes de qualquer INSERT ser confirmado.
    const conexoes = await Promise.all(
      Array.from({ length: 8 }, async () => {
        const c = new Client({ connectionString: URL });
        await c.connect();
        return c;
      }),
    );

    const resultados = await Promise.allSettled(
      conexoes.map((c, i) =>
        c.query(
          `INSERT INTO "Appointment"(id,"ownerId","clientId","serviceId","startAt","endAt",status,"updatedAt")
           VALUES($1,'o1','c1','s1',$2,$3,'SCHEDULED',now())`,
          [`race-${i}`, D('15:00'), D('15:30')],
        ),
      ),
    );

    await Promise.all(conexoes.map((c) => c.end()));

    const aceitos = resultados.filter((r) => r.status === 'fulfilled').length;
    expect(aceitos).toBe(1);

    const { rows } = await db.query(
      `SELECT count(*)::int AS n FROM "Appointment" WHERE "startAt" = $1`, [D('15:00')],
    );
    expect(rows[0].n).toBe(1);
  });

  it('e-mail de cliente é único — login por e-mail não fica ambíguo', async () => {
    await db.query(`UPDATE "Client" SET email='mesmo@x.com' WHERE id='c1'`);
    await expect(
      db.query(`UPDATE "Client" SET email='mesmo@x.com' WHERE id='c2'`),
    ).rejects.toMatchObject({ code: '23505' });
  });

  it('vários clientes podem ficar sem e-mail (índice é parcial)', async () => {
    await expect(db.query(`UPDATE "Client" SET email=NULL WHERE id IN ('c1','c2')`)).resolves.toBeDefined();
  });
});
