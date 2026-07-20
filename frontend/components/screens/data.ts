// Dados mock/fallback para as telas Luck.
// Se conectar ao backend, esses valores servem só como fallback estático.

export const LUCK_UNITS = [
  { id: 'atlantica', name: 'Unidade Atlântica', address: 'Av. Atlântica, 1400', neighborhood: 'Copacabana, RJ' },
  { id: 'bompastor', name: 'Unidade Bom Pastor', address: 'Av. Bom Pastor, 1250', neighborhood: 'Ipiranga, SP' },
];

export const LUCK_BARBERS = [
  { id: 'diego', name: 'Diego Monteiro', role: 'Barbeiro sênior', rating: 4.9, free: 9, avatar: 'DM', unitId: 'atlantica' },
  { id: 'thiago', name: 'Thiago Alves', role: 'Barbeiro', rating: 4.8, free: 6, avatar: 'TA', unitId: 'atlantica' },
  { id: 'otavio', name: 'Otávio Reis', role: 'Barbeiro júnior', rating: 4.7, free: 12, avatar: 'OR', unitId: 'bompastor' },
];

export const LUCK_SERVICES = [
  { id: 'corte', name: 'Corte Masculino', desc: 'Tesoura + máquina', duration: 40, price: 45, icon: 'IconScissors' as const },
  { id: 'barba', name: 'Barba Tradicional', desc: 'Toalha quente + navalha', duration: 30, price: 35, icon: 'IconRazor' as const },
  { id: 'combo', name: 'Combo Premium', desc: 'Corte + Barba + Sobrancelha', duration: 75, price: 75, icon: 'IconCombo' as const, top: true },
  { id: 'sobrancelha', name: 'Sobrancelha', desc: 'Design com navalha', duration: 15, price: 20, icon: 'IconBeard' as const },
];

export const LUCK_SLOTS_BY_BARBER: Record<string, string[]> = {
  diego: ['08:00','08:30*','09:00','09:30','10:00','10:30*','11:00','11:30','13:00','13:30*','14:00','14:30','15:00','15:30*','16:00','16:30'],
  thiago: ['08:00*','08:30*','09:00','09:30*','10:00','10:30','11:00*','11:30','13:00','13:30','14:00*','14:30*','15:00','15:30','16:00*','16:30'],
  otavio: ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30*','13:00','13:30','14:00','14:30','15:00*','15:30','16:00','16:30'],
};

export const LUCK_AGENDA_HOURS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
];

export const LUCK_TRANSACTIONS = [
  { n: 'André Souza', s: 'Combo Premium', t: '13:42', d: '27/04', v: 75, period: 'week' as const },
  { n: 'Marcos Diniz', s: 'Barba Tradicional', t: '11:08', d: '27/04', v: 35, period: 'week' as const },
  { n: 'Lucas Pereira', s: 'Combo Premium', t: '09:25', d: '27/04', v: 75, period: 'week' as const },
  { n: 'Rafael Costa', s: 'Corte Masculino', t: '16:10', d: '26/04', v: 45, period: 'week' as const },
  { n: 'Bruno Henrique', s: 'Sobrancelha', t: '14:00', d: '25/04', v: 20, period: 'week' as const },
  { n: 'Felipe Tavares', s: 'Combo Premium', t: '10:30', d: '20/04', v: 75, period: 'month' as const },
  { n: 'Caio Ribeiro', s: 'Corte Masculino', t: '15:45', d: '15/04', v: 45, period: 'month' as const },
  { n: 'Diego Martins', s: 'Barba Tradicional', t: '09:00', d: '10/04', v: 35, period: 'month' as const },
  { n: 'Thiago Alves', s: 'Combo Premium', t: '17:20', d: '05/03', v: 75, period: 'year' as const },
  { n: 'Otávio Reis', s: 'Sobrancelha', t: '11:40', d: '20/02', v: 20, period: 'year' as const },
];

export const LUCK_SERVICE_TYPES = ['Todos', 'Corte Masculino', 'Barba Tradicional', 'Combo Premium', 'Sobrancelha'];

export type LuckService = typeof LUCK_SERVICES[number];
export type LuckBarber = typeof LUCK_BARBERS[number];
export type LuckUnit = typeof LUCK_UNITS[number];
