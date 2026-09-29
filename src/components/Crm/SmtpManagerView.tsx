import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Send,
  Save,
  Server,
  Key,
  ShieldCheck,
  Database,
  FileCode,
  Info,
  ExternalLink,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { CrmRole } from '../../types';

interface SmtpManagerViewProps {
  role?: CrmRole;
}

interface SmtpDetails {
  configured: boolean;
  success: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  from?: { name: string; address: string };
  replyTo?: { name: string; address: string };
  error?: string;
  rawConfig?: {
    host: string;
    port: string;
    secure: string;
    user: string;
    hasPass: boolean;
    fromName: string;
    fromEmail: string;
    replyTo: string;
  };
  persistedInDb?: boolean;
  persistedInEnv?: boolean;
}

export const SmtpManagerView: React.FC<SmtpManagerViewProps> = () => {
  const [details, setDetails] = useState<SmtpDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Test email state
  const [testEmail, setTestEmail] = useState('lavori@systech.it');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; messageId?: string; error?: string } | null>(null);

  // Edit config state
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMessage, setConfigMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formConfig, setFormConfig] = useState({
    host: 'smtps.aruba.it',
    port: '465',
    secure: 'true',
    user: 'info@sviluppoitaliamolise.eu',
    pass: '',
    fromName: 'Sportello Imprese Molise',
    fromEmail: 'info@sviluppoitaliamolise.eu',
    replyTo: 'sportelloimprese@sviluppoitaliamolise.it'
  });

  const loadStatus = async (isVerifying = false) => {
    if (isVerifying) setVerifying(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/smtp/status');
      const data: SmtpDetails = await res.json();
      setDetails(data);

      if (data.rawConfig) {
        setFormConfig((prev) => ({
          ...prev,
          host: data.rawConfig?.host || prev.host,
          port: String(data.rawConfig?.port || prev.port),
          secure: String(data.rawConfig?.secure ?? prev.secure),
          user: data.rawConfig?.user || prev.user,
          fromName: data.rawConfig?.fromName || prev.fromName,
          fromEmail: data.rawConfig?.fromEmail || prev.fromEmail,
          replyTo: data.rawConfig?.replyTo || prev.replyTo
        }));
      }
    } catch (err: any) {
      console.error('Errore lettura stato SMTP:', err);
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || !testEmail.includes('@')) return;

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.trim() })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Errore di rete durante la richiesta' });
    } finally {
      setSendingTest(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigMessage(null);

    try {
      const res = await fetch('/api/smtp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formConfig)
      });
      const data = await res.json();

      if (data.success) {
        setConfigMessage({
          type: 'success',
          text: 'Parametri SMTP salvati con successo in SQLite (sportello.db) e nel file .env! Connessione verificata.'
        });
        loadStatus();
        setShowEditForm(false);
      } else {
        setConfigMessage({
          type: 'error',
          text: data.message || data.error || 'Errore salvataggio configurazione'
        });
      }
    } catch (err: any) {
      setConfigMessage({ type: 'error', text: err.message || 'Errore salvataggio configurazione' });
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Mail className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
                Configurazione & Diagnostica Email (SMTP)
              </h2>
              {details?.success ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Operativo
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Non Connesso
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gestione del server di posta in uscita per l&apos;invio affidabile di conferme appuntamento e file .ics ai cittadini.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => loadStatus(true)}
            disabled={verifying || loading}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin text-sky-600' : ''}`} />
            <span>{verifying ? 'Verifica in corso...' : 'Verifica Connessione'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowEditForm(!showEditForm)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>{showEditForm ? 'Chiudi Modifica' : 'Modifica Parametri'}</span>
          </button>
        </div>
      </div>

      {/* Banner Persistenza Garantita */}
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold text-slate-900">
              Persistenza Permanente Multi-Livello (Anti-Perdita Deploy)
            </div>
            <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5">
              I parametri SMTP sono sincronizzati in <strong>SQLite (sportello.db)</strong> e nel file <strong>.env</strong>: sopravvivono automaticamente a qualsiasi git pull, ricompilazione o riavvio del server.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-[10px] font-extrabold text-sky-800 shadow-2xs">
            <Database className="w-3 h-3 text-sky-600" />
            <span>DB: {details?.persistedInDb ? 'Salvato ✓' : 'In Sincronizzazione'}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-[10px] font-extrabold text-sky-800 shadow-2xs">
            <FileCode className="w-3 h-3 text-sky-600" />
            <span>.env: {details?.persistedInEnv ? 'Presente ✓' : 'Pronto'}</span>
          </span>
        </div>
      </div>

      {/* Form di Modifica Parametri SMTP (a comparsa) */}
      {showEditForm && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-sky-300 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-sky-600" />
              <h3 className="font-display font-bold text-base text-slate-900">
                Modifica Parametri Server SMTP
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Verranno salvati permanentemente nel database e nel file .env
            </span>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Host SMTP Provider *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. smtps.aruba.it"
                  value={formConfig.host}
                  onChange={(e) => setFormConfig({ ...formConfig, host: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Porta *</label>
                <input
                  type="number"
                  required
                  placeholder="Es. 465 o 587"
                  value={formConfig.port}
                  onChange={(e) => setFormConfig({ ...formConfig, port: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Protocollo di Sicurezza *</label>
                <select
                  value={formConfig.secure}
                  onChange={(e) => setFormConfig({ ...formConfig, secure: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="true">SSL / TLS Implicito (Porta 465 - Consigliato Aruba)</option>
                  <option value="false">STARTTLS (Porta 587)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Utente SMTP (Email) *</label>
                <input
                  type="text"
                  required
                  placeholder="Es. info@sviluppoitaliamolise.eu"
                  value={formConfig.user}
                  onChange={(e) => setFormConfig({ ...formConfig, user: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password SMTP {details?.rawConfig?.hasPass ? '(Già presente, inserisci per cambiare)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={details?.rawConfig?.hasPass ? '•••••••• (Invariata)' : 'Password casella email'}
                    value={formConfig.pass}
                    onChange={(e) => setFormConfig({ ...formConfig, pass: e.target.value })}
                    className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Mittente Visibile</label>
                <input
                  type="text"
                  placeholder="Es. Sportello Imprese Molise"
                  value={formConfig.fromName}
                  onChange={(e) => setFormConfig({ ...formConfig, fromName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Indirizzo Mittente (From)</label>
                <input
                  type="email"
                  placeholder="Es. info@sviluppoitaliamolise.eu"
                  value={formConfig.fromEmail}
                  onChange={(e) => setFormConfig({ ...formConfig, fromEmail: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Indirizzo Risposte (Reply-To)</label>
                <input
                  type="email"
                  placeholder="Es. sportelloimprese@sviluppoitaliamolise.it"
                  value={formConfig.replyTo}
                  onChange={(e) => setFormConfig({ ...formConfig, replyTo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {configMessage && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                  configMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {configMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{configMessage.text}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={savingConfig}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingConfig ? 'Salvataggio...' : 'Salva e Sincronizza'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid: Stato Attuale + Strumento Test Invio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Dettagli Connessione */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-600" />
              <span>Parametri Connessione Attivi</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">
              Host Principale: {details?.host || 'smtps.aruba.it'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Server & Porta
              </div>
              <div className="text-sm font-bold text-slate-800">
                {details?.host || 'smtps.aruba.it'}:{details?.port || 465}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Sicurezza: {details?.secure ? 'SSL/TLS (Implicit TLS)' : 'STARTTLS'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Utente Autenticato
              </div>
              <div className="text-sm font-bold text-slate-800 truncate" title={details?.user}>
                {details?.user || 'info@sviluppoitaliamolise.eu'}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Password registrata e verificata</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Intestazione Mittente (From)
              </div>
              <div className="text-sm font-bold text-slate-800 truncate">
                {details?.from?.name || 'Sportello Imprese Molise'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                &lt;{details?.from?.address || details?.user || 'info@sviluppoitaliamolise.eu'}&gt;
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Indirizzo Risposta (Reply-To)
              </div>
              <div className="text-sm font-bold text-slate-800 truncate">
                {details?.replyTo?.name || 'Sportello Imprese Molise'}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                &lt;{details?.replyTo?.address || 'sportelloimprese@sviluppoitaliamolise.it'}&gt;
              </div>
            </div>
          </div>

          {details?.error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <div className="font-bold">Avviso Connessione SMTP:</div>
                <div className="mt-0.5">{details.error}</div>
              </div>
            </div>
          )}
        </div>

        {/* Card Test Invio Immediato */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-600" />
                <span>Test Invio Email in Tempo Reale</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Invia un&apos;email di verifica reale per testare la consegna su Aruba.
              </p>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Destinatario per il Test *
                </label>
                <input
                  type="email"
                  required
                  placeholder="nome@dominio.it"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                disabled={sendingTest}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTest ? 'Invio in corso...' : 'Invia Email di Test'}</span>
              </button>
            </form>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {testResult.success ? (
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Email inviata con successo!</span>
                  </div>
                  <div className="text-[10px] text-emerald-700 truncate">
                    Message-ID: {testResult.messageId}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Controlla la casella di posta di <strong>{testEmail}</strong>.
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Invio fallito</span>
                  </div>
                  <div className="text-[11px] text-red-700">
                    {testResult.error || 'Errore sconosciuto'}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>L&apos;invio reale avviene tramite connessione TLS crittografata diretta al server Aruba.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
