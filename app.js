import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const root = document.getElementById("root");

// PARTE 1 - LOGIN
function showLogin() {
  root.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input type="email" id="email" placeholder="E-mail" />
      <input type="password" id="senha" placeholder="Senha" />
      <button id="entrar">Entrar</button>
    </div>
  `;

  document.getElementById("entrar").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch (error) {
      alert("Erro ao fazer login: " + error.message);
    }
  });
}

onAuthStateChanged(auth, user => {
  if (user) {
    showDashboard();
  } else {
    showLogin();
  }
});

// PARTE 2 - DASHBOARD
function showDashboard() {
  root.innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <div id="resumo">
        <p>Total de Vendas: <span id="totalVendas">0</span></p>
        <p>Valor Total: R$ <span id="valorTotal">0.00</span></p>
        <p>Valor a Receber: R$ <span id="valorReceber">0.00</span></p>
      </div>
      <button id="novaVenda">Nova Venda</button>
      <button id="cobrancas">Cobranças</button>
      <button id="sair">Sair</button>
    </div>
  `;

  document.getElementById("novaVenda").addEventListener("click", showCadastro);
  document.getElementById("cobrancas").addEventListener("click", showCobranca);
  document.getElementById("sair").addEventListener("click", () => {
    signOut(auth);
  });

  atualizarDashboard();
}

async function atualizarDashboard() {
  const vendasSnap = await getDocs(collection(db, "vendas"));
  const vendas = vendasSnap.docs.map(doc => doc.data());

  document.getElementById("totalVendas").textContent = vendas.length;
  const valorTotal = vendas.reduce((sum, v) => sum + (v.valor || 0), 0);
  const valorReceber = vendas.filter(v => v.status !== "pago").reduce((sum, v) => sum + (v.valor || 0), 0);

  document.getElementById("valorTotal").textContent = valorTotal.toFixed(2);
  document.getElementById("valorReceber").textContent = valorReceber.toFixed(2);
}

// PARTE 3 - CADASTRO DE VENDA
function showCadastro() {
  root.innerHTML = `
    <div class="card">
      <h2>Nova Venda</h2>
      <input type="text" id="cliente" placeholder="Nome do Cliente" />
      <input type="text" id="local" placeholder="Local da Venda" />
      <input type="number" id="valor" placeholder="Valor (R$)" />
      <input type="tel" id="telefone" placeholder="Telefone (ex: 5511999999999)" />
      <select id="formaPagamento">
        <option value="">Forma de Pagamento</option>
        <option value="Pix">Pix</option>
        <option value="Dinheiro">Dinheiro</option>
        <option value="Cartão">Cartão</option>
      </select>
      <label>Produtos:</label>
      <div>
        <label><input type="checkbox" value="Trufa"> Trufa</label>
        <label><input type="checkbox" value="Cone"> Cone</label>
        <label><input type="checkbox" value="Brigadeiro"> Brigadeiro</label>
      </div>
      <input type="date" id="data" />
      <textarea id="observacao" placeholder="Observação (opcional)"></textarea>
      <button id="salvarVenda">Salvar</button>
    </div>
  `;

  document.getElementById("salvarVenda").addEventListener("click", async () => {
    const cliente = document.getElementById("cliente").value.trim();
    const local = document.getElementById("local").value.trim();
    const valor = parseFloat(document.getElementById("valor").value);
    const telefone = document.getElementById("telefone").value.trim();
    const formaPagamento = document.getElementById("formaPagamento").value;
    const data = document.getElementById("data").value;
    const observacao = document.getElementById("observacao").value.trim();
    const produtosSelecionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

    if (!cliente || !local || isNaN(valor) || !formaPagamento || !data || produtosSelecionados.length === 0 || !telefone) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Verifica duplicidade
    const snapshot = await getDocs(collection(db, "vendas"));
    const duplicado = snapshot.docs.some(doc =>
      doc.data().cliente === cliente &&
      doc.data().local === local &&
      doc.data().valor === valor &&
      doc.data().formaPagamento === formaPagamento &&
      doc.data().data === data &&
      JSON.stringify(doc.data().produtos.sort()) === JSON.stringify(produtosSelecionados.sort())
    );

    if (duplicado) {
      alert("Essa venda já foi cadastrada.");
      return;
    }

    // Salvar no Firebase
    await addDoc(collection(db, "vendas"), {
      cliente,
      local,
      valor,
      formaPagamento,
      produtos: produtosSelecionados,
      data,
      status: "pendente",
      observacao,
      telefone
    });

    // Enviar mensagem via WhatsApp
    const mensagem = `Olá ${cliente}, aqui é da Ana Buck Doces! 🍬\n\nConfirmamos sua compra no valor de R$ ${valor.toFixed(2)} para o dia ${data}.\nForma de pagamento: ${formaPagamento}.\nProdutos: ${produtosSelecionados.join(', ')}.\n\nQualquer dúvida estamos à disposição! 💖`;
    const link = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, "_blank");

    alert("Venda salva com sucesso!");
    showDashboard();
  });
}

// PARTE 4 - COBRANÇA (CALENDÁRIO INTERATIVO SIMPLIFICADO)
function showCobranca() {
  root.innerHTML = `
    <div class="card">
      <h2>Cobranças</h2>
      <div id="calendario"></div>
      <button id="voltar">Voltar</button>
    </div>
  `;

  document.getElementById("voltar").addEventListener("click", showDashboard);

  carregarCalendario();
}

async function carregarCalendario() {
  const calendario = document.getElementById("calendario");
  calendario.innerHTML = "";

  const vendasSnap = await getDocs(collection(db, "vendas"));
  const vendas = vendasSnap.docs.map(doc => doc.data());

  const dias = {};

  vendas.forEach(v => {
    if (v.status !== "pago") {
      if (!dias[v.data]) dias[v.data] = 0;
      dias[v.data] += v.valor || 0;
    }
  });

  for (const data in dias) {
    const div = document.createElement("div");
    div.className = "calendar-day";
    div.innerHTML = `<div class="calendar-day-value">${data}</div><div class="amount">R$ ${dias[data].toFixed(2)}</div>`;
    calendario.appendChild(div);
  }
}
