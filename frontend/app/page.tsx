'use client';

import { useMemo, useState } from 'react';
import {
  LuckSplash, LuckRolePicker, LuckLogin, LuckOwnerOTP,
  LuckUnitPicker, LuckClientSignup, LuckClientOTP, LuckClientDone,
  LuckClientServices, LuckClientBarberPicker, LuckClientSchedule, LuckClientConfirm,
  LuckClientHome, LuckClientReschedule,
  LuckOwnerSignup, LuckOwnerCalendar, LuckOwnerServices, LuckOwnerDone,
  LuckOwnerDashboard, LuckOwnerAgendaEditor, LuckOwnerNewMenu,
  LuckOwnerBookForm, LuckOwnerBlockForm, LuckOwnerFinance,
  LuckOwnerRescheduleRequests,
  LuckProfile,
} from '@/components/screens';
import { LUCK_BARBERS, LUCK_SERVICES } from '@/components/screens/data';
import { salvarSessao, encerrarSessao } from '@/lib/auth';

type Step =
  | 'splash' | 'role' | 'login' | 'owner-otp'
  | 'c-unit' | 'c-signup' | 'c-otp' | 'c-done'
  | 'c-services' | 'c-barber' | 'c-schedule' | 'c-confirm'
  | 'c-home' | 'c-reschedule' | 'c-profile'
  | 'o-signup' | 'o-calendar' | 'o-services' | 'o-done'
  | 'o-dashboard' | 'o-agenda' | 'o-new' | 'o-book' | 'o-block'
  | 'o-reschedule-requests' | 'o-finance' | 'o-profile';

export default function LuckApp() {
  const [step, setStep] = useState<Step>('splash');
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [ownerUnitId, setOwnerUnitId] = useState<string | null>(null);
  const [signupMethod, setSignupMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [clientLoggedIn, setClientLoggedIn] = useState(false);
  const [hasAppointment, setHasAppointment] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [ownerOtpWhatsapp, setOwnerOtpWhatsapp] = useState('');

  const barber = useMemo(() => LUCK_BARBERS.find((b) => b.id === selectedBarberId), [selectedBarberId]);
  const services = useMemo(() => LUCK_SERVICES.filter((s) => selectedServiceIds.includes(s.id)), [selectedServiceIds]);
  const toggleService = (id: string) =>
    setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const goto = (s: Step) => setStep(s);
  const logout = () => {
    encerrarSessao();
    setClientLoggedIn(false);
    goto('role');
  };

  switch (step) {
    case 'splash':
      return <LuckSplash onDone={() => goto('role')} />;
    case 'role':
      return (
        <LuckRolePicker
          onPick={(role) => goto(role === 'client' ? 'c-unit' : role === 'owner' ? 'o-signup' : 'login')}
        />
      );
    case 'login':
      return (
        <LuckLogin
          onBack={() => goto('role')}
          onEnter={(role) => {
            if (role === 'client') setClientLoggedIn(true);
            goto(role === 'client' ? 'c-home' : 'o-dashboard');
          }}
          onOwnerOtpSent={(wa) => { setOwnerOtpWhatsapp(wa); goto('owner-otp'); }}
          onClientOtpSent={() => goto('c-otp')}
        />
      );
    case 'owner-otp':
      return (
        <LuckOwnerOTP
          whatsapp={ownerOtpWhatsapp}
          onBack={() => goto('login')}
          onSuccess={(data) => {
            salvarSessao(data.token, { ...data.owner, role: 'owner' });
            goto('o-dashboard');
          }}
        />
      );

    // Client flow
    case 'c-unit':
      return (
        <LuckUnitPicker
          onBack={() => goto(clientLoggedIn ? 'c-home' : 'role')}
          selectedUnitId={selectedUnitId}
          setSelectedUnitId={setSelectedUnitId}
          onNext={() => goto(clientLoggedIn ? 'c-services' : 'c-signup')}
        />
      );
    case 'c-signup':
      return (
        <LuckClientSignup
          onBack={() => goto('c-unit')}
          onNext={() => goto('c-otp')}
          method={signupMethod}
          setMethod={setSignupMethod}
        />
      );
    case 'c-otp':
      return (
        <LuckClientOTP
          onBack={() => goto('c-signup')}
          onNext={() => {
            setClientLoggedIn(true);
            goto(clientLoggedIn ? 'c-home' : 'c-done');
          }}
          method={signupMethod}
        />
      );
    case 'c-done':
      return <LuckClientDone onNext={() => goto('c-services')} />;
    case 'c-services':
      return (
        <LuckClientServices
          onBack={() => goto(clientLoggedIn ? 'c-unit' : 'c-done')}
          selectedIds={selectedServiceIds}
          toggleSelected={toggleService}
          onNext={() => goto('c-barber')}
        />
      );
    case 'c-barber':
      return (
        <LuckClientBarberPicker
          onBack={() => goto('c-services')}
          selectedUnitId={selectedUnitId}
          selectedBarberId={selectedBarberId}
          setSelectedBarberId={setSelectedBarberId}
          onNext={() => goto('c-schedule')}
        />
      );
    case 'c-schedule':
      return (
        <LuckClientSchedule
          onBack={() => goto('c-barber')}
          services={services}
          barber={barber}
          selectedSlot={selectedSlot}
          setSelectedSlot={setSelectedSlot}
          onNext={() => goto('c-confirm')}
        />
      );
    case 'c-confirm':
      return (
        <LuckClientConfirm
          onBack={() => goto('c-schedule')}
          services={services}
          slot={selectedSlot}
          barber={barber}
          confirmed={confirmed}
          onConfirm={() => setConfirmed(true)}
        />
      );

    case 'c-home':
      return (
        <LuckClientHome
          onBookNew={() => goto('c-unit')}
          onLogout={logout}
          onProfile={() => goto('c-profile')}
          onReschedule={() => goto('c-reschedule')}
          hasAppointment={hasAppointment}
        />
      );
    case 'c-reschedule':
      return (
        <LuckClientReschedule
          onBack={() => goto('c-home')}
          onSubmit={() => goto('c-home')}
          hasAppointment={hasAppointment}
          onBookNew={() => goto('c-unit')}
        />
      );
    case 'c-profile':
      return <LuckProfile role="client" onBack={() => goto('c-home')} onLogout={logout} onCalendar={() => goto('c-reschedule')} />;

    // Owner flow
    case 'o-signup':
      return (
        <LuckOwnerSignup
          onBack={() => goto('role')}
          onNext={() => goto('o-calendar')}
          selectedUnitId={ownerUnitId}
          setSelectedUnitId={setOwnerUnitId}
        />
      );
    case 'o-calendar':
      return <LuckOwnerCalendar onBack={() => goto('o-signup')} onNext={() => goto('o-services')} />;
    case 'o-services':
      return <LuckOwnerServices onBack={() => goto('o-calendar')} onNext={() => goto('o-done')} />;
    case 'o-done':
      return <LuckOwnerDone onNext={() => goto('o-dashboard')} />;
    case 'o-dashboard':
      return (
        <LuckOwnerDashboard
          onGoFinance={() => goto('o-finance')}
          onNew={() => goto('o-new')}
          onProfile={() => goto('o-profile')}
          onCalendar={() => goto('o-agenda')}
          onRescheduleRequests={() => goto('o-reschedule-requests')}
        />
      );
    case 'o-agenda':
      return <LuckOwnerAgendaEditor onBack={() => goto('o-dashboard')} />;
    case 'o-reschedule-requests':
      return <LuckOwnerRescheduleRequests onBack={() => goto('o-dashboard')} />;
    case 'o-profile':
      return <LuckProfile role="owner" onBack={() => goto('o-dashboard')} onLogout={logout} />;
    case 'o-finance':
      return <LuckOwnerFinance onBack={() => goto('o-dashboard')} />;
    case 'o-new':
      return (
        <LuckOwnerNewMenu
          onClose={() => goto('o-dashboard')}
          onBook={() => goto('o-book')}
          onBlock={() => goto('o-block')}
        />
      );
    case 'o-book':
      return <LuckOwnerBookForm onBack={() => goto('o-new')} onConfirm={() => goto('o-dashboard')} />;
    case 'o-block':
      return <LuckOwnerBlockForm onBack={() => goto('o-new')} onConfirm={() => goto('o-dashboard')} />;

    default:
      return <LuckSplash onDone={() => goto('role')} />;
  }
}
