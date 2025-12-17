import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { match } = req.body || {};

    if (!match) {
      return res.status(400).json({ error: "Match manquant" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: `
Tu es un ASSISTANT DE PARI FOOTBALL EXPERT.

MISSIONS :
1. Corrige les fautes de noms d’équipes (ex: Man Utd → Manchester United)
2. Si le match est incertain, propose le plus probable
3. Si plusieurs matchs possibles → choisis le plus logique aujourd’hui/demain
4. N’invente JAMAIS de clubs
5. Toujours prévenir si la détection n’est pas certaine

RETOURNE STRICTEMENT CE JSON :

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
   "selection": "BTTS Oui | Over 1.5 | Double chance",
   "raison": "Pourquoi ce pari est le plus sécurisé"
 },
 "conseil": "N.B : message de prudence",
 "confiance": "faible | moyenne | élevée"
}
`
        },
        {
          role: "user",
          content: `Analyse ce match (même s'il est mal écrit) : ${match}`
        }
      ]
    });

    const raw = completion.choices[0].message.content.trim();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({
        error: "Réponse IA invalide",
        brut: raw
      });
    }

    return res.status(200).json({
      success: true,
      original: match,
      prediction: data
    });

  } catch (err) {
    return res.status(500).json({
      error: "Erreur serveur",
      details: err.message
    });
  }
}
