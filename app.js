
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGg5JtE_7gVRhTlRY30bpXsmMpvPEQ3tw",
  authDomain: "buckdoces.firebaseapp.com",
  projectId: "buckdoces",
  storageBucket: "buckdoces.firebasestorage.app",
  messagingSenderId: "781727917443",
  appId: "1:781727917443:web:c9709b3813d28ea60982b6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.getElementById("root").innerHTML = `
  <h1>Buck Doces</h1>
  <div class="card">
    <select id="user">
      <option>Ana Buck</option>
      <option>João Buck</option>
    </select>
    <input type="password" id="senha" placeholder="Senha" />
    <button onclick="login()">Entrar</button>
  </div>
  <div id="main"></div>
`;

const senhas = {
  "Ana Buck": "Ana1234",
  "João Buck": "João1234"
};

window.login = () => {
  const usuario = document.getElementById("user").value;
  const senha = document.getElementById("senha").value;
  if (senhas[usuario] === senha) {
    document.getElementById("main").innerHTML = `
      <div class="card">
        <h2>Cadastro de Venda</h2>
        <input id="cliente" placeholder="Nome do cliente" />
        <input id="local" placeholder="Local da venda" />
        <input id="valor" placeholder="Valor (R$)" type="number" />
        <button onclick="cadastrar('${usuario}')">Salvar</button>
      </div>
    `;
  } else {
    alert("Senha incorreta");
  }
};

window.cadastrar = async (usuario) => {
  const cliente = document.getElementById("cliente").value;
  const local = document.getElementById("local").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const data = new Date().toISOString().split("T")[0];
  await addDoc(collection(db, "vendas"), {
    usuario, cliente, local, valor, data
  });
  alert("Venda salva!");
};
