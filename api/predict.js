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

    const prompt = `
Tu es un expert mondial en paris sportifs football.
Raisonne comme un tipster professionnel et analyse toutes les options possibles du match : "${match}".

Consignes :
- Donne uniquement les options favorables (ignore les faibles).
- Inclue analyse globale et raisonnement IA.
- Donne un pari sûr, un pari équilibré et un pari risqué.
- Ajoute un conseil final.
- Ne donne jamais de clubs inventés.
- JSON strict obligatoire.

Réponds STRICTEMENT sous ce format JSON :
{
  "match_corrige": "",
  "analyse_globale": "",
  "options_favorables":[
    {"option":"","probabilite":"","raison":""}
  ],
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
        {role:"system", content:"Tu es une IA experte en paris sportifs."},
        {role:"user", content:prompt}
      ]
    });

    const content = completion.choices[0].message.content.trim();

    let prediction;
    try {
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
