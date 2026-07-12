import { useState, useRef, useEffect, useContext, createContext } from "react";

// ─── I18N ─────────────────────────────────────────────────────────────────────
// Dictionnaire de traductions. Structure: STRINGS.section.cle = { fr: "...", en: "..." }
// Le nom de marque "Physiqrate" n'est jamais traduit.
const STRINGS = {
  nav: {
    analyser:    { fr: "Analyser",    en: "Analyze" },
    jour:        { fr: "Journée",     en: "Today" },
    historique:  { fr: "Historique",  en: "History" },
    progression: { fr: "Progression", en: "Progress" },
    profil:      { fr: "Profil",      en: "Profile" },
  },
  header: {
    installTitle: { fr: "Installer l'app", en: "Install app" },
    connexion:    { fr: "Connexion",       en: "Log in" },
    premium:      { fr: "PREMIUM",         en: "PREMIUM" },
    pro:          { fr: "✓ PRO",           en: "✓ PRO" },
  },
  archetype: {
    competition:  { fr: "Compétition",   en: "Competition" },
    eliteAthlete: { fr: "Athlète Elite", en: "Elite athlete" },
    athlete:      { fr: "Athlète",       en: "Athlete" },
    fit:          { fr: "Fit",           en: "Fit" },
    lifestyle:    { fr: "Lifestyle",     en: "Lifestyle" },
    casual:       { fr: "Casual",        en: "Casual" },
    bulk:         { fr: "Bulk",          en: "Bulk" },
    rebuild:      { fr: "Rebuild",       en: "Rebuild" },
  },
  archetypeRef: {
    peakCompetition:      { fr: "Pic de compétition",        en: "Competition peak" },
    eliteUltraLean:       { fr: "Élite ultra sec",           en: "Elite ultra lean" },
    builtAthlete:         { fr: "Athlète bâti",               en: "Built athlete" },
    sculptedFit:          { fr: "Silhouette fit et sculptée", en: "Fit and sculpted" },
    activeLifestyle:      { fr: "Bien portant, actif",        en: "Healthy and active" },
    bearMode:             { fr: "Mode décontracté",           en: "Casual mode" },
    offSeasonLifter:      { fr: "Off-season powerlifter",     en: "Off-season powerlifter" },
    transformationMission:{ fr: "Mission transformation",     en: "Transformation mission" },
    bikiniAthlete:        { fr: "Bikini athlète",             en: "Bikini athlete" },
    eliteAthleteF:        { fr: "Athlète élite",              en: "Elite athlete" },
    toneFigure:           { fr: "Silhouette tonique",          en: "Toned figure" },
    fitFigure:            { fr: "Silhouette fit",              en: "Fit figure" },
    healthyVibes:         { fr: "Healthy vibes",               en: "Healthy vibes" },
    potentialToUnlock:    { fr: "Du potentiel à débloquer",   en: "Potential to unlock" },
    comfortZone:          { fr: "Zone de confort",             en: "Comfort zone" },
  },
  shareCard: {
    bodyFatLabel: { fr: "BODY FAT", en: "BODY FAT" },
    categoryLabel: { fr: "CATÉGORIE", en: "CATEGORY" },
    confidenceLabel: { fr: "CONFIANCE", en: "CONFIDENCE" },
    observationLabel: { fr: "OBSERVATION", en: "OBSERVATION" },
    confHigh: { fr: "Élevée", en: "High" },
    confMedium: { fr: "Moyenne", en: "Medium" },
    confLow: { fr: "Faible", en: "Low" },
    muscleMassLabel: { fr: "MASSE MUSCULAIRE", en: "MUSCLE MASS" },
    estimatedTag: { fr: "Estimation", en: "Estimated" },
    addProfileTag: { fr: "Complète ton profil", en: "Complete your profile" },
  },
  emailMismatch: {
    title:        { fr: "Email différent détecté", en: "Different email detected" },
    body:         { fr: "Tu as payé avec {paidEmail}, mais tu es connecté avec {currentEmail}. Ton abonnement Pro est lié à {paidEmail}.", en: "You paid with {paidEmail}, but you're logged in as {currentEmail}. Your Pro subscription is linked to {paidEmail}." },
    switchBtn:    { fr: "Utiliser le compte {paidEmail}", en: "Use the {paidEmail} account" },
    keepBtn:      { fr: "Garder mon compte actuel", en: "Keep my current account" },
  },
  analyze: {
    eyebrow:        { fr: "ANALYSE IA · BODY FAT", en: "AI ANALYSIS · BODY FAT" },
    title:          { fr: "Connaît ton vrai physique", en: "Know your real physique" },
    subtitle:       { fr: "Résultats en secondes", en: "Results in seconds" },
    weeklyReady:    { fr: "Analyse hebdomadaire disponible", en: "Weekly analysis available" },
    go:             { fr: "Go →", en: "Go →" },
    completeProfile:{ fr: "Complète ton profil pour plus de précision", en: "Complete your profile for more accuracy" },
    profileArrow:   { fr: "Profil →", en: "Profile →" },
    uploadTitle:    { fr: "Prendre ou choisir une photo", en: "Take or choose a photo" },
    uploadSubtitle: { fr: "Corps entier de préférence", en: "Full body preferred" },
    tipsTitle:      { fr: "Conseils d'utilisation", en: "Usage tips" },
    tip1:           { fr: "Porte une tenue ajustée", en: "Wear fitted clothing" },
    tip2:           { fr: "Place-toi dans une pièce bien éclairée", en: "Stand in a well-lit room" },
    tip3:           { fr: "Prends la photo de face", en: "Take the photo facing forward" },
    genre:          { fr: "Genre", en: "Gender" },
    homme:          { fr: "Homme", en: "Male" },
    femme:          { fr: "Femme", en: "Female" },
    ageLabel:       { fr: "Âge (optionnel)", en: "Age (optional)" },
    agePlaceholder: { fr: "Ex : 24", en: "E.g. 24" },
    weightLabel:    { fr: "Poids (kg) · optionnel", en: "Weight (kg) · optional" },
    weightPlaceholder: { fr: "Ex : 75", en: "E.g. 75" },
    analyzeBtn:     { fr: "Analyser mon physique", en: "Analyze my physique" },
    changePhoto:    { fr: "Changer de photo", en: "Change photo" },
    analyzing:      { fr: "Analyse en cours", en: "Analysis in progress" },
    analyzingSub:   { fr: "L'IA examine ta composition corporelle", en: "The AI is examining your body composition" },
    step1:          { fr: "Détection musculaire", en: "Muscle detection" },
    step2:          { fr: "Analyse sous-cutanée", en: "Subcutaneous analysis" },
    step3:          { fr: "Calibration archétype", en: "Archetype calibration" },
    defaultDesc:    { fr: "Continue sur ta lancée.", en: "Keep up the momentum." },
    indicatorsTitle:{ fr: "INDICATEURS ANALYSÉS", en: "ANALYZED INDICATORS" },
    personalizedTitle: { fr: "ANALYSE PERSONNALISÉE", en: "PERSONALIZED ANALYSIS" },
    msgTop2:        { fr: "Tu es dans le top 2% mondial. Maintenir ce niveau demande de la rigueur — continue.", en: "You're in the global top 2%. Maintaining this level takes discipline — keep going." },
    msgElite:       { fr: "Encore 2-3% à perdre et tu atteins l'élite. En 6-8 semaines de déficit léger c'est atteignable.", en: "Just 2-3% more and you reach elite level. Achievable in 6-8 weeks of a light deficit." },
    msgAthletic:    { fr: "Physique athlétique solide. Un déficit de 300-400 kcal/jour te mène à la catégorie Athlète en 8-10 semaines.", en: "Solid athletic physique. A 300-400 kcal/day deficit gets you to Athlete category in 8-10 weeks." },
    msgGoodBase:    { fr: "Bonne base. Combine déficit calorique et musculation pour une transformation visible en 12 semaines.", en: "Good base. Combine a calorie deficit with strength training for a visible transformation in 12 weeks." },
    msgPotential:   { fr: "Le potentiel est là. Configure ton profil pour obtenir ton plan calorique personnalisé.", en: "The potential is there. Set up your profile to get your personalized calorie plan." },
    msgStart:       { fr: "Chaque transformation commence ici. Configure ton profil — c'est la première étape.", en: "Every transformation starts here. Set up your profile — it's the first step." },
    installNudgeTitle: { fr: "Installe Physiqrate", en: "Install Physiqrate" },
    installNudgeSub:   { fr: "Reviens chaque semaine suivre ta progression", en: "Come back every week to track your progress" },
    openSafari:        { fr: "Ouvrir dans Safari pour installer", en: "Open in Safari to install" },
    addHomeScreen:     { fr: "Ajouter à l'écran d'accueil", en: "Add to home screen" },
    shareCardTitle: { fr: "CARTE DE PARTAGE", en: "SHARE CARD" },
    generating:     { fr: "Génération en cours…", en: "Generating…" },
    shareBtn:       { fr: "Partager mon résultat", en: "Share my result" },
    newAnalysis:    { fr: "Nouvelle analyse", en: "New analysis" },
    seeProgress:    { fr: "Voir ma progression", en: "See my progress" },
    selectGender:   { fr: "Sélectionne ton genre.", en: "Select your gender." },
    errorPrefix:    { fr: "Erreur : ", en: "Error: " },
    shareText:      { fr: "Mon body fat : {bf}% — {ref} | PHYSIQRATE", en: "My body fat: {bf}% — {ref} | PHYSIQRATE" },
  },
  common: {
    add:      { fr: "Ajouter", en: "Add" },
    cancel:   { fr: "Annuler", en: "Cancel" },
    profileArrow: { fr: "Profil →", en: "Profile →" },
    quickAccess: { fr: "Accessible rapidement la prochaine fois", en: "Quick access next time" },
  },
  jour: {
    completeProfileCal: { fr: "Complète ton profil pour voir ton objectif calorique", en: "Complete your profile to see your calorie target" },
    goalTitle:      { fr: "OBJECTIF DU JOUR", en: "TODAY'S GOAL" },
    maintenance:    { fr: "Maintien", en: "Maintenance" },
    goal:           { fr: "Objectif", en: "Goal" },
    consumed:       { fr: "Consommé", en: "Consumed" },
    remaining:      { fr: "{n} restantes", en: "{n} remaining" },
    exceeded:       { fr: "{n} dépassées", en: "{n} over" },
    macrosTitle:    { fr: "MACROS DU JOUR", en: "TODAY'S MACROS" },
    protShort:      { fr: "PROT.", en: "PROT." },
    carbShort:      { fr: "GLUC.", en: "CARBS" },
    fatShort:       { fr: "LIP.", en: "FAT" },
    kcal:           { fr: "KCAL", en: "KCAL" },
    macroGoalsTitle:{ fr: "OBJECTIFS MACROS", en: "MACRO GOALS" },
    protein:        { fr: "Protéines", en: "Protein" },
    carbs:          { fr: "Glucides", en: "Carbs" },
    fat:            { fr: "Lipides", en: "Fat" },
    basedOn:        { fr: "Basé sur {p}g prot · {f}g lip · {c}g gluc", en: "Based on {p}g protein · {f}g fat · {c}g carbs" },
    mealsTitle:     { fr: "REPAS", en: "MEALS" },
    noMealToday:    { fr: "Aucun repas ajouté aujourd'hui", en: "No meal added today" },
    mealAdded:      { fr: "{name} ajouté — {cal} kcal", en: "{name} added — {cal} kcal" },
    mealDeleted:    { fr: "Repas supprimé", en: "Meal deleted" },
    sessionDeleted: { fr: "Séance supprimée", en: "Session deleted" },
    sessionAdded:   { fr: "Séance \"{type}\" ajoutée ✓", en: "Session \"{type}\" added ✓" },
    myFoodsTitle:   { fr: "MES ALIMENTS", en: "MY FOODS" },
    noFoodSaved:    { fr: "Aucun aliment enregistré.", en: "No food saved yet." },
    scanHint:       { fr: "Scanne un produit et coche \"Enregistrer cet aliment\".", en: "Scan a product and check \"Save this food\"." },
    per100g:        { fr: "(pour 100g)", en: "(per 100g)" },
    newMealTitle:   { fr: "NOUVEAU REPAS", en: "NEW MEAL" },
    scannerBtn:     { fr: "Scanner", en: "Scan" },
    myFoodsBtn:     { fr: "Mes aliments", en: "My foods" },
    mealNamePh:     { fr: "Nom du repas", en: "Meal name" },
    caloriesPh:     { fr: "Calories (kcal)", en: "Calories (kcal)" },
    proteinPh:      { fr: "Protéines (g)", en: "Protein (g)" },
    carbsPh:        { fr: "Glucides (g)", en: "Carbs (g)" },
    fatPh:          { fr: "Lipides (g)", en: "Fat (g)" },
    saveFood:       { fr: "Enregistrer cet aliment", en: "Save this food" },
    addFoodDashed:  { fr: "Ajouter un aliment", en: "Add a food" },
    activityTitle:  { fr: "ACTIVITÉ", en: "ACTIVITY" },
    stepsDone:      { fr: "Pas effectués", en: "Steps taken" },
    stepsGoal:      { fr: "Objectif · 10 000 pas", en: "Goal · 10,000 steps" },
    mySessionsTitle:{ fr: "MES SÉANCES", en: "MY SESSIONS" },
    noSessionSaved: { fr: "Aucune séance enregistrée.", en: "No session saved yet." },
    newSessionTitle:{ fr: "NOUVELLE SÉANCE", en: "NEW SESSION" },
    sessionTypePh:  { fr: "Type de séance (ex: Dos biceps)", en: "Session type (e.g. Back & biceps)" },
    durationPh:     { fr: "Durée (minutes)", en: "Duration (minutes)" },
    saveSession:    { fr: "Enregistrer cette séance", en: "Save this session" },
    editSession:    { fr: "Modifier la séance", en: "Edit session" },
    addSession:     { fr: "Ajouter une séance", en: "Add a session" },
    mySessionsBtn:  { fr: "Mes séances", en: "My sessions" },
  },
  historique: {
    title:          { fr: "HISTORIQUE", en: "HISTORY" },
    analysesTitle:  { fr: "ANALYSES", en: "ANALYSES" },
    proTitle:       { fr: "PHYSIQRATE PRO", en: "PHYSIQRATE PRO" },
    fullHistory:    { fr: "Ton historique complet", en: "Your full history" },
    calendarPerk:   { fr: "Calendrier de tes analyses", en: "Calendar of your analyses" },
    historyPerk:    { fr: "Historique body fat sur tous tes appareils", en: "Body fat history across all your devices" },
    syncPerk:       { fr: "Synchronisation cloud sécurisée", en: "Secure cloud sync" },
    unlockPro:      { fr: "Débloquer Pro — 4,99€/mois", en: "Unlock Pro — €4.99/month" },
    cancelAnytime:  { fr: "Résiliation à tout moment", en: "Cancel anytime" },
    kcalLabel:      { fr: "KCAL", en: "KCAL" },
    stepsLabel:     { fr: "PAS", en: "STEPS" },
    sessionLabel:   { fr: "SÉANCE", en: "SESSION" },
    mealsLabel:     { fr: "REPAS", en: "MEALS" },
    macrosLabel:    { fr: "MACROS", en: "MACROS" },
    protein:        { fr: "Protéines", en: "Protein" },
    carbs:          { fr: "Glucides", en: "Carbs" },
    fat:            { fr: "Lipides", en: "Fat" },
    inGoal:         { fr: "Dans l'objectif", en: "On target" },
    over:           { fr: "Au-dessus", en: "Over" },
    today:          { fr: "Aujourd'hui", en: "Today" },
    clickDay:       { fr: "Clique sur un jour pour voir le détail", en: "Click on a day to see details" },
  },
  progression: {
    current:        { fr: "ACTUEL", en: "CURRENT" },
    evolution:      { fr: "ÉVOLUTION", en: "CHANGE" },
    analysesCount:  { fr: "ANALYSES", en: "ANALYSES" },
    photoHistoryTitle: { fr: "HISTORIQUE PHOTOS", en: "PHOTO HISTORY" },
    proTitle:       { fr: "PHYSIQRATE PRO", en: "PHYSIQRATE PRO" },
    followTransfo:  { fr: "Suis ta transformation", en: "Track your transformation" },
    photoHistoryPerk: { fr: "Historique de tes photos", en: "History of your photos" },
    curvePerk:      { fr: "Courbe de progression body fat", en: "Body fat progress curve" },
    comparePerk:    { fr: "Comparatif IA entre deux dates", en: "AI comparison between two dates" },
    unlockPro:      { fr: "Débloquer Pro — 4,99€/mois", en: "Unlock Pro — €4.99/month" },
    cancelAnytime:  { fr: "Résiliation à tout moment", en: "Cancel anytime" },
    milestoneTitle: { fr: "MILESTONE", en: "MILESTONE" },
    milestoneAmazing:  { fr: "Incroyable — tu as perdu {n}% de body fat. C'est une transformation majeure.", en: "Incredible — you've lost {n}% body fat. That's a major transformation." },
    milestoneExcellent:{ fr: "Excellente progression — {n}% de body fat en moins. Tu es sur la bonne voie.", en: "Excellent progress — {n}% less body fat. You're on the right track." },
    milestoneGood:     { fr: "Bonne progression — {n}% de body fat perdu. Continue ta consistance.", en: "Good progress — {n}% body fat lost. Keep up your consistency." },
    milestoneMuscle:   { fr: "Prise de muscle détectée — +{n}% sur un physique déjà sec. Probablement de la masse musculaire.", en: "Muscle gain detected — +{n}% on an already lean physique. Likely muscle mass." },
    milestoneAdjust:   { fr: "+{n}% de body fat depuis le début. Il est temps d'ajuster ton alimentation.", en: "+{n}% body fat since the start. Time to adjust your diet." },
    comparePro:     { fr: "Comparatif — Pro", en: "Comparison — Pro" },
    noAnalysisYet:  { fr: "Aucune analyse encore. Lance ta première analyse photo.", en: "No analysis yet. Run your first photo analysis." },
    compareAvailable: { fr: "Comparatif IA disponible", en: "AI comparison available" },
    selectTwoPhotos:  { fr: "Sélectionne 2 photos pour voir l'évolution de ton physique analysée par l'IA", en: "Select 2 photos to see your physique's evolution analyzed by AI" },
    unlockFor:      { fr: "Débloquer pour 4,99€/mois", en: "Unlock for €4.99/month" },
    aiCompare:      { fr: "Comparatif IA", en: "AI comparison" },
    proLabel:       { fr: "PRO", en: "PRO" },
    compareTwoBtn:  { fr: "Comparer les 2 photos sélectionnées", en: "Compare the 2 selected photos" },
    aiCompareTitle: { fr: "COMPARATIF IA", en: "AI COMPARISON" },
    fatLossConfirmed: { fr: "Perte de graisse confirmée", en: "Fat loss confirmed" },
    massGainDetected: { fr: "Prise de masse détectée", en: "Mass gain detected" },
    lessBetween:    { fr: "en moins", en: "less" },
    moreBetween:    { fr: "en plus", en: "more" },
    betweenAnalyses:{ fr: "{n}% de body fat {dir} entre ces deux analyses.", en: "{n}% body fat {dir} between these two analyses." },
    definitionImproved: { fr: " Définition musculaire améliorée.", en: " Muscle definition improved." },
    keepWork:       { fr: " Continue ton travail.", en: " Keep up the work." },
    curveTitle:     { fr: "COURBE BODY FAT", en: "BODY FAT CURVE" },
    trendTitle:     { fr: "TENDANCE & OBJECTIF", en: "TREND & GOAL" },
    weeklyRate:     { fr: "{n}%/semaine", en: "{n}%/week" },
    weightWeeklyRate: { fr: "{n}kg/semaine", en: "{n}kg/week" },
    notEnoughData:  { fr: "Pas encore assez de données — continue tes analyses régulières pour voir ta tendance se dessiner.", en: "Not enough data yet — keep up your regular analyses to see your trend emerge." },
    goalReached:    { fr: "Objectif atteint — tu es à {current}%, sous ton objectif de {target}%.", en: "Goal reached — you're at {current}%, below your {target}% target." },
    projectionText: { fr: "À ce rythme ({rate}%/semaine), tu devrais atteindre {target}% vers le {date}.", en: "At this rate ({rate}%/week), you should reach {target}% around {date}." },
    stalledText:    { fr: "Ta tendance ne va pas encore dans le sens de ton objectif de {target}%. Ajuste ton alimentation ou ton entraînement pour relancer la perte.", en: "Your trend isn't moving toward your {target}% goal yet. Adjust your diet or training to restart progress." },
    bulkWeightGain: { fr: "Tu prends du poids à +{rate}kg/semaine — cohérent avec ta phase de prise de masse.", en: "You're gaining weight at +{rate}kg/week — consistent with your bulk phase." },
    bulkWeightStalled: { fr: "Ton poids ne progresse pas encore vers ta prise de masse. Vérifie ton surplus calorique.", en: "Your weight isn't trending toward your bulk goal yet. Check your calorie surplus." },
    maintainStable: { fr: "Ton body fat évolue de {rate}%/semaine — reste autour de cette zone pour maintenir.", en: "Your body fat is moving at {rate}%/week — stay around this zone to maintain." },
    noGoalSet:      { fr: "Renseigne un objectif dans ton profil pour voir une projection personnalisée.", en: "Set a goal in your profile to see a personalized projection." },
    weightLabel:    { fr: "Poids", en: "Weight" },
    bodyFatLabel:   { fr: "Body fat", en: "Body fat" },
    combinedChartTitle: { fr: "POIDS & BODY FAT", en: "WEIGHT & BODY FAT" },
    combinedChartHint:  { fr: "Les deux courbes qui baissent ensemble = vraie perte de gras. Le poids qui baisse sans que le body fat baisse peut signifier une perte de muscle.", en: "Both curves dropping together = real fat loss. Weight dropping without body fat dropping can mean muscle loss." },
    markTestToggle: { fr: "Marquer comme test / pas moi (exclu du calcul de tendance)", en: "Mark as test / not me (excluded from trend calculation)" },
    testLabel:      { fr: "TEST", en: "TEST" },
  },
  activityLevels: {
    sedentary:     { fr: "Sédentaire — peu ou pas d'exercice", en: "Sedentary — little or no exercise" },
    light:         { fr: "Légèrement actif — 1 à 3x/sem", en: "Lightly active — 1 to 3x/week" },
    moderate:      { fr: "Modérément actif — 3 à 5x/sem", en: "Moderately active — 3 to 5x/week" },
    active:        { fr: "Très actif — 4 à 6x/sem", en: "Very active — 4 to 6x/week" },
    extra_active:  { fr: "Extrêmement actif — 2x/jour", en: "Extremely active — 2x/day" },
  },
  activityLevelsShort: {
    sedentary:     { fr: "Sédentaire", en: "Sedentary" },
    light:         { fr: "Légèrement actif", en: "Lightly active" },
    moderate:      { fr: "Modérément actif", en: "Moderately active" },
    active:        { fr: "Très actif", en: "Very active" },
    extra_active:  { fr: "Extrêmement actif", en: "Extremely active" },
  },
  dailySteps: {
    under_3k: { fr: "Moins de 3 000 pas/jour", en: "Less than 3,000 steps/day" },
    "3k_6k":  { fr: "3 000 à 6 000 pas/jour", en: "3,000 to 6,000 steps/day" },
    "6k_10k": { fr: "6 000 à 10 000 pas/jour", en: "6,000 to 10,000 steps/day" },
    "10k_15k":{ fr: "10 000 à 15 000 pas/jour", en: "10,000 to 15,000 steps/day" },
    over_15k: { fr: "Plus de 15 000 pas/jour", en: "More than 15,000 steps/day" },
  },
  goals: {
    cut_hard:  { fr: "Perte de gras agressive (−25%)", en: "Aggressive fat loss (−25%)" },
    cut:       { fr: "Perte de gras (−15%)", en: "Fat loss (−15%)" },
    maintain:  { fr: "Maintien (0%)", en: "Maintenance (0%)" },
    lean_bulk: { fr: "Prise de muscle (+10%)", en: "Lean bulk (+10%)" },
    bulk:      { fr: "Prise de masse (+20%)", en: "Bulk (+20%)" },
  },
  profil: {
    completionTitle: { fr: "COMPLÉTION DU PROFIL", en: "PROFILE COMPLETION" },
    completionHint:  { fr: "Plus ton profil est complet, plus l'analyse est précise", en: "The more complete your profile, the more accurate the analysis" },
    ageLabel:        { fr: "Âge", en: "Age" },
    heightLabel:     { fr: "Taille (cm)", en: "Height (cm)" },
    heightPlaceholder: { fr: "Ex : 178", en: "E.g. 178" },
    refWeightLabel:  { fr: "Poids de référence (kg)", en: "Reference weight (kg)" },
    autoUpdated:     { fr: "Mis à jour automatiquement à chaque analyse", en: "Automatically updated with each analysis" },
    activityLabel:   { fr: "Niveau d'activité", en: "Activity level" },
    stepsLabel:      { fr: "Pas moyens par jour", en: "Average daily steps" },
    trainingLabel:   { fr: "Type d'entraînement", en: "Training type" },
    strength:        { fr: "Muscu", en: "Strength" },
    cardio:          { fr: "Cardio", en: "Cardio" },
    mixed:           { fr: "Mixte", en: "Mixed" },
    sport:           { fr: "Sport", en: "Sport" },
    goalLabel:       { fr: "Objectif", en: "Goal" },
    saved:           { fr: "✓ Profil sauvegardé", en: "✓ Profile saved" },
    saveBtn:         { fr: "Sauvegarder le profil", en: "Save profile" },
    tdeeTitle:       { fr: "TDEE — FORMULE MIFFLIN-ST JEOR", en: "TDEE — MIFFLIN-ST JEOR FORMULA" },
    homme:           { fr: "Homme", en: "Male" },
    femme:           { fr: "Femme", en: "Female" },
    yearsOld:        { fr: "ans", en: "y/o" },
    maintenanceKcal: { fr: "Maintien (kcal/jour)", en: "Maintenance (kcal/day)" },
    goalKcal:        { fr: "Objectif (kcal/jour)", en: "Goal (kcal/day)" },
    calcDetail:      { fr: "DÉTAIL DU CALCUL", en: "CALCULATION DETAILS" },
    bmr:             { fr: "Métabolisme de base (TMB)", en: "Basal metabolic rate (BMR)" },
    activityMult:    { fr: "Multiplicateur activité", en: "Activity multiplier" },
    stepsBonus:      { fr: "Bonus pas quotidiens", en: "Daily steps bonus" },
    mifflinRef:      { fr: "Formule Mifflin-St Jeor · Référence clinique internationale", en: "Mifflin-St Jeor formula · International clinical reference" },
    dailyMacroGoals: { fr: "OBJECTIFS MACROS JOURNALIERS", en: "DAILY MACRO GOALS" },
    reset:           { fr: "Réinitialiser", en: "Reset" },
    modified:        { fr: "Modifié", en: "Modified" },
    custom:          { fr: "Personnalisé", en: "Custom" },
    remainingCals:   { fr: "Reste des cals", en: "Remaining cals" },
    totalCalculated: { fr: "Total calculé", en: "Total calculated" },
    accountTitle:    { fr: "MON COMPTE", en: "MY ACCOUNT" },
    proMember:       { fr: "Abonné Pro", en: "Pro member" },
    free:            { fr: "Gratuit", en: "Free" },
    logout:          { fr: "Se déconnecter", en: "Log out" },
    createAccountHint: { fr: "Crée un compte pour que ton abonnement Pro soit lié à ton email et accessible sur tous tes appareils.", en: "Create an account so your Pro subscription is linked to your email and accessible on all your devices." },
    createOrLogin:   { fr: "Créer un compte / Se connecter", en: "Create account / Log in" },
    subscriptionTitle: { fr: "MON ABONNEMENT", en: "MY SUBSCRIPTION" },
    proActive:       { fr: "Physiqrate Pro — Actif", en: "Physiqrate Pro — Active" },
    proFeatures:     { fr: "Analyses illimitées · Scans nutrition illimités · Historique complet", en: "Unlimited analyses · Unlimited nutrition scans · Full history" },
    manageSubscription: { fr: "Gérer mon abonnement", en: "Manage my subscription" },
    editCardCancel:  { fr: "Modifier ta carte · Annuler à tout moment", en: "Update your card · Cancel anytime" },
    installTitle:    { fr: "INSTALLER L'APPLICATION", en: "INSTALL THE APP" },
    appInstalled:    { fr: "Application installée", en: "App installed" },
    installHint:     { fr: "Installe Physiqrate sur ton écran d'accueil pour un accès rapide, sans passer par le navigateur.", en: "Install Physiqrate on your home screen for quick access, without going through the browser." },
    onIphoneIpad:    { fr: "SUR IPHONE / IPAD", en: "ON IPHONE / IPAD" },
    openSafari:      { fr: "Ouvrir dans Safari", en: "Open in Safari" },
    followSteps:      { fr: "puis suis ces étapes :", en: "then follow these steps:" },
    stepShare:        { fr: "Appuie sur le bouton Partager en bas de Safari", en: "Tap the Share button at the bottom of Safari" },
    stepHomeScreen:   { fr: "Sélectionne \"Sur l'écran d'accueil\"", en: "Select \"Add to Home Screen\"" },
    stepAdd:          { fr: "Appuie sur \"Ajouter\"", en: "Tap \"Add\"" },
    installAlert:     { fr: "Ouvre le menu de ton navigateur et sélectionne 'Ajouter à l'écran d'accueil'", en: "Open your browser menu and select 'Add to Home Screen'" },
    installBtn:       { fr: "Installer Physiqrate", en: "Install Physiqrate" },
  },
  paywall: {
    title:          { fr: "Analyse ton physique sans limite", en: "Analyze your physique without limits" },
    nextFree:       { fr: "Prochaine analyse gratuite dans {n} jour{s}", en: "Next free analysis in {n} day{s}" },
    continueProgress: { fr: "Continue ta progression", en: "Continue your progress" },
    feat1Title:     { fr: "Analyses corporelles illimitées", en: "Unlimited body analyses" },
    feat1Sub:       { fr: "Scan photo IA chaque semaine", en: "AI photo scan every week" },
    feat2Title:     { fr: "Sans aucune publicité", en: "No ads at all" },
    feat2Sub:       { fr: "Analyses et scans sans interruption", en: "Analyses and scans without interruption" },
    feat3Title:     { fr: "Comparatif photos IA", en: "AI photo comparison" },
    feat3Sub:       { fr: "Vois ton évolution en détail", en: "See your progress in detail" },
    feat4Title:     { fr: "Historique complet", en: "Full history" },
    feat4Sub:       { fr: "Toutes tes données conservées", en: "All your data kept" },
    perMonth:       { fr: "/mois", en: "/month" },
    cancelNoCommit: { fr: "Résiliation à tout moment · Aucun engagement", en: "Cancel anytime · No commitment" },
    redirecting:    { fr: "Redirection…", en: "Redirecting…" },
    startNow:       { fr: "Commencer maintenant", en: "Start now" },
    payWarning:     { fr: "Si tu paies avec {strong}, l'email associé à ton compte sera utilisé pour créer ton compte Physiqrate. Pour utiliser un email différent, paie par carte.", en: "If you pay with {strong}, the email linked to your account will be used to create your Physiqrate account. To use a different email, pay by card." },
    payWarningStrong: { fr: "Apple Pay ou Google Pay", en: "Apple Pay or Google Pay" },
    continueWithoutPro: { fr: "Continuer sans Pro", en: "Continue without Pro" },
  },
  weightModal: {
    newWeightDetected: { fr: "NOUVEAU POIDS DÉTECTÉ", en: "NEW WEIGHT DETECTED" },
    youIndicated:   { fr: "Tu as indiqué", en: "You entered" },
    profileShows:   { fr: "Ton profil indique {w} kg.", en: "Your profile shows {w} kg." },
    willRecalc:     { fr: "Mettre à jour recalculera ton TDEE automatiquement.", en: "Updating will automatically recalculate your TDEE." },
    updateBtn:      { fr: "Mettre à jour ({from} → {to} kg)", en: "Update ({from} → {to} kg)" },
    keepBtn:        { fr: "Garder {w} kg", en: "Keep {w} kg" },
  },
  pwaBanner: {
    installTitle:   { fr: "Installe Physiqrate", en: "Install Physiqrate" },
    tapOn:          { fr: "Appuie sur", en: "Tap" },
    iosHint:        { fr: "pour l'installer", en: "to install it" },
    androidHint:    { fr: "Ajoute l'app sur ton écran d'accueil pour un accès rapide et une meilleure expérience", en: "Add the app to your home screen for quick access and a better experience" },
    share:          { fr: "Partager", en: "Share" },
    homeScreen:     { fr: "Sur l'écran d'accueil", en: "Add to Home Screen" },
    openSafari:     { fr: "Ouvrir dans Safari", en: "Open in Safari" },
    then:           { fr: "puis", en: "then" },
    installApp:     { fr: "Installer l'app", en: "Install app" },
  },
  scanner: {
    defaultProductName: { fr: "Produit scanné", en: "Scanned product" },
    notFound:       { fr: "Produit non trouvé. Essaie un autre.", en: "Product not found. Try another one." },
    networkError:   { fr: "Erreur réseau.", en: "Network error." },
    cameraDenied:   { fr: "Accès caméra refusé.\nVa dans Réglages → Safari → Caméra → Autoriser.", en: "Camera access denied.\nGo to Settings → Safari → Camera → Allow." },
    cameraStartFail:{ fr: "Impossible de démarrer la caméra.", en: "Unable to start the camera." },
    scannerLoadFail:{ fr: "Impossible de charger le scanner.", en: "Unable to load the scanner." },
    loading:        { fr: "Chargement du scanner…", en: "Loading scanner…" },
    placeBarcode:   { fr: "Place le code-barres dans le cadre", en: "Place the barcode in the frame" },
    holdPhone:      { fr: "Tiens le téléphone à 15-20cm", en: "Hold the phone 15-20cm away" },
    productFound:   { fr: "Produit trouvé !", en: "Product found!" },
    retry:          { fr: "Réessayer", en: "Retry" },
    enterManually:  { fr: "Saisir manuellement", en: "Enter manually" },
    cancel:         { fr: "Annuler", en: "Cancel" },
    manualEntryTitle: { fr: "SAISIE MANUELLE", en: "MANUAL ENTRY" },
    enterDigits:    { fr: "Entre les chiffres sous le code-barres", en: "Enter the digits under the barcode" },
    barcodePlaceholder: { fr: "Ex: 3017620422003", en: "E.g. 3017620422003" },
    pressEnter:     { fr: "Appuie sur Entrée pour chercher", en: "Press Enter to search" },
    close:          { fr: "Fermer", en: "Close" },
  },
  ads: {
    label:          { fr: "PUBLICITÉ", en: "ADVERTISEMENT" },
    placeholderNote:{ fr: "Emplacement publicitaire (à connecter à Google Ad Manager)", en: "Ad placeholder (connect to Google Ad Manager)" },
    secondsLeft:    { fr: "{n}s", en: "{n}s" },
    continueBtn:    { fr: "Continuer", en: "Continue" },
    unlockTitle:    { fr: "Débloquer une analyse maintenant", en: "Unlock an analysis now" },
    unlockSub:      { fr: "Regarde une courte pub pour analyser ton physique sans attendre", en: "Watch a short ad to analyze your physique without waiting" },
    watchAdBtn:     { fr: "Regarder une pub (30s)", en: "Watch an ad (30s)" },
    orUpgrade:      { fr: "ou passe Pro pour un accès illimité", en: "or go Pro for unlimited access" },
    scanUnlockNote: { fr: "Une courte pub pour continuer à scanner gratuitement", en: "A short ad to keep scanning for free" },
    adAlreadyUsed:  { fr: "Tu as déjà débloqué ton analyse bonus cette semaine. Reviens la semaine prochaine, ou passe Pro pour un accès illimité.", en: "You've already unlocked your bonus analysis this week. Come back next week, or go Pro for unlimited access." },
  },
};

function detectInitialLang() {
  try {
    const saved = localStorage.getItem("pq_lang");
    if (saved === "fr" || saved === "en") return saved;
  } catch {}
  const nav = ((typeof navigator !== "undefined" && navigator.language) || "fr").toLowerCase();
  return nav.startsWith("fr") ? "fr" : "en";
}

const LangContext = createContext({ lang: "fr", setLang: () => {}, tr: (path) => path, trf: (path) => path });

function LangProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang());
  function setLang(l) {
    setLangState(l);
    try { localStorage.setItem("pq_lang", l); } catch {}
  }
  function tr(path) {
    const parts = path.split(".");
    let node = STRINGS;
    for (const p of parts) {
      node = node?.[p];
      if (node === undefined) return path;
    }
    return node[lang] || node.fr || path;
  }
  function trf(path, vars) {
    let str = tr(path);
    for (const k in vars) str = str.replaceAll(`{${k}}`, vars[k]);
    return str;
  }
  return <LangContext.Provider value={{ lang, setLang, tr, trf }}>{children}</LangContext.Provider>;
}

function useI18n() {
  return useContext(LangContext);
}

// ─── ARCHETYPES ───────────────────────────────────────────────────────────────
const ARCHETYPES = {
  male: [
    { max: 6,   label: "competition",   ref: "peakCompetition",  color: "#FFD700" },
    { max: 10,  label: "eliteAthlete", ref: "eliteUltraLean",   color: "#C0C0FF" },
    { max: 14,  label: "athlete",       ref: "builtAthlete",     color: "#7DF9AA" },
    { max: 18,  label: "fit",           ref: "sculptedFit",      color: "#7DF9FF" },
    { max: 22,  label: "lifestyle",     ref: "activeLifestyle",  color: "#A0C4FF" },
    { max: 27,  label: "casual",        ref: "bearMode",         color: "#FFB347" },
    { max: 35,  label: "bulk",          ref: "offSeasonLifter",  color: "#FF8C69" },
    { max: 100, label: "rebuild",       ref: "transformationMission", color: "#FF6B6B" },
  ],
  female: [
    { max: 14,  label: "competition",   ref: "bikiniAthlete",    color: "#FFD700" },
    { max: 18,  label: "eliteAthlete", ref: "eliteAthleteF",    color: "#C0C0FF" },
    { max: 22,  label: "athlete",       ref: "toneFigure",       color: "#7DF9AA" },
    { max: 26,  label: "fit",           ref: "fitFigure",        color: "#7DF9FF" },
    { max: 30,  label: "lifestyle",     ref: "healthyVibes",     color: "#A0C4FF" },
    { max: 35,  label: "casual",        ref: "potentialToUnlock",color: "#FFB347" },
    { max: 42,  label: "bulk",          ref: "comfortZone",      color: "#FF8C69" },
    { max: 100, label: "rebuild",       ref: "transformationMission", color: "#FF6B6B" },
  ],
};
function getArchetype(bf, gender) {
  const list = ARCHETYPES[gender] || ARCHETYPES.male;
  return list.find(a => bf <= a.max) || list[list.length - 1];
}

// ─── TDEE — MIFFLIN-ST JEOR ──────────────────────────────────────────────────
const ACTIVITY_LEVELS = [
  { key: "sedentary",    label: "Sédentaire — peu ou pas d'exercice",     factor: 1.2   },
  { key: "light",        label: "Légèrement actif — 1 à 3x/sem",          factor: 1.375 },
  { key: "moderate",     label: "Modérément actif — 3 à 5x/sem",          factor: 1.55  },
  { key: "active",       label: "Très actif — 4 à 6x/sem",                factor: 1.725 },
  { key: "extra_active", label: "Extrêmement actif — 2x/jour",            factor: 1.9   },
];
const DAILY_STEPS = [
  { key: "under_3k",   label: "Moins de 3 000 pas/jour",    steps: 2000  },
  { key: "3k_6k",      label: "3 000 à 6 000 pas/jour",     steps: 4500  },
  { key: "6k_10k",     label: "6 000 à 10 000 pas/jour",    steps: 8000  },
  { key: "10k_15k",    label: "10 000 à 15 000 pas/jour",   steps: 12500 },
  { key: "over_15k",   label: "Plus de 15 000 pas/jour",    steps: 17500 },
];

const GOALS = [
  { key: "cut_hard",  label: "Perte de gras agressive (−25%)", factor: -0.25,
    // Protéines élevées pour préserver le muscle en déficit sévère (Helms et al. 2014)
    protein_per_kg: 2.4, fat_per_kg: 0.8 },
  { key: "cut",       label: "Perte de gras (−15%)",           factor: -0.15,
    // Déficit modéré — protéines hautes, lipides minimum hormonal (ISSN)
    protein_per_kg: 2.0, fat_per_kg: 0.9 },
  { key: "maintain",  label: "Maintien (0%)",                  factor: 0,
    // Entretien musculaire standard (Phillips & Van Loon 2011)
    protein_per_kg: 1.8, fat_per_kg: 1.0 },
  { key: "lean_bulk", label: "Prise de muscle (+10%)",         factor: 0.10,
    // Surplus léger — glucides élevés pour la performance et l'anabolisme
    protein_per_kg: 1.8, fat_per_kg: 1.0 },
  { key: "bulk",      label: "Prise de masse (+20%)",          factor: 0.20,
    // Surplus important — protéines modérées, glucides max pour l'énergie
    protein_per_kg: 1.6, fat_per_kg: 1.0 },
];

// Calcul macros cibles basé sur le poids corporel (méthode scientifique)
// 1. Protéines = protein_per_kg × poids (4 kcal/g)
// 2. Lipides = fat_per_kg × poids (9 kcal/g) — minimum hormonal ISSN ≥ 20% cals
// 3. Glucides = calories restantes / 4 kcal/g
function calcTargetMacros(calories, goalKey, weight) {
  if (!calories || !goalKey || !weight) return null;
  const goal = GOALS.find(g => g.key === goalKey);
  if (!goal) return null;
  const w = parseFloat(weight);
  const protein = Math.round(goal.protein_per_kg * w);
  const fat     = Math.round(goal.fat_per_kg * w);
  const proteinCals = protein * 4;
  const fatCals     = fat * 9;
  const remaining   = calories - proteinCals - fatCals;
  const carbs       = Math.max(0, Math.round(remaining / 4));
  return { protein, fat, carbs,
    proteinPct: Math.round(proteinCals / calories * 100),
    fatPct:     Math.round(fatCals / calories * 100),
    carbsPct:   Math.round(remaining / calories * 100),
  };
}
function calcTDEE(gender, age, height, weight, activityKey, stepsKey) {
  if (!gender || !age || !height || !weight) return null;
  const a = parseFloat(age), h = parseFloat(height), w = parseFloat(weight);
  const bmr = gender === "male"
    ? (10 * w) + (6.25 * h) - (5 * a) + 5
    : (10 * w) + (6.25 * h) - (5 * a) - 161;
  const factor = ACTIVITY_LEVELS.find(l => l.key === activityKey)?.factor || 1.55;
  const baseTDEE = bmr * factor;
  // Ajout calories brûlées par les pas (0.045 kcal × poids × pas / 1000)
  const stepsPerDay = DAILY_STEPS.find(s => s.key === stepsKey)?.steps || 0;
  const stepsCals = stepsPerDay > 0 ? Math.round(0.045 * w * stepsPerDay / 1000) : 0;
  return Math.round(baseTDEE + stepsCals);
}
function calcGoal(tdee, goalKey) {
  if (!tdee) return null;
  const factor = GOALS.find(g => g.key === goalKey)?.factor || 0;
  return Math.round(tdee * (1 + factor));
}

// ─── STORAGE HELPERS ─────────────────────────────────────────────────────────
const keys = {
  usage:      "pq_usage",
  nutrition:  "pq_nutrition",
  history:    "pq_history",
  profile:    "pq_profile",
  premium:    "pq_premium",
  journal:    "pq_journal",
  weight:     "pq_last_weight",
};
const get = (k) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function getProfile()  { return get(keys.profile)  || {}; }
function saveProfile(p){ 
  const ts = new Date().toISOString();
  set(keys.profile, p); 
  localStorage.setItem("pq_profile_updated_at", ts);
  syncPush({ profile: { ...p, updated_at: ts } }); 
}
// Fusionne un profil distant (venant du pull Supabase) dans l'objet pq_profile réel.
// Auparavant ce merge écrivait dans des clés séparées (pq_gender, pq_age, ...) que
// getProfile() ne lit jamais — d'où le profil qui ne se mettait jamais à jour après sync.
function applyRemoteProfile(p) {
  if (!p) return;
  const current = getProfile();
  const merged = { ...current };
  if (p.gender) merged.gender = p.gender;
  if (p.age) merged.age = String(p.age);
  if (p.weight) merged.weight = String(p.weight);
  if (p.height) merged.height = String(p.height);
  if (p.goal) merged.goal = p.goal;
  if (p.activity) merged.activity = p.activity;
  if (p.steps) merged.steps = p.steps;
  if (p.training_type) merged.trainingType = p.training_type;
  set(keys.profile, merged);
  localStorage.setItem("pq_profile_updated_at", p.updated_at || new Date().toISOString());
}
function getCustomMacros() { return get("pq_custom_macros") || null; }
function saveCustomMacros(m) { set("pq_custom_macros", m); }
function isPremium()   { const v = localStorage.getItem(keys.premium); return v === true || v === "true"; }
function setPremium(v) { set(keys.premium, v); }

function getScanCount() { return parseInt(localStorage.getItem("pq_scan_count") || "0", 10); }
function incrementScanCount() {
  const n = getScanCount() + 1;
  localStorage.setItem("pq_scan_count", String(n));
  return n;
}

function getUsage()    { return get(keys.usage) || { count: 0, weeklyUsed: null, weeklyAdUsed: null }; }
function saveUsage(u)  { set(keys.usage, u); }
function canAnalyze(u) {
  if (u.count < 2) return { allowed: true };
  if (!u.weeklyUsed) return { allowed: true };
  const days = (Date.now() - new Date(u.weeklyUsed).getTime()) / 86400000;
  if (days >= 7) return { allowed: true };
  // Quota gratuit de la semaine déjà pris — le bonus pub est-il encore disponible cette semaine ?
  const adDays = u.weeklyAdUsed ? (Date.now() - new Date(u.weeklyAdUsed).getTime()) / 86400000 : 999;
  return { allowed: false, daysLeft: Math.ceil(7 - days), adAvailable: adDays >= 7 };
}

function getNutritionUsage() { return get(keys.nutrition) || { lastUsed: null, todayCount: 0 }; }
function canScanNutrition() {
  const u = getNutritionUsage();
  if (!u.lastUsed) return { allowed: true };
  const lastDate = new Date(u.lastUsed).toDateString();
  const today = new Date().toDateString();
  if (lastDate !== today) return { allowed: true };
  if (u.todayCount < 1) return { allowed: true };
  const next = new Date(); next.setHours(24, 0, 0, 0);
  return { allowed: false, hoursLeft: Math.ceil((next - Date.now()) / 3600000) };
}
function recordNutritionScan() {
  const u = getNutritionUsage();
  const today = new Date().toDateString();
  const lastDate = u.lastUsed ? new Date(u.lastUsed).toDateString() : null;
  set(keys.nutrition, { lastUsed: new Date().toISOString(), todayCount: lastDate === today ? u.todayCount + 1 : 1 });
}

function getHistory() { return get(keys.history) || []; }
function getSavedFoods() { return get("pq_saved_foods") || []; }
function getSavedSessions() { return get("pq_saved_sessions") || []; }
function saveSessionToList(session) {
  const list = getSavedSessions();
  const exists = list.find(s => s.type.toLowerCase() === session.type.toLowerCase());
  if (!exists) {
    list.unshift({ type: session.type, duration: session.duration });
    set("pq_saved_sessions", list.slice(0, 20));
    syncPush({ savedSessions: [session] });
  }
}
function removeSavedSession(type) {
  const list = getSavedSessions().filter(s => s.type !== type);
  set("pq_saved_sessions", list);
}
function saveFoodToList(food) {
  const list = getSavedFoods();
  const exists = list.find(f => f.name.toLowerCase() === food.name.toLowerCase());
  if (!exists) {
    list.unshift({ ...food, savedAt: new Date().toISOString() });
    set("pq_saved_foods", list.slice(0, 50));
    syncPush({ savedFoods: [food] });
  }
}
function removeSavedFood(name) {
  const list = getSavedFoods().filter(f => f.name !== name);
  set("pq_saved_foods", list);
}
function addToHistory(entry) {
  const h = getHistory();
  const fullEntry = { ...entry, date: new Date().toISOString() };
  h.unshift(fullEntry);
  set(keys.history, h.slice(0, 50));
  // Sync vers Supabase
  syncPush({ analyses: [{ 
    date: new Date().toISOString().slice(0,10),
    bodyfat: entry.bodyfat,
    weight: entry.weight || null,
    note: entry.note || null,
    confidence: entry.confidence || null
  }] });
}

// Marque/démarque une analyse comme "test" (photo d'essai, ancienne photo, autre personne...)
// pour l'exclure des calculs de tendance/projection sans supprimer la donnée elle-même.
function toggleHistoryExclusion(dateKey) {
  const h = getHistory();
  const updated = h.map(entry => entry.date === dateKey ? { ...entry, excluded: !entry.excluded } : entry);
  set(keys.history, updated);
}

function getTodayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function getTodayJournal() {
  const today = getTodayISO();
  const all = get(keys.journal) || {};
  // Compatibilité avec l'ancien format toDateString
  const oldKey = new Date().toDateString();
  return all[today] || all[oldKey] || { meals: [], steps: null, session: null };
}
function saveTodayJournal(data) {
  const today = getTodayISO();
  const all = get(keys.journal) || {};
  all[today] = data;
  set(keys.journal, all);
}
function getAllJournal() { return get(keys.journal) || {}; }

function getProfileCompletion(p) {
  const fields = ["gender", "age", "height", "weight", "activity", "steps", "trainingType", "goal"];
  return Math.round(fields.filter(f => p[f]).length / fields.length * 100);
}

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:       "#0a0a0f",
  surface:  "rgba(255,255,255,0.04)",
  border:   "rgba(255,255,255,0.08)",
  gold:     "#FFD700",
  green:    "#7DF9AA",
  red:      "#FF6B6B",
  muted:    "#555",
  text:     "#ffffff",
  sub:      "#888",
};

const css = {
  app: { minHeight:"100dvh", background:C.bg, color:C.text, fontFamily:"'Space Grotesk',Arial,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"0 16px 60px", paddingTop:"env(safe-area-inset-top, 0px)", paddingBottom:"calc(env(safe-area-inset-bottom, 0px) + 60px)", WebkitOverflowScrolling:"touch" },
  card: { background:C.surface, border:`1px solid ${C.border}`, borderRadius:"20px", padding:"20px", marginBottom:"12px", width:"100%", boxSizing:"border-box" },
  cardTitle: { fontSize:"10px", letterSpacing:"2px", color:C.muted, textTransform:"uppercase", marginBottom:"14px" },
  input: { width:"100%", padding:"12px 14px", borderRadius:"10px", border:`1.5px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.text, fontSize:"14px", fontFamily:"inherit", outline:"none", boxSizing:"border-box", marginTop:"6px" },
  label: { fontSize:"10px", letterSpacing:"2px", color:C.muted, textTransform:"uppercase", marginTop:"18px", display:"block" },
  btn: (color="#FFD700", textColor="#000") => ({ width:"100%", padding:"14px", borderRadius:"12px", border:"none", background:`linear-gradient(135deg,${color},${color}cc)`, color:textColor, fontSize:"14px", fontWeight:"700", cursor:"pointer", fontFamily:"inherit", boxShadow:`0 0 20px ${color}22`, marginBottom:"8px" }),
  btnSec: { width:"100%", padding:"12px", borderRadius:"12px", border:`1px solid ${C.border}`, background:"rgba(255,255,255,0.04)", color:C.text, fontSize:"13px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit", marginBottom:"8px" },
  optBtn: (active, color=C.gold) => ({ padding:"10px 14px", borderRadius:"8px", border:`1.5px solid ${active ? color : C.border}`, background:active ? `${color}15` : "transparent", color:active ? color : C.muted, fontSize:"12px", fontWeight:"600", cursor:"pointer", fontFamily:"inherit", textAlign:"left" }),
  uploadZone: { border:`2px dashed rgba(255,215,0,0.25)`, borderRadius:"14px", padding:"32px 20px", textAlign:"center", cursor:"pointer", background:"rgba(255,215,0,0.02)", marginBottom:"12px" },
};


// ─── PUBLICITÉ ─────────────────────────────────────────────────────────────────
// Affiche une vraie pub AdSense (client ID branché dans index.html) pendant que
// le minuteur `duration` force l'attente, façon "rewarded ad".
// ⚠️ AD_SLOT_ID est un espace réservé — remplace-le par le vrai numéro une fois
// que tu as créé une unité publicitaire dans ton tableau de bord AdSense
// (Annonces → Par emplacement → Créer une unité publicitaire → copie le data-ad-slot).
// Tant que AD_SLOT_ID vaut "YOUR_AD_SLOT_ID", un visuel de remplacement s'affiche
// à la place pour que l'app reste fonctionnelle en attendant.
const AD_SLOT_ID = "YOUR_AD_SLOT_ID";

function AdPlaceholder({ duration = 15, onComplete }) {
  const { tr, trf } = useI18n();
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const adRef = useRef(null);
  const adPushed = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  useEffect(() => {
    if (AD_SLOT_ID === "YOUR_AD_SLOT_ID" || adPushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adPushed.current = true;
    } catch {}
  }, []);

  return (
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:400,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{fontSize:"9px",letterSpacing:"3px",color:"#555",marginBottom:"20px"}}>{tr("ads.label")}</div>
      {AD_SLOT_ID === "YOUR_AD_SLOT_ID" ? (
        <div style={{width:"100%",maxWidth:"320px",aspectRatio:"16/9",background:"linear-gradient(135deg,#1a1a24,#0f0f1a)",border:`1px solid ${C.border}`,borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"20px",marginBottom:"20px"}}>
          <div style={{fontSize:"12px",color:"#444",lineHeight:"1.6"}}>{tr("ads.placeholderNote")}</div>
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:"320px",minHeight:"180px",marginBottom:"20px",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <ins className="adsbygoogle"
            style={{display:"block",width:"100%"}}
            data-ad-client="ca-pub-2962913569159786"
            data-ad-slot={AD_SLOT_ID}
            data-ad-format="auto"
            data-full-width-responsive="true"
            ref={adRef}/>
        </div>
      )}
      <div style={{width:"180px",height:"4px",background:"rgba(255,255,255,0.1)",borderRadius:"2px",overflow:"hidden",marginBottom:"10px"}}>
        <div style={{height:"100%",width:`${((duration-secondsLeft)/duration)*100}%`,background:C.gold,borderRadius:"2px",transition:"width 1s linear"}}/>
      </div>
      {secondsLeft > 0 ? (
        <div style={{fontSize:"13px",color:"#666"}}>{trf("ads.secondsLeft",{n:secondsLeft})}</div>
      ) : (
        <button style={{...css.btn(C.gold),width:"auto",padding:"12px 32px",marginTop:"6px"}} onClick={onComplete}>
          {tr("ads.continueBtn")}
        </button>
      )}
    </div>
  );
}


function Toast({ message, visible }) {
  return visible ? (
    <div style={{position:"fixed",top:"20px",left:"50%",transform:"translateX(-50%)",background:"rgba(125,249,170,0.95)",color:"#000",padding:"10px 20px",borderRadius:"20px",fontSize:"12px",fontWeight:"700",zIndex:300,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>
      {message}
    </div>
  ) : null;
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{fontSize:"12px",letterSpacing:"4px",color:C.gold,fontWeight:"700"}}>
      PHYSIQRATE
    </div>
  );
}

function GaugeRing({ percent, color }) {
  const r = 70, circ = 2 * Math.PI * r;
  const filled = (Math.min(percent, 50) / 50) * circ;
  return (
    <svg width="170" height="170" viewBox="0 0 180 180">
      <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <circle cx="90" cy="90" r={r} fill="none" stroke="#1a1a2e" strokeWidth="14"/>
      <circle cx="90" cy="90" r={r} fill="none" stroke={color} strokeWidth="14"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 90 90)" filter="url(#glow)"
        style={{transition:"stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      <text x="90" y="84" textAnchor="middle" fill="white" fontSize="28" fontWeight="800" fontFamily="Arial">{percent}%</text>
      <text x="90" y="106" textAnchor="middle" fill={C.muted} fontSize="11" fontFamily="Arial">BODY FAT</text>
    </svg>
  );
}

// Estimation de la masse musculaire (%) à partir du body fat, du poids et de la taille.
// Méthode : masse maigre (poids × (1 − bodyfat/100)), puis fraction de cette masse maigre
// qui correspond typiquement au muscle squelettique (base physiologique ~55% hommes / 45% femmes),
// légèrement ajustée selon la taille (les gabarits plus grands portent proportionnellement
// un peu plus de masse musculaire squelettique). Reste une ESTIMATION, pas une mesure clinique.
function calcMuscleMassPercent(bodyfatPercent, weightKg, heightCm, gender) {
  const w = parseFloat(weightKg), h = parseFloat(heightCm);
  if (!w || !h || !bodyfatPercent) return null;
  const leanFraction = 1 - bodyfatPercent / 100;
  const isFemale = gender === "female";
  const baseMuscleFraction = isFemale ? 0.45 : 0.55;
  const avgHeight = isFemale ? 160 : 172;
  const heightAdj = ((h - avgHeight) / 5) * 0.01;
  const muscleFraction = Math.min(Math.max(baseMuscleFraction + heightAdj, 0.35), 0.65);
  const musclePercent = leanFraction * muscleFraction * 100;
  return Math.round(musclePercent * 10) / 10;
}

function ShareCard({ imagePreview, result, archetype, onReady, weightKg, heightCm, gender }) {
  const ref = useRef();
  const { tr, lang } = useI18n();
  useEffect(() => {
    if (!result || !archetype) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1080, H = 1920; // Format 9:16 — plein écran vidéo TikTok/Reels, sans bandes noires
    canvas.width = W; canvas.height = H;

    const color = archetype.color;
    const r = parseInt(color.slice(1,3),16);
    const g = parseInt(color.slice(3,5),16);
    const b = parseInt(color.slice(5,7),16);

    // Découpe un texte en plusieurs lignes pour tenir dans une largeur donnée
    function wrapText(text, maxWidth, font) {
      ctx.font = font;
      const words = text.split(" ");
      const lines = [];
      let line = "";
      for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = word;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      return lines;
    }

    const draw = (photo) => {
      // ── FOND ──────────────────────────────────────────────────────
      ctx.fillStyle = "#09090f";
      ctx.fillRect(0, 0, W, H);

      const ambient = ctx.createRadialGradient(W/2, H*0.18, 0, W/2, H*0.18, W*0.9);
      ambient.addColorStop(0, `rgba(${r},${g},${b},0.16)`);
      ambient.addColorStop(1, "rgba(9,9,15,0)");
      ctx.fillStyle = ambient;
      ctx.fillRect(0, 0, W, H);

      // ── HEADER : logo + nom ─────────────────────────────────────
      ctx.textAlign = "center";
      ctx.fillStyle = color;
      ctx.font = `bold ${W*0.036}px Arial`;
      ctx.letterSpacing = "6px";
      ctx.fillText("◈ PHYSIQRATE", W/2, 100);

      // ── PHOTO CIRCULAIRE ─────────────────────────────────────────
      const cx = W/2, cy = 300, cr = 190;
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI*2);
      ctx.closePath();
      ctx.clip();
      if (photo) {
        const sc = Math.max((cr*2) / photo.width, (cr*2) / photo.height);
        ctx.drawImage(photo, cx-photo.width*sc/2, cy-photo.height*sc/2, photo.width*sc, photo.height*sc);
      } else {
        ctx.fillStyle = `rgba(${r},${g},${b},0.15)`;
        ctx.fillRect(cx-cr, cy-cr, cr*2, cr*2);
      }
      ctx.restore();
      // Anneau autour de la photo
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI*2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 6;
      ctx.shadowColor = color;
      ctx.shadowBlur = 24;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── CARTE BODY FAT — pleine largeur, en grand ──────────────────
      const padX = 56, gap = 24;
      const fullW = W - padX*2;
      const heroH = 320;
      const gridTop = cy + cr + 70;

      ctx.beginPath();
      ctx.roundRect(padX, gridTop, fullW, heroH, 28);
      ctx.fillStyle = "rgba(255,255,255,0.035)";
      ctx.fill();
      ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = `700 ${W*0.024}px Arial`;
      ctx.letterSpacing = "3px";
      ctx.fillText(tr("shareCard.bodyFatLabel"), W/2, gridTop+56);

      ctx.fillStyle = "white";
      ctx.font = `800 ${W*0.11}px Arial`;
      ctx.letterSpacing = "-1px";
      ctx.fillText(`${result.bodyfat}%`, W/2, gridTop+185);

      ctx.fillStyle = color;
      ctx.font = `700 ${W*0.026}px Arial`;
      ctx.letterSpacing = "1px";
      ctx.fillText(tr("archetype."+archetype.label), W/2, gridTop+228);

      // Barre de progression pleine largeur — plus le body fat est bas, plus la barre est remplie
      // (un faible taux de graisse est "meilleur", donc représenté par une barre pleine)
      const heroBarY = gridTop + heroH - 44;
      const heroBarW = fullW - 72;
      const heroRatio = Math.max(0, Math.min(1 - (result.bodyfat/45), 1));
      ctx.beginPath();
      ctx.roundRect(padX+36, heroBarY, heroBarW, 10, 5);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(padX+36, heroBarY, heroBarW*heroRatio, 10, 5);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 14;
      ctx.fill();
      ctx.shadowBlur = 0;

      // ── RANGÉE 2 : CATÉGORIE + MASSE MUSCULAIRE ────────────────────
      const musclePercent = calcMuscleMassPercent(result.bodyfat, weightKg, heightCm, gender);
      const colW = (W - padX*2 - gap) / 2;
      const rowH = 250;
      const row2Y = gridTop + heroH + gap;

      const cards = [
        { label: tr("shareCard.categoryLabel"), big: tr("archetype."+archetype.label), tag: tr("archetypeRef."+archetype.ref), ratio: 1 },
        musclePercent != null
          ? { label: tr("shareCard.muscleMassLabel"), big: `${musclePercent}%`, tag: tr("shareCard.estimatedTag"), ratio: Math.min(musclePercent/50,1) }
          : { label: tr("shareCard.muscleMassLabel"), big: "—", tag: tr("shareCard.addProfileTag"), ratio: 0 },
      ];

      cards.forEach((card, i) => {
        const x = padX + i * (colW + gap);
        const y = row2Y;

        ctx.beginPath();
        ctx.roundRect(x, y, colW, rowH, 24);
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fill();
        ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.font = `700 ${W*0.021}px Arial`;
        ctx.letterSpacing = "2px";
        const labelLines = wrapText(card.label, colW-56, `700 ${W*0.021}px Arial`);
        ctx.fillText(labelLines[0], x+28, y+42);

        ctx.fillStyle = "white";
        const bigFont = card.big.length > 6 ? W*0.034 : W*0.05;
        ctx.font = `800 ${bigFont}px Arial`;
        ctx.letterSpacing = "0px";
        ctx.fillText(card.big, x+28, y+100);

        if (card.tag) {
          ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
          ctx.font = `${W*0.02}px Arial`;
          const tagLines = wrapText(card.tag, colW-56, `${W*0.02}px Arial`);
          ctx.fillText(tagLines[0], x+28, y+130);
        }

        const barY = y + rowH - 40;
        const barW = colW - 56;
        ctx.beginPath();
        ctx.roundRect(x+28, barY, barW, 8, 4);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x+28, barY, barW*card.ratio, 8, 4);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      const gridBottom = row2Y + rowH;

      // ── PHRASE MOTIVANTE ───────────────────────────────────────────
      let noteBottom = gridBottom + 20;
      if (result.note) {
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        const noteFont = `italic ${W*0.024}px Arial`;
        const noteLines = wrapText(`"${result.note}"`, W*0.8, noteFont);
        ctx.font = noteFont;
        noteLines.slice(0,3).forEach((line,li)=>ctx.fillText(line, W/2, gridBottom + 50 + li*32));
        noteBottom = gridBottom + 50 + noteLines.slice(0,3).length*32;
      }

      // ── BRANDING BAS DE PAGE ────────────────────────────────────────
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = `${W*0.022}px Arial`;
      ctx.letterSpacing = "2px";
      ctx.fillText("physiqrate.com", W/2, noteBottom + 60);

      onReady(canvas.toDataURL("image/png"));
    };

    if (imagePreview) {
      const img = new Image();
      img.onload = () => draw(img);
      img.src = imagePreview;
    } else {
      draw(null);
    }
  }, [result, lang]);
  return <canvas ref={ref} style={{display:"none"}}/>;
}

const STRIPE_KEY = "pk_live_51Tqhv1RvX2XjC4owD0T32u2MRFIPduzrTsnnmM4J5Cy1GUlWzZXWh7YhHPAD2764ptAtR9bvohi0HMvI7tpEMkFE00DF7oM0Ol";

async function redirectToCheckout(type) {
  try {
    const accountEmail = localStorage.getItem("pq_email") || null;
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, accountEmail })
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else alert("Erreur de paiement. Réessaie.");
  } catch {
    alert("Erreur de connexion. Réessaie.");
  }
}

function Paywall({ daysLeft, onClose, onWatchAd, adAvailable }) {
  const { tr, trf } = useI18n();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    await redirectToCheckout("subscription");
    setLoading(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(10px)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",overflowY:"auto"}}>
      <div style={{background:"#0f0f1a",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"24px",padding:"22px 20px",maxWidth:"380px",width:"100%",textAlign:"center",maxHeight:"calc(100vh - 32px)",overflowY:"auto",margin:"auto"}}>

        {/* Header */}
        <div style={{fontSize:"10px",letterSpacing:"3px",color:C.gold,marginBottom:"10px",opacity:0.7}}>PHYSIQRATE PRO</div>
        <div style={{fontSize:"19px",fontWeight:"800",marginBottom:"4px",lineHeight:"1.2"}}>{tr("paywall.title")}</div>
        <div style={{fontSize:"12px",color:"#666",marginBottom:"16px"}}>
          {daysLeft > 0 && adAvailable === false
            ? tr("ads.adAlreadyUsed")
            : daysLeft > 0 ? trf("paywall.nextFree",{n:daysLeft,s:daysLeft>1?"s":""}) : tr("paywall.continueProgress")}
        </div>

        {/* Features list */}
        <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"14px",padding:"12px 14px",marginBottom:"16px",textAlign:"left"}}>
          {[
            [tr("paywall.feat1Title"), tr("paywall.feat1Sub")],
            [tr("paywall.feat2Title"), tr("paywall.feat2Sub")],
            [tr("paywall.feat3Title"), tr("paywall.feat3Sub")],
            [tr("paywall.feat4Title"), tr("paywall.feat4Sub")],
          ].map(([title, sub], i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:i<3?"9px":"0"}}>
              <div style={{width:"18px",height:"18px",borderRadius:"50%",background:"rgba(125,249,170,0.15)",border:"1px solid rgba(125,249,170,0.3)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{fontSize:"12px",fontWeight:"600",color:"white"}}>{title}</div>
                <div style={{fontSize:"10px",color:"#555"}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Price */}
        <div style={{marginBottom:"12px"}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:"4px",marginBottom:"2px"}}>
            <span style={{fontSize:"34px",fontWeight:"800",color:C.gold}}>4,99€</span>
            <span style={{fontSize:"13px",color:"#555"}}>{tr("paywall.perMonth")}</span>
          </div>
          <div style={{fontSize:"10px",color:"#444"}}>{tr("paywall.cancelNoCommit")}</div>
        </div>

        {/* Option : débloquer via pub, si proposée */}
        {onWatchAd && (
          <button onClick={onWatchAd} style={{...css.btnSec,marginBottom:"10px",borderColor:"rgba(255,215,0,0.25)",color:C.gold,fontWeight:"700"}}>
            {tr("ads.watchAdBtn")}
          </button>
        )}

        {/* CTA Button */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{width:"100%",padding:"14px",borderRadius:"14px",border:"none",background:loading?"#333":`linear-gradient(135deg,#FFD700,#FFA500)`,color:loading?"#666":"#000",fontSize:"14px",fontWeight:"800",cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",marginBottom:"10px",transition:"all 0.2s"}}>
          {loading ? tr("paywall.redirecting") : tr("paywall.startNow")}
        </button>

        {/* Avertissement Apple Pay */}
        <div style={{display:"flex",alignItems:"flex-start",gap:"8px",padding:"8px 10px",background:"rgba(255,255,255,0.03)",border:`1px solid rgba(255,255,255,0.08)`,borderRadius:"10px",marginBottom:"10px",textAlign:"left"}}>
          <span style={{fontSize:"13px",flexShrink:0}}>ℹ️</span>
          <div style={{fontSize:"10px",color:"#666",lineHeight:"1.4"}}>
            {tr("paywall.payWarning").split("{strong}")[0]}<strong style={{color:"#aaa"}}>{tr("paywall.payWarningStrong")}</strong>{tr("paywall.payWarning").split("{strong}")[1]}
          </div>
        </div>

        {/* Payment methods */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",marginBottom:"12px"}}>
          {/* Apple Pay */}
          <div style={{display:"flex",alignItems:"center",gap:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"6px",padding:"3px 7px"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#aaa"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
            <span style={{fontSize:"9px",color:"#aaa"}}>Pay</span>
          </div>
          {/* Google Pay */}
          <div style={{display:"flex",alignItems:"center",gap:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"6px",padding:"3px 7px"}}>
            <span style={{fontSize:"9px",color:"#aaa",fontWeight:"600"}}>G</span>
            <span style={{fontSize:"9px",color:"#aaa"}}>Pay</span>
          </div>
          {/* Cards */}
          <div style={{display:"flex",gap:"4px"}}>
            <div style={{width:"22px",height:"14px",borderRadius:"3px",background:"#1a1f71",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:"5px",color:"white",fontWeight:"800"}}>VISA</span>
            </div>
            <div style={{width:"22px",height:"14px",borderRadius:"3px",background:"rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <div style={{display:"flex"}}>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#EB001B",opacity:0.9}}/>
                <div style={{width:"8px",height:"8px",borderRadius:"50%",background:"#F79E1B",opacity:0.9,marginLeft:"-3px"}}/>
              </div>
            </div>
          </div>
          {/* Lock */}
          <div style={{display:"flex",alignItems:"center",gap:"3px"}}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <span style={{fontSize:"9px",color:"#444"}}>SSL</span>
          </div>
        </div>

        <button style={{background:"transparent",border:"none",color:"#333",fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}} onClick={onClose}>
          {tr("paywall.continueWithoutPro")}
        </button>
      </div>
    </div>
  );
}

function WeightUpdateModal({ currentWeight, newWeight, onAccept, onDecline }) {
  const { tr, trf } = useI18n();
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",backdropFilter:"blur(6px)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"linear-gradient(135deg,#0f0f1a,#0a0a0f)",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"24px",width:"100%",maxWidth:"420px",textAlign:"center",marginBottom:"10px"}}>
        <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"12px"}}>{tr("weightModal.newWeightDetected")}</div>
        <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"6px"}}>{tr("weightModal.youIndicated")} <span style={{color:C.gold}}>{newWeight} kg</span></div>
        <div style={{fontSize:"13px",color:C.muted,marginBottom:"6px"}}>{trf("weightModal.profileShows",{w:currentWeight})}</div>
        <div style={{fontSize:"11px",color:"#444",marginBottom:"20px"}}>{tr("weightModal.willRecalc")}</div>
        <button style={css.btn(C.gold)} onClick={onAccept}>{trf("weightModal.updateBtn",{from:currentWeight,to:newWeight})}</button>
        <button style={css.btnSec} onClick={onDecline}>{trf("weightModal.keepBtn",{w:currentWeight})}</button>
      </div>
    </div>
  );
}



// ─── PWA INSTALL BANNER ───────────────────────────────────────────────────────
function PWABanner({ onDismiss }) {
  const { tr } = useI18n();
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

  if (isInStandaloneMode) return null; // Déjà installée

  return (
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:500,padding:"12px 16px 24px",background:"linear-gradient(0deg,#0f0f1a 80%,transparent)",borderTop:`1px solid rgba(255,215,0,0.15)`}}>
      <div style={{maxWidth:"420px",margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"12px",background:"linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.03))",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"16px",padding:"14px"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"3px"}}>{tr("pwaBanner.installTitle")}</div>
            <div style={{fontSize:"11px",color:"#888",marginBottom:"10px",lineHeight:"1.4"}}>
              {isIOS
                ? <>{tr("pwaBanner.tapOn")} <strong style={{color:"#FFD700"}}>{tr("pwaBanner.share")}</strong> {tr("pwaBanner.then")} <strong style={{color:"#FFD700"}}>"{tr("pwaBanner.homeScreen")}"</strong> {tr("pwaBanner.iosHint")}</>
                : <>{tr("pwaBanner.androidHint")}</>
              }
            </div>
            {isIOS ? (
              <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                <a href="x-safari-https://physiqrate.com"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",padding:"9px 14px",borderRadius:"10px",background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#000",fontSize:"12px",fontWeight:"700",textDecoration:"none"}}>
                  {tr("pwaBanner.openSafari")}
                </a>
                <div style={{display:"flex",alignItems:"center",gap:"6px",fontSize:"11px",color:"#555"}}>
                  <span>{tr("pwaBanner.then")}</span>
                  <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"6px",padding:"3px 8px"}}>{tr("pwaBanner.share")}</div>
                  <span>→</span>
                  <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"6px",padding:"3px 8px"}}>"{tr("pwaBanner.homeScreen")}"</div>
                </div>
              </div>
            ) : (
              <button
                onClick={()=>{ window._pwaInstallPrompt?.prompt(); onDismiss(); }}
                style={{padding:"8px 16px",borderRadius:"10px",border:"none",background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#000",fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
                {tr("pwaBanner.installApp")}
              </button>
            )}
          </div>
          <button onClick={onDismiss} style={{background:"transparent",border:"none",color:"#444",fontSize:"20px",cursor:"pointer",lineHeight:1,padding:"0",flexShrink:0}}>×</button>
        </div>
      </div>
    </div>
  );
}



// ─── SUPABASE SYNC ────────────────────────────────────────────────────────────
async function syncPush(data) {
  const token = localStorage.getItem("pq_token");
  const refreshTokenVal = localStorage.getItem("pq_refresh_token");
  if (!token) return;
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "push", token, refreshToken: refreshTokenVal, data })
    });
    if (res.ok) {
      const resData = await res.json().catch(()=>({}));
      // Sauvegarde nouveau token si refresh effectué
      if (resData.newToken) { localStorage.setItem("pq_token", resData.newToken); }
      if (resData.newRefresh) { localStorage.setItem("pq_refresh_token", resData.newRefresh); }
      localStorage.removeItem("pq_sync_queue");
      return;
    }
    throw new Error("sync failed");
  } catch {
    // Echec — met en queue pour retry
    const queue = JSON.parse(localStorage.getItem("pq_sync_queue") || "[]");
    queue.push({ data, ts: Date.now() });
    localStorage.setItem("pq_sync_queue", JSON.stringify(queue.slice(-20)));
  }
}

async function refreshToken() {
  const token = localStorage.getItem("pq_token");
  const email = localStorage.getItem("pq_email");
  const password = localStorage.getItem("pq_password_hash"); // on ne stocke pas le mdp
  if (!token) return null;

  // Tente un refresh via Supabase
  try {
    const refreshToken = localStorage.getItem("pq_refresh_token");
    if (!refreshToken) return token;

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "refresh", refreshToken })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem("pq_token", data.token);
      if (data.refresh_token) localStorage.setItem("pq_refresh_token", data.refresh_token);
      return data.token;
    }
  } catch {}
  return token;
}

async function syncFlushQueue() {
  const token = localStorage.getItem("pq_token");
  const queue = JSON.parse(localStorage.getItem("pq_sync_queue") || "[]");
  if (!token || queue.length === 0) return;
  try {
    for (const item of queue) {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "push", token, data: item.data })
      });
    }
    localStorage.removeItem("pq_sync_queue");
  } catch {}
}

async function syncPull(token, date) {
  const refreshTokenVal = localStorage.getItem("pq_refresh_token");
  try {
    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pull", token, refreshToken: refreshTokenVal, data: { date } })
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.newToken) { localStorage.setItem("pq_token", data.newToken); }
    if (data.newRefresh) { localStorage.setItem("pq_refresh_token", data.newRefresh); }
    return data;
  } catch { return null; }
}

// ─── BARCODE SCANNER ──────────────────────────────────────────────────────────
function BarcodeScanner({ onResult, onClose }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const quaggaRef = useRef(null);

  async function lookupBarcode(code) {
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`);
      const data = await res.json();
      if (data.status === 1 && data.product) {
        const p = data.product;
        const n = p.nutriments || {};
        if (quaggaRef.current) quaggaRef.current.stop();
        onResult({
          name: p.product_name_fr || p.product_name || "Produit scanné",
          brand: p.brands || "",
          calories: Math.round(n["energy-kcal_100g"] || n["energy-kcal"] || 0),
          protein: Math.round(n["proteins_100g"] || 0),
          carbs: Math.round(n["carbohydrates_100g"] || 0),
          fat: Math.round(n["fat_100g"] || 0),
        });
      } else {
        setError("Produit non trouvé. Essaie un autre.");
        setStatus("error");
      }
    } catch {
      setError("Erreur réseau.");
      setStatus("error");
    }
  }

  useEffect(() => {
    // Charge Quagga2 via CDN
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@ericblade/quagga2@1.8.4/dist/quagga.min.js";
    script.onload = () => {
      const Quagga = window.Quagga;
      quaggaRef.current = Quagga;

      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: document.querySelector("#quagga-video"),
          constraints: {
            facingMode: "environment",
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
          },
        },
        locator: { patchSize: "medium", halfSample: true },
        numOfWorkers: 2,
        frequency: 10,
        decoder: {
          readers: ["ean_reader","ean_8_reader","upc_reader","upc_e_reader","code_128_reader"],
        },
        locate: true,
      }, (err) => {
        if (err) {
          if (err.name === "NotAllowedError" || (err.message && err.message.includes("Permission"))) {
            setError("Accès caméra refusé.\nVa dans Réglages → Safari → Caméra → Autoriser.");
          } else {
            setError("Impossible de démarrer la caméra.");
          }
          setStatus("error");
          return;
        }
        Quagga.start();
        setStatus("scanning");
      });

      let lastCode = null;
      let codeCount = 0;

      Quagga.onDetected(async (result) => {
        const code = result.codeResult.code;
        const errors = result.codeResult.decodedCodes
          .filter(x => x.error !== undefined)
          .map(x => x.error);
        const avgError = errors.length ? errors.reduce((a,b) => a+b, 0) / errors.length : 1;

        // Confirme le même code 2 fois pour éviter les faux positifs
        if (avgError < 0.15) {
          if (code === lastCode) {
            codeCount++;
            if (codeCount >= 2) {
              Quagga.stop();
              setStatus("found");
              await lookupBarcode(code);
            }
          } else {
            lastCode = code;
            codeCount = 1;
          }
        }
      });
    };
    script.onerror = () => {
      setError("Impossible de charger le scanner.");
      setStatus("manual");
    };
    document.head.appendChild(script);

    return () => {
      if (quaggaRef.current) {
        try { quaggaRef.current.stop(); } catch {}
      }
    };
  }, []);

  return (
    <div style={{position:"fixed",inset:0,background:"#000",zIndex:300,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>

      {/* Container vidéo Quagga */}
      <div id="quagga-video" style={{
        position:"absolute",inset:0,
        display: status === "scanning" || status === "loading" ? "block" : "none"
      }}/>

      {status === "loading" && (
        <div style={{color:"white",fontSize:"13px",textAlign:"center",zIndex:10}}>
          Chargement du scanner…
        </div>
      )}

      {status === "scanning" && (
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",pointerEvents:"none",zIndex:10}}>
          <div style={{width:"280px",height:"140px",border:`3px solid ${C.gold}`,borderRadius:"12px",boxShadow:`0 0 0 2000px rgba(0,0,0,0.55)`}}/>
          <div style={{color:"white",fontSize:"13px",marginTop:"20px",textShadow:"0 1px 4px #000"}}>
            Place le code-barres dans le cadre
          </div>
          <div style={{color:"#aaa",fontSize:"11px",marginTop:"6px"}}>Tiens le téléphone à 15-20cm</div>
        </div>
      )}

      {status === "found" && (
        <div style={{color:C.green,fontSize:"16px",fontWeight:"700",zIndex:10}}>Produit trouvé !</div>
      )}

      {status === "error" && (
        <div style={{textAlign:"center",padding:"28px",maxWidth:"300px",zIndex:10}}>
          <div style={{fontSize:"13px",color:C.red,marginBottom:"20px",lineHeight:"1.7",whiteSpace:"pre-line"}}>{error}</div>
          <button style={{...css.btn(C.gold),marginBottom:"10px"}} onClick={()=>{ setStatus("loading"); setError(null); }}>
            Réessayer
          </button>
          <button style={{...css.btnSec,marginBottom:"10px"}} onClick={()=>setStatus("manual")}>
            Saisir manuellement
          </button>
          <button style={css.btnSec} onClick={onClose}>Annuler</button>
        </div>
      )}

      {status === "manual" && (
        <div style={{textAlign:"center",padding:"28px",maxWidth:"320px",width:"100%",zIndex:10}}>
          <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"20px"}}>SAISIE MANUELLE</div>
          <div style={{fontSize:"13px",color:"#aaa",marginBottom:"16px"}}>Entre les chiffres sous le code-barres</div>
          <input
            type="number"
            placeholder="Ex: 3017620422003"
            autoFocus
            style={{...css.input,marginBottom:"12px",textAlign:"center",fontSize:"16px",letterSpacing:"1px"}}
            onKeyDown={async(e)=>{
              if(e.key==="Enter" && e.target.value.length >= 8){
                setStatus("found");
                await lookupBarcode(e.target.value.trim());
              }
            }}
          />
          <div style={{fontSize:"11px",color:"#444",marginBottom:"16px"}}>Appuie sur Entrée pour chercher</div>
          <button style={css.btnSec} onClick={onClose}>Annuler</button>
        </div>
      )}

      {(status === "scanning" || status === "loading") && (
        <button style={{position:"absolute",top:"20px",right:"20px",background:"rgba(0,0,0,0.7)",border:`1px solid ${C.border}`,color:"white",borderRadius:"20px",padding:"8px 16px",fontSize:"12px",cursor:"pointer",fontFamily:"inherit",zIndex:20}}
          onClick={()=>{ if(quaggaRef.current) try{quaggaRef.current.stop();}catch{}; onClose(); }}>
          Fermer
        </button>
      )}
    </div>
  );
}


function ProductModal({ product, onConfirm, onClose }) {
  const [quantity, setQuantity] = useState("100");
  const [saveFood, setSaveFood] = useState(!getSavedFoods().find(f => f.name === product.name));

  const q = parseFloat(quantity) || 100;
  const factor = q / 100;
  const cal = Math.round(product.calories * factor);
  const prot = Math.round(product.protein * factor);
  const carb = Math.round(product.carbs * factor);
  const fat2 = Math.round(product.fat * factor);

  const alreadySaved = !!getSavedFoods().find(f => f.name === product.name);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#0f0f1a",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"24px",width:"100%",maxWidth:"420px",marginBottom:"10px"}}>
        <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"12px"}}>
          {product.brand ? "PRODUIT SCANNÉ" : "ALIMENT"}
        </div>
        <div style={{fontSize:"16px",fontWeight:"700",marginBottom:"4px"}}>{product.name}</div>
        {product.brand && <div style={{fontSize:"12px",color:"#555",marginBottom:"12px"}}>{product.brand}</div>}

        <div style={{fontSize:"11px",color:C.muted,marginBottom:"6px"}}>Quantité consommée (g)</div>
        <input
          type="number"
          value={quantity}
          onChange={e=>setQuantity(e.target.value)}
          style={{...css.input,fontSize:"20px",fontWeight:"700",textAlign:"center",marginBottom:"12px"}}
        />

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"14px"}}>
          {[{val:cal,label:"KCAL",color:C.gold},{val:`${prot}g`,label:"PROT.",color:"#7DF9FF"},{val:`${carb}g`,label:"GLUC.",color:"#FFB347"},{val:`${fat2}g`,label:"LIP.",color:"#FF8C69"}].map((m,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"8px",textAlign:"center"}}>
              <div style={{fontSize:"15px",fontWeight:"800",color:m.color}}>{m.val}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{fontSize:"10px",color:"#333",marginBottom:"14px",textAlign:"center"}}>
          Valeurs pour {quantity || 0}g · Base : {product.calories} kcal/100g
        </div>

        {/* Option sauvegarder */}
        {!alreadySaved && (
          <div
            onClick={()=>setSaveFood(!saveFood)}
            style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",marginBottom:"14px",cursor:"pointer",border:`1px solid ${saveFood?"rgba(125,249,170,0.3)":C.border}`}}>
            <div style={{width:"20px",height:"20px",borderRadius:"6px",border:`1.5px solid ${saveFood?C.green:C.border}`,background:saveFood?"rgba(125,249,170,0.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {saveFood && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div>
              <div style={{fontSize:"12px",fontWeight:"600",color:saveFood?C.green:"#aaa"}}>Enregistrer cet aliment</div>
              <div style={{fontSize:"10px",color:"#444"}}>Accessible rapidement la prochaine fois</div>
            </div>
          </div>
        )}

        {alreadySaved && (
          <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"8px 12px",background:"rgba(125,249,170,0.05)",borderRadius:"10px",marginBottom:"14px",border:"1px solid rgba(125,249,170,0.15)"}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{fontSize:"11px",color:C.green}}>Déjà dans tes aliments enregistrés</span>
          </div>
        )}

        <button style={{...css.btn(C.gold),marginBottom:"8px"}} onClick={()=>{
          if (saveFood && !alreadySaved) saveFoodToList({ name:product.name, brand:product.brand, calories:product.calories, protein:product.protein, carbs:product.carbs, fat:product.fat });
          onConfirm({ name:product.name, calories:cal, protein:prot, carbs:carb, fat:fat2 });
        }}>
          Ajouter au journal
        </button>
        <button style={css.btnSec} onClick={onClose}>Annuler</button>
      </div>
    </div>
  );
}



// ─── POST PAYMENT ACCOUNT MODAL ───────────────────────────────────────────────
function PostPaymentModal({ email: initialEmail, onSuccess, blocking = false }) {
  const [email, setEmail] = useState(initialEmail === "unknown" ? "" : initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [accountExists, setAccountExists] = useState(false); // détecté après tentative de création
  const [resetSent, setResetSent] = useState(false);
  const hadPaymentEmail = !!initialEmail && initialEmail !== "unknown";

  async function handleCreate() {
    if (!email) { setError("Entre ton adresse email."); return; }
    if (!password || password.length < 6) { setError("Minimum 6 caractères."); return; }
    if (!accountExists && password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true); setError(null);

    try {
      if (!accountExists) {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "signup", email, password })
        });
        const data = await res.json();
        const alreadyExists = data.error && data.error.toLowerCase().includes("already");
        if (data.error && !alreadyExists) {
          setError(data.error); setLoading(false); return;
        }
        if (alreadyExists) {
          // Un compte existe déjà avec cet email — on ne peut pas deviner son mot de passe.
          // On bascule vers une connexion avec le VRAI mot de passe de ce compte.
          setAccountExists(true);
          setPassword("");
          setConfirmPassword("");
          setError(null);
          setLoading(false);
          return;
        }
      }

      // Connexion — soit compte fraîchement créé, soit compte existant avec son vrai mot de passe
      const loginRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password })
      });
      const loginData = await loginRes.json();

      if (loginData.token) {
        localStorage.setItem("pq_token", loginData.token);
        if (loginData.refresh_token) localStorage.setItem("pq_refresh_token", loginData.refresh_token);
        localStorage.setItem("pq_email", email);
        // Sur nouvel appareil — efface le timestamp profil pour forcer le pull depuis Supabase
        localStorage.removeItem("pq_profile_updated_at");

        // Rattache le Pro (créé sous l'email de paiement Stripe) à ce compte,
        // même si les emails sont identiques — inoffensif dans ce cas, indispensable sinon
        const sessionId = localStorage.getItem("pq_stripe_session");
        if (sessionId) {
          await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "transfer_pro", email, sessionId })
          });
        }

        onSuccess({ email, token: loginData.token });
      } else {
        setError(accountExists ? "Mot de passe incorrect." : "Erreur de connexion. Réessaie.");
      }
    } catch {
      setError("Erreur réseau. Réessaie.");
    }
    setLoading(false);
  }

  async function handleForgotPassword() {
    if (!email) { setError("Entre ton adresse email d'abord."); return; }
    setLoading(true);
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", email })
      });
      setResetSent(true);
    } catch {}
    setLoading(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",backdropFilter:"blur(10px)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#0f0f1a",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"24px",padding:"28px 24px",maxWidth:"380px",width:"100%",textAlign:"center"}}>
        <div style={{fontSize:"28px",marginBottom:"12px"}}>🎉</div>
        <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"12px"}}>PAIEMENT CONFIRMÉ</div>
        <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"8px"}}>Bienvenue dans le Pro !</div>
        <div style={{fontSize:"13px",color:"#555",marginBottom:"24px",lineHeight:"1.6"}}>
          Crée ton compte pour accéder à ton Pro sur tous tes appareils.
        </div>

        {hadPaymentEmail && !accountExists && (
          <div style={{fontSize:"11px",color:"#444",marginBottom:"12px",lineHeight:"1.5"}}>
            Tu as payé avec <strong style={{color:"#aaa"}}>{initialEmail}</strong>. Tu peux utiliser ce même email ci-dessous, ou en choisir un autre pour ton compte — ton accès Pro suivra celui que tu choisis ici.
          </div>
        )}

        {accountExists && (
          <div style={{fontSize:"11px",color:C.gold,marginBottom:"12px",lineHeight:"1.5",background:"rgba(255,215,0,0.06)",border:`1px solid rgba(255,215,0,0.15)`,borderRadius:"10px",padding:"10px 12px"}}>
            Un compte existe déjà avec cet email — connecte-toi avec son mot de passe pour y rattacher ton Pro.
          </div>
        )}

        <span style={css.label}>Email de ton compte</span>
        <input style={css.input} type="email" placeholder="ton@email.com"
          value={email} onChange={e=>{ setEmail(e.target.value); setAccountExists(false); setResetSent(false); }} autoCapitalize="none" disabled={accountExists}/>

        <span style={css.label}>{accountExists ? "Mot de passe de ce compte" : "Choisis un mot de passe"}</span>
        <div style={{position:"relative",marginBottom:"8px"}}>
          <input style={{...css.input,paddingRight:"44px"}} type={showPwd?"text":"password"} placeholder={accountExists ? "Ton mot de passe existant" : "6 caractères minimum"}
            value={password} onChange={e=>setPassword(e.target.value)} autoFocus
            onKeyDown={e=>e.key==="Enter" && accountExists && handleCreate()}/>
          <button type="button" onClick={()=>setShowPwd(!showPwd)}
            style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#555",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"}}>
            {showPwd
              ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        </div>

        {accountExists ? (
          <button type="button" onClick={handleForgotPassword} style={{background:"transparent",border:"none",color:"#555",fontSize:"12px",textDecoration:"underline",cursor:"pointer",fontFamily:"inherit",marginBottom:"8px"}}>
            Mot de passe oublié ?
          </button>
        ) : (
          <>
            <span style={css.label}>Confirme ton mot de passe</span>
            <div style={{position:"relative"}}>
              <input style={{...css.input,paddingRight:"44px",borderColor:confirmPassword && confirmPassword!==password?"rgba(255,80,80,0.5)":undefined}}
                type={showConfirmPwd?"text":"password"} placeholder="Répète ton mot de passe"
                value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleCreate()}/>
              <button type="button" onClick={()=>setShowConfirmPwd(!showConfirmPwd)}
                style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#555",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"}}>
                {showConfirmPwd
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <div style={{fontSize:"11px",color:C.red,marginTop:"4px"}}>Les mots de passe ne correspondent pas</div>
            )}
            {confirmPassword && confirmPassword === password && (
              <div style={{fontSize:"11px",color:C.green,marginTop:"4px"}}>✓ Mots de passe identiques</div>
            )}
          </>
        )}

        {resetSent && <div style={{fontSize:"12px",color:C.green,marginTop:"8px",lineHeight:"1.5"}}>Email de réinitialisation envoyé à {email}.</div>}
        {error && <div style={{fontSize:"12px",color:C.red,marginTop:"8px",lineHeight:"1.5"}}>{error}</div>}

        <button style={{...css.btn(C.gold),marginTop:"18px",opacity:loading?0.6:1}} onClick={handleCreate} disabled={loading}>
          {loading ? "…" : accountExists ? "Se connecter et activer le Pro" : "Créer mon compte Pro"}
        </button>
        <div style={{fontSize:"11px",color:"#333",marginTop:"10px"}}>Accès Pro immédiat sur tous tes appareils</div>
      </div>
    </div>
  );
}

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
function AuthModal({ onSuccess, onClose, blocking = false, onGoToPay }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  async function handleLogin() {
    if (!email || !password) { setError("Email et mot de passe requis."); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password })
      });
      const data = await res.json();

      if (data.error) {
        const msg = data.error.toLowerCase();
        if (msg.includes("invalid") || msg.includes("not found") || msg.includes("credentials") || msg.includes("existe pas")) {
          setError("Ce compte n'existe pas. Crée un compte gratuit ci-dessous.");
        } else {
          setError(data.error);
        }
        setLoading(false); return;
      }

      localStorage.setItem("pq_token", data.token);
      if (data.refresh_token) localStorage.setItem("pq_refresh_token", data.refresh_token);
      localStorage.setItem("pq_email", email);

      const meRes = await fetch("/api/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.token })
      });
      const me = await meRes.json();
      onSuccess({ email, is_pro: me.is_pro, token: data.token });
    } catch {
      setError("Erreur de connexion. Réessaie.");
    }
    setLoading(false);
  }

  async function handleSignup() {
    if (!email || !password) { setError("Email et mot de passe requis."); return; }
    if (password.length < 6) { setError("Mot de passe minimum 6 caractères."); return; }
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    if (!acceptedTerms) { setError("Tu dois accepter les conditions générales d'utilisation."); return; }
    setLoading(true); setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "signup", email, password })
      });
      const data = await res.json();

      if (data.error) {
        const msg = data.error.toLowerCase();
        if (msg.includes("already") || msg.includes("existe")) {
          setError("Un compte existe déjà avec cet email. Connecte-toi plutôt.");
          setMode("login");
        } else {
          setError(data.error);
        }
        setLoading(false); return;
      }

      // Connexion immédiate après création — pas de confirmation email requise
      const loginRes = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password })
      });
      const loginData = await loginRes.json();
      if (loginData.token) {
        localStorage.setItem("pq_token", loginData.token);
        if (loginData.refresh_token) localStorage.setItem("pq_refresh_token", loginData.refresh_token);
        localStorage.setItem("pq_email", email);
        onSuccess({ email, is_pro: false, token: loginData.token });
      } else {
        setError("Compte créé. Connecte-toi maintenant.");
        setMode("login");
      }
    } catch {
      setError("Erreur réseau. Réessaie.");
    }
    setLoading(false);
  }

  function handleSubmit() {
    if (mode === "login") handleLogin(); else handleSignup();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",backdropFilter:"blur(10px)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#0f0f1a",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"28px 24px",maxWidth:"380px",width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"20px"}}>
          <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px"}}>{mode === "login" ? "CONNEXION" : "CRÉER UN COMPTE GRATUIT"}</div>
          {!blocking && <button onClick={onClose} style={{background:"transparent",border:"none",color:"#555",fontSize:"20px",cursor:"pointer"}}>×</button>}
        </div>

        {success ? (
          <div style={{textAlign:"center",padding:"20px"}}>
            <div style={{fontSize:"14px",color:C.green,marginBottom:"16px",lineHeight:"1.6"}}>{success}</div>
            <button style={css.btn(C.gold)} onClick={onClose}>Fermer</button>
          </div>
        ) : (
          <>
            <span style={css.label}>Email</span>
            <input style={css.input} type="email" placeholder="ton@email.com" value={email} onChange={e=>setEmail(e.target.value)} autoCapitalize="none"/>

            <span style={css.label}>Mot de passe</span>
            <div style={{position:"relative", marginBottom: mode==="signup" ? "8px" : "0"}}>
              <input style={{...css.input,paddingRight:"44px"}} type={showPwd?"text":"password"} placeholder="Mot de passe" value={password} onChange={e=>setPassword(e.target.value)}
                onKeyDown={e=>e.key==="Enter" && mode==="login" && handleSubmit()}/>
              <button type="button" onClick={()=>setShowPwd(!showPwd)}
                style={{position:"absolute",right:"12px",top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",color:"#555",cursor:"pointer",padding:"4px",display:"flex",alignItems:"center"}}>
                {showPwd
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>

            {mode === "signup" && (
              <>
                <span style={css.label}>Confirme ton mot de passe</span>
                <input style={css.input} type={showPwd?"text":"password"} placeholder="Répète ton mot de passe"
                  value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleSubmit()}/>

                <div style={{display:"flex",alignItems:"flex-start",gap:"8px",marginTop:"12px",cursor:"pointer"}} onClick={()=>setAcceptedTerms(!acceptedTerms)}>
                  <input type="checkbox" checked={acceptedTerms} onChange={e=>setAcceptedTerms(e.target.checked)}
                    style={{marginTop:"3px",flexShrink:0,cursor:"pointer"}}/>
                  <span style={{fontSize:"11px",color:"#777",lineHeight:"1.5"}}>
                    J'accepte les <a href="/cgu" target="_blank" rel="noopener noreferrer" style={{color:C.gold}} onClick={e=>e.stopPropagation()}>conditions générales d'utilisation</a>
                  </span>
                </div>
              </>
            )}

            {error && <div style={{fontSize:"12px",color:C.red,marginTop:"10px",lineHeight:"1.5"}}>{error}</div>}

            <button style={{...css.btn(C.gold),marginTop:"18px",opacity:loading?0.6:1}} onClick={handleSubmit} disabled={loading}>
              {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
            </button>

            <div style={{textAlign:"center",marginTop:"12px",display:"flex",flexDirection:"column",gap:"8px"}}>
              {mode === "login" ? (
                <button style={{background:"transparent",border:"none",color:"#555",fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}
                  onClick={()=>{ setMode("signup"); setError(null); }}>
                  Pas encore de compte ? Créer un compte gratuit
                </button>
              ) : (
                <button style={{background:"transparent",border:"none",color:"#555",fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}
                  onClick={()=>{ setMode("login"); setError(null); }}>
                  Déjà un compte ? Se connecter
                </button>
              )}
              {mode === "login" && (
                <button style={{background:"transparent",border:"none",color:"#333",fontSize:"11px",cursor:"pointer",fontFamily:"inherit"}}
                  onClick={async()=>{
                    if (!email) { setError("Entre ton email pour recevoir le lien."); return; }
                    setLoading(true); setError(null);
                    try {
                      const res = await fetch("/api/auth", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "reset", email })
                      });
                      const data = await res.json();
                      if (data.error) { setError(data.error); }
                      else { setSuccess("Lien de réinitialisation envoyé. Vérifie ta boîte mail."); }
                    } catch { setError("Erreur réseau."); }
                    setLoading(false);
                  }}>
                  Mot de passe oublié ?
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MACRO EDITOR ─────────────────────────────────────────────────────────────
function MacroEditor({ targets, custom, onSave }) {
  const init = custom || { protein: targets.protein, carbs: targets.carbs, fat: targets.fat };
  const [vals, setVals] = useState({
    protein: String(init.protein),
    carbs:   String(init.carbs),
    fat:     String(init.fat),
  });

  function handleChange(key, raw) {
    setVals(v => ({ ...v, [key]: raw }));
  }

  function handleBlur(key) {
    const num = parseInt(vals[key]);
    if (isNaN(num) || num < 0) {
      // Revert to last valid value
      const fallback = custom?.[key] ?? targets[key];
      setVals(v => ({ ...v, [key]: String(fallback) }));
    } else {
      const current = custom || { protein: targets.protein, carbs: targets.carbs, fat: targets.fat };
      onSave({ ...current, [key]: num });
    }
  }

  const fields = [
    { key: "protein", label: "Protéines (g)", color: "#7DF9FF" },
    { key: "carbs",   label: "Glucides (g)",  color: "#FFB347" },
    { key: "fat",     label: "Lipides (g)",   color: "#FF8C69" },
  ];

  return (
    <div style={{background:"rgba(255,255,255,0.02)",borderRadius:"10px",padding:"12px",border:"1px solid rgba(255,215,0,0.1)"}}>
      <div style={{fontSize:"10px",color:C.gold,letterSpacing:"1px",marginBottom:"10px"}}>MODIFIER MANUELLEMENT</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"8px"}}>
        {fields.map((m,i) => (
          <div key={i}>
            <div style={{fontSize:"9px",color:m.color,marginBottom:"4px"}}>{m.label}</div>
            <input
              type="number"
              value={vals[m.key]}
              onChange={e => handleChange(m.key, e.target.value)}
              onBlur={() => handleBlur(m.key)}
              style={{width:"100%",padding:"8px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:C.text,fontSize:"13px",fontWeight:"700",fontFamily:"inherit",outline:"none",textAlign:"center",boxSizing:"border-box"}}
            />
          </div>
        ))}
      </div>
      <div style={{fontSize:"10px",color:"#444",textAlign:"center"}}>
        Suggestion : {targets.protein}g · {targets.carbs}g · {targets.fat}g — Méthode g/kg
      </div>
    </div>
  );
}

// ─── VIEWS ───────────────────────────────────────────────────────────────────

function ViewAnalyze({ premium }) {
  const { tr, lang } = useI18n();
  const [step, setStep] = useState("upload");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [gender, setGender] = useState(null);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [showPWA, setShowPWA] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPostPayment, setShowPostPayment] = useState(false);
  const [postPaymentEmail, setPostPaymentEmail] = useState(null);
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("pq_email");
    return email ? { email } : null;
  });

  useEffect(() => {
    // Capture install prompt on Android
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window._pwaInstallPrompt = e;
      setShowPWA(true);
    });
    // Show banner after 30s on iOS
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    const dismissed = localStorage.getItem("pq_pwa_dismissed");
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShowPWA(true), 30000);
    }

    // Handle Stripe success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      // Nettoie l'URL
      window.history.replaceState({}, "", window.location.pathname);
      // Récupère l'email Stripe et ouvre la modal de création de compte
      const sessionId = localStorage.getItem("pq_stripe_session");
      if (sessionId) {
        fetch("/api/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        }).then(r => r.json()).then(data => {
          setPostPaymentEmail(data.email || "unknown");
          setShowPostPayment(true);
        }).catch(() => {
          setPostPaymentEmail("unknown");
          setShowPostPayment(true);
        });
      } else {
        setPostPaymentEmail("unknown");
        setShowPostPayment(true);
      }
    }
    
    if (params.get("canceled") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Pull automatique des données si déjà connecté
    const autoSync = async () => {
      const token = localStorage.getItem("pq_token");
      if (!token) return;
      // Vide la queue des données non synchronisées
      await syncFlushQueue();
      const today = new Date().toISOString().slice(0,10);
      try {
        const remote = await syncPull(token, today);
        if (!remote) return;
        let changed = false;
        if (remote.profile) {
          const p = remote.profile;
          const localTs = localStorage.getItem("pq_profile_updated_at");
          const remoteTs = p.updated_at;
          // Supabase est plus récent → écrase le local
          // Si pas de timestamp local → toujours utiliser Supabase
          const useRemote = !localTs || (remoteTs && new Date(remoteTs) > new Date(localTs));
          if (useRemote && (p.gender || p.age || p.weight || p.height)) {
            applyRemoteProfile(p);
            changed = true;
          }
        }
        if (remote.journal) {
          const all = JSON.parse(localStorage.getItem("pq_journal") || "{}");
          const local = all[today] || { meals: [], steps: 0, sessions: [], session: null, water: 0 };
          const localTs = localStorage.getItem(`pq_journal_ts_${today}`);
          const remoteTs = remote.journal.updated_at;
          const useRemote = !localTs || !remote.journal.updated_at || new Date(remoteTs) > new Date(localTs);
          if (useRemote) {
            all[today] = {
              meals: remote.journal.meals?.length >= local.meals?.length ? remote.journal.meals : local.meals || [],
              steps: remote.journal.steps ?? local.steps ?? 0,
              sessions: remote.journal.sessions || local.sessions || [],
              session: remote.journal.session || local.session || null,
              water: remote.journal.water ?? local.water ?? 0
            };
            localStorage.setItem("pq_journal", JSON.stringify(all));
            if (remoteTs) localStorage.setItem(`pq_journal_ts_${today}`, remoteTs);
            changed = true;
          }
        }
        if (remote.analyses?.length > 0) {
          const localHistory = JSON.parse(localStorage.getItem("pq_history") || "[]");
          const merged = [...localHistory];
          for (const a of remote.analyses) {
            const exists = merged.find(h => {
              const hDate = h.date ? h.date.slice(0,10) : "";
              const aDate = a.date ? a.date.slice(0,10) : "";
              return hDate === aDate && h.bodyfat === a.bodyfat;
            });
            if (!exists) {
              merged.push({ date: a.date, bodyfat: a.bodyfat, weight: a.weight, note: a.note, confidence: a.confidence });
              changed = true;
            }
          }
          if (changed) {
            merged.sort((a,b) => (b.date||"").localeCompare(a.date||""));
            localStorage.setItem("pq_history", JSON.stringify(merged.slice(0,100)));
          }
        }
        if (remote.savedFoods?.length > 0) {
          const localFoods = JSON.parse(localStorage.getItem("pq_saved_foods") || "[]");
          const merged = [...localFoods];
          for (const f of remote.savedFoods) {
            if (!merged.find(lf => lf.name?.toLowerCase() === f.name?.toLowerCase())) { 
              merged.push(f); changed = true; 
            }
          }
          if (changed) localStorage.setItem("pq_saved_foods", JSON.stringify(merged.slice(0,50)));
        }
        if (remote.savedSessions?.length > 0) {
          const localSessions = JSON.parse(localStorage.getItem("pq_saved_sessions") || "[]");
          const mergedSessions = [...localSessions];
          for (const s of remote.savedSessions) {
            if (!mergedSessions.find(ls => ls.type === s.type)) { mergedSessions.push(s); changed = true; }
          }
          if (changed) localStorage.setItem("pq_saved_sessions", JSON.stringify(mergedSessions.slice(0,20)));
        }
        // Force re-render APRÈS que toutes les données sont écrites
        if (changed) setSyncVersion(v => v + 1);
      } catch {}
    };
    autoSync();

    // Vérifie le statut Pro via Supabase si connecté
    const verifyPro = async () => {
      const token = localStorage.getItem("pq_token");
      if (!token) {
        // Fallback ancien système session Stripe
        const sessionId = localStorage.getItem("pq_stripe_session");
        if (!sessionId) return;
        try {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          });
          const data = await res.json();
          if (data.active) { setPremium(true); setPremiumState(true); }
        } catch {}
        return;
      }
      try {
        const res = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.email) {
          setUser({ email: data.email });
          localStorage.setItem("pq_email", data.email);
          if (data.is_pro) { setPremium(true); setPremiumState(true); }
          else { setPremium(false); setPremiumState(false); }
        } else if (data.error === "account_not_found") {
          // Compte supprimé — déconnecte
          localStorage.removeItem("pq_token");
          localStorage.removeItem("pq_email");
        }
        // Sinon erreur réseau/panne Supabase — on garde la session locale
      } catch {
        // Panne réseau ou Supabase — on garde l'utilisateur connecté en local
        const cachedEmail = localStorage.getItem("pq_email");
        if (cachedEmail) setUser({ email: cachedEmail });
      }
    };
    verifyPro();
  }, []);
  const [daysLeft, setDaysLeft] = useState(0);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState(null);
  const [showPreAd, setShowPreAd] = useState(false);
  const [showUnlockAd, setShowUnlockAd] = useState(false);
  const [adAvailable, setAdAvailable] = useState(true);
  const fileRef = useRef();

  const profile = getProfile();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 800;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) { if(w>h){h=Math.round(h*MAX/w);w=MAX;}else{w=Math.round(w*MAX/h);h=MAX;} }
        canvas.width=w; canvas.height=h;
        canvas.getContext("2d").drawImage(img,0,0,w,h);
        const dataUrl = canvas.toDataURL("image/jpeg",0.85);
        setImagePreview(dataUrl);
        setImageBase64(dataUrl.split(",")[1]);
        // Pre-fill from profile
        if (profile.gender) setGender(profile.gender);
        if (profile.age) setAge(profile.age);
        setStep("form");
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    setError(null);
    if (!gender) { setError(tr("analyze.selectGender")); return; }

    if (!premium) {
      const usage = getUsage();
      // 2ème analyse (count===1 avant incrément) → pub courte obligatoire de 15s, pas de blocage
      if (usage.count === 1) { setShowPreAd(true); return; }
      const check = canAnalyze(usage);
      // 3ème+ analyse de la semaine déjà utilisée → offre de débloquer via pub (si le bonus hebdo n'a pas déjà été utilisé)
      if (!check.allowed) { setDaysLeft(check.daysLeft); setAdAvailable(check.adAvailable !== false); setShowPaywall(true); return; }
    }

    await runAnalysis(false);
  }

  async function runAnalysis(adWatched) {
    setStep("analyzing");
    try {
      const resolvedAge = age || profile.age || 25;
      const profilePrompt = (() => {
        const parts = [];
        if (profile.activity) parts.push(`Activity: ${ACTIVITY_LEVELS.find(a=>a.key===profile.activity)?.label}`);
        if (profile.trainingType) parts.push(`Training type: ${profile.trainingType}`);
        if (profile.goal) parts.push(`Goal: ${GOALS.find(g=>g.key===profile.goal)?.label}`);
        return parts.length ? `\n\nUser profile:\n${parts.join("\n")}` : "";
      })();

      // Appel API réel
      const apiRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          gender,
          age: resolvedAge,
          weight: weight || profile.weight || null,
          height: profile.height || null,
          profilePrompt,
          isPro: !!premium,
          adWatched: !!adWatched,
          lang
        })
      });

      if (!apiRes.ok) {
        const errData = await apiRes.json().catch(()=>({}));
        if (apiRes.status === 429 && errData.daysLeft) {
          setDaysLeft(errData.daysLeft);
          setAdAvailable(!!errData.adAvailable);
          setShowPaywall(true);
          setStep("form");
          return;
        }
        throw new Error(errData.error || `Erreur ${apiRes.status}`);
      }

      const data = await apiRes.json();

      const archetype = getArchetype(data.bodyfat, gender);
      const entry = { bodyfat: data.bodyfat, gender, age: resolvedAge, weight: parseFloat(weight)||null, archetype };
      addToHistory(entry);

      // Usage tracking
      if (!premium) {
        const usage = getUsage();
        if (adWatched) {
          // Déblocage via pub — ne touche pas au cycle de l'analyse gratuite hebdo, juste au bonus pub
          saveUsage({ ...usage, count: usage.count + 1, weeklyAdUsed: new Date().toISOString() });
        } else {
          const startingWeeklyCycle = usage.count === 1; // 2ème analyse : démarre le cycle hebdo
          const newWeekPassed = usage.weeklyUsed && (Date.now() - new Date(usage.weeklyUsed).getTime()) / 86400000 >= 7;
          saveUsage({
            ...usage,
            count: usage.count + 1,
            weeklyUsed: (startingWeeklyCycle || newWeekPassed) ? new Date().toISOString() : usage.weeklyUsed,
            weeklyAdUsed: newWeekPassed ? null : usage.weeklyAdUsed,
          });
        }
      }

      // Weight update check
      if (weight) {
        set(keys.weight, weight);
        const profileW = parseFloat(profile.weight || 0);
        const analysisW = parseFloat(weight);
        if (profileW && Math.abs(profileW - analysisW) >= 0.5) {
          setNewWeight(analysisW);
          setShowWeightModal(true);
        } else if (!profileW) {
          saveProfile({ ...profile, weight: analysisW });
        }
      }

      setResult({ ...data, archetype });
      setStep("result");
    } catch (err) {
      setError(`${tr("analyze.errorPrefix")}${err.message}`);
      setStep("form");
    }
  }

  function reset() {
    setStep("upload"); setResult(null); setImagePreview(null); setImageBase64(null);
    setGender(null); setAge(""); setWeight(""); setShareUrl(null); setError(null);
  }

  const archetype = result?.archetype;

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      {showPaywall && <Paywall daysLeft={daysLeft} adAvailable={adAvailable} onClose={()=>setShowPaywall(false)} onWatchAd={(daysLeft>0 && adAvailable) ? ()=>{ setShowPaywall(false); setShowUnlockAd(true); } : null}/>}
      {showPreAd && (
        <AdPlaceholder duration={15} onComplete={()=>{ setShowPreAd(false); runAnalysis(false); }}/>
      )}
      {showUnlockAd && (
        <AdPlaceholder duration={30} onComplete={()=>{ setShowUnlockAd(false); runAnalysis(true); }}/>
      )}
      {showWeightModal && newWeight && (
        <WeightUpdateModal
          currentWeight={parseFloat(profile.weight)}
          newWeight={newWeight}
          onAccept={()=>{ saveProfile({...getProfile(),weight:newWeight}); setShowWeightModal(false); }}
          onDecline={()=>setShowWeightModal(false)}
        />
      )}

      {step === "upload" && (
        <>
          {/* Header compact */}
          <div style={{textAlign:"center",marginBottom:"16px",paddingTop:"4px"}}>
            <div style={{fontSize:"9px",letterSpacing:"4px",color:C.gold,marginBottom:"8px",opacity:0.8}}>{tr("analyze.eyebrow")}</div>
            <h1 style={{fontSize:"22px",fontWeight:"800",background:"linear-gradient(135deg,#fff,#aaa)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:"4px"}}>{tr("analyze.title")}</h1>
            <p style={{fontSize:"11px",color:C.muted}}>{tr("analyze.subtitle")}</p>
          </div>

          {/* Rappel analyse disponible */}
          {(() => {
            const usage = getUsage();
            if (usage.count >= 2 && usage.weeklyUsed) {
              const days = (Date.now() - new Date(usage.weeklyUsed).getTime()) / 86400000;
              if (days >= 7) return (
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(125,249,170,0.08)",border:`1px solid rgba(125,249,170,0.2)`,borderRadius:"12px",marginBottom:"8px"}}>
                  <span style={{fontSize:"12px",color:"#aaa"}}>{tr("analyze.weeklyReady")}</span>
                  <span style={{fontSize:"11px",color:C.green,fontWeight:"600"}}>{tr("analyze.go")}</span>
                </div>
              );
            }
            return null;
          })()}

          {/* Rappel profil incomplet */}
          {getProfileCompletion(profile) < 100 && (
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:`rgba(255,215,0,0.06)`,border:`1px solid rgba(255,215,0,0.1)`,borderRadius:"12px",marginBottom:"8px",cursor:"pointer"}} onClick={()=>document.dispatchEvent(new CustomEvent("navigate",{detail:"profil"}))}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <div style={{width:"6px",height:"6px",borderRadius:"50%",background:C.red,flexShrink:0}}/>
                <span style={{fontSize:"12px",color:"#aaa"}}>{tr("analyze.completeProfile")}</span>
              </div>
              <span style={{fontSize:"11px",color:C.gold,fontWeight:"600"}}>{tr("analyze.profileArrow")}</span>
            </div>
          )}

          {/* Zone upload grande et cliquable */}
          <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
          <div
            onClick={()=>fileRef.current.click()}
            style={{
              border:`2px dashed rgba(255,215,0,0.3)`,
              borderRadius:"20px",
              padding:"32px 20px",
              textAlign:"center",
              cursor:"pointer",
              background:"rgba(255,215,0,0.03)",
              marginBottom:"12px",
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              gap:"10px",
              minHeight:"180px",
              justifyContent:"center",
            }}>
            <div style={{width:"56px",height:"56px",borderRadius:"50%",background:"rgba(255,215,0,0.1)",border:`1.5px solid rgba(255,215,0,0.3)`,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div>
              <div style={{fontSize:"15px",fontWeight:"700",marginBottom:"3px"}}>{tr("analyze.uploadTitle")}</div>
              <div style={{fontSize:"12px",color:C.muted}}>{tr("analyze.uploadSubtitle")}</div>
            </div>
          </div>

          {/* Conseils d'utilisation — texte clair, sans emoji */}
          <div style={{...css.card, marginTop:"0"}}>
            <div style={css.cardTitle}>{tr("analyze.tipsTitle")}</div>
            <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
              {[
                tr("analyze.tip1"),
                tr("analyze.tip2"),
                tr("analyze.tip3"),
              ].map((t,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"10px"}}>
                  <div style={{width:"20px",height:"20px",borderRadius:"6px",background:"rgba(255,215,0,0.1)",border:`1px solid rgba(255,215,0,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"10px",fontWeight:"700",color:C.gold}}>
                    {i+1}
                  </div>
                  <span style={{fontSize:"13px",color:"#999"}}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {step === "form" && (
        <div style={css.card}>
          {imagePreview && (
            <div style={{borderRadius:"12px",overflow:"hidden",marginBottom:"16px",maxHeight:"200px",background:"#111"}}>
              <img src={imagePreview} alt="" style={{width:"100%",objectFit:"cover",maxHeight:"200px"}}/>
            </div>
          )}
          <span style={css.label}>{tr("analyze.genre")}</span>
          <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
            <button style={{...css.optBtn(gender==="male"),flex:1,textAlign:"center"}} onClick={()=>setGender("male")}>{tr("analyze.homme")}</button>
            <button style={{...css.optBtn(gender==="female"),flex:1,textAlign:"center"}} onClick={()=>setGender("female")}>{tr("analyze.femme")}</button>
          </div>
          <span style={css.label}>{tr("analyze.ageLabel")}</span>
          <input style={css.input} type="text" inputMode="numeric" placeholder={tr("analyze.agePlaceholder")} maxLength={3}
            value={age}
            onChange={e=>{ const raw=e.target.value.replace(/[^0-9]/g,"").slice(0,3); const v=parseInt(raw)||""; setAge(v>100?"100":raw); }}/>
          <span style={css.label}>{tr("analyze.weightLabel")}</span>
          <input style={css.input} type="text" inputMode="decimal" placeholder={tr("analyze.weightPlaceholder")} maxLength={5}
            value={weight}
            onChange={e=>{ const raw=e.target.value.replace(/[^0-9.]/g,"").slice(0,5); const v=parseFloat(raw)||""; setWeight(v>300?"300":raw); }}/>
          {error && <div style={{marginTop:"10px",color:C.red,fontSize:"12px",textAlign:"center"}}>{error}</div>}
          <div style={{marginTop:"16px"}}>
            <button style={{...css.btn(C.gold),opacity:!gender?0.4:1,cursor:!gender?"not-allowed":"pointer"}} onClick={analyze} disabled={!gender}>{tr("analyze.analyzeBtn")}</button>
            <button style={css.btnSec} onClick={()=>setStep("upload")}>{tr("analyze.changePhoto")}</button>
          </div>
        </div>
      )}

      {step === "analyzing" && (
        <div style={{...css.card,textAlign:"center"}}>
          <div style={{fontSize:"17px",fontWeight:"700",marginBottom:"8px"}}>{tr("analyze.analyzing")}</div>
          <div style={{fontSize:"12px",color:C.muted,marginBottom:"20px"}}>{tr("analyze.analyzingSub")}</div>
          {[tr("analyze.step1"),tr("analyze.step2"),tr("analyze.step3")].map((t,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 14px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",marginBottom:"6px"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:C.gold,boxShadow:`0 0 8px ${C.gold}`}}/>
              <span style={{fontSize:"12px",color:"#777"}}>{t}</span>
            </div>
          ))}
        </div>
      )}

      {step === "result" && result && archetype && (
        <>
          <ShareCard imagePreview={imagePreview} result={result} archetype={archetype} onReady={setShareUrl}
            weightKg={weight || profile.weight} heightCm={profile.height} gender={gender}/>

          <div style={{...css.card,textAlign:"center"}}>
            <div style={{display:"inline-block",padding:"5px 14px",borderRadius:"20px",border:`1px solid ${archetype.color}33`,background:`${archetype.color}11`,color:archetype.color,fontSize:"11px",fontWeight:"700",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px"}}>{tr("archetype."+archetype.label)}</div>
            <div style={{fontSize:"17px",fontWeight:"800",color:archetype.color,marginBottom:"16px"}}>{tr("archetypeRef."+archetype.ref)}</div>
            <div style={{display:"flex",justifyContent:"center",marginBottom:"8px"}}>
              <GaugeRing percent={result.bodyfat} color={archetype.color}/>
            </div>
            <div style={{fontSize:"12px",color:C.sub,marginBottom:"12px",fontStyle:"italic"}}>"{archetype.desc || tr("analyze.defaultDesc")}"</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"6px",fontSize:"11px",color:"#444"}}>
              <div style={{width:"6px",height:"6px",borderRadius:"50%",background:result.confidence==="high"?C.green:result.confidence==="medium"?C.gold:C.red}}/>
              {result.confidence_reason}
            </div>
          </div>

          {result.key_indicators?.length > 0 && (
            <div style={css.card}>
              <div style={css.cardTitle}>{tr("analyze.indicatorsTitle")}</div>
              {result.key_indicators.map((ind,i)=>(
                <div key={i} style={{display:"flex",gap:"10px",marginBottom:"8px"}}>
                  <span style={{color:archetype.color,fontSize:"12px",marginTop:"1px"}}>◆</span>
                  <span style={{fontSize:"12px",color:"#bbb",lineHeight:"1.5"}}>{ind}</span>
                </div>
              ))}
            </div>
          )}

          {result.note && (
            <div style={{...css.card,background:`linear-gradient(135deg,${archetype.color}08,transparent)`,borderColor:`${archetype.color}18`,textAlign:"center"}}>
              <div style={{fontSize:"13px",color:"#ccc",fontStyle:"italic"}}>{result.note}</div>
            </div>
          )}

          {/* Message personnalisé selon le score */}
          {(() => {
            const bf = result.bodyfat;
            let msg = null;
            if (bf <= 10)      msg = { text:tr("analyze.msgTop2"), color:C.gold };
            else if (bf <= 14) msg = { text:tr("analyze.msgElite"), color:C.green };
            else if (bf <= 18) msg = { text:tr("analyze.msgAthletic"), color:C.green };
            else if (bf <= 22) msg = { text:tr("analyze.msgGoodBase"), color:"#7DF9FF" };
            else if (bf <= 27) msg = { text:tr("analyze.msgPotential"), color:"#FFB347" };
            else               msg = { text:tr("analyze.msgStart"), color:"#FF8C69" };
            return (
              <div style={{...css.card,background:`linear-gradient(135deg,${msg.color}08,transparent)`,borderColor:`${msg.color}18`}}>
                <div style={{fontSize:"10px",color:msg.color,letterSpacing:"2px",marginBottom:"8px"}}>{tr("analyze.personalizedTitle")}</div>
                <div style={{fontSize:"13px",color:"#ccc",lineHeight:"1.6"}}>{msg.text}</div>
              </div>
            );
          })()}

          {/* Install nudge — after result, peak engagement moment */}
          {(() => {
            const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
            if (isStandalone) return null;
            const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
            return (
              <div style={{...css.card,background:"linear-gradient(135deg,rgba(255,215,0,0.06),transparent)",borderColor:"rgba(255,215,0,0.2)"}}>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:"700",marginBottom:"3px"}}>{tr("analyze.installNudgeTitle")}</div>
                    <div style={{fontSize:"11px",color:"#666"}}>{tr("analyze.installNudgeSub")}</div>
                  </div>
                </div>
                <div style={{marginTop:"12px"}}>
                  {isIOS ? (
                    <a href="x-safari-https://physiqrate.com"
                      style={{display:"block",textAlign:"center",padding:"12px",borderRadius:"10px",background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#000",fontSize:"13px",fontWeight:"700",textDecoration:"none"}}>
                      {tr("analyze.openSafari")}
                    </a>
                  ) : (
                    <button onClick={()=>window._pwaInstallPrompt?.prompt()}
                      style={{...css.btn(C.gold),marginBottom:0}}>
                      {tr("analyze.addHomeScreen")}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}

          <div style={css.card}>
            <div style={css.cardTitle}>{tr("analyze.shareCardTitle")}</div>
            {shareUrl ? (
              <>
                <div style={{borderRadius:"12px",overflow:"hidden",marginBottom:"12px",border:`1px solid ${archetype.color}18`}}>
                  <img src={shareUrl} alt="carte" style={{width:"100%",display:"block"}}/>
                </div>
                <button style={css.btn(archetype.color)} onClick={async()=>{
                  const text=tr("analyze.shareText").replace("{bf}",result.bodyfat).replace("{ref}",tr("archetypeRef."+archetype.ref));
                  if(navigator.share){try{const blob=await(await fetch(shareUrl)).blob();const file=new File([blob],"physiqrate.png",{type:"image/png"});if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],text});return;}}catch{}}
                  const a=document.createElement("a");a.href=shareUrl;a.download="physiqrate.png";a.click();
                }}>{tr("analyze.shareBtn")}</button>
              </>
            ) : <div style={{textAlign:"center",padding:"16px",color:C.muted,fontSize:"12px"}}>{tr("analyze.generating")}</div>}
            <button style={css.btnSec} onClick={reset}>{tr("analyze.newAnalysis")}</button>
          <button style={{...css.btnSec,color:C.gold,borderColor:"rgba(255,215,0,0.2)"}} onClick={()=>document.dispatchEvent(new CustomEvent("navigate",{detail:"progression"}))}>
            {tr("analyze.seeProgress")}
          </button>
          </div>
        </>
      )}
    </div>
  );
}

function ViewJour({ premium }) {
  const { tr, trf, lang } = useI18n();
  const [journal, setJournal] = useState(getTodayJournal());
  const [showMealForm, setShowMealForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showSavedFoods, setShowSavedFoods] = useState(false);
  const [showSavedSessions, setShowSavedSessions] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [pendingProduct, setPendingProduct] = useState(null);
  const [showScanAd, setShowScanAd] = useState(false);
  const [mealForm, setMealForm] = useState({ name:"", calories:"", protein:"", carbs:"", fat:"" });
  const [sessionForm, setSessionForm] = useState({ type:"", duration:"60" });
  const [toast, setToast] = useState({ visible:false, message:"" });

  function showToast(msg) {
    setToast({ visible:true, message:msg });
    setTimeout(()=>setToast({ visible:false, message:"" }), 2000);
  }

  const tdee = (() => {
    const p = getProfile();
    const w = parseFloat(get(keys.weight) || p.weight || 0);
    return calcTDEE(p.gender, p.age, p.height, w, p.activity, p.steps);
  })();
  const goalCals = calcGoal(tdee, getProfile().goal);
  const totalCals = journal.meals.reduce((s, m) => s + (m.calories || 0), 0);
  const remaining = goalCals ? goalCals - totalCals : null;
  const progress = goalCals ? Math.min(100, Math.round(totalCals / goalCals * 100)) : 0;

  function save(data) {
    setJournal(data);
    saveTodayJournal(data);
    const today = getTodayISO();
    const ts = new Date().toISOString();
    localStorage.setItem(`pq_journal_ts_${today}`, ts);
    syncPush({ journal: {
      date: today,
      meals: data.meals || [],
      steps: data.steps || 0,
      sessions: data.sessions || [],
      session: data.session || null,
      water: data.water || 0,
      updated_at: ts
    }});
  }

  const macros = journal.meals.reduce((acc, m) => ({
    protein: acc.protein + (m.protein||0),
    carbs: acc.carbs + (m.carbs||0),
    fat: acc.fat + (m.fat||0),
  }), { protein:0, carbs:0, fat:0 });

  const [saveMeal, setSaveMeal] = useState(false);

  function addMeal() {
    if (!mealForm.name || !mealForm.calories) return;
    const now = new Date().toLocaleTimeString(lang==="fr"?"fr-FR":"en-US",{hour:"2-digit",minute:"2-digit"});
    const meal = { name:mealForm.name, calories:parseInt(mealForm.calories)||0, protein:parseInt(mealForm.protein)||0, carbs:parseInt(mealForm.carbs)||0, fat:parseInt(mealForm.fat)||0, time:now, detail:"Ajout manuel" };
    save({ ...journal, meals: [...journal.meals, meal] });
    if (saveMeal) saveFoodToList({ name:mealForm.name, brand:"", calories:parseInt(mealForm.calories)||0, protein:parseInt(mealForm.protein)||0, carbs:parseInt(mealForm.carbs)||0, fat:parseInt(mealForm.fat)||0 });
    setMealForm({ name:"", calories:"", protein:"", carbs:"", fat:"" });
    setSaveMeal(false);
    setShowMealForm(false);
    showToast(trf("jour.mealAdded",{name:mealForm.name,cal:mealForm.calories}));
  }

  const [saveSession, setSaveSession] = useState(false);

  function addSession() {
    if (!sessionForm.type) return;
    save({ ...journal, session:{ type:sessionForm.type, duration:parseInt(sessionForm.duration)||60, done:true } });
    if (saveSession) saveSessionToList({ type:sessionForm.type, duration:parseInt(sessionForm.duration)||60 });
    setSessionForm({ type:"", duration:"60" });
    setSaveSession(false);
    setShowSessionForm(false);
    showToast(trf("jour.sessionAdded",{type:sessionForm.type}));
  }

  const formStyle = { background:"rgba(255,215,0,0.04)", border:`1px solid rgba(255,215,0,0.15)`, borderRadius:"14px", padding:"16px", marginBottom:"10px" };
  const formInput = { ...css.input, marginTop:"0", marginBottom:"8px" };
  const formRow = { display:"flex", gap:"8px", marginBottom:"8px" };

  const profile = getProfile();
  const profileComplete = getProfileCompletion(profile) >= 60;

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      <Toast message={toast.message} visible={toast.visible}/>

      {showScanner && (
        <BarcodeScanner
          onResult={(product) => {
            setShowScanner(false);
            if (!premium) {
              const n = incrementScanCount();
              // 1 pub toutes les 2 scans pour les utilisateurs gratuits
              if (n % 3 === 0) { setPendingProduct(product); setShowScanAd(true); return; }
            }
            setScannedProduct(product);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showScanAd && (
        <AdPlaceholder duration={15} onComplete={()=>{ setShowScanAd(false); setScannedProduct(pendingProduct); setPendingProduct(null); }}/>
      )}

      {scannedProduct && (
        <ProductModal
          product={scannedProduct}
          onConfirm={(meal) => {
            const now = new Date().toLocaleTimeString(lang==="fr"?"fr-FR":"en-US",{hour:"2-digit",minute:"2-digit"});
            const updated = { ...journal, meals: [...journal.meals, {...meal, time:now, detail:"Code-barres"}] };
            save(updated);
            showToast(trf("jour.mealAdded",{name:meal.name,cal:meal.calories}));
            setScannedProduct(null);
          }}
          onClose={() => setScannedProduct(null)}
        />
      )}

      {/* Invitation profil si incomplet */}
      {!profileComplete && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"rgba(255,215,0,0.06)",border:`1px solid rgba(255,215,0,0.15)`,borderRadius:"12px",marginBottom:"10px",cursor:"pointer"}} onClick={()=>document.dispatchEvent(new CustomEvent("navigate",{detail:"profil"}))}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{width:"7px",height:"7px",borderRadius:"50%",background:C.red,flexShrink:0}}/>
            <span style={{fontSize:"12px",color:"#aaa"}}>{tr("jour.completeProfileCal")}</span>
          </div>
          <span style={{fontSize:"11px",color:C.gold,fontWeight:"600"}}>{tr("common.profileArrow")}</span>
        </div>
      )}

      {/* Objectif */}
      {tdee && (
        <div style={{background:`linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))`,border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"16px",padding:"16px",marginBottom:"12px"}}>
          <div style={css.cardTitle}>{tr("jour.goalTitle")}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"}}>
            {[{val:tdee.toLocaleString(),label:tr("jour.maintenance")},{val:(goalCals||tdee).toLocaleString(),label:tr("jour.goal"),color:C.green},{val:totalCals.toLocaleString(),label:tr("jour.consumed")}].map((item,i)=>(
              <div key={i} style={{textAlign:"center"}}>
                <div style={{fontSize:"18px",fontWeight:"800",color:item.color||C.gold}}>{item.val}</div>
                <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{item.label}</div>
              </div>
            ))}
          </div>
          <div style={{height:"5px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${C.green},${C.gold})`,borderRadius:"3px",transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"6px"}}>
            <span style={{fontSize:"10px",color:C.muted}}>{totalCals} kcal</span>
            {remaining !== null && <span style={{fontSize:"10px",color:remaining>=0?C.green:C.red}}>{remaining>=0?trf("jour.remaining",{n:remaining}):trf("jour.exceeded",{n:Math.abs(remaining)})}</span>}
          </div>
        </div>
      )}

      {/* Macros + Repas */}
      <div style={css.card}>
        <div style={css.cardTitle}>{tr("jour.macrosTitle")}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"16px"}}>
          {[{val:`${macros.protein}g`,label:tr("jour.protShort"),color:"#7DF9FF"},{val:`${macros.carbs}g`,label:tr("jour.carbShort"),color:"#FFB347"},{val:`${macros.fat}g`,label:tr("jour.fatShort"),color:"#FF8C69"},{val:totalCals,label:tr("jour.kcal"),color:C.gold}].map((m,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"12px",padding:"10px 6px",textAlign:"center"}}>
              <div style={{fontSize:"16px",fontWeight:"800",color:m.color}}>{m.val}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"2px",letterSpacing:"1px"}}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Objectifs macros — utilise les macros personnalisées si définies */}
        {(() => {
          const p = getProfile();
          const w = parseFloat(get(keys.weight) || p.weight || 0);
          const tdeeLocal = calcTDEE(p.gender, p.age, p.height, w, p.activity, p.steps);
          const goalCalsLocal = calcGoal(tdeeLocal, p.goal);
          const autoTargets = calcTargetMacros(goalCalsLocal, p.goal, w);
          const custom = getCustomMacros();
          const targets = custom || autoTargets;
          if (!targets) return null;
          return (
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:"12px",padding:"12px",marginBottom:"16px",border:`1px solid ${C.border}`}}>
              <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",marginBottom:"10px"}}>{tr("jour.macroGoalsTitle")}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                {[
                  {label:tr("jour.protein"),consumed:macros.protein,target:targets.protein,color:"#7DF9FF",pct:targets.proteinPct},
                  {label:tr("jour.carbs"), consumed:macros.carbs,  target:targets.carbs,  color:"#FFB347",pct:targets.carbsPct},
                  {label:tr("jour.fat"),  consumed:macros.fat,    target:targets.fat,    color:"#FF8C69",pct:targets.fatPct},
                ].map((m,i)=>{
                  const progress = Math.min(100, Math.round(m.consumed / m.target * 100));
                  const over = m.consumed > m.target;
                  return (
                    <div key={i} style={{textAlign:"center"}}>
                      <div style={{fontSize:"11px",fontWeight:"700",color:over?C.red:m.color}}>{m.consumed}<span style={{fontSize:"9px",color:C.muted,fontWeight:"400"}}>/{m.target}g</span></div>
                      <div style={{height:"4px",background:"rgba(255,255,255,0.06)",borderRadius:"2px",margin:"4px 0",overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${progress}%`,background:over?C.red:m.color,borderRadius:"2px",transition:"width 0.5s"}}/>
                      </div>
                      <div style={{fontSize:"9px",color:C.muted}}>{m.label} · {m.pct}%</div>
                    </div>
                  );
                })}
              </div>
              <div style={{fontSize:"10px",color:"#333",marginTop:"8px",textAlign:"center"}}>{trf("jour.basedOn",{p:targets.protein,f:targets.fat,c:targets.carbs})}</div>
            </div>
          );
        })()}

        <div style={css.cardTitle}>{tr("jour.mealsTitle")}</div>
        {journal.meals.length === 0 && !showMealForm && (
          <div style={{fontSize:"12px",color:"#444",textAlign:"center",padding:"12px 0"}}>{tr("jour.noMealToday")}</div>
        )}
        {journal.meals.map((meal,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",marginBottom:"6px"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:"13px",fontWeight:"600"}}>{meal.name}</div>
              <div style={{fontSize:"10px",color:C.muted}}>{meal.time} · P:{meal.protein}g G:{meal.carbs}g L:{meal.fat}g</div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <div style={{fontSize:"13px",color:C.gold,fontWeight:"700"}}>{meal.calories} kcal</div>
              <button onClick={()=>{
                const updated = {...journal, meals: journal.meals.filter((_,idx)=>idx!==i)};
                save(updated);
                showToast(tr("jour.mealDeleted"));
              }} style={{background:"transparent",border:"none",color:"#444",fontSize:"16px",cursor:"pointer",padding:"4px",lineHeight:1}}>×</button>
            </div>
          </div>
        ))}

        {/* Modal aliments enregistrés */}
        {showSavedFoods && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px"}}>
            <div style={{background:"#0f0f1a",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"24px",width:"100%",maxWidth:"420px",marginBottom:"10px",maxHeight:"70vh",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px"}}>{tr("jour.myFoodsTitle")}</div>
                <button onClick={()=>setShowSavedFoods(false)} style={{background:"transparent",border:"none",color:"#555",fontSize:"20px",cursor:"pointer"}}>×</button>
              </div>
              {getSavedFoods().length === 0 ? (
                <div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:"12px"}}>
                  <div>{tr("jour.noFoodSaved")}</div>
                  <div style={{marginTop:"4px"}}>{tr("jour.scanHint")}</div>
                </div>
              ) : getSavedFoods().map((food,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:"12px",marginBottom:"8px"}}>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>{setShowSavedFoods(false);setScannedProduct(food);}}>
                    <div style={{fontSize:"13px",fontWeight:"600"}}>{food.name}</div>
                    <div style={{fontSize:"10px",color:C.muted}}>{food.brand && `${food.brand} · `}{food.calories} kcal · P:{food.protein}g G:{food.carbs}g L:{food.fat}g <span style={{color:"#444"}}>{tr("jour.per100g")}</span></div>
                  </div>
                  <button onClick={()=>{removeSavedFood(food.name); setShowSavedFoods(false); setTimeout(()=>setShowSavedFoods(true),50);}}
                    style={{background:"transparent",border:"none",color:"#333",fontSize:"16px",cursor:"pointer",padding:"4px 8px",flexShrink:0}}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showMealForm ? (
          <div style={formStyle}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"10px"}}>{tr("jour.newMealTitle")}</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"8px"}}>
              <button style={{flex:1,padding:"10px",borderRadius:"10px",border:`1.5px solid rgba(255,215,0,0.3)`,background:"rgba(255,215,0,0.06)",color:C.gold,fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}} onClick={()=>{setShowMealForm(false);setShowScanner(true);}}>
                {tr("jour.scannerBtn")}
              </button>
              <button style={{flex:1,padding:"10px",borderRadius:"10px",border:`1.5px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:"#aaa",fontSize:"12px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",position:"relative"}} onClick={()=>setShowSavedFoods(true)}>
                {tr("jour.myFoodsBtn")}
                {getSavedFoods().length > 0 && <span style={{position:"absolute",top:"-6px",right:"-6px",background:C.gold,color:"#000",borderRadius:"10px",fontSize:"9px",fontWeight:"800",padding:"1px 5px",minWidth:"16px",textAlign:"center"}}>{getSavedFoods().length}</span>}
              </button>
            </div>
            <input style={formInput} placeholder={tr("jour.mealNamePh")} value={mealForm.name} onChange={e=>setMealForm({...mealForm,name:e.target.value})}/>
            <input style={formInput} type="number" placeholder={tr("jour.caloriesPh")} value={mealForm.calories} onChange={e=>setMealForm({...mealForm,calories:e.target.value})}/>
            <div style={formRow}>
              <input style={{...formInput,flex:1,marginBottom:0}} type="number" placeholder={tr("jour.proteinPh")} value={mealForm.protein} onChange={e=>setMealForm({...mealForm,protein:e.target.value})}/>
              <input style={{...formInput,flex:1,marginBottom:0}} type="number" placeholder={tr("jour.carbsPh")} value={mealForm.carbs} onChange={e=>setMealForm({...mealForm,carbs:e.target.value})}/>
              <input style={{...formInput,flex:1,marginBottom:0}} type="number" placeholder={tr("jour.fatPh")} value={mealForm.fat} onChange={e=>setMealForm({...mealForm,fat:e.target.value})}/>
            </div>
            {/* Option enregistrer */}
            {mealForm.name && !getSavedFoods().find(f=>f.name.toLowerCase()===mealForm.name.toLowerCase()) && (
              <div onClick={()=>setSaveMeal(!saveMeal)}
                style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",marginTop:"10px",cursor:"pointer",border:`1px solid ${saveMeal?"rgba(125,249,170,0.3)":C.border}`}}>
                <div style={{width:"20px",height:"20px",borderRadius:"6px",border:`1.5px solid ${saveMeal?C.green:C.border}`,background:saveMeal?"rgba(125,249,170,0.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {saveMeal && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div>
                  <div style={{fontSize:"12px",fontWeight:"600",color:saveMeal?C.green:"#aaa"}}>{tr("jour.saveFood")}</div>
                  <div style={{fontSize:"10px",color:"#444"}}>{tr("common.quickAccess")}</div>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:"8px",marginTop:"10px"}}>
              <button style={{...css.btn(C.gold),flex:1,marginBottom:0,padding:"11px"}} onClick={addMeal}>{tr("common.add")}</button>
              <button style={{...css.btnSec,flex:1,marginBottom:0,padding:"11px"}} onClick={()=>setShowMealForm(false)}>{tr("common.cancel")}</button>
            </div>
          </div>
        ) : (
          <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",border:`1.5px dashed rgba(255,215,0,0.2)`,borderRadius:"10px",cursor:"pointer"}} onClick={()=>setShowMealForm(true)}>
              <div style={{fontSize:"13px",color:C.muted}}>{tr("jour.addFoodDashed")}</div>
              <div style={{color:C.muted,fontSize:"20px",fontWeight:"300"}}>+</div>
            </div>
            <button style={{padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:"10px",background:"rgba(255,255,255,0.03)",color:"#aaa",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",position:"relative",flexShrink:0}} onClick={()=>setShowSavedFoods(true)}>
              {tr("jour.myFoodsBtn")}
              {getSavedFoods().length > 0 && <span style={{position:"absolute",top:"-6px",right:"-6px",background:C.gold,color:"#000",borderRadius:"10px",fontSize:"9px",fontWeight:"800",padding:"1px 5px",minWidth:"16px",textAlign:"center"}}>{getSavedFoods().length}</span>}
            </button>
          </div>
        )}
      </div>

      {/* Activité */}
      <div style={css.card}>
        <div style={css.cardTitle}>{tr("jour.activityTitle")}</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:"12px",marginBottom:"8px"}}>
          <div>
            <div style={{fontSize:"13px",fontWeight:"600"}}>{tr("jour.stepsDone")}</div>
            <div style={{fontSize:"10px",color:C.muted}}>{tr("jour.stepsGoal")}</div>
          </div>
          <input type="number" placeholder="0" value={journal.steps||""} onChange={e=>{const u={...journal,steps:parseInt(e.target.value)||null};save(u);}}
            style={{width:"80px",padding:"6px 10px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:C.gold,fontSize:"14px",fontWeight:"700",fontFamily:"inherit",outline:"none",textAlign:"right"}}/>
        </div>

        {journal.session ? (
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(125,249,170,0.06)",border:`1px solid rgba(125,249,170,0.2)`,borderRadius:"12px",marginBottom:"8px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"20px"}}>💪</span>
              <div>
                <div style={{fontSize:"13px",fontWeight:"700",color:C.green}}>{journal.session.type}</div>
                <div style={{fontSize:"10px",color:C.muted}}>{journal.session.duration} min</div>
              </div>
            </div>
            <button onClick={()=>{ const u={...journal,session:null}; save(u); showToast(tr("jour.sessionDeleted")); }}
              style={{background:"transparent",border:"none",color:"#444",fontSize:"18px",cursor:"pointer",padding:"4px"}}>×</button>
          </div>
        ) : null}

        {/* Modal séances favorites */}
        {showSavedSessions && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center",padding:"20px"}}>
            <div style={{background:"#0f0f1a",border:`1px solid ${C.border}`,borderRadius:"24px",padding:"24px",width:"100%",maxWidth:"420px",marginBottom:"10px",maxHeight:"60vh",overflowY:"auto"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
                <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px"}}>{tr("jour.mySessionsTitle")}</div>
                <button onClick={()=>setShowSavedSessions(false)} style={{background:"transparent",border:"none",color:"#555",fontSize:"20px",cursor:"pointer"}}>×</button>
              </div>
              {getSavedSessions().length === 0 ? (
                <div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:"12px"}}>
                  {tr("jour.noSessionSaved")}
                </div>
              ) : getSavedSessions().map((s,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",background:"rgba(255,255,255,0.03)",borderRadius:"12px",marginBottom:"8px"}}>
                  <div style={{flex:1,cursor:"pointer"}} onClick={()=>{
                    save({ ...journal, session:{ type:s.type, duration:s.duration, done:true } });
                    showToast(trf("jour.sessionAdded",{type:s.type}));
                    setShowSavedSessions(false);
                  }}>
                    <div style={{fontSize:"13px",fontWeight:"600"}}>{s.type}</div>
                    <div style={{fontSize:"10px",color:C.muted}}>{s.duration} min</div>
                  </div>
                  <button onClick={()=>{ removeSavedSession(s.type); setShowSavedSessions(false); setTimeout(()=>setShowSavedSessions(true),50); }}
                    style={{background:"transparent",border:"none",color:"#333",fontSize:"16px",cursor:"pointer",padding:"4px 8px"}}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {showSessionForm ? (
          <div style={formStyle}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"10px"}}>{tr("jour.newSessionTitle")}</div>
            <input style={formInput} placeholder={tr("jour.sessionTypePh")} value={sessionForm.type} onChange={e=>setSessionForm({...sessionForm,type:e.target.value})}/>
            <input style={formInput} type="text" inputMode="numeric" placeholder={tr("jour.durationPh")} maxLength={3} value={sessionForm.duration} onChange={e=>{ const v=e.target.value.replace(/[^0-9]/g,""); setSessionForm({...sessionForm,duration:v}); }}/>
            {/* Option enregistrer */}
            {!getSavedSessions().find(s=>s.type.toLowerCase()===sessionForm.type.toLowerCase()) && sessionForm.type && (
              <div onClick={()=>setSaveSession(!saveSession)}
                style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",background:"rgba(255,255,255,0.03)",borderRadius:"10px",marginBottom:"10px",cursor:"pointer",border:`1px solid ${saveSession?"rgba(125,249,170,0.3)":C.border}`}}>
                <div style={{width:"20px",height:"20px",borderRadius:"6px",border:`1.5px solid ${saveSession?C.green:C.border}`,background:saveSession?"rgba(125,249,170,0.15)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {saveSession && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div>
                  <div style={{fontSize:"12px",fontWeight:"600",color:saveSession?C.green:"#aaa"}}>{tr("jour.saveSession")}</div>
                  <div style={{fontSize:"10px",color:"#444"}}>{tr("common.quickAccess")}</div>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
              <button style={{...css.btn(C.gold),flex:1,marginBottom:0,padding:"11px"}} onClick={addSession}>{tr("common.add")}</button>
              <button style={{...css.btnSec,flex:1,marginBottom:0,padding:"11px"}} onClick={()=>setShowSessionForm(false)}>{tr("common.cancel")}</button>
            </div>
          </div>
        ) : (
          <div style={{display:"flex",gap:"8px"}}>
            <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 12px",border:`1.5px dashed ${C.border}`,borderRadius:"10px",cursor:"pointer"}} onClick={()=>setShowSessionForm(true)}>
              <div style={{fontSize:"13px",color:C.muted}}>{journal.session?tr("jour.editSession"):tr("jour.addSession")}</div>
              <div style={{color:C.muted,fontSize:"20px",fontWeight:"300"}}>+</div>
            </div>
            <button style={{padding:"10px 14px",border:`1px solid ${C.border}`,borderRadius:"10px",background:"rgba(255,255,255,0.03)",color:"#aaa",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",position:"relative",flexShrink:0}} onClick={()=>setShowSavedSessions(true)}>
              {tr("jour.mySessionsBtn")}
              {getSavedSessions().length > 0 && <span style={{position:"absolute",top:"-6px",right:"-6px",background:C.gold,color:"#000",borderRadius:"10px",fontSize:"9px",fontWeight:"800",padding:"1px 5px",minWidth:"16px",textAlign:"center"}}>{getSavedSessions().length}</span>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewHistorique({ premium, onShowPaywall }) {
  const { tr, lang } = useI18n();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  if (!premium) {
    return (
      <div style={{width:"100%",maxWidth:"420px"}}>
        <div style={{position:"relative"}}>
          <div style={{filter:"blur(5px)",pointerEvents:"none",userSelect:"none"}}>
            <div style={{...css.card,marginBottom:"12px"}}>
              <div style={css.cardTitle}>{tr("historique.title")}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"4px"}}>
                {[...Array(21)].map((_,i)=>(
                  <div key={i} style={{aspectRatio:"1",borderRadius:"6px",background:i%3===0?"rgba(125,249,170,0.3)":i%5===0?"rgba(255,179,71,0.3)":"rgba(255,255,255,0.05)"}}/>
                ))}
              </div>
            </div>
            <div style={{...css.card}}>
              <div style={css.cardTitle}>{tr("historique.analysesTitle")}</div>
              {[{bf:"14%",date:"30 juin"},{bf:"16%",date:"15 juin"},{bf:"18%",date:"1 juin"}].map((a,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:i<2?`1px solid ${C.border}`:"none"}}>
                  <span style={{fontSize:"13px",color:"#aaa"}}>{a.date}</span>
                  <span style={{fontSize:"13px",fontWeight:"700",color:"#7DF9AA"}}>{a.bf}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(10,10,15,0.75)",backdropFilter:"blur(3px)",borderRadius:"20px",padding:"28px 20px",textAlign:"center"}}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"14px"}}>{tr("historique.proTitle")}</div>
            <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"10px"}}>{tr("historique.fullHistory")}</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"8px"}}>{tr("historique.calendarPerk")}</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"8px"}}>{tr("historique.historyPerk")}</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"24px"}}>{tr("historique.syncPerk")}</div>
            <button style={{...css.btn(C.gold),width:"auto",padding:"14px 28px",marginBottom:"8px",fontSize:"14px"}} onClick={onShowPaywall}>
              {tr("historique.unlockPro")}
            </button>
            <div style={{fontSize:"11px",color:"#333"}}>{tr("historique.cancelAnytime")}</div>
          </div>
        </div>
      </div>
    );
  }

  const [selectedDay, setSelectedDay] = useState(null);
  const journal = getAllJournal();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = lang === "fr"
    ? ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]
    : ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const today = now.toDateString();

  function getDayData(day) {
    const dateISO = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const dateStr = new Date(year, month, day).toDateString();
    return journal[dateISO] || journal[dateStr] || null;
  }

  function getDayColor(data) {
    if (!data) return "no-data";
    const totalCals = data.meals?.reduce((s,m)=>s+(m.calories||0),0) || 0;
    const profile = getProfile();
    const w = parseFloat(get(keys.weight) || profile.weight || 0);
    const tdee = calcTDEE(profile.gender, profile.age, profile.height, w, profile.activity, profile.steps);
    const goal = calcGoal(tdee, profile.goal) || tdee;
    if (!goal || totalCals === 0) return "no-data";
    return totalCals <= goal * 1.05 ? "good" : "over";
  }

  const dayStyle = (type, isToday) => {
    const base = { height:"38px", borderRadius:"8px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"10px" };
    if (isToday) return { ...base, background:"rgba(255,215,0,0.2)", border:"1px solid rgba(255,215,0,0.5)" };
    if (type === "good") return { ...base, background:"rgba(125,249,170,0.1)", border:"1px solid rgba(125,249,170,0.2)" };
    if (type === "over") return { ...base, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)" };
    return { ...base, background:"rgba(255,255,255,0.03)" };
  };

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      {selectedDay && (() => {
        const date = new Date(year, month, selectedDay);
        const dateISO = `${year}-${String(month+1).padStart(2,"0")}-${String(selectedDay).padStart(2,"0")}`;
        const dateStr = date.toDateString();
        const data = journal[dateISO] || journal[dateStr] || {};
        const totalCals = data.meals?.reduce((s,m)=>s+(m.calories||0),0) || 0;
        const macros = data.meals?.reduce((acc,m)=>({protein:acc.protein+(m.protein||0),carbs:acc.carbs+(m.carbs||0),fat:acc.fat+(m.fat||0)}),{protein:0,carbs:0,fat:0}) || {};
        return (
          <div style={{background:`linear-gradient(135deg,rgba(255,215,0,0.06),transparent)`,border:`1px solid rgba(255,215,0,0.15)`,borderRadius:"16px",padding:"16px",marginBottom:"12px"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
              <div style={{fontSize:"14px",fontWeight:"700",color:C.gold}}>{date.toLocaleDateString(locale,{weekday:"long",day:"numeric",month:"long"})}</div>
              <button style={{background:"transparent",border:"none",color:C.muted,fontSize:"20px",cursor:"pointer"}} onClick={()=>setSelectedDay(null)}>×</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"14px"}}>
              {[
                {val:totalCals||"—",label:tr("historique.kcalLabel")},
                {val:data.steps ? data.steps.toLocaleString(locale) : "—",label:tr("historique.stepsLabel")},
                {val:data.session?.done ? "✓" : "—", label:tr("historique.sessionLabel"), color:data.session?.done?C.green:C.muted}
              ].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                  <div style={{fontSize:"16px",fontWeight:"800",color:s.color||C.text}}>{s.val}</div>
                  <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Détail séance */}
            {data.session?.done && (data.session?.type || data.session?.duration) && (
              <div style={{background:"rgba(125,249,170,0.06)",border:`1px solid rgba(125,249,170,0.15)`,borderRadius:"10px",padding:"10px 12px",marginBottom:"12px",display:"flex",alignItems:"center",gap:"10px"}}>
                <span style={{fontSize:"16px"}}>💪</span>
                <div>
                  {data.session.type && <div style={{fontSize:"13px",fontWeight:"600",color:C.green}}>{data.session.type}</div>}
                  {data.session.duration && <div style={{fontSize:"11px",color:C.muted}}>{data.session.duration} min</div>}
                </div>
              </div>
            )}
            {data.meals?.length > 0 && (
              <>
                <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",marginBottom:"8px"}}>{tr("historique.mealsLabel")}</div>
                {data.meals.map((m,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid rgba(255,255,255,0.04)`,fontSize:"12px"}}>
                    <span style={{color:"#bbb"}}>{m.name}</span>
                    <span style={{color:C.gold,fontWeight:"600"}}>{m.calories} kcal</span>
                  </div>
                ))}
              </>
            )}
            {(macros.protein > 0 || macros.carbs > 0) && (
              <>
                <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",margin:"12px 0 8px"}}>{tr("historique.macrosLabel")}</div>
                <div style={{display:"flex",gap:"8px"}}>
                  {[{val:`${macros.protein}g`,label:tr("historique.protein"),color:"#7DF9FF"},{val:`${macros.carbs}g`,label:tr("historique.carbs"),color:"#FFB347"},{val:`${macros.fat}g`,label:tr("historique.fat"),color:"#FF8C69"}].map((m,i)=>(
                    <div key={i} style={{flex:1,background:"rgba(255,255,255,0.03)",borderRadius:"8px",padding:"8px",textAlign:"center"}}>
                      <div style={{fontSize:"13px",fontWeight:"700",color:m.color}}>{m.val}</div>
                      <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{m.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })()}

      <div style={css.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
          <div style={{fontSize:"14px",fontWeight:"700"}}>{monthNames[month]} {year}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"3px"}}>
          {(lang==="fr" ? ["L","M","M","J","V","S","D"] : ["M","T","W","T","F","S","S"]).map((d,i)=>(
            <div key={i} style={{fontSize:"9px",color:"#444",textAlign:"center",padding:"3px 0"}}>{d}</div>
          ))}
          {Array.from({length:(firstDay===0?6:firstDay-1)}).map((_,i)=>(
            <div key={`e${i}`}/>
          ))}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day = i+1;
            const isToday = new Date(year,month,day).toDateString()===today;
            const data = getDayData(day);
            const colorType = getDayColor(data);
            const totalCals = data?.meals?.reduce((s,m)=>s+(m.calories||0),0)||0;
            return (
              <div key={day} style={dayStyle(colorType,isToday)} onClick={()=>setSelectedDay(day)}>
                <div style={{fontSize:"11px",fontWeight:"600",color:isToday?C.gold:C.text}}>{day}</div>
                {data && (
                  <div style={{display:"flex",gap:"2px",marginTop:"2px",justifyContent:"center"}}>
                    {data.steps > 0 && <span style={{fontSize:"7px"}}>👟</span>}
                    {data.session?.done && <span style={{fontSize:"7px"}}>💪</span>}
                  </div>
                )}
                {totalCals > 0 && <div style={{fontSize:"8px",color:colorType==="good"?C.green:colorType==="over"?C.red:C.muted}}>{totalCals}</div>}
              </div>
            );
          })}
        </div>
        <div style={{display:"flex",gap:"14px",marginTop:"10px"}}>
          {[{color:"rgba(125,249,170,0.4)",label:tr("historique.inGoal")},{color:"rgba(255,107,107,0.4)",label:tr("historique.over")},{color:"rgba(255,215,0,0.4)",label:tr("historique.today")}].map((l,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <div style={{width:"10px",height:"10px",borderRadius:"3px",background:l.color}}/>
              <span style={{fontSize:"10px",color:C.muted}}>{l.label}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:"11px",color:"#333",marginTop:"8px",textAlign:"center"}}>{tr("historique.clickDay")}</p>
      </div>
    </div>
  );
}

function ViewProgression({ premium, onShowPaywall }) {
  const { tr, trf, lang } = useI18n();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const history = getHistory();
  // Historique utilisé pour les calculs (tendance, projection, graphique) — exclut les analyses
  // marquées comme "test" (ancienne photo, photo d'une autre personne, etc.)
  const trackedHistory = history.filter(h => !h.excluded);
  const [selected, setSelected] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [, setRefreshTick] = useState(0);

  // Toute la progression est Pro
  if (!premium) {
    return (
      <div style={{width:"100%",maxWidth:"420px"}}>
        <div style={{position:"relative"}}>
          {/* Teaser flouté */}
          <div style={{filter:"blur(5px)",pointerEvents:"none",userSelect:"none"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"}}>
              {[{val:"14%",label:tr("progression.current"),color:"#7DF9AA"},{val:"−3%",label:tr("progression.evolution"),color:"#7DF9AA"},{val:"8",label:tr("progression.analysesCount")}].map((s,i)=>(
                <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:"12px",padding:"12px",textAlign:"center"}}>
                  <div style={{fontSize:"22px",fontWeight:"800",color:s.color||C.text}}>{s.val}</div>
                  <div style={{fontSize:"9px",color:C.muted,marginTop:"3px"}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{...css.card,marginBottom:"12px"}}>
              <div style={css.cardTitle}>{tr("progression.photoHistoryTitle")}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px"}}>
                {["#7DF9AA","#7DF9FF","#FFB347","#FFB347","#FF8C69","#FF6B6B"].map((color,i)=>(
                  <div key={i} style={{aspectRatio:"3/4",background:"rgba(255,255,255,0.05)",borderRadius:"10px",display:"flex",flexDirection:"column",justifyContent:"flex-end",padding:"6px 8px"}}>
                    <div style={{fontSize:"14px",fontWeight:"800",color}}>{["14%","15%","17%","18%","19%","21%"][i]}</div>
                    <div style={{fontSize:"9px",color:"#aaa"}}>{["30 juin","15 juin","1 juin","15 mai","1 mai","1 avr."][i]}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{...css.card}}>
              <div style={css.cardTitle}>{tr("progression.curveTitle")}</div>
              <svg width="100%" viewBox="0 0 340 80">
                <path d="M20 65 L70 58 L120 50 L170 44 L220 38 L270 34 L320 28 L320 75 L20 75 Z" fill="rgba(125,249,170,0.1)"/>
                <path d="M20 65 L70 58 L120 50 L170 44 L220 38 L270 34 L320 28" fill="none" stroke="#7DF9AA" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          {/* Overlay Pro */}
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(10,10,15,0.75)",backdropFilter:"blur(3px)",borderRadius:"20px",padding:"28px 20px",textAlign:"center"}}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"14px"}}>{tr("progression.proTitle")}</div>
            <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"10px",lineHeight:"1.3"}}>{tr("progression.followTransfo")}</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"8px",lineHeight:"1.6"}}>{tr("progression.photoHistoryPerk")}</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"8px",lineHeight:"1.6"}}>{tr("progression.curvePerk")}</div>
            <div style={{fontSize:"13px",color:"#666",marginBottom:"24px",lineHeight:"1.6"}}>{tr("progression.comparePerk")}</div>
            <button style={{...css.btn(C.gold),width:"auto",padding:"14px 28px",marginBottom:"8px",fontSize:"14px"}} onClick={onShowPaywall}>
              {tr("progression.unlockPro")}
            </button>
            <div style={{fontSize:"11px",color:"#333"}}>{tr("progression.cancelAnytime")}</div>
          </div>
        </div>
      </div>
    );
  }

  function togglePhoto(i) {
    if (selected.includes(i)) { setSelected(selected.filter(s=>s!==i)); return; }
    if (selected.length >= 2) { setSelected([selected[1], i]); return; }
    setSelected([...selected, i]);
  }

  // Régression linéaire simple (méthode des moindres carrés) sur une série de points {x,y}
  // Beaucoup plus fiable que "1ère vs dernière valeur" — lisse le bruit d'une photo isolée
  function linearTrendPerWeek(points) {
    const n = points.length;
    if (n < 3) return null;
    const sumX = points.reduce((s,p)=>s+p.x,0);
    const sumY = points.reduce((s,p)=>s+p.y,0);
    const sumXY = points.reduce((s,p)=>s+p.x*p.y,0);
    const sumXX = points.reduce((s,p)=>s+p.x*p.x,0);
    const denom = (n*sumXX - sumX*sumX);
    if (denom === 0) return null;
    const slopePerDay = (n*sumXY - sumX*sumY) / denom;
    return slopePerDay * 7; // taux hebdomadaire
  }

  const GOAL_TARGETS = {
    male:   { cut_hard: 8,  cut: 12 },
    female: { cut_hard: 16, cut: 20 },
  };

  const profileForTrend = getProfile();
  const goal = profileForTrend.goal;
  const genderForTrend = profileForTrend.gender || "male";
  const isCutGoal = goal === "cut_hard" || goal === "cut";
  const isBulkGoal = goal === "lean_bulk" || goal === "bulk";
  const isMaintainGoal = goal === "maintain";

  const bfTrend = (() => {
    if (trackedHistory.length < 3) return null;
    const sorted = [...trackedHistory].reverse(); // du plus ancien au plus récent
    const t0 = new Date(sorted[0].date).getTime();
    const points = sorted.map(h => ({ x: (new Date(h.date).getTime() - t0) / 86400000, y: h.bodyfat }));
    return linearTrendPerWeek(points);
  })();

  const weightTrend = (() => {
    const withWeight = [...trackedHistory].reverse().filter(h => h.weight);
    if (withWeight.length < 3) return null;
    const t0 = new Date(withWeight[0].date).getTime();
    const points = withWeight.map(h => ({ x: (new Date(h.date).getTime() - t0) / 86400000, y: h.weight }));
    return linearTrendPerWeek(points);
  })();

  const target = GOAL_TARGETS[genderForTrend]?.[goal] ?? null;

  const stats = trackedHistory.length > 0 ? {
    current: trackedHistory[0].bodyfat,
    diff: trackedHistory.length > 1 ? trackedHistory[0].bodyfat - trackedHistory[trackedHistory.length-1].bodyfat : null,
    count: trackedHistory.length,
  } : null;

  const trendCard = (() => {
    if (!stats) return null;
    if (bfTrend === null) return { type:"notEnoughData" };

    if (isCutGoal && target != null) {
      if (stats.current <= target) return { type:"goalReached", target };
      if (bfTrend >= -0.05) return { type:"stalled", target };
      const weeksToGoal = (stats.current - target) / Math.abs(bfTrend);
      const projectedDate = new Date(Date.now() + weeksToGoal * 7 * 86400000);
      return { type:"projection", rate:bfTrend.toFixed(1), target, date: projectedDate.toLocaleDateString(locale,{day:"numeric",month:"long"}) };
    }
    if (isBulkGoal) {
      if (weightTrend === null) return { type:"notEnoughData" };
      if (weightTrend > 0.05) return { type:"bulkGain", rate: weightTrend.toFixed(1) };
      return { type:"bulkStalled" };
    }
    if (isMaintainGoal) return { type:"maintain", rate: bfTrend.toFixed(1) };
    return { type:"noGoal" };
  })();

  // Milestone detection
  const milestone = (() => {
    if (!stats || stats.diff === null) return null;
    const diff = stats.diff;
    if (diff <= -5) return { text:trf("progression.milestoneAmazing",{n:Math.abs(diff)}), color:C.green };
    if (diff <= -3) return { text:trf("progression.milestoneExcellent",{n:Math.abs(diff)}), color:C.green };
    if (diff <= -1) return { text:trf("progression.milestoneGood",{n:Math.abs(diff)}), color:"#7DF9FF" };
    if (diff >= 3 && trackedHistory[0].bodyfat <= 18) return { text:trf("progression.milestoneMuscle",{n:diff}), color:C.gold };
    if (diff >= 3) return { text:trf("progression.milestoneAdjust",{n:diff}), color:"#FFB347" };
    return null;
  })();

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      {stats && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"12px"}}>
          {[
            {val:`${stats.current}%`,label:tr("progression.current"),color:getArchetype(stats.current,getProfile().gender||"male").color},
            {val:stats.diff!==null?`${stats.diff>0?"+":""}${stats.diff}%`:"—",label:tr("progression.evolution"),color:stats.diff<0?C.green:stats.diff>0?C.red:C.text},
            {val:stats.count,label:tr("progression.analysesCount")},
          ].map((s,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:"12px",padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:"22px",fontWeight:"800",color:s.color||C.text}}>{s.val}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"3px",letterSpacing:"1px"}}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tendance & objectif — régression linéaire + projection selon l'objectif du profil */}
      {trendCard && (
        <div style={{...css.card, marginBottom:"12px"}}>
          <div style={css.cardTitle}>{tr("progression.trendTitle")}</div>
          {trendCard.type === "notEnoughData" && <div style={{fontSize:"13px",color:"#666",lineHeight:"1.6"}}>{tr("progression.notEnoughData")}</div>}
          {trendCard.type === "noGoal" && <div style={{fontSize:"13px",color:"#666",lineHeight:"1.6"}}>{tr("progression.noGoalSet")}</div>}
          {trendCard.type === "goalReached" && <div style={{fontSize:"13px",color:C.green,lineHeight:"1.6"}}>{trf("progression.goalReached",{current:stats.current,target:trendCard.target})}</div>}
          {trendCard.type === "stalled" && <div style={{fontSize:"13px",color:"#FFB347",lineHeight:"1.6"}}>{trf("progression.stalledText",{target:trendCard.target})}</div>}
          {trendCard.type === "projection" && <div style={{fontSize:"13px",color:C.green,lineHeight:"1.6"}}>{trf("progression.projectionText",{rate:trendCard.rate,target:trendCard.target,date:trendCard.date})}</div>}
          {trendCard.type === "bulkGain" && <div style={{fontSize:"13px",color:C.gold,lineHeight:"1.6"}}>{trf("progression.bulkWeightGain",{rate:trendCard.rate})}</div>}
          {trendCard.type === "bulkStalled" && <div style={{fontSize:"13px",color:"#FFB347",lineHeight:"1.6"}}>{tr("progression.bulkWeightStalled")}</div>}
          {trendCard.type === "maintain" && <div style={{fontSize:"13px",color:"#7DF9FF",lineHeight:"1.6"}}>{trf("progression.maintainStable",{rate:trendCard.rate})}</div>}
        </div>
      )}

      {/* Milestone */}
      {milestone && (
        <div style={{...css.card,background:`linear-gradient(135deg,${milestone.color}08,transparent)`,borderColor:`${milestone.color}22`,marginBottom:"12px"}}>
          <div style={{fontSize:"10px",color:milestone.color,letterSpacing:"2px",marginBottom:"8px"}}>{tr("progression.milestoneTitle")}</div>
          <div style={{fontSize:"13px",color:"#ccc",lineHeight:"1.6"}}>{milestone.text}</div>
        </div>
      )}

      {/* Photos */}
      <div style={css.card}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
          <div style={css.cardTitle}>{tr("progression.photoHistoryTitle")}</div>
          {!premium && <div style={{fontSize:"10px",color:C.gold,background:"rgba(255,215,0,0.1)",border:`1px solid rgba(255,215,0,0.25)`,padding:"3px 10px",borderRadius:"20px",fontWeight:"600"}}>{tr("progression.comparePro")}</div>}
        </div>
        {history.length === 0 ? (
          <div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:"12px"}}>{tr("progression.noAnalysisYet")}</div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"10px"}}>
            {history.slice(0,9).map((h,i)=>{
              const arch = getArchetype(h.bodyfat, h.gender||"male");
              const date = new Date(h.date).toLocaleDateString(locale,{day:"numeric",month:"short"});
              const isSel = selected.includes(i);
              return (
                <div key={i} onClick={()=>togglePhoto(i)} style={{position:"relative",borderRadius:"12px",overflow:"hidden",cursor:"pointer",aspectRatio:"3/4",background:`linear-gradient(135deg,${arch.color}18,rgba(0,0,0,0.6))`,border:`${isSel?"2px":"1px"} solid ${isSel?C.gold:arch.color+"44"}`,display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"10px 8px",opacity:h.excluded?0.4:1}}>
                  {/* Bouton marquer comme test / pas moi — exclut des calculs de tendance */}
                  <button
                    onClick={(e)=>{ e.stopPropagation(); toggleHistoryExclusion(h.date); setRefreshTick(t=>t+1); }}
                    title={tr("progression.markTestToggle")}
                    style={{position:"absolute",top:"6px",left:"6px",zIndex:2,width:"18px",height:"18px",borderRadius:"50%",background:h.excluded?C.gold:"rgba(0,0,0,0.5)",border:`1px solid ${h.excluded?C.gold:"rgba(255,255,255,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",padding:0,cursor:"pointer"}}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={h.excluded?"#000":"#fff"} strokeWidth="2.5"><path d="M4 4l16 16M4 20L20 4"/></svg>
                  </button>
                  {h.excluded && <div style={{position:"absolute",top:"6px",left:"28px",zIndex:2,fontSize:"7px",color:C.gold,background:"rgba(0,0,0,0.6)",padding:"2px 5px",borderRadius:"6px",fontWeight:"700",letterSpacing:"0.5px"}}>{tr("progression.testLabel")}</div>}
                  {/* Badge sélection */}
                  {isSel && <div style={{position:"absolute",top:"6px",right:"6px",width:"18px",height:"18px",borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9px",color:"#000",fontWeight:"800"}}>✓</div>}
                  {/* Icône centrale */}
                  <div style={{display:"flex",justifyContent:"center",alignItems:"center",flex:1}}>
                    <div style={{width:"44px",height:"44px",borderRadius:"50%",background:`${arch.color}22`,border:`1.5px solid ${arch.color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>
                      {arch.color === "#7DF9AA" ? "🏆" : arch.color === "#7DF9FF" ? "💪" : arch.color === "#FFD700" ? "⚡" : arch.color === "#FFB347" ? "🎯" : arch.color === "#FF8C69" ? "🔥" : "📈"}
                    </div>
                  </div>
                  {/* Score et date */}
                  <div>
                    <div style={{fontSize:"18px",fontWeight:"800",color:arch.color}}>{h.bodyfat}%</div>
                    <div style={{fontSize:"9px",color:"#aaa",marginTop:"2px"}}>{date}</div>
                    <div style={{fontSize:"8px",color:arch.color+"99",marginTop:"1px"}}>{tr("archetype."+arch.label)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Teaser comparatif pour non-abonnés */}
        {!premium && history.length >= 2 && (
          <div style={{position:"relative",marginBottom:"10px",borderRadius:"12px",overflow:"hidden",cursor:"pointer"}} onClick={onShowPaywall}>
            <div style={{filter:"blur(4px)",pointerEvents:"none",background:"rgba(125,249,170,0.05)",border:`1px solid rgba(125,249,170,0.15)`,borderRadius:"12px",padding:"14px"}}>
              <div style={{fontSize:"13px",fontWeight:"700",color:C.green,marginBottom:"4px"}}>{tr("progression.compareAvailable")}</div>
              <div style={{fontSize:"11px",color:C.muted}}>{tr("progression.selectTwoPhotos")}</div>
            </div>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"rgba(10,10,15,0.7)",backdropFilter:"blur(2px)",borderRadius:"12px"}}>
              <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"6px"}}>{tr("progression.proLabel")}</div>
              <div style={{fontSize:"13px",fontWeight:"700",color:"white",marginBottom:"4px"}}>{tr("progression.aiCompare")}</div>
              <div style={{fontSize:"11px",color:C.muted}}>{tr("progression.unlockFor")}</div>
            </div>
          </div>
        )}

        {premium && selected.length === 2 && (
          <button style={css.btn(C.gold)} onClick={()=>setShowCompare(true)}>
            {tr("progression.compareTwoBtn")}
          </button>
        )}
      </div>

      {/* Compare result */}
      {showCompare && selected.length === 2 && (() => {
        const a = history[selected[0]], b = history[selected[1]];
        const diff = a.bodyfat - b.bodyfat;
        const improved = diff < 0;
        return (
          <div style={{...css.card,background:`rgba(125,249,170,0.05)`,borderColor:`rgba(125,249,170,0.2)`}}>
            <div style={{...css.cardTitle,color:C.green}}>{tr("progression.aiCompareTitle")}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"12px"}}>
              {[b,a].map((h,i)=>(
                <div key={i} style={{textAlign:"center"}}>
                  <div style={{height:"80px",background:"rgba(255,255,255,0.04)",borderRadius:"10px",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:"6px",border:`1px solid ${getArchetype(h.bodyfat,h.gender||"male").color}22`}}>
                    <span style={{fontSize:"20px",fontWeight:"800",color:getArchetype(h.bodyfat,h.gender||"male").color}}>{h.bodyfat}%</span>
                  </div>
                  <p style={{fontSize:"10px",color:C.muted}}>{new Date(h.date).toLocaleDateString(locale,{day:"numeric",month:"short"})}</p>
                </div>
              ))}
            </div>
            <div style={{background:`rgba(125,249,170,0.08)`,borderRadius:"12px",padding:"12px",textAlign:"center"}}>
              <div style={{fontSize:"14px",fontWeight:"800",color:improved?C.green:C.red,marginBottom:"4px"}}>
                {improved?tr("progression.fatLossConfirmed"):tr("progression.massGainDetected")}
              </div>
              <div style={{fontSize:"11px",color:C.sub,lineHeight:"1.5"}}>
                {trf("progression.betweenAnalyses",{n:Math.abs(diff),dir:improved?tr("progression.lessBetween"):tr("progression.moreBetween")})}
                {improved?tr("progression.definitionImproved"):tr("progression.keepWork")}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Courbe combinée poids + body fat */}
      {trackedHistory.length >= 2 && (
        <div style={css.card}>
          <div style={css.cardTitle}>{tr("progression.combinedChartTitle")}</div>
          <svg width="100%" viewBox="0 0 340 100" style={{overflow:"visible"}}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.green} stopOpacity="0.25"/>
                <stop offset="100%" stopColor={C.green} stopOpacity="0"/>
              </linearGradient>
            </defs>
            {(() => {
              const data = [...trackedHistory].reverse().slice(-8);
              const vals = data.map(h=>h.bodyfat);
              const min = Math.max(0,Math.min(...vals)-3), max = Math.min(50,Math.max(...vals)+3);
              const pts = data.map((h,i)=>({
                x: data.length===1?170:(i/(data.length-1))*(340-40)+20,
                y: 90-((h.bodyfat-min)/(max-min))*(80),
                bf: h.bodyfat,
              }));
              const path = pts.map((p,i)=>`${i===0?"M":"L"}${p.x} ${p.y}`).join(" ");

              // Courbe poids — normalisée indépendamment sur le même espace vertical,
              // uniquement si au moins 2 points ont un poids renseigné
              const weightPts = (() => {
                const withW = data.map((h,i)=>({...h,i})).filter(h=>h.weight);
                if (withW.length < 2) return null;
                const wVals = withW.map(h=>h.weight);
                const wMin = Math.min(...wVals) - 1, wMax = Math.max(...wVals) + 1;
                return withW.map(h => ({
                  x: data.length===1?170:(h.i/(data.length-1))*(340-40)+20,
                  y: 90-((h.weight-wMin)/(wMax-wMin))*(80),
                  w: h.weight,
                }));
              })();
              const weightPath = weightPts ? weightPts.map((p,i)=>`${i===0?"M":"L"}${p.x} ${p.y}`).join(" ") : null;

              return (
                <>
                  <path d={`${path} L${pts[pts.length-1].x} 90 L${pts[0].x} 90 Z`} fill="url(#chartGrad)"/>
                  <path d={path} fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {pts.map((p,i)=>(
                    <g key={i}>
                      <circle cx={p.x} cy={p.y} r="4" fill={C.green}/>
                      <text x={p.x} y={p.y-10} textAnchor="middle" fill="white" fontSize="9" fontFamily="Arial">{p.bf}%</text>
                    </g>
                  ))}
                  {weightPath && (
                    <>
                      <path d={weightPath} fill="none" stroke={C.gold} strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round"/>
                      {weightPts.map((p,i)=>(
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="3" fill={C.gold}/>
                          <text x={p.x} y={p.y+16} textAnchor="middle" fill={C.gold} fontSize="8" fontFamily="Arial">{p.w}kg</text>
                        </g>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </svg>
          <div style={{display:"flex",gap:"14px",marginTop:"10px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <div style={{width:"14px",height:"2.5px",background:C.green,borderRadius:"2px"}}/>
              <span style={{fontSize:"10px",color:C.muted}}>{tr("progression.bodyFatLabel")}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
              <div style={{width:"14px",height:"2px",background:C.gold,borderRadius:"2px"}}/>
              <span style={{fontSize:"10px",color:C.muted}}>{tr("progression.weightLabel")}</span>
            </div>
          </div>
          <div style={{fontSize:"10px",color:"#444",marginTop:"8px",lineHeight:"1.5"}}>{tr("progression.combinedChartHint")}</div>
        </div>
      )}
    </div>
  );
}

function ViewProfil({ user, premium, onShowAuth, setPremiumState }) {
  const { tr, lang } = useI18n();
  const [profile, setProfile] = useState(getProfile());
  const [saved, setSaved] = useState(false);
  const completion = getProfileCompletion(profile);
  const w = parseFloat(get(keys.weight) || profile.weight || 0);
  const tdee = calcTDEE(profile.gender, profile.age, profile.height, w, profile.activity, profile.steps);
  const goalCals = calcGoal(tdee, profile.goal);

  // Récupère la dernière version distante à chaque ouverture de l'onglet Profil
  // (et pas seulement au chargement complet de l'app) pour refléter les changements
  // faits sur un autre appareil sans avoir à recharger toute l'app.
  useEffect(() => {
    const token = localStorage.getItem("pq_token");
    if (!token) return;
    const today = new Date().toISOString().slice(0, 10);
    syncPull(token, today).then(remote => {
      if (!remote?.profile) return;
      const p = remote.profile;
      const localTs = localStorage.getItem("pq_profile_updated_at");
      const remoteTs = p.updated_at;
      const useRemote = !localTs || (remoteTs && new Date(remoteTs) > new Date(localTs));
      if (useRemote && (p.gender || p.age || p.weight || p.height)) {
        applyRemoteProfile(p);
        setProfile(getProfile());
      }
    }).catch(() => {});
  }, []);

  // Met à jour l'affichage et la persistance locale immédiatement (rien n'est perdu
  // en cas de navigation), mais NE pousse PAS vers le serveur à chaque frappe —
  // ça évite les requêtes en rafale qui peuvent arriver dans le désordre.
  function update(key, val) {
    const updated = { ...profile, [key]: val };
    setProfile(updated);
    set(keys.profile, updated);
    setSaved(false);
  }

  function handleSave() {
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div style={{width:"100%",maxWidth:"420px"}}>
      <div style={css.card}>
        <div style={css.cardTitle}>{tr("profil.completionTitle")}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
          <span style={{fontSize:"13px",fontWeight:"700"}}>{tr("nav.profil")}</span>
          <span style={{fontSize:"20px",fontWeight:"800",color:completion===100?C.green:C.gold}}>{completion}%</span>
        </div>
        <div style={{height:"5px",background:"rgba(255,255,255,0.06)",borderRadius:"3px",overflow:"hidden",marginBottom:"6px"}}>
          <div style={{height:"100%",width:`${completion}%`,background:`linear-gradient(90deg,${C.gold},#FFA500)`,borderRadius:"3px",transition:"width 0.4s"}}/>
        </div>
        <div style={{fontSize:"11px",color:"#444",marginBottom:"6px"}}>{tr("profil.completionHint")}</div>

        <span style={css.label}>{tr("analyze.genre")}</span>
        <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
          <button style={{...css.optBtn(profile.gender==="male"),flex:1,textAlign:"center"}} onClick={()=>update("gender","male")}>{tr("analyze.homme")}</button>
          <button style={{...css.optBtn(profile.gender==="female"),flex:1,textAlign:"center"}} onClick={()=>update("gender","female")}>{tr("analyze.femme")}</button>
        </div>

        <span style={css.label}>{tr("profil.ageLabel")}</span>
        <input style={css.input} type="text" inputMode="numeric" placeholder={tr("analyze.agePlaceholder")} maxLength={3}
          value={profile.age||""}
          onChange={e=>{ const raw=e.target.value.replace(/[^0-9]/g,"").slice(0,3); const v=parseInt(raw)||""; update("age",v>100?100:v||""); }}/>

        <span style={css.label}>{tr("profil.heightLabel")}</span>
        <input style={css.input} type="text" inputMode="numeric" placeholder={tr("profil.heightPlaceholder")} maxLength={3}
          value={profile.height||""}
          onChange={e=>{ const raw=e.target.value.replace(/[^0-9]/g,"").slice(0,3); const v=parseInt(raw)||""; update("height",v>250?250:v||""); }}/>

        <span style={css.label}>{tr("profil.refWeightLabel")}</span>
        <input style={css.input} type="text" inputMode="decimal" placeholder={tr("analyze.weightPlaceholder")} maxLength={5}
          value={profile.weight||""}
          onChange={e=>{ const raw=e.target.value.replace(/[^0-9.]/g,"").slice(0,5); const v=parseFloat(raw)||""; update("weight",v>300?300:raw||""); }}/>
        <div style={{fontSize:"11px",color:"#444",marginTop:"4px"}}>{tr("profil.autoUpdated")}</div>

        <span style={css.label}>{tr("profil.activityLabel")}</span>
        <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"8px"}}>
          {ACTIVITY_LEVELS.map(l=>(
            <button key={l.key} style={css.optBtn(profile.activity===l.key)} onClick={()=>update("activity",l.key)}>{tr("activityLevels."+l.key)}</button>
          ))}
        </div>

        <span style={css.label}>{tr("profil.stepsLabel")}</span>
        <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"8px"}}>
          {DAILY_STEPS.map(s=>(
            <button key={s.key} style={css.optBtn(profile.steps===s.key)} onClick={()=>update("steps",s.key)}>{tr("dailySteps."+s.key)}</button>
          ))}
        </div>

        <span style={css.label}>{tr("profil.trainingLabel")}</span>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginTop:"8px"}}>
          {[["strength",tr("profil.strength")],["cardio",tr("profil.cardio")],["mixed",tr("profil.mixed")],["sport",tr("profil.sport")]].map(([val,label])=>(
            <button key={val} style={css.optBtn(profile.trainingType===val)} onClick={()=>update("trainingType",val)}>{label}</button>
          ))}
        </div>

        <span style={css.label}>{tr("profil.goalLabel")}</span>
        <div style={{display:"flex",flexDirection:"column",gap:"6px",marginTop:"8px"}}>
          {GOALS.map(g=>(
            <button key={g.key} style={css.optBtn(profile.goal===g.key)} onClick={()=>update("goal",g.key)}>{tr("goals."+g.key)}</button>
          ))}
        </div>

        <button onClick={handleSave} style={{...css.btn(saved ? C.green : C.gold), marginTop:"18px"}}>
          {saved ? tr("profil.saved") : tr("profil.saveBtn")}
        </button>
      </div>

      {tdee && (
        <div style={{background:`linear-gradient(135deg,rgba(255,215,0,0.08),rgba(255,215,0,0.02))`,border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"16px",padding:"16px",marginBottom:"12px"}}>
          <div style={css.cardTitle}>{tr("profil.tdeeTitle")}</div>
          <div style={{fontSize:"11px",color:"#444",marginBottom:"14px"}}>
            {profile.gender==="male"?tr("profil.homme"):tr("profil.femme")} · {profile.age} {tr("profil.yearsOld")} · {profile.height} cm · {w} kg · {profile.activity ? tr("activityLevelsShort."+profile.activity) : ""}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"14px"}}>
            <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"12px",padding:"14px",textAlign:"center"}}>
              <div style={{fontSize:"20px",fontWeight:"800",color:C.gold}}>{tdee.toLocaleString()}</div>
              <div style={{fontSize:"9px",color:C.muted,marginTop:"3px"}}>{tr("profil.maintenanceKcal")}</div>
            </div>
            {goalCals && (
              <div style={{background:"rgba(125,249,170,0.06)",border:`1px solid rgba(125,249,170,0.15)`,borderRadius:"12px",padding:"14px",textAlign:"center"}}>
                <div style={{fontSize:"20px",fontWeight:"800",color:C.green}}>{goalCals.toLocaleString()}</div>
                <div style={{fontSize:"9px",color:C.muted,marginTop:"3px"}}>{tr("profil.goalKcal")}</div>
              </div>
            )}
          </div>
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"10px",padding:"12px"}}>
            <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px",marginBottom:"8px"}}>{tr("profil.calcDetail")}</div>
            {[
              {label:tr("profil.bmr"), val:`${Math.round(profile.gender==="male"?(10*w)+(6.25*parseFloat(profile.height))-(5*parseFloat(profile.age))+5:(10*w)+(6.25*parseFloat(profile.height))-(5*parseFloat(profile.age))-161)} kcal`},
              {label:tr("profil.activityMult"), val:`×${ACTIVITY_LEVELS.find(l=>l.key===profile.activity)?.factor}`},
              ...(profile.steps ? [{label:tr("profil.stepsBonus"), val:`+${Math.round(0.045 * w * (DAILY_STEPS.find(s=>s.key===profile.steps)?.steps||0) / 1000)} kcal`}] : []),
            ].map((row,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"11px",marginBottom:"5px"}}>
                <span style={{color:"#666"}}>{row.label}</span>
                <span style={{color:"#aaa"}}>{row.val}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",borderTop:`1px solid ${C.border}`,paddingTop:"6px",marginTop:"4px"}}>
              <span style={{color:C.gold,fontWeight:"700"}}>TDEE</span>
              <span style={{color:C.gold,fontWeight:"700"}}>{tdee.toLocaleString()} kcal</span>
            </div>
          </div>
          <div style={{fontSize:"10px",color:"#444",marginTop:"10px",textAlign:"center"}}>{tr("profil.mifflinRef")}</div>

          {/* Objectifs macros avec édition manuelle */}
          {goalCals && profile.weight && (() => {
            const targets = calcTargetMacros(goalCals, profile.goal, profile.weight);
            if (!targets) return null;
            const custom = getCustomMacros();
            const display = custom || targets;
            const isCustom = !!custom;
            return (
              <div style={{marginTop:"14px",background:"rgba(255,255,255,0.03)",borderRadius:"12px",padding:"12px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"10px"}}>
                  <div style={{fontSize:"10px",color:C.muted,letterSpacing:"1px"}}>{tr("profil.dailyMacroGoals")}</div>
                  <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
                    {isCustom && (
                      <button onClick={()=>{saveCustomMacros(null);setProfile({...profile});}}
                        style={{fontSize:"9px",color:C.muted,background:"transparent",border:`1px solid ${C.border}`,borderRadius:"6px",padding:"2px 8px",cursor:"pointer",fontFamily:"inherit"}}>
                        {tr("profil.reset")}
                      </button>
                    )}
                    {isCustom && <div style={{fontSize:"9px",color:C.gold,background:"rgba(255,215,0,0.1)",padding:"2px 8px",borderRadius:"6px"}}>{tr("profil.modified")}</div>}
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginBottom:"8px"}}>
                  {[
                    {key:"protein",label:tr("jour.protein"),val:display.protein,color:"#7DF9FF",base:isCustom?tr("profil.custom"):`${GOALS.find(g=>g.key===profile.goal)?.protein_per_kg}g/kg`},
                    {key:"carbs",  label:tr("jour.carbs"), val:display.carbs,  color:"#FFB347",base:isCustom?tr("profil.custom"):tr("profil.remainingCals")},
                    {key:"fat",    label:tr("jour.fat"),  val:display.fat,    color:"#FF8C69",base:isCustom?tr("profil.custom"):`${GOALS.find(g=>g.key===profile.goal)?.fat_per_kg}g/kg`},
                  ].map((m,i)=>(
                    <div key={i} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"10px",textAlign:"center"}}>
                      <div style={{fontSize:"18px",fontWeight:"800",color:m.color}}>{m.val}g</div>
                      <div style={{fontSize:"9px",color:C.muted,marginTop:"2px"}}>{m.label}</div>
                      <div style={{fontSize:"8px",color:"#333",marginTop:"2px"}}>{m.base}</div>
                    </div>
                  ))}
                </div>

                {/* Calories totales custom */}
                <div style={{display:"flex",justifyContent:"space-between",fontSize:"11px",padding:"8px 0",borderTop:`1px solid ${C.border}`,marginBottom:"10px"}}>
                  <span style={{color:C.muted}}>{tr("profil.totalCalculated")}</span>
                  <span style={{color:C.gold,fontWeight:"700"}}>{display.protein*4 + display.carbs*4 + display.fat*9} kcal</span>
                </div>

                {/* Formulaire édition manuelle — avec état local pour saisie libre */}
                <MacroEditor targets={targets} custom={custom} onSave={(updated)=>{ saveCustomMacros(updated); setProfile({...profile}); }} />
              </div>
            );
          })()}
        </div>
      )}
    {/* Section compte utilisateur */}
    <div style={{...css.card,marginTop:"4px"}}>
      <div style={css.cardTitle}>{tr("profil.accountTitle")}</div>
      {user ? (
        <>
          <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
            <div style={{width:"36px",height:"36px",borderRadius:"50%",background:"rgba(255,215,0,0.15)",border:`1px solid rgba(255,215,0,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",fontWeight:"700",color:C.gold,flexShrink:0}}>
              {user.email[0].toUpperCase()}
            </div>
            <div>
              <div style={{fontSize:"13px",fontWeight:"600"}}>{user.email}</div>
              <div style={{fontSize:"11px",color:premium?C.green:C.muted}}>{premium?tr("profil.proMember"):tr("profil.free")}</div>
            </div>
          </div>
          <button onClick={()=>{
            localStorage.removeItem("pq_token");
            localStorage.removeItem("pq_refresh_token");
            localStorage.removeItem("pq_email");
            localStorage.removeItem("pq_premium");
            localStorage.removeItem("pq_stripe_session");
            window.location.reload();
          }} style={{...css.btnSec,marginBottom:0,fontSize:"12px",color:"#444"}}>
            {tr("profil.logout")}
          </button>
        </>
      ) : (
        <>
          <div style={{fontSize:"12px",color:"#555",marginBottom:"14px",lineHeight:"1.5"}}>
            {tr("profil.createAccountHint")}
          </div>
          <button style={css.btn(C.gold)} onClick={onShowAuth}>
            {tr("profil.createOrLogin")}
          </button>
        </>
      )}
    </div>

    {/* Section abonnement Pro */}
    {isPremium() && (
      <div style={{...css.card,marginTop:"4px"}}>
        <div style={css.cardTitle}>{tr("profil.subscriptionTitle")}</div>
        <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"14px"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:C.green}}/>
          <span style={{fontSize:"13px",fontWeight:"600",color:C.green}}>{tr("profil.proActive")}</span>
        </div>
        <div style={{fontSize:"12px",color:"#555",marginBottom:"14px",lineHeight:"1.5"}}>
          {tr("profil.proFeatures")}
        </div>
        <a
          href="https://billing.stripe.com/p/login/dRm5kFdx61v70SadROaEE00"
          target="_blank"
          rel="noopener noreferrer"
          style={{...css.btnSec,marginBottom:"4px",display:"block",textDecoration:"none",textAlign:"center"}}>
          {tr("profil.manageSubscription")}
        </a>
        <div style={{fontSize:"11px",color:"#333",textAlign:"center"}}>
          {tr("profil.editCardCancel")}
        </div>
      </div>
    )}

    {/* Section installation PWA */}
    <div style={{...css.card, marginTop:"4px"}}>
      <div style={css.cardTitle}>{tr("profil.installTitle")}</div>
      {(() => {
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
        if (isStandalone) return (
          <div style={{display:"flex",alignItems:"center",gap:"10px",padding:"10px 0"}}>
            <div style={{width:"8px",height:"8px",borderRadius:"50%",background:C.green}}/>
            <span style={{fontSize:"13px",color:C.green,fontWeight:"600"}}>{tr("profil.appInstalled")}</span>
          </div>
        );
        return (
          <>
            <div style={{fontSize:"12px",color:"#666",marginBottom:"14px",lineHeight:"1.5"}}>
              {tr("profil.installHint")}
            </div>
            {isIOS ? (
              <div style={{background:"rgba(255,215,0,0.06)",border:`1px solid rgba(255,215,0,0.15)`,borderRadius:"12px",padding:"14px"}}>
                <div style={{fontSize:"10px",color:C.gold,letterSpacing:"2px",marginBottom:"10px"}}>{tr("profil.onIphoneIpad")}</div>

                {/* Bouton ouvrir dans Safari */}
                <a href="x-safari-https://physiqrate.com"
                  style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",width:"100%",padding:"11px",borderRadius:"10px",background:"linear-gradient(135deg,#FFD700,#FFA500)",color:"#000",fontSize:"13px",fontWeight:"700",textDecoration:"none",marginBottom:"14px",boxSizing:"border-box"}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  {tr("profil.openSafari")}
                </a>

                <div style={{fontSize:"10px",color:"#444",textAlign:"center",marginBottom:"12px"}}>{tr("profil.followSteps")}</div>

                {[
                  tr("profil.stepShare"),
                  tr("profil.stepHomeScreen"),
                  tr("profil.stepAdd"),
                ].map((step, i) => (
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:"10px",marginBottom:"8px"}}>
                    <div style={{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(255,215,0,0.15)",border:`1px solid rgba(255,215,0,0.3)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"10px",color:C.gold,fontWeight:"800",flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:"12px",color:"#aaa",lineHeight:"1.5",paddingTop:"2px"}}>{step}</span>
                  </div>
                ))}
              </div>
            ) : (
              <button
                onClick={()=>{ if(window._pwaInstallPrompt){ window._pwaInstallPrompt.prompt(); } else { alert(tr("profil.installAlert")); } }}
                style={css.btn(C.gold)}>
                {tr("profil.installBtn")}
              </button>
            )}
          </>
        );
      })()}
    </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function AppInner() {
  const [view, setView] = useState("analyser");
  const [premium, setPremiumState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      const sessionId = params.get("session_id");
      if (sessionId) localStorage.setItem("pq_stripe_session", sessionId);
      localStorage.setItem("pq_premium", "true");
      return true;
    }
    return isPremium();
  });
  const [showPaywall, setShowPaywall] = useState(false);
  const [syncVersion, setSyncVersion] = useState(0);
  const [showPWA, setShowPWA] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPostPayment, setShowPostPayment] = useState(false);
  const [postPaymentEmail, setPostPaymentEmail] = useState(null);
  const [emailMismatch, setEmailMismatch] = useState(null); // { paidEmail, currentEmail }
  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("pq_email");
    return email ? { email } : null;
  });

  useEffect(() => {
    // Capture install prompt on Android
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      window._pwaInstallPrompt = e;
      setShowPWA(true);
    });
    // Show banner after 30s on iOS
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;
    const dismissed = localStorage.getItem("pq_pwa_dismissed");
    if (isIOS && !isStandalone && !dismissed) {
      setTimeout(() => setShowPWA(true), 30000);
    }

    // Handle Stripe success redirect
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      const sessionId = params.get("session_id");
      if (sessionId) localStorage.setItem("pq_stripe_session", sessionId);
      // Active le Pro immédiatement
      set(keys.premium, true);
      // Nettoie l'URL sans recharger
      window.history.replaceState({}, "", window.location.pathname);
      // Force re-render propre
      setPremiumState(true);

      // Affiche modal création de compte si pas connecté, ou détecte un email différent si déjà connecté
      const token = localStorage.getItem("pq_token");
      if (sessionId) {
        setTimeout(() => {
          fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          }).then(r=>r.json()).then(data=>{
            const paidEmail = data.email;
            if (!token) {
              // Pas connecté du tout — flux normal de création de compte
              if (paidEmail) {
                setPostPaymentEmail(paidEmail);
                setShowPostPayment(true);
              } else {
                setPostPaymentEmail("unknown");
                setShowPostPayment(true);
              }
              return;
            }
            // Déjà connecté — vérifie que le paiement correspond bien au compte actuel
            const currentEmail = localStorage.getItem("pq_email");
            if (paidEmail && currentEmail && paidEmail.toLowerCase() !== currentEmail.toLowerCase()) {
              setEmailMismatch({ paidEmail, currentEmail });
            }
          }).catch(()=>{
            if (!token) {
              setPostPaymentEmail("unknown");
              setShowPostPayment(true);
            }
          });
        }, 800);
      }
    }
    if (params.get("canceled") === "true") {
      window.history.replaceState({}, "", window.location.pathname);
    }

    // Pull automatique des données si déjà connecté
    const autoSync = async () => {
      const token = localStorage.getItem("pq_token");
      if (!token) return;
      // Vide la queue des données non synchronisées
      await syncFlushQueue();
      const today = new Date().toISOString().slice(0,10);
      try {
        const remote = await syncPull(token, today);
        if (!remote) return;
        let changed = false;
        if (remote.profile) {
          const p = remote.profile;
          const localTs = localStorage.getItem("pq_profile_updated_at");
          const remoteTs = p.updated_at;
          // Supabase est plus récent → écrase le local
          // Si pas de timestamp local → toujours utiliser Supabase
          const useRemote = !localTs || (remoteTs && new Date(remoteTs) > new Date(localTs));
          if (useRemote && (p.gender || p.age || p.weight || p.height)) {
            applyRemoteProfile(p);
            changed = true;
          }
        }
        if (remote.journal) {
          const all = JSON.parse(localStorage.getItem("pq_journal") || "{}");
          const local = all[today] || { meals: [], steps: 0, sessions: [], session: null, water: 0 };
          const localTs = localStorage.getItem(`pq_journal_ts_${today}`);
          const remoteTs = remote.journal.updated_at;
          const useRemote = !localTs || !remote.journal.updated_at || new Date(remoteTs) > new Date(localTs);
          if (useRemote) {
            all[today] = {
              meals: remote.journal.meals?.length >= local.meals?.length ? remote.journal.meals : local.meals || [],
              steps: remote.journal.steps ?? local.steps ?? 0,
              sessions: remote.journal.sessions || local.sessions || [],
              session: remote.journal.session || local.session || null,
              water: remote.journal.water ?? local.water ?? 0
            };
            localStorage.setItem("pq_journal", JSON.stringify(all));
            if (remoteTs) localStorage.setItem(`pq_journal_ts_${today}`, remoteTs);
            changed = true;
          }
        }
        if (remote.analyses?.length > 0) {
          const localHistory = JSON.parse(localStorage.getItem("pq_history") || "[]");
          const merged = [...localHistory];
          for (const a of remote.analyses) {
            const exists = merged.find(h => {
              const hDate = h.date ? h.date.slice(0,10) : "";
              const aDate = a.date ? a.date.slice(0,10) : "";
              return hDate === aDate && h.bodyfat === a.bodyfat;
            });
            if (!exists) {
              merged.push({ date: a.date, bodyfat: a.bodyfat, weight: a.weight, note: a.note, confidence: a.confidence });
              changed = true;
            }
          }
          if (changed) {
            merged.sort((a,b) => (b.date||"").localeCompare(a.date||""));
            localStorage.setItem("pq_history", JSON.stringify(merged.slice(0,100)));
          }
        }
        if (remote.savedFoods?.length > 0) {
          const localFoods = JSON.parse(localStorage.getItem("pq_saved_foods") || "[]");
          const merged = [...localFoods];
          for (const f of remote.savedFoods) {
            if (!merged.find(lf => lf.name?.toLowerCase() === f.name?.toLowerCase())) { 
              merged.push(f); changed = true; 
            }
          }
          if (changed) localStorage.setItem("pq_saved_foods", JSON.stringify(merged.slice(0,50)));
        }
        if (remote.savedSessions?.length > 0) {
          const localSessions = JSON.parse(localStorage.getItem("pq_saved_sessions") || "[]");
          const mergedSessions = [...localSessions];
          for (const s of remote.savedSessions) {
            if (!mergedSessions.find(ls => ls.type === s.type)) { mergedSessions.push(s); changed = true; }
          }
          if (changed) localStorage.setItem("pq_saved_sessions", JSON.stringify(mergedSessions.slice(0,20)));
        }
        // Force re-render APRÈS que toutes les données sont écrites
        if (changed) setSyncVersion(v => v + 1);
      } catch {}
    };
    autoSync();

    // Vérifie le statut Pro via Supabase si connecté
    const verifyPro = async () => {
      const token = localStorage.getItem("pq_token");
      if (!token) {
        // Fallback ancien système session Stripe
        const sessionId = localStorage.getItem("pq_stripe_session");
        if (!sessionId) return;
        try {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId })
          });
          const data = await res.json();
          if (data.active) { setPremium(true); setPremiumState(true); }
        } catch {}
        return;
      }
      try {
        const res = await fetch("/api/me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (data.email) {
          setUser({ email: data.email });
          localStorage.setItem("pq_email", data.email);
          if (data.is_pro) { setPremium(true); setPremiumState(true); }
          else { setPremium(false); setPremiumState(false); }
        } else if (data.error === "account_not_found") {
          // Compte supprimé — déconnecte
          localStorage.removeItem("pq_token");
          localStorage.removeItem("pq_email");
        }
        // Sinon erreur réseau/panne Supabase — on garde la session locale
      } catch {
        // Panne réseau ou Supabase — on garde l'utilisateur connecté en local
        const cachedEmail = localStorage.getItem("pq_email");
        if (cachedEmail) setUser({ email: cachedEmail });
      }
    };
    verifyPro();
  }, []);
  const [daysLeft] = useState(3);

  const profile = getProfile();
  const profileComplete = getProfileCompletion(profile) === 100;

  // Listen for navigate events from child components
  useEffect(() => {
    const handler = (e) => setView(e.detail);
    document.addEventListener("navigate", handler);
    return () => document.removeEventListener("navigate", handler);
  }, []);

  // Admin URL activation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("admin") === "PHYSIQRATE2024") {
      setPremium(true); setPremiumState(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { lang, setLang, tr, trf } = useI18n();
  const tabs = [
    { key: "analyser",    label: tr("nav.analyser") },
    { key: "jour",        label: tr("nav.jour")  },
    { key: "historique",  label: tr("nav.historique") },
    { key: "progression", label: tr("nav.progression") },
    { key: "profil",      label: tr("nav.profil"), dot: !profileComplete },
  ];

  return (
    <div style={css.app}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>

      {showPaywall && (
        <Paywall daysLeft={daysLeft} onClose={()=>setShowPaywall(false)}/>
      )}

      {showPWA && (
        <PWABanner onDismiss={()=>{ setShowPWA(false); localStorage.setItem("pq_pwa_dismissed","1"); }}/>
      )}

      {showAuth && (
        <AuthModal
          onGoToPay={()=>{ setShowAuth(false); setShowPaywall(true); }}
          onSuccess={async ({ email, is_pro, token }) => {
            setUser({ email });
            if (is_pro) {
              setPremium(true); setPremiumState(true);
            } else {
              const sessionId = localStorage.getItem("pq_stripe_session");
              if (sessionId && premium) {
                try {
                  const res = await fetch("/api/auth", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "transfer_pro", email, sessionId })
                  });
                  const data = await res.json();
                  if (data.success) { setPremium(true); setPremiumState(true); }
                } catch {}
              } else {
                setPremium(false); setPremiumState(false);
                localStorage.removeItem("pq_stripe_session");
                localStorage.removeItem("pq_premium");
              }
            }
            // Pull données depuis Supabase
            const today = new Date().toISOString().slice(0,10);
            syncPull(token, today).then(remote => {
              if (!remote) { setShowAuth(false); return; }
              if (remote.profile) {
                const p = remote.profile;
                applyRemoteProfile(p);
              }
              if (remote.journal) {
                const key = "pq_journal_" + today;
                const local = JSON.parse(localStorage.getItem(key) || '{"meals":[],"steps":0,"sessions":[],"water":0}');
                if ((remote.journal.meals?.length || 0) >= (local.meals?.length || 0)) {
                  localStorage.setItem(key, JSON.stringify({
                    meals: remote.journal.meals || [],
                    steps: remote.journal.steps || local.steps || 0,
                    sessions: remote.journal.sessions || local.sessions || [],
                    water: remote.journal.water || local.water || 0
                  }));
                }
              }
              if (remote.analyses?.length > 0) {
                const localHistory = JSON.parse(localStorage.getItem("pq_history") || "[]");
                const merged = [...localHistory];
                for (const a of remote.analyses) {
                  if (!merged.find(h => h.date === a.date && h.bodyfat === a.bodyfat)) {
                    merged.push({ date: a.date, bodyfat: a.bodyfat, weight: a.weight, note: a.note, confidence: a.confidence });
                  }
                }
                merged.sort((a,b) => b.date.localeCompare(a.date));
                localStorage.setItem("pq_history", JSON.stringify(merged.slice(0,100)));
              }
              if (remote.savedFoods?.length > 0) {
                const localFoods = JSON.parse(localStorage.getItem("pq_saved_foods") || "[]");
                const merged = [...localFoods];
                for (const f of remote.savedFoods) {
                  if (!merged.find(lf => lf.name === f.name)) merged.push(f);
                }
                localStorage.setItem("pq_saved_foods", JSON.stringify(merged.slice(0,50)));
              }
              if (remote.savedSessions?.length > 0) {
                const localSessions = JSON.parse(localStorage.getItem("pq_saved_sessions") || "[]");
                const mergedSessions = [...localSessions];
                for (const s of remote.savedSessions) {
                  if (!mergedSessions.find(ls => ls.type === s.type)) mergedSessions.push(s);
                }
                localStorage.setItem("pq_saved_sessions", JSON.stringify(mergedSessions.slice(0,20)));
              }
              setShowAuth(false);
              window.location.reload();
            }).catch(() => setShowAuth(false));
          }}
          onClose={()=>{ if(premium && !localStorage.getItem("pq_token")) return; setShowAuth(false); }}
          blocking={premium && !localStorage.getItem("pq_token")}
        />
      )}

      {showPostPayment && postPaymentEmail && (
        <PostPaymentModal
          email={postPaymentEmail}
          onSuccess={({ email, token }) => {
            setUser({ email });
            setShowPostPayment(false);
            setPostPaymentEmail(null);
          }}
          blocking={premium && !user}
        />
      )}

      {/* Email du paiement différent du compte connecté */}
      {emailMismatch && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#0f0f1a",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"24px",padding:"28px 24px",maxWidth:"380px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"16px"}}>{tr("emailMismatch.title").toUpperCase()}</div>
            <div style={{fontSize:"13px",color:"#aaa",marginBottom:"24px",lineHeight:"1.6"}}>
              {trf("emailMismatch.body",{paidEmail:emailMismatch.paidEmail,currentEmail:emailMismatch.currentEmail})}
            </div>
            <button style={{...css.btn(C.gold),marginBottom:"10px"}} onClick={()=>{
              // Déconnecte le compte actuel puis lance la création/liaison du compte payé
              localStorage.removeItem("pq_token");
              localStorage.removeItem("pq_refresh_token");
              localStorage.removeItem("pq_email");
              localStorage.removeItem("pq_premium");
              setUser(null);
              setPremiumState(false);
              setPostPaymentEmail(emailMismatch.paidEmail);
              setShowPostPayment(true);
              setEmailMismatch(null);
            }}>
              {trf("emailMismatch.switchBtn",{paidEmail:emailMismatch.paidEmail})}
            </button>
            <button style={css.btnSec} onClick={()=>setEmailMismatch(null)}>
              {tr("emailMismatch.keepBtn")}
            </button>
          </div>
        </div>
      )}

      {/* Force connexion si Pro local sans token Supabase */}
      {premium && !localStorage.getItem("pq_token") && !showAuth && !showPostPayment && (
        <div style={{position:"fixed",inset:0,background:"#09090f",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
          <div style={{background:"#0f0f1a",border:`1px solid rgba(255,215,0,0.2)`,borderRadius:"24px",padding:"28px 24px",maxWidth:"380px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:"10px",color:C.gold,letterSpacing:"3px",marginBottom:"16px"}}>COMPTE REQUIS</div>
            <div style={{fontSize:"20px",fontWeight:"800",marginBottom:"8px"}}>Finalise ton inscription</div>
            <div style={{fontSize:"13px",color:"#555",marginBottom:"24px",lineHeight:"1.6"}}>
              Crée ton compte pour accéder à Physiqrate Pro sur tous tes appareils.
            </div>
            <button style={{...css.btn(C.gold),marginBottom:"0"}} onClick={()=>{
              const sessionId = localStorage.getItem("pq_stripe_session");
              if (sessionId) {
                fetch("/api/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ sessionId })
                }).then(r=>r.json()).then(data=>{
                  setPostPaymentEmail(data.email || "unknown");
                  setShowPostPayment(true);
                }).catch(()=>{ setPostPaymentEmail("unknown"); setShowPostPayment(true); });
              } else {
                setPostPaymentEmail("unknown");
                setShowPostPayment(true);
              }
            }}>
              Créer mon compte Pro
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <div style={{width:"100%",maxWidth:"420px",paddingTop:"14px",marginBottom:"16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"12px"}}>
          <Logo/>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            {/* Sélecteur de langue */}
            <button onClick={()=>setLang(lang === "fr" ? "en" : "fr")} title="Language"
              style={{padding:"5px 9px",borderRadius:"20px",border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:"#aaa",fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
              {lang === "fr" ? "FR" : "EN"}
            </button>
            {/* Install icon */}
            {!window.matchMedia("(display-mode: standalone)").matches && !window.navigator.standalone && (
              <button onClick={()=>setShowPWA(true)} title={tr("header.installTitle")}
                style={{width:"32px",height:"32px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:C.gold,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              </button>
            )}
            {/* Auth button */}
            {!user ? (
              <button onClick={()=>setShowAuth(true)}
                style={{padding:"5px 12px",borderRadius:"20px",border:`1px solid ${C.border}`,background:"rgba(255,255,255,0.04)",color:"#aaa",fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit"}}>
                {tr("header.connexion")}
              </button>
            ) : null}
            {/* Pro badge or upgrade */}
            {premium
              ? <div style={{fontSize:"11px",color:C.green,fontWeight:"700",border:`1px solid rgba(125,249,170,0.3)`,padding:"4px 10px",borderRadius:"20px"}}>{tr("header.pro")}</div>
              : <button onClick={()=>setShowPaywall(true)}
                  style={{padding:"5px 12px",borderRadius:"20px",border:`1px solid rgba(255,215,0,0.4)`,background:"rgba(255,215,0,0.08)",color:C.gold,fontSize:"11px",fontWeight:"700",cursor:"pointer",fontFamily:"inherit"}}>
                  {tr("header.premium")}
                </button>
            }
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",gap:"2px",background:"rgba(255,255,255,0.03)",borderRadius:"14px",padding:"4px"}}>
          {tabs.map(tab=>(
            <button key={tab.key} onClick={()=>setView(tab.key)} style={{flex:"0 1 auto",padding:"7px 8px",borderRadius:"10px",border:"none",background:view===tab.key?"rgba(255,215,0,0.15)":"transparent",color:view===tab.key?C.gold:C.muted,fontSize:"11px",fontWeight:"600",cursor:"pointer",fontFamily:"inherit",position:"relative",whiteSpace:"nowrap",textAlign:"center"}}>
              {tab.label}
              {tab.dot && <span style={{position:"absolute",top:"3px",right:"3px",width:"6px",height:"6px",borderRadius:"50%",background:C.red}}/>}
            </button>
          ))}
        </div>
      </div>

      {/* VIEWS */}
      {view === "analyser"    && <ViewAnalyze key={syncVersion} premium={premium}/>}
      {view === "jour"        && <ViewJour key={syncVersion} premium={premium}/>}
      {view === "historique"  && <ViewHistorique key={syncVersion} premium={premium} onShowPaywall={()=>setShowPaywall(true)}/>}
      {view === "progression" && <ViewProgression key={syncVersion} premium={premium} onShowPaywall={()=>setShowPaywall(true)}/>}
      {view === "profil"      && <ViewProfil key={syncVersion} user={user} premium={premium} onShowAuth={()=>setShowAuth(true)} setPremiumState={setPremiumState}/>}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner/>
    </LangProvider>
  );
}
