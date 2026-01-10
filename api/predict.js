import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Méthode non autorisée"
    });
  }

  try {
    const { match } = req.body || {};

    if (!match || match.length < 5) {
      return res.json({
        success: false,
        error: "Match invalide"
      });
    }

    const prompt = `
Tu es un EXPERT MONDIAL en analyse de paris sportifs football.

Analyse le match (même mal écrit) :
"${match}"

RÈGLES STRICTES :
- Corrige les noms d’équipes
- N’invente JAMAIS de clubs
- Analyse TOUS les événements possibles
- Donne UNIQUEMENT les options LES PLUS PROBABLES
- Ignore totalement V1 / X / V2
- Privilégie : buts, BTTS, over/under, double chance, mi-temps, corners
- Raisonne comme un tipster professionnel

RETOURNE STRICTEMENT ce JSON valide :

{
  "match_corrige": "",
  "analyse_globale": "",
  "niveau_confiance": "faible | moyen | élevé",
  "options_favorables": [
    {
      "option": "",
      "probabilite": "",
      "raison": ""
    }
  ],
  "pari_le_plus_sur": {
    "selection": "",
    "confiance": ""
  },
  "pari_equilibre": {
    "selection": "",
    "confiance": ""
  },
  "pari_plus_risque": {
    "selection": "",
    "confiance": ""
  },
  "conseil_final": ""
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages: [
        { role: "system", content: "Tu es une IA experte en paris sportifs football." },
        { role: "user", content: prompt }
      ]
    });

    const raw = completion.choices[0].message.content.trim();

    let prediction;
    try {
      prediction = JSON.parse(raw);
    } catch {
      return res.json({
        success: false,
        error: "Réponse IA invalide"
      });
    }

    return res.status(200).json({
      success: true,
      prediction
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
}
