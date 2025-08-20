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

// === GERA CALENDÁRIO NO DASHBOARD ===
function gerarCalendario(vendas, mes, ano) {
  const vendasPorData = {};
  vendas.forEach(v => {
    if (!v.data) return;
    vendasPorData[v.data] = vendasPorData[v.data] || [];
    vendasPorData[v.data].push(v);
  });

  const diasNoMes = new Date(ano, mes, 0).getDate();
  const prefixoData = `${ano}-${String(mes).padStart(2, "0")}`;
  let calendarioHtml = "";

  for (let i = 1; i <= diasNoMes; i++) {
    const diaStr = String(i).padStart(2, "0");
    const dataCompleta = `${prefixoData}-${diaStr}`;
    const vendasDoDia = vendasPorData[dataCompleta] || [];

    const totalDia = vendasDoDia.reduce((acc, v) => {
      const falta = parseFloat(v.faltaReceber) || 0;
      const valorBase = parseFloat(v.valor) || 0;
      return acc + (falta > 0 ? falta : valorBase);
    }, 0);

    calendarioHtml += `
      <div class="calendar-day" onclick="mostrarDiaDashboard('${dataCompleta}')" style="cursor:pointer; border:1px solid #ccc; margin: 4px; padding: 8px; border-radius: 6px; text-align:center; width: 60px;">
        <div style="font-weight:bold;">${diaStr}</div>
        <div style="color:#c06078; font-size: 0.9em;">${totalDia > 0 ? totalDia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}</div>
      </div>
    `;
  }

  document.getElementById("dashboardCalendar").innerHTML = calendarioHtml;
}

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

// === TELA DE COBRANÇA (ATUALIZADA COM LOCAL > CLIENTE > MÊS) ===
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
      ${[...new Set(pendentes.map(v => v.local || "Não informado"))]
        .map(local => `<option value="${local}">${local}</option>`).join("")}
    </select>

    <div id="clienteFiltroContainer" style="margin-top:10px; display:none;">
      <label>Selecione o cliente:</label>
      <select id="clienteFiltro"></select>
    </div>

    <div id="mesFiltroContainer" style="margin-top:10px; display:none;">
      <label>Selecione o mês:</label>
      <input type="month" id="mesFiltro" />
    </div>

    <div id="calendario"></div>
    <div id="detalhesDia"></div>
  `;

  // Filtro LOCAL
  document.getElementById("localFiltro").addEventListener("change", e => {
    const localSelecionado = e.target.value;
    if (!localSelecionado) {
      document.getElementById("clienteFiltroContainer").style.display = "none";
      document.getElementById("mesFiltroContainer").style.display = "none";
      document.getElementById("calendario").innerHTML = "";
      document.getElementById("detalhesDia").innerHTML = "";
      return;
    }

    const clientes = pendentes
      .filter(v => v.local === localSelecionado)
      .reduce((acc, v) => {
        const tel = (v.telefone || "").replace(/\D/g, "");
        if (tel && !acc.some(c => c.telefone === tel)) {
          acc.push({ nome: v.cliente, telefone: tel });
        }
        return acc;
      }, []);

    const clienteSelect = document.getElementById("clienteFiltro");
    clienteSelect.innerHTML = `<option value="">-- Escolha o cliente --</option>` +
      clientes.map(c => `<option value="${c.telefone}">${c.nome}</option>`).join("");

    document.getElementById("clienteFiltroContainer").style.display = "block";
    document.getElementById("mesFiltroContainer").style.display = "none";
    document.getElementById("calendario").innerHTML = "";
    document.getElementById("detalhesDia").innerHTML = "";
  });

  // Filtro CLIENTE
  document.getElementById("clienteFiltro").addEventListener("change", e => {
    const telefoneSelecionado = e.target.value;
    if (!telefoneSelecionado) {
      document.getElementById("mesFiltroContainer").style.display = "none";
      document.getElementById("calendario").innerHTML = "";
      document.getElementById("detalhesDia").innerHTML = "";
      return;
    }

    document.getElementById("mesFiltroContainer").style.display = "block";
    document.getElementById("calendario").innerHTML = "";
    document.getElementById("detalhesDia").innerHTML = "";
  });

  // Filtro MÊS
  document.getElementById("mesFiltro").addEventListener("change", e => {
    const mes = e.target.value;
    const telefoneSelecionado = document.getElementById("clienteFiltro").value;
    const vendasCliente = pendentes.filter(v => (v.telefone || "").replace(/\D/g, "") === telefoneSelecionado);

    if (!mes) {
      document.getElementById("calendario").innerHTML = "";
      document.getElementById("detalhesDia").innerHTML = "";
      return;
    }

    const diasDoMes = {};
    vendasCliente.forEach(v => {
      if (v.dataReceber?.startsWith(mes)) {
        const dia = v.dataReceber.split("-")[2];
        if (!diasDoMes[dia]) diasDoMes[dia] = [];
        diasDoMes[dia].push(v);
      }
    });

    const calendarioHtml = Array.from({ length: 31 }, (_, i) => {
      const diaStr = String(i + 1).padStart(2, "0");
      const vendasDoDia = diasDoMes[diaStr] || [];
      const totalDia = vendasDoDia.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);
      const temVenda = vendasDoDia.length > 0;

      return `
        <div class="calendar-day" style="cursor:${temVenda ? "pointer" : "default"}; opacity:${temVenda ? 1 : 0.3};"
          onclick="${temVenda ? `mostrarDia(\'${mes}-${diaStr}\')` : ''}">
          <div><strong>${i + 1}</strong></div>
          <div style="font-size:0.8em; color:#444;">
            ${temVenda ? totalDia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ''}
          </div>
        </div>`;
    }).join("");

    document.getElementById("calendario").innerHTML = `<div class="calendar">${calendarioHtml}</div>`;
    document.getElementById("detalhesDia").innerHTML = "";
  });
};

// === EXIBE DETALHES DAS COBRANÇAS DE UM DIA (AGRUPADO POR CLIENTE) ===
window.mostrarDia = (dataCompleta) => {
  const snap = localStorage.getItem("vendas");
  const todasVendas = JSON.parse(snap || "[]");

  const telefoneSelecionado = document.getElementById("clienteFiltro")?.value;
  const vendasDoDia = todasVendas.filter(v =>
    v.dataReceber === dataCompleta &&
    v.status !== "pago" &&
    (!telefoneSelecionado || (v.telefone || "").replace(/\D/g, "") === telefoneSelecionado)
  );

  if (!vendasDoDia.length) {
    document.getElementById("detalhesDia").innerHTML = "<p>Sem cobranças neste dia.</p>";
    return;
  }

  const gruposPorCliente = vendasDoDia.reduce((acc, venda) => {
    const tel = (venda.telefone || "").replace(/\D/g, "") || "sem-telefone";
    if (!acc[tel]) {
      acc[tel] = [];
    }
    acc[tel].push(venda);
    return acc;
  }, {});

  const cards = Object.entries(gruposPorCliente).map(([telefone, vendasDoCliente]) => {
    const nome = vendasDoCliente[0].cliente || "Sem nome";

    const comprasHtml = vendasDoCliente.map((venda, index) => {
      const valor = parseFloat(venda.valor || 0);
      const faltaPagar = parseFloat(venda.faltaReceber) || valor - (parseFloat(venda.valorParcial) || 0);
      const produtosHtml = (venda.produtosVendidos || []).map(p => `<div>- ${p}</div>`).join("");
      const borderStyle = index > 0 ? 'border-top: 1px dashed #ccc; padding-top: 10px; margin-top: 10px;' : '';

      return `
        <div class="compra-individual" style="${borderStyle}">
          <p><strong>Data da Compra:</strong> ${formatarData(venda.data)}</p>
          <p><strong>Valor Total:</strong> ${valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p><strong>Valor Pago:</strong> ${(parseFloat(venda.valorParcial) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p><strong>Falta Pagar:</strong> ${faltaPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p><strong>Produtos:</strong></p>
          <div style="margin-left: 15px;">${produtosHtml || "Nenhum produto listado."}</div>
        </div>
      `;
    }).join("");

    const totalValorGrupo = vendasDoCliente.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
    const totalPagoGrupo = vendasDoCliente.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
    const totalFaltaPagarGrupo = vendasDoCliente.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

    return `
      <div class="card" style="margin-bottom:20px; padding:15px; border:1px solid #a0a0a0; border-radius:10px; box-shadow: 2px 2px 8px rgba(0,0,0,0.1); background-color: #f9f9f9;">
        <h3 style="margin-top:0; color:#333;">${nome}</h3>
        <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 15px;">
          ${comprasHtml}
        </div>
        <div style="padding-top: 10px; text-align: right; font-size: 1.1em; font-weight: bold; color: #555;">
          <p style="margin: 5px 0;">Total Geral: ${totalValorGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p style="margin: 5px 0;">Total Pago: ${totalPagoGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p style="margin: 5px 0; color: #d9534f;">Total Pendente: ${totalFaltaPagarGrupo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        </div>
        <div style="margin-top: 20px; border-top: 1px solid #ddd; padding-top: 15px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
          <button style="background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;" onclick="mostrarComprasDetalhadas(\'${telefone}\')">Ver Todas</button>
          <button style="background-color: #28a745; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;" onclick="marcarPagoGrupo(\'${telefone}\', \'${dataCompleta}\')">Pagar Tudo</button>
          <button style="background-color: #ffc107; color: #333; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;" onclick="mostrarFormParcialGrupo(\'${telefone}\', \'${dataCompleta}\')">Pago Parcial</button>
          <button style="background-color: #17a2b8; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;" onclick="cobrarWhats(\'${telefone}\', \'${dataCompleta}\')">WhatsApp</button>
          <button style="background-color: #6c757d; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;" onclick="reagendarGrupo(\'${telefone}\', \'${dataCompleta}\')">Reagendar</button>
        </div>
        <div id="parcial-grupo-${telefone}" style="margin-top:15px; display:none;"></div>
        <div id="reagendar-${telefone}" style="margin-top:15px; display:none;"></div>
        <div id="compras-detalhadas-${telefone}" style="margin-top:15px; display:none;"></div>
      </div>
    `;
  }).join("");

  document.getElementById("detalhesDia").innerHTML = `<h3>Cobranças de ${formatarData(dataCompleta)}</h3>${cards}`;
};

// === MOSTRAR FORMULÁRIO DE PAGAMENTO PARCIAL DE GRUPO ===
window.mostrarFormParcialGrupo = (telefone, dataCompleta) => {
    const container = document.getElementById(`parcial-grupo-${telefone}`);
    if (container.style.display === "block") {
        container.style.display = "none";
        container.innerHTML = "";
        return;
    }
    container.innerHTML = `
        <div style="padding: 15px; border: 1px solid #ddd; border-radius: 8px; margin-top: 15px; background-color: #fff;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Valor pago agora:</label>
            <input type="number" id="valorParcialInput-grupo-${telefone}" placeholder="Ex: 50.00" step="0.01" min="0" style="margin-bottom: 12px; width: calc(100% - 20px); padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold;">Reagendar restante para:</label>
            <input type="date" id="novaDataReagendar-grupo-${telefone}" style="margin-bottom: 12px; width: calc(100% - 20px); padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            <button style="background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; font-size: 0.9em;" onclick="confirmarParcialGrupo(\'${telefone}\', \'${dataCompleta}\')">Confirmar Pagamento Parcial</button>
        </div>
    `;
    container.style.display = "block";
};

// === CONFIRMAR PAGAMENTO PARCIAL DE GRUPO E REAGENDAR RESTANTE ===
window.confirmarParcialGrupo = async (telefone, dataCompleta) => {
    const valorInput = document.getElementById(`valorParcialInput-grupo-${telefone}`);
    const dataInput = document.getElementById(`novaDataReagendar-grupo-${telefone}`);

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
        window.showCobranca();

    } catch (err) {
        console.error("Erro em confirmarParcialGrupo:", err);
        alert("Erro ao processar pagamento parcial. Veja o console.");
    }
};

// === MOSTRAR COMPRAS DETALHADAS DO CLIENTE (TODAS AS COMPRAS) ===
window.mostrarComprasDetalhadas = (telefone) => {
  const snap = JSON.parse(localStorage.getItem("vendas") || "[]");
  const comprasCliente = snap.filter(v => (v.telefone || "").replace(/\D/g, "") === telefone);

  if (!comprasCliente.length) {
    alert("Nenhuma compra encontrada para este cliente.");
    return;
  }

  const container = document.getElementById(`compras-detalhadas-${telefone}`);

  if (container.style.display === "block") {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  const cardsCompras = comprasCliente.map(v => {
    const produtosFormatado = (v.produtosVendidos || []).map(p => `<div>${p}</div>`).join("");
    return `
      <div class="compra-info" style="border:1px solid #ccc; padding:8px; margin-bottom:8px; border-radius:6px;">
        <p><strong>Data compra:</strong> ${formatarData(v.data)}</p>
        <p><strong>Local:</strong> ${v.local}</p>
        <p><strong>Valor:</strong> ${parseFloat(v.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <p><strong>Status:</strong> ${v.status}</p>
        <p><strong>Forma de pagamento:</strong> ${v.forma || "-"}</p>
        <p><strong>Para pagar em:</strong> ${formatarData(v.dataReceber) || "-"}</p>
        <p><strong>Produtos:</strong><br>${produtosFormatado}</p>
        <button onclick="marcarPagoCompra(\'${v.id}\', \'${telefone}\')">Pago</button>
        <button onclick="cobrarWhatsCompra(\'${v.id}\', \'${telefone}\')">Cobrar no WhatsApp</button>
      </div>
    `;
  }).join("");

  const totalCompra = comprasCliente.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
  const totalPago = comprasCliente.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
  const totalFalta = comprasCliente.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

  container.innerHTML = `
    <h4>Detalhes de Todas as Compras</h4>
    ${cardsCompras}
    <hr>
    <p><strong>Total geral:</strong> ${totalCompra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
    <p><strong>Total pago:</strong> ${totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
    <p><strong>Total para receber:</strong> ${totalFalta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>

    <button onclick="pagarTudoCliente(\'${telefone}\')">Pagar tudo</button>
    <button onclick="mostrarFormParcialTotal(\'${telefone}\')">Pago parcial</button>
    <button onclick="cobrarWhats(\'${telefone}\')">Cobrar tudo no WhatsApp</button>

    <div id="parcial-total-${telefone}" style="margin-top:10px;"></div>
  `;

  container.style.display = "block";
};

// === MARCAR PAGO COMPRA INDIVIDUAL ===
window.marcarPagoCompra = async (idCompra, telefone) => {
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const docRef = snap.docs.find(d => d.id === idCompra);
    if (!docRef) return alert("Compra não encontrada.");

    const v = docRef.data();
    const valor = parseFloat(v.valor || 0);
    const dataReceberOriginal = v.dataReceber;

    await updateDoc(doc(db, "vendas", idCompra), {
      status: "pago",
      faltaReceber: 0,
      valorParcial: valor,
      dataReceber: null
    });

    const snap2 = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snap2.docs.map(d => ({ id: d.id, ...d.data() }))));

    alert("Compra marcada como paga.");
    mostrarDia(dataReceberOriginal); // Atualiza a visualização do dia
  } catch (err) {
    console.error("Erro em marcarPagoCompra:", err);
    alert("Erro ao marcar compra como paga. Veja console.");
  }
};

// === COBRAR WHATSAPP COMPRA INDIVIDUAL (FORMATADO) ===
window.cobrarWhatsCompra = async (idCompra, telefone) => {
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const docRef = snap.docs.find(d => d.id === idCompra);
    if (!docRef) return alert("Compra não encontrada.");
    const v = docRef.data();

    const nome = v.cliente;
    const dataAgendada = formatarData(v.dataReceber);
    const dataCompra = formatarData(v.data);
    const valorTotal = parseFloat(v.valor || 0);
    const valorParcial = parseFloat(v.valorParcial || 0);
    const falta = parseFloat(v.faltaReceber || valorTotal - valorParcial);
    const listaProdutos = (v.produtosVendidos || []).map(p => `- ${p}`).join("\n");

    let numeroWhats = telefone.replace(/\D/g, "");
    if (!numeroWhats.startsWith("55")) numeroWhats = "55" + numeroWhats;

    const msg = [
      `Olá ${nome}, tudo bem?`,
      ``,
      `💬 Passando para lembrar de uma cobrança pendente:`,
      ``,
      `🗓️ *Data agendada:* ${dataAgendada}`,
      `📅 *Data da compra:* ${dataCompra}`,
      ``,
      `🍬 *Produtos:*`,
      `${listaProdutos}`,
      ``,
      `💰 *Total:* R$ ${valorTotal.toFixed(2)}`,
      `✅ *Pago:* R$ ${valorParcial.toFixed(2)}`,
      `🔔 *Falta:* R$ ${falta.toFixed(2)}`,
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
  } catch (err) {
    console.error("Erro em cobrarWhatsCompra:", err);
    alert("Erro ao gerar cobrança WhatsApp. Veja console.");
  }
};

// === FUNÇÃO PARA PAGAR TUDO DO CLIENTE ===
window.pagarTudoCliente = async (telefone) => {
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const comprasPendentes = snap.docs.filter(d => {
      const v = d.data();
      return (v.telefone || "").replace(/\D/g, "") === telefone && v.status !== "pago";
    });

    if (comprasPendentes.length === 0) {
      alert("Nenhuma compra pendente para pagar.");
      return;
    }

    for (const docRef of comprasPendentes) {
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
    
    alert("Todas as compras do cliente marcadas como pagas.");
    mostrarComprasDetalhadas(telefone);
  } catch (err) {
    console.error("Erro em pagarTudoCliente:", err);
    alert("Erro ao pagar tudo. Veja console.");
  }
};

// === FUNÇÃO PARA EXIBIR FORMULÁRIO DE PAGAMENTO PARCIAL (TOTAL) ===
window.mostrarFormParcialTotal = (telefone) => {
  const container = document.getElementById(`parcial-total-${telefone}`);
  if (container.style.display === "block") {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <input type="number" id="valorParcialInput-${telefone}" placeholder="Valor pago parcialmente" step="0.01" min="0" style="margin-right:10px;">
    <button onclick="pagarParcialCliente(\'${telefone}\')">Confirmar pagamento parcial</button>
  `;
  container.style.display = "block";
};

// === FUNÇÃO PARA PAGAR PARCIAL CLIENTE (TOTAL) ===
window.pagarParcialCliente = async (telefone) => {
  const input = document.getElementById(`valorParcialInput-${telefone}`);
  if (!input || !input.value || isNaN(input.value)) {
    return alert("Informe um valor válido para pagamento parcial.");
  }
  const valorPago = parseFloat(input.value);
  if (valorPago <= 0) {
    return alert("Valor pago deve ser maior que zero.");
  }

  try {
    const snap = await getDocs(collection(db, "vendas"));
    const comprasPendentes = snap.docs.filter(d => {
      const v = d.data();
      return (v.telefone || "").replace(/\D/g, "") === telefone && v.status !== "pago";
    });

    if (comprasPendentes.length === 0) {
      alert("Nenhuma compra pendente para pagar.");
      return;
    }

    let valorRestante = valorPago;

    for (const docRef of comprasPendentes) {
      const v = docRef.data();
      const valorCompra = parseFloat(v.valor) || 0;
      const valorParcialAtual = parseFloat(v.valorParcial) || 0;
      const faltaAtual = valorCompra - valorParcialAtual;

      if (valorRestante <= 0) break;

      const pagoAgora = Math.min(faltaAtual, valorRestante);
      const novoValorParcial = valorParcialAtual + pagoAgora;
      const statusNovo = (novoValorParcial >= valorCompra) ? "pago" : "parcial";

      await updateDoc(doc(db, "vendas", docRef.id), {
        valorParcial: novoValorParcial,
        faltaReceber: valorCompra - novoValorParcial,
        status: statusNovo
      });

      valorRestante -= pagoAgora;
    }

    const snapAtual = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    alert("Pagamento parcial registrado com sucesso.");
    mostrarComprasDetalhadas(telefone);
  } catch (err) {
    console.error("Erro em pagarParcialCliente:", err);
    alert("Erro ao registrar pagamento parcial. Veja console.");
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
    mostrarDia(dataCompleta);
  } catch (err) {
    console.error("Erro em marcarPagoGrupo:", err);
    alert("Erro ao marcar pago. Veja console.");
  }
};

// === FUNÇÃO DE REAGENDAR COBRANÇA (GRUPO CLIENTE/DIA) ===
window.reagendarGrupo = (telefone, dataCompleta) => {
  const container = document.getElementById(`reagendar-${telefone}`);
  if (container.style.display === "block") {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <input type="date" id="novaDataReagendar-${telefone}" style="margin-right:10px;" />
    <button onclick="confirmarReagendarGrupo(\'${telefone}\', \'${dataCompleta}\')">Confirmar nova data</button>
  `;
  container.style.display = "block";
};

// === CONFIRMAR REAGENDAMENTO ===
window.confirmarReagendarGrupo = async (telefone, dataCompleta) => {
  const input = document.getElementById(`novaDataReagendar-${telefone}`);
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
    window.showCobranca();
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

