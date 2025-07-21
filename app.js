// PARTE 1 - INICIALIZAÇÃO E AUTENTICAÇÃO
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

const appFirebase = initializeApp(firebaseConfig);
const auth = getAuth(appFirebase);
const db = getFirestore(appFirebase);

const app = document.getElementById("root");

onAuthStateChanged(auth, (user) => {
  if (user) {
    showMenu();
  } else {
    showLogin();
  }
});

function showLogin() {
  app.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input type="email" id="loginEmail" placeholder="Email" />
      <input type="password" id="loginPassword" placeholder="Senha" />
      <button onclick="login()">Entrar</button>
      <p>ou</p>
      <button onclick="showRegister()">Criar Conta</button>
    </div>
  `;
}

function showRegister() {
  app.innerHTML = `
    <div class="card">
      <h2>Cadastro</h2>
      <input type="email" id="registerEmail" placeholder="Email" />
      <input type="password" id="registerPassword" placeholder="Senha" />
      <button onclick="register()">Cadastrar</button>
      <p>ou</p>
      <button onclick="showLogin()">Voltar</button>
    </div>
  `;
}

window.login = async function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert("Erro ao logar: " + error.message);
  }
};

window.register = async function () {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Conta criada com sucesso!");
    showLogin();
  } catch (error) {
    alert("Erro ao cadastrar: " + error.message);
  }
};

window.logout = async function () {
  await signOut(auth);
};

function showMenu() {
  app.innerHTML = `
    <div class="card">
      <h2>Menu</h2>
      <button onclick="showCadastro()">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
      <button onclick="showAgenda()">Agenda</button>
      <button onclick="logout()">Sair</button>
    </div>
  `;
}
