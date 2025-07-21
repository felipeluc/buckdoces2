import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
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

const produtosLista = [
  "Cone", "Trufa", "Bolo de pote", "Pão de mel",
  "Escondidinho de uva", "Bombom de uva", "BomBom de morango",
  "Coxinha de morango", "Camafeu", "Caixinha", "Mousse", "Lanche natural"
];

window.showCadastro = (usuario) => {
  const produtoOptions = produtosLista
    .map(p => `<label><input type="checkbox" value="${p}" /> ${p}</label>`)
    .join("");

  document.getElementById("conteudo").innerHTML = `
    <h2>Cadastro de Venda</h2>
    <input id="cliente" placeholder="Nome do cliente" />
    <input id="local" placeholder="Local da venda" />
    <input id="valor" placeholder="Valor (R$)" type="number" />
    <div><strong>Produtos vendidos:</strong>${produtoOptions}</div>
    <select id="status">
      <option value="pago">Pago</option>
      <option value="nao">Não pago</option>
      <option value="parcial">Parcial</option>
    </select>
    <div id="extras"></div>
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
  const produtosSelecionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

  const snap = await getDocs(collection(db, "vendas"));
  const duplicado = snap.docs.some(doc => {
    const d = doc.data();
    return d.usuario === usuario &&
           d.cliente === cliente &&
           d.local === local &&
           d.valor === valor &&
           d.status === status &&
           JSON.stringify(d.produtosVendidos || []) === JSON.stringify(produtosSelecionados) &&
           d.dataReceber === (status !== "pago" ? dataReceber : null) &&
           d.data === data;
  });

  if (duplicado) {
    alert("Venda duplicada. Já existe com os mesmos dados.");
    return;
  }

  await addDoc(collection(db, "vendas"), {
    usuario, cliente, local, valor, status, forma,
    valorParcial: status === "parcial" ? valorParcial : null,
    faltaReceber: status === "parcial" ? faltaReceber : (status === "nao" ? valor : 0),
    dataReceber: status !== "pago" ? dataReceber : null,
    data,
    produtosVendidos: produtosSelecionados
  });
  alert("Venda salva!");
};

window.showDashboard = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => doc.data());
  const hoje = new Date().toISOString().split("T")[0];
  const hojeVendas = vendas.filter(v => v.data === hoje);
  const totalHoje = hojeVendas.reduce((acc, v) => acc + v.valor, 0);
  const aReceber = vendas.filter(v => v.status !== "pago")
                         .reduce((acc, v) => acc + (v.faltaReceber || v.valor), 0);

  let html = `<h2>Dashboard</h2>
    <p>Vendas hoje: ${hojeVendas.length}</p>
    <p>Total vendido: R$ ${totalHoje.toFixed(2)}</p>
    <p>A receber: R$ ${aReceber.toFixed(2)}</p>
    <input type="month" id="mesSelect" />
    <ul id="vendasMes"></ul>`;

  document.getElementById("conteudo").innerHTML = html;

  document.getElementById("mesSelect").addEventListener("change", e => {
    const mes = e.target.value;
    const filtradas = vendas.filter(v => (v.dataReceber || "").startsWith(mes));
    const lista = filtradas.map(v => `<li>${v.dataReceber} - ${v.cliente} - ${v.local} - R$ ${v.faltaReceber || v.valor}</li>`).join("");
    document.getElementById("vendasMes").innerHTML = lista;
  });
};

window.showCobranca = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const hoje = new Date().toISOString().split("T")[0];
  const cobrarHoje = vendas.filter(v => v.dataReceber === hoje);

  let html = `<h2>Cobrança</h2><h3>Cobrar hoje</h3>`;
  if (cobrarHoje.length === 0) html += `<p>Nenhuma cobrança hoje.</p>`;
  cobrarHoje.forEach(v => {
    html += `
      <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px">
        <p><strong>${v.cliente}</strong> - ${v.local} - R$ ${v.faltaReceber || v.valor}</p>
        <button onclick="marcarPago('${v.id}')">Cobrei - já pago</button>
        <button onclick="naoPago('${v.id}')">Cobrei - não pago</button>
        <button onclick="reagendar('${v.id}')">Reagendar cobrança</button>
        <div id="reagendar-${v.id}"></div>
      </div>
    `;
  });

  html += `
    <hr><input type="month" id="mesFiltro" />
    <div id="calendarioCob"></div>
    <div id="detalhesDia"></div>
  `;
  document.getElementById("conteudo").innerHTML = html;

  document.getElementById("mesFiltro").addEventListener("change", e => {
    const mes = e.target.value;
    const dias = {};
    const cobrancas = vendas.filter(v => (v.dataReceber || "").startsWith(mes));
    cobrancas.forEach(v => {
      if (!dias[v.dataReceber]) dias[v.dataReceber] = 0;
      dias[v.dataReceber] += v.faltaReceber || v.valor;
    });

    const diasHtml = Object.entries(dias).map(([data, total]) =>
      `<div style="margin:5px 0"><button onclick="detalharDia('${data}')">${data} - R$ ${total.toFixed(2)}</button></div>`
    ).join("");

    document.getElementById("calendarioCob").innerHTML = diasHtml || "<p>Sem cobranças neste mês.</p>";
  });

  window.detalharDia = (data) => {
    const detalhes = vendas.filter(v => v.dataReceber === data);
    let html = `<h3>Detalhes de ${data}</h3>`;
    detalhes.forEach(v => {
      html += `
        <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px">
          <p><strong>${v.cliente}</strong> - ${v.local} - R$ ${v.faltaReceber || v.valor}</p>
          <button onclick="marcarPago('${v.id}')">Cobrei - já pago</button>
          <button onclick="naoPago('${v.id}')">Cobrei - não pago</button>
          <button onclick="reagendar('${v.id}')">Reagendar</button>
          <div id="reagendar-${v.id}"></div>
        </div>
      `;
    });
    document.getElementById("detalhesDia").innerHTML = html;
  };
};

window.marcarPago = async (id) => {
  const ref = doc(db, "vendas", id);
  await updateDoc(ref, { status: "pago", dataReceber: null, faltaReceber: 0 });
  alert("Status atualizado para pago");
  showCobranca();
};

window.naoPago = async (id) => {
  alert("A venda continua marcada como não paga.");
};

window.reagendar = (id) => {
  document.getElementById(`reagendar-${id}`).innerHTML = `
    <input type="date" id="novaData-${id}" />
    <button onclick="salvarReagendamento('${id}')">Salvar nova data</button>
  `;
};

window.salvarReagendamento = async (id) => {
  const novaData = document.getElementById(`novaData-${id}`).value;
  if (!novaData) return alert("Selecione a nova data");
  const ref = doc(db, "vendas", id);
  await updateDoc(ref, { dataReceber: novaData });
  alert("Data reagendada com sucesso");
  showCobranca();
};
