// app.js (Projeto Original BuckDoces com showCobranca atualizado)

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  query,
  orderByChild,
  equalTo,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SUA_AUTH_DOMAIN",
  databaseURL: "SUA_DB_URL",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const root = document.getElementById("root");

function showLogin() {
  root.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input type="text" id="usuario" placeholder="Usuário" />
      <button onclick="verificarLogin()">Entrar</button>
    </div>
  `;
}

function verificarLogin() {
  const usuario = document.getElementById("usuario").value;
  if (usuario === "admin") {
    showDashboard();
  } else {
    alert("Usuário inválido");
  }
}

function showDashboard() {
  // Mantido como no projeto original, omitido aqui para foco na cobrança
}

function showCadastro() {
  // Mantido como no projeto original, omitido aqui para foco na cobrança
}

function showCobranca() {
  root.innerHTML = `
    <div class="card">
      <h2>Cobranças</h2>
      <input type="month" id="mesSelecionado" />
      <input type="text" id="buscaCliente" placeholder="Buscar cliente..." />
      <div id="calendario" class="calendar"></div>
      <div id="detalhesDia"></div>
    </div>
  `;

  document.getElementById("mesSelecionado").addEventListener("change", renderizarCalendario);
  document.getElementById("buscaCliente").addEventListener("input", buscarCliente);

  function renderizarCalendario() {
    const calendario = document.getElementById("calendario");
    calendario.innerHTML = "";
    const mesAno = document.getElementById("mesSelecionado").value;
    if (!mesAno) return;

    const [ano, mes] = mesAno.split("-").map(Number);
    const diasNoMes = new Date(ano, mes, 0).getDate();

    const vendasRef = ref(db, "vendas");
    onValue(vendasRef, (snapshot) => {
      const dados = snapshot.val();
      const vendasPorDia = {};
      for (const id in dados) {
        const venda = dados[id];
        const dataVenda = new Date(venda.data);
        const key = `${dataVenda.getFullYear()}-${String(
          dataVenda.getMonth() + 1
        ).padStart(2, "0")}-${String(dataVenda.getDate()).padStart(2, "0")}`;
        if (key.startsWith(`${ano}-${String(mes).padStart(2, "0")}`)) {
          if (!vendasPorDia[key]) vendasPorDia[key] = [];
          vendasPorDia[key].push({ ...venda, id });
        }
      }

      for (let dia = 1; dia <= diasNoMes; dia++) {
        const dataAtual = `${ano}-${String(mes).padStart(2, "0")}-${String(
          dia
        ).padStart(2, "0")}`;
        const divDia = document.createElement("div");
        divDia.className = "calendar-day";
        divDia.innerHTML = `<div class="calendar-day-value">${dia}</div>`;

        const vendasDoDia = vendasPorDia[dataAtual] || [];
        const total = vendasDoDia.reduce((soma, v) => soma + parseFloat(v.valor || 0), 0);

        if (total > 0) {
          divDia.innerHTML += `<div class="amount">R$ ${total.toFixed(2)}</div>`;
          divDia.addEventListener("click", () => mostrarDetalhesDia(dataAtual, vendasDoDia));
        }

        calendario.appendChild(divDia);
      }
    });
  }

  function mostrarDetalhesDia(data, vendas) {
    const detalhes = document.getElementById("detalhesDia");
    detalhes.innerHTML = `<h3>Vendas em ${data}</h3>`;

    const agrupado = {};
    vendas.forEach((v) => {
      if (!agrupado[v.telefone]) agrupado[v.telefone] = { nome: v.cliente, vendas: [] };
      agrupado[v.telefone].vendas.push(v);
    });

    for (const tel in agrupado) {
      const grupo = agrupado[tel];
      const total = grupo.vendas.reduce((s, v) => s + parseFloat(v.valor || 0), 0);

      const card = document.createElement("div");
      card.className = "day-card";
      card.innerHTML = `
        <h4>${grupo.nome} - ${tel}</h4>
        <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
      `;

      grupo.vendas.forEach((v) => {
        const div = document.createElement("div");
        div.innerHTML = `
          <p><strong>Data:</strong> ${v.data}</p>
          <p><strong>Local:</strong> ${v.local}</p>
          <p><strong>Valor:</strong> R$ ${parseFloat(v.valor).toFixed(2)}</p>
          <p><strong>Produtos:</strong> ${v.produtos}</p>
          <p><strong>Pagamento:</strong> ${v.pagamento}</p>
          <p><strong>Status:</strong>
            <select>
              <option ${v.status === "Pago" ? "selected" : ""}>Pago</option>
              <option ${v.status === "Parcial" ? "selected" : ""}>Parcial</option>
              <option ${v.status === "Não pago" ? "selected" : ""}>Não pago</option>
            </select>
          </p>
          <p><strong>Data programada:</strong> <input type="date" value="${v.programado || ""}" /></p>
          <button>Salvar</button>
          <hr />
        `;
        card.appendChild(div);
      });

      detalhes.appendChild(card);
    }
  }

  function buscarCliente() {
    const termo = document.getElementById("buscaCliente").value.toLowerCase();
    const cards = document.querySelectorAll(".day-card");
    cards.forEach((c) => {
      const nome = c.querySelector("h4").textContent.toLowerCase();
      c.style.display = nome.includes(termo) ? "block" : "none";
    });
  }

  const hoje = new Date();
  const mesPadrao = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  document.getElementById("mesSelecionado").value = mesPadrao;
  renderizarCalendario();
}

window.showLogin = showLogin;
window.showDashboard = showDashboard;
window.showCadastro = showCadastro;
window.showCobranca = showCobranca;

showLogin();
