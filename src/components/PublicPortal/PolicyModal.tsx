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
              {/* Premessa */}
              <div className="bg-sky-50/90 border border-sky-200 rounded-xl p-4 text-xs text-sky-950 leading-relaxed font-medium">
                Sviluppo Italia Molise SpA, Le fornisce, di seguito, le informazioni che descrivono il trattamento dei dati personali effettuato e i diritti di cui Lei gode, in qualità di interessato.
              </div>

              {/* Titolare del trattamento */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600" />
                  <span>Titolare del trattamento</span>
                </h4>
                <p className="text-slate-700">
                  Il titolare del trattamento è <strong>Sviluppo Italia Molise S.p.A.</strong>, P.Iva e C.F.: 00852240704, con sede legale in Campobasso, alla via Nazario Sauro n. 1, tel. 0874 4011200, e-mail: <a href="mailto:info@sviluppoitaliamolise.it" className="text-sky-700 font-semibold underline">info@sviluppoitaliamolise.it</a>, PEC: <a href="mailto:sviluppoitaliamolise@legalmail.it" className="text-sky-700 font-semibold underline">sviluppoitaliamolise@legalmail.it</a>, sito internet: <a href="https://www.sviluppoitaliamolise.com" target="_blank" rel="noreferrer" className="text-sky-700 font-semibold underline">https://www.sviluppoitaliamolise.com</a>.
                </p>
              </div>

              {/* Responsabile della protezione dei dati */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600" />
                  <span>Responsabile della protezione dei dati</span>
                </h4>
                <p className="text-slate-700">
                  Il Responsabile per la protezione dei dati (RPD/DPO) designato dal Titolare, al quale Lei potrà rivolgersi, è la <strong>Slalom Consulting srl</strong>, al seguente indirizzo di posta elettronica: <a href="mailto:dpo@slalomsrl.it" className="text-sky-700 font-semibold underline">dpo@slalomsrl.it</a>.
                </p>
              </div>

              {/* Tipologia dei dati raccolti e Categorie di interessati */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Tipologia dei dati raccolti e Categorie di interessati</span>
                </h4>
                <p className="text-slate-700">
                  Il titolare del trattamento tratta i dati anagrafici (nome e cognome), la fascia di età, stato occupazionale, carica/ruolo ricoperta, la comune di residenza, i dati di contatto (nr. di telefono, indirizzo e-mail, etc.), appartenenti ai cittadini e ai rappresentanti legali/referenti di imprese.
                </p>
              </div>

              {/* Finalità e Base giuridica del trattamento */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-sky-600" />
                  <span>Finalità e Base giuridica del trattamento</span>
                </h4>
                <p className="text-slate-700">
                  I dati da Lei forniti, e/o forniti, saranno trattati per la seguente finalità: svolgimento del servizio di consulenza realizzata attraverso lo “Sportello imprese”, allo scopo di rendere informazioni puntuali e affidabili circa le opportunità di finanziamento e le relative modalità di accesso: gestione dell'appuntamento, l'erogazione del servizio di orientamento e supporto imprenditoriale (EDP), l'invio del promemoria di conferma e delle comunicazioni istituzionali inerenti i bandi del PR Molise FESR FSE+ 2021-2027.
                </p>
                <p className="text-slate-700 font-medium pt-1">
                  La base giuridica che legittima il trattamento è rappresentata:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>dall’art. 6, par. 1, b) del GDPR: <em>“il trattamento è necessario all’esecuzione di un contratto di cui l’interessato è parte o all’esecuzione di misure precontrattuali adottate su richiesta dello stesso”</em>;</li>
                  <li>dall’art. 6, par. 1, lett. e) del GDPR: <em>“il trattamento è necessario per l’esecuzione di un compito di interesse pubblico o connesso all’esercizio di pubblici poteri di cui è investito il titolare del trattamento”</em>.</li>
                </ul>
              </div>

              {/* Modalità di trattamento dei dati */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">Modalità di trattamento dei dati</h4>
                <p className="text-slate-700">
                  I dati personali sono trattati per le finalità esposte, nel rispetto dei principi di cui all’art. 5 del GDPR: “liceità, correttezza, trasparenza, limitazione delle finalità e del periodo di conservazione, minimizzazione dei dati, esattezza, integrità e riservatezza” in forma cartacea ed informatizzata. La disponibilità, la gestione, l’accesso, la conservazione e la fruibilità dei dati è garantita dall’adozione di misure tecniche e organizzative per assicurare adeguati livelli di sicurezza ai sensi degli artt. 25 e 32 del GDPR.
                </p>
              </div>

              {/* Processi decisionali automatizzati */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">Processi decisionali automatizzati</h4>
                <p className="text-slate-700">
                  Il Titolare non effettua trattamenti di dati personali degli interessati che consistano in processi decisionali automatizzati, compresa la profilazione, che producono effetti giuridici che lo riguardano o che incidono in modo analogo significativamente sulla sua persona.
                </p>
              </div>

              {/* Natura del conferimento dei dati */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">Natura del conferimento dei dati</h4>
                <p className="text-slate-700">
                  Il conferimento dei dati personali è necessario e l’eventuale rifiuto di fornirli, in tutto o in parte, potrebbe dar luogo all'impossibilità per Sviluppo Italia Molise S.p.A. di rendere il servizio richiesto.
                </p>
              </div>

              {/* Destinatari o categorie di destinatari dei dati personali */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">Destinatari o categorie di destinatari dei dati personali</h4>
                <p className="text-slate-700">
                  Per le finalità sopra richiamate, i Dati Personali potranno essere utilizzati e comunicati in modo adeguato e corretto a soggetti esterni all’organizzazione del Titolare. A tal fine, nello svolgimento della propria attività, il Titolare potrebbe comunicare i Dati Personali:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
                  <li>personale debitamente istruito ed autorizzato dal Titolare che agisce sotto l’autorità del medesimo;</li>
                  <li>persone fisiche e/o giuridiche, quali Responsabili al trattamento di Dati Personali ex artt. 28 e 29 GDPR che trattano Dati per conto del Titolare, in rapporto contrattuale o convenzionale con il medesimo idoneamente designati e selezionati, altresì, per le garanzie prestate in materia di protezione dei Dati Personali, ciascuno nei limiti della propria professione e delle funzioni assegnate, ovvero tecnici e addetti alla comunicazione. Tra i soggetti che agiranno come responsabili del trattamento si richiama la ditta esterna che si occupa dell’erogazione del servizio tramite il presidio fisico presso lo sportello e della fornitura della piattaforma informativa di rete CMR.</li>
                </ul>
              </div>

              {/* Diffusione e Trasferimento dei dati all’estero */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">Diffusione e Trasferimento dei dati all’estero</h4>
                <p className="text-slate-700">
                  I Dati Personali non saranno oggetto di diffusione e non sono trasferiti in paesi extra-UE.
                </p>
              </div>

              {/* Periodo di conservazione dei dati */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900">Periodo di conservazione dei dati</h4>
                <p className="text-slate-700">
                  Il Titolare del trattamento, una volta perseguita la finalità sopra indicata, conserva i dati personali per un periodo di 5 anni, nel rispetto degli obblighi di conservazione e dei limiti previsti dalla Legge.
                </p>
              </div>

              {/* Diritti dell’interessato */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Diritti dell’interessato</span>
                </h4>
                <p className="text-slate-700">
                  In merito al trattamento dei dati personali Lei, in qualità di Interessato, potrà esercitare, laddove applicabili e/o tecnicamente possibili, i diritti previsti dagli artt.15-21 del Reg. UE 2016/679, quali quelli di: accesso, rettifica, opposizione, etc.
                </p>
                <p className="text-slate-700 font-medium pt-1">
                  Per l’esercizio dei diritti, è possibile rivolgersi al Titolare del trattamento con le seguenti modalità:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>raccomandata A/R all’indirizzo sopra riportato;</li>
                  <li>PEC: <a href="mailto:sviluppoitaliamolise@legalmail.it" className="text-sky-700 font-semibold underline">sviluppoitaliamolise@legalmail.it</a></li>
                </ul>
                <p className="text-slate-700 font-medium pt-1">
                  ovvero al RPD/DPO (Responsabile della Protezione dei dati), rintracciabile ai seguenti contatti:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>E-mail: <a href="mailto:dpo@slalomsrl.it" className="text-sky-700 font-semibold underline">dpo@slalomsrl.it</a></li>
                </ul>
                <p className="text-slate-700 pt-1">
                  In particolare, Lei potrà esercitare i Suoi diritti specificando l’oggetto della Sua richiesta, il diritto che intende esercitare ed allegando la fotocopia di un documento di identità che attesti la legittimità della richiesta.
                </p>
              </div>

              {/* Diritto di reclamo */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>Diritto di reclamo</span>
                </h4>
                <p className="text-slate-700 font-medium">
                  L’interessato, ricorrendone i presupposti ha, altresì, il diritto di:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>proporre reclamo all’Autorità di controllo dello stato di residenza (ex art. 77 Reg. n. 679/2016), secondo le procedure previste dall’art. 142 del D.lgs. n. 196/2003, emendato dal D.lgs. n. 101/2018;</li>
                  <li>rivolgere una segnalazione all’Autorità di controllo ex art. 144 D.lgs. n. 101/2018.</li>
                </ul>
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
