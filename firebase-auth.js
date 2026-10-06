'use strict';

/*
 * ============================================================
 * NEXWORLD — FIREBASE AUTH + COMPTE
 * ============================================================
 *
 * Projet Firebase :
 *   nexworld-tv
 *
 * Ce fichier est chargé à la fin de index.html.
 * Les SDK Firebase Compat sont déjà chargés par index.html.
 *
 * Fonctions :
 *   - Bouton Compte toujours disponible
 *   - Connexion
 *   - Création de compte
 *   - Mot de passe oublié
 *   - Déconnexion
 *   - Session Firebase
 *   - Token Firebase ID
 *   - Xtream sécurisé
 *   - Stalker / MAG sécurisé
 *   - Activation Super Admin
 *
 * IMPORTANT :
 *   - Aucun mot de passe Xtream n'est stocké ici.
 *   - Aucun token Stalker n'est stocké côté navigateur.
 *   - Stalker/MAG et Xtream nécessitent une session NEXWORLD.
 *   - Le catalogue TV mondial reste public.
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
   ÉTAT
   ============================================================ */

let firebaseApp = null;
let firebaseAuth = null;
let firebaseReady = false;
let authPanel = null;


/* ============================================================
   OUTILS
   ============================================================ */

function authErrorMessage(error) {

  const code =
    String(error?.code || '').toLowerCase();

  const message =
    String(error?.message || '');

  if (
    code.includes('api-key-not-valid') ||
    message.toLowerCase().includes('api-key-not-valid')
  ) {
    return "La clé API Firebase utilisée par NEXWORLD est invalide ou n'est pas associée à la bonne application Web.";
  }

  if (
    code.includes('invalid-api-key') ||
    message.toLowerCase().includes('invalid api key')
  ) {
    return "La clé API Firebase est invalide.";
  }

  if (code.includes('invalid-email')) {
    return "Adresse e-mail invalide.";
  }

  if (
    code.includes('invalid-credential') ||
    code.includes('user-not-found') ||
    code.includes('wrong-password')
  ) {
    return "Adresse e-mail ou mot de passe incorrect.";
  }

  if (code.includes('email-already-in-use')) {
    return "Cette adresse e-mail possède déjà un compte NEXWORLD.";
  }

  if (code.includes('weak-password')) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }

  if (code.includes('too-many-requests')) {
    return "Trop de tentatives. Réessayez plus tard.";
  }

  if (code.includes('network-request-failed')) {
    return "Connexion Internet indisponible ou interrompue.";
  }

  if (code.includes('operation-not-allowed')) {
    return "La connexion par e-mail et mot de passe n'est pas activée dans Firebase.";
  }

  if (code.includes('user-disabled')) {
    return "Ce compte NEXWORLD a été désactivé.";
  }

  return message || "Une erreur Firebase est survenue.";
}


function escapeHTML(value) {

  return String(value ?? '').replace(
    /[&<>"']/g,
    function(char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    }
  );
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
      "Firebase n'est pas chargé."
    );
  }

  try {

    /*
     * Si index.html ou un autre module a déjà initialisé
     * Firebase, on réutilise cette application.
     */

    if (
      window.firebase.apps &&
      window.firebase.apps.length > 0
    ) {

      firebaseApp =
        window.firebase.app();

    } else {

      firebaseApp =
        window.firebase.initializeApp(
          FIREBASE_CONFIG
        );
    }


    firebaseAuth =
      window.firebase.auth(
        firebaseApp
      );


    firebaseReady = true;


    /*
     * Une seule écoute globale de la session.
     */

    firebaseAuth.onAuthStateChanged(
      function(user) {

        updateAccountButton(user);
        updateAuthPanel(user);

        window.dispatchEvent(
          new CustomEvent(
            'nexworld-auth-changed',
            {
              detail: {
                user: user || null,
                connected: Boolean(user)
              }
            }
          )
        );
      }
    );


    return firebaseAuth;

  } catch (error) {

    console.error(
      'NEXWORLD Firebase initialization:',
      error
    );

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   CONNEXION
   ============================================================ */

async function signInNexworld(
  email,
  password
) {

  const cleanEmail =
    String(email || '').trim();

  const cleanPassword =
    String(password || '');

  if (!cleanEmail) {
    throw new Error(
      "Adresse e-mail requise."
    );
  }

  if (!cleanPassword) {
    throw new Error(
      "Mot de passe requis."
    );
  }

  try {

    const auth =
      await initFirebaseAuth();

    const result =
      await auth.signInWithEmailAndPassword(
        cleanEmail,
        cleanPassword
      );

    return result.user;

  } catch (error) {

    console.error(
      'NEXWORLD sign-in:',
      error
    );

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   CRÉATION DE COMPTE
   ============================================================ */

async function createNexworldAccount(
  email,
  password
) {

  const cleanEmail =
    String(email || '').trim();

  const cleanPassword =
    String(password || '');

  if (!cleanEmail) {
    throw new Error(
      "Adresse e-mail requise."
    );
  }

  if (!cleanPassword) {
    throw new Error(
      "Mot de passe requis."
    );
  }

  if (cleanPassword.length < 6) {
    throw new Error(
      "Le mot de passe doit contenir au moins 6 caractères."
    );
  }

  try {

    const auth =
      await initFirebaseAuth();

    const result =
      await auth.createUserWithEmailAndPassword(
        cleanEmail,
        cleanPassword
      );

    return result.user;

  } catch (error) {

    console.error(
      'NEXWORLD create account:',
      error
    );

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   MOT DE PASSE OUBLIÉ
   ============================================================ */

async function resetNexworldPassword(
  email
) {

  const cleanEmail =
    String(email || '').trim();

  if (!cleanEmail) {
    throw new Error(
      "Adresse e-mail requise."
    );
  }

  try {

    const auth =
      await initFirebaseAuth();

    await auth.sendPasswordResetEmail(
      cleanEmail
    );

    return true;

  } catch (error) {

    console.error(
      'NEXWORLD password reset:',
      error
    );

    throw new Error(
      authErrorMessage(error)
    );
  }
}


/* ============================================================
   DÉCONNEXION
   ============================================================ */

async function signOutNexworld() {

  const auth =
    await initFirebaseAuth();

  await auth.signOut();
}


/* ============================================================
   UTILISATEUR ACTUEL
   ============================================================ */

async function getCurrentNexworldUser() {

  const auth =
    await initFirebaseAuth();

  return auth.currentUser || null;
}


/* ============================================================
   TOKEN FIREBASE
   ============================================================ */

async function getNexworldIdToken() {

  const auth =
    await initFirebaseAuth();

  const user =
    auth.currentUser;

  if (!user) {

    throw new Error(
      "Connectez-vous à votre compte NEXWORLD avant d'utiliser cette source."
    );
  }

  try {

    return await user.getIdToken(
      true
    );

  } catch (error) {

    console.error(
      'NEXWORLD ID token:',
      error
    );

    throw new Error(
      "Impossible de récupérer le jeton sécurisé NEXWORLD."
    );
  }
}


/* ============================================================
   BACKEND SÉCURISÉ
   ============================================================ */

async function secureBackendRequest(
  functionName,
  payload
) {

  const token =
    await getNexworldIdToken();

  const response =
    await fetch(
      '/.netlify/functions/' + functionName,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'Authorization':
            'Bearer ' + token
        },

        body:
          JSON.stringify(
            payload || {}
          )
      }
    );


  let data;

  try {

    data =
      await response.json();

  } catch (_) {

    throw new Error(
      "Réponse invalide du backend NEXWORLD."
    );
  }


  if (
    !response.ok ||
    !data.ok
  ) {

    throw new Error(
      data?.error ||
      "La requête NEXWORLD a été refusée."
    );
  }


  return data;
}


/* ============================================================
   XTREAM SÉCURISÉ
   ============================================================ */

async function xtreamSecureRequest(
  payload
) {

  if (
    !payload ||
    typeof payload !== 'object'
  ) {

    throw new Error(
      "Requête Xtream invalide."
    );
  }

  return secureBackendRequest(
    'xtream',
    payload
  );
}


/* ============================================================
   STALKER / MAG SÉCURISÉ
   ============================================================ */

async function stalkerSecureRequest(
  payload
) {

  if (
    !payload ||
    typeof payload !== 'object'
  ) {

    throw new Error(
      "Requête Stalker invalide."
    );
  }

  return secureBackendRequest(
    'stalker',
    payload
  );
}


/* ============================================================
   SUPER ADMIN
   ============================================================ */

async function activateSuperAdmin() {

  const user =
    await getCurrentNexworldUser();

  if (!user) {

    throw new Error(
      "Connectez-vous avant d'activer Super Admin."
    );
  }

  const token =
    await getNexworldIdToken();


  const response =
    await fetch(
      '/.netlify/functions/bootstrap-admin',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',

          'Authorization':
            'Bearer ' + token
        },

        body: JSON.stringify({
          email: user.email || ''
        })
      }
    );


  let data;

  try {

    data =
      await response.json();

  } catch (_) {

    throw new Error(
      "Réponse invalide du serveur Super Admin."
    );
  }


  if (
    !response.ok ||
    data.ok === false
  ) {

    throw new Error(
      data.error ||
      "Activation Super Admin refusée."
    );
  }


  return data;
}


/* ============================================================
   CRÉATION DU BOUTON COMPTE
   ============================================================ */

function createAccountButton() {

  /*
   * Si un bouton Compte existe déjà dans index.html,
   * on l'utilise.
   */

  let button =
    document.querySelector(
      '[data-nexworld-account]'
    );


  if (button) {

    bindAccountButton(
      button
    );

    return button;
  }


  /*
   * Recherche d'un bouton existant.
   */

  const candidates =
    Array.from(
      document.querySelectorAll(
        'button, a'
      )
    );


  button =
    candidates.find(
      function(element) {

        const text =
          String(
            element.textContent || ''
          )
            .trim()
            .toLowerCase();

        return (
          text === 'compte' ||
          text.includes('compte')
        );
      }
    );


  if (button) {

    button.setAttribute(
      'data-nexworld-account',
      ''
    );

    bindAccountButton(
      button
    );

    return button;
  }


  /*
   * Aucun bouton n'existe :
   * on le crée nous-mêmes.
   */

  button =
    document.createElement(
      'button'
    );


  button.type =
    'button';

  button.setAttribute(
    'data-nexworld-account',
    ''
  );


  button.innerHTML =
    '<span style="font-size:20px">👤</span><span>NEXWORLD</span>';


  button.style.cssText = `
    position:fixed;
    top:18px;
    right:16px;
    z-index:9990;
    display:flex;
    align-items:center;
    gap:8px;
    min-height:46px;
    padding:10px 16px;
    border-radius:24px;
    border:1px solid rgba(148,163,184,.25);
    background:rgba(15,23,42,.92);
    color:#f8fafc;
    font-size:15px;
    font-weight:800;
    box-shadow:0 8px 30px rgba(0,0,0,.28);
    backdrop-filter:blur(18px);
    -webkit-backdrop-filter:blur(18px);
    cursor:pointer;
  `;


  document.body.appendChild(
    button
  );


  bindAccountButton(
    button
  );


  return button;
}


/* ============================================================
   LIAISON DU BOUTON COMPTE
   ============================================================ */

function bindAccountButton(
  button
) {

  if (!button) return;

  if (
    button.dataset.nexworldBound === '1'
  ) {
    return;
  }

  button.dataset.nexworldBound =
    '1';


  button.addEventListener(
    'click',
    function(event) {

      event.preventDefault();
      event.stopPropagation();

      openNexworldAuthPanel();
    }
  );
}


/* ============================================================
   MISE À JOUR DU BOUTON COMPTE
   ============================================================ */

function updateAccountButton(
  user
) {

  const buttons =
    document.querySelectorAll(
      '[data-nexworld-account]'
    );


  buttons.forEach(
    function(button) {

      if (user) {

        const email =
          user.email || 'Compte';

        button.innerHTML =
          '<span style="font-size:20px">👤</span>' +
          '<span>' +
          escapeHTML(email) +
          '</span>';

      } else {

        button.innerHTML =
          '<span style="font-size:20px">👤</span>' +
          '<span>Compte</span>';
      }
    }
  );
}


/* ============================================================
   PANNEAU DE CONNEXION
   ============================================================ */

function openNexworldAuthPanel() {

  if (authPanel) {

    authPanel.style.display =
      'flex';

    return;
  }


  authPanel =
    document.createElement(
      'div'
    );


  authPanel.id =
    'nexworldAuthPanel';


  authPanel.style.cssText = `
    position:fixed;
    inset:0;
    z-index:99999;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:18px;
    background:rgba(2,6,23,.82);
    backdrop-filter:blur(18px);
    -webkit-backdrop-filter:blur(18px);
  `;


  authPanel.innerHTML = `

    <div
      style="
        width:min(590px,100%);
        max-height:92vh;
        overflow:auto;
        background:#111c31;
        border:1px solid rgba(148,163,184,.20);
        border-radius:28px;
        padding:26px;
        color:#f8fafc;
        box-shadow:0 30px 100px rgba(0,0,0,.60);
      "
    >

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom:8px;
        "
      >

        <h2
          style="
            margin:0;
            font-size:28px;
            line-height:1.1;
          "
        >
          Connexion sécurisée
        </h2>

        <button
          id="nwAuthClose"
          type="button"
          style="
            border:1px solid rgba(148,163,184,.20);
            background:#1e2d49;
            color:#f8fafc;
            padding:10px 15px;
            border-radius:14px;
            font-size:15px;
          "
        >
          Fermer
        </button>

      </div>


      <p
        style="
          margin:0 0 22px;
          color:#94a3b8;
        "
      >
        Accédez à votre compte NEXWORLD.
      </p>


      <label
        style="
          display:block;
          margin-bottom:7px;
          color:#94a3b8;
        "
      >
        Adresse e-mail
      </label>


      <input
        id="nwAuthEmail"
        type="email"
        autocomplete="email"
        placeholder="vous@exemple.com"
        style="
          width:100%;
          box-sizing:border-box;
          padding:16px;
          margin-bottom:15px;
          border-radius:17px;
          border:1px solid #263653;
          background:#0b1220;
          color:#f8fafc;
          font-size:16px;
          outline:none;
        "
      >


      <label
        style="
          display:block;
          margin-bottom:7px;
          color:#94a3b8;
        "
      >
        Mot de passe
      </label>


      <input
        id="nwAuthPassword"
        type="password"
        autocomplete="current-password"
        placeholder="Mot de passe"
        style="
          width:100%;
          box-sizing:border-box;
          padding:16px;
          margin-bottom:16px;
          border-radius:17px;
          border:1px solid #263653;
          background:#0b1220;
          color:#f8fafc;
          font-size:16px;
          outline:none;
        "
      >


      <button
        id="nwLogin"
        type="button"
        style="
          width:100%;
          border:0;
          padding:16px;
          border-radius:18px;
          background:#22d3ee;
          color:#03111a;
          font-size:17px;
          font-weight:900;
          margin-bottom:10px;
        "
      >
        Se connecter
      </button>


      <button
        id="nwCreate"
        type="button"
        style="
          width:100%;
          border:0;
          padding:16px;
          border-radius:18px;
          background:#293b5c;
          color:#f8fafc;
          font-size:17px;
          font-weight:900;
          margin-bottom:10px;
        "
      >
        Créer un compte
      </button>


      <button
        id="nwReset"
        type="button"
        style="
          width:100%;
          border:0;
          padding:16px;
          border-radius:18px;
          background:#293b5c;
          color:#f8fafc;
          font-size:17px;
          font-weight:900;
          margin-bottom:10px;
        "
      >
        Mot de passe oublié
      </button>


      <button
        id="nwAdmin"
        type="button"
        style="
          display:none;
          width:100%;
          border:1px solid rgba(251,191,36,.35);
          padding:15px;
          border-radius:18px;
          background:#211b09;
          color:#fbbf24;
          font-size:16px;
          font-weight:900;
          margin-top:4px;
        "
      >
        👑 Activer Super Admin
      </button>


      <button
        id="nwLogout"
        type="button"
        style="
          display:none;
          width:100%;
          border:1px solid rgba(251,113,133,.30);
          padding:15px;
          border-radius:18px;
          background:#241522;
          color:#fb7185;
          font-size:16px;
          font-weight:900;
          margin-top:10px;
        "
      >
        Déconnexion
      </button>


      <div
        id="nwAuthStatus"
        style="
          margin-top:16px;
          padding:14px;
          border-radius:16px;
          background:#17233a;
          border:1px solid rgba(148,163,184,.16);
          color:#cbd5e1;
          line-height:1.5;
        "
      >
        Aucun compte connecté.
      </div>

    </div>
  `;


  document.body.appendChild(
    authPanel
  );


  const closeButton =
    authPanel.querySelector(
      '#nwAuthClose'
    );

  const loginButton =
    authPanel.querySelector(
      '#nwLogin'
    );

  const createButton =
    authPanel.querySelector(
      '#nwCreate'
    );

  const resetButton =
    authPanel.querySelector(
      '#nwReset'
    );

  const adminButton =
    authPanel.querySelector(
      '#nwAdmin'
    );

  const logoutButton =
    authPanel.querySelector(
      '#nwLogout'
    );


  closeButton.onclick =
    function() {

      authPanel.style.display =
        'none';
    };


  authPanel.onclick =
    function(event) {

      if (
        event.target === authPanel
      ) {

        authPanel.style.display =
          'none';
      }
    };


  loginButton.onclick =
    async function() {

      const email =
        authPanel.querySelector(
          '#nwAuthEmail'
        ).value;

      const password =
        authPanel.querySelector(
          '#nwAuthPassword'
        ).value;

      setAuthStatus(
        'Connexion en cours…',
        false
      );


      try {

        await signInNexworld(
          email,
          password
        );

        setAuthStatus(
          'Connexion réussie.',
          false
        );

        setTimeout(
          function() {

            if (authPanel) {
              authPanel.style.display =
                'none';
            }

          },
          600
        );

      } catch (error) {

        setAuthStatus(
          error.message ||
          'Échec de connexion.',
          true
        );
      }
    };


  createButton.onclick =
    async function() {

      const email =
        authPanel.querySelector(
          '#nwAuthEmail'
        ).value;

      const password =
        authPanel.querySelector(
          '#nwAuthPassword'
        ).value;


      setAuthStatus(
        'Création du compte…',
        false
      );


      try {

        await createNexworldAccount(
          email,
          password
        );

        setAuthStatus(
          'Compte NEXWORLD créé avec succès.',
          false
        );

      } catch (error) {

        setAuthStatus(
          error.message ||
          'Impossible de créer le compte.',
          true
        );
      }
    };


  resetButton.onclick =
    async function() {

      const email =
        authPanel.querySelector(
          '#nwAuthEmail'
        ).value;


      setAuthStatus(
        'Envoi du lien de réinitialisation…',
        false
      );


      try {

        await resetNexworldPassword(
          email
        );

        setAuthStatus(
          'Le lien de réinitialisation a été envoyé à votre adresse e-mail.',
          false
        );

      } catch (error) {

        setAuthStatus(
          error.message ||
          'Impossible d'envoyer le lien.',
          true
        );
      }
    };


  logoutButton.onclick =
    async function() {

      try {

        await signOutNexworld();

        setAuthStatus(
          'Déconnexion effectuée.',
          false
        );

      } catch (error) {

        setAuthStatus(
          error.message ||
          'Erreur lors de la déconnexion.',
          true
        );
      }
    };


  adminButton.onclick =
    async function() {

      setAuthStatus(
        'Activation Super Admin en cours…',
        false
      );


      try {

        const result =
          await activateSuperAdmin();


        setAuthStatus(
          result.message ||
          'Activation Super Admin effectuée.',
          false
        );

      } catch (error) {

        setAuthStatus(
          error.message ||
          'Activation Super Admin refusée.',
          true
        );
      }
    };


  /*
   * Initialisation de Firebase après création
   * du panneau.
   */

  initFirebaseAuth()
    .then(
      function() {

        updateAuthPanel(
          firebaseAuth.currentUser
        );
      }
    )
    .catch(
      function(error) {

        setAuthStatus(
          error.message ||
          'Firebase indisponible.',
          true
        );
      }
    );
}


/* ============================================================
   MESSAGE DU PANNEAU
   ============================================================ */

function setAuthStatus(
  message,
  isError
) {

  if (!authPanel) return;

  const element =
    authPanel.querySelector(
      '#nwAuthStatus'
    );

  if (!element) return;


  element.textContent =
    message || '';


  element.style.color =
    isError
      ? '#fb7185'
      : '#cbd5e1';


  element.style.borderColor =
    isError
      ? 'rgba(251,113,133,.35)'
      : 'rgba(148,163,184,.16)';
}


/* ============================================================
   MISE À JOUR DU PANNEAU
   ============================================================ */

function updateAuthPanel(
  user
) {

  if (!authPanel) return;


  const adminButton =
    authPanel.querySelector(
      '#nwAdmin'
    );

  const logoutButton =
    authPanel.querySelector(
      '#nwLogout'
    );

  const status =
    authPanel.querySelector(
      '#nwAuthStatus'
    );


  if (user) {

    if (adminButton) {
      adminButton.style.display =
        'block';
    }

    if (logoutButton) {
      logoutButton.style.display =
        'block';
    }

    if (status) {

      status.textContent =
        'Compte connecté : ' +
        (
          user.email ||
          'Utilisateur NEXWORLD'
        );

      status.style.color =
        '#34d399';
    }

  } else {

    if (adminButton) {
      adminButton.style.display =
        'none';
    }

    if (logoutButton) {
      logoutButton.style.display =
        'none';
    }

    if (status) {

      status.textContent =
        'Aucun compte connecté.';

      status.style.color =
        '#cbd5e1';
    }
  }
}


/* ============================================================
   INITIALISATION DE L'INTERFACE
   ============================================================ */

function bootstrapNexworldAuthUI() {

  /*
   * Le bouton est créé indépendamment de Firebase.
   *
   * Ainsi, même si Firebase rencontre une erreur,
   * le bouton Compte reste visible.
   */

  createAccountButton();


  /*
   * Firebase est ensuite initialisé.
   */

  initFirebaseAuth()
    .then(
      function() {

        updateAccountButton(
          firebaseAuth.currentUser
        );
      }
    )
    .catch(
      function(error) {

        console.error(
          'NEXWORLD Firebase:',
          error
        );

        /*
         * Le catalogue TV public continue
         * normalement même si Auth échoue.
         */
      }
    );
}


/* ============================================================
   API PUBLIQUE
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

  stalkerSecureRequest,

  activateSuperAdmin,

  openNexworldAuthPanel
};


/* ============================================================
   DÉMARRAGE
   ============================================================ */

if (
  document.readyState === 'loading'
) {

  document.addEventListener(
    'DOMContentLoaded',
    bootstrapNexworldAuthUI,
    {
      once: true
    }
  );

} else {

  bootstrapNexworldAuthUI();
}
