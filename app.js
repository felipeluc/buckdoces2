import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, updateDoc, doc
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

window.showCadastro = (usuario) => {
  document.getElementById("conteudo").innerHTML = `
    <h2>Cadastro de Venda</h2>
    <input id="cliente" placeholder="Nome do cliente" />
    <input id="local" placeholder="Local da venda" />
    <input id="valor" placeholder="Valor (R$)" type="number" />
    <select id="produtos" multiple size="5">
      <option>Cone</option>
      <option>Trufa</option>
      <option>Brownie</option>
      <option>Brigadeiro</option>
      <option>Pão de mel</option>
    </select>
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
      html = `<input type="date" id="dataReceber" />
              <select id="forma"><option>dinheiro</option><option>cartão</option><option>pix</option></select>`;
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
  const cliente = document.getElementById("cliente").value;
  const local = document.getElementById("local").value;
  const valor = parseFloat(document.getElementById("valor").value);
  const status = document.getElementById("status").value;
  const produtos = Array.from(document.getElementById("produtos").selectedOptions).map(o => o.value);
  const forma = document.getElementById("forma")?.value || "";
  const dataReceber = document.getElementById("dataReceber")?.value || "";
  const valorParcial = parseFloat(document.getElementById("valorParcial")?.value || 0);
  const faltaReceber = parseFloat(document.getElementById("falta")?.value || 0);
  const data = new Date().toISOString().split("T")[0];

  // Bloqueio de duplicado total
  const snap = await getDocs(collection(db, "vendas"));
  const duplicado = snap.docs.find(doc => {
    const d = doc.data();
    return d.usuario === usuario &&
      d.cliente === cliente &&
      d.local === local &&
      d.valor === valor &&
      JSON.stringify(d.produtos || []) === JSON.stringify(produtos) &&
      d.status === status &&
      d.forma === forma &&
      (d.dataReceber || "") === dataReceber &&
      (d.valorParcial || 0) === valorParcial &&
      (d.faltaReceber || 0) === faltaReceber &&
      d.data === data;
  });

  if (duplicado) {
    alert("Essa venda já foi cadastrada!");
    return;
  }

  await addDoc(collection(db, "vendas"), {
    usuario, cliente, local, valor, status, produtos, forma,
    valorParcial: status === "parcial" ? valorParcial : null,
    faltaReceber: status === "parcial" ? faltaReceber : (status === "nao" ? valor : 0),
    dataReceber: status !== "pago" ? dataReceber : null,
    data
  });

  alert("Venda salva!");
};

<div id="dashboard" class="p-4">
  <h2 class="text-xl font-bold mb-4">Dashboard</h2>
  <div class="grid grid-cols-2 gap-4">
    <div class="bg-green-100 p-4 rounded-xl shadow">
      <p class="text-sm text-gray-600">Total Vendido</p>
      <p id="total-vendas" class="text-xl font-bold">R$ 0,00</p>
    </div>
    <div class="bg-yellow-100 p-4 rounded-xl shadow">
      <p class="text-sm text-gray-600">Total a Receber</p>
      <p id="total-pendente" class="text-xl font-bold">R$ 0,00</p>
    </div>
  </div>
</div>

<div id="cobrancas" class="p-4">
  <h2 class="text-xl font-bold mb-4 mt-6">Cobranças</h2>
  
  <!-- Filtro por mês -->
  <div class="flex items-center mb-4">
    <label for="mesFiltro" class="mr-2">Filtrar por mês:</label>
    <input type="month" id="mesFiltro" class="border p-2 rounded" />
    <button onclick="filtrarCobrancasPorMes()" class="ml-2 bg-blue-500 text-white px-4 py-2 rounded">Filtrar</button>
  </div>

  <!-- Resultado do filtro -->
  <div id="resumoCobrancasMes" class="mb-4 hidden">
    <h3 class="font-bold">Resumo do mês:</h3>
    <p id="valorTotalMes"></p>
  </div>

  <!-- Lista de cobranças -->
  <div id="listaCobrancas"></div>
</div>

<script>
  async function filtrarCobrancasPorMes() {
    const mes = document.getElementById("mesFiltro").value;
    if (!mes) return;
    const [ano, mesStr] = mes.split("-");
    const mesNum = parseInt(mesStr);

    const snapshot = await getDocs(collection(db, "vendas"));
    const cobrancas = [];
    let total = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const dataVenda = new Date(data.data);
      if (
        dataVenda.getMonth() + 1 === mesNum &&
        dataVenda.getFullYear() === parseInt(ano)
      ) {
        cobrancas.push({ id: doc.id, ...data });
        total += parseFloat(data.valor);
      }
    });

    document.getElementById("resumoCobrancasMes").classList.remove("hidden");
    document.getElementById("valorTotalMes").innerText = `Total: R$ ${total.toFixed(2)}`;

    const lista = document.getElementById("listaCobrancas");
    lista.innerHTML = "";

    cobrancas.forEach(c => {
      const div = document.createElement("div");
      div.className = "border p-3 rounded mb-2 shadow";
      div.innerHTML = `
        <p><strong>Cliente:</strong> ${c.cliente}</p>
        <p><strong>Valor:</strong> R$ ${c.valor}</p>
        <p><strong>Data:</strong> ${c.data}</p>
        <div class="flex gap-2 mt-2">
          <button onclick="atualizarStatusCobranca('${c.id}', 'pago')" class="bg-green-500 text-white px-3 py-1 rounded">Cobrei - já pago</button>
          <button onclick="atualizarStatusCobranca('${c.id}', 'naoPago')" class="bg-red-500 text-white px-3 py-1 rounded">Cobrei - não pago</button>
          <button onclick="abrirReagendar('${c.id}')" class="bg-yellow-400 text-white px-3 py-1 rounded">Reagendar cobrança</button>
        </div>
        <div id="reagendar-${c.id}" class="mt-2 hidden">
          <input type="date" id="novaData-${c.id}" class="border p-1 rounded" />
          <button onclick="salvarReagendamento('${c.id}')" class="bg-blue-500 text-white px-2 py-1 rounded">Salvar</button>
        </div>
      `;
      lista.appendChild(div);
    });
  }

  function abrirReagendar(id) {
    document.getElementById(`reagendar-${id}`).classList.remove("hidden");
  }

  async function salvarReagendamento(id) {
    const novaData = document.getElementById(`novaData-${id}`).value;
    if (!novaData) return;
    await updateDoc(doc(db, "vendas", id), { data: novaData });
    alert("Data reagendada com sucesso!");
    filtrarCobrancasPorMes();
  }

  async function atualizarStatusCobranca(id, status) {
    await updateDoc(doc(db, "vendas", id), { status });
    alert("Status atualizado!");
    filtrarCobrancasPorMes();
  }
</script>
