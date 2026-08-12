const PLANS = {
  starter: { label: 'Starter', env: 'CHARIOW_PRODUCT_ID_STARTER' },
  standard: { label: 'Standard', env: 'CHARIOW_PRODUCT_ID_STANDARD' },
  premium: { label: 'Premium', env: 'CHARIOW_PRODUCT_ID_PREMIUM' },
};

function getOrigin(req) {
  if (process.env.APP_ORIGIN) return process.env.APP_ORIGIN.replace(/\/$/, '');
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  return `${protocol}://${req.headers.host}`;
}

function readBuyerIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return undefined;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const { plan, email, firstName, lastName, phone, schoolId } = req.body || {};
  const planConfig = PLANS[plan];
  const apiKey = process.env.CHARIOW_API_KEY;
  const productId = planConfig && (process.env[planConfig.env] || process.env.CHARIOW_PRODUCT_ID);

  if (!apiKey || !productId) {
    return res.status(503).json({ error: "Le paiement n'est pas encore configuré. Contactez l'administration EcolePay." });
  }

  const cleanedPhone = String(phone || '').replace(/\D/g, '');
  if (!planConfig || !/^\S+@\S+\.\S+$/.test(String(email || '')) || !firstName?.trim() || !lastName?.trim() || cleanedPhone.length < 8) {
    return res.status(422).json({ error: 'Veuillez renseigner un prénom, un nom, un email et un téléphone valides.' });
  }

  try {
    const response = await fetch('https://api.chariow.com/v1/checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        email: String(email).trim().toLowerCase(),
        first_name: String(firstName).trim().slice(0, 50),
        last_name: String(lastName).trim().slice(0, 50),
        phone: { number: cleanedPhone, country_code: 'CI' },
        redirect_url: `${getOrigin(req)}/abonnement/succes`,
        customer_ip: readBuyerIp(req),
        custom_metadata: {
          plan: planConfig.label,
          school_id: String(schoolId || '').slice(0, 100),
          source: 'ecolepay_ci',
        },
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status >= 400 && response.status < 500 ? 400 : 502).json({
        error: payload?.message || 'Impossible de créer le paiement. Réessayez plus tard.',
      });
    }

    const result = payload?.data;
    if (result?.step === 'payment' && result?.payment?.checkout_url) {
      return res.status(200).json({
        checkoutUrl: result.payment.checkout_url,
        saleId: result.purchase?.id || null,
      });
    }

    if (result?.step === 'completed') {
      return res.status(200).json({ completed: true, saleId: result.purchase?.id || null });
    }

    if (result?.step === 'already_purchased') {
      return res.status(409).json({ error: 'Vous disposez déjà d’un abonnement actif pour ce produit.' });
    }

    return res.status(502).json({ error: 'Réponse de paiement inattendue. Réessayez plus tard.' });
  } catch (error) {
    console.error('Création du checkout Chariow impossible.', error);
    return res.status(502).json({ error: 'Erreur de connexion au service de paiement. Réessayez plus tard.' });
  }
}
