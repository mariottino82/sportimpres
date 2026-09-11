import React from 'react';
import { Logo, LogoRegioneMolise } from '../Logo';
import { CrmRole, CrmOperator } from '../../types';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  FileSpreadsheet,
  QrCode,
  Award,
  ShieldCheck,
  MapPin,
  LogOut,
  ExternalLink,
  User
} from 'lucide-react';

interface CrmNavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  role: CrmRole;
  onChangeRole?: (role: CrmRole) => void;
  onExitCrm: () => void;
  currentUser?: CrmOperator | null;
  onLogout?: () => void;
}

export const CrmNavbar: React.FC<CrmNavbarProps> = ({
  currentTab,
  onSelectTab,
  role,
  onExitCrm,
  currentUser,
  onLogout
}) => {
  const effectiveRole = currentUser?.ruolo || role;
  const roleLabels: Record<CrmRole, { name: string; color: string; desc: string }> = {
    ADMIN: { name: 'Amministratore (Admin)', color: 'bg-rose-500', desc: 'Accesso completo, gestione accessi e ruoli' },
    OPERATORE: { name: 'Operatore di Sportello', color: 'bg-emerald-500', desc: 'Gestione agenda, colloqui, scheda 360' },
    COORDINATORE: { name: 'Coordinatore Generale', color: 'bg-purple-600', desc: 'Supervisione 12 sportelli, target, report' },
    COMUNICAZIONE: { name: 'Staff Comunicazione', color: 'bg-amber-500', desc: 'Web TV, QR code territoriali, campagne' },
    CONTACT_CENTER: { name: 'Operatore Contact Center', color: 'bg-sky-500', desc: 'Prenotazioni telefoniche, coda ricontatti' },
    ENTE: { name: 'Regione Molise / SIM', color: 'bg-indigo-600', desc: 'Visualizzazione dati aggregati e KPI' }
  };

  // La sezione Accessi e Ruoli è visibile ESCLUSIVAMENTE al ruolo ADMIN
  const isAdmin = effectiveRole === 'ADMIN';
  // La sezione Sportelli Territoriali è visibile e utilizzabile ESCLUSIVAMENTE da ADMIN e COORDINATORE
  const canManageSportelli = effectiveRole === 'ADMIN' || effectiveRole === 'COORDINATORE';

  const navItems = [
    { id: 'cruscotto', label: 'Cruscotto', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'utenti', label: 'Anagrafica & 360°', icon: Users },
    { id: 'interazioni', label: 'Interazioni & Coda', icon: MessageSquare },
    { id: 'bandi', label: 'Bandi', icon: Award },
    { id: 'report', label: 'Report', icon: FileSpreadsheet },
    { id: 'comunicazione', label: 'Comunicazione & Vetrina', icon: QrCode },
    ...(canManageSportelli ? [{ id: 'sportelli', label: 'Sportelli', icon: MapPin }] : []),
    ...(isAdmin ? [{ id: 'accessi', label: 'Accessi e Ruoli', icon: ShieldCheck }] : [])
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 w-full min-w-0">
      {/* Top utility row */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 border-b border-slate-800/80 text-xs min-w-0">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink-0">
          <Logo size="sm" variant="dark" />
          <span className="text-slate-700 font-mono hidden sm:inline">|</span>
          <div className="hidden lg:flex items-center gap-3">
            <LogoRegioneMolise size="xs" variant="dark" />
            <span className="text-slate-400 font-medium truncate">
              Back-office CRM & Scheda EDP • PR Molise FESR FSE+
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
          {/* Active Logged-in Operator badge */}
          {currentUser ? (
            <div
              className="flex items-center gap-2 bg-slate-800/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-slate-700 shrink-0"
              title={`Operatore: ${currentUser.nome} ${currentUser.cognome} (@${currentUser.username}) • Profilo: ${roleLabels[effectiveRole]?.name || effectiveRole}`}
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center font-bold text-[10px] shrink-0">
                {currentUser.nome?.[0] || 'U'}{currentUser.cognome?.[0] || ''}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-[11px] font-bold text-white leading-tight truncate max-w-[120px]">
                  {currentUser.nome} {currentUser.cognome}
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">
                  @{currentUser.username}
                </div>
              </div>
              <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border tracking-wider shrink-0 ${
                effectiveRole === 'ADMIN'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : effectiveRole === 'COORDINATORE'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : effectiveRole === 'COMUNICAZIONE'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : effectiveRole === 'ENTE'
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                  : effectiveRole === 'CONTACT_CENTER'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {roleLabels[effectiveRole]?.name?.split(' ')[0] || effectiveRole}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-lg sm:rounded-xl border border-slate-700 shrink-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${roleLabels[effectiveRole]?.color || 'bg-slate-500'}`}></span>
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">{effectiveRole}</span>
            </div>
          )}

          {/* Exit to public portal */}
          <button
            onClick={onExitCrm}
            className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Torna al portale pubblico per i cittadini"
            aria-label="Portale Pubblico"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Portale</span>
          </button>

          {/* Disconnetti / Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 hover:text-red-100 text-xs font-semibold border border-red-800/60 transition-colors cursor-pointer shrink-0"
              title="Disconnetti dalla sessione CRM"
              aria-label="Esci dal CRM"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Esci</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation row */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-none py-1 w-full min-w-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive
                    ? 'text-white'
                    : item.id === 'bandi'
                    ? 'text-amber-400'
                    : item.id === 'accessi'
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
