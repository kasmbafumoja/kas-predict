import OpenAI from "openai";
import { OPENAI_API_KEY } from "../config.js";

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    // Autoriser seulement POST
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Méthode non autorisée"
      });
    }

    // Vérifier clé
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Clé OpenAI manquante"
      });
    }

    const { match } = req.body || {};

    // Vérifier format du match
    if (!match || !match.toLowerCase().includes("vs")) {
      return res.status(400).json({
        error: "Format invalide. Utilise : Équipe A vs Équipe B"
      });
    }

    // Date aujourd'hui / demain
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const dateInfo = `
Date actuelle : ${today.toDateString()}
Date limite : ${tomorrow.toDateString()}
`;

    // Appel IA
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: `
Tu es un EXPERT en analyse de paris football.

RÈGLES OBLIGATOIRES :
- Analyse UNIQUEMENT si le match existe réellement
- Le match doit être AUJOURD'HUI ou DEMAIN
- Sinon réponds avec { "error": "Match invalide ou hors date" }

SI VALIDE, retourne UNIQUEMENT ce JSON :
{
  "V1": "pourcentage",
  "X": "pourcentage",
  "V2": "pourcentage",
  "over25": "pourcentage",
  "scores_probables": ["score1","score2","score3","score4"],
  "evenements_frequents": ["event1","event2","event3"],
  "confiance": "faible / moyenne / élevée"
}
`
        },
        {
          role: "user",
          content: `
Match : ${match}
${dateInfo}
`
        }
      ]
    });

    const raw = completion.choices[0].message.content.trim();

    // Parser JSON
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({
        error: "Réponse IA non valide",
        brut: raw
      });
    }

    // Retour final
    return res.status(200).json({
      success: true,
      match,
      generated_at: new Date().toISOString(),
      prediction: data
    });

  } catch (err) {
    return res.status(500).json({
      error: "Erreur serveur",
      message: err.message
    });
  }
}
