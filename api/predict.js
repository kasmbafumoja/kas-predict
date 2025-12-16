// 🌌 KAS UNIVERSE – SIMPLE MATCH PREDICTOR BOT
// Version FACILE – un seul fichier
// Compatible GitHub + Vercel

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
    const prompt = `
Tu es un analyste de football.

Match : ${match}

1. Identifie automatiquement l'équipe domicile (V1) et l'équipe extérieure (V2).
2. Analyse le match de manière réaliste.
3. Donne des probabilités en pourcentage pour :
- V1
- X
- V2
- Over 2.5

Réponds UNIQUEMENT en JSON sous ce format :
{
  "V1": number,
  "X": number,
  "V2": number,
  "over25": number,
  "explanation": string
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const result = JSON.parse(
      completion.choices[0].message.content
    );

    return res.status(200).json({
      match,
      source: "Kas Universe AI",
      ...result,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Erreur IA",
      details: error.message,
    });
  }
}
