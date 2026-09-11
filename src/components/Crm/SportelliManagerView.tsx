import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  Video,
  VideoOff,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Users,
  Phone,
  Mail,
  Info,
  Layers,
  Download,
  RefreshCw,
  Sliders,
  ChevronRight,
  X,
  Globe,
  Sparkles,
  Eye,
  CalendarDays,
  Lock,
  ArrowRight
} from 'lucide-react';
import { Sportello, CrmRole, CrmOperator } from '../../types';

interface SportelliManagerViewProps {
  currentUser?: CrmOperator | null;
  effectiveRole: CrmRole;
}

interface SportelloFormData {
  id?: number;
  comune: string;
  nome: string;
  provincia: string;
  indirizzo: string;
  telefono: string;
  email: string;
  lat: number;
  lng: number;
  giorni: string;
  orario: string;
  cadenza: string;
  attivo: number;
  operatori_assegnati: string;
  responsabile_nome: string;
  responsabile_email: string;
  responsabile_telefono: string;
  online_attivo: number;
  link_videocall: string;
  note_accesso: string;
}

const DEFAULT_DAYS_OPTIONS = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato'
];

const PRESET_HOURS = [
  '09:30 - 12:00',
  '09:00 - 13:00',
  '15:00 - 17:00',
  '15:30 - 17:00',
  '09:00 - 12:30',
  '14:30 - 17:30'
];

const PRESET_CADENZE = [
  'Settimanale',
  'Settimanale (3 giorni)',
  'Settimanale (2 giorni)',
  'Quindicinale',
  'A chiamata / Su Appuntamento',
  'Mensile'
];

// Predefined approximate coordinates for Molise municipalities
const MOLISE_COORDS: Record<string, { lat: number; lng: number; provincia: string }> = {
  'Campobasso': { lat: 41.5603, lng: 14.6627, provincia: 'CB' },
  'Termoli': { lat: 41.9997, lng: 14.9961, provincia: 'CB' },
  'Isernia': { lat: 41.5975, lng: 14.2343, provincia: 'IS' },
  'Venafro': { lat: 41.4828, lng: 14.0436, provincia: 'IS' },
  'Agnone': { lat: 41.8108, lng: 14.3789, provincia: 'IS' },
  'Campochiaro': { lat: 41.4464, lng: 14.5061, provincia: 'CB' },
  'Riccia': { lat: 41.4842, lng: 14.8361, provincia: 'CB' },
  'Santa Croce di Magliano': { lat: 41.7119, lng: 14.9897, provincia: 'CB' },
  'Montenero di Bisaccia': { lat: 41.9567, lng: 14.7811, provincia: 'CB' },
  'Trivento': { lat: 41.7806, lng: 14.5517, provincia: 'CB' },
  'Frosolone': { lat: 41.6033, lng: 14.4497, provincia: 'IS' },
  'Fornelli': { lat: 41.6069, lng: 14.1408, provincia: 'IS' },
  'Larino': { lat: 41.8006, lng: 14.9103, provincia: 'CB' },
  'Bojano': { lat: 41.4828, lng: 14.4722, provincia: 'CB' }
};

export const SportelliManagerView: React.FC<SportelliManagerViewProps> = ({
  currentUser,
  effectiveRole
}) => {
  // Authorization check: only ADMIN and COORDINATORE are permitted
  const isAuthorized = effectiveRole === 'ADMIN' || effectiveRole === 'COORDINATORE';

  const [sportelli, setSportelli] = useState<Sportello[]>([]);
  const [operatori, setOperatori] = useState<CrmOperator[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters and views
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterProvincia, setFilterProvincia] = useState<'ALL' | 'CB' | 'IS'>('ALL');
  const [filterStato, setFilterStato] = useState<'ALL' | 'ATTIVO' | 'INATTIVO'>('ALL');
  const [filterOnline, setFilterOnline] = useState<'ALL' | 'ONLINE' | 'PRESENZA'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingSportello, setEditingSportello] = useState<Sportello | null>(null);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Slot Test Modal State
  const [testingSportello, setTestingSportello] = useState<Sportello | null>(null);
  const [testDate, setTestDate] = useState<string>('');
  const [testSlotResults, setTestSlotResults] = useState<any | null>(null);
  const [testSlotLoading, setTestSlotLoading] = useState<boolean>(false);

  // Delete confirmation
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Copied link toast helper
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Form fields
  const [formData, setFormData] = useState<SportelloFormData>({
    comune: '',
    nome: '',
    provincia: 'CB',
    indirizzo: '',
    telefono: '0874 011011',
    email: 'sportelloimprese@sviluppoitaliamolise.it',
    lat: 41.5603,
    lng: 14.6627,
    giorni: 'Lunedì, Mercoledì, Venerdì',
    orario: '09:30 - 12:00',
    cadenza: 'Settimanale',
    attivo: 1,
    operatori_assegnati: '',
    responsabile_nome: '',
    responsabile_email: 'sportelloimprese@sviluppoitaliamolise.it',
    responsabile_telefono: '0874 011011',
    online_attivo: 1,
    link_videocall: '',
    note_accesso: ''
  });

  const [selectedDays, setSelectedDays] = useState<string[]>(['Lunedì', 'Mercoledì', 'Venerdì']);

  // Fetch sportelli and operators
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sportelliRes, opRes] = await Promise.all([
        fetch('/api/sportelli?all=true'),
        fetch('/api/crm/auth/users')
      ]);

      if (!sportelliRes.ok) throw new Error('Errore durante il recupero dei punti di sportello');
      const sportelliData = await sportelliRes.json();
      setSportelli(sportelliData);

      if (opRes.ok) {
        const opData = await opRes.json();
        setOperatori(opData);
      }
    } catch (err: any) {
      setError(err.message || 'Errore di connessione con il database centrale');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setEditingSportello(null);
    setSelectedDays(['Lunedì', 'Mercoledì', 'Venerdì']);
    setFormData({
      comune: '',
      nome: '',
      provincia: 'CB',
      indirizzo: '',
      telefono: '0874 011011',
      email: 'sportelloimprese@sviluppoitaliamolise.it',
      lat: 41.5603,
      lng: 14.6627,
      giorni: 'Lunedì, Mercoledì, Venerdì',
      orario: '09:30 - 12:00',
      cadenza: 'Settimanale',
      attivo: 1,
      operatori_assegnati: '',
      responsabile_nome: currentUser ? `${currentUser.nome} ${currentUser.cognome}` : 'Dott. Responsabile Territoriale',
      responsabile_email: 'sportelloimprese@sviluppoitaliamolise.it',
      responsabile_telefono: '0874 011011',
      online_attivo: 1,
      link_videocall: 'https://meet.jit.si/SportelloImpreseMolise_Nuovo',
      note_accesso: 'Presidio presso Municipio / Sede Istituzionale. Accessibile a persone con ridotta mobilità.'
    });
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (s: Sportello) => {
    setEditingSportello(s);
    // Parse days
    const daysArr = s.giorni
      ? s.giorni.split(',').map((d) => d.trim()).filter(Boolean)
      : [];
    setSelectedDays(daysArr.length > 0 ? daysArr : ['Lunedì']);

    // Determine provincia if not explicitly set
    let prov = s.provincia || '';
    if (!prov) {
      const isIsernia = ['Isernia', 'Venafro', 'Agnone', 'Frosolone', 'Fornelli'].some((c) =>
        s.comune.toLowerCase().includes(c.toLowerCase())
      );
      prov = isIsernia ? 'IS' : 'CB';
    }

    setFormData({
      id: s.id,
      comune: s.comune || '',
      nome: s.nome || '',
      provincia: prov,
      indirizzo: s.indirizzo || '',
      telefono: s.telefono || '0874 011011',
      email: s.email || 'sportelloimprese@sviluppoitaliamolise.it',
      lat: s.lat || 41.5603,
      lng: s.lng || 14.6627,
      giorni: s.giorni || 'Lunedì',
      orario: s.orario || '09:30 - 12:00',
      cadenza: s.cadenza || 'Settimanale',
      attivo: s.attivo !== undefined ? s.attivo : 1,
      operatori_assegnati: s.operatori_assegnati || '',
      responsabile_nome: s.responsabile_nome || '',
      responsabile_email: s.responsabile_email || s.email || 'sportelloimprese@sviluppoitaliamolise.it',
      responsabile_telefono: s.responsabile_telefono || s.telefono || '0874 011011',
      online_attivo: s.online_attivo !== undefined ? s.online_attivo : 1,
      link_videocall: s.link_videocall || `https://meet.jit.si/SportelloImpreseMolise_${s.id}`,
      note_accesso: s.note_accesso || ''
    });
    setIsFormOpen(true);
  };

  // Handle Comune Change to auto-fill coordinates and province if matching Molise municipality
  const handleComuneChange = (val: string) => {
    const trimmed = val.trim();
    let updatedProv = formData.provincia;
    let updatedLat = formData.lat;
    let updatedLng = formData.lng;

    const matched = Object.keys(MOLISE_COORDS).find(
      (k) => k.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      updatedProv = MOLISE_COORDS[matched].provincia;
      updatedLat = MOLISE_COORDS[matched].lat;
      updatedLng = MOLISE_COORDS[matched].lng;
    }

    setFormData((prev) => ({
      ...prev,
      comune: val,
      nome: prev.nome ? prev.nome : `Sportello Territoriale di ${val}`,
      provincia: updatedProv,
      lat: updatedLat,
      lng: updatedLng,
      link_videocall: prev.link_videocall || `https://meet.jit.si/SportelloImpreseMolise_${val.replace(/\s+/g, '')}`
    }));
  };

  // Toggle Day Selection
  const handleToggleDay = (day: string) => {
    let next: string[];
    if (selectedDays.includes(day)) {
      next = selectedDays.filter((d) => d !== day);
    } else {
      // Keep order of DEFAULT_DAYS_OPTIONS
      next = [...selectedDays, day].sort(
        (a, b) => DEFAULT_DAYS_OPTIONS.indexOf(a) - DEFAULT_DAYS_OPTIONS.indexOf(b)
      );
    }
    if (next.length === 0) next = [day]; // Keep at least one
    setSelectedDays(next);
    setFormData((prev) => ({ ...prev, giorni: next.join(', ') }));
  };

  // Save Form (Create or Edit)
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.comune || !formData.nome || !formData.indirizzo) {
      setError('Compilare tutti i campi obbligatori (Comune, Nome Sportello, Indirizzo).');
      return;
    }

    setFormSubmitting(true);
    setError(null);

    const payload = {
      ...formData,
      giorni: selectedDays.join(', ')
    };

    try {
      if (editingSportello) {
        // PUT update
        const res = await fetch(`/api/sportelli/${editingSportello.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Errore durante il salvataggio dello sportello');
        }
        showToast(`Sportello "${formData.comune}" aggiornato con successo!`);
      } else {
        // POST create
        const res = await fetch('/api/sportelli', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Errore durante la creazione dello sportello');
        }
        showToast(`Nuovo sportello per "${formData.comune}" censito e attivato!`);
      }

      setIsFormOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Errore nel salvataggio');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Fast Toggle Active status
  const handleToggleActive = async (s: Sportello) => {
    try {
      const res = await fetch(`/api/sportelli/${s.id}/toggle`, {
        method: 'PATCH'
      });
      if (!res.ok) throw new Error('Impossibile aggiornare lo stato di attivazione');
      const updated = await res.json();
      setSportelli((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, attivo: updated.attivo } : item))
      );
      showToast(
        updated.attivo === 1
          ? `Sportello "${s.comune}" ATTIVATO e aperto alle prenotazioni!`
          : `Sportello "${s.comune}" DISATTIVATO (non apparirà nel portale pubblico).`
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Fast Toggle Online Videocall status
  const handleToggleOnline = async (s: Sportello) => {
    const nextVal = s.online_attivo === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/sportelli/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...s, online_attivo: nextVal })
      });
      if (!res.ok) throw new Error('Impossibile modificare la modalità online');
      setSportelli((prev) =>
        prev.map((item) => (item.id === s.id ? { ...item, online_attivo: nextVal } : item))
      );
      showToast(
        nextVal === 1
          ? `Videocall online ABILITATA per lo sportello di "${s.comune}".`
          : `Videocall online DISABILITATA per "${s.comune}" (erogazione solo in presenza).`
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Delete Sportello
  const handleDeleteSportello = async (id: number) => {
    try {
      const res = await fetch(`/api/sportelli/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Errore nella cancellazione');
      setDeleteConfirmId(null);
      showToast(data.message || 'Operazione completata con successo');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Open slot test modal
  const handleOpenSlotTest = (s: Sportello) => {
    setTestingSportello(s);
    // Find tomorrow's date or a sensible date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setTestDate(dateStr);
    fetchTestSlots(s.id, dateStr);
  };

  const fetchTestSlots = async (sportelloId: number, dateStr: string) => {
    setTestSlotLoading(true);
    setTestSlotResults(null);
    try {
      const res = await fetch(`/api/sportelli/${sportelloId}/slots?date=${dateStr}`);
      const data = await res.json();
      setTestSlotResults(data);
    } catch (err: any) {
      setTestSlotResults({ error: err.message });
    } finally {
      setTestSlotLoading(false);
    }
  };

  // Copy videocall link
  const handleCopyLink = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Export CSV of sportelli
  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Comune',
      'Nome Sportello',
      'Provincia',
      'Indirizzo',
      'Responsabile',
      'Email Responsabile',
      'Telefono',
      'Giorni Apertura',
      'Orario',
      'Cadenza',
      'Online Abilitato',
      'Stato Attivo',
      'Operatori Assegnati',
      'Note Accesso'
    ];

    const rows = filteredSportelli.map((s) => [
      s.id,
      `"${s.comune}"`,
      `"${s.nome}"`,
      `"${s.provincia || ''}"`,
      `"${s.indirizzo}"`,
      `"${s.responsabile_nome || ''}"`,
      `"${s.responsabile_email || s.email}"`,
      `"${s.telefono}"`,
      `"${s.giorni}"`,
      `"${s.orario}"`,
      `"${s.cadenza}"`,
      s.online_attivo === 1 ? 'SI' : 'NO',
      s.attivo === 1 ? 'ATTIVO' : 'INATTIVO',
      `"${s.operatori_assegnati || ''}"`,
      `"${(s.note_accesso || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rete_Sportelli_Molise_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report CSV scaricato con successo!');
  };

  // Filtered sportelli
  const filteredSportelli = useMemo(() => {
    return sportelli.filter((s) => {
      // Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchComune = s.comune.toLowerCase().includes(q);
        const matchNome = s.nome.toLowerCase().includes(q);
        const matchIndirizzo = s.indirizzo.toLowerCase().includes(q);
        const matchResp = (s.responsabile_nome || '').toLowerCase().includes(q);
        const matchOps = (s.operatori_assegnati || '').toLowerCase().includes(q);
        if (!matchComune && !matchNome && !matchIndirizzo && !matchResp && !matchOps) {
          return false;
        }
      }

      // Provincia
      if (filterProvincia !== 'ALL') {
        const prov = s.provincia || (['Isernia', 'Venafro', 'Agnone', 'Frosolone', 'Fornelli'].some((c) => s.comune.includes(c)) ? 'IS' : 'CB');
        if (prov !== filterProvincia) return false;
      }

      // Stato
      if (filterStato === 'ATTIVO' && s.attivo !== 1) return false;
      if (filterStato === 'INATTIVO' && s.attivo === 1) return false;

      // Online
      if (filterOnline === 'ONLINE' && s.online_attivo !== 1) return false;
      if (filterOnline === 'PRESENZA' && s.online_attivo === 1) return false;

      return true;
    });
  }, [sportelli, searchTerm, filterProvincia, filterStato, filterOnline]);

  // Aggregated KPIs
  const kpis = useMemo(() => {
    const total = sportelli.length;
    const attivi = sportelli.filter((s) => s.attivo === 1).length;
    const inattivi = total - attivi;
    const onlineAttivi = sportelli.filter((s) => s.online_attivo === 1).length;
    const provCB = sportelli.filter((s) => (s.provincia || '').toUpperCase() === 'CB' || !['Isernia', 'Venafro', 'Agnone', 'Frosolone', 'Fornelli'].some((c) => s.comune.includes(c))).length;
    const provIS = total - provCB;
    return { total, attivi, inattivi, onlineAttivi, provCB, provIS };
  }, [sportelli]);

  // Guard view for unauthorized roles
  if (!isAuthorized) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Accesso Riservato alla Rete Sportelli
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            La gestione dei punti di sportello territoriale, dei responsabili e degli orari è visibile ed utilizzabile esclusivamente dagli utenti con ruolo di{' '}
            <strong className="text-slate-800">Amministratore (Admin)</strong> o{' '}
            <strong className="text-slate-800">Coordinatore Generale</strong>.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">
            <span>Il tuo ruolo corrente:</span>
            <span className="text-rose-600 font-bold">{effectiveRole}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 border border-emerald-500/80 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{successToast}</span>
          <button
            onClick={() => setSuccessToast(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-sky-50/80 to-transparent rounded-full pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Rete Territoriale PR Molise FESR FSE+ 2021-2027</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span>Gestione Sportelli Territoriali</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Ruolo: {effectiveRole === 'ADMIN' ? 'Amministratore' : 'Coordinatore Generale'}
              </span>
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Configura i punti territoriali regionali, assegna i responsabili di presidio, definisci giorni e orari di apertura al pubblico e controlla l'abilitazione delle consulenze da remoto in videocall.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Esporta elenco completo in CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Esporta CSV</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Ricarica elenco da server"
            >
              <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Aggiorna</span>
            </button>

            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold shadow-sm shadow-sky-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuovo Sportello</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Totale Sportelli</span>
            <Building2 className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{kpis.total}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
            <span className="font-medium text-sky-700">{kpis.provCB} Campobasso</span>
            <span>•</span>
            <span className="font-medium text-indigo-700">{kpis.provIS} Isernia</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Sportelli Attivi</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {kpis.attivi} <span className="text-xs font-medium text-slate-400">/ {kpis.total}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpis.inattivi > 0 ? (
              <span className="text-amber-600 font-semibold">{kpis.inattivi} temporaneamente inattivi</span>
            ) : (
              <span className="text-emerald-700 font-semibold">100% Rete operativa</span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Videocall Online</span>
            <Video className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">{kpis.onlineAttivi}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sportelli con stanza virtuale remota attiva
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Operatori & Responsabili</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {operatori.length || '12'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Personale censito e assegnato ai presidi
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per comune, nome, indirizzo, responsabile..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Provincia */}
            <select
              value={filterProvincia}
              onChange={(e) => setFilterProvincia(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Tutte le Province (CB & IS)</option>
              <option value="CB">Provincia di Campobasso (CB)</option>
              <option value="IS">Provincia di Isernia (IS)</option>
            </select>

            {/* Stato */}
            <select
              value={filterStato}
              onChange={(e) => setFilterStato(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Tutti gli stati</option>
              <option value="ATTIVO">Solo Attivi</option>
              <option value="INATTIVO">Solo Inattivi</option>
            </select>

            {/* Canale */}
            <select
              value={filterOnline}
              onChange={(e) => setFilterOnline(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="ALL">Tutti i Canali</option>
              <option value="ONLINE">Con Videocall Online</option>
              <option value="PRESENZA">Solo in Presenza</option>
            </select>

            {/* View Mode Toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md text-xs transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista a schede"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vista tabellare compatta"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Counter of results */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Mostrati <strong className="text-slate-800">{filteredSportelli.length}</strong> sportelli su{' '}
            <strong className="text-slate-800">{sportelli.length}</strong> censiti
          </div>
          {(searchTerm || filterProvincia !== 'ALL' || filterStato !== 'ALL' || filterOnline !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterProvincia('ALL');
                setFilterStato('ALL');
                setFilterOnline('ALL');
              }}
              className="text-sky-600 hover:underline font-semibold"
            >
              Azzera tutti i filtri
            </button>
          )}
        </div>
      </div>

      {/* Main List: Grid or Table */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-sky-600" />
          <p className="text-xs font-semibold">Caricamento punti di sportello territoriale in corso...</p>
        </div>
      ) : filteredSportelli.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 space-y-3">
          <Building2 className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="text-sm font-bold text-slate-800">Nessuno sportello corrisponde ai criteri</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Verifica il termine di ricerca inserito o azzera i filtri per visualizzare l'intera rete territoriale.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSportelli.map((s) => {
            const prov = s.provincia || (['Isernia', 'Venafro', 'Agnone', 'Frosolone', 'Fornelli'].some((c) => s.comune.includes(c)) ? 'IS' : 'CB');
            const isOnline = s.online_attivo === 1;
            const isAttivo = s.attivo === 1;

            return (
              <div
                key={s.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isAttivo ? 'border-slate-200 hover:border-sky-300' : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                {/* Card Top Section */}
                <div className="p-5 space-y-3">
                  {/* Top badges bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          prov === 'IS'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}
                      >
                        {prov} • {prov === 'IS' ? 'Isernia' : 'Campobasso'}
                      </span>

                      {/* Online status badge */}
                      <button
                        onClick={() => handleToggleOnline(s)}
                        title="Clicca per invertire l'abilitazione videocall online"
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                          isOnline
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isOnline ? (
                          <>
                            <Video className="w-3 h-3 text-purple-600" />
                            <span>Online On</span>
                          </>
                        ) : (
                          <>
                            <VideoOff className="w-3 h-3 text-slate-400" />
                            <span>Solo Presenza</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Active toggle button */}
                    <button
                      onClick={() => handleToggleActive(s)}
                      title={isAttivo ? 'Clicca per disattivare' : 'Clicca per attivare'}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                        isAttivo
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isAttivo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      <span>{isAttivo ? 'Attivo' : 'Sospeso'}</span>
                    </button>
                  </div>

                  {/* Title & Comune */}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
                      {s.comune}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">{s.nome}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{s.indirizzo}</span>
                    </p>
                  </div>

                  {/* Responsabile & Operatori */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Responsabile</span>
                      <span className="font-bold text-slate-800">
                        {s.responsabile_nome || 'Da assegnare'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-sky-600" />
                        <span>{s.responsabile_telefono || s.telefono}</span>
                      </span>
                      <span className="flex items-center gap-1 truncate" title={s.responsabile_email || s.email}>
                        <Mail className="w-3 h-3 text-sky-600 shrink-0" />
                        <span className="truncate">{s.responsabile_email || s.email}</span>
                      </span>
                    </div>

                    {s.operatori_assegnati && (
                      <div className="text-[10px] text-slate-500 pt-1">
                        Operatori presidio: <strong className="text-slate-700">{s.operatori_assegnati}</strong>
                      </div>
                    )}
                  </div>

                  {/* Opening Days & Hours */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-start gap-2 text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-800">{s.giorni}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{s.orario} • {s.cadenza}</span>
                        </div>
                      </div>
                    </div>

                    {/* Note di accesso */}
                    {s.note_accesso && (
                      <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-100 text-[11px] text-sky-900 line-clamp-2">
                        <Info className="w-3 h-3 text-sky-600 inline mr-1" />
                        {s.note_accesso}
                      </div>
                    )}

                    {/* Videocall link snippet */}
                    {isOnline && s.link_videocall && (
                      <div className="flex items-center justify-between gap-1 p-2 rounded-lg bg-purple-50/70 border border-purple-100 text-[11px] text-purple-900">
                        <span className="truncate flex items-center gap-1 font-mono text-[10px]">
                          <Video className="w-3 h-3 text-purple-600 shrink-0" />
                          <span className="truncate">{s.link_videocall}</span>
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleCopyLink(s.link_videocall || '', s.id)}
                            className="p-1 text-purple-700 hover:text-purple-900 cursor-pointer"
                            title="Copia link stanza"
                          >
                            {copiedId === s.id ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={s.link_videocall}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-purple-700 hover:text-purple-900"
                            title="Apri stanza online"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleOpenSlotTest(s)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold transition-colors cursor-pointer"
                    title="Verifica disponibilità slot orari calcolati dal sistema"
                  >
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Test Slot</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold border border-sky-200 transition-colors cursor-pointer"
                      title="Modifica parametri dello sportello"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifica</span>
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Elimina o disattiva sportello"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Comune & Sede</th>
                  <th className="py-3 px-3">Prov.</th>
                  <th className="py-3 px-4">Responsabile</th>
                  <th className="py-3 px-4">Giorni & Orari</th>
                  <th className="py-3 px-3">Online</th>
                  <th className="py-3 px-3">Stato</th>
                  <th className="py-3 px-4 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredSportelli.map((s) => {
                  const prov = s.provincia || (['Isernia', 'Venafro', 'Agnone', 'Frosolone', 'Fornelli'].some((c) => s.comune.includes(c)) ? 'IS' : 'CB');
                  const isOnline = s.online_attivo === 1;
                  const isAttivo = s.attivo === 1;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-slate-900">{s.comune}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{s.nome}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{s.indirizzo}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${prov === 'IS' ? 'bg-indigo-100 text-indigo-800' : 'bg-sky-100 text-sky-800'}`}>
                          {prov}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{s.responsabile_nome || 'Da assegnare'}</div>
                        <div className="text-[11px] text-slate-500">{s.responsabile_telefono || s.telefono}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{s.giorni}</div>
                        <div className="text-[11px] text-slate-500">{s.orario} • {s.cadenza}</div>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleOnline(s)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                            isOnline
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {isOnline ? 'Online On' : 'Solo Presenza'}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleActive(s)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                            isAttivo
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {isAttivo ? 'Attivo' : 'Sospeso'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenSlotTest(s)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                          title="Test slot"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded text-[11px] font-bold"
                        >
                          Modifica
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(s.id)}
                          className="px-2 py-1 text-slate-400 hover:text-rose-600 rounded text-[11px]"
                        >
                          Elimina
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREA / MODIFICA SPORTELLO
         ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    {editingSportello ? `Modifica Sportello: ${editingSportello.comune}` : 'Crea Nuovo Sportello Territoriale'}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Configura dati identificativi, orari di apertura, responsabile e collegamento online.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* SEZIONE 1: DATI GENERALI E LOCALIZZAZIONE */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-sky-800 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>1. Dati Sede e Localizzazione Geografica</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Comune del Molise *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.comune}
                      onChange={(e) => handleComuneChange(e.target.value)}
                      placeholder="es. Campobasso, Termoli, Agnone, Larino..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Provincia *
                    </label>
                    <select
                      value={formData.provincia}
                      onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-sky-500"
                    >
                      <option value="CB">CB - Campobasso</option>
                      <option value="IS">IS - Isernia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Denominazione Sede *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="es. Sede Centrale Sviluppo Italia Molise, Presidio Territoriale di Termoli..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Indirizzo Completo con Civico e CAP *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.indirizzo}
                    onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                    placeholder="es. Via XXIV Maggio 130, 86100 Campobasso (CB)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Latitudine GPS (Mappa Molise)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.lat}
                      onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Longitudine GPS (Mappa Molise)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.lng}
                      onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEZIONE 2: RESPONSABILE DI SPORTELLO E CONTATTI */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-purple-800 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <span>2. Responsabile di Sportello e Presidio Operativo</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nome e Cognome Responsabile
                    </label>
                    <input
                      type="text"
                      value={formData.responsabile_nome}
                      onChange={(e) => setFormData({ ...formData, responsabile_nome: e.target.value })}
                      placeholder="es. Dott. Marco Rossi"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                    {operatori.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500">
                        <span>Assegna da operatori:</span>
                        {operatori.slice(0, 4).map((op) => (
                          <button
                            key={op.id}
                            type="button"
                            onClick={() =>
                              setFormData({
                                ...formData,
                                responsabile_nome: `${op.nome} ${op.cognome}`,
                                responsabile_email: op.email
                              })
                            }
                            className="text-sky-600 hover:underline"
                          >
                            {op.nome} {op.cognome}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email di Contatto / Responsabile
                    </label>
                    <input
                      type="email"
                      value={formData.responsabile_email}
                      onChange={(e) => setFormData({ ...formData, responsabile_email: e.target.value })}
                      placeholder="sportelloimprese@sviluppoitaliamolise.it"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefono Diretto Sportello
                    </label>
                    <input
                      type="text"
                      value={formData.responsabile_telefono}
                      onChange={(e) => setFormData({ ...formData, responsabile_telefono: e.target.value })}
                      placeholder="0874 011011"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Operatori Assegnati (Nominativi)
                    </label>
                    <input
                      type="text"
                      value={formData.operatori_assegnati}
                      onChange={(e) => setFormData({ ...formData, operatori_assegnati: e.target.value })}
                      placeholder="es. Chiara Mancini, Luca Colalillo..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* SEZIONE 3: DATE, ORARI DI APERTURA E CADENZA */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>3. Giorni e Fasce Orarie di Apertura</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giorni Settimanali di Apertura al Pubblico
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_DAYS_OPTIONS.map((day) => {
                      const isChecked = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleToggleDay(day)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {isChecked ? '✓ ' : '+ '}
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    I giorni selezionati determineranno le date in cui le imprese potranno prenotare appuntamenti su questo sportello.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Fascia Oraria di Ricevimento
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.orario}
                      onChange={(e) => setFormData({ ...formData, orario: e.target.value })}
                      placeholder="es. 09:30 - 12:00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500">
                      <span>Preset rapidi:</span>
                      {PRESET_HOURS.slice(0, 3).map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => setFormData({ ...formData, orario: h })}
                          className="text-sky-600 hover:underline"
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Cadenza del Servizio
                    </label>
                    <select
                      value={formData.cadenza}
                      onChange={(e) => setFormData({ ...formData, cadenza: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    >
                      {PRESET_CADENZE.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Note di Accesso alla Sede (per l'Utenza)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.note_accesso}
                    onChange={(e) => setFormData({ ...formData, note_accesso: e.target.value })}
                    placeholder="es. Primo piano, ingresso laterale Municipio, citofono Sportello Imprese, ascensore disabili presente."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* SEZIONE 4: COLLEGAMENTO ONLINE E VIDEOCALL */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-indigo-800 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5" />
                  <span>4. Consulenze Online da Remoto (Videocall)</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Abilita Collegamento Online per questo Sportello
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Se disabilitato, l'utente potrà prenotare colloqui esclusivamente in presenza fisica presso la sede.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.online_attivo === 1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        online_attivo: e.target.checked ? 1 : 0
                      })
                    }
                    className="w-5 h-5 accent-sky-600 rounded cursor-pointer"
                  />
                </div>

                {formData.online_attivo === 1 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Link Stanza Virtuale Videocall (Jitsi / Meet / Teams)
                    </label>
                    <input
                      type="url"
                      value={formData.link_videocall}
                      onChange={(e) => setFormData({ ...formData, link_videocall: e.target.value })}
                      placeholder="https://meet.jit.si/SportelloImpreseMolise_Comune"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                    />
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>Questo link verrà allegato all'email di conferma e nel promemoria dell'imprenditore.</span>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            link_videocall: `https://meet.jit.si/SportelloImpreseMolise_${formData.comune.replace(/\s+/g, '') || 'Sede'}`
                          })
                        }
                        className="text-sky-600 font-semibold hover:underline"
                      >
                        Genera link Jitsi predefinito
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SEZIONE 5: STATO DELLO SPORTELLO */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Sportello Attivo e Aperto alle Prenotazioni
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Se disattivato, lo sportello non sarà prenotabile dal portale pubblico né apparirà tra le sedi selezionabili.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.attivo === 1}
                  onChange={(e) => setFormData({ ...formData, attivo: e.target.checked ? 1 : 0 })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  {formSubmitting
                    ? 'Salvataggio in corso...'
                    : editingSportello
                    ? 'Salva Modifiche Sportello'
                    : 'Crea e Attiva Sportello'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TEST DISPONIBILITÀ SLOT & CALENDARIO
         ========================================================================= */}
      {testingSportello && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Test Motore Slot: {testingSportello.comune}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Apertura: {testingSportello.giorni} • {testingSportello.orario}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTestingSportello(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seleziona Data di Test (YYYY-MM-DD)
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => {
                      setTestDate(e.target.value);
                      fetchTestSlots(testingSportello.id, e.target.value);
                    }}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    onClick={() => fetchTestSlots(testingSportello.id, testDate)}
                    disabled={testSlotLoading}
                    className="px-3 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold hover:bg-sky-500"
                  >
                    {testSlotLoading ? 'Calcolo...' : 'Ricalcola'}
                  </button>
                </div>
              </div>

              {testSlotLoading ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-600 mb-2" />
                  <span>Interrogazione algoritmo slot in tempo reale...</span>
                </div>
              ) : testSlotResults ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span>Stato Sportello alla data:</span>
                    {testSlotResults.open !== false ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aperto
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Chiuso ({testSlotResults.reason})
                      </span>
                    )}
                  </div>

                  {testSlotResults.slots && testSlotResults.slots.length > 0 ? (
                    <div>
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        Slot da 30 minuti generati ({testSlotResults.slots.length}):
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                        {testSlotResults.slots.map((sl: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-center text-xs font-mono font-bold border ${
                              sl.available
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
                            }`}
                          >
                            {sl.time}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : testSlotResults.open !== false ? (
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs">
                      Nessuno slot generato per l'orario configurato ({testingSportello.orario}).
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setTestingSportello(null)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFERMA ELIMINAZIONE
         ========================================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Confermi l'eliminazione dello sportello?
              </h3>
              <p className="text-xs text-slate-500">
                Se sono presenti appuntamenti storici collegati a questa sede, lo sportello verrà automaticamente disattivato in sicurezza invece che cancellato dal database, preservando lo storico degli appuntamenti delle imprese.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Annulla
              </button>
              <button
                onClick={() => handleDeleteSportello(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
              >
                Sì, Procedi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
