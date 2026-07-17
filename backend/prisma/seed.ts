import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed da Barbearia Luck...');

  const passwordHash = await bcrypt.hash('123456', 12);

  const owner = await prisma.owner.upsert({
    where: { email: 'demo@barbearialuck.com' },
    update: {},
    create: {
      name: 'Lucas Silva',
      email: 'demo@barbearialuck.com',
      passwordHash,
      whatsapp: '5511999990000',
      barbershopName: 'Barbearia Luck',
      barbershopAddress: 'Rua das Flores, 123 - Centro, São Paulo/SP',
      monthlyGoal: 8000,
    },
  });

  console.log(`✓ Dono criado: ${owner.email} (senha: 123456)`);

  const servicos = [
    { name: 'Corte Social', price: 35.0, durationMin: 30, description: 'Corte clássico com tesoura' },
    { name: 'Corte + Barba', price: 55.0, durationMin: 50, description: 'Combo completo' },
    { name: 'Barba', price: 25.0, durationMin: 25, description: 'Aparar e modelar' },
    { name: 'Pigmentação', price: 70.0, durationMin: 40, description: 'Coloração de cabelo ou barba' },
  ];

  for (const s of servicos) {
    const id = `seed-${s.name.replace(/\s+/g, '-').toLowerCase()}`;
    await prisma.service.upsert({
      where: { id },
      update: {},
      create: { id, ownerId: owner.id, ...s },
    });
  }
  console.log(`✓ ${servicos.length} serviços criados`);

  const horarios = [
    { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', active: false },
    { dayOfWeek: 1, startTime: '09:00', endTime: '19:00', active: true },
    { dayOfWeek: 2, startTime: '09:00', endTime: '19:00', active: true },
    { dayOfWeek: 3, startTime: '09:00', endTime: '19:00', active: true },
    { dayOfWeek: 4, startTime: '09:00', endTime: '19:00', active: true },
    { dayOfWeek: 5, startTime: '09:00', endTime: '19:00', active: true },
    { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', active: true },
  ];

  await prisma.workingHours.deleteMany({ where: { ownerId: owner.id } });
  await prisma.workingHours.createMany({
    data: horarios.map(h => ({ ...h, ownerId: owner.id })),
  });
  console.log('✓ Horários de funcionamento configurados');

  console.log('\n🎉 Seed concluído!\n');
  console.log(`📧 E-mail: demo@barbearialuck.com`);
  console.log(`🔑 Senha:  123456`);
  console.log(`🆔 OwnerId: ${owner.id}`);
  console.log(`🔗 Link público: http://localhost:3000/agendar/${owner.id}\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
