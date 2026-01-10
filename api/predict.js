import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Méthode non autorisée" });
  }

  try {
    const { match } = req.body;

    if (!match || match.length < 5) {
      return res.json({ success: false, error: "Match invalide" });
    }

    const prompt = `
Tu es un expert mondial en analyse de paris sportifs football.

Analyse le match : "${match}"

Règles :
- Analyse TOUS les événements possibles du match
- Donne UNIQUEMENT les options les PLUS PROBABLES
- Ignore les options faibles
- Ne te limite pas au score final
- Raisonne comme un tipster professionnel

Réponds STRICTEMENT en JSON valide :

{
  "match_corrige": "",
  "analyse_globale": "",
  "options_favorables": [
    { "option": "", "probabilite": "", "raison": "" }
  ],
  "pari_le_plus_sur": { "selection": "", "confiance": "" },
  "pari_equilibre": { "selection": "", "confiance": "" },
  "pari_risque": { "selection": "", "confiance": "" },
  "conseil_final": ""
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: "Tu es une IA experte en paris sportifs." },
        { role: "user", content: prompt }
      ]
    });

    const content = completion.choices[0].message.content;

    let prediction;
    try {
      prediction = JSON.parse(content);
    } catch {
      return res.json({ success: false, error: "Réponse IA invalide" });
    }

    return res.json({ success: true, prediction });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Erreur serveur"
    });
  }
}
