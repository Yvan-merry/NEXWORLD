const {
  getFirebaseAdmin,
  response,
  requireUser
} = require('./_firebase');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return response(event, 204, {});
  }

  if (event.httpMethod !== 'POST') {
    return response(event, 405, {
      ok: false,
      error: 'Méthode POST obligatoire.'
    });
  }

  try {
    const user = await requireUser(event);

    const ownerEmail =
      (process.env.NEXWORLD_OWNER_EMAIL || '')
        .trim()
        .toLowerCase();

    if (!ownerEmail) {
      return response(event, 500, {
        ok: false,
        error: 'NEXWORLD_OWNER_EMAIL non configuré.'
      });
    }

    if (
      !user.email ||
      user.email.toLowerCase() !== ownerEmail
    ) {
      return response(event, 403, {
        ok: false,
        error: 'Ce compte n’est pas autorisé comme propriétaire NEXWORLD.'
      });
    }

    const admin = getFirebaseAdmin();

    await admin.auth().setCustomUserClaims(user.uid, {
      role: 'superadmin',
      admin: true
    });

    return response(event, 200, {
      ok: true,
      role: 'superadmin',
      message: 'Compte Super Administrateur activé.'
    });

  } catch (error) {
    return response(event, error.statusCode || 500, {
      ok: false,
      error: error.message || 'Erreur serveur.'
    });
  }
};
