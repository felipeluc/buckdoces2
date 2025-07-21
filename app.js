// Parte 1: Firebase, Login original (usuário e senha), e navegação básica

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SUA_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

const appDiv = document.getElementById("app");

function showLogin() {
  appDiv.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input type="text" id="loginUsuario" placeholder="Usuário" />
      <input type="password" id="loginSenha" placeholder="Senha" />
      <button onclick="login()">Entrar</button>
    </div>
  `;
}

window.login = async function () {
  const usuario = document.getElementById("loginUsuario").value;
  const senha = document.getElementById("loginSenha").value;

  // Apenas um login simples local, sem autenticação Firebase para manter como original
  if (usuario === "admin" && senha === "1234") {
    localStorage.setItem("logado", "true");
    showMenu();
  } else {
    alert("Usuário ou senha incorretos.");
  }
};

function showMenu() {
  appDiv.innerHTML = `
    <div class="card">
      <button onclick="showCadastro()">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
      <button onclick="showAgenda()">Agenda</button>
      <button onclick="logout()">Sair</button>
    </div>
    <div id="conteudo"></div>
  `;
}

window.logout = function () {
  localStorage.removeItem("logado");
  showLogin();
};

// Verifica login ao iniciar
if (localStorage.getItem("logado") === "true") {
  showMenu();
} else {
  showLogin();
}

// Aqui continuaremos com showCadastro() na Parte 2
