import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface AppointmentEmailParams {
  to: string;
  recipientName: string;
  codice: string;
  datetime: string;
  modalita: 'PRESENZA' | 'VIDEOCALL';
  videocallLink?: string;
  sportelloNome: string;
  sportelloIndirizzo: string;
  sportelloComune: string;
  sportelloTelefono: string;
  sportelloEmail: string;
  categoriaBisogno: string;
  motivoTesto?: string;
  tokenModifica?: string;
  portalUrl?: string;
}

let transporter: Transporter | null = null;

export function getEmailTransporter(): Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false // Permette server con certificati intermedi o custom
      }
    });
    console.log(`[EMAIL SERVICE] Inizializzato trasporto SMTP verso ${host}:${port} (Utente: ${user})`);
  } else {
    console.warn('[EMAIL SERVICE] SMTP non configurato nel file .env (mancano SMTP_HOST, SMTP_USER, SMTP_PASS). Verrà generata simulazione con log.');
  }

  return transporter;
}

/**
 * Genera il contenuto del file .ics per sincronizzare l'appuntamento su Google Calendar, Apple Calendar o Outlook
 */
function generateIcsCalendar(params: AppointmentEmailParams): string {
  const start = new Date(params.datetime.replace(' ', 'T'));
  const end = new Date(start.getTime() + 30 * 60000); // 30 minuti

  const pad = (n: number) => String(n).padStart(2, '0');
  const toIcsDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const summary = `Sportello Imprese Molise - Appuntamento ${params.codice}`;
  const description = `Colloquio orientamento: ${params.categoriaBisogno}. Sede: ${params.sportelloNome}, ${params.sportelloIndirizzo}. Tel: ${params.sportelloTelefono}`;
  const location = params.modalita === 'PRESENZA' ? `${params.sportelloNome}, ${params.sportelloIndirizzo}` : (params.videocallLink || 'Stanza Online');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sviluppo Italia Molise//Sportello Imprese 2026//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${params.codice}@sportelloimprese.sviluppoitaliamolise.it`,
    `DTSTAMP:${toIcsDate(new Date())}`,
    `DTSTART:${toIcsDate(start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Invia email di conferma appuntamento
 */
export async function sendAppointmentConfirmationEmail(
  params: AppointmentEmailParams
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const mailTransporter = getEmailTransporter();
  const fromAddress = process.env.SMTP_FROM || '"Sportello Imprese Molise" <sportelloimprese@sviluppoitaliamolise.it>';

  // Formattazione data leggibile in italiano
  const dateObj = new Date(params.datetime.replace(' ', 'T'));
  const formattedDate = isNaN(dateObj.getTime())
    ? params.datetime
    : dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formattedTime = isNaN(dateObj.getTime())
    ? ''
    : dateObj.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

  const modalitaLabel = params.modalita === 'PRESENZA' ? 'In presenza allo Sportello' : 'Videocall Online';
  const siteUrl = params.portalUrl || process.env.APP_URL || 'http://31.70.141.184';
  const manageUrl = params.tokenModifica ? `${siteUrl}/?prenotazione=${params.tokenModifica}` : siteUrl;

  const htmlContent = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conferma Appuntamento Sportello Imprese Molise</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Helvetica, Arial, sans-serif; color:#1e293b; line-height:1.6;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9; padding:24px 12px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04); border:1px solid #e2e8f0;">
          
          <!-- Header Istituzionale -->
          <tr>
            <td style="background-color:#0f172a; padding:24px 32px; text-align:center;">
              <div style="font-size:11px; font-weight:700; color:#38bdf8; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">
                Sviluppo Italia Molise • Regione Molise
              </div>
              <h1 style="margin:0; font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.5px;">
                SPORTELLO IMPRESE
              </h1>
              <div style="font-size:11px; color:#94a3b8; margin-top:4px;">
                PR Molise FESR FSE+ 2021-2027 • Azione 1.4.2
              </div>
            </td>
          </tr>

          <!-- Banner Conferma -->
          <tr>
            <td style="background-color:#0284c7; padding:16px 32px; text-align:center; color:#ffffff;">
              <span style="display:inline-block; font-size:20px; vertical-align:middle; margin-right:8px;">✓</span>
              <strong style="font-size:15px; vertical-align:middle;">Prenotazione Confermata con Successo</strong>
            </td>
          </tr>

          <!-- Corpo Messaggio -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <p style="font-size:15px; color:#334155; margin-top:0;">
                Gentile <strong>${params.recipientName}</strong>,
              </p>
              <p style="font-size:14px; color:#475569; margin-bottom:24px;">
                Ti confermiamo che il tuo colloquio specialistico di orientamento è stato registrato nel nostro sistema con il seguente codice:
              </p>

              <!-- Box Codice Prenotazione -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; border:2px dashed #cbd5e1; border-radius:12px; margin-bottom:28px;">
                <tr>
                  <td align="center" style="padding:16px 20px;">
                    <div style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.8px;">
                      Codice Univoco Prenotazione
                    </div>
                    <div style="font-size:26px; font-weight:900; font-family:monospace; color:#0369a1; letter-spacing:1.5px; margin:6px 0;">
                      ${params.codice}
                    </div>
                    <div style="font-size:11px; color:#64748b;">
                      Comunica o mostra questo codice all'operatore di Sviluppo Italia Molise.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Dettagli Appuntamento -->
              <h3 style="font-size:14px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 12px 0; border-bottom:1px solid #e2e8f0; padding-bottom:6px;">
                Riepilogo dell'Incontro
              </h3>

              <table width="100%" cellpadding="8" cellspacing="0" border="0" style="font-size:13px; color:#334155; margin-bottom:24px;">
                <tr style="background-color:#f8fafc;">
                  <td width="35%" style="font-weight:700; color:#475569;">Data e Ora:</td>
                  <td style="color:#0f172a; font-weight:700;">${formattedDate} • ore ${formattedTime}</td>
                </tr>
                <tr>
                  <td style="font-weight:700; color:#475569;">Modalità:</td>
                  <td><strong>${modalitaLabel}</strong></td>
                </tr>
                ${params.modalita === 'VIDEOCALL' && params.videocallLink ? `
                <tr style="background-color:#f0fdf4;">
                  <td style="font-weight:700; color:#166534;">Link Stanza Video:</td>
                  <td>
                    <a href="${params.videocallLink}" target="_blank" style="color:#0284c7; font-weight:700; text-decoration:underline; word-break:break-all;">
                      ${params.videocallLink}
                    </a>
                  </td>
                </tr>
                ` : ''}
                <tr style="background-color:#f8fafc;">
                  <td style="font-weight:700; color:#475569;">Sede Territoriale:</td>
                  <td><strong>${params.sportelloNome}</strong><br><span style="color:#64748b;">${params.sportelloIndirizzo}</span></td>
                </tr>
                <tr>
                  <td style="font-weight:700; color:#475569;">Contatti Sede:</td>
                  <td>Tel: <strong>${params.sportelloTelefono}</strong> • Email: <a href="mailto:${params.sportelloEmail}" style="color:#0284c7;">${params.sportelloEmail}</a></td>
                </tr>
                <tr style="background-color:#f8fafc;">
                  <td style="font-weight:700; color:#475569;">Ambito Richiesto:</td>
                  <td>${params.categoriaBisogno || 'Orientamento Generale & Bandi'}</td>
                </tr>
              </table>

              <!-- Pulsanti Azione -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center" style="padding:10px 0;">
                    <a href="${manageUrl}" target="_blank" style="display:inline-block; background-color:#0f172a; color:#ffffff; text-decoration:none; font-weight:700; font-size:13px; padding:12px 24px; border-radius:10px;">
                      Visualizza o Gestisci Prenotazione sul Portale
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:12px; color:#64748b; line-height:1.5; margin:0;">
                <em>In allegato a questa email troverai il file di calendario <strong>invito_calendario.ics</strong> per salvare automaticamente l'evento su Google Calendar, Apple Calendar o Microsoft Outlook.</em>
              </p>
            </td>
          </tr>

          <!-- Footer Istituzionale -->
          <tr>
            <td style="background-color:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center; font-size:11px; color:#64748b;">
              <p style="margin:0 0 6px 0; font-weight:700; color:#334155;">
                Sviluppo Italia Molise S.p.A.
              </p>
              <p style="margin:0 0 8px 0;">
                Sede Centrale: Via Vico, 4 - 86100 Campobasso (CB) • P.IVA 00852240704 • Tel. 0874 011011<br>
                Email: sportelloimprese@sviluppoitaliamolise.it
              </p>
              <p style="margin:0; font-size:10px; color:#94a3b8;">
                Ricevi questa comunicazione perché hai inoltrato una richiesta di appuntamento tramite la rete degli 11 Sportelli Imprese Molise. Informativa Privacy resa ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR).
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textContent = `
SPORTELLO IMPRESE SVILUPPO ITALIA MOLISE
Conferma Prenotazione Appuntamento

Gentile ${params.recipientName},
la tua prenotazione è confermata con successo.

Codice Prenotazione: ${params.codice}
Data e Ora: ${formattedDate} ore ${formattedTime}
Modalità: ${modalitaLabel}
${params.modalita === 'VIDEOCALL' && params.videocallLink ? `Link Videocall: ${params.videocallLink}\n` : ''}Sede: ${params.sportelloNome} (${params.sportelloIndirizzo})
Telefono Sede: ${params.sportelloTelefono}
Email Sede: ${params.sportelloEmail}
Ambito: ${params.categoriaBisogno}

Visualizza o gestisci la prenotazione sul portale:
${manageUrl}

Sviluppo Italia Molise S.p.A.
PR Molise FESR FSE+ 2021-2027
  `.trim();

  // Genera file calendario .ics
  const icsContent = generateIcsCalendar(params);

  if (mailTransporter) {
    try {
      const info = await mailTransporter.sendMail({
        from: fromAddress,
        to: params.to,
        subject: `Conferma Appuntamento #${params.codice} - Sportello Imprese Molise`,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: `appuntamento_${params.codice}.ics`,
            content: icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST'
          }
        ]
      });

      console.log(`[EMAIL SERVICE] Email di conferma inviata con successo a ${params.to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[EMAIL SERVICE] Errore nell'invio email a ${params.to}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    // Simulazione di invio (quando SMTP non è ancora stato configurato nel file .env)
    console.log(`[EMAIL SERVICE SIMULATA] Email preparata per invio a: ${params.to} | Codice: ${params.codice} | Data: ${params.datetime}`);
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}`
    };
  }
}
