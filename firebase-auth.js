/* =========================================================
   NEXWORLD — Firebase Authentication
   Fichier : firebase-auth.js
   Emplacement : racine du dépôt
   ========================================================= */

(function () {
  "use strict";

  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDyxcMxY0KX8EI_Al-zF1LvlTBapDnbDXQ",
    authDomain: "nexworld-tv.firebaseapp.com",
    projectId: "nexworld-tv",
    storageBucket: "nexworld-tv.firebasestorage.app",
    messagingSenderId: "262610525162",
    appId: "1:262610525162:web:b49643340dcd0fb7bb7093"
  };

  const BOOTSTRAP_ENDPOINT =
    "/.netlify/functions/bootstrap-admin";

  let auth = null;

  /* ---------------------------------------------------------
     Initialisation Firebase
     --------------------------------------------------------- */

  function initFirebaseAuth() {
    if (!window.firebase) {
      console.error(
        "[NEXWORLD] Firebase SDK non chargé."
      );
      return false;
    }

    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
      }

      auth = firebase.auth();

      console.log(
        "[NEXWORLD] Firebase Authentication initialisé."
      );

      return true;
    } catch (error) {
      console.error(
        "[NEXWORLD] Erreur initialisation Firebase :",
        error
      );
      return false;
    }
  }

  /* ---------------------------------------------------------
     Utilitaires
     --------------------------------------------------------- */

  function getErrorMessage(error) {
    if (!error) {
      return "Une erreur inconnue est survenue.";
    }

    const code = error.code || "";

    const messages = {
      "auth/invalid-email":
        "Adresse e-mail invalide.",

      "auth/user-not-found":
        "Aucun compte ne correspond à cette adresse.",

      "auth/wrong-password":
        "Mot de passe incorrect.",

      "auth/invalid-credential":
        "Identifiants incorrects.",

      "auth/email-already-in-use":
        "Cette adresse e-mail possède déjà un compte.",

      "auth/weak-password":
        "Le mot de passe doit contenir au moins 6 caractères.",

      "auth/too-many-requests":
        "Trop de tentatives. Réessayez plus tard.",

      "auth/network-request-failed":
        "Problème de connexion Internet.",

      "auth/user-disabled":
        "Ce compte a été désactivé."
    };

    return messages[code] ||
      error.message ||
      "Une erreur est survenue.";
  }

  function showMessage(message, success) {
    const box = document.getElementById(
      "nexworld-auth-message"
    );

    if (!box) return;

    box.textContent = message;
    box.style.display = "block";

    box.style.color = success
      ? "#34d399"
      : "#f87171";
  }

  /* ---------------------------------------------------------
     Connexion
     --------------------------------------------------------- */

  async function signInNexworld(email, password) {
    if (!auth) {
      throw new Error(
        "Firebase Authentication n'est pas initialisé."
      );
    }

    const result =
      await auth.signInWithEmailAndPassword(
        email.trim(),
        password
      );

    return result.user;
  }

  /* ---------------------------------------------------------
     Création de compte
     --------------------------------------------------------- */

  async function createNexworldAccount(
    email,
    password
  ) {
    if (!auth) {
      throw new Error(
        "Firebase Authentication n'est pas initialisé."
      );
    }

    const result =
      await auth.createUserWithEmailAndPassword(
        email.trim(),
        password
      );

    return result.user;
  }

  /* ---------------------------------------------------------
     Réinitialisation mot de passe
     --------------------------------------------------------- */

  async function resetNexworldPassword(email) {
    if (!auth) {
      throw new Error(
        "Firebase Authentication n'est pas initialisé."
      );
    }

    await auth.sendPasswordResetEmail(
      email.trim()
    );
  }

  /* ---------------------------------------------------------
     Déconnexion
     --------------------------------------------------------- */

  async function signOutNexworld() {
    if (!auth) return;

    await auth.signOut();
  }

  /* ---------------------------------------------------------
     Token Firebase
     --------------------------------------------------------- */

  async function getNexworldIdToken() {
    if (!auth || !auth.currentUser) {
      throw new Error(
        "Aucun utilisateur connecté."
      );
    }

    return await auth.currentUser.getIdToken(true);
  }

  /* ---------------------------------------------------------
     Appel sécurisé vers Netlify
     --------------------------------------------------------- */

  async function secureNetlifyRequest(
    endpoint,
    payload
  ) {
    const token =
      await getNexworldIdToken();

    const response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization":
            "Bearer " + token
        },

        body: JSON.stringify(
          payload || {}
        )
      }
    );

    const text =
      await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (_) {
      throw new Error(
        "Réponse serveur invalide."
      );
    }

    if (!response.ok || data.ok === false) {
      throw new Error(
        data.error ||
        "La requête sécurisée a échoué."
      );
    }

    return data;
  }

  /* ---------------------------------------------------------
     Activation Super Admin
     --------------------------------------------------------- */

  async function activateSuperAdmin() {
    try {
      if (!auth || !auth.currentUser) {
        throw new Error(
          "Connectez-vous d'abord avec votre compte."
        );
      }

      showMessage(
        "Vérification du compte Super Admin...",
        true
      );

      const result =
        await secureNetlifyRequest(
          BOOTSTRAP_ENDPOINT,
          {
            action: "activate"
          }
        );

      showMessage(
        result.message ||
        "Compte Super Admin activé.",
        true
      );

      return result;

    } catch (error) {
      console.error(
        "[NEXWORLD] Super Admin :",
        error
      );

      showMessage(
        getErrorMessage(error),
        false
      );

      throw error;
    }
  }

  /* ---------------------------------------------------------
     Interface temporaire de connexion
     --------------------------------------------------------- */

  function createAuthUI() {
    if (
      document.getElementById(
        "nexworld-auth-panel"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.textContent = `
      #nexworld-auth-panel {
        position: fixed;
        right: 14px;
        bottom: 84px;
        width: min(360px, calc(100vw - 28px));
        z-index: 99999;
        padding: 18px;
        border-radius: 22px;
        background:
          linear-gradient(
            145deg,
            rgba(15,23,42,.98),
            rgba(30,41,59,.97)
          );
        border: 1px solid rgba(255,255,255,.12);
        box-shadow:
          0 20px 60px rgba(0,0,0,.55);
        color: #f8fafc;
        font-family:
          system-ui,
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;
        backdrop-filter: blur(18px);
      }

      #nexworld-auth-panel h3 {
        margin: 0 0 5px;
        font-size: 18px;
      }

      #nexworld-auth-panel
      .nexworld-auth-subtitle {
        margin: 0 0 15px;
        font-size: 12px;
        opacity: .65;
      }

      #nexworld-auth-panel input {
        width: 100%;
        box-sizing: border-box;
        margin: 6px 0;
        padding: 12px 13px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,.1);
        outline: none;
        background: rgba(255,255,255,.06);
        color: #fff;
      }

      #nexworld-auth-panel
      input::placeholder {
        color: rgba(255,255,255,.45);
      }

      #nexworld-auth-panel button {
        width: 100%;
        margin-top: 7px;
        padding: 11px 12px;
        border: 0;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 700;
        color: #fff;
        background: rgba(255,255,255,.09);
      }

      #nexworld-auth-panel
      button.primary {
        background: #06b6d4;
        color: #06111a;
      }

      #nexworld-auth-panel
      button.admin {
        background: #a855f7;
      }

      #nexworld-auth-panel
      button.danger {
        background: rgba(239,68,68,.18);
      }

      #nexworld-auth-message {
        display: none;
        margin-top: 10px;
        font-size: 12px;
        line-height: 1.4;
      }

      #nexworld-auth-user {
        margin-top: 10px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(255,255,255,.05);
        font-size: 12px;
        word-break: break-word;
      }
    `;

    document.head.appendChild(style);

    const panel =
      document.createElement("div");

    panel.id =
      "nexworld-auth-panel";

    panel.innerHTML = `
      <h3>Compte NEXWORLD</h3>

      <p class="nexworld-auth-subtitle">
        Connexion sécurisée
      </p>

      <input
        id="nexworld-auth-email"
        type="email"
        autocomplete="email"
        placeholder="Adresse e-mail"
      >

      <input
        id="nexworld-auth-password"
        type="password"
        autocomplete="current-password"
        placeholder="Mot de passe"
      >

      <button
        id="nexworld-login"
        class="primary">
        Se connecter
      </button>

      <button
        id="nexworld-create">
        Créer un compte
      </button>

      <button
        id="nexworld-reset">
        Mot de passe oublié
      </button>

      <button
        id="nexworld-superadmin"
        class="admin">
        Activer Super Admin
      </button>

      <button
        id="nexworld-logout"
        class="danger">
        Déconnexion
      </button>

      <div id="nexworld-auth-user"></div>

      <div id="nexworld-auth-message"></div>
    `;

    document.body.appendChild(panel);

    const email =
      document.getElementById(
        "nexworld-auth-email"
      );

    const password =
      document.getElementById(
        "nexworld-auth-password"
      );

    document.getElementById(
      "nexworld-login"
    ).addEventListener(
      "click",
      async function () {
        try {
          showMessage(
            "Connexion...",
            true
          );

          const user =
            await signInNexworld(
              email.value,
              password.value
            );

          showUser(user);

          showMessage(
            "Connexion réussie.",
            true
          );

        } catch (error) {
          showMessage(
            getErrorMessage(error),
            false
          );
        }
      }
    );

    document.getElementById(
      "nexworld-create"
    ).addEventListener(
      "click",
      async function () {
        try {
          showMessage(
            "Création du compte...",
            true
          );

          const user =
            await createNexworldAccount(
              email.value,
              password.value
            );

          showUser(user);

          showMessage(
            "Compte créé avec succès.",
            true
          );

        } catch (error) {
          showMessage(
            getErrorMessage(error),
            false
          );
        }
      }
    );

    document.getElementById(
      "nexworld-reset"
    ).addEventListener(
      "click",
      async function () {
        try {
          if (!email.value.trim()) {
            throw new Error(
              "Saisissez d'abord votre adresse e-mail."
            );
          }

          await resetNexworldPassword(
            email.value
          );

          showMessage(
            "E-mail de réinitialisation envoyé.",
            true
          );

        } catch (error) {
          showMessage(
            getErrorMessage(error),
            false
          );
        }
      }
    );

    document.getElementById(
      "nexworld-superadmin"
    ).addEventListener(
      "click",
      async function () {
        try {
          await activateSuperAdmin();
        } catch (_) {}
      }
    );

    document.getElementById(
      "nexworld-logout"
    ).addEventListener(
      "click",
      async function () {
        try {
          await signOutNexworld();

          showUser(null);

          showMessage(
            "Déconnexion effectuée.",
            true
          );

        } catch (error) {
          showMessage(
            getErrorMessage(error),
            false
          );
        }
      }
    );
  }

  function showUser(user) {
    const box =
      document.getElementById(
        "nexworld-auth-user"
      );

    if (!box) return;

    if (!user) {
      box.textContent =
        "Aucun compte connecté.";
      return;
    }

    box.textContent =
      "Connecté : " +
      (user.email || user.uid);
  }

  /* ---------------------------------------------------------
     État Firebase
     --------------------------------------------------------- */

  function watchAuthState() {
    if (!auth) return;

    auth.onAuthStateChanged(
      function (user) {
        showUser(user);

        window.dispatchEvent(
          new CustomEvent(
            "nexworld-auth-changed",
            {
              detail: {
                user: user || null
              }
            }
          )
        );
      }
    );
  }

  /* ---------------------------------------------------------
     API publique NEXWORLD
     --------------------------------------------------------- */

  window.NEXWORLD_AUTH = {
    init: initFirebaseAuth,
    signIn: signInNexworld,
    createAccount:
      createNexworldAccount,
    resetPassword:
      resetNexworldPassword,
    signOut:
      signOutNexworld,
    getIdToken:
      getNexworldIdToken,
    secureRequest:
      secureNetlifyRequest,
    activateSuperAdmin:
      activateSuperAdmin,
    getCurrentUser:
      function () {
        return auth
          ? auth.currentUser
          : null;
      }
  };

  /* ---------------------------------------------------------
     Démarrage
     --------------------------------------------------------- */

  function bootAuth() {
    if (!initFirebaseAuth()) {
      return;
    }

    createAuthUI();
    watchAuthState();
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      bootAuth
    );
  } else {
    bootAuth();
  }

})();
