export interface AreaConfig {
  nome: string;
  col: string;
  soft: string;
  txt: string;
}

export const AREE: Record<'IS' | 'CB' | 'CO', AreaConfig> = {
  IS: { nome: 'Provincia di Isernia', col: '#0284c7', soft: '#e0f2fe', txt: 'text-sky-700' },
  CB: { nome: 'Area Campobasso', col: '#7e22ce', soft: '#f3e8ff', txt: 'text-purple-700' },
  CO: { nome: 'Costa Adriatica', col: '#0d9488', soft: '#ccfbf1', txt: 'text-teal-700' }
};

export interface SportelloInfo {
  id: number;
  nome: string;
  comune: string;
  giorni: string;
  orario: string;
  indirizzo: string;
  lat: number;
  lng: number;
  area: 'IS' | 'CB' | 'CO';
  cadenza: string;
}

export const SPORTELLI_LIST: SportelloInfo[] = [
  { id: 1, nome: "Agnone", comune: "Agnone", giorni: "Martedì", orario: "09:30 - 12:00", indirizzo: "Salita San Pietro 5, 86081 Agnone (IS)", lat: 41.808, lng: 14.378, area: "IS", cadenza: "Settimanale" },
  { id: 2, nome: "Campobasso (sede SIM)", comune: "Campobasso (sede SIM)", giorni: "Lunedì, Mercoledì, Venerdì", orario: "09:30 - 12:00", indirizzo: "Via Nazario Sauro 1, 86100 Campobasso (CB)", lat: 41.561, lng: 14.667, area: "CB", cadenza: "Trisettimanale" },
  { id: 3, nome: "Campochiaro (Incubatore)", comune: "Campochiaro (Incubatore)", giorni: "Mercoledì", orario: "09:30 - 12:00", indirizzo: "C/o Incubatore Imprese, 86020 Campochiaro (CB)", lat: 41.47, lng: 14.51, area: "CB", cadenza: "Settimanale" },
  { id: 4, nome: "Fornelli", comune: "Fornelli", giorni: "Giovedì", orario: "15:00 - 17:00", indirizzo: "C/o Municipio, 86070 Fornelli (IS)", lat: 41.607, lng: 14.14, area: "IS", cadenza: "Settimanale" },
  { id: 5, nome: "Frosolone", comune: "Frosolone", giorni: "Lunedì", orario: "09:30 - 12:00", indirizzo: "C/o Municipio, 86095 Frosolone (IS)", lat: 41.60, lng: 14.45, area: "IS", cadenza: "Settimanale" },
  { id: 6, nome: "Isernia", comune: "Isernia", giorni: "Giovedì", orario: "09:30 - 12:00", indirizzo: "C/o Polo Isernia, 86170 Isernia (IS)", lat: 41.593, lng: 14.233, area: "IS", cadenza: "Settimanale" },
  { id: 7, nome: "Montenero di Bisaccia", comune: "Montenero di Bisaccia", giorni: "Mercoledì", orario: "15:30 - 17:00", indirizzo: "C/o Municipio, 86036 Montenero di Bisaccia (CB)", lat: 41.96, lng: 14.78, area: "CO", cadenza: "Settimanale" },
  { id: 8, nome: "Riccia", comune: "Riccia", giorni: "Venerdì", orario: "09:30 - 12:00", indirizzo: "C/o Municipio, 86016 Riccia (CB)", lat: 41.485, lng: 14.835, area: "CB", cadenza: "Settimanale" },
  { id: 9, nome: "Santa Croce di Magliano", comune: "Santa Croce di Magliano", giorni: "Martedì", orario: "15:00 - 17:00", indirizzo: "C/o Municipio, 86047 Santa Croce di Magliano (CB)", lat: 41.71, lng: 14.99, area: "CB", cadenza: "Settimanale" },
  { id: 10, nome: "Termoli", comune: "Termoli", giorni: "Mercoledì", orario: "09:30 - 12:00", indirizzo: "C/o Polo Termoli, 86039 Termoli (CB)", lat: 42.0, lng: 14.99, area: "CO", cadenza: "Settimanale" },
  { id: 11, nome: "Trivento", comune: "Trivento", giorni: "Lunedì", orario: "15:00 - 17:00", indirizzo: "Centro Polifunzionale Comunale, C.so G. Marconi, 86029 Trivento (CB)", lat: 41.78, lng: 14.55, area: "CB", cadenza: "Settimanale" },
  { id: 12, nome: "Venafro", comune: "Venafro", giorni: "Martedì", orario: "15:00 - 17:00", indirizzo: "C/o Municipio, 86079 Venafro (IS)", lat: 41.484, lng: 14.045, area: "IS", cadenza: "Settimanale" }
];

export const nomeBreve = (nome: string) => nome.replace(/ \(.*\)/, '');

export const ORDINE_SPORTELLI = [
  ...SPORTELLI_LIST.filter(s => s.area === 'IS'),
  ...SPORTELLI_LIST.filter(s => s.area === 'CB'),
  ...SPORTELLI_LIST.filter(s => s.area === 'CO'),
];
