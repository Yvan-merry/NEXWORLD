/* =========================================================
   NEXWORLD — FIREBASE AUTH + BACKEND SÉCURISÉ
   V7.4.4
   ========================================================= */

'use strict';


const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDyxcMx0KX8EI_Al-zF1LvlTBapDnbDXQ',
  authDomain: 'nexworld-tv.firebaseapp.com',
  projectId: 'nexworld-tv',
  storageBucket: 'nexworld-tv.firebasestorage.app',
  messagingSenderId: '262610525162',
  appId: '1:262610525162:web:b49643340dcd0fb7bb7093'
};


let firebaseApp = null;
let firebaseAuth = null;
let firebaseReady = false;


/* =========================================================
   INITIALISATION
   ========================================================= */

async function initFirebaseAuth() {

  if (
    firebaseReady &&
    firebaseAuth
  ) {
    return firebaseAuth;
  }


  if (
    !window.firebase ||
    typeof window.firebase.initializeApp !== 'function'
  ) {

    throw new Error(
      'Firebase SDK n’est pas chargé.'
    );

  }


  try {

    if (
      window.firebase.apps &&
      window.firebase.apps.length
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


    if (
      !firebaseAuth ||
      typeof firebaseAuth.onAuthStateChanged !== 'function'
    ) {

      throw new Error(
        'Firebase Auth n’a pas pu être initialisé correctement.'
      );

    }


    firebaseReady = true;


    return firebaseAuth;

  } catch (error) {

    firebaseReady = false;
    firebaseAuth = null;

    console.error(
      '[NEXWORLD] Firebase Auth:',
      error
    );


    throw new Error(
      error?.message ||
      'Initialisation Firebase impossible.'
    );

  }

}


/* =========================================================
   ÉTAT FIREBASE AUTH
   ========================================================= */

async function onAuthStateChangedNexworld(
  callback
) {

  if (
    typeof callback !== 'function'
  ) {

    throw new Error(
      'Callback Firebase Auth invalide.'
    );

  }


  const auth =
    await initFirebaseAuth();


  return auth.onAuthStateChanged(
    callback
  );

}


/* =========================================================
   UTILISATEUR ACTUEL
   ========================================================= */

async function getCurrentNexworldUser() {

  const auth =
    await initFirebaseAuth();


  return auth.currentUser || null;

}


/* =========================================================
   CONNEXION
   ========================================================= */

async function signInNexworld(
  email,
  password
) {

  const e =
    String(
      email || ''
    ).trim();


  if (
    !e ||
    !password
  ) {

    throw new Error(
      'E-mail et mot de passe requis.'
    );

  }


  try {

    const auth =
      await initFirebaseAuth();


    const result =
      await auth.signInWithEmailAndPassword(
        e,
        password
      );


    return result.user;

  } catch (error) {

    throw new Error(
      firebaseMessage(
        error,
        'Connexion impossible.'
      )
    );

  }

}


/* =========================================================
   CRÉATION
   ========================================================= */

async function createNexworldAccount(
  email,
  password
) {

  const e =
    String(
      email || ''
    ).trim();


  if (
    !e ||
    !password
  ) {

    throw new Error(
      'E-mail et mot de passe requis.'
    );

  }


  if (
    String(password).length < 6
  ) {

    throw new Error(
      'Le mot de passe doit contenir au moins 6 caractères.'
    );

  }


  try {

    const auth =
      await initFirebaseAuth();


    const result =
      await auth.createUserWithEmailAndPassword(
        e,
        password
      );


    return result.user;

  } catch (error) {

    throw new Error(
      firebaseMessage(
        error,
        'Création du compte impossible.'
      )
    );

  }

}


/* =========================================================
   MOT DE PASSE OUBLIÉ
   ========================================================= */

async function resetNexworldPassword(
  email
) {

  const e =
    String(
      email || ''
    ).trim();


  if (!e) {

    throw new Error(
      'Saisissez votre e-mail.'
    );

  }


  try {

    const auth =
      await initFirebaseAuth();


    await auth.sendPasswordResetEmail(
      e
    );

  } catch (error) {

    throw new Error(
      firebaseMessage(
        error,
        'Impossible d’envoyer l’e-mail de réinitialisation.'
      )
    );

  }

}


/* =========================================================
   DÉCONNEXION
   ========================================================= */

async function signOutNexworld() {

  try {

    const auth =
      await initFirebaseAuth();


    await auth.signOut();

  } catch (error) {

    throw new Error(
      firebaseMessage(
        error,
        'Déconnexion impossible.'
      )
    );

  }

}


/* =========================================================
   TOKEN FIREBASE
   ========================================================= */

async function getNexworldIdToken() {

  const auth =
    await initFirebaseAuth();


  if (
    !auth.currentUser
  ) {

    throw new Error(
      'Connectez-vous à votre compte NEXWORLD avant de continuer.'
    );

  }


  return auth.currentUser.getIdToken(
    true
  );

}


/* =========================================================
   MESSAGES FIREBASE
   ========================================================= */

function firebaseMessage(
  error,
  fallback
) {

  const code =
    String(
      error?.code || ''
    ).toLowerCase();


  const messages = {

    'auth/invalid-email':
      'Adresse e-mail invalide.',

    'auth/user-disabled':
      'Ce compte a été désactivé.',

    'auth/user-not-found':
      'Aucun compte ne correspond à cet e-mail.',

    'auth/wrong-password':
      'Mot de passe incorrect.',

    'auth/invalid-credential':
      'E-mail ou mot de passe incorrect.',

    'auth/email-already-in-use':
      'Cette adresse e-mail possède déjà un compte.',

    'auth/weak-password':
      'Le mot de passe est trop faible.',

    'auth/too-many-requests':
      'Trop de tentatives. Réessayez plus tard.',

    'auth/network-request-failed':
      'Erreur réseau. Vérifiez votre connexion Internet.',

    'auth/operation-not-allowed':
      'La connexion par e-mail/mot de passe n’est pas activée dans Firebase.',

    'auth/api-key-not-valid':
      'La clé API Firebase configurée est invalide.',

    'auth/invalid-api-key':
      'La clé API Firebase configurée est invalide.'

  };


  return (
    messages[code] ||
    error?.message ||
    fallback
  );

}


/* =========================================================
   BACKEND SÉCURISÉ
   ========================================================= */

async function securedPost(
  path,
  payload = {}
) {

  const token =
    await getNexworldIdToken();


  let response;


  try {

    response =
      await fetch(
        path,
        {

          method: 'POST',

          cache: 'no-store',

          headers: {

            'Content-Type':
              'application/json',

            'Authorization':
              'Bearer ' + token

          },

          body:
            JSON.stringify(
              payload
            )

        }
      );

  } catch (error) {

    throw new Error(
      'Impossible de joindre le backend NEXWORLD. Vérifiez votre connexion.'
    );

  }


  let data = {};


  try {

    data =
      await response.json();

  } catch (_) {

    data = {};

  }


  if (
    !response.ok ||
    !data.ok
  ) {

    throw new Error(
      data.error ||
      `Backend NEXWORLD indisponible (HTTP ${response.status}).`
    );

  }


  return data;

}


/* =========================================================
   XTREAM
   ========================================================= */

async function xtreamSecureRequest(
  payload = {}
) {

  return securedPost(
    '/.netlify/functions/xtream',
    payload
  );

}


/* =========================================================
   SUPER ADMIN
   ========================================================= */

async function checkSuperAdmin() {

  return securedPost(
    '/.netlify/functions/bootstrap-admin',
    {
      action: 'check'
    }
  );

}


async function activateSuperAdmin() {

  return securedPost(
    '/.netlify/functions/bootstrap-admin',
    {
      action: 'activate'
    }
  );

}


/* =========================================================
   API PUBLIQUE
   ========================================================= */

window.NEXWORLD_AUTH = Object.freeze({

  initFirebaseAuth,

  onAuthStateChangedNexworld,

  getCurrentNexworldUser,

  signInNexworld,

  createNexworldAccount,

  resetNexworldPassword,

  signOutNexworld,

  getNexworldIdToken,

  securedPost,

  xtreamSecureRequest,

  checkSuperAdmin,

  activateSuperAdmin

});


window.NEXWORLD_AUTH_READY = true;


console.info(
  '[NEXWORLD] Firebase Auth V7.4.4 chargé.'
);
