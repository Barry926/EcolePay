const LICENSE_KEY_PATTERN = /^[A-Za-z0-9_-]{4,128}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ valid: false, error: 'Méthode non autorisée.' });
  }

  const apiKey = process.env.CHARIOW_API_KEY;
  const licenseKey = String(req.body?.licenseKey || '').trim();

  if (!apiKey) {
    return res.status(503).json({ valid: false, error: "La validation d'abonnement n'est pas encore configurée." });
  }
  if (!LICENSE_KEY_PATTERN.test(licenseKey)) {
    return res.status(422).json({ valid: false, error: 'Format de clé de licence invalide.' });
  }

  try {
    const response = await fetch(`https://api.chariow.com/v1/licenses/${encodeURIComponent(licenseKey)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (response.status === 404) {
      return res.status(200).json({ valid: false, error: 'Licence introuvable.' });
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(502).json({ valid: false, error: 'Impossible de vérifier la licence. Réessayez plus tard.' });
    }

    const license = payload?.data;
    if (!license?.is_active || license?.is_expired) {
      return res.status(200).json({ valid: false, error: 'Licence expirée ou inactive. Veuillez renouveler votre abonnement.' });
    }

    return res.status(200).json({
      valid: true,
      license: {
        status: license.status,
        expiresAt: license.expires_at || null,
        productName: license.product?.name || null,
      },
    });
  } catch (error) {
    console.error('Validation Chariow impossible.', error);
    return res.status(502).json({ valid: false, error: 'Erreur de connexion au service de licences. Réessayez plus tard.' });
  }
}
