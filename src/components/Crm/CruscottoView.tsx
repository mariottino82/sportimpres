import React, { useState, useEffect } from 'react';
import { CrmRole, Sportello, Appointment } from '../../types';
import {
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Target,
  AlertTriangle,
  Clock,
  MapPin,
  Building2,
  User,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

interface CruscottoViewProps {
  role: CrmRole;
  onNavigateToAgenda: () => void;
  onNavigateToUser: (userId: number) => void;
  onNavigateToBandi?: () => void;
}

export const CruscottoView: React.FC<CruscottoViewProps> = ({
  role,
  onNavigateToAgenda,
  onNavigateToUser,
  onNavigateToBandi
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCruscotto = () => {
    fetch('/api/crm/cruscotto')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchCruscotto();
  }, []);

  const handleQuickCheckin = async (apptId: number) => {
    try {
      const res = await fetch(`/api/crm/appuntamenti/${apptId}/stato`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stato: 'SVOLTO' })
      });
      if (res.ok) {
        fetchCruscotto();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Caricamento dati del cruscotto in corso...
      </div>
    );
  }

  const totali = data?.totali || {
    totalUsers: 0,
    impreseCount: 0,
    aspirantiCount: 0,
    apptsTotal: 0,
    apptsPrenotati: 0,
    apptsSvolti: 0,
    followUpRatePercent: 0,
    kpiTarget: 10
  };
  const sportelliStats = Array.isArray(data?.sportelliStats) ? data.sportelliStats : [];
  const todayAppts = Array.isArray(data?.todayTomorrowAppts) ? data.todayTomorrowAppts : (Array.isArray(data?.todayAppts) ? data.todayAppts : []);
  const bisogniStats = Array.isArray(data?.bisogniStats) ? data.bisogniStats : (Array.isArray(data?.categoryStats) ? data.categoryStats : []);

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & KPI Highlight */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Monitoraggio Direzionale • PR Molise FESR FSE+ 2021-2027
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
            Cruscotto Gestionale e Indicatori di Performance (KPI)
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Riepilogo in tempo reale dell'attività dei 12 sportelli, stato avanzamento target e tasso di follow-up positivo.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Utenti Totali */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Utenti Censiti</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono">
            {totali.totalUsers}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
              <Building2 className="w-3 h-3" /> {totali.impreseCount} Imprese
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 font-semibold text-purple-700">
              <User className="w-3 h-3" /> {totali.aspirantiCount} Aspiranti
            </span>
          </div>
        </div>

        {/* Card 2: Appuntamenti Totali */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Incontri Fissati</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono">
            {totali.apptsTotal}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-600">
            <span className="text-emerald-700 font-semibold">{totali.apptsSvolti} Svolti</span>
            <span>•</span>
            <span className="text-sky-700 font-semibold">{totali.apptsPrenotati} Programmati</span>
          </div>
        </div>

        {/* Card 3: Target Annuale (250 utenti) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Target Annuo</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950 font-mono">{totali.totalUsers}</span>
            <span className="text-xs text-slate-400 font-bold">/ 250 annui</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (totali.totalUsers / 250) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Card 4: KPI Follow-Up Positivo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase text-slate-500">Follow-up Positivo</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 font-mono">
            {totali.followUpRatePercent}%
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <span className="text-emerald-700 font-bold">Target ≥ 10%: Soddisfatto</span>
          </div>
        </div>

      </div>

      {/* Target Progress per Sportello (Chapter 8.1 - 250 utenti/anno) */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Avanzamento Target per Sportello (Target convenzionale: ~21 utenti/anno cad.)
            </h3>
            <p className="text-xs text-slate-500">Monitoraggio carichi di lavoro e fruizione territoriale</p>
          </div>
          <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full w-fit">
            {sportelliStats.length > 0 ? `${sportelliStats.length} Sportelli Attivi` : 'Sportelli Attivi'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {sportelliStats.map((s: any) => {
            const targetSportello = 21;
            const usersCount = s.usersCount ?? s.appuntamenti_count ?? 0;
            const pct = Math.min(100, Math.round((usersCount / targetSportello) * 100));
            return (
              <div key={s.id} className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-slate-900">
                  <span className="truncate">{s.nome ? s.nome.replace('Sportello Territoriale ', '') : `Sportello ${s.id}`}</span>
                  <span className="font-mono text-sky-800">{usersCount} utenti</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-sky-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>{s.giorni || 'Settimanale'}</span>
                  <span>{pct}% del target</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns: Today Agenda & Need Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Appointments with Quick Check-In */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Agenda di Oggi e Prossimi Appuntamenti
                </h3>
              </div>
              <button
                onClick={onNavigateToAgenda}
                className="text-xs font-bold text-sky-700 hover:underline shrink-0"
              >
                Vedi tutta l'agenda →
              </button>
            </div>

            {todayAppts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Nessun appuntamento in programma per oggi.
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppts.map((appt: any) => (
                  <div
                    key={appt.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sky-900 bg-sky-100 px-1.5 py-0.5 rounded text-[11px]">
                          {new Date(appt.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[200px]">
                          {appt.utente_tipo === 'IMPRESA'
                            ? (appt.impresa_denominazione || appt.denominazione || 'Impresa')
                            : ([appt.aspirante_nome || appt.nome, appt.aspirante_cognome || appt.cognome].filter(Boolean).join(' ') || appt.impresa_denominazione || appt.utente_email || 'Utente')}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          appt.stato === 'SVOLTO' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {appt.stato}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">
                        {appt.sportello_nome} • {appt.categoria_bisogno}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {appt.stato !== 'SVOLTO' && (
                        <button
                          onClick={() => handleQuickCheckin(appt.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Check-in</span>
                        </button>
                      )}
                      <button
                        onClick={() => onNavigateToUser(appt.utente_id)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
                        title="Vedi Scheda 360"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Breakdown of Needs and RIS3 */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">
              Tipologia dei Bisogni Espressi
            </h3>

            <div className="space-y-3 text-xs">
              {bisogniStats.map((item: any, idx: number) => {
                const cat = item.categoria || item.nome || (Array.isArray(item) ? item[0] : `Categoria ${idx + 1}`);
                const count = item.count ?? (Array.isArray(item) ? item[1] : 0);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span>{cat}</span>
                      <span className="font-mono">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-600 h-full rounded-full"
                        style={{ width: `${Math.min(100, (count / (totali.apptsTotal || 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
