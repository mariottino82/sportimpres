import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

// Assicura il caricamento delle variabili d'ambiente da .env sia in sviluppo che in produzione
dotenv.config();
try {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
} catch {
  // Ignora se inaccessibile
}

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

export function resolveSmtpSecure(rawSecure: string | undefined, port: number): boolean {
  if (rawSecure !== undefined && rawSecure !== null && rawSecure.trim() !== '') {
    const val = rawSecure.trim().toLowerCase();
    if (['true', '1', 'yes', 'ssl', 'tls', 'ssl/tls', 'smtps'].includes(val)) {
      return true;
    }
    if (['false', '0', 'no', 'starttls', 'none'].includes(val)) {
      return false;
    }
  }
  // Se non specificato esplicitamente, la porta 465 è standard SSL/TLS (Implicit TLS)
  return port === 465;
}

export function getEmailTransporter(forceReload = false): Transporter | null {
  if (transporter && !forceReload) return transporter;

  if (forceReload) {
    try {
      dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
    } catch {
      // Ignora
    }
  }

  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT?.trim() || '465', 10);
  const secure = resolveSmtpSecure(process.env.SMTP_SECURE, port);
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();

  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
        rejectUnauthorized: false, // Permette server con certificati intermedi o custom
        minVersion: 'TLSv1.2',
        servername: host
      }
    });
    console.log(`[EMAIL SERVICE] Inizializzato trasporto SMTP verso ${host}:${port} (SSL/TLS: ${secure}, Utente: ${user})`);
  } else {
    transporter = null;
    console.warn(`[EMAIL SERVICE AVVISO] SMTP non configurato nel file .env (HOST: ${host || 'MANCANTE'}, PORT: ${port}, USER: ${user || 'MANCANTE'}, PASS: ${pass ? 'PRESENTE' : 'MANCANTE'}). Le email verranno simulate.`);
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
 * Risolve la configurazione corretta del mittente (Alias + Indirizzo) evitando caratteri di escape malformati
 */
export interface SenderConfig {
  name: string;
  address: string;
}

export function resolveFromSender(): SenderConfig {
  const defaultName = 'Sportello Imprese Molise';
  const defaultEmail = 'sportelloimprese@sviluppoitaliamolise.it';

  const configuredName = (process.env.SMTP_FROM_NAME || '').trim();
  let rawFrom = (process.env.SMTP_FROM || '').trim();
  rawFrom = rawFrom.replace(/^["'\s]+|["'\s]+$/g, '');

  let name = configuredName || defaultName;
  let address = (process.env.SMTP_FROM_EMAIL || '').trim();

  if (rawFrom) {
    const angleMatch = rawFrom.match(/^(.*?)[<]([^>]+)[>]$/);
    if (angleMatch) {
      const extractedName = angleMatch[1].replace(/\\/g, '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
      const extractedEmail = angleMatch[2].trim();
      if (extractedName && !configuredName) {
        name = extractedName;
      }
      if (extractedEmail) {
        address = extractedEmail;
      }
    } else if (rawFrom.includes('@')) {
      address = rawFrom.replace(/["'\\]/g, '').trim();
    }
  }

  // Se non è stato specificato un indirizzo mittente, usa l'utente SMTP se è un'email valida, altrimenti l'indirizzo istituzionale
  if (!address) {
    const smtpUser = (process.env.SMTP_USER || '').trim();
    if (smtpUser && smtpUser.includes('@')) {
      address = smtpUser;
    } else {
      address = defaultEmail;
    }
  }

  // Pulisce il nome da virgolette o barre inverse residue
  name = name.replace(/\\/g, '').replace(/^["'\s]+|["'\s]+$/g, '').trim() || defaultName;

  return { name, address };
}

export function resolveReplyTo(params?: AppointmentEmailParams): SenderConfig {
  const defaultName = 'Sportello Imprese Molise';
  const defaultEmail = params?.sportelloEmail || 'sportelloimprese@sviluppoitaliamolise.it';

  let rawReplyTo = (process.env.SMTP_REPLY_TO || '').trim();
  rawReplyTo = rawReplyTo.replace(/^["'\s]+|["'\s]+$/g, '');

  if (rawReplyTo) {
    const angleMatch = rawReplyTo.match(/^(.*?)[<]([^>]+)[>]$/);
    if (angleMatch) {
      const extractedName = angleMatch[1].replace(/\\/g, '').replace(/^["'\s]+|["'\s]+$/g, '').trim() || defaultName;
      const extractedEmail = angleMatch[2].trim();
      return { name: extractedName, address: extractedEmail };
    }
    if (rawReplyTo.includes('@')) {
      return { name: defaultName, address: rawReplyTo.replace(/["'\\]/g, '').trim() };
    }
  }

  return {
    name: params?.sportelloNome ? `Sportello Imprese Molise - ${params.sportelloComune}` : defaultName,
    address: defaultEmail
  };
}

/**
 * Invia email di conferma appuntamento
 */
export async function sendAppointmentConfirmationEmail(
  params: AppointmentEmailParams
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const mailTransporter = getEmailTransporter();
  const sender = resolveFromSender();
  const replyTo = resolveReplyTo(params);

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
                Sede Centrale: Via Nazario Sauro, 1 - 86100 Campobasso (CB) • P.IVA 00852240704 • Tel. 0874 011011<br>
                Email: info@sviluppoitaliamolise.eu
              </p>
              <p style="margin:0; font-size:10px; color:#94a3b8;">
                Ricevi questa comunicazione perché hai inoltrato una richiesta di appuntamento tramite la rete degli 12 Sportelli Imprese Molise. Informativa Privacy resa ai sensi dell'art. 13 del Regolamento UE 2016/679 (GDPR).
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
        from: {
          name: sender.name,
          address: sender.address
        },
        replyTo: {
          name: replyTo.name,
          address: replyTo.address
        },
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

      console.log(`[EMAIL SERVICE] Email di conferma inviata con successo da "${sender.name}" <${sender.address}> (Reply-To: "${replyTo.name}" <${replyTo.address}>) a ${params.to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.warn(`[EMAIL SERVICE] Primo tentativo invio fallito a ${params.to} (${err.message}). Ritento ricreando la connessione SMTP...`);
      try {
        const freshTransporter = getEmailTransporter(true);
        if (freshTransporter) {
          const retryInfo = await freshTransporter.sendMail({
            from: {
              name: sender.name,
              address: sender.address
            },
            replyTo: {
              name: replyTo.name,
              address: replyTo.address
            },
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
          console.log(`[EMAIL SERVICE] Email di conferma inviata con successo al secondo tentativo a ${params.to}. MessageId: ${retryInfo.messageId}`);
          return { success: true, messageId: retryInfo.messageId };
        }
      } catch (retryErr: any) {
        console.error(`[EMAIL SERVICE] Errore definitivo nell'invio email a ${params.to}:`, retryErr.message);
        return { success: false, error: retryErr.message };
      }
      return { success: false, error: err.message };
    }
  } else {
    // Simulazione di invio (quando SMTP non è ancora stato configurato nel file .env)
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();
    console.warn(`[EMAIL SERVICE SIMULATA] Invio saltato - Configurazione SMTP non completa in .env (HOST: ${host ? 'OK' : 'MANCANTE'}, USER: ${user ? 'OK' : 'MANCANTE'}, PASS: ${pass ? 'PRESENTE' : 'MANCANTE'}). Destinatario: ${params.to}`);
    return {
      success: false,
      simulated: true,
      error: 'SMTP non configurato sul server. Verifica i parametri SMTP_HOST, SMTP_USER, SMTP_PASS nel file .env',
      messageId: `simulated-${Date.now()}`
    };
  }
}

/**
 * Verifica la connessione al server SMTP (handshake TLS e credenziali)
 */
export async function verifySmtpConnection(): Promise<{
  configured: boolean;
  success: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  from?: { name: string; address: string };
  replyTo?: { name: string; address: string };
  error?: string;
}> {
  const mailTransporter = getEmailTransporter(true);
  const host = process.env.SMTP_HOST?.trim();
  const port = parseInt(process.env.SMTP_PORT?.trim() || '465', 10);
  const secure = resolveSmtpSecure(process.env.SMTP_SECURE, port);
  const user = process.env.SMTP_USER?.trim();
  const sender = resolveFromSender();
  const replyTo = resolveReplyTo();

  if (!mailTransporter || !host || !user) {
    return {
      configured: false,
      success: false,
      host: host || 'Non impostato',
      port,
      secure,
      user: user || 'Non impostato',
      from: sender,
      replyTo,
      error: 'Parametri SMTP_HOST, SMTP_USER o SMTP_PASS mancanti o non letti dal file .env'
    };
  }

  try {
    await mailTransporter.verify();
    return {
      configured: true,
      success: true,
      host,
      port,
      secure,
      user,
      from: sender,
      replyTo
    };
  } catch (err: any) {
    console.error('[EMAIL SERVICE] Errore verifica connessione SMTP:', err.message);
    return {
      configured: true,
      success: false,
      host,
      port,
      secure,
      user,
      from: sender,
      replyTo,
      error: err.message || String(err)
    };
  }
}

/**
 * Invia un'email di test per diagnosticare la configurazione SMTP
 */
export async function sendTestEmail(toEmail: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const mailTransporter = getEmailTransporter(true);
  if (!mailTransporter) {
    return {
      success: false,
      error: 'SMTP non configurato. Verifica SMTP_HOST, SMTP_USER e SMTP_PASS nel file .env'
    };
  }

  const sender = resolveFromSender();
  const replyTo = resolveReplyTo();

  try {
    const info = await mailTransporter.sendMail({
      from: {
        name: sender.name,
        address: sender.address
      },
      replyTo: {
        name: replyTo.name,
        address: replyTo.address
      },
      to: toEmail,
      subject: 'Test Connessione Email - Sportello Imprese Molise',
      text: `Test di invio email completato con successo da Sportello Imprese Molise.\n\nInviato da: ${sender.name} <${sender.address}>\nReply-To: ${replyTo.name} <${replyTo.address}>\nData: ${new Date().toLocaleString('it-IT')}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0284c7; margin-top: 0;">Test Connessione Email</h2>
          <p style="color: #334155; font-size: 14px; line-height: 1.5;">
            Questa è un'email di prova inviata dal server <strong>Sportello Imprese Molise</strong> per verificare che la configurazione SMTP funzioni correttamente.
          </p>
          <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 14px 16px; margin: 20px 0; border-radius: 6px;">
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Mittente (From):</strong> ${sender.name} &lt;${sender.address}&gt;</p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Rispondi a (Reply-To):</strong> ${replyTo.name} &lt;${replyTo.address}&gt;</p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Destinatario:</strong> ${toEmail}</p>
            <p style="margin: 4px 0; font-size: 13px; color: #1e293b;"><strong>Data:</strong> ${new Date().toLocaleString('it-IT')}</p>
          </div>
          <p style="color: #16a34a; font-weight: bold; font-size: 14px;">
            ✓ La configurazione SMTP è operativa e funzionante!
          </p>
        </div>
      `
    });

    console.log(`[EMAIL TEST] Email di prova inviata con successo a ${toEmail}. MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[EMAIL TEST ERROR] Errore invio test email a ${toEmail}:`, err);
    return { success: false, error: err.message || String(err) };
  }
}
