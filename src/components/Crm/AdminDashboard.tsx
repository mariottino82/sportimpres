import React, { useState } from 'react';
import { CrmRole, CrmOperator } from '../../types';
import { CrmNavbar } from './CrmNavbar';
import { CruscottoView } from './CruscottoView';
import { AgendaView } from './AgendaView';
import { AnagraficaView } from './AnagraficaView';
import { InterazioniView } from './InterazioniView';
import { BandiAiView } from './BandiAiView';
import { ReportView } from './ReportView';
import { QrCodeWebTvView } from './QrCodeWebTvView';
import { AccessiRuoliView } from './AccessiRuoliView';
import { SportelliManagerView } from './SportelliManagerView';

interface AdminDashboardProps {
  onExitCrm: () => void;
  currentUser?: CrmOperator | null;
  onLogout?: () => void;
  initialTab?: string;
  initialSubTab?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onExitCrm,
  currentUser,
  onLogout,
  initialTab,
  initialSubTab
}) => {
  const [currentTab, setCurrentTab] = useState<string>(initialTab || 'cruscotto');
  const effectiveRole: CrmRole = currentUser?.ruolo || 'OPERATORE';
  const [comunicazioneSubTab, setComunicazioneSubTab] = useState<'qrcode' | 'webtv' | 'vetrina' | undefined>(
    (initialSubTab as any) || undefined
  );

  const isAdmin = effectiveRole === 'ADMIN';
  const canManageSportelli = effectiveRole === 'ADMIN' || effectiveRole === 'COORDINATORE';

  // Auto-redirect if non-admin tries to access 'accessi', or non-admin/coordinatore tries 'sportelli'
  React.useEffect(() => {
    if (!isAdmin && currentTab === 'accessi') {
      setCurrentTab('cruscotto');
    }
    if (!canManageSportelli && currentTab === 'sportelli') {
      setCurrentTab('cruscotto');
    }
  }, [isAdmin, canManageSportelli, currentTab]);

  // Deep-linking states
  const [selectedUserIdFor360, setSelectedUserIdFor360] = useState<number | null>(null);
  const [userForBandi, setUserForBandi] = useState<any | null>(null);

  const handleOpenUser360 = (userId: number) => {
    setSelectedUserIdFor360(userId);
    setCurrentTab('utenti');
  };

  const handleNavigateToBandi = (user?: any) => {
    setUserForBandi(user || null);
    setCurrentTab('bandi');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans w-full max-w-full overflow-x-hidden">
      {/* Backoffice Navbar */}
      <CrmNavbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'utenti') setSelectedUserIdFor360(null);
        }}
        role={effectiveRole}
        onExitCrm={onExitCrm}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full min-w-0 mx-auto px-3 sm:px-6 py-4 sm:py-8">
        {currentTab === 'cruscotto' && (
          <CruscottoView
            role={effectiveRole}
            onNavigateToAgenda={() => setCurrentTab('agenda')}
            onNavigateToUser={handleOpenUser360}
            onNavigateToBandi={() => setCurrentTab('bandi')}
          />
        )}

        {currentTab === 'agenda' && (
          <AgendaView
            role={effectiveRole}
            onOpenUser360={handleOpenUser360}
          />
        )}

        {currentTab === 'utenti' && (
          <AnagraficaView
            role={effectiveRole}
            initialUserId={selectedUserIdFor360}
            onNavigateToBandi={handleNavigateToBandi}
          />
        )}

        {currentTab === 'interazioni' && (
          <InterazioniView
            role={effectiveRole}
            onOpenUser360={handleOpenUser360}
          />
        )}

        {currentTab === 'bandi' && (
          <BandiAiView
            role={effectiveRole}
            preselectedUser={userForBandi}
          />
        )}

        {currentTab === 'report' && (
          <ReportView
            role={effectiveRole}
          />
        )}

        {currentTab === 'comunicazione' && (
          <QrCodeWebTvView
            role={effectiveRole}
            initialSubTab={comunicazioneSubTab}
            onNavigateToPublicPortal={onExitCrm}
          />
        )}

        {currentTab === 'sportelli' && canManageSportelli && (
          <SportelliManagerView
            currentUser={currentUser}
            effectiveRole={effectiveRole}
          />
        )}

        {currentTab === 'accessi' && isAdmin && (
          <AccessiRuoliView
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-4 text-center">
        Sportello Imprese Molise • Sviluppo Italia Molise S.p.A. • PR Molise FESR FSE+ 2021-2027
      </footer>
    </div>
  );
};
