export type UserType = 'IMPRESA' | 'ASPIRANTE';

export type AppointmentState = 
  | 'RICHIESTO' 
  | 'CONFERMATO' 
  | 'SVOLTO' 
  | 'NOSHOW' 
  | 'FOLLOWUP' 
  | 'CHIUSO_POSITIVO' 
  | 'CHIUSO_NEGATIVO' 
  | 'ANNULLATO';

export type Modality = 'PRESENZA' | 'VIDEOCALL';

export type CrmRole = 'ADMIN' | 'OPERATORE' | 'COORDINATORE' | 'COMUNICAZIONE' | 'CONTACT_CENTER' | 'ENTE';

export interface CrmOperator {
  id: number;
  username: string;
  password?: string;
  nome: string;
  cognome: string;
  email: string;
  ruolo: CrmRole;
  sportello_id?: number | null;
  sportello_nome?: string;
  attivo: number;
  creato_il: string;
  ultimo_accesso?: string | null;
  note?: string;
}

export interface Sportello {
  id: number;
  comune: string;
  nome: string;
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
  responsabile_nome?: string;
  responsabile_email?: string;
  responsabile_telefono?: string;
  online_attivo?: number; // 1 = Videocall online attiva, 0 = Solo in presenza
  link_videocall?: string;
  note_accesso?: string;
  provincia?: string;
  distanzaKm?: number;
}

export interface UserProfileImpresa {
  denominazione: string;
  partitaIva: string;
  nomeReferente: string;
  cognomeReferente: string;
  ruolo: string;
  email: string;
  telefono: string;
  comuneSede: string;
}

export interface UserProfileAspirante {
  nome: string;
  cognome: string;
  email: string;
  telefono: string;
  comuneResidenza: string;
}

export interface EdpImpresaData {
  settoreAttivita?: string;
  ateco?: string;
  dimensione?: string;
  faseVita?: string;
  gradoInnovazione?: number;
  usoAi?: number;
}

export interface EdpAspiranteData {
  statoIdea?: string;
  settoreInteresse?: string;
  condizioneAttuale?: string;
  fasciaEta?: string;
  haPartitaIva?: string;
}

export interface Appointment {
  id: number;
  codice: string;
  utente_id: number;
  sportello_id: number;
  data_ora: string;
  durata_minuti: number;
  modalita: Modality;
  videocall_link: string;
  stato: AppointmentState;
  motivo_testo: string;
  categoria_bisogno: string;
  token_modifica: string;
  creato_il: string;
  note_operatore?: string;
  followup_date?: string;
  followup_esito?: string;
  sportello_nome?: string;
  sportello_comune?: string;
  sportello_indirizzo?: string;
  sportello_telefono?: string;
  sportello_email?: string;
  utente_email?: string;
  utente_telefono?: string;
  utente_tipo?: UserType;
  impresa_denominazione?: string;
  impresa_piva?: string;
  aspirante_nome?: string;
  aspirante_cognome?: string;
}

export interface Interaction {
  id: number;
  utente_id: number;
  appuntamento_id?: number;
  sportello_id: number;
  operatore_nome: string;
  data_ora: string;
  canale: 'SPORTELLO' | 'TELEFONO' | 'WHATSAPP' | 'VIDEOCALL' | 'EVENTO' | 'HACKATHON';
  tipologia_richiesta: string;
  bandi_trattati?: string;
  esito: string;
  stato_followup: string;
  data_prossimo_ricontatto?: string;
  note?: string;
  sportello_nome?: string;
  sportello_comune?: string;
  utente_email?: string;
  utente_telefono?: string;
  utente_tipo?: UserType;
  impresa_denominazione?: string;
  aspirante_nome?: string;
  aspirante_cognome?: string;
}

export interface BandoAllegato {
  id: string;
  nome: string;
  dimensione?: string;
  tipo?: string;
  data_caricamento?: string;
  data?: string; // base64 or file URL
}

export interface Bando {
  id: number;
  titolo: string;
  ente: string;
  livello: 'REGIONALE' | 'NAZIONALE' | 'EUROPEO';
  area_ris3: string;
  beneficiari: string;
  scadenza: string;
  link: string;
  scheda_semplificata: string;
  stato: 'ATTIVO' | 'CHIUSO';
  allegati?: BandoAllegato[];
}

export interface WebTvVideo {
  id: number;
  titolo: string;
  url_youtube: string;
  youtube_id: string;
  rubrica: string;
  descrizione: string;
  bando_id?: number;
  bando_titolo?: string;
  data_pubblicazione: string;
  views: number;
}

export interface QrCodeRecord {
  id: number;
  codice: string;
  label: string;
  comune: string;
  evento: string;
  canale: string;
  url: string;
  scansioni: number;
  creato_il: string;
}

export type HeroShowcaseMode = 'webtv' | 'carousel' | 'digital';

export interface CarouselSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor?: 'emerald' | 'blue' | 'purple' | 'amber' | 'red';
  imageUrl: string;
  ctaText: string;
  ctaAction: 'booking' | 'booking_impresa' | 'booking_aspirante' | 'webtv_modal' | 'external_link';
  grantTitle?: string;
  externalLink?: string;
}

export interface DigitalContentItem {
  id: string;
  title: string;
  category: string;
  description: string;
  type: 'guide' | 'podcast' | 'deadline' | 'link';
  link: string;
  dateBadge?: string;
}

export interface HeroShowcaseConfig {
  activeMode: HeroShowcaseMode;
  autoplayIntervalSeconds: number;
  webtvConfig: {
    badge: string;
    subtitle: string;
    ctaText: string;
    selectedVideoId?: number | null;
  };
  carouselSlides: CarouselSlide[];
  digitalContentConfig: {
    title: string;
    badge: string;
    items: DigitalContentItem[];
  };
}

export interface EventoCrm {
  id: number;
  data: string;
  tipo: 'EVENTO' | 'WORKSHOP' | 'BANDO';
  titolo: string;
  testo: string;
  luogo?: string;
  ora?: string;
  nota?: string;
  bottone?: string;
  link?: string;
  manifesto_url?: string;
  attivo: number;
  creato_il?: string;
}

