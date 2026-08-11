# Test Credentials — EcolePay CI

## Accès rapide (recommandé pour les tests)
Aucun identifiant requis. Sur la page de connexion, cliquer sur le bouton :
**"Accès Instantané Direct (Mode Directeur / Caisse)"**
→ Ouvre le tableau de bord en mode démo (données de démonstration préchargées).

Sélecteur : `page.get_by_text("Accès Instantané")` ou le bouton contenant ce texte.

## Connexion e-mail (Firebase)
Firebase n'a pas de clés valides dans cet environnement de preview. Toute tentative
de connexion e-mail bascule automatiquement (après ~5s de timeout) sur le mode démo local.
Pour tester, préférer le bouton d'accès instantané ci-dessus.

## Notes
- Le thème (clair/sombre) est mémorisé dans localStorage sous la clé `ecolepay-theme`.
