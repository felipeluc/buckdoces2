// === CONFIGURAÇÃO FIREBASE ===
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
  storageBucket: "buckdoces.appspot.com",
  messagingSenderId: "781727917443",
  appId: "1:781727917443:web:c9709b3813d28ea60982b6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// === INTERFACE LOGIN ===
document.getElementById("root").innerHTML = `
  <h1 style="text-align: center; color: #d48c94">Buck Doces</h1>
  <div class="card login-card">
    <select id="user">
      <option>Ana Buck</option>
      <option>João Buck</option>
    </select>
    <input type="password" id="senha" placeholder="Senha" />
    <button onclick="login()">Entrar</button>
  </div>
  <div id="main"></div>
`;

// === USUÁRIOS E SENHAS ===
const senhas = {
  "Ana Buck": "Ana1234",
  "João Buck": "João1234"
};

// === LOGIN ===
window.login = () => {
  const usuario = document.getElementById("user").value;
  const senha = document.getElementById("senha").value;
  if (senhas[usuario] === senha) {
    showTabs(usuario);
  } else {
    alert("Senha incorreta");
  }
};

// === MENU PRINCIPAL ===
function showTabs(user) {
  document.getElementById("main").innerHTML = `
    <div class="card" style="display: flex; gap: 10px; flex-wrap: wrap;">
      <button onclick="showCadastro('${user}')">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
    </div>
    <div id="conteudo" class="card" style="margin-top: 15px;"></div>
  `;
}

// === LISTA DE PRODUTOS ===
const produtosLista = [
  "Cone", "Trufa", "Bolo de pote", "Pão de mel",
  "Escondidinho de uva", "Bombom de uva", "BomBom de morango",
  "Coxinha de morango", "Camafeu", "Caixinha", "Mousse", "Lanche natural",
  "Maça do amor", "Kit cesta", "Kit caneca", "Morango do amor"
];

// === TELA DE CADASTRO (com suas melhorias solicitadas) ===
window.showCadastro = (usuario) => {
  const produtoOptions = produtosLista.map((produto, index) => `
    <div style="display: flex; align-items: center; margin-bottom: 5px;">
      <label style="flex: 1;">${produto}</label>
      <button 
        style="width:30px; height:30px; border-radius:4px; font-weight:bold;"
        onclick="alterarQuantidade(${index}, -1)">-</button>
      <span id="quantidade-${index}" style="margin: 0 5px; width: 20px; text-align: center; display: inline-block;">0</span>
      <button 
        style="width:30px; height:30px; border-radius:4px; font-weight:bold;"
        onclick="alterarQuantidade(${index}, 1)">+</button>
    </div>
  `).join("");

  document.getElementById("conteudo").innerHTML = `
    <h2>Cadastro de Venda</h2>
    <input id="cliente" placeholder="Nome do cliente" />
    <input id="telefone" placeholder="Telefone (ex: 17991386966)" inputmode="numeric" pattern="[0-9]*" maxlength="11" />
    <select id="local">
      <option value="">Selecione o local</option>
      <option value="Cemei">Cemei</option>
      <option value="Analia Franco">Analia Franco</option>
      <option value="Cemup">Cemup</option>
    </select>
    <input id="valor" placeholder="Valor (R$)" />
    <div><strong>Produtos vendidos:</strong>${produtoOptions}</div>
    <select id="status">
      <option value="pago">Pago</option>
      <option value="nao">Não pago</option>
      <option value="parcial">Parcial</option>
    </select>
    <div id="extras"></div>
    <button onclick="cadastrar('${usuario}')">Salvar</button>
    <button onclick="enviarComprovante()">Enviar Comprovante via WhatsApp</button>
  `;

  // === FORMATAÇÃO DE MOEDA AUTOMÁTICA ===
  const valorInput = document.getElementById("valor");
  valorInput.addEventListener("input", () => {
    let val = valorInput.value.replace(/\D/g, "");
    val = (parseInt(val || "0") / 100).toFixed(2);
    valorInput.value = `R$ ${val.replace(".", ",")}`;
  });

  // === FORMATAÇÃO TELEFONE: só números, limite 11 caracteres ===
  const telInput = document.getElementById("telefone");
  telInput.addEventListener("input", () => {
    telInput.value = telInput.value.replace(/\D/g, "").slice(0, 11);
  });

  // === CAMPOS EXTRAS DINÂMICOS ===
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
// === ALTERAR QUANTIDADE DE PRODUTO ===
window.alterarQuantidade = (index, delta) => {
  const span = document.getElementById(`quantidade-${index}`);
  let valor = parseInt(span.innerText);
  valor = Math.max(0, valor + delta);
  span.innerText = valor;
};

// === OBTÉM PRODUTOS SELECIONADOS ===
function obterProdutosSelecionados() {
  return produtosLista
    .map((produto, index) => {
      const quantidade = parseInt(document.getElementById(`quantidade-${index}`).innerText);
      return quantidade > 0 ? `${produto} (${quantidade})` : null;
    })
    .filter(Boolean);
}

// === CADASTRAR VENDA ===
window.cadastrar = async (usuario) => {
  const cliente = document.getElementById("cliente").value.trim();
  let telefone = document.getElementById("telefone").value.trim();
  const local = document.getElementById("local").value.trim();
  const valorFormatado = document.getElementById("valor").value.trim().replace("R$ ", "").replace(".", "").replace(",", ".");
  const valor = parseFloat(valorFormatado);
  const status = document.getElementById("status").value;
  const forma = document.getElementById("forma")?.value || "";
  const dataReceber = document.getElementById("dataReceber")?.value || "";
  const valorParcial = parseFloat(document.getElementById("valorParcial")?.value || 0);
  const faltaReceber = parseFloat(document.getElementById("falta")?.value || 0);
  const data = new Date().toISOString().split("T")[0];
  const produtosSelecionados = obterProdutosSelecionados();

  // Limpa telefone para ficar só números, remove espaços e caracteres estranhos
  telefone = telefone.replace(/\D/g, "");

  if (!cliente || !telefone || !local || isNaN(valor) || produtosSelecionados.length === 0) {
    alert("Preencha todos os campos e selecione ao menos um produto.");
    return;
  }

  // === VERIFICA DUPLICIDADE ===
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

  // === SALVA NO FIREBASE ===
  await addDoc(collection(db, "vendas"), {
    usuario, cliente, telefone, local, valor, status, forma,
    valorParcial: status === "parcial" ? valorParcial : 0,
    faltaReceber: status === "parcial" ? faltaReceber : (status === "nao" ? valor : 0),
    dataReceber: status !== "pago" ? dataReceber : null,
    data,
    produtosVendidos: produtosSelecionados
  });

  alert("Venda salva!");
};

// === ENVIAR COMPROVANTE VIA WHATSAPP ===
window.enviarComprovante = () => {
  let numero = document.getElementById("telefone")?.value.trim();
  const valorCampo = document.getElementById("valor")?.value.trim();
  const cliente = document.getElementById("cliente")?.value.trim();
  const status = document.getElementById("status")?.value;
  const dataReceber = document.getElementById("dataReceber")?.value || "";
  const produtosSelecionados = obterProdutosSelecionados();

  if (!numero || !valorCampo || !cliente || produtosSelecionados.length === 0) {
    alert("Preencha todos os campos antes de enviar o comprovante.");
    return;
  }

  // Limpa número para ficar só dígitos
  numero = numero.replace(/\D/g, "");

  // Adiciona prefixo 55 automaticamente se não tiver
  if (!numero.startsWith("55")) {
    numero = "55" + numero;
  }

  // Remove o símbolo R$ se houver e ajusta ponto/vírgula
  const valor = parseFloat(valorCampo.replace("R$ ", "").replace(".", "").replace(",", ".")).toFixed(2);
  const listaProdutos = produtosSelecionados.map(p => `- ${p}`).join("\n");

  const mensagem = `Olá ${cliente}!  

Segue o comprovante da sua compra na Ana Buck Doces:

Produtos:
${listaProdutos}

Valor: R$ ${valor}
Status: ${status.toUpperCase()}${status !== "pago" ? `\nPagamento para: ${dataReceber}` : ""}

💳 CHAVE PIX (CNPJ): 57.010.512/0001-56  
📩 Por favor, envie o comprovante após o pagamento.

Obrigada pela preferência!`;

  const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");
};

// === DASHBOARD COMPLETO ===
window.showDashboard = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const mesOptions = Array.from({ length: 12 }, (_, i) => {
    const mesNum = i + 1;
    const mesLabel = new Date(0, mesNum - 1).toLocaleString("pt-BR", { month: "long" });
    return `<option value="${mesNum}" ${mesNum === mesAtual ? "selected" : ""}>${mesLabel}</option>`;
  }).join("");

  const hojeStr = hoje.toISOString().split("T")[0];
  const hojeVendas = vendas.filter(v => v.data === hojeStr);
  const totalHoje = hojeVendas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
  const aReceber = vendas.filter(v => v.status !== "pago")
    .reduce((acc, v) => acc + ((parseFloat(v.faltaReceber) > 0) ? parseFloat(v.faltaReceber) : 0), 0);
  const valorRecebido = vendas
    .filter(v => v.status === "pago" || v.status === "parcial")
    .reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);

  // === Top 5 dias com maior valor a receber ===
  const diasValores = {};
  vendas.forEach(v => {
    if (v.status !== "pago" && v.dataReceber) {
      diasValores[v.dataReceber] = (diasValores[v.dataReceber] || 0) + (parseFloat(v.faltaReceber) || 0);
    }
  });
  const topDias = Object.entries(diasValores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([data, valor]) => `<li><strong>${formatarData(data)}</strong>: R$ ${valor.toFixed(2).replace(".", ",")}</li>`)
    .join("");

  // === Top 10 devedores (baseado em telefone) ===
  const devedores = {};
  vendas.forEach(v => {
    if (v.status !== "pago" && v.telefone) {
      devedores[v.telefone] = devedores[v.telefone] || { nome: v.cliente, total: 0 };
      devedores[v.telefone].total += (parseFloat(v.faltaReceber) || 0);
    }
  });
  const topDevedores = Object.entries(devedores)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .map(([tel, data]) => `<li><strong>${data.nome}</strong> (${tel}): R$ ${data.total.toFixed(2).replace(".", ",")}</li>`)
    .join("");

  // === HTML FINAL ===
  document.getElementById("conteudo").innerHTML = `
    <h2>Dashboard</h2>
    <section style="margin-bottom:20px;">
      <h3>Vendas hoje: ${hojeVendas.length}</h3>
      <p>Total vendido hoje: ${totalHoje.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <p>Valor a receber: ${aReceber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <p>Valor recebido até agora: ${valorRecebido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
    </section>

    <section style="margin-bottom:20px;">
      <div style="display: flex; flex-wrap: wrap; gap: 20px;">
        <div style="flex:1; min-width:280px; border: 1px solid #ddd; border-radius: 10px; padding: 15px; background: #fafafa;">
          <h4>📅 Dias com mais valores a receber</h4>
          <ul style="padding-left: 20px; margin-top:10px;">${topDias || "<li>Nenhum resultado</li>"}</ul>
        </div>

        <div style="flex:1; min-width:280px; border: 1px solid #ddd; border-radius: 10px; padding: 15px; background: #fafafa;">
          <h4>🙍‍♂️ Pessoas que mais devem</h4>
          <ul style="padding-left: 20px; margin-top:10px;">${topDevedores || "<li>Nenhum resultado</li>"}</ul>
        </div>
      </div>
    </section>

    <section>
      <h3>📆 Vendas por Dia</h3>
      <label for="mesSelecionado">Selecionar Mês:</label>
      <select id="mesSelecionado">${mesOptions}</select>
      <div class="calendar" id="dashboardCalendar" style="display: flex; flex-wrap: wrap;"></div>
      <div id="detalhesDiaDashboard"></div>
    </section>
  `;

  const selectMes = document.getElementById("mesSelecionado");
  selectMes.addEventListener("change", () => {
    gerarCalendario(vendas, parseInt(selectMes.value), anoAtual);
  });

  gerarCalendario(vendas, mesAtual, anoAtual);
};

// === MOSTRAR DETALHES DO DIA NO DASHBOARD ===
window.mostrarDiaDashboard = async (dataCompleta) => {
  const snap = await getDocs(collection(db, "vendas"));
  const todasVendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const vendasDoDia = todasVendas.filter(v => v.data === dataCompleta);

  if (!vendasDoDia.length) {
    document.getElementById("detalhesDiaDashboard").innerHTML = "<p>Sem vendas neste dia.</p>";
    return;
  }

  const cards = vendasDoDia.map(v => {
    const produtos = v.produtosVendidos?.map(p => `<li>${p}</li>`).join("") || "Nenhum";
    return `
      <div class="card compra-info" style="border-left: 4px solid #c06078; margin-bottom: 15px; padding: 10px;">
        <p><strong>Cliente:</strong> ${v.cliente}</p>
        <p><strong>Telefone:</strong> ${v.telefone || "Não informado"}</p>
        <p><strong>Local:</strong> ${v.local || "Não informado"}</p>
        <p><strong>Valor:</strong> R$ ${parseFloat(v.valor).toFixed(2).replace(".", ",")}</p>
        <p><strong>Status:</strong> ${v.status}</p>
        <p><strong>Forma:</strong> ${v.forma || "Não informado"}</p>
        ${v.status !== "pago" ? `<p><strong>Data Receber:</strong> ${v.dataReceber || "Não informada"}</p>` : ""}
        ${v.status === "parcial" ? `<p><strong>Valor Parcial:</strong> R$ ${parseFloat(v.valorParcial).toFixed(2).replace(".", ",")}</p>` : ""}
        ${v.status !== "pago" ? `<p><strong>Falta Receber:</strong> R$ ${parseFloat(v.faltaReceber).toFixed(2).replace(".", ",")}</p>` : ""}
        <p><strong>Produtos Vendidos:</strong></p>
        <ul>${produtos}</ul>
      </div>
    `;
  }).join("");

  document.getElementById("detalhesDiaDashboard").innerHTML = cards;
};

// === TELA DE COBRANÇA (ATUALIZADA COM LOCAL > CLIENTE > FILTRO DE COBRANÇA) ===
window.showCobranca = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filtra pendentes
  const pendentes = vendas.filter(v => v.status !== "pago" && v.dataReceber);

  // Salva para uso posterior
  localStorage.setItem("vendas", JSON.stringify(vendas));

  // Monta HTML inicial
  document.getElementById("conteudo").innerHTML = `
    <h2>Cobrança</h2>
    <label>Selecione o local:</label>
    <select id="localFiltro">
      <option value="">-- Escolha o local --</option>
      <option value="todos">Todos</option>
      ${[...new Set(pendentes.map(v => v.local || "Não informado"))]
        .map(local => `<option value="${local}">${local}</option>`).join("")}
    </select>

    <div id="clienteFiltroContainer" style="margin-top:10px; display:none;">
      <label>Selecione o cliente:</label>
      <select id="clienteFiltro"></select>
    </div>

    <div id="tipoCobrancaContainer" style="margin-top:10px; display:none;">
      <label>Tipo de cobrança:</label>
      <select id="tipoCobrancaFiltro">
        <option value="">-- Escolha o tipo --</option>
        <option value="vencidas">Cobrar Vencidas</option>
        <option value="a_vencer">Cobrar A Vencer</option>
        <option value="todas">Cobrar Todas</option>
      </select>
    </div>

    <div id="resultadosCobranca"></div>
  `;

  // Filtro LOCAL
  document.getElementById("localFiltro").addEventListener("change", e => {
    const localSelecionado = e.target.value;
    if (!localSelecionado) {
      document.getElementById("clienteFiltroContainer").style.display = "none";
      document.getElementById("tipoCobrancaContainer").style.display = "none";
      document.getElementById("resultadosCobranca").innerHTML = "";
      return;
    }

    let clientesParaFiltro = [];
    if (localSelecionado === "todos") {
      clientesParaFiltro = pendentes;
    } else {
      clientesParaFiltro = pendentes.filter(v => v.local === localSelecionado);
    }

    const clientes = clientesParaFiltro
      .reduce((acc, v) => {
        const tel = (v.telefone || "").replace(/\D/g, "");
        if (tel && !acc.some(c => c.telefone === tel)) {
          acc.push({ nome: v.cliente, telefone: tel });
        }
        return acc;
      }, []);

    const clienteSelect = document.getElementById("clienteFiltro");
    clienteSelect.innerHTML = `<option value="">-- Escolha o cliente --</option>` +
      `<option value="todos">Todos</option>` +
      clientes.map(c => `<option value="${c.telefone}">${c.nome}</option>`).join("");

    document.getElementById("clienteFiltroContainer").style.display = "block";
    document.getElementById("tipoCobrancaContainer").style.display = "none";
    document.getElementById("resultadosCobranca").innerHTML = "";
  });

  // Filtro CLIENTE
  document.getElementById("clienteFiltro").addEventListener("change", e => {
    const telefoneSelecionado = e.target.value;
    if (!telefoneSelecionado) {
      document.getElementById("tipoCobrancaContainer").style.display = "none";
      document.getElementById("resultadosCobranca").innerHTML = "";
      return;
    }

    document.getElementById("tipoCobrancaContainer").style.display = "block";
    document.getElementById("resultadosCobranca").innerHTML = "";
  });

  // Filtro TIPO DE COBRANÇA
  document.getElementById("tipoCobrancaFiltro").addEventListener("change", e => {
    const tipoSelecionado = e.target.value;
    const telefoneSelecionado = document.getElementById("clienteFiltro").value;
    const localSelecionado = document.getElementById("localFiltro").value;
    
    if (!tipoSelecionado || !telefoneSelecionado || !localSelecionado) {
      document.getElementById("resultadosCobranca").innerHTML = "";
      return;
    }

    mostrarCobrancasPorTipo(telefoneSelecionado, tipoSelecionado, localSelecionado);
  });
};

// === MOSTRAR COBRANÇAS POR TIPO ===
window.mostrarCobrancasPorTipo = (telefone, tipo, local) => {
  const snap = localStorage.getItem("vendas");
  const todasVendas = JSON.parse(snap || "[]");
  
  let vendasCliente = [];
  
  if (telefone === "todos") {
    // Se cliente é "todos", filtra por local
    if (local === "todos") {
      vendasCliente = todasVendas.filter(v => v.status !== "pago" && v.dataReceber);
    } else {
      vendasCliente = todasVendas.filter(v => 
        v.local === local && 
        v.status !== "pago" && 
        v.dataReceber
      );
    }
  } else {
    // Se cliente específico, filtra normalmente
    vendasCliente = todasVendas.filter(v => 
      (v.telefone || "").replace(/\D/g, "") === telefone && 
      v.status !== "pago" && 
      v.dataReceber
    );
  }

  if (!vendasCliente.length) {
    document.getElementById("resultadosCobranca").innerHTML = "<p>Nenhuma cobrança encontrada para este filtro.</p>";
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let vendasFiltradas = [];
  let titulo = "";

  switch (tipo) {
    case "vencidas":
      vendasFiltradas = vendasCliente.filter(v => {
        const dataVencimento = new Date(v.dataReceber);
        return dataVencimento < hoje;
      });
      titulo = "Cobranças Vencidas";
      break;
    case "a_vencer":
      vendasFiltradas = vendasCliente.filter(v => {
        const dataVencimento = new Date(v.dataReceber);
        return dataVencimento >= hoje;
      });
      titulo = "Cobranças A Vencer";
      break;
    case "todas":
      vendasFiltradas = vendasCliente;
      titulo = "Todas as Cobranças";
      break;
  }

  if (!vendasFiltradas.length) {
    document.getElementById("resultadosCobranca").innerHTML = `<p>Nenhuma cobrança encontrada para "${titulo}".</p>`;
    return;
  }

  // Se for "todos" os clientes, agrupa por cliente e data
  let cards = "";
  if (telefone === "todos") {
    // Agrupa por cliente primeiro, depois por data
    const gruposPorCliente = vendasFiltradas.reduce((acc, venda) => {
      const tel = (venda.telefone || "").replace(/\D/g, "") || "sem-telefone";
      if (!acc[tel]) {
        acc[tel] = [];
      }
      acc[tel].push(venda);
      return acc;
    }, {});

    cards = Object.entries(gruposPorCliente).map(([telefoneCliente, vendasDoCliente]) => {
      // Agrupa por data de vencimento dentro do cliente
      const gruposPorData = vendasDoCliente.reduce((acc, venda) => {
        const data = venda.dataReceber;
        if (!acc[data]) {
          acc[data] = [];
        }
        acc[data].push(venda);
        return acc;
      }, {});

      const datasOrdenadas = Object.keys(gruposPorData).sort((a, b) => new Date(a) - new Date(b));

      return datasOrdenadas.map(data => {
        const vendasDaData = gruposPorData[data];
        const nome = vendasDaData[0].cliente || "Sem nome";

        const comprasHtml = vendasDaData.map((venda, index) => {
          const valor = parseFloat(venda.valor || 0);
          const valorPago = parseFloat(venda.valorParcial) || 0;
          const faltaPagar = parseFloat(venda.faltaReceber) || (valor - valorPago);
          const produtosHtml = (venda.produtosVendidos || []).map(p => `<div>- ${p}</div>`).join("");
          const borderStyle = index > 0 ? 'border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px;' : '';

          return `
            <div class="compra-individual" style="${borderStyle}">
              <p><strong>Data da Compra:</strong> ${formatarData(venda.data)}</p>
              <p><strong>Local:</strong> ${venda.local || "Não informado"}</p>
              <p><strong>Valor Total:</strong> ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              <p><strong>Valor Pago:</strong> ${valorPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              <p><strong>Falta Pagar:</strong> ${faltaPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              <p><strong>Produtos:</strong></p>
              <div style="margin-left: 15px;">${produtosHtml || "Nenhum produto listado."}</div>
            </div>
          `;
        }).join("");

        const totalValorGrupo = vendasDaData.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
        const totalPagoGrupo = vendasDaData.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
        const totalFaltaPagarGrupo = vendasDaData.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

        // Verifica se está vencida
        const dataVencimento = new Date(data);
        const isVencida = dataVencimento < hoje;
        const statusVencimento = isVencida ? '🔴 VENCIDA' : '🟢 A VENCER';

        return `
          <div class="card" style="margin-bottom:25px; padding:20px; border:none; border-radius:15px; box-shadow: 0 8px 25px rgba(0,0,0,0.12); background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); position: relative; overflow: hidden;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: ${isVencida ? 'linear-gradient(90deg, #ff6b6b, #ee5a52)' : 'linear-gradient(90deg, #51cf66, #40c057)'};"></div>
            <div style="display: flex; align-items: center; margin-bottom: 15px;">
              <div style="width: 50px; height: 50px; border-radius: 50%; background: ${isVencida ? 'linear-gradient(135deg, #ff6b6b, #ee5a52)' : 'linear-gradient(135deg, #51cf66, #40c057)'}; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-weight: bold; font-size: 18px;">
                ${isVencida ? '!' : '✓'}
              </div>
              <div>
                <h3 style="margin: 0; color: #2c3e50; font-size: 1.4em; font-weight: 600;">${nome}</h3>
                <p style="margin: 5px 0 0 0; color: ${isVencida ? '#e74c3c' : '#27ae60'}; font-weight: 600; font-size: 0.95em;">${statusVencimento} - Vencimento: ${formatarData(data)}</p>
              </div>
            </div>
            <div style="background: rgba(255,255,255,0.7); border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(0,0,0,0.05);">
              ${comprasHtml}
            </div>
            <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
                <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="color: #6c757d; font-size: 0.85em; margin-bottom: 5px;">Total Geral</div>
                  <div style="color: #2c3e50; font-weight: bold; font-size: 1.1em;">${totalValorGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="color: #6c757d; font-size: 0.85em; margin-bottom: 5px;">Total Pago</div>
                  <div style="color: #27ae60; font-weight: bold; font-size: 1.1em;">${totalPagoGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                </div>
                <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                  <div style="color: #6c757d; font-size: 0.85em; margin-bottom: 5px;">Total Pendente</div>
                  <div style="color: #e74c3c; font-weight: bold; font-size: 1.1em;">${totalFaltaPagarGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
                </div>
              </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;">
              <button style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: 0.9em; font-weight: 600; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3); transition: all 0.3s ease; min-width: 120px;" onclick="marcarPagoGrupo('${telefoneCliente}', '${data}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(46, 204, 113, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(46, 204, 113, 0.3)'">Pagar Tudo</button>
              <button style="background: linear-gradient(135deg, #f8b4cb, #f48fb1); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: 0.9em; font-weight: 600; box-shadow: 0 4px 15px rgba(244, 143, 177, 0.3); transition: all 0.3s ease; min-width: 120px;" onclick="mostrarFormParcialGrupo('${telefoneCliente}', '${data}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(244, 143, 177, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(244, 143, 177, 0.3)'">Pago Parcial</button>
              <button style="background: linear-gradient(135deg, #a8e6cf, #7fcdcd); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: 0.9em; font-weight: 600; box-shadow: 0 4px 15px rgba(127, 205, 205, 0.3); transition: all 0.3s ease; min-width: 120px;" onclick="cobrarWhats('${telefoneCliente}', '${data}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(127, 205, 205, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(127, 205, 205, 0.3)'">WhatsApp</button>
              <button style="background: linear-gradient(135deg, #dda0dd, #d8bfd8); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: 0.9em; font-weight: 600; box-shadow: 0 4px 15px rgba(216, 191, 216, 0.3); transition: all 0.3s ease; min-width: 120px;" onclick="reagendarGrupo('${telefoneCliente}', '${data}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(216, 191, 216, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(216, 191, 216, 0.3)'">Reagendar</button>
            </div>
            <div id="parcial-grupo-${telefoneCliente}-${data.replace(/-/g, '')}" style="margin-top:20px; display:none;"></div>
            <div id="reagendar-${telefoneCliente}-${data.replace(/-/g, '')}" style="margin-top:20px; display:none;"></div>
          </div>
        `;
      }).join("");
    }).flat().join("");
  } else {
    // Lógica original para cliente específico
    const gruposPorData = vendasFiltradas.reduce((acc, venda) => {
      const data = venda.dataReceber;
      if (!acc[data]) {
        acc[data] = [];
      }
      acc[data].push(venda);
      return acc;
    }, {});

    const datasOrdenadas = Object.keys(gruposPorData).sort((a, b) => new Date(a) - new Date(b));

    cards = datasOrdenadas.map(data => {
      const vendasDaData = gruposPorData[data];
      const nome = vendasDaData[0].cliente || "Sem nome";

      const comprasHtml = vendasDaData.map((venda, index) => {
        const valor = parseFloat(venda.valor || 0);
        const valorPago = parseFloat(venda.valorParcial) || 0;
        const faltaPagar = parseFloat(venda.faltaReceber) || (valor - valorPago);
        const produtosHtml = (venda.produtosVendidos || []).map(p => `<div>- ${p}</div>`).join("");
        const borderStyle = index > 0 ? 'border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px;' : '';

        return `
          <div class="compra-individual" style="${borderStyle}">
            <p><strong>Data da Compra:</strong> ${formatarData(venda.data)}</p>
            <p><strong>Valor Total:</strong> ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p><strong>Valor Pago:</strong> ${valorPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p><strong>Falta Pagar:</strong> ${faltaPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            <p><strong>Produtos:</strong></p>
            <div style="margin-left: 15px;">${produtosHtml || "Nenhum produto listado."}</div>
          </div>
        `;
      }).join("");

      const totalValorGrupo = vendasDaData.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
      const totalPagoGrupo = vendasDaData.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
      const totalFaltaPagarGrupo = vendasDaData.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

      // Verifica se está vencida
      const dataVencimento = new Date(data);
      const isVencida = dataVencimento < hoje;
      const statusVencimento = isVencida ? '🔴 VENCIDA' : '🟢 A VENCER';

      return `
        <div class="card" style="margin-bottom:25px; padding:20px; border:none; border-radius:15px; box-shadow: 0 8px 25px rgba(0,0,0,0.12); background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%); position: relative; overflow: hidden;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: ${isVencida ? 'linear-gradient(90deg, #ff6b6b, #ee5a52)' : 'linear-gradient(90deg, #51cf66, #40c057)'};"></div>
          <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: ${isVencida ? 'linear-gradient(135deg, #ff6b6b, #ee5a52)' : 'linear-gradient(135deg, #51cf66, #40c057)'}; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-weight: bold; font-size: 18px;">
              ${isVencida ? '!' : '✓'}
            </div>
            <div>
              <h3 style="margin: 0; color: #2c3e50; font-size: 1.4em; font-weight: 600;">${nome}</h3>
              <p style="margin: 5px 0 0 0; color: ${isVencida ? '#e74c3c' : '#27ae60'}; font-weight: 600; font-size: 0.95em;">${statusVencimento} - Vencimento: ${formatarData(data)}</p>
            </div>
          </div>
          <div style="background: rgba(255,255,255,0.7); border-radius: 12px; padding: 15px; margin-bottom: 20px; border: 1px solid rgba(0,0,0,0.05);">
            ${comprasHtml}
          </div>
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 12px; padding: 15px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; text-align: center;">
              <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="color: #6c757d; font-size: 0.85em; margin-bottom: 5px;">Total Geral</div>
                <div style="color: #2c3e50; font-weight: bold; font-size: 1.1em;">${totalValorGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="color: #6c757d; font-size: 0.85em; margin-bottom: 5px;">Total Pago</div>
                <div style="color: #27ae60; font-weight: bold; font-size: 1.1em;">${totalPagoGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
              <div style="background: white; padding: 12px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <div style="color: #6c757d; font-size: 0.85em; margin-bottom: 5px;">Total Pendente</div>
                <div style="color: #e74c3c; font-weight: bold; font-size: 1.1em;">${totalFaltaPagarGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
              </div>
            </div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; justify-content: center;">
            <button style="background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: 0.9em; font-weight: 600; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3); transition: all 0.3s ease; min-width: 120px;" onclick="marcarPagoGrupo('${telefone}', '${data}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(46, 204, 113, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(46, 204, 113, 0.3)'">Pagar Tudo</button>
            <button style="background: linear-gradient(135deg, #f8b4cb, #f48fb1); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: 0.9em; font-weight: 600; box-shadow: 0 4px 15px rgba(244, 143, 177, 0.3); transition: all 0.3s ease; min-width: 120px;" onclick="mostrarFormParcialGrupo('${telefone}', '${data}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(244, 143, 177, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(244, 143, 177, 0.3)'">Pago Parcial</button>
            <button style="background: linear-gradient(135deg, #a8e6cf, #7fcdcd); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: 0.9em; font-weight: 600; box-shadow: 0 4px 15px rgba(127, 205, 205, 0.3); transition: all 0.3s ease; min-width: 120px;" onclick="cobrarWhats('${telefone}', '${data}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(127, 205, 205, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(127, 205, 205, 0.3)'">WhatsApp</button>
            <button style="background: linear-gradient(135deg, #dda0dd, #d8bfd8); color: white; border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer; font-size: 0.9em; font-weight: 600; box-shadow: 0 4px 15px rgba(216, 191, 216, 0.3); transition: all 0.3s ease; min-width: 120px;" onclick="reagendarGrupo('${telefone}', '${data}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(216, 191, 216, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(216, 191, 216, 0.3)'">Reagendar</button>
          </div>
          <div id="parcial-grupo-${telefone}-${data.replace(/-/g, '')}" style="margin-top:20px; display:none;"></div>
          <div id="reagendar-${telefone}-${data.replace(/-/g, '')}" style="margin-top:20px; display:none;"></div>
        </div>
      `;
    }).join("");
  }

  // Calcula totais gerais
  const totalGeralValor = vendasFiltradas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
  const totalGeralPago = vendasFiltradas.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
  const totalGeralPendente = vendasFiltradas.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

  const resumoGeral = `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 15px; margin-bottom: 30px; color: white; box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);">
      <h3 style="margin: 0 0 20px 0; color: white; text-align: center; font-size: 1.5em; font-weight: 600;">${titulo}</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
        <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.2);">
          <div style="color: rgba(255,255,255,0.8); font-size: 0.9em; margin-bottom: 8px; font-weight: 500;">💰 Total Geral</div>
          <div style="color: white; font-weight: bold; font-size: 1.3em;">${totalGeralValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
        </div>
        <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.2);">
          <div style="color: rgba(255,255,255,0.8); font-size: 0.9em; margin-bottom: 8px; font-weight: 500;">✅ Total Pago</div>
          <div style="color: #4ade80; font-weight: bold; font-size: 1.3em;">${totalGeralPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
        </div>
        <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.2);">
          <div style="color: rgba(255,255,255,0.8); font-size: 0.9em; margin-bottom: 8px; font-weight: 500;">🔔 Total Pendente</div>
          <div style="color: #f87171; font-weight: bold; font-size: 1.3em;">${totalGeralPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
        </div>
      </div>
      ${telefone === "todos" && local === "todos" ? `
        <div style="text-align: center; margin-top: 25px;">
          <button style="background: linear-gradient(135deg, #ff6b6b, #ee5a52); color: white; border: none; padding: 15px 30px; border-radius: 25px; cursor: pointer; font-size: 1em; font-weight: 600; box-shadow: 0 4px 15px rgba(238, 90, 82, 0.3); transition: all 0.3s ease;" onclick="gerarPDF('${tipo}', '${local}', '${telefone}')" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(238, 90, 82, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(238, 90, 82, 0.3)'">📄 Gerar PDF</button>
        </div>
      ` : ''}
    </div>
  `;

  document.getElementById("resultadosCobranca").innerHTML = `${resumoGeral}${cards}`;
};

// === MOSTRAR FORMULÁRIO DE PAGAMENTO PARCIAL DE GRUPO ===
window.mostrarFormParcialGrupo = (telefone, dataCompleta) => {
    const containerId = `parcial-grupo-${telefone}-${dataCompleta.replace(/-/g, '')}`;
    const container = document.getElementById(containerId);
    if (container.style.display === "block") {
        container.style.display = "none";
        container.innerHTML = "";
        return;
    }
    container.innerHTML = `
        <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-top: 15px; background-color: #fff;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Valor pago agora:</label>
            <input type="number" id="valorParcialInput-grupo-${telefone}-${dataCompleta.replace(/-/g, '')}" placeholder="Ex: 50.00" step="0.01" min="0" style="margin-bottom: 12px; width: calc(100% - 20px); padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Reagendar restante para:</label>
            <input type="date" id="novaDataReagendar-grupo-${telefone}-${dataCompleta.replace(/-/g, '')}" style="margin-bottom: 12px; width: calc(100% - 20px); padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            <button style="background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;" onclick="confirmarParcialGrupo('${telefone}', '${dataCompleta}')">Confirmar Pagamento Parcial</button>
        </div>
    `;
    container.style.display = "block";
};

// === CONFIRMAR PAGAMENTO PARCIAL DE GRUPO E REAGENDAR RESTANTE ===
window.confirmarParcialGrupo = async (telefone, dataCompleta) => {
    const dataId = dataCompleta.replace(/-/g, '');
    const valorInput = document.getElementById(`valorParcialInput-grupo-${telefone}-${dataId}`);
    const dataInput = document.getElementById(`novaDataReagendar-grupo-${telefone}-${dataId}`);

    if (!valorInput || !valorInput.value || isNaN(valorInput.value) || parseFloat(valorInput.value) <= 0) {
        return alert("Informe um valor pago válido.");
    }
    if (!dataInput || !dataInput.value) {
        return alert("Informe uma nova data para reagendar o valor restante.");
    }

    const valorPago = parseFloat(valorInput.value);
    const novaData = dataInput.value;

    try {
        const snap = await getDocs(collection(db, "vendas"));
        const vendasDoGrupo = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(v => (v.telefone || "").replace(/\D/g, "") === telefone && v.dataReceber === dataCompleta && v.status !== "pago")
            .sort((a, b) => new Date(a.data) - new Date(b.data));

        if (vendasDoGrupo.length === 0) {
            return alert("Nenhuma cobrança encontrada para este grupo.");
        }

        let valorRestanteAPagar = valorPago;
        const idsParaReagendar = [];

        for (const venda of vendasDoGrupo) {
            let novoValorParcial = parseFloat(venda.valorParcial) || 0;
            let novoFaltaReceber = parseFloat(venda.faltaReceber) || (parseFloat(venda.valor) - novoValorParcial);
            
            if (valorRestanteAPagar > 0) {
                const pagamentoParaEstaVenda = Math.min(valorRestanteAPagar, novoFaltaReceber);
                novoValorParcial += pagamentoParaEstaVenda;
                novoFaltaReceber -= pagamentoParaEstaVenda;
                valorRestanteAPagar -= pagamentoParaEstaVenda;
            }

            const novoStatus = novoFaltaReceber < 0.01 ? "pago" : "parcial";

            await updateDoc(doc(db, "vendas", venda.id), {
                valorParcial: novoValorParcial,
                faltaReceber: novoFaltaReceber,
                status: novoStatus,
            });

            if (novoStatus !== 'pago') {
                idsParaReagendar.push(venda.id);
            }
        }

        for (const id of idsParaReagendar) {
            await updateDoc(doc(db, "vendas", id), { dataReceber: novaData });
        }

        const snapAtual = await getDocs(collection(db, "vendas"));
        localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));

        alert("Pagamento parcial registrado e saldo devedor reagendado com sucesso!");
        
        // Recarrega a tela de cobrança
        const tipoSelecionado = document.getElementById("tipoCobrancaFiltro").value;
        if (tipoSelecionado) {
            mostrarCobrancasPorTipo(telefone, tipoSelecionado);
        }

    } catch (err) {
        console.error("Erro em confirmarParcialGrupo:", err);
        alert("Erro ao processar pagamento parcial. Veja o console.");
    }
};

// === MARCAR PAGO DO GRUPO POR DIA ===
window.marcarPagoGrupo = async (telefone, dataCompleta) => {
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const vendasParaPagar = snap.docs.filter(d => {
      const v = d.data();
      return (v.telefone || "").replace(/\D/g, "") === telefone
        && v.dataReceber === dataCompleta
        && v.status !== "pago";
    });

    if (vendasParaPagar.length === 0) {
      alert("Nenhuma compra pendente neste dia para pagar.");
      return;
    }

    for (const docRef of vendasParaPagar) {
      const v = docRef.data();
      await updateDoc(doc(db, "vendas", docRef.id), {
        status: "pago",
        faltaReceber: 0,
        valorParcial: parseFloat(v.valor) || 0,
        dataReceber: null
      });
    }

    const snapAtual = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    alert("Compras do dia marcadas como pagas.");
    
    // Recarrega a tela de cobrança
    const tipoSelecionado = document.getElementById("tipoCobrancaFiltro").value;
    if (tipoSelecionado) {
      mostrarCobrancasPorTipo(telefone, tipoSelecionado);
    }
  } catch (err) {
    console.error("Erro em marcarPagoGrupo:", err);
    alert("Erro ao marcar pago. Veja console.");
  }
};

// === FUNÇÃO DE REAGENDAR COBRANÇA (GRUPO CLIENTE/DIA) ===
window.reagendarGrupo = (telefone, dataCompleta) => {
  const containerId = `reagendar-${telefone}-${dataCompleta.replace(/-/g, '')}`;
  const container = document.getElementById(containerId);
  if (container.style.display === "block") {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-top: 15px; background-color: #fff;">
      <label style="display: block; margin-bottom: 8px; font-weight: bold;">Nova data para cobrança:</label>
      <input type="date" id="novaDataReagendar-${telefone}-${dataCompleta.replace(/-/g, '')}" style="margin-bottom: 12px; width: calc(100% - 20px); padding: 10px; border: 1px solid #ccc; border-radius: 4px;" />
      <button style="background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;" onclick="confirmarReagendarGrupo('${telefone}', '${dataCompleta}')">Confirmar nova data</button>
    </div>
  `;
  container.style.display = "block";
};

// === CONFIRMAR REAGENDAMENTO ===
window.confirmarReagendarGrupo = async (telefone, dataCompleta) => {
  const dataId = dataCompleta.replace(/-/g, '');
  const input = document.getElementById(`novaDataReagendar-${telefone}-${dataId}`);
  if (!input || !input.value) {
    return alert("Informe uma nova data para reagendamento.");
  }
  const novaData = input.value;

  try {
    const snap = await getDocs(collection(db, "vendas"));
    const vendasParaAtualizar = snap.docs.filter(d => {
      const v = d.data();
      return (v.telefone || "").replace(/\D/g, "") === telefone
        && v.dataReceber === dataCompleta
        && v.status !== "pago";
    });

    if (vendasParaAtualizar.length === 0) {
      alert("Nenhuma cobrança para reagendar.");
      return;
    }

    for (const docRef of vendasParaAtualizar) {
      await updateDoc(doc(db, "vendas", docRef.id), {
        dataReceber: novaData
      });
    }

    const snapAtual = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));

    alert("Cobranças reagendadas com sucesso.");
    
    // Recarrega a tela de cobrança
    const tipoSelecionado = document.getElementById("tipoCobrancaFiltro").value;
    if (tipoSelecionado) {
      mostrarCobrancasPorTipo(telefone, tipoSelecionado);
    }
  } catch (err) {
    console.error("Erro em confirmarReagendarGrupo:", err);
    alert("Erro ao reagendar. Veja console.");
  }
};

// === FUNÇÃO DE COBRAR TUDO NO WHATSAPP (GRUPO, FORMATO NOVO) ===
window.cobrarWhats = async (telefone, dataCompleta = null) => {
  const snap = JSON.parse(localStorage.getItem("vendas") || "[]");

  let vendas = snap.filter(v =>
    (v.telefone || "").replace(/\D/g, "") === telefone && v.status !== "pago"
  );

  if (dataCompleta) {
    vendas = vendas.filter(v => v.dataReceber === dataCompleta);
  }

  if (vendas.length === 0) {
    alert("Nenhuma cobrança pendente para este cliente/data.");
    return;
  }

  const nome = vendas[0].cliente || "Cliente";
  let numeroWhats = telefone.replace(/\D/g, "");
  if (!numeroWhats.startsWith("55")) numeroWhats = "55" + numeroWhats;

  // Consolida os dados para a mensagem
  const totalValor = vendas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
  const totalPago = vendas.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
  const totalFalta = totalValor - totalPago;
  
  const datasCompras = [...new Set(vendas.map(v => formatarData(v.data)))].join(' | ');
  const todosProdutos = vendas.flatMap(v => v.produtosVendidos || []);
  const listaProdutos = todosProdutos.map(p => `- ${p}`).join("\n");

  const msg = [
    `Olá ${nome}, tudo bem?`,
    ``,
    `💬 Passando para lembrar de uma cobrança pendente:`,
    ``,
    `🗓️ *Data agendada:* ${formatarData(dataCompleta)}`,
    `📅 *Datas das compras:* ${datasCompras}`,
    ``,
    `🍬 *Produtos:*`,
    `${listaProdutos}`,
    ``,
    `💰 *Total:* R$ ${totalValor.toFixed(2)}`,
    `✅ *Pago:* R$ ${totalPago.toFixed(2)}`,
    `🔔 *Falta:* R$ ${totalFalta.toFixed(2)}`,
    ``,
    `💳 *Chave PIX (CNPJ):*`,
    `57.010.512/0001-56`,
    ``,
    `📩 Por gentileza, envie o comprovante.`,
    ``,
    `— Ana Buck Doces`
  ].join("\n");

  const link = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
};

// === FUNÇÃO AUXILIAR FORMATA DATA YYYY-MM-DD PARA DD/MM/AAAA ===
function formatarData(data) {
  if (!data) return "";
  const partes = data.split("-");
  if (partes.length < 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// === CSS PARA CALENDÁRIO SIMPLES (OPCIONAL) ===
const style = document.createElement("style");
style.innerHTML = `
  .calendar {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 5px;
    max-width: 350px;
  }
  .calendar-day {
    padding: 8px;
    border: 1px solid #ccc;
    text-align: center;
    border-radius: 4px;
    user-select: none;
  }
  .calendar-day:hover {
    background: #eee;
  }
`;
document.head.appendChild(style);



// === FUNÇÃO PARA GERAR PDF ===
window.gerarPDF = async (tipo, local, telefone) => {
  const snap = localStorage.getItem("vendas");
  const todasVendas = JSON.parse(snap || "[]");
  
  let vendasCliente = [];
  
  if (telefone === "todos") {
    if (local === "todos") {
      vendasCliente = todasVendas.filter(v => v.status !== "pago" && v.dataReceber);
    } else {
      vendasCliente = todasVendas.filter(v => 
        v.local === local && 
        v.status !== "pago" && 
        v.dataReceber
      );
    }
  } else {
    vendasCliente = todasVendas.filter(v => 
      (v.telefone || "").replace(/\D/g, "") === telefone && 
      v.status !== "pago" && 
      v.dataReceber
    );
  }

  if (!vendasCliente.length) {
    alert("Nenhuma cobrança encontrada para gerar PDF.");
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let vendasFiltradas = [];
  let titulo = "";

  switch (tipo) {
    case "vencidas":
      vendasFiltradas = vendasCliente.filter(v => {
        const dataVencimento = new Date(v.dataReceber);
        return dataVencimento < hoje;
      });
      titulo = "Cobranças Vencidas";
      break;
    case "a_vencer":
      vendasFiltradas = vendasCliente.filter(v => {
        const dataVencimento = new Date(v.dataReceber);
        return dataVencimento >= hoje;
      });
      titulo = "Cobranças A Vencer";
      break;
    case "todas":
      vendasFiltradas = vendasCliente;
      titulo = "Todas as Cobranças";
      break;
  }

  if (!vendasFiltradas.length) {
    alert("Nenhuma cobrança encontrada para gerar PDF.");
    return;
  }

  // Calcula totais gerais
  const totalGeralValor = vendasFiltradas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
  const totalGeralPago = vendasFiltradas.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
  const totalGeralPendente = vendasFiltradas.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

  // Agrupa por cliente
  const gruposPorCliente = vendasFiltradas.reduce((acc, venda) => {
    const tel = (venda.telefone || "").replace(/\D/g, "") || "sem-telefone";
    if (!acc[tel]) {
      acc[tel] = [];
    }
    acc[tel].push(venda);
    return acc;
  }, {});

  // Gera conteúdo HTML para o PDF
  let conteudoHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Relatório de Cobranças - Ana Buck Doces</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #c06078; padding-bottom: 20px; }
        .header h1 { color: #c06078; margin: 0; font-size: 24px; }
        .header p { margin: 5px 0; color: #666; }
        .resumo { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .resumo h2 { color: #495057; margin-top: 0; }
        .resumo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 15px; }
        .resumo-item { text-align: center; padding: 15px; background: white; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .resumo-item .label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .resumo-item .valor { font-size: 16px; font-weight: bold; }
        .cliente-section { margin-bottom: 30px; page-break-inside: avoid; }
        .cliente-header { background: #c06078; color: white; padding: 15px; border-radius: 8px 8px 0 0; }
        .cliente-header h3 { margin: 0; font-size: 18px; }
        .cliente-content { border: 1px solid #c06078; border-top: none; border-radius: 0 0 8px 8px; }
        .venda-item { padding: 15px; border-bottom: 1px solid #eee; }
        .venda-item:last-child { border-bottom: none; }
        .venda-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .venda-data { font-weight: bold; color: #495057; }
        .venda-status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-vencida { background: #f8d7da; color: #721c24; }
        .status-a-vencer { background: #d4edda; color: #155724; }
        .venda-detalhes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 10px; }
        .detalhe-item { font-size: 14px; }
        .detalhe-label { font-weight: bold; color: #495057; }
        .produtos { margin-top: 10px; }
        .produtos-lista { margin-left: 20px; font-size: 14px; }
        .cliente-totais { background: #f8f9fa; padding: 15px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; }
        .total-item { font-size: 14px; }
        .total-label { color: #666; margin-bottom: 5px; }
        .total-valor { font-weight: bold; font-size: 16px; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Ana Buck Doces</h1>
        <p>Relatório de Cobranças - ${titulo}</p>
        <p>Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
      </div>

      <div class="resumo">
        <h2>Resumo Geral</h2>
        <div class="resumo-grid">
          <div class="resumo-item">
            <div class="label">Total Geral</div>
            <div class="valor" style="color: #495057;">${totalGeralValor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          </div>
          <div class="resumo-item">
            <div class="label">Total Pago</div>
            <div class="valor" style="color: #28a745;">${totalGeralPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          </div>
          <div class="resumo-item">
            <div class="label">Total Pendente</div>
            <div class="valor" style="color: #dc3545;">${totalGeralPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          </div>
        </div>
      </div>
  `;

  // Adiciona cada cliente
  Object.entries(gruposPorCliente).forEach(([telefoneCliente, vendasDoCliente]) => {
    const nomeCliente = vendasDoCliente[0].cliente || "Cliente sem nome";
    const telefoneFormatado = telefoneCliente.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    
    // Calcula totais do cliente
    const totalCliente = vendasDoCliente.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
    const pagoCliente = vendasDoCliente.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
    const pendenteCliente = vendasDoCliente.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

    conteudoHTML += `
      <div class="cliente-section">
        <div class="cliente-header">
          <h3>${nomeCliente}</h3>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Telefone: ${telefoneFormatado}</p>
        </div>
        <div class="cliente-content">
    `;

    // Ordena vendas por data de vencimento
    const vendasOrdenadas = vendasDoCliente.sort((a, b) => new Date(a.dataReceber) - new Date(b.dataReceber));

    vendasOrdenadas.forEach(venda => {
      const dataVencimento = new Date(venda.dataReceber);
      const isVencida = dataVencimento < hoje;
      const statusClass = isVencida ? 'status-vencida' : 'status-a-vencer';
      const statusText = isVencida ? 'VENCIDA' : 'A VENCER';
      
      const valor = parseFloat(venda.valor || 0);
      const valorPago = parseFloat(venda.valorParcial) || 0;
      const faltaPagar = parseFloat(venda.faltaReceber) || (valor - valorPago);
      
      const produtos = (venda.produtosVendidos || []).map(p => `<li>${p}</li>`).join("");

      conteudoHTML += `
        <div class="venda-item">
          <div class="venda-header">
            <div class="venda-data">Compra: ${formatarData(venda.data)}</div>
            <div class="venda-status ${statusClass}">${statusText} - ${formatarData(venda.dataReceber)}</div>
          </div>
          <div class="venda-detalhes">
            <div class="detalhe-item">
              <span class="detalhe-label">Local:</span> ${venda.local || "Não informado"}
            </div>
            <div class="detalhe-item">
              <span class="detalhe-label">Valor Total:</span> ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <div class="detalhe-item">
              <span class="detalhe-label">Valor Pago:</span> ${valorPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
            <div class="detalhe-item">
              <span class="detalhe-label">Falta Pagar:</span> <strong style="color: #dc3545;">${faltaPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
            </div>
          </div>
          ${produtos ? `
            <div class="produtos">
              <div class="detalhe-label">Produtos:</div>
              <ul class="produtos-lista">${produtos}</ul>
            </div>
          ` : ''}
        </div>
      `;
    });

    conteudoHTML += `
          <div class="cliente-totais">
            <div class="total-item">
              <div class="total-label">Total do Cliente</div>
              <div class="total-valor" style="color: #495057;">${totalCliente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
            </div>
            <div class="total-item">
              <div class="total-label">Total Pago</div>
              <div class="total-valor" style="color: #28a745;">${pagoCliente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
            </div>
            <div class="total-item">
              <div class="total-label">Total Pendente</div>
              <div class="total-valor" style="color: #dc3545;">${pendenteCliente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  conteudoHTML += `
      <div class="footer">
        <p>Relatório gerado automaticamente pelo sistema Ana Buck Doces</p>
        <p>Total de clientes: ${Object.keys(gruposPorCliente).length} | Total de cobranças: ${vendasFiltradas.length}</p>
      </div>
    </body>
    </html>
  `;

  // Cria um blob com o conteúdo HTML
  const blob = new Blob([conteudoHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  // Abre uma nova janela para imprimir/salvar como PDF
  const novaJanela = window.open(url, '_blank');
  novaJanela.onload = function() {
    setTimeout(() => {
      novaJanela.print();
      URL.revokeObjectURL(url);
    }, 500);
  };
};
