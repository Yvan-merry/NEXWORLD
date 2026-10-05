/* =========================================================
   NEXWORLD — Firebase Authentication
   Correction UI : fenêtre Compte FERMÉE au démarrage
   Fichier : /firebase-auth.js
   ========================================================= */

(function () {
  'use strict';

  const FIREBASE_CONFIG = {
    apiKey: 'AIzaSyDyxcMx0YK8XEI_Al-zF1LvlTBapDnbDXQ',
    authDomain: 'nexworld-tv.firebaseapp.com',
    projectId: 'nexworld-tv',
    storageBucket: 'nexworld-tv.firebasestorage.app',
    messagingSenderId: '262610525162',
    appId: '1:262610525162:web:b49643340dcd0fb7bb7093'
  };

  const XTREAM_ENDPOINT =
    '/.netlify/functions/xtream';

  const ADMIN_ENDPOINT =
    '/.netlify/functions/bootstrap-admin';

  let auth = null;
  let accountPanel = null;
  let accountButton = null;

  /* ---------------------------------------------------------
     Firebase
     --------------------------------------------------------- */

  function initFirebase() {
    if (!window.firebase) {
      console.error(
        '[NEXWORLD] Firebase SDK introuvable.'
      );
      return false;
    }

    try {
      if (
        window.firebase.apps &&
        window.firebase.apps.length
      ) {
        window.firebase.app();
      } else {
        window.firebase.initializeApp(
          FIREBASE_CONFIG
        );
      }

      auth = window.firebase.auth();

      auth.onAuthStateChanged(
        updateAccountState
      );

      return true;

    } catch (error) {
      console.error(
        '[NEXWORLD] Firebase:',
        error
      );

      return false;
    }
  }

  /* ---------------------------------------------------------
     UI
     --------------------------------------------------------- */

  function createStyles() {
    if (document.getElementById(
      'nexworld-account-styles'
    )) {
      return;
    }

    const style =
      document.createElement('style');

    style.id =
      'nexworld-account-styles';

    style.textContent = `

      #nexworld-account-button {
        position: fixed;
        top: 14px;
        right: 14px;
        z-index: 9990;
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 999px;
        padding: 10px 15px;
        background: rgba(15,23,42,.94);
        color: #fff;
        font: 700 14px system-ui,sans-serif;
        box-shadow: 0 8px 28px rgba(0,0,0,.28);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
      }

      #nexworld-account-panel {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(2,6,23,.72);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }

      #nexworld-account-panel.nx-hidden {
        display: none !important;
      }

      #nexworld-account-card {
        width: min(430px,100%);
        max-height: 90vh;
        overflow-y: auto;
        box-sizing: border-box;
        padding: 22px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 26px;
        background: #111a2d;
        color: #fff;
        box-shadow: 0 24px 80px rgba(0,0,0,.48);
        font-family: system-ui,-apple-system,
          BlinkMacSystemFont,"Segoe UI",sans-serif;
      }

      #nexworld-account-card h2 {
        margin: 0 0 6px;
        font-size: 26px;
      }

      #nexworld-account-card .nx-subtitle {
        margin: 0 0 16px;
        color: #aab5ca;
      }

      #nexworld-account-card input {
        width: 100%;
        box-sizing: border-box;
        margin: 7px 0;
        padding: 15px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,.12);
        background: #202b40;
        color: #fff;
        font-size: 16px;
        outline: none;
      }

      #nexworld-account-card button {
        width: 100%;
        box-sizing: border-box;
        margin-top: 9px;
        padding: 14px;
        border: 0;
        border-radius: 15px;
        font-size: 15px;
        font-weight: 800;
      }

      #nx-login {
        background: #11b9d5;
        color: #06111c;
      }

      #nx-create,
      #nx-reset,
      #nx-logout,
      #nx-close {
        background: #29354c;
        color: #fff;
      }

      #nx-admin {
        background: #a855f7;
        color: #fff;
      }

      #nx-status,
      #nx-message {
        margin-top: 12px;
        padding: 12px 14px;
        border-radius: 14px;
        background: #202b40;
        color: #e2e8f0;
        font-size: 14px;
      }

      #nx-message {
        display: none;
      }

    `;

    document.head.appendChild(style);
  }

  function createUI() {
    if (
      document.getElementById(
        'nexworld-account-panel'
      )
    ) {
      return;
    }

    createStyles();

    accountButton =
      document.createElement('button');

    accountButton.id =
      'nexworld-account-button';

    accountButton.type = 'button';

    accountButton.textContent =
      '👤 Compte';

    accountButton.addEventListener(
      'click',
      openAccount
    );

    document.body.appendChild(
      accountButton
    );

    accountPanel =
      document.createElement('div');

    accountPanel.id =
      'nexworld-account-panel';

    /*
      IMPORTANT :
      la fenêtre est cachée dès sa création.
    */
    accountPanel.className =
      'nx-hidden';

    accountPanel.setAttribute(
      'aria-hidden',
      'true'
    );

    accountPanel.innerHTML = `

      <div id="nexworld-account-card">

        <h2>Compte NEXWORLD</h2>

        <p class="nx-subtitle">
          Connexion sécurisée
        </p>

        <input
          id="nx-email"
          type="email"
          autocomplete="email"
          placeholder="Adresse e-mail"
        >

        <input
          id="nx-password"
          type="password"
          autocomplete="current-password"
          placeholder="Mot de passe"
        >

        <button
          id="nx-login"
          type="button"
        >
          Se connecter
        </button>

        <button
          id="nx-create"
          type="button"
        >
          Créer un compte
        </button>

        <button
          id="nx-reset"
          type="button"
        >
          Mot de passe oublié
        </button>

        <button
          id="nx-admin"
          type="button"
        >
          Activer Super Admin
        </button>

        <button
          id="nx-logout"
          type="button"
        >
          Déconnexion
        </button>

        <div id="nx-status">
          Aucun compte connecté.
        </div>

        <div id="nx-message"></div>

        <button
          id="nx-close"
          type="button"
        >
          Fermer
        </button>

      </div>
    `;

    document.body.appendChild(
      accountPanel
    );

    document
      .getElementById('nx-login')
      .addEventListener(
        'click',
        login
      );

    document
      .getElementById('nx-create')
      .addEventListener(
        'click',
        createAccount
      );

    document
      .getElementById('nx-reset')
      .addEventListener(
        'click',
        resetPassword
      );

    document
      .getElementById('nx-admin')
      .addEventListener(
        'click',
        activateAdmin
      );

    document
      .getElementById('nx-logout')
      .addEventListener(
        'click',
        logout
      );

    document
      .getElementById('nx-close')
      .addEventListener(
        'click',
        closeAccount
      );

    accountPanel.addEventListener(
      'click',
      function (event) {
        if (
          event.target === accountPanel
        ) {
          closeAccount();
        }
      }
    );

    /*
      ESC ferme la fenêtre.
    */
    document.addEventListener(
      'keydown',
      function (event) {
        if (event.key === 'Escape') {
          closeAccount();
        }
      }
    );
  }

  function openAccount() {
    if (!accountPanel) return;

    accountPanel.classList.remove(
      'nx-hidden'
    );

    accountPanel.setAttribute(
      'aria-hidden',
      'false'
    );
  }

  function closeAccount() {
    if (!accountPanel) return;

    accountPanel.classList.add(
      'nx-hidden'
    );

    accountPanel.setAttribute(
      'aria-hidden',
      'true'
    );
  }

  /* ---------------------------------------------------------
     Messages
     --------------------------------------------------------- */

  function message(text, success) {
    const box =
      document.getElementById(
        'nx-message'
      );

    if (!box) return;

    box.textContent =
      text || '';

    box.style.display =
      text ? 'block' : 'none';

    box.style.border =
      success
        ? '1px solid rgba(52,211,153,.45)'
        : '1px solid rgba(248,113,113,.4)';
  }

  /* ---------------------------------------------------------
     Auth state
     --------------------------------------------------------- */

  function updateAccountState(user) {
    const status =
      document.getElementById(
        'nx-status'
      );

    const logoutButton =
      document.getElementById(
        'nx-logout'
      );

    if (user) {

      if (status) {
        status.textContent =
          'Connecté : ' +
          (user.email || user.uid);
      }

      if (logoutButton) {
        logoutButton.style.display =
          'block';
      }

      if (accountButton) {
        accountButton.textContent =
          '👤 Compte ✓';
      }

    } else {

      if (status) {
        status.textContent =
          'Aucun compte connecté.';
      }

      if (logoutButton) {
        logoutButton.style.display =
          'block';
      }

      if (accountButton) {
        accountButton.textContent =
          '👤 Compte';
      }
    }
  }

  /* ---------------------------------------------------------
     Connexion
     --------------------------------------------------------- */

  async function login() {
    if (!auth) {
      message(
        'Firebase n’est pas disponible.',
        false
      );
      return;
    }

    const email =
      document.getElementById(
        'nx-email'
      ).value.trim();

    const password =
      document.getElementById(
        'nx-password'
      ).value;

    if (!email || !password) {
      message(
        'Saisissez votre e-mail et votre mot de passe.',
        false
      );
      return;
    }

    message(
      'Connexion…',
      true
    );

    try {

      await auth.signInWithEmailAndPassword(
        email,
        password
      );

      message(
        'Connexion réussie.',
        true
      );

    } catch (error) {

      console.error(error);

      message(
        firebaseMessage(error),
        false
      );
    }
  }

  /* ---------------------------------------------------------
     Création de compte
     --------------------------------------------------------- */

  async function createAccount() {
    if (!auth) return;

    const email =
      document.getElementById(
        'nx-email'
      ).value.trim();

    const password =
      document.getElementById(
        'nx-password'
      ).value;

    if (!email || !password) {
      message(
        'Saisissez votre e-mail et votre mot de passe.',
        false
      );
      return;
    }

    if (password.length < 6) {
      message(
        'Le mot de passe doit contenir au moins 6 caractères.',
        false
      );
      return;
    }

    message(
      'Création du compte…',
      true
    );

    try {

      await auth.createUserWithEmailAndPassword(
        email,
        password
      );

      message(
        'Compte créé avec succès.',
        true
      );

    } catch (error) {

      console.error(error);

      message(
        firebaseMessage(error),
        false
      );
    }
  }

  /* ---------------------------------------------------------
     Mot de passe oublié
     --------------------------------------------------------- */

  async function resetPassword() {
    if (!auth) return;

    const email =
      document.getElementById(
        'nx-email'
      ).value.trim();

    if (!email) {
      message(
        'Saisissez votre adresse e-mail.',
        false
      );
      return;
    }

    try {

      await auth.sendPasswordResetEmail(
        email
      );

      message(
        'E-mail de réinitialisation envoyé.',
        true
      );

    } catch (error) {

      console.error(error);

      message(
        firebaseMessage(error),
        false
      );
    }
  }

  /* ---------------------------------------------------------
     Déconnexion
     --------------------------------------------------------- */

  async function logout() {
    if (!auth) return;

    try {

      await auth.signOut();

      message(
        'Déconnexion effectuée.',
        true
      );

    } catch (error) {

      console.error(error);

      message(
        'Déconnexion impossible.',
        false
      );
    }
  }

  /* ---------------------------------------------------------
     Super Admin
     --------------------------------------------------------- */

  async function activateAdmin() {

    if (!auth || !auth.currentUser) {

      message(
        'Connectez-vous d’abord avec votre compte administrateur.',
        false
      );

      return;
    }

    const confirmed =
      window.confirm(
        'Activer les droits Super Admin pour ce compte ?'
      );

    if (!confirmed) return;

    message(
      'Vérification Super Admin…',
      true
    );

    try {

      const token =
        await auth.currentUser.getIdToken(
          true
        );

      const response =
        await fetch(
          ADMIN_ENDPOINT,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',

              'Authorization':
                'Bearer ' + token
            },

            body: JSON.stringify({})
          }
        );

      const data =
        await response.json()
          .catch(function () {
            return {};
          });

      if (
        !response.ok ||
        data.ok === false
      ) {
        throw new Error(
          data.error ||
          'Activation Super Admin refusée.'
        );
      }

      message(
        data.message ||
        'Super Admin activé.',
        true
      );

    } catch (error) {

      console.error(error);

      message(
        error.message ||
        'Activation Super Admin impossible.',
        false
      );
    }
  }

  /* ---------------------------------------------------------
     Token Firebase pour Netlify
     --------------------------------------------------------- */

  async function getNexworldIdToken() {

    if (
      !auth ||
      !auth.currentUser
    ) {
      throw new Error(
        'Aucun compte NEXWORLD connecté.'
      );
    }

    return auth.currentUser.getIdToken(
      true
    );
  }

  /* ---------------------------------------------------------
     Requête Xtream sécurisée
     --------------------------------------------------------- */

  async function xtreamSecureRequest(
    payload
  ) {

    const token =
      await getNexworldIdToken();

    const response =
      await fetch(
        XTREAM_ENDPOINT,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'Authorization':
              'Bearer ' + token
          },

          body: JSON.stringify(
            payload || {}
          )
        }
      );

    const data =
      await response.json()
        .catch(function () {
          return {
            ok: false,
            error:
              'Réponse serveur invalide.'
          };
        });

    if (
      !response.ok ||
      data.ok === false
    ) {
      throw new Error(
        data.error ||
        'Requête Xtream refusée.'
      );
    }

    return data;
  }

  /* ---------------------------------------------------------
     Messages Firebase
     --------------------------------------------------------- */

  function firebaseMessage(error) {

    const code =
      String(
        error &&
        error.code ||
        ''
      );

    const messages = {

      'auth/invalid-email':
        'Adresse e-mail invalide.',

      'auth/user-not-found':
        'Compte introuvable.',

      'auth/wrong-password':
        'Mot de passe incorrect.',

      'auth/invalid-credential':
        'E-mail ou mot de passe incorrect.',

      'auth/email-already-in-use':
        'Cette adresse e-mail est déjà utilisée.',

      'auth/weak-password':
        'Mot de passe trop faible.',

      'auth/too-many-requests':
        'Trop de tentatives. Réessayez plus tard.'
    };

    return (
      messages[code] ||
      (
        error &&
        error.message
      ) ||
      'Opération Firebase impossible.'
    );
  }

  /* ---------------------------------------------------------
     API publique NEXWORLD
     --------------------------------------------------------- */

  window.NEXWORLD_AUTH = {

    initFirebaseAuth:
      initFirebase,

    signInNexworld:
      login,

    signOutNexworld:
      logout,

    getNexworldIdToken:
      getNexworldIdToken,

    xtreamSecureRequest:
      xtreamSecureRequest,

    openAccount:
      openAccount,

    closeAccount:
      closeAccount
  };

  /* ---------------------------------------------------------
     Démarrage
     --------------------------------------------------------- */

  function boot() {

    createUI();

    /*
      SÉCURITÉ UI :
      toujours fermé au démarrage.
    */
    closeAccount();

    initFirebase();

    /*
      Vérification supplémentaire :
      si un autre script tente d'afficher
      la fenêtre immédiatement, elle reste
      fermée au démarrage.
    */
    setTimeout(
      closeAccount,
      0
    );
  }

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      boot,
      { once: true }
    );

  } else {

    boot();
  }

})();
