const admin = require('firebase-admin');

let firebaseApp = null;

/**
 * Initialise Firebase Admin une seule fois par instance Netlify.
 */
function getFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '')
    .replace(/\\n/g, '\n');

  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID manquant.');
  }

  if (!clientEmail) {
    throw new Error('FIREBASE_CLIENT_EMAIL manquant.');
  }

  if (!privateKey) {
    throw new Error('FIREBASE_PRIVATE_KEY manquant.');
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return firebaseApp;
}

/**
 * En-têtes CORS.
 */
function cors(event) {
  const origin =
    event?.headers?.origin ||
    event?.headers?.Origin ||
    '';

  const allowedOrigins = new Set([
    'https://nexworldtv.netlify.app'
  ]);

  const allowedOrigin = allowedOrigins.has(origin)
    ? origin
    : 'https://nexworldtv.netlify.app';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization',
    'Access-Control-Allow-Methods':
      'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type':
      'application/json; charset=utf-8'
  };
}

/**
 * Réponse Netlify standardisée.
 */
function response(event, statusCode, body) {
  return {
    statusCode,
    headers: cors(event),
    body: JSON.stringify(body)
  };
}

/**
 * Vérifie le jeton Firebase envoyé par NEXWORLD.
 */
async function requireUser(event) {
  const authorization =
    event?.headers?.authorization ||
    event?.headers?.Authorization ||
    '';

  if (!authorization.startsWith('Bearer ')) {
    const error = new Error(
      'Authentification Firebase requise.'
    );

    error.statusCode = 401;
    throw error;
  }

  const token = authorization
    .slice(7)
    .trim();

  if (!token) {
    const error = new Error(
      'Jeton Firebase manquant.'
    );

    error.statusCode = 401;
    throw error;
  }

  const decodedToken = await admin
    .auth(getFirebaseAdmin())
    .verifyIdToken(token);

  return decodedToken;
}

/**
 * Retourne le rôle de l'utilisateur.
 */
function roleOf(user) {
  if (!user) {
    return 'user';
  }

  if (user.role) {
    return user.role;
  }

  if (user.adminRole) {
    return user.adminRole;
  }

  if (user.superadmin === true) {
    return 'superadmin';
  }

  return 'user';
}

/**
 * Vérifie qu'un utilisateur possède l'un
 * des rôles autorisés.
 */
function requireRole(user, roles) {
  const role = roleOf(user);

  if (!roles.includes(role)) {
    const error = new Error(
      'Droits insuffisants.'
    );

    error.statusCode = 403;
    throw error;
  }

  return role;
}

module.exports = {
  admin,
  getFirebaseAdmin,
  response,
  requireUser,
  roleOf,
  requireRole
};
