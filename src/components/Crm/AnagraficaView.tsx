import React, { useState, useEffect } from 'react';
import { CrmRole } from '../../types';
import { Scheda360Modal } from './Scheda360Modal';
import { MOLISE_COMUNI } from '../../data/moliseComuni';
import {
  Users,
  Building2,
  User,
  Search,
  Filter,
  Download,
  ChevronRight,
  Sparkles,
  MapPin,
  Calendar
} from 'lucide-react';

interface AnagraficaViewProps {
  role: CrmRole;
  initialUserId?: number | null;
  onNavigateToBandi?: (user?: any) => void;
}

function getUserDisplayName(u: any): string {
  if (!u) return 'Utente';
  const isImpresa = u.tipo === 'IMPRESA';
  const denominazione = (u.denominazione || u.impresa_denominazione || '').trim();
  const nominativo = [u.nome || u.aspirante_nome, u.cognome || u.aspirante_cognome]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (isImpresa) {
    return denominazione || nominativo || u.email || 'Impresa registrata';
  }
  return nominativo || denominazione || u.email || 'Utente registrato';
}

function getUserComune(u: any): string {
  if (!u) return 'Molise';
  const isImpresa = u.tipo === 'IMPRESA';
  return (
    (isImpresa ? (u.comune_sede || u.impresa_comune) : (u.comune_residenza || u.aspirante_comune)) ||
    u.comune_sede ||
    u.comune_residenza ||
    u.impresa_comune ||
    u.aspirante_comune ||
    'Molise'
  );
}

function getUserPiva(u: any): string {
  if (!u) return '';
  return u.partita_iva || u.impresa_piva || '';
}

function getUserRis3(u: any): string {
  if (!u) return 'Non specificato';
  return u.settore_ris3 || u.impresa_ris3 || u.aspirante_ris3 || u.settore_attivita || 'Non specificato';
}

export const AnagraficaView: React.FC<AnagraficaViewProps> = ({
  role,
  initialUserId,
  onNavigateToBandi
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<string>('all');
  const [filterComune, setFilterComune] = useState<string>('all');
  const [filterRis3, setFilterRis3] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected User for Scheda 360
  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialUserId || null);

  const fetchUsers = () => {
    setLoading(true);
    let url = '/api/crm/utenti?';
    if (filterType !== 'all') url += `tipo=${filterType}&`;
    if (filterComune !== 'all') url += `comune=${encodeURIComponent(filterComune)}&`;
    if (filterRis3 !== 'all') url += `ris3=${encodeURIComponent(filterRis3)}&`;
    if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, [filterType, filterComune, filterRis3]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const exportCsv = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Tipo', 'Denominazione_o_Nome', 'PIVA', 'Email', 'Telefono', 'Comune', 'Settore_RIS3', 'Data_Registrazione'];
    const rows = users.map((u) => [
      u.id,
      u.tipo,
      `"${getUserDisplayName(u)}"`,
      `"${getUserPiva(u)}"`,
      `"${u.email || ''}"`,
      `"${u.telefono || ''}"`,
      `"${getUserComune(u)}"`,
      `"${getUserRis3(u)}"`,
      u.creato_il || u.data_creazione || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Anagrafica_Sportello_Imprese_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">
            Archivio Unico Centralizzato (A)
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-display">
            Anagrafica Utenti e Scheda 360°
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Registro delle imprese e degli aspiranti imprenditori censiti con storico appuntamenti, interazioni e scheda EDP.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={exportCsv}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Esporta CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Type */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Tipologia Utente</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tutte le tipologie</option>
            <option value="IMPRESA">Solo Imprese</option>
            <option value="ASPIRANTE">Solo Aspiranti Imprenditori</option>
          </select>
        </div>

        {/* Comune */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Comune (Molise)</label>
          <select
            value={filterComune}
            onChange={(e) => setFilterComune(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tutti i Comuni</option>
            {MOLISE_COMUNI.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* RIS3 */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Area di Specializzazione RIS3</label>
          <select
            value={filterRis3}
            onChange={(e) => setFilterRis3(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
          >
            <option value="all">Tutte le aree RIS3</option>
            <option value="Agrifood">Agrifood</option>
            <option value="Scienze della vita">Scienze della vita</option>
            <option value="ICT">ICT</option>
            <option value="Industrie culturali, turistiche e creative">Industrie culturali</option>
            <option value="Tecnologie per la transizione">Tecnologie transizione</option>
          </select>
        </div>

        {/* Search */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Cerca (Ragione Sociale, Referente, P.IVA)</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca..."
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Caricamento anagrafica...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Nessun utente trovato con i filtri correnti.
          </div>
        ) : (
          <>
            {/* Mobile Cards View (< sm) */}
            <div className="block sm:hidden divide-y divide-slate-100">
              {users.map((u) => {
                const isImpresa = u.tipo === 'IMPRESA';
                const displayName = getUserDisplayName(u);
                const comune = getUserComune(u);
                const ris3 = getUserRis3(u);
                const piva = getUserPiva(u);

                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isImpresa ? (
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                        ) : (
                          <User className="w-4 h-4 text-purple-600 shrink-0" />
                        )}
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {displayName}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isImpresa ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {u.tipo}
                      </span>
                    </div>

                    {isImpresa && piva && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        P.IVA: {piva}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Comune:</span>
                        <span className="font-semibold text-slate-800">{comune}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Area RIS3:</span>
                        <span className="truncate block font-semibold text-slate-800">{ris3}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Contatti:</span>
                        <span className="text-slate-700 truncate block">{u.email} {u.telefono ? `• ${u.telefono}` : ''}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {u.appuntamenti_count || 0} incontri
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUserId(u.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors"
                      >
                        Scheda 360°
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Nominativo / Ragione Sociale</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Comune</th>
                    <th className="py-3 px-4">Area RIS3 / Settore</th>
                    <th className="py-3 px-4">Contatti</th>
                    <th className="py-3 px-4">Incontri</th>
                    <th className="py-3 px-4 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isImpresa = u.tipo === 'IMPRESA';
                    const displayName = getUserDisplayName(u);
                    const comune = getUserComune(u);
                    const ris3 = getUserRis3(u);
                    const piva = getUserPiva(u);

                    return (
                      <tr
                        key={u.id}
                        onClick={() => setSelectedUserId(u.id)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-sky-700 flex items-center gap-2">
                            {isImpresa ? (
                              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <User className="w-4 h-4 text-purple-600 shrink-0" />
                            )}
                            <span>{displayName}</span>
                          </div>
                          {isImpresa && piva && (
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              P.IVA: {piva}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isImpresa ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {u.tipo}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-slate-800">
                          {comune}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                            {ris3}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{u.email}</div>
                          <div className="text-[11px] text-slate-400">{u.telefono}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {u.appuntamenti_count || 0} appt
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUserId(u.id);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition-colors"
                          >
                            Apri Scheda 360°
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Scheda 360 Modal */}
      {selectedUserId && (
        <Scheda360Modal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onUpdated={fetchUsers}
          onNavigateToBandi={onNavigateToBandi}
        />
      )}

    </div>
  );
};
