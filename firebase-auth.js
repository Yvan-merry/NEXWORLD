/* =========================================================
   NEXWORLD — Firebase Authentication V2
   =========================================================
   Projet Firebase :
   nexworld-tv

   IMPORTANT :
   - La clé API ci-dessous est la clé publique Web Firebase.
   - Aucun mot de passe utilisateur n'est stocké.
   - Aucun mot de passe Xtream n'est stocké.
   - Les tokens Firebase sont utilisés uniquement en mémoire.
   ========================================================= */

'use strict';


/* =========================================================
   CONFIGURATION FIREBASE WEB
   ========================================================= */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDyxcMx0YK8XEI_Al-zF1LvlTBapDnbDXQ",
  authDomain: "nexworld-tv.firebaseapp.com",
  projectId: "nexworld-tv",
  storageBucket: "nexworld-tv.firebasestorage.app",
  messagingSenderId: "262610525162",
  appId: "1:262610525162:web:b49643340dcd0fb7bb7093"
};


/* =========================================================
   ETAT
   ========================================================= */

let firebaseApp = null;
let firebaseAuth = null;
let firebaseReady = false;


/* =========================================================
   INITIALISATION FIREBASE
   ========================================================= */

async function initFirebaseAuth(){

  if(firebaseReady && firebaseAuth){
    return firebaseAuth;
  }

  if(!window.firebase){
    throw new Error(
      "Firebase n'est pas chargé."
    );
  }

  try{

    /*
     * Si Firebase a déjà été initialisé
     * par un autre module, on réutilise
     * l'application existante.
     */

    firebaseApp =
      window.firebase.apps &&
      window.firebase.apps.length
        ? window.firebase.app()
        : window.firebase.initializeApp(
            FIREBASE_CONFIG
          );

    firebaseAuth =
      window.firebase.auth(
        firebaseApp
      );

    firebaseReady=true;

    return firebaseAuth;

  }catch(error){

    console.error(
      "NEXWORLD Firebase initialization:",
      error
    );

    firebaseReady=false;

    throw new Error(
      "Impossible d'initialiser Firebase : "+
      (
        error?.message||
        "configuration Firebase invalide."
      )
    );
  }
}


/* =========================================================
   UTILITAIRE : MESSAGE FIREBASE
   ========================================================= */

function firebaseErrorMessage(error){

  const code=
    String(
      error?.code||
      ''
    );

  const message=
    String(
      error?.message||
      ''
    );

  if(
    code.includes('api-key-not-valid')||
    code.includes('invalid-api-key')
  ){

    return (
      "La clé API Firebase utilisée par NEXWORLD "+
      "est invalide ou n'est pas associée à la bonne "+
      "application Web."
    );
  }

  if(
    code.includes('invalid-credential')||
    code.includes('invalid-login-credentials')
  ){

    return (
      "Adresse e-mail ou mot de passe incorrect."
    );
  }

  if(
    code.includes('user-not-found')
  ){

    return (
      "Aucun compte Firebase ne correspond à cette adresse."
    );
  }

  if(
    code.includes('wrong-password')||
    code.includes('invalid-password')
  ){

    return (
      "Mot de passe incorrect."
    );
  }

  if(
    code.includes('email-already-in-use')
  ){

    return (
      "Cette adresse e-mail possède déjà un compte."
    );
  }

  if(
    code.includes('weak-password')
  ){

    return (
      "Le mot de passe est trop faible."
    );
  }

  if(
    code.includes('too-many-requests')
  ){

    return (
      "Trop de tentatives. Réessayez plus tard."
    );
  }

  if(
    code.includes('network-request-failed')
  ){

    return (
      "Connexion Internet indisponible."
    );
  }

  return message||
    "Une erreur Firebase est survenue.";
}


/* =========================================================
   CONNEXION
   ========================================================= */

async function signInNexworld(
  email,
  password
){

  const auth=
    await initFirebaseAuth();

  const cleanEmail=
    String(email||'').trim();

  if(!cleanEmail){
    throw new Error(
      "Adresse e-mail requise."
    );
  }

  if(!password){
    throw new Error(
      "Mot de passe requis."
    );
  }

  try{

    const result=
      await auth.signInWithEmailAndPassword(
        cleanEmail,
        password
      );

    return result.user;

  }catch(error){

    console.error(
      "NEXWORLD sign-in:",
      error
    );

    throw new Error(
      firebaseErrorMessage(error)
    );
  }
}


/* =========================================================
   CREATION DE COMPTE
   ========================================================= */

async function createNexworldAccount(
  email,
  password
){

  const auth=
    await initFirebaseAuth();

  const cleanEmail=
    String(email||'').trim();

  if(!cleanEmail){
    throw new Error(
      "Adresse e-mail requise."
    );
  }

  if(!password){
    throw new Error(
      "Mot de passe requis."
    );
  }

  try{

    const result=
      await auth.createUserWithEmailAndPassword(
        cleanEmail,
        password
      );

    return result.user;

  }catch(error){

    console.error(
      "NEXWORLD create account:",
      error
    );

    throw new Error(
      firebaseErrorMessage(error)
    );
  }
}


/* =========================================================
   MOT DE PASSE OUBLIE
   ========================================================= */

async function resetNexworldPassword(
  email
){

  const auth=
    await initFirebaseAuth();

  const cleanEmail=
    String(email||'').trim();

  if(!cleanEmail){
    throw new Error(
      "Entrez votre adresse e-mail."
    );
  }

  try{

    await auth.sendPasswordResetEmail(
      cleanEmail
    );

  }catch(error){

    console.error(
      "NEXWORLD password reset:",
      error
    );

    throw new Error(
      firebaseErrorMessage(error)
    );
  }
}


/* =========================================================
   DECONNEXION
   ========================================================= */

async function signOutNexworld(){

  const auth=
    await initFirebaseAuth();

  await auth.signOut();
}


/* =========================================================
   UTILITAIRE TOKEN FIREBASE
   ========================================================= */

async function getNexworldIdToken(){

  const auth=
    await initFirebaseAuth();

  if(!auth.currentUser){

    throw new Error(
      "Aucune session NEXWORLD active."
    );
  }

  try{

    return await auth.currentUser.getIdToken(
      true
    );

  }catch(error){

    console.error(
      "NEXWORLD token:",
      error
    );

    throw new Error(
      "Impossible de récupérer la session Firebase."
    );
  }
}


/* =========================================================
   REQUETE XTREAM SECURISEE
   ========================================================= */

async function xtreamSecureRequest(
  payload
){

  const token=
    await getNexworldIdToken();

  const response=
    await fetch(
      "/.netlify/functions/xtream",
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json",

          "Authorization":
            "Bearer "+token
        },

        body:JSON.stringify(
          payload||{}
        )
      }
    );

  let data;

  try{

    data=
      await response.json();

  }catch{

    throw new Error(
      "Réponse invalide du backend NEXWORLD."
    );
  }

  if(
    !response.ok||
    !data.ok
  ){

    throw new Error(
      data.error||
      "Requête Xtream refusée."
    );
  }

  return data;
}


/* =========================================================
   REQUETE STALKER SECURISEE
   ========================================================= */

async function stalkerSecureRequest(
  payload
){

  const token=
    await getNexworldIdToken();

  const response=
    await fetch(
      "/.netlify/functions/stalker",
      {
        method:"POST",

        cache:"no-store",

        headers:{
          "Content-Type":
            "application/json",

          "Authorization":
            "Bearer "+token
        },

        body:JSON.stringify(
          payload||{}
        )
      }
    );

  let data;

  try{

    data=
      await response.json();

  }catch{

    throw new Error(
      "Réponse invalide du backend Stalker."
    );
  }

  if(
    !response.ok||
    !data.ok
  ){

    throw new Error(
      data.error||
      "Requête Stalker refusée."
    );
  }

  return data;
}


/* =========================================================
   UI COMPTE
   ========================================================= */

function createAuthUI(){

  if(
    document.getElementById(
      "nexworldAccountButton"
    )
  ){
    return;
  }

  const brand=
    document.querySelector(
      ".brand"
    );

  if(!brand)return;


  /*
   * BOUTON COMPTE
   */

  const button=
    document.createElement(
      "button"
    );

  button.id=
    "nexworldAccountButton";

  button.type=
    "button";

  button.innerHTML=
    "👤 <span>Compte</span>";

  button.style.cssText=`
    margin-left:auto;
    display:flex;
    align-items:center;
    gap:7px;
    background:rgba(15,23,42,.55);
    color:#f4f7fb;
    border:1px solid #263653;
    border-radius:999px;
    padding:10px 16px;
    font-size:15px;
    font-weight:700;
    cursor:pointer;
    white-space:nowrap;
  `;


  /*
   * Le status existant ne doit pas
   * empêcher l'affichage du bouton.
   */

  const status=
    document.getElementById(
      "status"
    );

  if(status){
    brand.insertBefore(
      button,
      status
    );
  }else{
    brand.appendChild(
      button
    );
  }


  /*
   * PANNEAU
   */

  const panel=
    document.createElement(
      "div"
    );

  panel.id=
    "nexworldAuthPanel";

  panel.innerHTML=`

    <div class="nex-auth-backdrop"
         data-auth-close></div>

    <div class="nex-auth-sheet">

      <button
        type="button"
        class="nex-auth-close"
        data-auth-close>
        Fermer
      </button>

      <h2>Connexion sécurisée</h2>

      <p class="nex-auth-subtitle">
        Accédez à votre compte NEXWORLD.
      </p>

      <label>
        Adresse e-mail
      </label>

      <input
        id="nexAuthEmail"
        type="email"
        autocomplete="email"
        placeholder="vous@example.com">

      <label>
        Mot de passe
      </label>

      <input
        id="nexAuthPassword"
        type="password"
        autocomplete="current-password"
        placeholder="Mot de passe">

      <button
        id="nexAuthLogin"
        class="nex-auth-primary">
        Se connecter
      </button>

      <button
        id="nexAuthCreate"
        class="nex-auth-secondary">
        Créer un compte
      </button>

      <button
        id="nexAuthReset"
        class="nex-auth-secondary">
        Mot de passe oublié
      </button>

      <button
        id="nexAuthSuperAdmin"
        class="nex-auth-super"
        style="display:none">
        Activer Super Admin
      </button>

      <button
        id="nexAuthLogout"
        class="nex-auth-secondary"
        style="display:none">
        Déconnexion
      </button>

      <div
        id="nexAuthState"
        class="nex-auth-state">
        Aucun compte connecté.
      </div>

      <div
        id="nexAuthMessage"
        class="nex-auth-message">
      </div>

    </div>
  `;

  document.body.appendChild(
    panel
  );


  /*
   * STYLES
   */

  const style=
    document.createElement(
      "style"
    );

  style.textContent=`

    #nexworldAuthPanel{
      position:fixed;
      inset:0;
      z-index:9999;
      display:none;
      align-items:center;
      justify-content:center;
      padding:16px;
    }

    #nexworldAuthPanel.show{
      display:flex;
    }

    .nex-auth-backdrop{
      position:absolute;
      inset:0;
      background:rgba(2,6,23,.84);
      backdrop-filter:blur(12px);
    }

    .nex-auth-sheet{
      position:relative;
      z-index:2;
      width:min(520px,100%);
      max-height:94vh;
      overflow:auto;
      background:#101b2f;
      border:1px solid #263653;
      border-radius:24px;
      padding:22px;
      box-shadow:0 30px 90px rgba(0,0,0,.5);
    }

    .nex-auth-sheet h2{
      margin:4px 0 5px;
      font-size:24px;
    }

    .nex-auth-subtitle{
      margin:0 0 18px;
      color:#94a3b8;
      font-size:13px;
    }

    .nex-auth-sheet label{
      display:block;
      margin:11px 0 6px;
      color:#94a3b8;
      font-size:12px;
    }

    .nex-auth-sheet input{
      width:100%;
      padding:13px;
      border-radius:14px;
      border:1px solid #263653;
      background:#0b1325;
      color:#f4f7fb;
      outline:none;
      font-size:14px;
    }

    .nex-auth-sheet input:focus{
      border-color:#22d3ee;
    }

    .nex-auth-primary,
    .nex-auth-secondary,
    .nex-auth-super{
      width:100%;
      border:0;
      border-radius:14px;
      padding:13px;
      margin-top:10px;
      font-size:14px;
      font-weight:800;
      cursor:pointer;
    }

    .nex-auth-primary{
      background:#22d3ee;
      color:#07111f;
    }

    .nex-auth-secondary{
      background:#263653;
      color:#f4f7fb;
    }

    .nex-auth-super{
      background:#a855f7;
      color:white;
    }

    .nex-auth-close{
      float:right;
      border:1px solid #263653;
      background:#1c2a43;
      color:#f4f7fb;
      border-radius:10px;
      padding:7px 10px;
      cursor:pointer;
    }

    .nex-auth-state{
      margin-top:14px;
      padding:12px;
      background:#16233b;
      border:1px solid #263653;
      border-radius:14px;
      color:#c5cfdd;
      font-size:13px;
    }

    .nex-auth-message{
      margin-top:10px;
      padding:11px;
      border-radius:14px;
      background:rgba(251,113,133,.06);
      border:1px solid rgba(251,113,133,.35);
      color:#fb7185;
      font-size:12px;
      line-height:1.45;
      display:none;
    }

    .nex-auth-message.show{
      display:block;
    }

    @media(max-width:580px){

      #nexworldAccountButton span{
        display:none;
      }

      #nexworldAccountButton{
        padding:10px 13px!important;
      }

      .nex-auth-sheet{
        padding:18px;
        border-radius:22px;
      }
    }
  `;

  document.head.appendChild(
    style
  );


  /*
   * EVENEMENTS
   */

  button.onclick=()=>{
    panel.classList.add(
      "show"
    );

    updateAuthUI();
  };

  panel
    .querySelectorAll(
      "[data-auth-close]"
    )
    .forEach(el=>{
      el.onclick=()=>{
        panel.classList.remove(
          "show"
        );
      };
    });


  document
    .getElementById(
      "nexAuthLogin"
    )
    .onclick=
      handleLogin;


  document
    .getElementById(
      "nexAuthCreate"
    )
    .onclick=
      handleCreateAccount;


  document
    .getElementById(
      "nexAuthReset"
    )
    .onclick=
      handleResetPassword;


  document
    .getElementById(
      "nexAuthLogout"
    )
    .onclick=
      handleLogout;


  document
    .getElementById(
      "nexAuthSuperAdmin"
    )
    .onclick=
      handleSuperAdmin;


  /*
   * ENTREE CLAVIER
   */

  [
    "nexAuthEmail",
    "nexAuthPassword"
  ].forEach(id=>{

    const el=
      document.getElementById(id);

    if(el){

      el.addEventListener(
        "keydown",
        e=>{

          if(
            e.key==="Enter"
          ){
            handleLogin();
          }

        }
      );
    }
  });
}


/* =========================================================
   MESSAGE UI
   ========================================================= */

function authMessage(
  text,
  error=true
){

  const el=
    document.getElementById(
      "nexAuthMessage"
    );

  if(!el)return;

  el.textContent=
    text||"";

  el.classList.toggle(
    "show",
    Boolean(text)
  );

  if(!error){

    el.style.color=
      "#34d399";

    el.style.borderColor=
      "rgba(52,211,153,.35)";

    el.style.background=
      "rgba(52,211,153,.06)";

  }else{

    el.style.color=
      "#fb7185";

    el.style.borderColor=
      "rgba(251,113,133,.35)";

    el.style.background=
      "rgba(251,113,133,.06)";
  }
}


/* =========================================================
   UI ETAT COMPTE
   ========================================================= */

function updateAuthUI(
  user=null
){

  const stateEl=
    document.getElementById(
      "nexAuthState"
    );

  const logout=
    document.getElementById(
      "nexAuthLogout"
    );

  const superAdmin=
    document.getElementById(
      "nexAuthSuperAdmin"
    );

  const login=
    document.getElementById(
      "nexAuthLogin"
    );

  const create=
    document.getElementById(
      "nexAuthCreate"
    );

  const reset=
    document.getElementById(
      "nexAuthReset"
    );

  const password=
    document.getElementById(
      "nexAuthPassword"
    );


  if(!user){

    if(stateEl)
      stateEl.textContent=
        "Aucun compte connecté.";

    if(logout)
      logout.style.display=
        "none";

    if(superAdmin)
      superAdmin.style.display=
        "none";

    if(login)
      login.style.display=
        "block";

    if(create)
      create.style.display=
        "block";

    if(reset)
      reset.style.display=
        "block";

    if(password)
      password.disabled=
        false;

    return;
  }


  if(stateEl){

    stateEl.innerHTML=
      `<b>Compte connecté</b><br>`+
      `${escapeAuthHTML(user.email||'')}`;
  }


  if(logout)
    logout.style.display=
      "block";

  /*
   * Super Admin est accessible uniquement
   * lorsqu'une session Firebase existe.
   */
  if(superAdmin)
    superAdmin.style.display=
      "block";

  if(login)
    login.style.display=
      "none";

  if(create)
    create.style.display=
      "none";

  if(reset)
    reset.style.display=
      "none";

  if(password)
    password.disabled=
      true;
}


/* =========================================================
   ECHAPPEMENT UI
   ========================================================= */

function escapeAuthHTML(value){

 return String(value||'')
  .replace(/[&<>"']/g,c=>({
   "&":"&amp;",
   "<":"&lt;",
   ">":"&gt;",
   '"':"&quot;",
   "'":"&#39;"
  }[c]));
}


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(){

 const email=
  document
   .getElementById(
    "nexAuthEmail"
   )
   ?.value||
  "";

 const password=
  document
   .getElementById(
    "nexAuthPassword"
   )
   ?.value||
  "";

 authMessage(
  "Connexion en cours…",
  false
 );

 try{

  const user=
    await signInNexworld(
      email,
      password
    );

  authMessage(
    "Connexion réussie.",
    false
  );

  updateAuthUI(
    user
  );

  if(
    window.NEXWORLD_AUTH_ON_LOGIN
  ){
    window.NEXWORLD_AUTH_ON_LOGIN(
      user
    );
  }

 }catch(error){

  authMessage(
    error?.message||
    "Connexion impossible.",
    true
  );
 }
}


/* =========================================================
   CREATION COMPTE
   ========================================================= */

async function handleCreateAccount(){

 const email=
  document
   .getElementById(
    "nexAuthEmail"
   )
   ?.value||
  "";

 const password=
  document
   .getElementById(
    "nexAuthPassword"
   )
   ?.value||
  "";

 if(
  password.length<6
 ){

  authMessage(
   "Utilisez un mot de passe d'au moins 6 caractères.",
   true
  );

  return;
 }

 authMessage(
  "Création du compte…",
  false
 );

 try{

  const user=
   await createNexworldAccount(
    email,
    password
   );

  authMessage(
   "Compte créé avec succès.",
   false
  );

  updateAuthUI(
   user
  );

 }catch(error){

  authMessage(
   error?.message||
   "Création impossible.",
   true
  );
 }
}


/* =========================================================
   RESET MOT DE PASSE
   ========================================================= */

async function handleResetPassword(){

 const email=
  document
   .getElementById(
    "nexAuthEmail"
   )
   ?.value||
  "";

 try{

  await resetNexworldPassword(
   email
  );

  authMessage(
   "E-mail de réinitialisation envoyé.",
   false
  );

 }catch(error){

  authMessage(
   error?.message||
   "Impossible d'envoyer l'e-mail.",
   true
  );
 }
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function handleLogout(){

 try{

  await signOutNexworld();

  authMessage(
   "Déconnexion réussie.",
   false
  );

  updateAuthUI(
   null
  );

 }catch(error){

  authMessage(
   error?.message||
   "Déconnexion impossible.",
   true
  );
 }
}


/* =========================================================
   SUPER ADMIN
   ========================================================= */

async function handleSuperAdmin(){

 /*
  * Le bootstrap-admin est volontairement appelé
  * uniquement avec une session Firebase valide.
  */

 try{

  const token=
    await getNexworldIdToken();

  const response=
    await fetch(
      "/.netlify/functions/bootstrap-admin",
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json",

          "Authorization":
            "Bearer "+token
        },

        body:JSON.stringify({})
      }
    );

  let data={};

  try{
    data=
      await response.json();
  }catch{}

  if(
    !response.ok||
    data.ok===false
  ){

    throw new Error(
      data.error||
      `Activation Super Admin refusée (HTTP ${response.status}).`
    );
  }

  authMessage(
    data.message||
    "Super Admin activé avec succès.",
    false
  );

 }catch(error){

  console.error(
    "NEXWORLD Super Admin:",
    error
  );

  authMessage(
    error?.message||
    "Activation Super Admin impossible.",
    true
  );
 }
}


/* =========================================================
   ECOUTE SESSION FIREBASE
   ========================================================= */

async function listenFirebaseAuth(){

 try{

  const auth=
    await initFirebaseAuth();

  auth.onAuthStateChanged(
    user=>{

      updateAuthUI(
        user||null
      );

      if(
        window.NEXWORLD_AUTH_ON_STATE
      ){

        window.NEXWORLD_AUTH_ON_STATE(
          user||null
        );
      }
    }
  );

 }catch(error){

  console.error(
    "NEXWORLD Firebase listener:",
    error
  );

  updateAuthUI(
    null
  );

  authMessage(
    error?.message||
    "Firebase indisponible.",
    true
  );
 }
}


/* =========================================================
   API PUBLIQUE
   ========================================================= */

window.NEXWORLD_AUTH={

  initFirebaseAuth,

  signInNexworld,

  createNexworldAccount,

  resetNexworldPassword,

  signOutNexworld,

  getNexworldIdToken,

  xtreamSecureRequest,

  stalkerSecureRequest

};


/* =========================================================
   DEMARRAGE
   ========================================================= */

function startNexworldAuth(){

  createAuthUI();

  listenFirebaseAuth();

}


/*
 * firebase-auth.js est chargé à la fin de index.html.
 * DOMContentLoaded peut donc déjà être passé.
 */

if(
 document.readyState==="loading"
){

 document.addEventListener(
  "DOMContentLoaded",
  startNexworldAuth,
  {once:true}
 );

}else{

 startNexworldAuth();

}
