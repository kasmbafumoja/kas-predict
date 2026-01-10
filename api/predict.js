import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res){
  if(req.method !== "POST"){
    return res.status(405).json({success:false, error:"Méthode non autorisée"});
  }

  try {
    const { match } = req.body;

    if(!match || match.length < 5){
      return res.json({success:false, error:"Match invalide"});
    }

    const systemPrompt = `
Tu es **KAS UNIVERSE PREDICTOR**, expert mondial en data-football et analyste tipster professionnel.
Pour chaque match fourni, tu dois analyser et fournir **probabilités et conseils** pour les 11 types d'événements suivants :

1. Issue du match (1N2)
2. Double Chance
3. Plus/Moins 2.5 Buts
4. Les deux équipes marquent (BTTS Oui/Non)
5. Nombre exact de buts (fourchette)
6. Total Corners (Over/Under)
7. Total Cartons Jaunes
8. Buteur probable (Top 1)
9. Résultat à la mi-temps
10. Équipe qui marque en premier
11. Score exact le plus probable

**Instructions strictes :**
- Analyse toutes les options possibles et ne garde que les **options favorables**.
- Donne un **pari sûr**, un **pari équilibré**, et un **pari risqué**.
- Ajoute un **conseil final**.
- Ne jamais inventer de clubs ni de joueurs inexistants.
- Raisonne comme un **analyste tipster professionnel**.
- Fournis **probabilités ou niveaux de confiance** pour chaque option.

**Réponds STRICTEMENT sous ce format JSON :**

{
  "match_corrige": "",
  "analyse_globale": "",
  "events": {
    "issue_1N2": {"option":"", "probabilite":""},
    "double_chance": {"option":"", "probabilite":""},
    "plus_moins_25": {"option":"", "probabilite":""},
    "btts": {"option":"", "probabilite":""},
    "nombre_buts": {"option":"", "probabilite":""},
    "corners": {"option":"", "probabilite":""},
    "cartons_jaunes": {"option":"", "probabilite":""},
    "buteur_top1": {"option":"", "probabilite":""},
    "mi_temps": {"option":"", "probabilite":""},
    "premier_buteur": {"option":"", "probabilite":""},
    "score_exact": {"option":"", "probabilite":""}
  },
  "pari_le_plus_sur":{"selection":"","confiance":""},
  "pari_equilibre":{"selection":"","confiance":""},
  "pari_plus_risque":{"selection":"","confiance":""},
  "conseil_final":""
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages:[
        {role:"system", content:systemPrompt},
        {role:"user", content:`Analyse ce match : "${match}"`}
      ]
    });

    const content = completion.choices[0].message.content.trim();

    let prediction;
    try{
      prediction = JSON.parse(content);
    } catch(err){
      return res.json({success:false, error:"Réponse IA invalide", raw:content});
    }

    return res.json({success:true, prediction});

  } catch(err){
    console.error(err);
    return res.status(500).json({success:false, error:"Erreur serveur", details:err.message});
  }
}
