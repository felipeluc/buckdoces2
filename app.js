const app = document.getElementById('root');

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
function showLogin() {
  app.innerHTML = `
    <div class="card">
      <h2>Login</h2>
      <input type="email" id="email" placeholder="Email" />
      <input type="password" id="senha" placeholder="Senha" />
      <button onclick="login()">Entrar</button>
      <p>Não tem conta? <a href="#" onclick="showCadastroUsuario()">Cadastre-se</a></p>
    </div>
  `;
}

function login() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  firebase.auth().signInWithEmailAndPassword(email, senha)
    .then(() => showMenu())
    .catch(() => alert("Erro ao fazer login."));
}

function showCadastroUsuario() {
  app.innerHTML = `
    <div class="card">
      <h2>Cadastrar Usuário</h2>
      <input type="email" id="novoEmail" placeholder="Email" />
      <input type="password" id="novaSenha" placeholder="Senha" />
      <button onclick="cadastrarUsuario()">Cadastrar</button>
      <p><a href="#" onclick="showLogin()">Voltar ao login</a></p>
    </div>
  `;
}

function cadastrarUsuario() {
  const email = document.getElementById("novoEmail").value;
  const senha = document.getElementById("novaSenha").value;

  firebase.auth().createUserWithEmailAndPassword(email, senha)
    .then(() => alert("Usuário cadastrado com sucesso!"))
    .catch(() => alert("Erro ao cadastrar."));
}

function showMenu() {
  app.innerHTML = `
    <div class="menu">
      <button onclick="showCadastro()">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
      <button onclick="showAgenda()">Agenda</button>
      <button onclick="logout()">Sair</button>
    </div>
  `;
}
function logout() {
  firebase.auth().signOut().then(showLogin);
}

firebase.auth().onAuthStateChanged((user) => {
  user ? showMenu() : showLogin();
});
function showCadastro() {
  app.innerHTML = `
    <div class="card">
      <h2>Cadastro de Venda</h2>
      <input type="text" id="cliente" placeholder="Cliente" />
      <input type="text" id="telefone" placeholder="Telefone (ex: 5599999999999)" />
      <input type="text" id="produtos" placeholder="Produtos" />
      <input type="text" id="local" placeholder="Local" />
      <input type="number" id="valor" placeholder="Valor" />
      <input type="date" id="data" />
      <select id="pagamento">
        <option value="Pix">Pix</option>
        <option value="Dinheiro">Dinheiro</option>
        <option value="Cartão">Cartão</option>
      </select>
      <textarea id="observacao" placeholder="Observações (opcional)"></textarea>
      <button onclick="salvarVenda()">Salvar</button>
    </div>
  `;
}

function salvarVenda() {
  const cliente = document.getElementById("cliente").value;
  const telefone = document.getElementById("telefone").value;
  const produtos = document.getElementById("produtos").value;
  const local = document.getElementById("local").value;
  const valor = parseFloat(document.getElementById("valor").value) || 0;
  const data = document.getElementById("data").value;
  const pagamento = document.getElementById("pagamento").value;
  const observacao = document.getElementById("observacao").value;

  if (!cliente || !telefone || !produtos || !valor || !data) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  db.collection("vendas").add({
    cliente,
    telefone,
    produtos,
    local,
    valor,
    data,
    pagamento,
    observacao,
    status: "Não pago"
  }).then(() => {
    const mensagem = `Olá ${cliente}, aqui está o comprovante da sua compra:\n\nProdutos: ${produtos}\nValor: R$ ${valor.toFixed(2)}\nPagamento: ${pagamento}\nData: ${data}\nLocal: ${local}`;
    window.location.href = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  });
}
function showDashboard() {
  db.collection("vendas").get().then((querySnapshot) => {
    let total = 0;
    let receber = 0;
    querySnapshot.forEach((doc) => {
      const v = doc.data();
      const valor = parseFloat(v.valor) || 0;
      total += valor;
      if (v.status !== "Pago") receber += valor;
    });

    app.innerHTML = `
      <div class="card">
        <h2>Dashboard</h2>
        <p>Total de Vendas: R$ ${total.toFixed(2)}</p>
        <p>Valor a Receber: R$ ${receber.toFixed(2)}</p>
      </div>
    `;
  });
}
function showCobranca() {
  const hoje = new Date().toISOString().slice(0, 7);
  let mesSelecionado = hoje;

  function renderizarCobranca(mes) {
    db.collection("vendas").where("data", ">=", `${mes}-01`).where("data", "<=", `${mes}-31`).get().then((querySnapshot) => {
      const vendasPorDia = {};
      let totalMensal = 0;

      querySnapshot.forEach((doc) => {
        const venda = doc.data();
        const dia = venda.data;
        if (!vendasPorDia[dia]) vendasPorDia[dia] = [];
        vendasPorDia[dia].push({ id: doc.id, ...venda });

        if (venda.status !== "Pago") {
          totalMensal += parseFloat(venda.valor) || 0;
        }
      });

      let calendario = '';
      Object.keys(vendasPorDia).sort().forEach(dia => {
        const totalDia = vendasPorDia[dia].reduce((soma, v) => v.status !== "Pago" ? soma + (parseFloat(v.valor) || 0) : soma, 0);
        if (totalDia > 0) {
          calendario += `
            <div class="dia-cobranca" onclick="abrirDetalhesDia('${dia}')">
              <strong>${dia}</strong> - R$ ${totalDia.toFixed(2)}
            </div>
          `;
        }
      });

      app.innerHTML = `
        <div class="card">
          <h2>Cobrança</h2>
          <label>Mês:
            <input type="month" id="mesFiltro" value="${mes}" onchange="showCobranca()" />
          </label>
          <div id="calendario-cobranca">${calendario}</div>
          <p><strong>Total do mês:</strong> R$ ${totalMensal.toFixed(2)}</p>
          <button onclick="showMenu()">Voltar</button>
        </div>
      `;
    });
  }

  window.abrirDetalhesDia = function (dia) {
    db.collection("vendas").where("data", "==", dia).get().then((querySnapshot) => {
      let detalhes = '';
      querySnapshot.forEach((doc) => {
        const v = doc.data();
        const cor = v.status === "Pago" ? "green" : (new Date(v.data) < new Date() ? "red" : "black");
        detalhes += `
          <div class="venda-dia" style="border-left: 4px solid ${cor}; padding-left: 6px;">
            <p><strong>${v.cliente}</strong> - R$ ${parseFloat(v.valor).toFixed(2)} (${v.pagamento})</p>
            <p>${v.produtos} - ${v.local}</p>
            <select onchange="atualizarStatus('${doc.id}', this.value)">
              <option value="Pago" ${v.status === "Pago" ? "selected" : ""}>Cobrei - Já pago</option>
              <option value="Não pago" ${v.status === "Não pago" ? "selected" : ""}>Cobrei - Não pago</option>
              <option value="Reagendar">Reagendar</option>
            </select>
          </div>
        `;
      });

      app.innerHTML = `
        <div class="card">
          <h2>Detalhes do dia ${dia}</h2>
          ${detalhes}
          <button onclick="showCobranca()">Voltar</button>
        </div>
      `;
    });
  };

  window.atualizarStatus = function (id, status) {
    if (status === "Reagendar") {
      const novaData = prompt("Nova data (aaaa-mm-dd):");
      if (novaData) {
        db.collection("vendas").doc(id).update({ data: novaData });
      }
    } else {
      db.collection("vendas").doc(id).update({ status });
    }
  };

  const filtro = document.getElementById("mesFiltro");
  if (filtro) {
    mesSelecionado = filtro.value;
  }
  renderizarCobranca(mesSelecionado);
}
function showAgenda() {
  db.collection("vendas").get().then((querySnapshot) => {
    const clientes = {};

    querySnapshot.forEach((doc) => {
      const venda = doc.data();
      const telefone = venda.telefone || "sem-telefone";
      if (!clientes[telefone]) {
        clientes[telefone] = {
          nome: venda.cliente,
          telefone: telefone,
          vendas: []
        };
      }
      clientes[telefone].vendas.push({ id: doc.id, ...venda });
    });

    const listaClientes = Object.values(clientes).sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );

    let html = `
      <div class="card">
        <h2>Agenda de Clientes</h2>
        <input type="text" placeholder="Buscar cliente..." id="buscaCliente" oninput="filtrarClientes()" />
        <div id="lista-clientes">
          ${listaClientes
            .map(
              (c) =>
                `<div class="cliente-agenda" onclick="verComprasCliente('${c.telefone}')">
                  <strong>${c.nome}</strong> (${c.telefone}) - ${c.vendas.length} compra(s)
                </div>`
            )
            .join("")}
        </div>
        <button onclick="showMenu()">Voltar</button>
      </div>
    `;

    app.innerHTML = html;

    window.verComprasCliente = function (telefone) {
      const cliente = clientes[telefone];
      let total = 0;

      const vendasHtml = cliente.vendas
        .map((venda) => {
          const valor = parseFloat(venda.valor) || 0;
          total += valor;

          return `
            <div class="venda-cliente">
              <p><strong>Data:</strong> ${venda.data} | <strong>Valor:</strong> R$ ${valor.toFixed(2)}</p>
              <p><strong>Produtos:</strong> ${venda.produtos}</p>
              <p><strong>Local:</strong> ${venda.local}</p>
              <p><strong>Status:</strong> ${venda.status || "Não informado"}</p>
              <select onchange="editarStatusVenda('${venda.id}', this.value)">
                <option value="Pago" ${venda.status === "Pago" ? "selected" : ""}>Pago</option>
                <option value="Parcial">Pago Parcial</option>
                <option value="Não pago" ${venda.status === "Não pago" ? "selected" : ""}>Não Pago</option>
              </select>
            </div>
          `;
        })
        .join("");

      app.innerHTML = `
        <div class="card">
          <h2>Compras de ${cliente.nome}</h2>
          ${vendasHtml}
          <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
          <button onclick="showAgenda()">Voltar</button>
        </div>
      `;
    };

    window.editarStatusVenda = function (id, status) {
      if (status === "Parcial") {
        const restante = prompt("Qual o valor restante?");
        if (restante) {
          db.collection("vendas").doc(id).update({
            status: "Parcial",
            valor: restante // ou crie um novo campo tipo "restante"
          });
        }
      } else {
        db.collection("vendas").doc(id).update({ status });
      }
    };

    window.filtrarClientes = function () {
      const termo = document.getElementById("buscaCliente").value.toLowerCase();
      const elementos = document.querySelectorAll(".cliente-agenda");

      elementos.forEach((el) => {
        el.style.display = el.textContent.toLowerCase().includes(termo)
          ? "block"
          : "none";
      });
    };
  });
}
