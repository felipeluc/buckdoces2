// app.js

// Firebase config
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SUA_MEASUREMENT_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('user');
  if (user) {
    showDashboard();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.body.innerHTML = `
    <div class="login-container">
      <img src="logo-buck-doces.jpeg" alt="Logo" class="logo">
      <h2 class="text-center">Ana Buck Doces</h2>
      <input type="email" id="email" placeholder="Email">
      <input type="password" id="password" placeholder="Senha">
      <button onclick="login()">Entrar</button>
    </div>
  `;
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      localStorage.setItem('user', email);
      showDashboard();
    })
    .catch(error => {
      alert("Erro ao fazer login: " + error.message);
    });
}

function logout() {
  firebase.auth().signOut().then(() => {
    localStorage.removeItem('user');
    showLogin();
  });
}
function showCadastro() {
  document.body.innerHTML = `
    <div class="top-bar">
      <img src="logo-buck-doces.jpeg" class="logo">
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
      <button onclick="logout()">Sair</button>
    </div>

    <div class="form-container">
      <h2>Cadastrar Venda</h2>
      <input type="text" id="cliente" placeholder="Nome do Cliente">
      <input type="text" id="local" placeholder="Local da Venda">
      <input type="text" id="telefone" placeholder="Telefone (formato: 55DDDXXXXXXXXX)">
      <input type="number" id="valor" placeholder="Valor Total">
      <input type="date" id="data">
      <input type="date" id="dataCobranca" placeholder="Data para cobrança">

      <h3>Produtos Vendidos</h3>
      <div id="produtos">
        ${['Trufa', 'Cone', 'Bolo de pote'].map(produto => `
          <div class="produto-item">
            <label>${produto}</label>
            <input type="number" id="produto-${produto}" min="0" value="0">
          </div>
        `).join('')}
      </div>

      <button onclick="salvarVenda()">Salvar</button>
    </div>
  `;
}

function salvarVenda() {
  const cliente = document.getElementById("cliente").value.trim();
  const local = document.getElementById("local").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const valor = parseFloat(document.getElementById("valor").value.trim());
  const data = document.getElementById("data").value;
  const dataCobranca = document.getElementById("dataCobranca").value;

  const produtosSelecionados = ['Trufa', 'Cone', 'Bolo de pote'].map(prod => {
    const qtd = parseInt(document.getElementById(`produto-${prod}`).value);
    return qtd > 0 ? { nome: prod, quantidade: qtd } : null;
  }).filter(Boolean);

  if (!cliente || !valor || !data || produtosSelecionados.length === 0) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const novaVenda = {
    cliente,
    local,
    telefone,
    valor,
    data,
    dataCobranca,
    produtos: produtosSelecionados,
    status: 'pendente'
  };

  db.collection("vendas").where("cliente", "==", cliente)
    .where("local", "==", local)
    .where("valor", "==", valor)
    .where("data", "==", data)
    .get()
    .then(snapshot => {
      const duplicada = snapshot.docs.some(doc => {
        const dataDoc = doc.data();
        const produtosIguais = JSON.stringify(dataDoc.produtos) === JSON.stringify(novaVenda.produtos);
        return produtosIguais;
      });

      if (duplicada) {
        alert("Venda já cadastrada.");
      } else {
        db.collection("vendas").add(novaVenda).then(() => {
          enviarWhatsappComprovante(cliente, telefone, produtosSelecionados, valor, data);
          alert("Venda salva com sucesso.");
          showDashboard();
        });
      }
    });
}

function enviarWhatsappComprovante(nome, telefone, produtos, valor, data) {
  const textoProdutos = produtos.map(p => `${p.nome} (${p.quantidade})`).join('%0A');
  const msg = `Olá ${nome}!%0ASeu pedido foi registrado com sucesso.%0A%0AProdutos:%0A${textoProdutos}%0A%0AValor total: R$ ${valor.toFixed(2)}%0AData da compra: ${formatarData(data)}%0A%0AMuito obrigado! 🍬`;
  const url = `https://wa.me/${telefone}?text=${msg}`;
  window.open(url, '_blank');
}
function showDashboard() {
  document.body.innerHTML = `
    <div class="top-bar">
      <img src="logo-buck-doces.jpeg" class="logo">
      <button onclick="showCadastro()">Cadastro</button>
      <button onclick="showCobranca()">Cobrança</button>
      <button onclick="logout()">Sair</button>
    </div>

    <div class="dashboard">
      <h2>Dashboard</h2>
      <div id="dashboard-valores">
        <p>Total de vendas: <span id="total-vendas">R$ 0,00</span></p>
        <p>Total a receber: <span id="total-receber">R$ 0,00</span></p>
      </div>
      <div id="lista-vendas"></div>
    </div>
  `;

  db.collection("vendas").get().then(snapshot => {
    let total = 0;
    let aReceber = 0;
    const lista = document.getElementById("lista-vendas");

    snapshot.forEach(doc => {
      const venda = doc.data();
      total += parseFloat(venda.valor || 0);
      if (venda.status === "pendente") {
        aReceber += parseFloat(venda.valor || 0);
      }

      const produtosStr = venda.produtos.map(p => `${p.nome} (${p.quantidade})`).join(', ');

      const div = document.createElement("div");
      div.className = "venda-card";
      div.innerHTML = `
        <strong>${venda.cliente}</strong><br>
        ${formatarData(venda.data)} - R$ ${parseFloat(venda.valor).toFixed(2)}<br>
        Produtos: ${produtosStr}<br>
        Status: ${venda.status || 'pendente'}
      `;
      lista.appendChild(div);
    });

    document.getElementById("total-vendas").textContent = `R$ ${total.toFixed(2)}`;
    document.getElementById("total-receber").textContent = `R$ ${aReceber.toFixed(2)}`;
  });
}
function showCobranca() {
  document.body.innerHTML = `
    <div class="top-bar">
      <img src="logo-buck-doces.jpeg" class="logo">
      <button onclick="showCadastro()">Cadastro</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="logout()">Sair</button>
    </div>

    <div class="cobranca">
      <h2>Cobrança</h2>
      <input type="month" id="mesFiltro" onchange="carregarCalendarioCobranca()">
      <div id="calendario"></div>
      <div id="cards-dia"></div>
    </div>
  `;

  const mesAtual = new Date().toISOString().substring(0, 7);
  document.getElementById("mesFiltro").value = mesAtual;
  carregarCalendarioCobranca();
}

function carregarCalendarioCobranca() {
  const mes = document.getElementById("mesFiltro").value;
  const [ano, mesNum] = mes.split('-');
  const diasNoMes = new Date(ano, mesNum, 0).getDate();

  const calendario = document.getElementById("calendario");
  calendario.innerHTML = "";

  db.collection("vendas").get().then(snapshot => {
    const vendasPorDia = {};

    snapshot.forEach(doc => {
      const venda = doc.data();
      if (venda.dataCobranca && venda.status === 'pendente' && venda.dataCobranca.startsWith(mes)) {
        if (!vendasPorDia[venda.dataCobranca]) vendasPorDia[venda.dataCobranca] = [];
        vendasPorDia[venda.dataCobranca].push({ id: doc.id, ...venda });
      }
    });

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const diaStr = `${ano}-${mesNum.padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      if (!vendasPorDia[diaStr]) continue;

      const totalDia = vendasPorDia[diaStr].reduce((soma, v) => soma + parseFloat(v.valor || 0), 0);
      const div = document.createElement("div");
      div.className = "calendario-dia";
      div.innerHTML = `
        <strong>${diaStr.split('-').reverse().join('-')}</strong><br>
        R$ ${totalDia.toFixed(2)}
      `;
      div.onclick = () => mostrarDetalhesDia(diaStr, vendasPorDia[diaStr]);
      calendario.appendChild(div);
    }
  });
}

function mostrarDetalhesDia(data, vendas) {
  const container = document.getElementById("cards-dia");
  container.innerHTML = `<h3>Vendas agendadas para ${data.split('-').reverse().join('-')}</h3>`;

  vendas.forEach(venda => {
    const produtosTexto = venda.produtos.map(p => `${p.nome} (${p.quantidade})`).join('<br>');
    const datasCompras = vendas.filter(v => v.cliente === venda.cliente)
      .map(v => formatarData(v.data)).join(' | ');

    const card = document.createElement("div");
    card.className = "venda-card-detalhe";
    card.innerHTML = `
      <strong>Cliente:</strong> ${venda.cliente}<br>
      <strong>Local:</strong> ${venda.local}<br>
      <strong>Status:</strong> <span id="status-${venda.id}">${venda.status}</span><br>
      <strong>Data da Compra:</strong> ${formatarData(venda.data)}<br>
      <strong>Produtos:</strong><br>${produtosTexto}<br>
      <strong>Valor:</strong> R$ ${parseFloat(venda.valor).toFixed(2)}<br>
      <button onclick="marcarComoPago('${venda.id}')">Pago</button>
      <button onclick="enviarCobrancaWhats('${venda.cliente}', '${venda.telefone}', '${formatarData(venda.dataCobranca)}', \`${datasCompras}\`, \`${produtosTexto.replace(/<br>/g, '\n')}\`, ${parseFloat(venda.valor).toFixed(2)})">Cobrar no WhatsApp</button>
    `;
    container.appendChild(card);
  });
}

function marcarComoPago(id) {
  db.collection("vendas").doc(id).update({ status: "pago" }).then(() => {
    document.getElementById(`status-${id}`).textContent = "pago";
    alert("Venda marcada como paga!");
  });
}

function enviarCobrancaWhats(nome, telefone, dataCobranca, datasCompras, produtos, valor) {
  const msg = `Olá ${nome}!, tudo bem?%0AEstou passando para lembrar que há um valor pendente conosco:%0A%0AData agendada para pagamento: ${dataCobranca}%0A%0ADatas das compra: ${datasCompras}%0A%0AProdutos e quantidades:%0A${produtos}%0A%0AValor total: ${valor.toFixed(2)}%0A%0APor favor realizar o pagamento conforme nosso combinado, qualquer dúvida estou à disposição!%0A%0A— Ana Buck Doces`;
  const url = `https://wa.me/${telefone}?text=${encodeURI(msg)}`;
  window.open(url, '_blank');
}

function formatarData(dataStr) {
  if (!dataStr) return '';
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}-${mes}-${ano}`;
}
