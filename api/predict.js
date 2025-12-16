import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { match } = req.body;
  if (!match) return res.status(400).json({ error: "Nom du match requis" });

  try {
    // Prompt pour l'IA
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: `
Tu es un expert analyste football.
Ne prédis que les matchs joués aujourd'hui ou demain.
Si le match n'existe pas ou est hors délai, retourne JSON avec "error".
Si le match est en direct, indique "status":"En direct".
Fournis :
- Probabilité V1/X/V2 réaliste
- Over 2.5
- 4 scores exacts les plus probables
- Événements clés (BTTS, moments probables, joueurs à surveiller)
- Date et heure du match
Réponds uniquement en JSON.
`
        },
        {
          role: "user",
          content: `
Analyse ce match : ${match}
Réponds en JSON avec la structure suivante :
{
  "V1": number,
  "X": number,
  "V2": number,
  "over25": number,
  "score_probables": ["0-1","1-1","2-1","1-2"],
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "status": "À venir / En direct",
  "key_events": ["BTTS probable","Plus de 2.5 buts","Corner important","Joueur à surveiller"],
  "explanation": "",
  "error": ""
}
`
        }
      ]
    });

    const text = completion.choices[0].message.content.trim();

    // Essayer de parser JSON renvoyé par l'IA
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      return res.status(500).json({ error: "Erreur IA, JSON invalide", details: text });
    }

    res.status(200).json({ match, ...data });

  } catch (error) {
    res.status(500).json({ error: "Erreur serveur / IA", details: error.message });
  }
}
