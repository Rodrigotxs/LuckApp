import 'dotenv/config';
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
      name: 'Diego Monteiro',
      email: 'demo@barbearialuck.com',
      passwordHash,
      whatsapp: '5511998876655',
      barbershopName: 'Barbearia Luck',
      barbershopAddress: 'R. Aspicuelta, 514 — V. Madalena, SP',
      monthlyGoal: 8000,
    },
  });
  console.log(`✓ Dono criado: ${owner.email} (senha: 123456)`);

  // Unidades
  const unidadesConfig = [
    { id: 'seed-unit-atlantica', name: 'Unidade Atlântica', address: 'Av. Atlântica, 1400', neighborhood: 'Copacabana, RJ' },
    { id: 'seed-unit-bompastor', name: 'Unidade Bom Pastor', address: 'Av. Bom Pastor, 1250', neighborhood: 'Ipiranga, SP' },
  ];
  for (const u of unidadesConfig) {
    await prisma.unit.upsert({
      where: { id: u.id },
      update: {},
      create: { ...u, ownerId: owner.id },
    });
  }
  console.log(`✓ ${unidadesConfig.length} unidades criadas`);

  // Barbeiros
  const barbeirosConfig = [
    { id: 'seed-barber-diego', name: 'Diego Monteiro', role: 'Barbeiro sênior', rating: 4.9, avatarLabel: 'DM', unitId: 'seed-unit-atlantica' },
    { id: 'seed-barber-thiago', name: 'Thiago Alves', role: 'Barbeiro', rating: 4.8, avatarLabel: 'TA', unitId: 'seed-unit-atlantica' },
    { id: 'seed-barber-otavio', name: 'Otávio Reis', role: 'Barbeiro júnior', rating: 4.7, avatarLabel: 'OR', unitId: 'seed-unit-bompastor' },
  ];
  for (const b of barbeirosConfig) {
    await prisma.barber.upsert({
      where: { id: b.id },
      update: {},
      create: { ...b, ownerId: owner.id },
    });
  }
  console.log(`✓ ${barbeirosConfig.length} barbeiros criados`);

  // Serviços
  const servicos = [
    { id: 'seed-svc-corte', name: 'Corte Masculino', price: 45, durationMin: 40, description: 'Tesoura + máquina, finalização' },
    { id: 'seed-svc-barba', name: 'Barba Tradicional', price: 35, durationMin: 30, description: 'Toalha quente, navalha, bálsamo' },
    { id: 'seed-svc-combo', name: 'Combo Premium', price: 75, durationMin: 75, description: 'Corte + Barba + Sobrancelha' },
    { id: 'seed-svc-sobrancelha', name: 'Sobrancelha', price: 20, durationMin: 15, description: 'Design com navalha' },
  ];
  for (const s of servicos) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, ownerId: owner.id },
    });
  }
  console.log(`✓ ${servicos.length} serviços criados`);

  // Horários
  const horarios = [
    { dayOfWeek: 0, startTime: '09:00', endTime: '17:00', active: false },
    { dayOfWeek: 1, startTime: '08:00', endTime: '20:00', active: true },
    { dayOfWeek: 2, startTime: '08:00', endTime: '20:00', active: true },
    { dayOfWeek: 3, startTime: '08:00', endTime: '20:00', active: true },
    { dayOfWeek: 4, startTime: '08:00', endTime: '20:00', active: true },
    { dayOfWeek: 5, startTime: '08:00', endTime: '20:00', active: true },
    { dayOfWeek: 6, startTime: '09:00', endTime: '17:00', active: true },
  ];
  await prisma.workingHours.deleteMany({ where: { ownerId: owner.id } });
  await prisma.workingHours.createMany({
    data: horarios.map((h) => ({ ...h, ownerId: owner.id })),
  });
  console.log('✓ Horários de funcionamento configurados');

  console.log('\n🎉 Seed concluído!\n');
  console.log(`📧 E-mail: demo@barbearialuck.com`);
  console.log(`🔑 Senha:  123456`);
  console.log(`🆔 OwnerId: ${owner.id}`);
  console.log(`🔗 Link público: http://localhost:3000/agendar/${owner.id}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
