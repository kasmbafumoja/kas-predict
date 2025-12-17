import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Méthode non autorisée" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY manquant" });
    }

    const { match } = req.body || {};

    if (!match || !match.toLowerCase().includes("vs")) {
      return res.status(400).json({
        error: "Format invalide. Utilise : Équipe A vs Équipe B"
      });
    }

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // --- IA UNIQUEMENT (PAS D'API FOOTBALL POUR ÉVITER CRASH) ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `
Tu es un expert analyste football.
RÈGLES STRICTES :
- Si le match n'est PAS entre aujourd'hui et demain → refuse
- Si le match semble inexistant → refuse
- Sinon donne :
V1/X/V2 (%), over2.5 (%),
4 scores exacts probables,
événements fréquents
Réponds UNIQUEMENT en JSON valide.
`
        },
        {
          role: "user",
          content: `
Match : ${match}
Date limite : aujourd'hui ou demain uniquement
`
        }
      ]
    });

    const content = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(500).json({
        error: "Réponse IA invalide",
        raw: content
      });
    }

    return res.status(200).json({
      success: true,
      match,
      generated_at: new Date().toISOString(),
      data: parsed
    });

  } catch (err) {
    return res.status(500).json({
      error: "Erreur serveur interne",
      message: err.message
    });
  }
}
