import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword
} from "firebase/auth";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDGg5JtE_7gVRhTlRY30bpXsmMpvPEQ3tw",
  authDomain: "buckdoces.firebaseapp.com",
  projectId: "buckdoces",
  storageBucket: "buckdoces.firebasestorage.app",
  messagingSenderId: "781727917443",
  appId: "1:781727917443:web:c9709b3813d28ea60982b6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Aguarda login
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuário está logado - continue o app normalmente
    iniciarAplicacao();
  } else {
    // Usuário não logado - mostra mensagem em vez da tela branca
    document.body.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:100vh;flex-direction:column;text-align:center;padding:20px;">
        <h2>Você precisa estar logado para acessar.</h2>
        <p>Por favor, volte e faça login.</p>
      </div>
    `;
  }
});

// Função principal do app
function iniciarAplicacao() {
  // aqui continua seu app normalmente
  console.log("Usuário autenticado. Aplicação carregada.");
}
