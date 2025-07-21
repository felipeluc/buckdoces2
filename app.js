// Firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
const root = document.getElementById('root');
let currentUser = null;

function showLogin() {
  root.innerHTML = `
    <div class="card">
      <h1>Login</h1>
      <select id="user">
        <option value="Ana">Ana Buck</option>
        <option value="João">João Buck</option>
      </select>
      <input type="password" id="password" placeholder="Senha" />
      <button onclick="login()">Entrar</button>
    </div>
  `;
}
showLogin();

window.login = function () {
  const user = document.getElementById('user').value;
  const password = document.getElementById('password').value;
  if ((user === "Ana" && password === "Ana1234") || (user === "João" && password === "João1234")) {
    currentUser = user;
    showTabs();
  } else {
    alert("Senha incorreta");
  }
};

window.showTabs = function () {
  root.innerHTML = `
    <div class="card">
      <h1>Olá, ${currentUser}</h1>
      <button onclick="showCadastro()">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
    </div>
  `;
};

window.showCadastro = function () {
  root.innerHTML = `
    <div class="card">
      <h1>Cadastrar Venda</h1>
      <input id="cliente" placeholder="Nome do cliente" />
      <input id="local" placeholder="Local de entrega" />
      <input id="valor" type="number" placeholder="Valor total" />

      <div class="checkbox-group">
        <label><input type="checkbox" value="Cone" />Cone</label>
        <label><input type="checkbox" value="Trufa" />Trufa</label>
        <label><input type="checkbox" value="Bolo de pote" />Bolo de pote</label>
        <label><input type="checkbox" value="Pão de mel" />Pão de mel</label>
        <label><input type="checkbox" value="Escondidinho de uva" />Escondidinho de uva</label>
        <label><input type="checkbox" value="Bombom de uva" />Bombom de uva</label>
        <label><input type="checkbox" value="Bombom de morango" />Bombom de morango</label>
        <label><input type="checkbox" value="Coxinha de morango" />Coxinha de morango</label>
        <label><input type="checkbox" value="Camafeu" />Camafeu</label>
        <label><input type="checkbox" value="Caixinha" />Caixinha</label>
        <label><input type="checkbox" value="Mousse" />Mousse</label>
        <label><input type="checkbox" value="Lanche natural" />Lanche natural</label>
      </div>

      <select id="status">
        <option value="Pago">Pago</option>
        <option value="Não pago">Não pago</option>
        <option value="Parcial">Parcial</option>
      </select>
      <input id="dataReceber" type="date" />
      <input id="forma" placeholder="Forma de pagamento" />
      <button onclick="salvarVenda()">Salvar</button>
    </div>
  `;
};

window.salvarVenda = async function () {
  const cliente = document.getElementById("cliente").value;
  const local = document.getElementById("local").value;
  const valor = document.getElementById("valor").value;
  const status = document.getElementById("status").value;
  const dataReceber = document.getElementById("dataReceber").value;
  const forma = document.getElementById("forma").value;
  const vendidos = Array.from(document.querySelectorAll(".checkbox-group input:checked")).map(el => el.value).join(", ");

  if (!cliente || !valor) {
    alert("Preencha cliente e valor");
    return;
  }

  const q = query(collection(db, "vendas"), where("cliente", "==", cliente), where("valor", "==", valor), where("data", "==", new Date().toISOString().slice(0,10)));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    alert("Venda já cadastrada hoje para esse cliente com esse valor.");
    return;
  }

  await addDoc(collection(db, "vendas"), {
    cliente,
    local,
    valor: parseFloat(valor),
    status,
    forma,
    produtos: vendidos,
    data: new Date().toISOString().slice(0,10),
    dataReceber,
    usuario: currentUser
  });

  alert("Venda salva!");
  showTabs();
};

window.showDashboard = async function () {
  root.innerHTML = '<div class="card"><h1>Dashboard</h1><div id="dashContent"></div></div>';
  const dashDiv = document.getElementById("dashContent");
  const vendasSnap = await getDocs(collection(db, "vendas"));
  const vendas = vendasSnap.docs.map(doc => doc.data());

  const hoje = new Date().toISOString().slice(0, 10);
  const vendasHoje = vendas.filter(v => v.data === hoje);
  const totalHoje = vendasHoje.reduce((acc, v) => acc + Number(v.valor), 0);
  const aReceber = vendas.filter(v => v.status !== "Pago").reduce((acc, v) => acc + Number(v.valor), 0);

  dashDiv.innerHTML = `
    <p>Vendas hoje: ${vendasHoje.length}</p>
    <p>Total vendido hoje: R$ ${totalHoje.toFixed(2)}</p>
    <p>Total a receber: R$ ${aReceber.toFixed(2)}</p>
  `;
};

window.showCobranca = async function () {
  root.innerHTML = '<div class="card"><h1>Cobranças</h1><div id="calendar"></div><div id="cobrancasDetalhe"></div></div>';

  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(v => v.status !== "Pago");

  const dias = {};
  for (let v of vendas) {
    if (!dias[v.dataReceber]) dias[v.dataReceber] = { total: 0, vendas: [] };
    dias[v.dataReceber].total += Number(v.valor);
    dias[v.dataReceber].vendas.push(v);
  }

  const cal = document.getElementById("calendar");
  for (let dia in dias) {
    const btn = document.createElement("button");
    btn.textContent = `${dia} – R$ ${dias[dia].total.toFixed(2)}`;
    btn.onclick = () => mostrarDetalhes(dia, dias[dia].vendas);
    cal.appendChild(btn);
  }
};

window.mostrarDetalhes = function (dia, vendas) {
  const div = document.getElementById("cobrancasDetalhe");
  div.innerHTML = `<h3>Cobranças em ${dia}</h3>`;

  vendas.forEach(v => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <p><strong>Cliente:</strong> ${v.cliente}</p>
      <p><strong>Valor:</strong> R$ ${v.valor}</p>
      <p><strong>Status:</strong> ${v.status}</p>
      <p><strong>Produtos:</strong> ${v.produtos}</p>
      <button onclick="atualizarStatus('${v.id}', 'Pago')">Cobrei - Já pago</button>
      <button onclick="atualizarStatus('${v.id}', 'Não pago')">Cobrei - Não pago</button>
      <input type="date" id="novaData-${v.id}" />
      <button onclick="reagendarCobranca('${v.id}')">Reagendar cobrança</button>
    `;
    div.appendChild(card);
  });
};

window.atualizarStatus = async function (id, novoStatus) {
  const ref = doc(db, "vendas", id);
  await updateDoc(ref, { status: novoStatus });
  alert("Status atualizado!");
  showCobranca();
};

window.reagendarCobranca = async function (id) {
  const nova = document.getElementById("novaData-" + id).value;
  if (!nova) return alert("Selecione nova data");
  await updateDoc(doc(db, "vendas", id), { dataReceber: nova });
  alert("Data reagendada!");
  showCobranca();
};
