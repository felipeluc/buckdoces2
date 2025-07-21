import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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
      <button onclick="showCadastro()">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
      <button onclick="showLogin()">Sair</button>
    </div>
  `;
}

window.showMenu = showMenu;
window.showCadastro = showCadastro;
window.showDashboard = showDashboard;
window.showCobranca = showCobranca;

function showCadastro() {
  root.innerHTML = `
    <div class="card">
      <h2>Cadastrar Venda</h2>
      <input type="text" id="cliente" placeholder="Cliente" />
      <input type="text" id="local" placeholder="Local" />
      <input type="number" id="valor" placeholder="Valor" />
      <input type="date" id="data" />
      <input type="text" id="telefone" placeholder="Telefone (ex: 5511999999999)" />
      <input type="text" id="produtos" placeholder="Produtos (separados por vírgula)" />
      <button id="salvar">Salvar</button>
      <button onclick="showMenu()">Voltar</button>
    </div>
  `;

  document.getElementById("salvar").addEventListener("click", async () => {
    const cliente = document.getElementById("cliente").value.trim();
    const local = document.getElementById("local").value.trim();
    const valor = parseFloat(document.getElementById("valor").value.trim());
    const data = document.getElementById("data").value;
    const telefone = document.getElementById("telefone").value.trim();
    const produtos = document.getElementById("produtos").value.trim();

    if (!cliente || !local || isNaN(valor) || !data || !telefone || !produtos) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    const vendaExistente = await getDocs(query(
      collection(db, "vendas"),
      where("cliente", "==", cliente),
      where("local", "==", local),
      where("valor", "==", valor),
      where("data", "==", data),
      where("produtos", "==", produtos)
    ));

    if (!vendaExistente.empty) {
      alert("Venda duplicada. Já existe esse registro.");
      return;
    }

    await addDoc(collection(db, "vendas"), {
      cliente,
      local,
      valor,
      data,
      telefone,
      produtos,
      pago: false,
      criadoEm: Timestamp.now()
    });

    const numeroWhatsApp = telefone.replace(/\D/g, "");
    if (numeroWhatsApp.length >= 12) {
      const mensagem = `Olá ${cliente}, aqui está o comprovante da sua venda:\nProdutos: ${produtos}\nValor: R$ ${valor.toFixed(2)}\nData: ${data}`;
      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
      window.location.href = url;
    } else {
      alert("Número de telefone inválido para envio via WhatsApp.");
    }

    showMenu();
  });
}

async function showDashboard() {
  const vendasSnap = await getDocs(collection(db, "vendas"));
  let total = 0;
  let totalReceber = 0;

  let lista = "";
  vendasSnap.forEach((doc) => {
    const dados = doc.data();
    const valor = parseFloat(dados.valor);
    if (!isNaN(valor)) {
      total += valor;
      if (!dados.pago) totalReceber += valor;
    }
    lista += `<li>${dados.cliente} - R$ ${valor.toFixed(2)} - ${dados.pago ? "Pago" : "A receber"}</li>`;
  });

  root.innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <p><strong>Total de vendas:</strong> R$ ${total.toFixed(2)}</p>
      <p><strong>A receber:</strong> R$ ${totalReceber.toFixed(2)}</p>
      <ul>${lista}</ul>
      <button onclick="showMenu()">Voltar</button>
    </div>
  `;
}

async function showCobranca() {
  const vendasSnap = await getDocs(collection(db, "vendas"));

  let lista = "";
  vendasSnap.forEach((doc) => {
    const dados = doc.data();
    if (!dados.pago) {
      lista += `<li>${dados.cliente} - R$ ${parseFloat(dados.valor).toFixed(2)} - ${dados.data}</li>`;
    }
  });

  root.innerHTML = `
    <div class="card">
      <h2>Cobranças</h2>
      <ul>${lista}</ul>
      <button onclick="showMenu()">Voltar</button>
    </div>
  `;
}
// Adição ao projeto original BuckDoces - Aba Agenda
// (este código deve ser adicionado ao app.js original, sem alterar o restante do sistema)

function showAgenda() {
  root.innerHTML = `
    <div class="card">
      <h2>Agenda de Clientes</h2>
      <input type="text" id="searchCliente" placeholder="Buscar cliente pelo nome..." />
      <div id="listaClientes"></div>
    </div>
    <div id="detalhesCliente"></div>
  `;

  const searchInput = document.getElementById("searchCliente");
  const listaClientesDiv = document.getElementById("listaClientes");
  const detalhesDiv = document.getElementById("detalhesCliente");

  db.collection("vendas").onSnapshot((snapshot) => {
    const clientesPorTelefone = {};
    snapshot.docs.forEach((doc) => {
      const venda = doc.data();
      const telefone = venda.telefone || "sem-telefone";
      if (!clientesPorTelefone[telefone]) {
        clientesPorTelefone[telefone] = {
          nome: venda.cliente,
          telefone,
          vendas: [],
        };
      }
      clientesPorTelefone[telefone].vendas.push({ id: doc.id, ...venda });
    });

    renderClientes(Object.values(clientesPorTelefone));

    searchInput.addEventListener("input", () => {
      const termo = searchInput.value.toLowerCase();
      const filtrados = Object.values(clientesPorTelefone).filter((c) =>
        c.nome.toLowerCase().includes(termo)
      );
      renderClientes(filtrados);
    });
  });

  function renderClientes(clientes) {
    listaClientesDiv.innerHTML = "";
    clientes.forEach((cliente) => {
      const btn = document.createElement("button");
      btn.textContent = `${cliente.nome} (${cliente.telefone})`;
      btn.onclick = () => mostrarDetalhes(cliente);
      listaClientesDiv.appendChild(btn);
    });
  }

  function mostrarDetalhes(cliente) {
    let total = 0;
    detalhesDiv.innerHTML = `
      <div class="card">
        <h3>Compras de ${cliente.nome}</h3>
        ${cliente.vendas
          .map((venda) => {
            total += Number(venda.valor || 0);
            const produtos = venda.produtos ? venda.produtos.join(", ") : "";
            const status = venda.statusPagamento || "Não informado";
            const dataPg = venda.dataPagamento || "-";
            return `
              <div class="day-card">
                <p><strong>Data:</strong> ${venda.data}</p>
                <p><strong>Local:</strong> ${venda.local}</p>
                <p><strong>Valor:</strong> R$ ${venda.valor}</p>
                <p><strong>Produtos:</strong> ${produtos}</p>
                <p><strong>Forma de Pagamento:</strong> ${venda.pagamento}</p>
                <p><strong>Status:</strong> ${status}</p>
                <p><strong>Pagamento programado:</strong> ${dataPg}</p>
                <button onclick="editarVenda('${venda.id}')">Editar</button>
              </div>`;
          })
          .join("")}
        <h3>Total: R$ ${total.toFixed(2)}</h3>
      </div>
    `;
  }
}

window.editarVenda = function (idVenda) {
  db.collection("vendas")
    .doc(idVenda)
    .get()
    .then((doc) => {
      const venda = doc.data();
      const container = document.createElement("div");
      container.classList.add("card");
      container.innerHTML = `
        <h3>Editar Venda</h3>
        <p><strong>Cliente:</strong> ${venda.cliente}</p>
        <label>Status de Pagamento:</label>
        <select id="statusPagamento">
          <option ${venda.statusPagamento === "Pago" ? "selected" : ""}>Pago</option>
          <option ${venda.statusPagamento === "Parcial" ? "selected" : ""}>Parcial</option>
          <option ${venda.statusPagamento === "Não Pago" ? "selected" : ""}>Não Pago</option>
        </select>
        <label>Valor pago (se parcial):</label>
        <input type="number" id="valorParcial" value="" placeholder="Ex: 25.00" />
        <label>Nova data para pagamento:</label>
        <input type="date" id="novaDataPagamento" />
        <button onclick="salvarEdicaoVenda('${idVenda}')">Salvar</button>
      `;
      document.getElementById("detalhesCliente").appendChild(container);
    });
};

window.salvarEdicaoVenda = function (idVenda) {
  const status = document.getElementById("statusPagamento").value;
  const valorParcial = parseFloat(document.getElementById("valorParcial").value);
  const novaData = document.getElementById("novaDataPagamento").value;
  const updateData = {
    statusPagamento: status,
  };

  if (status === "Parcial" && !isNaN(valorParcial)) {
    updateData.valorPago = valorParcial;
    updateData.valorRestante = firebase.firestore.FieldValue.increment(-valorParcial);
    updateData.dataPagamento = novaData || null;
  } else if (status === "Pago") {
    updateData.dataPagamento = new Date().toISOString().split("T")[0];
  } else if (novaData) {
    updateData.dataPagamento = novaData;
  }

  db.collection("vendas")
    .doc(idVenda)
    .update(updateData)
    .then(() => {
      alert("Venda atualizada com sucesso!");
      showAgenda();
    });
};
// Inicia a aplicação
showLogin();
