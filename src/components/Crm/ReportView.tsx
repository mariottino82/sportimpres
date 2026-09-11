import React, { useState, useEffect } from 'react';
import { CrmRole } from '../../types';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  TrendingUp,
  PieChart,
  BarChart3
} from 'lucide-react';

interface ReportViewProps {
  role: CrmRole;
}

export const ReportView: React.FC<ReportViewProps> = ({ role }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('2026-Q1');

  useEffect(() => {
    fetch('/api/crm/cruscotto')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleExportFullCsv = async () => {
    try {
      const res = await fetch('/api/crm/utenti');
      const users = await res.json();
      const headers = ['ID', 'Tipo', 'Denominazione_o_Nome', 'Email', 'Telefono', 'Comune', 'Settore_RIS3', 'Data_Registrazione'];
      const rows = users.map((u: any) => [
        u.id,
        u.tipo,
        `"${u.denominazione || `${u.nome || ''} ${u.cognome || ''}`}"`,
        `"${u.email || ''}"`,
        `"${u.telefono || ''}"`,
        `"${u.comune_sede || u.comune_residenza || ''}"`,
        `"${u.settore_ris3 || u.settore_attivita || ''}"`,
        u.creato_il
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Report_Monitoraggio_Sportello_Imprese_${periodo}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-xs text-slate-500">Generazione report in corso...</div>;
  }

  const { totali, sportelliStats, categoryStats } = data;

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs print:border-none print:shadow-none">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Monitoraggio Periodico SIM & Regione Molise (8.6)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
            Reportistica e Indicatori di Realizzazione
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Dati statistici ufficiali per il Comitato di Sorveglianza PR Molise FESR FSE+ 2021-2027.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden w-full sm:w-auto">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value="2026-Q1">1° Trimestre 2026 (Gen - Mar)</option>
            <option value="2026-Q2">2° Trimestre 2026 (Apr - Giu)</option>
            <option value="2026-ANNUALE">Report Annuale 2026</option>
          </select>

          <button
            onClick={handleExportFullCsv}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV Completo</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Stampa / PDF</span>
          </button>
        </div>
      </div>

      {/* Official Summary Table */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 text-xs">
        
        <div className="border-b border-slate-200 pb-4">
          <div className="text-[11px] font-mono text-slate-500 uppercase">
            Quadro di Avanzamento Realizzativo • Periodo: {periodo}
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 font-display">
            Servizi di orientamento, informazione e accompagnamento alle imprese
          </h3>
        </div>

        {/* Summary Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Target Annuale</span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">250</div>
            <span className="text-[10px] text-slate-400">Convenzione Regione/SIM</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Utenti Accompagnati</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">{totali.totalUsers}</div>
            <span className="text-[10px] text-emerald-600 font-semibold">{Math.round((totali.totalUsers / 250) * 100)}% del target</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Colloqui Effettuati</span>
            <div className="text-xl sm:text-2xl font-black text-sky-800 font-mono">{totali.apptsSvolti}</div>
            <span className="text-[10px] text-slate-500">su {totali.apptsTotal} totali</span>
          </div>

          <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Follow-up Positivo</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">{totali.followUpRatePercent}%</div>
            <span className="text-[10px] text-indigo-600 font-semibold">Target contrattuale ≥ 10%</span>
          </div>
        </div>

        {/* Breakdown by Sportello Table */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 uppercase text-xs">
            Ripartizione Utenti per Sportello Territoriale
          </h4>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Sportello</th>
                  <th className="py-2.5 px-4">Comune</th>
                  <th className="py-2.5 px-4">Giorni Apertura</th>
                  <th className="py-2.5 px-4 text-center">Utenti Serviti</th>
                  <th className="py-2.5 px-4 text-right">% su Totale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(sportelliStats || []).map((s: any) => {
                  const usersCount = s.usersCount ?? s.appuntamenti_count ?? 0;
                  const pct = (totali?.totalUsers || 0) > 0 ? ((usersCount / totali.totalUsers) * 100).toFixed(1) : '0';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2 px-4 font-semibold text-slate-800">{s.nome}</td>
                      <td className="py-2 px-4">{s.comune}</td>
                      <td className="py-2 px-4 text-slate-500">{s.giorni || 'Settimanale'}</td>
                      <td className="py-2 px-4 text-center font-mono font-bold">{usersCount}</td>
                      <td className="py-2 px-4 text-right font-mono">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown by Need Categories */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 uppercase text-xs">
            Rilevazione dei Fabbisogni Aziendali Espressi
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(Array.isArray(categoryStats) ? categoryStats : Object.entries(categoryStats || {})).map((item: any, idx: number) => {
              const cat = item.categoria || item.nome || (Array.isArray(item) ? item[0] : `Categoria ${idx + 1}`);
              const count = item.count ?? (Array.isArray(item) ? item[1] : 0);
              return (
                <div key={cat} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200/60">
                  <span className="font-medium text-slate-700">{cat}</span>
                  <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-sky-800">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Signature Box for Official Report */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-slate-500 text-[11px]">
          <div>
            <p>Il Referente Tecnico Sportello Imprese</p>
            <div className="h-12 border-b border-dashed border-slate-300 mt-2"></div>
          </div>
          <div>
            <p>Sviluppo Italia Molise S.p.A. - Direzione Generale</p>
            <div className="h-12 border-b border-dashed border-slate-300 mt-2"></div>
          </div>
        </div>

      </div>

    </div>
  );
};
