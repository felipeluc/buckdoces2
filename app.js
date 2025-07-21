const root = document.getElementById("app");
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Estado global do usuário
let usuarioAtual = "";

function showLogin() {
  root.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input type="text" id="usuario" placeholder="Digite seu nome de usuário" />
      <button onclick="fazerLogin()">Entrar</button>
    </div>
  `;
}

window.fazerLogin = function () {
  const usuario = document.getElementById("usuario").value.trim();
  if (!usuario) {
    alert("Digite seu nome de usuário.");
    return;
  }
  usuarioAtual = usuario;
  showMenu();
};

function showMenu() {
  root.innerHTML = `
    <div class="card">
      <h2>Bem-vindo, ${usuarioAtual}</h2>
      <button onclick="showCadastro()">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
      <button onclick="showAgenda()">Agenda</button>
      <button onclick="showLogin()">Sair</button>
    </div>
  `;
}
