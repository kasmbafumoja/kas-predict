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
        error: "Format invalide. Exemple : Arsenal vs Chelsea"
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `
Tu es un ASSISTANT DE PARI FOOTBALL PROFESSIONNEL.

RÈGLES STRICTES (OBLIGATOIRES) :
1. Si l'un des deux clubs n'est PAS un club réel → REFUSE
2. Si le match n'est PAS très probable aujourd'hui ou demain → REFUSE
3. Si tu n'es PAS sûr à au moins 70% que le match existe → REFUSE
4. Ne JAMAIS inventer de match
5. Si tu refuses, retourne exactement :

{ "refuse": true, "raison": "Match non confirmé ou inexistant" }

SI le match est valide :
Retourne STRICTEMENT ce JSON :

{
  "refuse": false,
  "V1": "xx%",
  "X": "xx%",
  "V2": "xx%",
  "over25": "xx%",
  "btts_oui": "xx%",
  "btts_non": "xx%",
  "corners": "+8.5 | +9.5 | +10.5",
  "scores_probables": ["1-0","2-1","1-1","2-0"],
  "conseil": "N.B : texte court de conseil de pari responsable",
  "confiance": "faible | moyenne | élevée"
}
`
        },
        {
          role: "user",
          content: `Match à analyser : ${match}`
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

    // Si l'IA refuse le match
    if (data.refuse) {
      return res.status(200).json({
        success: false,
        error: data.raison
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
