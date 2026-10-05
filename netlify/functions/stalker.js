/**
 * NEXWORLD — Stalker / MAG backend connector V1
 *
 * Actions :
 *   handshake
 *   profile
 *   categories
 *   channels
 *   genres
 *   create_link
 *
 * IMPORTANT :
 * - Utiliser uniquement avec un portail auquel vous êtes autorisé à accéder.
 * - La MAC n'est jamais renvoyée dans une URL publique.
 * - Le token/cookie Stalker reste côté backend pendant la requête.
 *
 * Variables Netlify :
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 *
 * Le client doit envoyer :
 *   Authorization: Bearer <Firebase ID token>
 */

const crypto = require("crypto");

const ALLOWED_ACTIONS = new Set([
  "handshake",
  "profile",
  "categories",
  "channels",
  "genres",
  "create_link"
]);

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST, OPTIONS"
    },
    body: JSON.stringify(body)
  };
}

function required(value, label) {
  const v = String(value ?? "").trim();

  if (!v) {
    throw new Error(`${label} manquant.`);
  }

  return v;
}

function cleanPortal(value) {
  let portal = String(value || "").trim();

  if (!portal) {
    throw new Error("Portail Stalker manquant.");
  }

  if (!/^https?:\/\//i.test(portal)) {
    portal = "http://" + portal;
  }

  return portal.replace(/\/+$/, "");
}

function cleanMac(value) {
  const mac = String(value || "")
    .trim()
    .toUpperCase()
    .replace(/-/g, ":");

  if (!/^[0-9A-F]{2}(?::[0-9A-F]{2}){5}$/.test(mac)) {
    throw new Error(
      "Adresse MAC invalide. Exemple : 00:1A:79:12:34:56"
    );
  }

  return mac;
}

/**
 * Firebase Admin
 *
 * On charge firebase-admin uniquement au moment nécessaire.
 * Cela évite de casser le chargement de la fonction si les variables
 * d'environnement ne sont pas encore présentes.
 */
let firebaseAdmin = null;

async function getFirebaseAdmin() {
  if (firebaseAdmin) {
    return firebaseAdmin;
  }

  let admin;

  try {
    admin = require("firebase-admin");
  } catch {
    throw new Error(
      "firebase-admin n'est pas installé dans les dépendances Netlify."
    );
  }

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = String(
      process.env.FIREBASE_PRIVATE_KEY || ""
    ).replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Configuration Firebase Admin absente dans Netlify."
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    });
  }

  firebaseAdmin = admin;
  return admin;
}

async function verifyFirebaseToken(event) {
  const authorization =
    event.headers?.authorization ||
    event.headers?.Authorization ||
    "";

  if (!authorization.startsWith("Bearer ")) {
    throw new Error(
      "Authentification NEXWORLD requise."
    );
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    throw new Error(
      "Token Firebase manquant."
    );
  }

  const admin = await getFirebaseAdmin();

  try {
    return await admin.auth().verifyIdToken(token);
  } catch {
    throw new Error(
      "Session NEXWORLD invalide ou expirée."
    );
  }
}

/**
 * Construction des URLs Stalker.
 *
 * Les portails peuvent avoir plusieurs chemins selon leur
 * installation. On essaie d'abord /server/load.php.
 */
function endpointCandidates(portal) {
  return [
    `${portal}/server/load.php`,
    `${portal}/stalker_portal/server/load.php`,
    `${portal}/portal.php`
  ];
}

/**
 * Génère un User-Agent de type STB/MAG.
 */
function stbHeaders(mac, token = "") {
  const headers = {
    "Accept": "*/*",
    "User-Agent":
      "Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 MAG200"
  };

  headers["X-User-Agent"] =
    "Model: MAG250; Link: Ethernet";

  headers["Cookie"] =
    `mac=${encodeURIComponent(mac)};`;

  if (token) {
    headers["Authorization"] =
      `Bearer ${token}`;
  }

  return headers;
}

/**
 * Certaines installations Stalker attendent le MAC dans
 * l'en-tête Cookie et X-User-Agent.
 */
function buildRequestHeaders(mac, token = "") {
  const headers = stbHeaders(mac, token);

  headers["Cookie"] =
    `mac=${mac}; stb_lang=en; timezone=GMT`;

  return headers;
}

async function fetchStalker(
  endpoint,
  params,
  mac,
  token = "",
  options = {}
) {
  const url =
    `${endpoint}?${new URLSearchParams(params).toString()}`;

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, options.timeout || 20000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: buildRequestHeaders(mac, token),
      redirect: "follow",
      signal: controller.signal
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `Portail Stalker HTTP ${response.status}.`
      );
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        "Le portail Stalker a retourné une réponse non JSON."
      );
    }

    return {
      data,
      response,
      endpoint
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "Le portail Stalker ne répond pas dans le délai prévu."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Handshake Stalker.
 *
 * Réponse généralement :
 * {
 *   js: {
 *      token: "...",
 *      random: "..."
 *   }
 * }
 */
async function handshake(portal, mac) {
  let lastError = null;

  for (const endpoint of endpointCandidates(portal)) {
    try {
      const result = await fetchStalker(
        endpoint,
        {
          type: "stb",
          action: "handshake",
          token: "",
          JsHttpRequest: "1-xml"
        },
        mac
      );

      const token =
        result.data?.js?.token ||
        result.data?.token ||
        "";

      if (token) {
        return {
          endpoint,
          token,
          random:
            result.data?.js?.random ||
            result.data?.random ||
            null
        };
      }

      lastError = new Error(
        "Handshake reçu sans token."
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(
      "Impossible d'effectuer le handshake Stalker."
    )
  );
}

/**
 * Obtient le profil du terminal.
 */
async function getProfile(
  endpoint,
  mac,
  token
) {
  const result = await fetchStalker(
    endpoint,
    {
      type: "stb",
      action: "get_profile",
      token,
      JsHttpRequest: "1-xml"
    },
    mac,
    token
  );

  return result.data;
}

/**
 * Catégories de télévision.
 */
async function getCategories(
  endpoint,
  mac,
  token
) {
  const result = await fetchStalker(
    endpoint,
    {
      type: "itv",
      action: "get_genres",
      token,
      JsHttpRequest: "1-xml"
    },
    mac,
    token
  );

  return result.data;
}

/**
 * Liste des chaînes.
 *
 * Stalker varie selon les versions :
 * get_all_channels
 * ou get_ordered_list
 */
async function getChannels(
  endpoint,
  mac,
  token,
  category = "*",
  page = 1
) {
  let lastError = null;

  const attempts = [
    {
      type: "itv",
      action: "get_all_channels",
      token,
      genre: category,
      p: page,
      JsHttpRequest: "1-xml"
    },
    {
      type: "itv",
      action: "get_ordered_list",
      token,
      genre: category,
      p: page,
      JsHttpRequest: "1-xml"
    }
  ];

  for (const params of attempts) {
    try {
      const result = await fetchStalker(
        endpoint,
        params,
        mac,
        token
      );

      const data = result.data;

      if (
        data &&
        (
          Array.isArray(data.js) ||
          Array.isArray(data)
        )
      ) {
        return data;
      }

      if (data?.js) {
        return data;
      }

      lastError = new Error(
        "Réponse catalogue Stalker inattendue."
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(
      "Impossible de récupérer les chaînes Stalker."
    )
  );
}

/**
 * Génération du lien de lecture.
 *
 * Selon le portail, create_link peut accepter :
 *   cmd
 *   stream_id
 *   forced_storage
 */
async function createLink(
  endpoint,
  mac,
  token,
  streamId
) {
  const id = required(
    streamId,
    "Identifiant de chaîne"
  );

  const attempts = [
    {
      type: "itv",
      action: "create_link",
      token,
      cmd: id,
      stream_id: id,
      JsHttpRequest: "1-xml"
    },
    {
      type: "itv",
      action: "create_link",
      token,
      cmd: id,
      JsHttpRequest: "1-xml"
    }
  ];

  let lastError = null;

  for (const params of attempts) {
    try {
      const result = await fetchStalker(
        endpoint,
        params,
        mac,
        token
      );

      const data = result.data;

      const cmd =
        data?.js?.cmd ||
        data?.cmd ||
        data?.js?.stream_url ||
        data?.stream_url ||
        "";

      if (cmd) {
        return {
          ...data,
          _playUrl: cmd
        };
      }

      lastError = new Error(
        "Le portail n'a pas fourni de lien de lecture."
      );
    } catch (error) {
      lastError = error;
    }
  }

  throw (
    lastError ||
    new Error(
      "Impossible de créer le lien de lecture."
    )
  );
}

/**
 * Petite empreinte non réversible utilisée uniquement pour
 * identifier une session dans les logs sans écrire la MAC.
 */
function fingerprint(value) {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex")
    .slice(0, 16);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(204, {});
  }

  if (event.httpMethod !== "POST") {
    return json(405, {
      ok: false,
      error: "Méthode POST obligatoire."
    });
  }

  let body;

  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, {
      ok: false,
      error: "Corps JSON invalide."
    });
  }

  try {
    /**
     * Authentification NEXWORLD obligatoire.
     */
    const firebaseUser =
      await verifyFirebaseToken(event);

    const action =
      required(body.action, "Action");

    if (!ALLOWED_ACTIONS.has(action)) {
      throw new Error(
        `Action Stalker non autorisée : ${action}`
      );
    }

    const portal =
      cleanPortal(body.portal);

    const mac =
      cleanMac(body.mac);

    console.log(
      "NEXWORLD Stalker request",
      {
        uid: firebaseUser.uid,
        action,
        mac: fingerprint(mac)
      }
    );

    /**
     * Pour l'instant, chaque opération effectue un handshake.
     *
     * C'est volontaire pour la V1 :
     * - pas de token persistant dans le navigateur
     * - pas de cookie persistant
     * - pas de session Stalker exposée au client
     *
     * Nous pourrons ajouter un cache serveur sécurisé
     * dans une V2 si nécessaire.
     */
    const session =
      await handshake(portal, mac);

    let data = null;

    switch (action) {
      case "handshake":
        data = {
          connected: true,
          endpoint: session.endpoint,
          tokenReceived: Boolean(session.token)
        };
        break;

      case "profile":
        data = await getProfile(
          session.endpoint,
          mac,
          session.token
        );
        break;

      case "categories":
      case "genres":
        data = await getCategories(
          session.endpoint,
          mac,
          session.token
        );
        break;

      case "channels":
        data = await getChannels(
          session.endpoint,
          mac,
          session.token,
          body.category || "*",
          Number(body.page || 1)
        );
        break;

      case "create_link":
        data = await createLink(
          session.endpoint,
          mac,
          session.token,
          body.stream_id || body.cmd
        );
        break;

      default:
        throw new Error(
          "Action Stalker non implémentée."
        );
    }

    return json(200, {
      ok: true,
      action,
      data
    });
  } catch (error) {
    console.error(
      "NEXWORLD Stalker:",
      error?.message || error
    );

    const message =
      error?.message ||
      "Erreur Stalker inconnue.";

    const status =
      /authentification|session.*invalide|token.*firebase/i.test(
        message
      )
        ? 401
        : 400;

    return json(status, {
      ok: false,
      error: message
    });
  }
};
