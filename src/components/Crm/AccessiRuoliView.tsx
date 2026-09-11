import React, { useState, useEffect } from 'react';
import { CrmOperator, CrmRole, Sportello } from '../../types';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Building2,
  Mail,
  Calendar,
  AlertTriangle,
  FileText,
  Lock,
  Sparkles,
  X
} from 'lucide-react';

interface AccessiRuoliViewProps {
  currentUser?: CrmOperator | null;
  onRoleChanged?: (newRole: CrmRole) => void;
}

const DEFAULT_OPERATORS: CrmOperator[] = [
  {
    id: 1,
    username: 'admin',
    password: 'molise2027',
    nome: 'Marco',
    cognome: 'Rossi',
    email: 'm.rossi@sviluppoitaliamolise.it',
    ruolo: 'ADMIN',
    sportello_nome: 'Tutti gli Sportelli (Sede Centrale)',
    attivo: 1,
    creato_il: '2026-08-01 09:00:00',
    ultimo_accesso: '2026-09-02 09:15:00',
    note: 'Amministratore di sistema, gestione accessi e ruoli'
  },
  {
    id: 2,
    username: 'operatore.cb',
    password: 'sportello.cb',
    nome: 'Chiara',
    cognome: 'Mancini',
    email: 'c.mancini@sviluppoitaliamolise.it',
    ruolo: 'OPERATORE',
    sportello_id: 1,
    sportello_nome: 'Campobasso - Sede SIM',
    attivo: 1,
    creato_il: '2026-08-01 09:30:00',
    ultimo_accesso: '2026-09-01 16:40:00',
    note: 'Operatore front-office colloqui e scheda EDP'
  },
  {
    id: 3,
    username: 'operatore.is',
    password: 'sportello.is',
    nome: 'Luca',
    cognome: 'Colalillo',
    email: 'l.colalillo@sviluppoitaliamolise.it',
    ruolo: 'OPERATORE',
    sportello_id: 2,
    sportello_nome: 'Isernia - Centro Sviluppo',
    attivo: 1,
    creato_il: '2026-08-01 10:00:00',
    ultimo_accesso: '2026-08-30 11:20:00',
    note: 'Presidio territoriale provincia di Isernia'
  },
  {
    id: 4,
    username: 'contact.center',
    password: 'contact2027',
    nome: 'Elena',
    cognome: 'Pagano',
    email: 'contact@sviluppoitaliamolise.it',
    ruolo: 'CONTACT_CENTER',
    sportello_nome: 'Contact Center Regionale',
    attivo: 1,
    creato_il: '2026-08-01 10:30:00',
    ultimo_accesso: '2026-09-02 08:30:00',
    note: 'Accoglienza telefonica e presa appuntamenti'
  },
  {
    id: 5,
    username: 'comunicazione',
    password: 'webtv2027',
    nome: 'Andrea',
    cognome: 'Valente',
    email: 'comunicazione@sviluppoitaliamolise.it',
    ruolo: 'COMUNICAZIONE',
    sportello_nome: 'Ufficio Comunicazione & Web TV',
    attivo: 1,
    creato_il: '2026-08-01 11:00:00',
    ultimo_accesso: '2026-08-28 15:10:00',
    note: 'Gestione pillole Web TV e diffusione QR Code'
  },
  {
    id: 6,
    username: 'regione.molise',
    password: 'regione2027',
    nome: 'Antonio',
    cognome: 'Di Iorio',
    email: 'sviluppoeconomico@regione.molise.it',
    ruolo: 'ENTE',
    sportello_nome: 'Regione Molise - Assessorato Sviluppo Economico',
    attivo: 1,
    creato_il: '2026-08-01 11:30:00',
    ultimo_accesso: '2026-08-29 17:05:00',
    note: 'Referente istituzionale e monitoraggio periodico PR FESR FSE+'
  }
];

export const AccessiRuoliView: React.FC<AccessiRuoliViewProps> = ({
  currentUser,
  onRoleChanged
}) => {
  const [users, setUsers] = useState<CrmOperator[]>([]);
  const [sportelli, setSportelli] = useState<Sportello[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Visible passwords toggles by user id
  const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedTextNotice, setCopiedTextNotice] = useState<string | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<CrmOperator | null>(null);
  const [userToDelete, setUserToDelete] = useState<CrmOperator | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [releasedUserCredentials, setReleasedUserCredentials] = useState<{
    user: CrmOperator;
    rawPass: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setActionNotice({ type, message });
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Form states for creating new user
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    username: '',
    password: '',
    ruolo: 'OPERATORE' as CrmRole,
    sportello_id: '',
    sportello_nome: 'Campobasso - Sede SIM',
    email: '',
    note: ''
  });

  // Load operators from API database
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/crm/auth/users');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
          localStorage.setItem('crm_users_list', JSON.stringify(data));
          setIsLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API error fetching users, using local cache:', e);
    }

    // Fallback to local storage or defaults if network error
    const cached = localStorage.getItem('crm_users_list');
    if (cached) {
      try {
        setUsers(JSON.parse(cached));
      } catch {
        setUsers(DEFAULT_OPERATORS);
      }
    } else {
      setUsers(DEFAULT_OPERATORS);
    }
    setIsLoading(false);
  };

  // Load sportelli list for assigned locations
  const loadSportelli = async () => {
    try {
      const res = await fetch('/api/sportelli');
      if (res.ok) {
        const data = await res.json();
        setSportelli(data);
      }
    } catch (e) {
      console.warn('Error loading sportelli:', e);
    }
  };

  useEffect(() => {
    loadUsers();
    loadSportelli();
  }, []);

  const togglePasswordVisibility = (id: number) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, id: number, message = 'Copiato!') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedTextNotice(message);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedTextNotice(null);
    }, 2500);
  };

  // Generate secure readable password
  const generateSecurePassword = () => {
    const words = ['Molise', 'Sviluppo', 'Impresa', 'Sportello', 'Innovazione', 'Fondi', 'Bando'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(100 + Math.random() * 900);
    const chars = '!@#$%&*';
    const randomChar = chars[Math.floor(Math.random() * chars.length)];
    return `${randomWord}#${randomNum}${randomChar}`;
  };

  // Auto-generate username from nome and cognome
  const handleNameChange = (nome: string, cognome: string) => {
    const cleanNome = nome.toLowerCase().replace(/[^a-z]/g, '');
    const cleanCognome = cognome.toLowerCase().replace(/[^a-z]/g, '');
    let suggestedUsername = formData.username;
    if (cleanNome && cleanCognome) {
      suggestedUsername = `${cleanNome}.${cleanCognome}`;
    } else if (cleanCognome) {
      suggestedUsername = cleanCognome;
    }
    setFormData((prev) => ({
      ...prev,
      nome,
      cognome,
      username: suggestedUsername,
      email: prev.email || (cleanNome && cleanCognome ? `${cleanNome}.${cleanCognome}@sviluppoitaliamolise.it` : prev.email)
    }));
  };

  // Open Create Modal with clean fields
  const handleOpenCreateModal = () => {
    const generatedPass = generateSecurePassword();
    setFormData({
      nome: '',
      cognome: '',
      username: '',
      password: generatedPass,
      ruolo: 'OPERATORE',
      sportello_id: sportelli.length > 0 ? String(sportelli[0].id) : '',
      sportello_nome: sportelli.length > 0 ? `${sportelli[0].comune} - ${sportelli[0].nome}` : 'Tutti gli Sportelli',
      email: '',
      note: ''
    });
    setShowCreateModal(true);
  };

  // Submit New User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.nome.trim() || !formData.cognome.trim()) {
      alert('Compila tutti i campi obbligatori (Nome, Cognome, Username, Password).');
      return;
    }

    const payload = {
      ...formData,
      username: formData.username.trim().toLowerCase(),
      password: formData.password.trim(),
      nome: formData.nome.trim(),
      cognome: formData.cognome.trim(),
      sportello_id: formData.sportello_id ? Number(formData.sportello_id) : null
    };

    setIsLoading(true);
    try {
      const res = await fetch('/api/crm/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newUser = await res.json();
        await loadUsers();
        setShowCreateModal(false);
        setReleasedUserCredentials({
          user: newUser,
          rawPass: formData.password
        });
        showNotification('success', `Nuova utenza "${newUser.username}" creata e salvata con successo nel database SQL (tabella crm_operatori).`);
        return;
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Errore durante la creazione dell\'utenza');
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Errore di connessione con il database');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle active status
  const handleToggleStatus = async (user: CrmOperator) => {
    const newStatus = user.attivo === 1 ? 0 : 1;
    try {
      const res = await fetch(`/api/crm/auth/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attivo: newStatus })
      });
      if (res.ok) {
        await loadUsers();
        showNotification('success', newStatus === 1
          ? `Utenza "${user.username}" riattivata nel database SQL.`
          : `Utenza "${user.username}" sospesa nel database SQL.`);
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Errore durante la modifica dello stato');
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Errore di connessione durante l\'aggiornamento dello stato');
    }
  };

  // Trigger Delete User modal
  const handleDeleteUser = (user: CrmOperator) => {
    if (user.username === 'admin') {
      alert('Non è possibile eliminare l\'utenza amministrativa principale (admin).');
      return;
    }
    setUserToDelete(user);
  };

  // Execute permanent delete from database SQL
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/crm/auth/users/${userToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Errore durante la cancellazione nel database SQL');
      }

      await loadUsers();
      showNotification('success', `Utenza "${userToDelete.username}" (${userToDelete.nome} ${userToDelete.cognome}) eliminata definitivamente dalla tabella crm_operatori del database SQL.`);
    } catch (e: any) {
      showNotification('error', e.message || 'Errore durante l\'eliminazione dell\'utenza');
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  // Save Edit User to Database SQL
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/crm/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      if (res.ok) {
        await loadUsers();
        showNotification('success', `Modifiche salvate con successo nel database SQL per l'utenza "${editingUser.username}".`);
        setEditingUser(null);
        return;
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'Errore durante il salvataggio nel database');
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Errore salvataggio modifiche');
    } finally {
      setIsLoading(false);
    }
  };

  // Generate release slip text
  const generateSlipText = (u: CrmOperator, pass?: string) => {
    const pwd = pass || u.password || '••••••••';
    return `=====================================================
SCHEDA DI RILASCIO CREDENZIALI - AREA CRM
SPORTELLO IMPRESE MOLISE
Iniziativa PR Molise FESR FSE+ 2021-2027 • Azione 1.4.2
=====================================================

Gentile Operatore / Collaboratore: ${u.nome} ${u.cognome}
Ruolo Assegnato: ${u.ruolo}
Presidio / Sportello: ${u.sportello_nome || 'Sede Centrale'}
Email Istituzionale: ${u.email || 'N/D'}

DATI DI ACCESSO ALLA PIATTAFORMA:
- URL Portale: https://sportelloimprese.molise.it (Sezione "Area CRM")
- Username: ${u.username}
- Password: ${pwd}

ISTRUZIONI DI SICUREZZA:
1. Le presenti credenziali sono strettamente personali e non cedibili.
2. Al primo accesso, verificare il corretto profilo autorizzativo assegnato.
3. In caso di smarrimento, contattare tempestivamente il Coordinamento Generale.

Data Rilascio: ${new Date().toLocaleDateString('it-IT')}
Sviluppo Italia Molise S.p.A. - Area Sistemi Informativi & CRM
=====================================================`;
  };

  // Role metadata styling
  const roleConfig: Record<CrmRole, { label: string; badge: string; desc: string }> = {
    ADMIN: {
      label: 'Amministratore (Admin)',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      desc: 'Accesso totale al sistema e gestione accessi e ruoli'
    },
    COORDINATORE: {
      label: 'Coordinatore Generale',
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      desc: 'Supervisione 12 sportelli, target e reportistica'
    },
    OPERATORE: {
      label: 'Operatore di Sportello',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      desc: 'Gestione agenda, colloqui e scheda EDP 360°'
    },
    CONTACT_CENTER: {
      label: 'Contact Center',
      badge: 'bg-sky-100 text-sky-800 border-sky-200',
      desc: 'Accoglienza telefonica, WhatsApp e presa appuntamenti'
    },
    COMUNICAZIONE: {
      label: 'Staff Comunicazione',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      desc: 'Web TV, diffusione QR Code e campagne territoriali'
    },
    ENTE: {
      label: 'Regione Molise / SIM',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      desc: 'Consultazione dati aggregati, KPI e monitoraggio'
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      searchQuery === '' ||
      u.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.cognome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.sportello_nome && u.sportello_nome.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || u.ruolo === roleFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ATTIVO' && u.attivo === 1) ||
      (statusFilter === 'SOSPESO' && u.attivo === 0);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = users.length;
  const adminUsers = users.filter((u) => u.ruolo === 'ADMIN').length;
  const activeOperators = users.filter((u) => u.ruolo === 'OPERATORE' && u.attivo === 1).length;
  const coordinators = users.filter((u) => u.ruolo === 'COORDINATORE').length;
  const activeAccounts = users.filter((u) => u.attivo === 1).length;

  return (
    <div className="space-y-6">
      
      {/* Toast Notice */}
      {copiedTextNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{copiedTextNotice}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 border border-sky-100 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Gestione Accessi, Utenti e Ruoli CRM
            </h1>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Rilascio e revoca credenziali (username e password) per gli operatori di sportello, coordinatori e referenti regionali.
            Gli accessi generati consentono il login nell'Area Riservata CRM.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadUsers}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
            title="Ricarica elenco utenze"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-600' : ''}`} />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span><span className="hidden sm:inline">Rilascia </span>Nuove Credenziali</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Utenze Totali
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalUsers}</span>
            <span className="text-xs text-emerald-600 font-semibold">{activeAccounts} attive</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Amministratori (Admin)
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">{adminUsers}</span>
            <span className="text-xs text-slate-500 font-semibold">gestori accessi</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Operatori Sportello
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">{activeOperators}</span>
            <span className="text-xs text-slate-500 font-semibold">su 12 presidi</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Coordinatori & Altri
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600">
              {coordinators + users.filter((u) => u.ruolo === 'CONTACT_CENTER' || u.ruolo === 'ENTE' || u.ruolo === 'COMUNICAZIONE').length}
            </span>
            <span className="text-xs text-slate-500 font-semibold">supervisori ed enti</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cerca per nome, username o sportello..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtra per:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">Tutti i Ruoli</option>
            <option value="ADMIN">Amministratore (Admin)</option>
            <option value="OPERATORE">Operatore Sportello</option>
            <option value="COORDINATORE">Coordinatore Generale</option>
            <option value="CONTACT_CENTER">Contact Center</option>
            <option value="COMUNICAZIONE">Staff Comunicazione</option>
            <option value="ENTE">Regione Molise / SIM</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="ALL">Tutti gli Stati</option>
            <option value="ATTIVO">Solo Attivi</option>
            <option value="SOSPESO">Solo Sospesi</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Mobile Cards View (< sm) */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 font-medium text-xs">
              Nessuna utenza trovata con i filtri selezionati.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const roleMeta = roleConfig[user.ruolo] || {
                label: user.ruolo,
                badge: 'bg-slate-100 text-slate-700 border-slate-200'
              };
              const isPassRevealed = revealedPasswords[user.id];
              const isCurrent = currentUser?.username === user.username;

              return (
                <div
                  key={user.id}
                  className={`p-4 space-y-3 ${user.attivo === 0 ? 'opacity-65 bg-slate-50/50' : ''}`}
                >
                  {/* Top user badge & role */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          user.ruolo === 'ADMIN'
                            ? 'bg-rose-100 text-rose-700'
                            : user.ruolo === 'COORDINATORE'
                            ? 'bg-purple-100 text-purple-700'
                            : user.ruolo === 'OPERATORE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : user.ruolo === 'ENTE'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {user.nome[0]}
                        {user.cognome[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span className="truncate">{user.nome} {user.cognome}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-100 text-sky-700 border border-sky-200 shrink-0">
                              TU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{user.email || 'N/D'}</div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badge}`}>
                        {roleMeta.label}
                      </span>
                      {user.attivo === 1 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Attivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Sospeso
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-[11px]">Username:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
                          {user.username}
                        </span>
                        <button
                          onClick={() => copyToClipboard(user.username, user.id, 'Username copiato!')}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copia username"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500 text-[11px]">Password:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                          {isPassRevealed ? user.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                          title={isPassRevealed ? 'Nascondi password' : 'Mostra password'}
                        >
                          {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {user.password && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(user.password!, user.id, 'Password copiata!')}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Copia password"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center gap-1 pt-1 border-t border-slate-200/60">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{user.sportello_nome || 'Tutti gli Sportelli'}</span>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          generateSlipText(user),
                          user.id,
                          'Scheda credenziali copiata per invio email!'
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-xs font-bold transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Copia Scheda</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser({ ...user })}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Modifica utenza e ruolo"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          user.attivo === 1
                            ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                            : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.attivo === 1 ? 'Sospendi utenza' : 'Riattiva utenza'}
                      >
                        {user.attivo === 1 ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>

                      {user.username !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Elimina definitivamente utenza"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View (>= sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Operatore & Anagrafica</th>
                <th className="py-3.5 px-4">Username & Accesso</th>
                <th className="py-3.5 px-4">Password</th>
                <th className="py-3.5 px-4">Ruolo Assegnato</th>
                <th className="py-3.5 px-4">Sportello di Riferimento</th>
                <th className="py-3.5 px-4">Stato</th>
                <th className="py-3.5 px-4 text-right">Azioni & Scheda</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    Nessuna utenza trovata con i filtri selezionati.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleMeta = roleConfig[user.ruolo] || {
                    label: user.ruolo,
                    badge: 'bg-slate-100 text-slate-700 border-slate-200'
                  };
                  const isPassRevealed = revealedPasswords[user.id];
                  const isCurrent = currentUser?.username === user.username;

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        user.attivo === 0 ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Operatore Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              user.ruolo === 'ADMIN'
                                ? 'bg-rose-100 text-rose-700'
                                : user.ruolo === 'COORDINATORE'
                                ? 'bg-purple-100 text-purple-700'
                                : user.ruolo === 'OPERATORE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : user.ruolo === 'ENTE'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'bg-sky-100 text-sky-700'
                            }`}
                          >
                            {user.nome[0]}
                            {user.cognome[0]}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>
                                {user.nome} {user.cognome}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-100 text-sky-700 border border-sky-200">
                                  TU
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{user.email || 'N/D'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {user.username}
                          </span>
                          <button
                            onClick={() => copyToClipboard(user.username, user.id, 'Username copiato!')}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Copia username"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Ultimo: {user.ultimo_accesso ? user.ultimo_accesso.substring(0, 16) : 'Mai'}
                        </div>
                      </td>

                      {/* Password */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-800">
                            {isPassRevealed ? user.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                            title={isPassRevealed ? 'Nascondi password' : 'Mostra password'}
                          >
                            {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          {user.password && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(user.password!, user.id, 'Password copiata!')}
                              className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              title="Copia password"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Ruolo */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleMeta.badge}`}
                        >
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* Sportello */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">
                            {user.sportello_nome || 'Tutti gli Sportelli'}
                          </span>
                        </div>
                      </td>

                      {/* Stato */}
                      <td className="py-3.5 px-4">
                        {user.attivo === 1 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Attivo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Sospeso
                          </span>
                        )}
                      </td>

                      {/* Azioni */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Copia Scheda Rilascio */}
                          <button
                            onClick={() =>
                              copyToClipboard(
                                generateSlipText(user),
                                user.id,
                                'Scheda credenziali copiata per invio email!'
                              )
                            }
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                            title="Copia Scheda Rilascio Credenziali (formato testo pronto per email)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Modifica */}
                          <button
                            onClick={() => setEditingUser({ ...user })}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Modifica utenza e ruolo"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Attiva/Sospendi */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              user.attivo === 1
                                ? 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={user.attivo === 1 ? 'Sospendi utenza' : 'Riattiva utenza'}
                          >
                            {user.attivo === 1 ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Elimina */}
                          {user.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Elimina definitivamente utenza"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Rilascia Nuove Credenziali */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Rilascio Nuove Credenziali Operatore CRM
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assegna username, password e ruolo per l'accesso alla piattaforma gestionale.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Giulia"
                    value={formData.nome}
                    onChange={(e) => handleNameChange(e.target.value, formData.cognome)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Ferri"
                    value={formData.cognome}
                    onChange={(e) => handleNameChange(formData.nome, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username di Accesso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. giulia.ferri"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-slate-400">Usato per il login nel CRM</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Password Rilasciata *
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, password: generateSecurePassword() })}
                      className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5"
                    >
                      <Sparkles className="w-3 h-3" />
                      Rigenera
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ruolo da Assegnare *
                  </label>
                  <select
                    value={formData.ruolo}
                    onChange={(e) => setFormData({ ...formData, ruolo: e.target.value as CrmRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="ADMIN">Amministratore (Admin)</option>
                    <option value="OPERATORE">Operatore di Sportello</option>
                    <option value="COORDINATORE">Coordinatore Generale</option>
                    <option value="CONTACT_CENTER">Operatore Contact Center</option>
                    <option value="COMUNICAZIONE">Staff Comunicazione & Web TV</option>
                    <option value="ENTE">Regione Molise / SIM (Ente)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Presidio / Sportello
                  </label>
                  <select
                    value={formData.sportello_id}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const sp = sportelli.find((s) => String(s.id) === selId);
                      setFormData({
                        ...formData,
                        sportello_id: selId,
                        sportello_nome: sp ? `${sp.comune} - ${sp.nome}` : 'Tutti gli Sportelli'
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">Tutti gli Sportelli / Sede Centrale</option>
                    {sportelli.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.comune} - {sp.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Istituzionale
                </label>
                <input
                  type="email"
                  placeholder="nome.cognome@sviluppoitaliamolise.it"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note Operative Interne (facoltative)
                </label>
                <input
                  type="text"
                  placeholder="es. Operatore turnazione lunedì e giovedì"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Conferma e Rilascia Credenziali
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Scheda Rilascio Completato */}
      {releasedUserCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900">
                  Credenziali Rilasciate con Successo!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  L'operatore <strong className="text-slate-900">{releasedUserCredentials.user.nome} {releasedUserCredentials.user.cognome}</strong> può ora accedere all'Area CRM con i seguenti parametri:
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-bold text-slate-900">{releasedUserCredentials.user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Password:</span>
                  <span className="font-bold text-emerald-600">{releasedUserCredentials.rawPass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ruolo:</span>
                  <span className="font-bold text-slate-900">{releasedUserCredentials.user.ruolo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Presidio:</span>
                  <span className="text-slate-800">{releasedUserCredentials.user.sportello_nome}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() =>
                    copyToClipboard(
                      generateSlipText(releasedUserCredentials.user, releasedUserCredentials.rawPass),
                      releasedUserCredentials.user.id,
                      'Testo per email copiato negli appunti!'
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copia Promemoria per Operatore</span>
                </button>
                <button
                  onClick={() => setReleasedUserCredentials(null)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Modifica Utenza */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Modifica Utenza: {editingUser.username}
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome</label>
                  <input
                    type="text"
                    value={editingUser.nome}
                    onChange={(e) => setEditingUser({ ...editingUser, nome: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cognome</label>
                  <input
                    type="text"
                    value={editingUser.cognome}
                    onChange={(e) => setEditingUser({ ...editingUser, cognome: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reimposta Password (lascia vuoto per non modificare)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    placeholder="Nuova password..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingUser({ ...editingUser, password: generateSecurePassword() })}
                    className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold whitespace-nowrap"
                  >
                    Genera Nuova
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ruolo</label>
                  <select
                    value={editingUser.ruolo}
                    onChange={(e) => setEditingUser({ ...editingUser, ruolo: e.target.value as CrmRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="ADMIN">Amministratore (Admin)</option>
                    <option value="OPERATORE">Operatore di Sportello</option>
                    <option value="COORDINATORE">Coordinatore Generale</option>
                    <option value="CONTACT_CENTER">Operatore Contact Center</option>
                    <option value="COMUNICAZIONE">Staff Comunicazione</option>
                    <option value="ENTE">Regione Molise / SIM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sportello</label>
                  <select
                    value={editingUser.sportello_id ? String(editingUser.sportello_id) : ''}
                    onChange={(e) => {
                      const selId = e.target.value;
                      const sp = sportelli.find((s) => String(s.id) === selId);
                      setEditingUser({
                        ...editingUser,
                        sportello_id: selId ? Number(selId) : null,
                        sportello_nome: sp ? `${sp.comune} - ${sp.nome}` : 'Tutti gli Sportelli'
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    <option value="">Tutti gli Sportelli / Sede Centrale</option>
                    {sportelli.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.comune} - {sp.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Istituzionale</label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'Salvataggio in corso...' : 'Salva Modifiche nel Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Conferma Eliminazione Utenza dal Database */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-base font-black text-slate-900 mb-1">
                Conferma Eliminazione Utenza
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Sei sicuro di voler revocare ed eliminare definitivamente dal database SQL l'utenza dell'operatore?
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mb-4 space-y-1.5">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>{userToDelete.nome} {userToDelete.cognome}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    ID #{userToDelete.id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  Username: @{userToDelete.username}
                </div>
                <div className="text-[11px] text-slate-500">
                  Ruolo: <span className="font-semibold text-slate-700">{userToDelete.ruolo}</span> • {userToDelete.sportello_nome || 'Sede Centrale'}
                </div>
              </div>

              <div className="text-[11px] text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 mb-6 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Il record verrà cancellato dalla tabella <strong>crm_operatori</strong> del database SQLite. L'operatore non potrà più autenticarsi.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Cancellazione in corso...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Elimina Definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Notice / Toast */}
      {actionNotice && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-medium ${
            actionNotice.type === 'success'
              ? 'bg-emerald-900 text-emerald-50 border-emerald-700'
              : 'bg-rose-900 text-rose-50 border-rose-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${actionNotice.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'} animate-ping`} />
            <span>{actionNotice.message}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="ml-2 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
