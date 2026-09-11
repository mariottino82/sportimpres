import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Appointment, Sportello } from '../types';
import { Logo, InstitutionalLogosStrip } from './Logo';
import { Printer, Download, X, Calendar, Clock, MapPin, Video, Phone, Mail, CheckCircle, FileText } from 'lucide-react';

interface PdfPromemoriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  sportello: Sportello;
  profilo: any;
}

export const PdfPromemoriaModal: React.FC<PdfPromemoriaModalProps> = ({
  isOpen,
  onClose,
  appointment,
  sportello,
  profilo,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (appointment?.codice) {
      QRCode.toDataURL(appointment.codice, {
        width: 180,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }).then(setQrCodeDataUrl).catch(console.error);
    }
  }, [appointment?.codice]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const isImpresa = appointment.utente_tipo === 'IMPRESA';
  const checkInChecklist = isImpresa
    ? [
        "Documento d'identità del legale rappresentante o delegato",
        "Visura Camerale aggiornata (ultimi 6 mesi)",
        "Codice ATECO primario e secondari dell'attività",
        "Eventuale idea o preventivo di spesa per innovazione/transizione"
      ]
    : [
        "Documento d'identità valido e Codice Fiscale",
        "Descrizione scritta dell'idea di business o bozza di business plan",
        "Eventuale CV dei futuri soci o promotori dell'iniziativa",
        "Domande specifiche sui bandi d'interesse"
      ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Toolbar (hidden in print) */}
        <div className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileText className="w-4 h-4 text-sky-400" />
            <span>Promemoria Ufficiale Appuntamento A4</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Stampa / Salva in PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* A4 Document Printable Content */}
        <div className="p-8 sm:p-10 overflow-y-auto print:p-6 font-sans text-slate-900" id="promemoria-print-area">
          
          {/* Official Institutional Header with 4 Logos */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 pb-4 mb-6 gap-3">
            <InstitutionalLogosStrip size="xs" />
            <div className="text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-2 py-1 rounded tracking-wider">
              PR Molise 21-27 • CUP: J19B25000190009
            </div>
          </div>

          {/* Logo & Document Title */}
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <Logo size="md" showSubtitle />
              <p className="text-xs font-semibold text-sky-700 mt-2">
                "Supportiamo la tua impresa o la tua idea imprenditoriale"
              </p>
              <div className="inline-block bg-sky-100 text-sky-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mt-1">
                Il servizio è gratuito
              </div>
            </div>

            {/* Prominent Booking Code & QR */}
            <div className="flex flex-col items-center bg-slate-50 border border-slate-200 p-3 rounded-xl text-center min-w-[170px]">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Codice Prenotazione</span>
              <span className="text-lg font-mono font-extrabold text-sky-900 my-0.5">
                {appointment.codice}
              </span>
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt={`QR Code ${appointment.codice}`} className="w-24 h-24 my-1 border border-slate-100 rounded" />
              ) : (
                <div className="w-24 h-24 bg-slate-200 animate-pulse rounded my-1" />
              )}
              <span className="text-[9px] text-slate-500">Mostra il QR per il check-in</span>
            </div>
          </div>

          {/* Appointment Data Box */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 sm:p-5 mb-6">
            <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Dettagli dell'Appuntamento</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Data e Ora:</span>
                <span className="font-bold text-slate-900 text-base">
                  {new Date(appointment.data_ora).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Ore {new Date(appointment.data_ora).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} ({appointment.durata_minuti || 30} minuti)</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 block">Modalità:</span>
                <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                  {appointment.modalita === 'PRESENZA' ? (
                    <>
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span>In presenza allo Sportello</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 text-purple-600" />
                      <span>Videocall online</span>
                    </>
                  )}
                </span>
                {appointment.modalita === 'VIDEOCALL' && (
                  <span className="text-xs text-sky-700 underline block mt-1 break-all">
                    {appointment.videocall_link || `https://meet.jit.si/SportelloImpreseMolise-${appointment.codice}`}
                  </span>
                )}
              </div>

              <div className="sm:col-span-2 pt-2 border-t border-sky-200/60">
                <span className="text-xs text-slate-500 block">Sede dello Sportello:</span>
                <span className="font-bold text-slate-900">{sportello.nome}</span>
                <p className="text-xs text-slate-600 mt-0.5">
                  {sportello.indirizzo} • Tel. {sportello.telefono} • Email: {sportello.email}
                </p>
                <a
                  href={`https://maps.google.com/?q=${sportello.lat},${sportello.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-sky-700 hover:underline inline-flex items-center gap-1 mt-1 print:hidden"
                >
                  <span>Indicazioni stradali su Google Maps</span>
                  <span>↗</span>
                </a>
              </div>
            </div>
          </div>

          {/* User Profile & Need */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 text-xs">
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-2 text-[11px]">
                {isImpresa ? 'Dati Impresa e Referente' : 'Dati Aspirante Imprenditore'}
              </h4>
              <p className="font-semibold text-slate-900 text-sm">
                {isImpresa ? profilo?.denominazione || appointment.impresa_denominazione : `${profilo?.nome || appointment.aspirante_nome} ${profilo?.cognome || appointment.aspirante_cognome}`}
              </p>
              {isImpresa && (
                <p className="text-slate-600 mt-0.5">P.IVA: <span className="font-mono font-medium">{profilo?.partita_iva || appointment.impresa_piva}</span></p>
              )}
              <p className="text-slate-600 mt-0.5">
                Email: {appointment.utente_email} • Tel: {appointment.utente_telefono}
              </p>
              <p className="text-slate-600 mt-0.5">
                Comune: {profilo?.comune_sede || profilo?.comune_residenza || 'Molise'}
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide mb-2 text-[11px]">
                Motivo e Categoria del Bisogno
              </h4>
              <span className="inline-block bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded text-[11px] mb-1.5">
                {appointment.categoria_bisogno}
              </span>
              <p className="text-slate-600 italic line-clamp-3">
                "{appointment.motivo_testo}"
              </p>
            </div>
          </div>

          {/* "Cosa Portare" Checklist */}
          <div className="border border-slate-200 rounded-xl p-4 bg-amber-50/50 mb-6">
            <h4 className="font-bold text-amber-900 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Cosa portare all'appuntamento (Consigli per un colloquio efficace)</span>
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
              {checkInChecklist.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Center & Instructions */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Hai bisogno di modificare o annullare?</p>
              <p>Chiama il Contact Center al <strong>0874 011011</strong> (anche WhatsApp) dal Lun al Ven 09:00 - 13:00</p>
              <p>Oppure visita il portale: <strong>www.sviluppoitaliamolise.it</strong></p>
            </div>
            <div className="text-right text-[10px] text-slate-400">
              <p>Iniziativa dell'Assessorato allo Sviluppo Economico - Regione Molise</p>
              <p>PR Molise FESR FSE+ 2021-2027</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
