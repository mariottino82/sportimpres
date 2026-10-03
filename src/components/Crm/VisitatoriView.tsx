import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  Smartphone,
  Monitor,
  Globe,
  RotateCcw,
  Calendar,
  Layers,
  Clock,
  Compass,
  Tablet
} from 'lucide-react';
import { CrmRole } from '../../types';

interface VisitatoriViewProps {
  role?: CrmRole;
}

export const VisitatoriView: React.FC<VisitatoriViewProps> = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/crm/visitatori');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Errore caricamento statistiche visitatori:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Aggiornamento periodico automatico ogni 30 secondi in background
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        <RotateCcw className="w-8 h-8 animate-spin text-sky-600 mx-auto mb-3" />
        <p className="text-sm font-semibold">Caricamento statistiche visitatori in corso...</p>
      </div>
    );
  }

  const { totali, trend = [], dispositivi = [], browser = [], canali = [], paginePiuViste = [], ultimiAccessi = [] } = data;

  // Calcola massimo per la scala del grafico a barre
  const maxVisitsTrend = Math.max(...(trend.map((t: any) => t.visite) || [1]), 10);

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="mb-1">
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Monitoraggio Traffico Web • Area Riservata
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
          Statistiche Accessi e Visitatori della Piattaforma
        </h2>
        <p className="text-xs text-slate-600 mt-0.5">
          Dati in tempo reale su visite complessive, utenti unici, tipologia di dispositivi e provenienza del pubblico.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Card 1: Visite Totali */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Visite Totali</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono">
            {totali.visiteTotali.toLocaleString('it-IT')}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Oggi: <strong className="text-slate-900">{totali.visiteOggi}</strong></span>
          </div>
        </div>

        {/* Card 2: Visitatori Unici */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Visitatori Unici</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono">
            {totali.visitatoriUniciTotali.toLocaleString('it-IT')}
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Unici oggi: <strong className="text-emerald-700 font-extrabold">{totali.visitatoriUniciOggi}</strong></span>
            <span className="text-slate-500">Tasso unici: <strong>{totali.visiteTotali > 0 ? Math.round((totali.visitatoriUniciTotali / totali.visiteTotali) * 100) : 0}%</strong></span>
          </div>
        </div>

        {/* Card 3 (ex Card 4): Quota Dispositivi Mobile */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-slate-500">Dispositivi</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-950 font-mono">
            {totali.percentualeMobile}%
            <span className="text-xs font-semibold text-slate-400 ml-1">Mobile</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden flex">
            <div
              className="bg-amber-500 h-full"
              style={{ width: `${totali.percentualeMobile}%` }}
              title={`Mobile: ${totali.percentualeMobile}%`}
            ></div>
            <div
              className="bg-sky-600 h-full"
              style={{ width: `${totali.percentualeDesktop}%` }}
              title={`Desktop: ${totali.percentualeDesktop}%`}
            ></div>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-amber-700">
              <Smartphone className="w-3 h-3" /> {totali.percentualeMobile}% Smartphone
            </span>
            <span className="flex items-center gap-1 font-semibold text-sky-700">
              <Monitor className="w-3 h-3" /> {totali.percentualeDesktop}% Desktop
            </span>
          </div>
        </div>

      </div>

      {/* Grafico Andamento Giornaliero (Ultime 2 Settimane) */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Andamento Giornaliero Accessi (Ultime 2 Settimane)</span>
            </h3>
            <p className="text-xs text-slate-500">Visite totali e visitatori unici per giorno</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-sky-700">
              <span className="w-3 h-3 rounded bg-sky-500 inline-block"></span> Visite Totali
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Visitatori Unici
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6 pb-2">
          {trend.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-slate-400 border-b border-slate-200">
              Nessun dato di accesso registrato al momento.
            </div>
          ) : (
            <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 items-end h-44 border-b border-slate-200 pb-2">
              {trend.map((day: any) => {
                const heightPercentVisits = Math.max(12, Math.round((day.visite / maxVisitsTrend) * 100));
                const heightPercentUniques = Math.max(8, Math.round((day.unici / maxVisitsTrend) * 100));
                const labelDate = day.data ? day.data.substring(5) : ''; // MM-DD

                return (
                  <div key={day.data} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-12 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      <div className="font-bold">{day.data}</div>
                      <div>Visite: {day.visite} • Unici: {day.unici}</div>
                    </div>

                    {/* Bars Container */}
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Barra Visite */}
                      <div
                        className="w-1/2 bg-sky-500 hover:bg-sky-600 rounded-t transition-all"
                        style={{ height: `${heightPercentVisits}%` }}
                      ></div>
                      {/* Barra Unici */}
                      <div
                        className="w-1/2 bg-emerald-500 hover:bg-emerald-600 rounded-t transition-all"
                        style={{ height: `${heightPercentUniques}%` }}
                      ></div>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono mt-2 truncate w-full text-center">
                      {labelDate}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid 3 Colonne: Canali, Dispositivi, Pagine più viste */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Canali di Provenienza */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-600" />
            <span>Sorgenti di Traffico (Canali)</span>
          </h4>
          <p className="text-[11px] text-slate-500">Da dove arrivano i visitatori del portale</p>
          <div className="space-y-2.5 pt-2">
            {canali.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nessuna sorgente di traffico registrata.</p>
            ) : (
              canali.map((c: any) => {
                const perc = totali.visiteTotali > 0 ? Math.round((c.count / totali.visiteTotali) * 100) : 0;
                return (
                  <div key={c.canale} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{c.canale}</span>
                      <span className="font-mono text-slate-600">{c.count} ({perc}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-600 h-full rounded-full" style={{ width: `${Math.max(5, perc)}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pagine Più Viste */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Sezioni e Pagine Più Visitate</span>
          </h4>
          <p className="text-[11px] text-slate-500">Aree del portale a maggior tasso di consultazione</p>
          <div className="space-y-2.5 pt-2">
            {paginePiuViste.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nessuna visualizzazione pagina registrata.</p>
            ) : (
              paginePiuViste.map((p: any) => {
                const label = p.pagina === '/' ? 'Home Page (Landing)' :
                              p.pagina.includes('prenota') ? 'Wizard Prenotazione Sportello' :
                              p.pagina.includes('sportelli') ? 'Mappa Sedi e Rete Territoriale' :
                              p.pagina.includes('bandi') ? 'Vetrina Bandi e Opportunità' :
                              p.pagina.includes('eventi') ? 'News ed Eventi sul Territorio' : p.pagina;

                const perc = totali.visiteTotali > 0 ? Math.round((p.count / totali.visiteTotali) * 100) : 0;

                return (
                  <div key={p.pagina} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={p.pagina}>{label}</span>
                      <span className="font-mono text-slate-600 shrink-0">{p.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.max(5, perc)}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Browser & Dispositivi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <span>Browser e Compatibilità</span>
          </h4>
          <p className="text-[11px] text-slate-500">Browser impiegati dagli utenti</p>
          <div className="space-y-2.5 pt-2">
            {browser.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Nessun dato browser registrato.</p>
            ) : (
              browser.map((b: any) => {
                const perc = totali.visiteTotali > 0 ? Math.round((b.count / totali.visiteTotali) * 100) : 0;
                return (
                  <div key={b.browser} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{b.browser}</span>
                      <span className="font-mono text-slate-600">{b.count} ({perc}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-600 h-full rounded-full" style={{ width: `${Math.max(5, perc)}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Tabella Ultimi Accessi in Tempo Reale */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <span>Registro Ultimi Accessi in Tempo Reale</span>
            </h3>
            <p className="text-xs text-slate-500">Elenco degli ultimi accessi anonimizzati registrati dalla piattaforma</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Ultimi {ultimiAccessi.length} accessi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data e Ora</th>
                <th className="py-3 px-4">Pagina Visitata</th>
                <th className="py-3 px-4">Dispositivo</th>
                <th className="py-3 px-4">Browser & OS</th>
                <th className="py-3 px-4">Canale di Provenienza</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {ultimiAccessi.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Nessun accesso ancora registrato.
                  </td>
                </tr>
              ) : (
                ultimiAccessi.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-900 font-bold">
                      {row.data_ora}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/60 font-mono text-[11px]">
                        {row.pagina}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.device === 'Mobile'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                          : row.device === 'Tablet'
                          ? 'bg-purple-50 text-purple-800 border border-purple-200/60'
                          : 'bg-slate-100 text-slate-800 border border-slate-200/60'
                      }`}>
                        {row.device === 'Mobile' ? <Smartphone className="w-3 h-3" /> :
                         row.device === 'Tablet' ? <Tablet className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                        <span>{row.device}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <strong>{row.browser}</strong> on {row.os}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        <span>{row.canale}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
