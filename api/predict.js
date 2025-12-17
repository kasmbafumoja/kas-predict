








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

    if (!match || !match.toLowerCase().includes("vs")) {
      return res.status(400).json({
        error: "Format invalide. Exemple : Cardiff vs Swansea"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
Tu es un expert football.
 Comme expert de prédiction  de match et de probabilité  , et voir  réellement  si le match indique existe vraiment  , fait aussi de recherche  pour voir leur côtes pour bien analyse ça  , 
Alors tu dois dire à l'utilisateur   
 STRICTEMENT ce JSON :
{
 "V1": "xx%",
 "X": "xx%",
 "V2": "xx%",
 "over25": "xx%",
 "scores_probables": ["1-0","2-1","1-1","2-0"],
 "evenements_frequents": ["but","carton","corner"],
 "confiance": "faible | moyenne | élevée"
}
`
        },
        {
          role: "user",
          content: `Match : ${match}`
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
      match,
      prediction: data
    });

  } catch (err) {
    return res.status(500).json({
      error: "Erreur serveur",
      details: err.message
    });
  }
}
