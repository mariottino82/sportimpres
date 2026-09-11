import React, { useState } from 'react';
import { Logo, LogoRegioneMolise, LogoUnioneEuropea, LogoRepubblicaItaliana } from '../Logo';
import { CrmOperator } from '../../types';
import {
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface CrmLoginViewProps {
  onLoginSuccess: (operator: CrmOperator) => void;
  onExitCrm: () => void;
}

export const CrmLoginView: React.FC<CrmLoginViewProps> = ({
  onLoginSuccess,
  onExitCrm
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Inserisci sia lo username che la password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/crm/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Check local storage fallback if server returned error or offline
        const localUsers = JSON.parse(localStorage.getItem('crm_users_list') || '[]');
        const matched = localUsers.find(
          (u: any) =>
            u.username.toLowerCase() === username.trim().toLowerCase() &&
            u.password === password.trim()
        );

        if (matched && matched.attivo) {
          onLoginSuccess(matched);
          return;
        }

        setError(data.error || 'Credenziali non valide. Verificare username e password.');
        setIsLoading(false);
        return;
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      // Local fallback for edge cases
      const localUsers = JSON.parse(localStorage.getItem('crm_users_list') || '[]');
      const matched = localUsers.find(
        (u: any) =>
          u.username.toLowerCase() === username.trim().toLowerCase() &&
          u.password === password.trim()
      );

      if (matched && matched.attivo) {
        onLoginSuccess(matched);
        return;
      }

      // Hardcoded fallback for default admin
      if (username.trim().toLowerCase() === 'admin' && password.trim() === 'molise2027') {
        const defaultAdmin: CrmOperator = {
          id: 1,
          username: 'admin',
          nome: 'Marco',
          cognome: 'Rossi',
          email: 'm.rossi@sviluppoitaliamolise.it',
          ruolo: 'ADMIN',
          sportello_nome: 'Tutti gli Sportelli (Sede Centrale)',
          attivo: 1,
          creato_il: new Date().toISOString()
        };
        onLoginSuccess(defaultAdmin);
        return;
      }

      setError('Impossibile comunicare con il server di autenticazione.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        
        {/* Back link */}
        <button
          onClick={onExitCrm}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna al Portale Pubblico</span>
        </button>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* Top decorative accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-red-600" />

          {/* Institutional Logos header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
            <Logo size="sm" variant="dark" />
            <div className="flex items-center gap-2">
              <LogoRegioneMolise size="xs" variant="dark" />
              <LogoRepubblicaItaliana size="xs" variant="dark" />
              <LogoUnioneEuropea size="xs" variant="dark" />
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-950/80 border border-sky-800/60 text-sky-300 text-[11px] font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Accesso Riservato Operatori CRM</span>
            </div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Sportello Imprese Molise
            </h1>
            <p className="text-xs text-slate-400">
              Autenticazione richiesta per accedere a cruscotto, agenda appuntamenti e anagrafica 360°.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username Operatore
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="es. admin oppure operatore.cb"
                  autoFocus
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm shadow-md shadow-sky-950/50 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? 'Autenticazione in corso...' : 'Accedi all\'Area CRM'}</span>
            </button>
          </form>

        </div>

        {/* Institutional notice */}
        <p className="text-center text-[11px] text-slate-500">
          Piattaforma conforme al PR Molise FESR FSE+ 2021-2027
        </p>

      </div>
    </div>
  );
};
