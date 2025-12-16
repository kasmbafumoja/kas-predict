import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { match } = req.body;

  if (!match) return res.status(400).json({ error: "Nom du match requis" });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.25,
      messages: [
        {
          role: "system",
          content: `
Tu es un expert analyste football, avec données récentes et statistiques.
Tu réponds uniquement en JSON, structure lisible.
Tu détectes automatiquement les équipes, la date, l'heure et l'événement du match.
Tu donnes des probabilités réalistes de victoire et de plus de 2,5 buts.
Tu indiques les événements clés souvent gagnants : BTTS, corners, buteurs probables, moments clés.
`
        },
        {
          role: "user",
          content: `
Analyse ce match : ${match}
Réponds en JSON :
{
  "V1": number,         // % victoire équipe domicile
  "X": number,          // % nul
  "V2": number,         // % victoire équipe extérieur
  "over25": number,     // % over 2.5 buts
  "date": "YYYY-MM-DD", // date du match si connue
  "time": "HH:MM",      // heure du match si connue
  "key_events": [       // événements clés probables
      "BTTS probable",
      "Plus de 2.5 buts",
      "Corner important",
      "Joueur à surveiller"
  ],
  "explanation": string // texte clair expliquant la prédiction
}
`
        }
      ]
    });

    const text = completion.choices[0].message.content.trim();
    const data = JSON.parse(text);

    res.status(200).json({ match, ...data });

  } catch (error) {
    res.status(500).json({ error: "Erreur IA", details: error.message });
  }
}
