'use strict';

/*
 * ============================================================
 * NEXWORLD — FIREBASE AUTHENTICATION
 * ============================================================
 *
 * Configuration Web officielle du projet Firebase :
 * NEXWORLD TV / nexworld-tv
 *
 * Ce fichier fonctionne avec les SDK Firebase Compat déjà
 * chargés par index.html.
 *
 * Fonctions :
 * - Connexion
 * - Création de compte
 * - Mot de passe oublié
 * - Déconnexion
 * - Session Firebase
 * - Token Firebase ID pour le backend sécurisé
 * - Xtream sécurisé
 * - Stalker / MAG sécurisé
 *
 * IMPORTANT :
 * - Aucun mot de passe Xtream n'est stocké ici.
 * - La MAC Stalker n'est jamais envoyée dans une URL publique.
 * - Les sources privées nécessitent une connexion NEXWORLD.
 * ============================================================
 */


/* ============================================================
   CONFIGURATION FIREBASE WEB OFFICIELLE
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDyxcMxY0K8XEI_Al-zF1LvlTBapDnbDXQ",
  authDomain: "nexworld-tv.firebaseapp.com",
  projectId: "nexworld-tv",
  storageBucket: "nexworld-tv.firebasestorage.app",
  messagingSenderId: "262610525162",
  appId: "1:262610525162:web:b49643340dcd0fb7bb7093"
};


/* ============================================================
   ÉTAT FIREBASE
   ============================================================ */

let firebaseApp = null;
let firebaseAuth = null;
let firebaseReady = false;


/* ============================================================
   UTILITAIRES
   ============================================================ */

function authErrorMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "");

  if (
    code.includes("api-key-not-valid") ||
    message.toLowerCase().includes("api-key-not-valid")
  ) {
    return "La clé API Firebase utilisée par NEXWORLD est invalide ou n'est pas associée à la bonne application Web.";
  }

  if (
    code.includes("invalid-api-key") ||
    message.toLowerCase().includes("invalid api key")
  ) {
    return "La clé API Firebase est invalide.";
  }

  if (code.includes("invalid-email")) {
    return "Adresse e-mail invalide.";
  }

  if (
    code.includes("user-not-found") ||
    code.includes("invalid-credential")
  ) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }

  if (code.includes("wrong-password")) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }

  if (code.includes("email-already-in-use")) {
    return "Cette adresse e-mail possède déjà un compte NEXWORLD.";
  }

  if (code.includes("weak-password")) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }

  if (code.includes("too-many-requests")) {
    return "Trop de tentatives. Réessayez plus tard.";
  }

  if (code.includes("network-request-failed")) {
    return "Connexion Internet indisponible ou interrompue.";
  }

  if (code.includes("operation-not-allowed")) {
    return "La connexion par e-mail/mot de passe n'est pas activée dans Firebase.";
  }

  if (code.includes("user-disabled")) {
    return "Ce compte NEXWORLD a été désactivé.";
  }

  return message || "Une erreur Firebase est survenue.";
}


function showAuthMessage(message, isError = false) {
  const selectors = [
    "#authStatus",
    "#accountStatus",
    "#loginStatus",
    "#authMessage"
  ];

  let el = null;

  for (const selector of selectors) {
    try {
      el = document.querySelector(selector);
      if (el) break;
    } catch (_) {}
  }

  if (!el) return;

  el.textContent = message || "";
  el.style.display = message ? "block" : "none";

  if (isError) {
    el.style.color = "#fb7185";
  } else {
    el.style.color = "#94a3b8";
  }
}


/* ============================================================
   INITIALISATION FIREBASE
   ============================================================ */

async function initFirebaseAuth() {

  if (firebaseReady && firebaseAuth) {
    return firebaseAuth;
  }

  if (!window.firebase) {
    throw new Error(
      "Firebase n'est pas chargé. Les SDK Firebase doivent être chargés avant firebase-auth.js."
    );
  }

  try {

    /*
     * Si Firebase est déjà initialisé par index.html,
     * on réutilise l'application existante.
     *
     * Sinon, on l'initialise avec la configuration officielle.
     */

    if (window.firebase.apps && window.firebase.apps.length) {
      firebaseApp = window.firebase.app();
    } else {
      firebaseApp = window.firebase.initializeApp(FIREBASE_CONFIG);
    }

    firebaseAuth = window.firebase.auth(firebaseApp);

    firebaseReady = true;

    /*
     * Écoute globale de l'état de connexion.
     */
    firebaseAuth.onAuthStateChanged(function(user) {
      updateAuthUI(user);
    });

    return firebaseAuth;

  } catch (error) {

    console.error("NEXWORLD Firebase initialization:", error);

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   CONNEXION
   ============================================================ */

async function signInNexworld(email, password) {

  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanEmail) {
    throw new Error("Adresse e-mail requise.");
  }

  if (!cleanPassword) {
    throw new Error("Mot de passe requis.");
  }

  try {

    const auth = await initFirebaseAuth();

    const result =
      await auth.signInWithEmailAndPassword(
        cleanEmail,
        cleanPassword
      );

    updateAuthUI(result.user);

    return result.user;

  } catch (error) {

    console.error("NEXWORLD sign-in:", error);

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   CRÉATION DE COMPTE
   ============================================================ */

async function createNexworldAccount(email, password) {

  const cleanEmail = String(email || "").trim();
  const cleanPassword = String(password || "");

  if (!cleanEmail) {
    throw new Error("Adresse e-mail requise.");
  }

  if (!cleanPassword) {
    throw new Error("Mot de passe requis.");
  }

  if (cleanPassword.length < 6) {
    throw new Error(
      "Le mot de passe doit contenir au moins 6 caractères."
    );
  }

  try {

    const auth = await initFirebaseAuth();

    const result =
      await auth.createUserWithEmailAndPassword(
        cleanEmail,
        cleanPassword
      );

    updateAuthUI(result.user);

    return result.user;

  } catch (error) {

    console.error("NEXWORLD create account:", error);

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   MOT DE PASSE OUBLIÉ
   ============================================================ */

async function resetNexworldPassword(email) {

  const cleanEmail = String(email || "").trim();

  if (!cleanEmail) {
    throw new Error("Adresse e-mail requise.");
  }

  try {

    const auth = await initFirebaseAuth();

    await auth.sendPasswordResetEmail(cleanEmail);

    return true;

  } catch (error) {

    console.error("NEXWORLD password reset:", error);

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   DÉCONNEXION
   ============================================================ */

async function signOutNexworld() {

  try {

    const auth = await initFirebaseAuth();

    await auth.signOut();

    updateAuthUI(null);

  } catch (error) {

    console.error("NEXWORLD sign-out:", error);

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   UTILISATEUR ACTUEL
   ============================================================ */

async function getCurrentNexworldUser() {

  const auth = await initFirebaseAuth();

  return auth.currentUser || null;
}


/* ============================================================
   TOKEN FIREBASE ID
   ============================================================ */

async function getNexworldIdToken() {

  const auth = await initFirebaseAuth();

  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "Aucune session NEXWORLD active. Connectez-vous pour utiliser cette source."
    );
  }

  try {

    return await user.getIdToken(true);

  } catch (error) {

    console.error("NEXWORLD ID token:", error);

    throw new Error(
      "Impossible de récupérer le jeton sécurisé NEXWORLD."
    );
  }
}


/* ============================================================
   REQUÊTE BACKEND GÉNÉRIQUE
   ============================================================ */

async function secureBackendRequest(functionName, payload) {

  const token = await getNexworldIdToken();

  const response =
    await fetch(
      "/.netlify/functions/" + functionName,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },

        body: JSON.stringify(payload)
      }
    );

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
    throw new Error(
      "Réponse invalide du backend NEXWORLD."
    );
  }

  if (!response.ok || !data.ok) {

    throw new Error(
      data?.error ||
      "La requête sécurisée NEXWORLD a été refusée."
    );
  }

  return data;
}


/* ============================================================
   XTREAM SÉCURISÉ
   ============================================================ */

async function xtreamSecureRequest(payload) {

  if (!payload || typeof payload !== "object") {
    throw new Error("Requête Xtream invalide.");
  }

  return secureBackendRequest(
    "xtream",
    payload
  );
}


/* ============================================================
   STALKER / MAG SÉCURISÉ
   ============================================================ */

async function stalkerSecureRequest(payload) {

  if (!payload || typeof payload !== "object") {
    throw new Error("Requête Stalker invalide.");
  }

  /*
   * Toutes les actions Stalker passent par le backend :
   *
   * handshake
   * profile
   * categories
   * genres
   * channels
   * create_link
   *
   * La MAC et le portail ne sont donc pas placés
   * dans une URL publique.
   */

  return secureBackendRequest(
    "stalker",
    payload
  );
}


/* ============================================================
   MISE À JOUR DE L'INTERFACE COMPTE
   ============================================================ */

function updateAuthUI(user) {

  /*
   * Bouton Compte éventuel.
   */

  const accountButtons =
    document.querySelectorAll(
      "[data-account-button]"
    );

  accountButtons.forEach(function(button) {

    if (user) {
      button.textContent = "👤 " + (
        user.email || "Compte"
      );
    } else {
      button.textContent = "👤 Compte";
    }

  });


  /*
   * Éléments indiquant l'état de connexion.
   */

  document
    .querySelectorAll("[data-auth-user]")
    .forEach(function(el) {

      if (user) {
        el.textContent =
          user.email || "Compte NEXWORLD";
      } else {
        el.textContent =
          "Aucun compte connecté.";
      }

    });


  /*
   * Éléments réservés aux utilisateurs connectés.
   */

  document
    .querySelectorAll("[data-auth-required]")
    .forEach(function(el) {

      el.style.display =
        user ? "" : "none";

    });


  /*
   * Éléments réservés aux utilisateurs déconnectés.
   */

  document
    .querySelectorAll("[data-auth-guest]")
    .forEach(function(el) {

      el.style.display =
        user ? "none" : "";

    });


  /*
   * Notification globale éventuelle.
   */

  window.dispatchEvent(
    new CustomEvent(
      "nexworld-auth-changed",
      {
        detail: {
          user: user || null,
          connected: Boolean(user)
        }
      }
    )
  );
}


/* ============================================================
   INSTALLATION DU BOUTON COMPTE SI NÉCESSAIRE
   ============================================================ */

function ensureAccountButton() {

  /*
   * Si index.html possède déjà son bouton Compte,
   * on ne crée rien.
   */

  const existing =
    document.querySelector(
      "[data-account-button]"
    );

  if (existing) return;


  /*
   * Recherche d'un bouton existant avec texte Compte.
   */

  const candidates =
    Array.from(
      document.querySelectorAll(
        "button, a"
      )
    );

  const account =
    candidates.find(function(el) {

      return (
        String(el.textContent || "")
          .trim()
          .toLowerCase()
          .includes("compte")
      );

    });

  if (account) {

    account.setAttribute(
      "data-account-button",
      ""
    );

    account.addEventListener(
      "click",
      function() {
        openNexworldAuthPanel();
      }
    );

    return;
  }
}


/* ============================================================
   FENÊTRE DE CONNEXION
   ============================================================ */

function openNexworldAuthPanel() {

  let panel =
    document.getElementById(
      "nexworldAuthPanel"
    );

  if (!panel) {

    panel =
      document.createElement("div");

    panel.id =
      "nexworldAuthPanel";

    panel.style.cssText = `
      position:fixed;
      inset:0;
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:rgba(2,6,23,.78);
      backdrop-filter:blur(18px);
    `;

    panel.innerHTML = `

      <div style="
        width:min(560px,100%);
        max-height:92vh;
        overflow:auto;
        background:#111c31;
        border:1px solid rgba(148,163,184,.20);
        border-radius:28px;
        padding:24px;
        box-shadow:0 25px 80px rgba(0,0,0,.55);
        color:#f8fafc;
      ">

        <div style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:12px;
          margin-bottom:8px;
        ">

          <h2 style="
            margin:0;
            font-size:28px;
          ">
            Connexion sécurisée
          </h2>

          <button
            id="nexworldAuthClose"
            style="
              border:1px solid rgba(148,163,184,.18);
              background:#1e293b;
              color:#f8fafc;
              padding:10px 15px;
              border-radius:14px;
              font-size:15px;
            "
          >
            Fermer
          </button>

        </div>

        <p style="
          margin:0 0 20px;
          color:#94a3b8;
        ">
          Accédez à votre compte NEXWORLD.
        </p>


        <label style="
          display:block;
          margin-bottom:7px;
          color:#94a3b8;
        ">
          Adresse e-mail
        </label>

        <input
          id="nexworldAuthEmail"
          type="email"
          autocomplete="email"
          placeholder="vous@exemple.com"
          style="
            width:100%;
            box-sizing:border-box;
            padding:15px;
            margin-bottom:15px;
            border-radius:16px;
            border:1px solid rgba(148,163,184,.22);
            background:#0b1220;
            color:#f8fafc;
            font-size:16px;
          "
        >


        <label style="
          display:block;
          margin-bottom:7px;
          color:#94a3b8;
        ">
          Mot de passe
        </label>

        <input
          id="nexworldAuthPassword"
          type="password"
          autocomplete="current-password"
          placeholder="Mot de passe"
          style="
            width:100%;
            box-sizing:border-box;
            padding:15px;
            margin-bottom:15px;
            border-radius:16px;
            border:1px solid rgba(148,163,184,.22);
            background:#0b1220;
            color:#f8fafc;
            font-size:16px;
          "
        >


        <button
          id="nexworldLoginButton"
          style="
            width:100%;
            border:0;
            padding:16px;
            border-radius:18px;
            background:#22d3ee;
            color:#03111a;
            font-size:17px;
            font-weight:800;
            margin-bottom:10px;
          "
        >
          Se connecter
        </button>


        <button
          id="nexworldCreateButton"
          style="
            width:100%;
            border:0;
            padding:16px;
            border-radius:18px;
            background:#263957;
            color:#f8fafc;
            font-size:17px;
            font-weight:800;
            margin-bottom:10px;
          "
        >
          Créer un compte
        </button>


        <button
          id="nexworldResetButton"
          style="
            width:100%;
            border:0;
            padding:16px;
            border-radius:18px;
            background:#263957;
            color:#f8fafc;
            font-size:17px;
            font-weight:800;
          "
        >
          Mot de passe oublié
        </button>


        <div
          id="nexworldAuthStatus"
          style="
            display:none;
            margin-top:16px;
            padding:14px;
            border-radius:16px;
            background:#17233a;
            border:1px solid rgba(148,163,184,.16);
            color:#94a3b8;
            line-height:1.5;
          "
        ></div>

      </div>
    `;

    document.body.appendChild(panel);


    panel
      .querySelector("#nexworldAuthClose")
      .addEventListener(
        "click",
        function() {
          panel.remove();
        }
      );


    panel
      .querySelector("#nexworldLoginButton")
      .addEventListener(
        "click",
        async function() {

          const email =
            panel.querySelector(
              "#nexworldAuthEmail"
            ).value;

          const password =
            panel.querySelector(
              "#nexworldAuthPassword"
            ).value;

          const status =
            panel.querySelector(
              "#nexworldAuthStatus"
            );

          try {

            status.style.display = "block";
            status.style.color = "#94a3b8";
            status.textContent =
              "Connexion en cours…";

            await signInNexworld(
              email,
              password
            );

            status.style.color = "#34d399";
            status.textContent =
              "Connexion réussie.";

            setTimeout(
              function() {
                panel.remove();
              },
              700
            );

          } catch (error) {

            status.style.display = "block";
            status.style.color = "#fb7185";
            status.textContent =
              error.message ||
              "Échec de connexion.";

          }

        }
      );


    panel
      .querySelector("#nexworldCreateButton")
      .addEventListener(
        "click",
        async function() {

          const email =
            panel.querySelector(
              "#nexworldAuthEmail"
            ).value;

          const password =
            panel.querySelector(
              "#nexworldAuthPassword"
            ).value;

          const status =
            panel.querySelector(
              "#nexworldAuthStatus"
            );

          try {

            status.style.display = "block";
            status.style.color = "#94a3b8";
            status.textContent =
              "Création du compte…";

            await createNexworldAccount(
              email,
              password
            );

            status.style.color = "#34d399";
            status.textContent =
              "Compte NEXWORLD créé.";

          } catch (error) {

            status.style.display = "block";
            status.style.color = "#fb7185";
            status.textContent =
              error.message ||
              "Impossible de créer le compte.";

          }

        }
      );


    panel
      .querySelector("#nexworldResetButton")
      .addEventListener(
        "click",
        async function() {

          const email =
            panel.querySelector(
              "#nexworldAuthEmail"
            ).value;

          const status =
            panel.querySelector(
              "#nexworldAuthStatus"
            );

          try {

            status.style.display = "block";
            status.style.color = "#94a3b8";
            status.textContent =
              "Envoi du lien de réinitialisation…";

            await resetNexworldPassword(
              email
            );

            status.style.color = "#34d399";
            status.textContent =
              "Le lien de réinitialisation a été envoyé.";

          } catch (error) {

            status.style.display = "block";
            status.style.color = "#fb7185";
            status.textContent =
              error.message ||
              "Impossible d'envoyer le lien.";

          }

        }
      );

  }

  panel.style.display = "flex";

  initFirebaseAuth()
    .then(function() {

      const user =
        firebaseAuth?.currentUser || null;

      updateAuthUI(user);

    })
    .catch(function(error) {

      const status =
        panel.querySelector(
          "#nexworldAuthStatus"
        );

      if (status) {

        status.style.display = "block";
        status.style.color = "#fb7185";
        status.textContent =
          error.message ||
          "Firebase indisponible.";

      }

    });
}


/* ============================================================
   INITIALISATION AUTOMATIQUE
   ============================================================ */

async function bootstrapNexworldAuth() {

  try {

    await initFirebaseAuth();

    ensureAccountButton();

    updateAuthUI(
      firebaseAuth?.currentUser || null
    );

  } catch (error) {

    console.error(
      "NEXWORLD Firebase Auth:",
      error
    );

    /*
     * On ne bloque PAS la TV publique si Firebase
     * rencontre un problème.
     */

  }
}


/* ============================================================
   API PUBLIQUE NEXWORLD
   ============================================================ */

window.NEXWORLD_AUTH = {

  initFirebaseAuth,

  signInNexworld,

  createNexworldAccount,

  resetNexworldPassword,

  signOutNexworld,

  getCurrentNexworldUser,

  getNexworldIdToken,

  xtreamSecureRequest,

  stalkerSecureRequest

};


/* ============================================================
   LANCEMENT
   ============================================================ */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    bootstrapNexworldAuth
  );

} else {

  bootstrapNexworldAuth();

}
