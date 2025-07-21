=import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

// ... Todas as funções anteriores mantidas aqui sem alteração

window.showCobranca = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  let html = `<h2>Cobrança</h2>
  <input type="month" id="mesFiltro" />
  <div id="calendario"></div>
  <div id="detalhesDia"></div>`;

  document.getElementById("conteudo").innerHTML = html;

  document.getElementById("mesFiltro").addEventListener("change", e => {
    const mes = e.target.value;
    renderizarCalendario(mes, vendas);
  });
};

function renderizarCalendario(mes, vendas) {
  const [ano, mesNum] = mes.split("-");
  const diasNoMes = new Date(ano, mesNum, 0).getDate();
  let html = `<div class="calendar">`;
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const diaStr = `${ano}-${mesNum.padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    const vendasDia = vendas.filter(v => v.dataReceber === diaStr);
    const total = vendasDia.reduce((acc, v) => acc + (v.faltaReceber || v.valor), 0);
    html += `<div class="calendar-day" onclick="mostrarDetalhes('${diaStr}')">
      <div>${dia}</div>
      <div class="calendar-day-value">R$ ${total.toFixed(2)}</div>
    </div>`;
  }
  html += `</div>`;
  document.getElementById("calendario").innerHTML = html;

  window.mostrarDetalhes = (dia) => {
    const vendasDia = vendas.filter(v => v.dataReceber === dia);
    let detalhes = `<h3>Detalhes de ${dia}</h3>`;
    if (vendasDia.length === 0) detalhes += `<p>Sem cobranças neste dia.</p>`;
    else {
      vendasDia.forEach(v => {
        detalhes += `
          <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px">
            <p><strong>${v.cliente}</strong> - ${v.local} - R$ ${v.faltaReceber || v.valor}</p>
            <button onclick="marcarPago('${v.id}')">Cobrei - já pago</button>
            <button onclick="naoPago('${v.id}')">Cobrei - não pago</button>
            <button onclick="reagendar('${v.id}')">Reagendar cobrança</button>
            <div id="reagendar-${v.id}"></div>
          </div>`;
      });
    }
    document.getElementById("detalhesDia").innerHTML = detalhes;
  }
}

// manter funções marcarPago, naoPago, reagendar, salvarReagendamento
