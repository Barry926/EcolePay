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

function getRequestData(req) {
  if (typeof req.body === 'string') return Object.fromEntries(new URLSearchParams(req.body));
  return req.body || {};
}

function expectsHtml(req) {
  const accept = String(req.headers.accept || '');
  const contentType = String(req.headers['content-type'] || '');
  return accept.includes('text/html') || contentType.includes('application/x-www-form-urlencoded');
}

function redirectToProblem(req, res, message, status = 303) {
  const destination = `${getOrigin(req)}/abonnement/annule?reason=${encodeURIComponent(message)}`;
  res.setHeader('Cache-Control', 'no-store');
  return res.redirect(status, destination);
}

function sendProblem(req, res, status, message) {
  if (expectsHtml(req)) return redirectToProblem(req, res, message);
  return res.status(status).json({ error: message });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendProblem(req, res, 405, 'Méthode non autorisée.');
  }

  const { plan, email, firstName, lastName, phone, schoolId } = getRequestData(req);
  const planConfig = PLANS[plan];
  const apiKey = process.env.CHARIOW_API_KEY;
  const productId = planConfig && (process.env[planConfig.env] || process.env.CHARIOW_PRODUCT_ID);

  if (!apiKey || !productId) {
    return sendProblem(req, res, 503, "Le paiement n'est pas encore configuré. Contactez l'administration EcolePay.");
  }

  const cleanedPhone = String(phone || '').replace(/\D/g, '');
  if (!planConfig || !/^\S+@\S+\.\S+$/.test(String(email || '')) || !firstName?.trim() || !lastName?.trim() || cleanedPhone.length < 8) {
    return sendProblem(req, res, 422, 'Veuillez renseigner un prénom, un nom, un email et un téléphone valides.');
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
      return sendProblem(req, res, response.status >= 400 && response.status < 500 ? 400 : 502, payload?.message || 'Impossible de créer le paiement. Réessayez plus tard.');
    }

    const result = payload?.data;
    if (result?.step === 'payment' && result?.payment?.checkout_url) {
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(303, result.payment.checkout_url);
    }

    if (result?.step === 'completed') {
      res.setHeader('Cache-Control', 'no-store');
      return res.redirect(303, `${getOrigin(req)}/abonnement/succes`);
    }

    if (result?.step === 'already_purchased') {
      return sendProblem(req, res, 409, 'Vous disposez déjà d’un abonnement actif pour ce produit.');
    }

    return sendProblem(req, res, 502, 'Réponse de paiement inattendue. Réessayez plus tard.');
  } catch (error) {
    console.error('Création du checkout Chariow impossible.', error);
    return sendProblem(req, res, 502, 'Erreur de connexion au service de paiement. Réessayez plus tard.');
  }
}
