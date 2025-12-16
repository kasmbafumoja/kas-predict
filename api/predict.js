import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { match } = req.body;

  if (!match) {
    return res.status(400).json({ error: "Nom du match requis" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "Tu réponds uniquement en JSON valide."
        },
        {
          role: "user",
          content: `
Analyse ce match de football réel : ${match}

Donne des probabilités réalistes en pourcentage pour :
- V1 (domicile)
- X (nul)
- V2 (extérieur)
- Over 2.5

Format JSON exact :
{
  "V1": 0,
  "X": 0,
  "V2": 0,
  "over25": 0,
  "explanation": ""
}
`
        }
      ],
      temperature: 0.3
    });

    const text = completion.choices[0].message.content.trim();
    const data = JSON.parse(text);

    res.status(200).json({
      match,
      ...data
    });

  } catch (error) {
    res.status(500).json({
      error: "Erreur IA",
      details: error.message
    });
  }
}
