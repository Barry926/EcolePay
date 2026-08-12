# Déploiement Chariow — EcolePay CI

L’intégration applique le checkout et la validation de licence côté serveur. La clé API Chariow ne doit jamais être ajoutée aux fichiers `src/`, aux variables `VITE_*`, ni à Git. Les endpoints utilisent l’authentification Bearer documentée par Chariow et sont prévus pour les fonctions Vercel. [1] [2]

| Variable Vercel | Valeur à définir | Rôle |
|---|---|---|
| `CHARIOW_API_KEY` | La clé privée Chariow fournie hors dépôt | Authentifie les appels serveur à Chariow. |
| `CHARIOW_PRODUCT_ID` | L’identifiant du produit de test fourni | Produit de repli temporaire pour les trois plans. |
| `CHARIOW_PRODUCT_ID_STARTER` | Facultatif | Produit propre à la formule Starter lorsque disponible. |
| `CHARIOW_PRODUCT_ID_STANDARD` | Facultatif | Produit propre à la formule Standard lorsque disponible. |
| `CHARIOW_PRODUCT_ID_PREMIUM` | Facultatif | Produit propre à la formule Premium lorsque disponible. |
| `APP_ORIGIN` | L’URL HTTPS publique d’EcolePay | Construit l’URL de redirection `/abonnement/succes`. |

Sur Vercel, ajoutez ces valeurs dans **Project Settings → Environment Variables** pour les environnements de prévisualisation et de production, puis déclenchez un nouveau déploiement. L’endpoint `POST /api/subscribe` crée une session de checkout et retourne exclusivement l’URL sécurisée de paiement au navigateur. [2]

Après le paiement, Chariow redirige vers `/abonnement/succes`. La clé de licence reçue par email doit être renseignée dans **Paramètres École → Abonnement EcolePay CI**. Elle est contrôlée par `POST /api/validate-license`, qui appelle la route de licence depuis le serveur, vérifie `is_active` et `is_expired`, puis n’enregistre dans Firestore qu’une version masquée de la clé ainsi que le statut et l’échéance. [3] [4]

> **Important :** la page de succès confirme le retour du checkout mais n’accorde pas à elle seule une licence. L’accès est activé après validation de la clé reçue. Cela évite de considérer une simple redirection navigateur comme une preuve de paiement.

Pour automatiser ultérieurement l’activation sans ressaisie de clé, configurez un webhook **Pulse** Chariow vers une fonction serveur dédiée. Cette fonction devra vérifier la signature HMAC-SHA256 sur le corps brut et dédupliquer chaque livraison avec `x-pulse-delivery-id` avant toute mise à jour de Firestore. [5]

## Contrôles réalisés

| Contrôle | Résultat |
|---|---|
| Vérification TypeScript | Réussie avec `pnpm lint`. |
| Construction de production | Réussie avec `pnpm build`. |
| Syntaxe des endpoints | Validée avec `node --check`. |
| Test contractuel mocké des endpoints | Réussi : checkout valide/invalide et licences active/expirée. |
| Exposition d’une clé Chariow dans le dépôt | Aucun motif de clé trouvé. |

La construction émet un avertissement de taille de bundle pour le JavaScript principal, sans empêcher la production. Une optimisation ultérieure peut charger les écrans d’abonnement et certaines bibliothèques à la demande.

## Références

[1]: https://chariow.dev/api-reference/introduction.md "Chariow API — Introduction"
[2]: https://chariow.dev/api-reference/checkout/init-checkout.md "Chariow API — Init checkout"
[3]: https://chariow.dev/en/guides/saas-license-integration.md "Chariow — SaaS licence integration"
[4]: https://chariow.dev/api-reference/licenses/get-license.md "Chariow API — Get a licence"
[5]: https://chariow.dev/en/guides/pulse-security.md "Chariow Pulse — Security"
