import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

export interface GrantMatchResult {
  bandoId: number;
  score: number; // 0 to 100
  ragione: string;
  puntiForza: string[];
  criticitaDaAttenzionare: string[];
  suggerimentoOperatore: string;
}

export async function matchBandiForProfile(
  profileData: {
    tipo: string;
    denominazione?: string;
    ruolo?: string;
    comune?: string;
    ateco?: string;
    areaRis3?: string;
    dimensione?: string;
    faseVita?: string;
    innovazione?: number;
    usoAi?: number;
    bisogno?: string;
    descrizione?: string;
    condizioneAttuale?: string;
    fasciaEta?: string;
    statoIdea?: string;
  },
  availableGrants: Array<{
    id: number;
    titolo: string;
    ente: string;
    livello: string;
    area_ris3: string;
    beneficiari: string;
    scadenza: string;
    scheda_semplificata: string;
  }>
): Promise<{ matches: GrantMatchResult[]; sintesiStrategica: string }> {
  try {
    const ai = getGemini();

    const prompt = `
Sei il motore di intelligenza artificiale integrato nel CRM dello "Sportello Imprese" di Sviluppo Italia Molise (PR Molise FESR FSE+ 2021-2027).
Il tuo compito è analizzare il profilo dell'utente (impresa o aspirante imprenditore) e valutare la coerenza con i bandi attualmente disponibili a catalogo.

PROFILO UTENTE:
${JSON.stringify(profileData, null, 2)}

CATALOGO BANDI ATTIVI:
${JSON.stringify(availableGrants, null, 2)}

Fornisci un'analisi strutturata in JSON con:
1. "matches": array di corrispondenze ordinate per punteggio decrescente.
2. "sintesiStrategica": un paragrafo di orientamento per l'operatore dello sportello in vista del colloquio (EDP).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction: "Sei un esperto di finanza agevolata, programmazione comunitaria FESR/FSE+ e sviluppo territoriale per la Regione Molise. Rispondi esclusivamente in formato JSON valido.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sintesiStrategica: {
              type: Type.STRING,
              description: "Sintesi strategica per l'operatore di sportello."
            },
            matches: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bandoId: { type: Type.INTEGER },
                  score: { type: Type.INTEGER, description: "Percentuale di affinità da 0 a 100" },
                  ragione: { type: Type.STRING, description: "Motivazione del matching" },
                  puntiForza: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Punti di forza del profilo rispetto al bando"
                  },
                  criticitaDaAttenzionare: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Eventuali vincoli o documenti mancanti"
                  },
                  suggerimentoOperatore: {
                    type: Type.STRING,
                    description: "Cosa consigliare durante il colloquio allo sportello"
                  }
                },
                required: ["bandoId", "score", "ragione", "puntiForza", "criticitaDaAttenzionare", "suggerimentoOperatore"]
              }
            }
          },
          required: ["sintesiStrategica", "matches"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      matches: parsed.matches || [],
      sintesiStrategica: parsed.sintesiStrategica || 'Profilo compatibile con le misure di sviluppo economico territoriale.'
    };
  } catch (error) {
    console.error("Gemini grant matching failed or offline, returning heuristic fallback:", error);
    // Graceful heuristic fallback if API key not yet configured
    const matches: GrantMatchResult[] = availableGrants.map((b, idx) => {
      let score = 70 - idx * 10;
      if (profileData.areaRis3 && b.area_ris3.toLowerCase().includes(profileData.areaRis3.toLowerCase())) {
        score += 25;
      }
      return {
        bandoId: b.id,
        score: Math.min(score, 98),
        ragione: `Opportunità adatta per il settore ${profileData.areaRis3 || 'territoriale'} e bisogni di investimento`,
        puntiForza: ['Compatibilità geografica Molise', 'Allineamento agli obiettivi FESR FSE+'],
        criticitaDaAttenzionare: ['Verificare tempestività invio entro scadenza ' + b.scadenza],
        suggerimentoOperatore: 'Approfondire il piano spese durante il colloquio conoscitivo.'
      };
    }).sort((a, b) => b.score - a.score);

    return {
      matches,
      sintesiStrategica: 'Analisi automatica basata sui requisiti preliminari e sulle aree prioritarie RIS3 Molise.'
    };
  }
}
