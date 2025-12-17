import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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"
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const body = req.body || {};
    const match = body.match;

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
Si le match n'existe pas ou n'est pas aujourd'hui/demain → refuse.
Sinon retourne STRICTEMENT ce JSON :

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
