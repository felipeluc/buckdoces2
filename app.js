import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const root = document.getElementById("root");

function showLogin() {
  root.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input type="email" id="email" placeholder="E-mail" />
      <input type="password" id="senha" placeholder="Senha" />
      <button id="loginBtn">Entrar</button>
      <p>Não tem conta? <a href="#" id="criarContaLink">Criar conta</a></p>
    </div>
  `;
  document.getElementById("loginBtn").onclick = login;
  document.getElementById("criarContaLink").onclick = showCadastro;
}

function showCadastro() {
  root.innerHTML = `
    <div class="card">
      <h2>Criar Conta</h2>
      <input type="email" id="cadastroEmail" placeholder="E-mail" />
      <input type="password" id="cadastroSenha" placeholder="Senha" />
      <button id="criarBtn">Criar</button>
      <p>Já tem conta? <a href="#" id="voltarLogin">Voltar ao login</a></p>
    </div>
  `;
  document.getElementById("criarBtn").onclick = criarConta;
  document.getElementById("voltarLogin").onclick = showLogin;
}

async function criarConta() {
  const email = document.getElementById("cadastroEmail").value;
  const senha = document.getElementById("cadastroSenha").value;
  try {
    await createUserWithEmailAndPassword(auth, email, senha);
  } catch (error) {
    alert("Erro ao criar conta: " + error.message);
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (error) {
    alert("Erro ao fazer login: " + error.message);
  }
}

function logout() {
  signOut(auth);
}

function showMainMenu() {
  root.innerHTML = `
    <div class="card">
      <h2>Menu</h2>
      <button id="novaVendaBtn">Cadastrar Venda</button>
      <button id="dashboardBtn">Dashboard</button>
      <button id="cobrancaBtn">Cobrança</button>
      <button onclick="logout()">Sair</button>
    </div>
  `;
  document.getElementById("novaVendaBtn").onclick = showCadastroVenda;
  document.getElementById("dashboardBtn").onclick = showDashboard;
  document.getElementById("cobrancaBtn").onclick = showCobranca;
}

function showCadastroVenda() {
  root.innerHTML = `
    <div class="card">
      <h2>Nova Venda</h2>
      <input type="text" id="cliente" placeholder="Cliente" />
      <input type="text" id="local" placeholder="Local da Venda" />
      <input type="number" id="valor" placeholder="Valor (R$)" />
      <select id="forma">
        <option value="">Forma de Pagamento</option>
        <option>Pix</option>
        <option>Dinheiro</option>
        <option>Cartão</option>
      </select>
      <label>Produtos vendidos:</label>
      <label><input type="checkbox" value="Trufa" class="prodCheckbox" /> Trufa</label>
      <label><input type="checkbox" value="Cone" class="prodCheckbox" /> Cone</label>
      <label><input type="checkbox" value="Bolo no pote" class="prodCheckbox" /> Bolo no pote</label>
      <label><input type="checkbox" value="Outros" class="prodCheckbox" /> Outros</label>
      <input type="date" id="data" />
      <input type="text" id="telefone" placeholder="Telefone (ex: 5511999999999)" />
      <textarea id="obs" placeholder="Observações (opcional)"></textarea>
      <button id="salvarBtn">Salvar</button>
      <button onclick="showMainMenu()">Voltar</button>
    </div>
  `;
  document.getElementById("salvarBtn").onclick = salvarVenda;
}

async function salvarVenda() {
  const cliente = document.getElementById("cliente").value.trim();
  const local = document.getElementById("local").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const forma = document.getElementById("forma").value;
  const data = document.getElementById("data").value;
  const telefone = document.getElementById("telefone").value.trim();
  const obs = document.getElementById("obs").value.trim();
  const produtos = Array.from(document.querySelectorAll(".prodCheckbox:checked")).map(p => p.value);

  if (!cliente || !local || isNaN(valor) || !forma || !data || produtos.length === 0) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const vendasRef = collection(db, "vendas");
  const q = query(vendasRef,
    where("cliente", "==", cliente),
    where("local", "==", local),
    where("valor", "==", valor),
    where("forma", "==", forma),
    where("produtos", "==", produtos),
    where("data", "==", data)
  );
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    alert("Venda já cadastrada.");
    return;
  }

  await addDoc(vendasRef, {
    cliente, local, valor, forma, data, produtos, telefone, obs, pago: false
  });

  if (telefone.startsWith("55")) {
    const mensagem = encodeURIComponent(`Olá ${cliente}! Obrigado pela compra de ${produtos.join(", ")} no valor de R$ ${valor.toFixed(2)}. Qualquer dúvida estou à disposição!`);
    window.open(`https://wa.me/${telefone}?text=${mensagem}`, "_blank");
  } else {
    alert("Número de telefone inválido. Use o formato: 55 + DDD + número.");
  }

  showMainMenu();
}
async function showDashboard() {
  root.innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <div id="totais"></div>
      <button onclick="showMainMenu()">Voltar</button>
    </div>
  `;

  const vendasRef = collection(db, "vendas");
  const snapshot = await getDocs(vendasRef);
  let total = 0;
  let totalReceber = 0;

  snapshot.forEach(doc => {
    const venda = doc.data();
    total += parseFloat(venda.valor) || 0;
    if (!venda.pago) {
      totalReceber += parseFloat(venda.valor) || 0;
    }
  });

  document.getElementById("totais").innerHTML = `
    <p><strong>Valor Total:</strong> R$ ${total.toFixed(2)}</p>
    <p><strong>Valor a Receber:</strong> R$ ${totalReceber.toFixed(2)}</p>
  `;
}
async function showCobranca() {
  root.innerHTML = `
    <div class="card">
      <h2>Cobranças</h2>
      <input type="month" id="mesFiltro" />
      <input type="text" id="buscaCliente" placeholder="Buscar cliente..." />
      <select id="filtroLocal">
        <option value="">Todos os locais</option>
        <option value="Feira">Feira</option>
        <option value="Delivery">Delivery</option>
      </select>
      <select id="filtroPagamento">
        <option value="">Todas as formas</option>
        <option value="Dinheiro">Dinheiro</option>
        <option value="Pix">Pix</option>
        <option value="Cartão">Cartão</option>
      </select>
      <div id="calendario" class="calendar"></div>
      <div id="detalhesDia" class="day-details"></div>
      <canvas id="graficoSemanal" style="max-width: 400px; margin: auto;"></canvas>
      <button onclick="showMainMenu()">Voltar</button>
    </div>
  `;

  const vendasRef = collection(db, "vendas");
  const snapshot = await getDocs(vendasRef);
  const vendas = [];

  snapshot.forEach(doc => {
    const v = doc.data();
    v.id = doc.id;
    vendas.push(v);
  });

  const inputMes = document.getElementById("mesFiltro");
  inputMes.value = new Date().toISOString().slice(0, 7);
  inputMes.addEventListener("change", renderCalendario);

  document.getElementById("buscaCliente").addEventListener("input", renderCalendario);
  document.getElementById("filtroLocal").addEventListener("change", renderCalendario);
  document.getElementById("filtroPagamento").addEventListener("change", renderCalendario);

  renderCalendario();

  function renderCalendario() {
    const mes = inputMes.value;
    if (!mes) return;

    const [ano, mesIndex] = mes.split("-").map(Number);
    const diasNoMes = new Date(ano, mesIndex, 0).getDate();

    const calendario = document.getElementById("calendario");
    calendario.innerHTML = "";

    const vendasFiltradas = vendas.filter(v => {
      const data = new Date(v.data);
      const filtroCliente = document.getElementById("buscaCliente").value.toLowerCase();
      const filtroLocal = document.getElementById("filtroLocal").value;
      const filtroPagamento = document.getElementById("filtroPagamento").value;

      return (
        data.getFullYear() === ano &&
        data.getMonth() + 1 === mesIndex &&
        (!filtroCliente || v.cliente.toLowerCase().includes(filtroCliente)) &&
        (!filtroLocal || v.local === filtroLocal) &&
        (!filtroPagamento || v.pagamento === filtroPagamento)
      );
    });

    const valoresPorDia = {};

    for (let i = 1; i <= diasNoMes; i++) {
      const diaStr = `${ano}-${String(mesIndex).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      valoresPorDia[diaStr] = vendasFiltradas
        .filter(v => v.data.startsWith(diaStr) && !v.pago)
        .reduce((soma, v) => soma + parseFloat(v.valor), 0);
    }

    for (let i = 1; i <= diasNoMes; i++) {
      const diaStr = `${ano}-${String(mesIndex).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const valorDia = valoresPorDia[diaStr];

      if (valorDia > 0) {
        const div = document.createElement("div");
        div.className = "calendar-day";
        div.innerHTML = `
          ${i}
          <div class="amount">R$ ${valorDia.toFixed(2)}</div>
        `;
        div.onclick = () => mostrarDetalhesDoDia(diaStr, vendasFiltradas.filter(v => v.data.startsWith(diaStr)));
        calendario.appendChild(div);
      } else {
        calendario.appendChild(document.createElement("div"));
      }
    }

    renderGraficoSemanal(vendasFiltradas, ano, mesIndex);
  }

  function mostrarDetalhesDoDia(dataSelecionada, vendasDia) {
    const container = document.getElementById("detalhesDia");
    container.innerHTML = `<h3>Vendas em ${dataSelecionada}</h3>`;

    vendasDia.forEach(v => {
      const vencido = new Date(v.data) < new Date() && !v.pago;
      const div = document.createElement("div");
      div.className = "day-card";
      div.style.border = vencido ? "1px solid red" : "";

      div.innerHTML = `
        <p><strong>Cliente:</strong> ${v.cliente}</p>
        <p><strong>Valor:</strong> R$ ${parseFloat(v.valor).toFixed(2)}</p>
        <p><strong>Local:</strong> ${v.local}</p>
        <p><strong>Pagamento:</strong> ${v.pagamento}</p>
        <p><strong>Observação:</strong> ${v.observacao || "-"}</p>
        <button onclick="atualizarStatus('${v.id}', true)">Cobrei - Já pago</button>
        <button onclick="atualizarStatus('${v.id}', false)">Cobrei - Não pago</button>
        <button onclick="reagendarVenda('${v.id}')">Reagendar</button>
      `;
      container.appendChild(div);
    });
  }

  async function atualizarStatus(id, status) {
    await updateDoc(doc(db, "vendas", id), { pago: status });
    showCobranca();
  }

  async function reagendarVenda(id) {
    const novaData = prompt("Nova data (AAAA-MM-DD):");
    if (novaData) {
      await updateDoc(doc(db, "vendas", id), { data: novaData });
      showCobranca();
    }
  }

  function renderGraficoSemanal(vendasFiltradas, ano, mesIndex) {
    const valoresPorSemana = [0, 0, 0, 0, 0];

    vendasFiltradas.forEach(v => {
      const dia = parseInt(v.data.split("-")[2]);
      const semana = Math.floor((dia - 1) / 7);
      valoresPorSemana[semana] += parseFloat(v.valor);
    });

    const ctx = document.getElementById("graficoSemanal").getContext("2d");
    if (window.graficoSemanal) window.graficoSemanal.destroy();

    window.graficoSemanal = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"],
        datasets: [{
          label: "Total por semana (R$)",
          data: valoresPorSemana,
          backgroundColor: "#f4a1af"
        }]
      }
    });
  }
}
function showCadastro() {
  root.innerHTML = `
    <div class="card">
      <h2>Nova Venda</h2>
      <input id="cliente" placeholder="Cliente" />
      <input id="local" placeholder="Local" />
      <input id="valor" type="number" placeholder="Valor (R$)" />
      <select id="produtos" multiple>
        <option>Cone</option>
        <option>Trufa</option>
        <option>Brownie</option>
      </select>
      <input id="formaPagamento" placeholder="Forma de pagamento" />
      <input id="telefone" placeholder="Telefone (ex: 5599999999999)" />
      <input id="data" type="date" />
      <button id="btnSalvar">Salvar</button>
      <button id="btnDashboard">Dashboard</button>
      <button id="btnCobranca">Cobrança</button>
    </div>
  `;

  document.getElementById('btnSalvar').onclick = async () => {
    const cliente = document.getElementById('cliente').value;
    const local = document.getElementById('local').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const produtos = Array.from(document.getElementById('produtos').selectedOptions).map(opt => opt.value);
    const formaPagamento = document.getElementById('formaPagamento').value;
    const telefone = document.getElementById('telefone').value.trim();
    const data = document.getElementById('data').value;

    if (!cliente || !local || !valor || produtos.length === 0 || !formaPagamento || !telefone || !data) {
      alert('Preencha todos os campos.');
      return;
    }

    // Verifica duplicidade
    const vendasRef = collection(db, 'vendas');
    const q = query(
      vendasRef,
      where('cliente', '==', cliente),
      where('local', '==', local),
      where('valor', '==', valor),
      where('produtos', '==', produtos),
      where('formaPagamento', '==', formaPagamento),
      where('data', '==', data)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      alert('Venda duplicada detectada.');
      return;
    }

    // Salvar no Firebase
    await addDoc(vendasRef, {
      cliente,
      local,
      valor,
      produtos,
      formaPagamento,
      telefone,
      data,
      criadoEm: serverTimestamp()
    });

    // Redirecionar para o WhatsApp
    const numeroWhats = telefone.replace(/[^0-9]/g, '');
    const link = `https://wa.me/${numeroWhats}?text=Olá%2C%20${encodeURIComponent(cliente)}!%20Seu%20comprovante%20foi%20registrado.%20Obrigada%20pela%20compra!`;
    window.open(link, '_blank');
  };

  document.getElementById('btnDashboard').onclick = showDashboard;
  document.getElementById('btnCobranca').onclick = showCobranca;
}
