import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGg5JtE_7gVRhTlRY30bpXsmMpvPEQ3tw",
  authDomain: "buckdoces.firebaseapp.com",
  projectId: "buckdoces",
  storageBucket: "buckdoces.firebasestorage.app",
  messagingSenderId: "781727917443",
  appId: "1:781727917443:web:c9709b3813d28ea60982b6",
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
  "João Buck": "João1234",
};

window.login = () => {
  const usuario = document.getElementById("user").value;
  const senha = document.getElementById("senha").value;
  if (senhas[usuario] === senha) {
    showTabs(usuario);
  } else {
    alert("Senha incorreta");
  }
};

function showTabs(user) {
  document.getElementById("main").innerHTML = `
    <div class="card">
      <button onclick="showCadastro('${user}')">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
    </div>
    <div id="conteudo" class="card"></div>
  `;
}

const produtosLista = [
  "Cone", "Trufa", "Bolo de pote", "Pão de mel", "Escondidinho de uva",
  "Bombom de uva", "BomBom de morango", "Coxinha de morango", "Camafeu",
  "Caixinha", "Mousse", "Lanche natural"
];

window.showCadastro = (usuario) => {
  const produtosCheckboxes = produtosLista.map(p => 
    `<label><input type="checkbox" name="produtos" value="${p}" /> ${p}</label>`).join("");

  document.getElementById("conteudo").innerHTML = `
    <h2>Cadastro de Venda</h2>
    <input id="cliente" placeholder="Nome do cliente" />
    <input id="local" placeholder="Local da venda" />
    <input id="valor" placeholder="Valor (R$)" type="number" />
    <select id="status">
      <option value="pago">Pago</option>
      <option value="nao">Não pago</option>
      <option value="parcial">Parcial</option>
    </select>
    <div id="extras"></div>
    <fieldset>
      <legend>O que foi vendido?</legend>
      ${produtosCheckboxes}
    </fieldset>
    <button onclick="cadastrar('${usuario}')">Salvar</button>
  `;

  document.getElementById("status").addEventListener("change", (e) => {
    const val = e.target.value;
    let html = "";
    if (val === "pago") {
      html = `<select id="forma"><option>dinheiro</option><option>cartão</option><option>pix</option></select>`;
    } else if (val === "nao") {
      html = `
        <input type="date" id="dataReceber" />
        <select id="forma"><option>dinheiro</option><option>cartão</option><option>pix</option></select>
      `;
    } else if (val === "parcial") {
      html = `
        <input type="number" id="valorParcial" placeholder="Valor recebido hoje" />
        <input type="number" id="falta" placeholder="Valor que falta" />
        <input type="date" id="dataReceber" />
        <select id="forma"><option>dinheiro</option><option>cartão</option><option>pix</option></select>
      `;
    }
    document.getElementById("extras").innerHTML = html;
  });
};

window.cadastrar = async (usuario) => {
  const cliente = document.getElementById("cliente").value.trim();
  const local = document.getElementById("local").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const status = document.getElementById("status").value;
  const forma = document.getElementById("forma")?.value || "";
  const dataReceber = document.getElementById("dataReceber")?.value || "";
  const valorParcial = parseFloat(document.getElementById("valorParcial")?.value || 0);
  const faltaReceber = parseFloat(document.getElementById("falta")?.value || 0);
  const data = new Date().toISOString().split("T")[0];

  const produtosSelecionados = Array.from(document.querySelectorAll("input[name='produtos']:checked"))
                                    .map(el => el.value);

  if (!cliente || !valor || produtosSelecionados.length === 0) {
    alert("Preencha todos os campos obrigatórios e selecione ao menos um produto.");
    return;
  }

  // Verifica se já existe venda com mesmo cliente e mesma data
  const q = query(collection(db, "vendas"), where("cliente", "==", cliente), where("data", "==", data));
  const snap = await getDocs(q);
  if (!snap.empty) {
    alert("Venda já cadastrada hoje para esse cliente!");
    return;
  }

  await addDoc(collection(db, "vendas"), {
    usuario, cliente, local, valor, status, forma,
    valorParcial: status === "parcial" ? valorParcial : null,
    faltaReceber: status === "parcial" ? faltaReceber : (status === "nao" ? valor : 0),
    dataReceber: status !== "pago" ? dataReceber : null,
    produtos: produtosSelecionados,
    data
  });

  alert("Venda salva!");
  showTabs(usuario);
};
