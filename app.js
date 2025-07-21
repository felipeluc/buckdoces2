import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const root = document.getElementById("root");

function showLogin() {
  root.innerHTML = `
    <div class="card">
      <img src="logo-buck-doces.jpeg" alt="Logo" class="logo" />
      <h2>Login</h2>
      <input type="text" id="usuario" placeholder="Usuário" />
      <input type="password" id="senha" placeholder="Senha" />
      <button id="entrar">Entrar</button>
    </div>
  `;
  document.getElementById("entrar").addEventListener("click", () => {
    const usuario = document.getElementById("usuario").value;
    const senha = document.getElementById("senha").value;
    if (usuario === "ana" && senha === "123") {
      showMenu();
    } else {
      alert("Usuário ou senha incorretos.");
    }
  });
}

function showMenu() {
  root.innerHTML = `
    <div class="card">
      <h2>Menu</h2>
      <button id="cadastro">Cadastrar Venda</button>
      <button id="dashboard">Dashboard</button>
      <button id="cobranca">Cobrança</button>
      <button id="sair">Sair</button>
    </div>
  `;
  document.getElementById("cadastro").addEventListener("click", showCadastro);
  document.getElementById("dashboard").addEventListener("click", showDashboard);
  document.getElementById("cobranca").addEventListener("click", showCobranca);
  document.getElementById("sair").addEventListener("click", showLogin);
}

// Parte 4 - Cadastrar Venda (com WhatsApp)
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

    const mensagem = `Olá ${cliente}, aqui é da Ana Buck Doces! 🍬\n\nConfirmamos sua compra no valor de R$ ${valor.toFixed(2)} para o dia ${data}.\nForma de pagamento: ${formaPagamento}.\nProdutos: ${produtosSelecionados.join(', ')}.\n\nQualquer dúvida estamos à disposição! 💖`;
    const link = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, "_blank");

    alert("Venda salva com sucesso!");
    showDashboard();
  });
}

// Parte 5 - Dashboard
function showDashboard() {
  root.innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <div id="totais">
        <p>Total de Vendas: <span id="totalVendas">0</span></p>
        <p>Valor Total: R$ <span id="valorTotal">0,00</span></p>
        <p>A Receber: R$ <span id="aReceber">0,00</span></p>
      </div>
      <button id="voltar">Voltar</button>
    </div>
  `;

  document.getElementById("voltar").addEventListener("click", showMenu);

  getDocs(collection(db, "vendas")).then(snapshot => {
    let total = 0;
    let totalValor = 0;
    let aReceber = 0;
    snapshot.forEach(doc => {
      const venda = doc.data();
      total++;
      totalValor += venda.valor || 0;
      if (venda.status === "pendente") {
        aReceber += venda.valor || 0;
      }
    });

    document.getElementById("totalVendas").textContent = total;
    document.getElementById("valorTotal").textContent = totalValor.toFixed(2);
    document.getElementById("aReceber").textContent = aReceber.toFixed(2);
  });
}

// Parte 6 - Cobranca (código mantido como no projeto original)
function showCobranca() {
  root.innerHTML = `
    <div class="card">
      <h2>Cobrança</h2>
      <p>Em breve melhorias aqui.</p>
      <button id="voltar">Voltar</button>
    </div>
  `;
  document.getElementById("voltar").addEventListener("click", showMenu);
}

// Início
showLogin();
