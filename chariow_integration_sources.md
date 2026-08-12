# Sources officielles Chariow vérifiées — 12 août 2026

- Documentation API générale : https://chariow.dev/api-reference/introduction.md. Elle confirme l’API REST `https://api.chariow.com/v1`, l’authentification Bearer et le format de réponse `{ message, data, errors }`.
- Checkout : https://chariow.dev/api-reference/checkout/init-checkout.md. Le checkout utilise `POST /v1/checkout`; le résultat attendu se trouve dans `data.step`, avec `data.payment.checkout_url` lorsque l’étape vaut `payment`. Il accepte notamment `product_id`, identité client, téléphone CI, URL de redirection et métadonnées.
- Licence SaaS : https://chariow.dev/en/guides/saas-license-integration.md. La validation recommandée se fait côté serveur via `GET /v1/licenses/{licenseKey}` avec une clé API gardée exclusivement dans les variables d’environnement. La validité est déterminée par `is_active` et `is_expired`.
- Référence licence : https://chariow.dev/api-reference/licenses/get-license.md. Elle documente `expires_at`, `status`, `is_active` et `is_expired` renvoyés par une licence.
- Sécurité des webhooks Pulse : https://chariow.dev/en/guides/pulse-security.md. Les webhooks sont signés en HMAC-SHA256 sur le corps brut et doivent être dédupliqués par l’en-tête `x-pulse-delivery-id`.

Les endpoints créés dans ce projet reprennent ces contrats mais ne contiennent aucune clé Chariow en dur. L’activation production impose des variables d’environnement privées sur Vercel et, pour une activation automatique à la réception du paiement, la configuration ultérieure d’un Pulse Chariow avec son secret dédié.
