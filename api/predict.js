import fetch from "node-fetch";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "football536.p.rapidapi.com"; // Exemple d'API football sur RapidAPI

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { match } = req.body;
  if (!match) return res.status(400).json({ error: "Nom du match requis" });

  try {
    // --- Étape 1 : Vérifier le match via RapidAPI ---
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dates = [today.toISOString().split("T")[0], tomorrow.toISOString().split("T")[0]];

    let foundMatch = null;

    for (const date of dates) {
      const url = `https://${RAPIDAPI_HOST}/fixtures?date=${date}`;
      const response = await fetch(url, { 
        method: "GET", 
        headers: { 
          "X-RapidAPI-Key": RAPIDAPI_KEY,
          "X-RapidAPI-Host": RAPIDAPI_HOST
        }
      });
      const data = await response.json();
      
      // Chercher le match exact
      const parts = match.split("vs").map(s => s.trim().toLowerCase());
      const matchData = data.response.find(f => 
        f.teams.home.name.toLowerCase().includes(parts[0]) &&
        f.teams.away.name.toLowerCase().includes(parts[1])
      );
      if (matchData) {
        foundMatch = matchData;
        break;
      }
    }

    if (!foundMatch) return res.status(404).json({ error: "Match introuvable aujourd'hui ou demain" });

    const status = foundMatch.fixture.status.short === "LIVE" ? "En direct" : "À venir";
    const matchDate = foundMatch.fixture.date.split("T")[0];
    const matchTime = foundMatch.fixture.date.split("T")[1].slice(0,5);

    // --- Étape 2 : Appel à l'IA pour prédiction ---
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.25,
      messages: [
        { role: "system", content: `
Tu es un expert analyste football. Ne prédis que les matchs valides.
Fournis :
- Probabilité V1/X/V2 réaliste
- Over 2.5
- 4 scores exacts les plus probables
- Événements clés
Réponds uniquement en JSON avec les champs :
V1,X,V2,over25,score_probables,date,time,status,key_events,explanation,error
`},
        { role: "user", content: `
Analyse ce match : ${match}
Date: ${matchDate}, Heure: ${matchTime}, Status: ${status}
` }
      ]
    });

    let prediction;
    try {
      prediction = JSON.parse(completion.choices[0].message.content.trim());
    } catch(e) {
      return res.status(500).json({ error: "Erreur IA, JSON invalide", details: completion.choices[0].message.content });
    }

    // --- Étape 3 : Retour JSON clair ---
    res.status(200).json({ match, ...prediction, date: matchDate, time: matchTime, status });

  } catch (err) {
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}
