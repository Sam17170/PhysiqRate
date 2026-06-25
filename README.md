# BodyScan AI

## Déploiement sur Vercel (5 minutes)

### 1. Prépare le repo GitHub
- Crée un nouveau repo sur github.com
- Upload tous ces fichiers dedans

### 2. Déploie sur Vercel
- Va sur vercel.com → "Add New Project"
- Connecte ton repo GitHub
- Dans "Environment Variables", ajoute :
  - Key : `ANTHROPIC_API_KEY`
  - Value : ta clé API Anthropic (https://console.anthropic.com)
- Clique "Deploy"

### 3. C'est live !
Vercel te donne une URL type `bodyscan-ai.vercel.app`

## Structure
```
/api/analyze.js   → Route serverless (appel Anthropic sécurisé)
/src/App.jsx      → Interface React
/src/main.jsx     → Point d'entrée
/index.html       → HTML racine
```
