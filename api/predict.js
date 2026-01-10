import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  // Autoriser uniquement POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST allowed"
    });
  }

  try {
    const { match } = req.body || {};

    // Validation entrée
    if (!match || typeof match !== "string" || match.trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: "Match manquant ou invalide"
      });
    }

    // PROMPT IA AMÉLIORÉ
    const prompt = `
Tu es un ASSISTANT DE PARI FOOTBALL EXPERT (niveau professionnel).

OBJECTIF :
Analyser le match fourni et identifier UNIQUEMENT les options
les PLUS FAVORABLES et les PLUS PROBABLES, peu importe
le moment ou l’événement du match.

RÈGLES STRICTES :
1. Corrige les noms d’équipes (ex: Man U → Manchester United)
2. Si le match est ambigu, choisis le plus logique aujourd’hui/demain
3. N’invente JAMAIS de clubs
4. Si la détection est incertaine, indique-le clairement
5. Évite les paris faibles ou trop risqués
6. Priorise la sécurité (buts, BTTS, double chance, etc.)

ANALYSE À FAIRE :
- Résultat global
- Buts (Over/Under)
- BTTS
- Corners
- Dynamique du match (ouvert / fermé)

RETOURNE STRICTEMENT CE JSON (AUCUN TEXTE AUTOUR) :

{
  "match_corrige": "Equipe A vs Equipe B",
  "niveau_certitude": "faible | moyen | élevé",

  "V1": "xx%",
  "X": "xx%",
  "V2": "xx%",

  "over25": "xx%",
  "btts_oui": "xx%",
  "btts_non": "xx%",

  "corners": "+8.5 | +9.5 | +10.5",

  "scores_probables": ["1-0","2-1","1-1","2-0"],

  "vip_pari": {
    "selection": "Over 1.5 | BTTS Oui | Double chance | Over 8.5 corners",
    "raison": "Explique pourquoi cette option est la plus sûre"
  },

  "conseil": "Message clair de prudence ou de recommandation",
  "confiance": "faible | moyenne | élevée"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: "Tu es une IA experte en paris sportifs football."
        },
        {
          role: "user",
          content: `${prompt}\n\nAnalyse ce match (même s'il est mal écrit) : ${match}`
        }
      ]
    });

    let raw = completion.choices[0].message.content.trim();

    // Sécurité : retirer ```json si l’IA en met
    raw = raw.replace(/```json|```/g, "").trim();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("JSON IA invalide :", raw);
      return res.status(500).json({
        success: false,
        error: "Réponse IA invalide",
        brut: raw
      });
    }

    // Réponse finale propre
    return res.status(200).json({
      success: true,
      original: match,
      prediction: data
    });

  } catch (err) {
    console.error("Erreur serveur :", err);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur",
      details: err.message
    });
  }
}
