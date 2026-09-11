import React, { useState } from 'react';
import { ShieldCheck, Cookie, X, Building2, Mail, CheckCircle2, Lock, FileText, Info } from 'lucide-react';

interface PolicyModalProps {
  type: 'privacy' | 'cookies';
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type: initialType, onClose }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'cookies'>(initialType);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-6 flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/30 border border-sky-400/30 flex items-center justify-center text-sky-400">
              {activeTab === 'privacy' ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Cookie className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase tracking-wider">
                  Trasparenza & Conformità
                </span>
                <span className="text-[10px] text-slate-400">
                  Reg. UE 2016/679 (GDPR)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {activeTab === 'privacy' ? 'Informativa sulla Privacy (Privacy Policy)' : 'Informativa sui Cookie (Cookie Policy)'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Chiudi modale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6 pt-3 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'privacy'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg -mb-px'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Policy (GDPR)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cookies')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'cookies'
                ? 'border-sky-600 text-sky-700 bg-white rounded-t-lg -mb-px'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cookie className="w-4 h-4" />
            <span>Cookie Policy</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs text-slate-600 leading-relaxed">
          {activeTab === 'privacy' ? (
            <>
              {/* Privacy Summary Banner */}
              <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900 leading-relaxed">
                  <p className="font-bold mb-1">Trattamento dati nell'ambito del PR Molise FESR FSE+ 2021-2027</p>
                  <p>
                    La presente informativa descrive le modalità di gestione dei dati personali degli utenti (aspiranti imprenditori, imprese costituite, professionisti) che utilizzano il portale <strong>Sportello Imprese</strong> per la prenotazione di appuntamenti territoriali, videocall e supporto specialistico all'autoimprenditorialità (EDP - Azione 1.4.2).
                  </p>
                </div>
              </div>

              {/* Section 1: Titolare */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>1. Titolare del Trattamento e Dati di Contatto</span>
                </h4>
                <p>
                  Il Titolare del trattamento è <strong>Sviluppo Italia Molise S.p.A.</strong> (società in house della Regione Molise):
                </p>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1 text-[11px] text-slate-700">
                  <p>• <strong>Sede Legale ed Operativa:</strong> Via Vico 4, 86100 Campobasso (CB)</p>
                  <p>• <strong>Codice Fiscale / Partita IVA:</strong> 01234560700</p>
                  <p>• <strong>Email Istituzionale:</strong> sportelloimprese@sviluppoitaliamolise.it</p>
                  <p>• <strong>Posta Elettronica Certificata (PEC):</strong> sviluppoitaliamolise@pec.it</p>
                  <p>• <strong>Responsabile della Protezione Dati (DPO):</strong> dpo@sviluppoitaliamolise.it</p>
                </div>
              </div>

              {/* Section 2: Categorie di dati */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>2. Tipologie di Dati Personali Trattati</span>
                </h4>
                <p>I dati trattati attraverso il portale comprendono:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li><strong>Dati anagrafici e di contatto:</strong> nome, cognome, indirizzo email, recapito telefonico, codice fiscale, comune di residenza/domicilio.</li>
                  <li><strong>Dati d'impresa (per le imprese costituite):</strong> ragione sociale, Partita IVA, codice ATECO, settore economico, dimensione aziendale e sede legale/operativa.</li>
                  <li><strong>Dati di prenotazione e servizio:</strong> sede dello sportello prescelto, data e orario dell'appuntamento, modalità prescelta (in presenza o videocall remota), argomento di consulenza (Bandi regionali, EDP, creazione d'impresa, FSE+).</li>
                  <li><strong>Dati tecnici e di sessione:</strong> indirizzo IP, log tecnici di accesso temporanei per prevenire abusi e garantire la sicurezza delle prenotazioni.</li>
                </ul>
              </div>

              {/* Section 3: Finalità e base giuridica */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-600" />
                  <span>3. Finalità del Trattamento e Basi Giuridiche</span>
                </h4>
                <div className="space-y-2.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">A. Erogazione del servizio di orientamento e gestione appuntamenti</p>
                    <p className="text-slate-600 text-[11px]">
                      Pianificazione, conferma, promemoria via email/telefono e svolgimento dei colloqui specialistici presso gli 11 sportelli territoriali o la sede centrale.
                      <br /><em>Base giuridica: Esecuzione di misure precontrattuali e adempimento della richiesta dell'interessato (art. 6, par. 1, lett. b GDPR).</em>
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900 mb-1">B. Rendicontazione istituzionale PR Molise FESR FSE+ 2021-2027</p>
                    <p className="text-slate-600 text-[11px]">
                      Monitoraggio degli indicatori di output del progetto per conto della Regione Molise e dell'Autorità di Gestione dei Fondi Europei (Azione 1.4.2, CUP J19B25000190009).
                      <br /><em>Base giuridica: Esecuzione di un compito di interesse pubblico e adempimento di obblighi legali (art. 6, par. 1, lett. c ed e GDPR).</em>
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 4: Conservazione e Sicurezza */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">4. Misure di Sicurezza e Conservazione dei Dati</h4>
                <p>
                  Tutti i dati personali sono custoditi in database protetti con crittografia in transito (HTTPS/TLS) e a riposo. I dati vengono conservati per il tempo strettamente necessario all'esecuzione del servizio e agli obblighi previsti dai regolamenti comunitari sui fondi strutturali (periodo di conservazione della documentazione di progetto FESR/FSE+).
                </p>
              </div>

              {/* Section 5: Diritti dell'Interessato */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>5. Diritti dell'Interessato (Artt. 15-22 GDPR)</span>
                </h4>
                <p>In conformità con il Regolamento UE 2016/679, hai il diritto in qualsiasi momento di:</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Ottenere la conferma dell'esistenza dei tuoi dati e averne accesso;</li>
                  <li>Richiedere la rettifica, l'integrazione o l'aggiornamento dei dati inesatti;</li>
                  <li>Richiedere la cancellazione (diritto all'oblio) o la trasformazione in forma anonima qualora non sussistano obblighi legali di conservazione;</li>
                  <li>Limitare il trattamento o opporti allo stesso per motivi legittimi;</li>
                  <li>Proporre reclamo al Garante per la Protezione dei Dati Personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noreferrer" className="text-sky-700 underline font-semibold">www.garanteprivacy.it</a>).</li>
                </ul>
                <p className="pt-2 text-[11px] text-slate-500">
                  Per esercitare i tuoi diritti, puoi inviare una richiesta scritta a: <span className="font-semibold text-slate-700">privacy@sviluppoitaliamolise.it</span> o via PEC.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Cookie Summary Banner */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Cookie className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold mb-1">Navigazione Sicura & Trasparente (Zero Tracciamento Pubblicitario)</p>
                  <p>
                    Il portale <strong>Sportello Imprese</strong> di Sviluppo Italia Molise utilizza esclusivamente cookie tecnici strettamente necessari al funzionamento del servizio e della procedura di prenotazione. <strong>Non utilizziamo cookie di profilazione commerciale, né cediamo dati a circuiti pubblicitari di terze parti.</strong>
                  </p>
                </div>
              </div>

              {/* Section 1: Cosa sono i Cookie */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">1. Cosa sono i Cookie?</h4>
                <p>
                  I cookie sono piccoli file di testo che i siti web visitati inviano al terminale dell'utente (computer, tablet, smartphone), dove vengono memorizzati per essere poi ritrasmessi agli stessi siti alla visita successiva. I cookie possono essere memorizzati in modo permanente (cookie persistenti) oppure avere una durata limitata alla singola sessione di navigazione (cookie di sessione).
                </p>
              </div>

              {/* Section 2: Tipologie utilizzate */}
              <div className="space-y-3">
                <h4 className="font-bold text-sm text-slate-900">2. Tipologie di Cookie Utilizzate su questo Portale</h4>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Categoria</th>
                        <th className="p-3">Nome / Funzione</th>
                        <th className="p-3">Durata</th>
                        <th className="p-3">Consenso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Tecnici Essenziali</td>
                        <td className="p-3">Gestione dello stato del wizard di prenotazione e blocco temporaneo dello slot orario per evitare doppie prenotazioni.</td>
                        <td className="p-3">Sessione (15 minuti per il blocco slot)</td>
                        <td className="p-3 text-emerald-700 font-bold">Non richiesto (esente art. 122 D.lgs. 196/2003)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Sicurezza & Autenticazione</td>
                        <td className="p-3">Mantenimento della sessione sicura per gli operatori dell'Area Riservata CRM.</td>
                        <td className="p-3">Sessione di lavoro</td>
                        <td className="p-3 text-emerald-700 font-bold">Non richiesto</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-slate-900">Preferenze</td>
                        <td className="p-3">Memorizzazione della visualizzazione dello sportello selezionato sulla mappa.</td>
                        <td className="p-3">Persistente locale (Local Storage)</td>
                        <td className="p-3 text-emerald-700 font-bold">Non richiesto</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Cookie di Terze Parti */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">3. Cookie di Terze Parti e Servizi Esterni</h4>
                <p>
                  Per la geolocalizzazione degli sportelli territoriali e per la visione delle video-pillole informative della Web TV possono essere richiamati servizi esterni:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li><strong>Mappe e Navigazione:</strong> OpenStreetMap / Google Maps (aperto in scheda esterna opzionale con esplicito click dell'utente).</li>
                  <li><strong>Web TV:</strong> I video sono riprodotti tramite player HTML5 sicuro senza tracciamento cross-site.</li>
                </ul>
              </div>

              {/* Section 4: Come disabilitare i cookie */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">4. Gestione e Disabilitazione dei Cookie dal Browser</h4>
                <p>
                  L'utente può in qualsiasi momento scegliere di abilitare o disabilitare i cookie modificando le impostazioni del proprio browser di navigazione:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[11px] pt-1">
                  <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noreferrer" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition-colors">
                    Google Chrome
                  </a>
                  <a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noreferrer" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition-colors">
                    Mozilla Firefox
                  </a>
                  <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noreferrer" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition-colors">
                    Apple Safari
                  </a>
                  <a href="https://support.microsoft.com/it-it/windows/gestire-i-cookie-in-microsoft-edge-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noreferrer" className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold transition-colors">
                    Microsoft Edge
                  </a>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Attenzione: la disabilitazione totale dei cookie tecnici potrebbe compromettere la corretta conclusione della procedura guidata di prenotazione.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Contatto DPO: <strong>dpo@sviluppoitaliamolise.it</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Ho compreso e Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
