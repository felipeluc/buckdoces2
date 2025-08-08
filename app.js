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

// === PARTE 2: COBRANÇA, DETALHES, AÇÕES (colar após a parte 1) ===

// Helper: limpa telefone (apenas dígitos) e produz ID seguro
function cleanTel(tel) {
  return String(tel || "").replace(/\D/g, "");
}
function idForTel(tel) {
  return `t${cleanTel(tel)}`; // evita começar só com número
}

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

    // Lista de clientes únicos por telefone (unifica por telefone, mostra só nome)
    const clientes = pendentes
      .filter(v => v.local === localSelecionado)
      .reduce((acc, v) => {
        const tel = cleanTel(v.telefone);
        if (!acc.some(c => c.telefone === tel)) {
          acc.push({ nome: v.cliente || "Sem nome", telefone: tel });
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

  // Filtro MÊS (adaptado para cliente)
  document.getElementById("mesFiltro").addEventListener("change", e => {
    const mes = e.target.value; // 'YYYY-MM'
    const telefoneSelecionado = document.getElementById("clienteFiltro").value;
    const vendasCliente = pendentes.filter(v => cleanTel(v.telefone) === telefoneSelecionado);

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
      const diaStr = String(i + 1).padStart(2, "00".length > 2 ? 2 : 2).padStart(2, "0"); // segurança
      const vendasDoDia = diasDoMes[diaStr] || [];

      const totalDia = vendasDoDia.reduce((acc, v) => {
        const falta = parseFloat(v.faltaReceber) || 0;
        return acc + (falta > 0 ? falta : parseFloat(v.valor) || 0);
      }, 0);

      const valorHtml = totalDia > 0
        ? `<div class="calendar-day-value">${totalDia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>`
        : "";

      return `
        <div class="calendar-day" onclick="mostrarDia('${mes}-${diaStr}')">
          <div>${diaStr}</div>
          ${valorHtml}
        </div>`;
    }).join("");

    document.getElementById("calendario").innerHTML = `<div class="calendar">${calendarioHtml}</div>`;
    document.getElementById("detalhesDia").innerHTML = "";
  });
};

// === EXIBE DETALHES DAS COBRANÇAS DE UM DIA (SOMENTE CLIENTE SELECIONADO) ===
window.mostrarDia = (dataCompleta) => {
  const snap = localStorage.getItem("vendas");
  const todasVendas = JSON.parse(snap || "[]");

  const telefoneSelecionado = document.getElementById("clienteFiltro")?.value;
  const vendasDoDia = todasVendas.filter(v =>
    v.dataReceber === dataCompleta &&
    v.status !== "pago" &&
    (!telefoneSelecionado || cleanTel(v.telefone) === telefoneSelecionado)
  );

  if (!vendasDoDia.length) {
    document.getElementById("detalhesDia").innerHTML = "<p>Sem cobranças neste dia.</p>";
    return;
  }

  // Agrupa por telefone (cliente)
  const grupos = {};
  vendasDoDia.forEach(v => {
    const tel = cleanTel(v.telefone) || "sem-telefone";
    if (!grupos[tel]) grupos[tel] = [];
    grupos[tel].push(v);
  });

  const cards = Object.entries(grupos).map(([telefone, vendas]) => {
    const nome = vendas[0].cliente || "Sem nome";

    // Totais do grupo (soma de documentos)
    const totalOriginal = vendas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
    const totalPagoParcial = vendas.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
    const faltaPagar = vendas.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

    const status = vendas.every(v => v.status === "pago") ? "✅ Pago" : "🔔 Pendência";

    // Monta HTML com todas infos das compras individuais do cliente
    const comprasHtml = vendas.map(v => {
      const produtosFormatado = (v.produtosVendidos || []).map(p => `<div>${p}</div>`).join("");
      return `
        <div style="border:1px solid #eee; padding:8px; margin-bottom:6px; border-radius:6px;">
          <p><strong>ID:</strong> ${v.id}</p>
          <p><strong>Data compra:</strong> ${formatarData(v.data)}</p>
          <p><strong>Local:</strong> ${v.local || "-"}</p>
          <p><strong>Valor:</strong> ${parseFloat(v.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p><strong>Status:</strong> ${v.status}</p>
          <p><strong>Forma:</strong> ${v.forma || "-"}</p>
          <p><strong>Data para receber:</strong> ${formatarData(v.dataReceber) || "-"}</p>
          <p><strong>Pago parcial:</strong> ${parseFloat(v.valorParcial || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p><strong>Falta receber:</strong> ${parseFloat(v.faltaReceber || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
          <p><strong>Produtos:</strong><br>${produtosFormatado}</p>
          <div style="margin-top:6px;">
            <button onclick="marcarPagoCompra('${v.id}', '${telefone}')">Pago</button>
            <button onclick="cobrarWhatsCompra('${v.id}', '${telefone}')">Cobrar no WhatsApp</button>
            <button onclick="mostrarFormParcialIndividual('${v.id}', '${telefone}')">Pago parcial</button>
            <button onclick="reagendarCompraIndividual('${v.id}', '${telefone}')">Reagendar</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="card">
        <h3>${nome} - ${telefone}</h3>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Total (soma documentos):</strong> ${totalOriginal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <p><strong>Pago parcial (soma):</strong> ${totalPagoParcial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <p><strong>Falta pagar (soma):</strong> ${faltaPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>

        <div style="margin-top:8px;">
          <button onclick="mostrarComprasDetalhadas('${telefone}')">Ver Compras</button>
          <button onclick="marcarPagoGrupo('${telefone}', '${dataCompleta}')">Pago (grupo)</button>
          <button onclick="marcarParcialGrupo('${telefone}', '${dataCompleta}')">Pago Parcial (grupo)</button>
          <button onclick="cobrarWhats('${telefone}', '${dataCompleta}')">Cobrar no WhatsApp (data)</button>
          <button onclick="reagendarGrupo('${telefone}', '${dataCompleta}')">Reagendar cobrança (grupo)</button>
        </div>

        <div id="reagendar-${idForTel(telefone)}" style="margin-top:8px;"></div>
        <div id="parcial-${idForTel(telefone)}" style="margin-top:8px;"></div>

        <div style="margin-top:12px;">
          <h4>Compras individuais deste cliente nesta data</h4>
          ${comprasHtml}
        </div>

        <div id="compras-detalhadas-${idForTel(telefone)}" style="margin-top:10px;"></div>
      </div>
    `;
  }).join("");

  document.getElementById("detalhesDia").innerHTML = `<h3>${formatarData(dataCompleta)}</h3>${cards}`;
};

// === MOSTRAR COMPRAS DETALHADAS DO CLIENTE ===
window.mostrarComprasDetalhadas = (telefone) => {
  const snap = JSON.parse(localStorage.getItem("vendas") || "[]");
  const comprasCliente = snap.filter(v => cleanTel(v.telefone) === telefone);

  if (!comprasCliente.length) {
    alert("Nenhuma compra encontrada para este cliente.");
    return;
  }

  const container = document.getElementById(`compras-detalhadas-${idForTel(telefone)}`);
  if (!container) {
    alert("Container de detalhes não encontrado.");
    return;
  }

  // Se já está visível, oculta; se não, mostra e preenche
  if (container.style.display === "block") {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  // Monta cards de compras individuais
  const cardsCompras = comprasCliente.map(v => {
    const produtosFormatado = (v.produtosVendidos || []).map(p => `<div>${p}</div>`).join("");
    return `
      <div class="compra-info" style="border:1px solid #ccc; padding:8px; margin-bottom:8px; border-radius:6px;">
        <p><strong>ID:</strong> ${v.id}</p>
        <p><strong>Data:</strong> ${formatarData(v.data)}</p>
        <p><strong>Local:</strong> ${v.local}</p>
        <p><strong>Valor:</strong> ${parseFloat(v.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <p><strong>Status:</strong> ${v.status}</p>
        <p><strong>Forma de Pagamento:</strong> ${v.forma || "-"}</p>
        <p><strong>Para pagar em:</strong> ${formatarData(v.dataReceber) || "-"}</p>
        <p><strong>Pago parcial:</strong> ${parseFloat(v.valorParcial || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <p><strong>Falta receber:</strong> ${parseFloat(v.faltaReceber || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <p><strong>Produtos:</strong><br>${produtosFormatado}</p>
        <div style="margin-top:6px;">
          <button onclick="marcarPagoCompra('${v.id}', '${telefone}')">Pago</button>
          <button onclick="cobrarWhatsCompra('${v.id}', '${telefone}')">Cobrar no WhatsApp</button>
        </div>
      </div>
    `;
  }).join("");

  // Totais da compra detalhados
  const totalCompra = comprasCliente.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
  const totalPago = comprasCliente.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
  const totalFalta = comprasCliente.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

  container.innerHTML = `
    <h4>Detalhes das Compras</h4>
    ${cardsCompras}
    <hr>
    <p><strong>Total geral:</strong> ${totalCompra.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
    <p><strong>Total pago:</strong> ${totalPago.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
    <p><strong>Total para receber:</strong> ${totalFalta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
    <div style="margin-top:8px;">
      <button onclick="pagarTudoCliente('${telefone}')">Pagar tudo</button>
      <button onclick="mostrarFormParcialTotal('${telefone}')">Pago parcial</button>
      <button onclick="cobrarTodasCompras('${telefone}')">Cobrar todas as compras</button>
    </div>
    <div id="parcial-total-${idForTel(telefone)}" style="margin-top:8px;"></div>
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

    await updateDoc(doc(db, "vendas", idCompra), {
      status: "pago",
      faltaReceber: 0,
      valorParcial: valor,
      dataReceber: null
    });

    // atualiza localStorage
    const snap2 = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snap2.docs.map(d => ({ id: d.id, ...d.data() }))));

    alert("Compra marcada como paga.");
    // Atualiza lista compras e calendário
    mostrarComprasDetalhadas(telefone);
    const mesFiltro = document.getElementById("mesFiltro")?.value;
    if (mesFiltro) mostrarDia(mesFiltro + "-01");
  } catch (err) {
    console.error("Erro em marcarPagoCompra:", err);
    alert("Erro ao marcar compra como paga. Veja console.");
  }
};

// === COBRAR WHATSAPP COMPRA INDIVIDUAL ===
window.cobrarWhatsCompra = async (idCompra, telefone) => {
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const docRef = snap.docs.find(d => d.id === idCompra);
    if (!docRef) return alert("Compra não encontrada.");
    const v = docRef.data();

    const nome = v.cliente || "";
    const dataAgendada = formatarData(v.dataReceber);
    const dataCompra = formatarData(v.data);
    const valorTotal = parseFloat(v.valor || 0);
    const valorParcial = parseFloat(v.valorParcial || 0);
    const falta = parseFloat(v.faltaReceber || valorTotal - valorParcial);
    const listaProdutos = (v.produtosVendidos || []).map(p => `${p}`).join("\n");

    let numeroWhats = cleanTel(telefone);
    if (!numeroWhats.startsWith("55")) numeroWhats = "55" + numeroWhats;

    const msg = `Olá ${nome}!, tudo bem?\n\n` +
                `💬 Passando para lembrar de uma cobrança pendente:\n\n` +
                `🗓 Data agendada: ${dataAgendada}\n` +
                `📅 Data da compra: ${dataCompra}\n\n` +
                `🍬 Produtos:\n${listaProdutos}\n\n` +
                `💰 Total: R$ ${valorTotal.toFixed(2)}\n` +
                `✅ Pago: R$ ${valorParcial.toFixed(2)}\n` +
                `🔔 Falta: R$ ${falta.toFixed(2)}\n\n` +
                `💳 Chave PIX:\nCNPJ 57.010.512/0001-56\n\n` +
                `📩 Envie o comprovante por gentileza.\n\n` +
                `— Ana Buck Doces`;

    const link = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(msg)}`;
    window.open(link, "_blank");
  } catch (err) {
    console.error("Erro em cobrarWhatsCompra:", err);
    alert("Erro ao montar cobrança. Veja console.");
  }
};

// === FUNÇÃO PARA PAGAR TUDO DO CLIENTE ===
window.pagarTudoCliente = async (telefone) => {
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const comprasPendentes = snap.docs.filter(d => {
      const v = d.data();
      return cleanTel(v.telefone) === telefone && v.status !== "pago";
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

    // atualiza localStorage
    const snap2 = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snap2.docs.map(d => ({ id: d.id, ...d.data() }))));

    alert("Todas as compras marcadas como pagas!");
    const mesFiltro = document.getElementById("mesFiltro")?.value;
    if (mesFiltro) mostrarDia(mesFiltro + "-01");
    mostrarComprasDetalhadas(telefone);
  } catch (err) {
    console.error("Erro em pagarTudoCliente:", err);
    alert("Erro ao marcar tudo como pago. Veja console.");
  }
};

// === MOSTRAR FORMULÁRIO DE PAGAMENTO PARCIAL TOTAL (inline) ===
window.mostrarFormParcialTotal = (telefone) => {
  const div = document.getElementById(`parcial-total-${idForTel(telefone)}`);
  div.innerHTML = `
    <input type="number" id="valorRecebidoTotal-${idForTel(telefone)}" placeholder="Valor recebido agora" step="0.01" />
    <input type="date" id="novaDataParcialTotal-${idForTel(telefone)}" />
    <button onclick="confirmarParcialTotal('${telefone}')">Confirmar pagamento parcial</button>
    <button onclick="document.getElementById('parcial-total-${idForTel(telefone)}').innerHTML = ''">Cancelar</button>
  `;
};

// === CONFIRMAR PAGAMENTO PARCIAL TOTAL ===
window.confirmarParcialTotal = async (telefone) => {
  try {
    const recebidoAgora = parseFloat(document.getElementById(`valorRecebidoTotal-${idForTel(telefone)}`).value);
    const novaData = document.getElementById(`novaDataParcialTotal-${idForTel(telefone)}`).value;

    if (isNaN(recebidoAgora) || recebidoAgora <= 0 || !novaData) {
      alert("Preencha corretamente o valor e a nova data.");
      return;
    }

    const snap = await getDocs(collection(db, "vendas"));
    const docsGrupo = snap.docs.filter(d => {
      const v = d.data();
      return cleanTel(v.telefone) === telefone && v.status !== "pago";
    });

    if (!docsGrupo.length) {
      alert("Nenhuma compra pendente encontrada.");
      return;
    }

    // Soma total das pendências
    const totalFaltando = docsGrupo.reduce((acc, d) => {
      const v = d.data();
      const falta = parseFloat(v.faltaReceber) > 0 ? parseFloat(v.faltaReceber) : parseFloat(v.valor || 0);
      return acc + falta;
    }, 0);

    if (recebidoAgora >= totalFaltando) {
      // Marca tudo como pago
      for (const d of docsGrupo) {
        await updateDoc(doc(db, "vendas", d.id), {
          status: "pago",
          faltaReceber: 0,
          valorParcial: totalFaltando,
          dataReceber: null
        });
      }
      alert("Pagamento total recebido!");
    } else {
      // Marca parcial e reagenda o restante
      const restante = totalFaltando - recebidoAgora;
      // distribui proporcionalmente conforme lógica simples (dividindo igualmente)
      const cada = recebidoAgora / docsGrupo.length;

      for (const d of docsGrupo) {
        const v = d.data();
        const pagoAtual = parseFloat(v.valorParcial) || 0;
        const faltaAtual = parseFloat(v.faltaReceber) > 0 ? parseFloat(v.faltaReceber) : parseFloat(v.valor || 0);
        const adicional = Math.min(cada, faltaAtual);
        const novoPagoParcial = pagoAtual + adicional;
        const novoFalta = Math.max(0, faltaAtual - adicional);
        const novoStatus = novoFalta <= 0 ? "pago" : "parcial";

        await updateDoc(doc(db, "vendas", d.id), {
          valorParcial: novoPagoParcial,
          faltaReceber: novoFalta,
          status: novoStatus,
          dataReceber: novaData // reagenda o que sobrar
        });
      }

      alert("Pagamento parcial registrado. Pendências reagendadas!");
    }

    // atualizar localStorage e interface
    const snap3 = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snap3.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    const mesFiltro = document.getElementById("mesFiltro")?.value;
    if (mesFiltro) mostrarDia(mesFiltro + "-01");
    mostrarComprasDetalhadas(telefone);
  } catch (err) {
    console.error("Erro em confirmarParcialTotal:", err);
    alert("Erro ao registrar pagamento parcial. Veja console.");
  }
};

// === Função para formatar data no formato DD-MM-AAAA ===
function formatarData(data) {
  if (!data) return "-";
  const parts = String(data).split("-");
  if (parts.length < 3) return data;
  const [ano, mes, dia] = parts;
  return `${dia}-${mes}-${ano}`;
}

/* =========================
   FUNÇÕES ADICIONADAS (GRUPO)
   ========================= */

// Marcar todas as vendas do cliente/data como PAGO
window.marcarPagoGrupo = async (telefone, dataCompleta) => {
  if (!confirm("Confirmar que este cliente pagou tudo?")) return;
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const docsParaAtualizar = snap.docs.filter(d => {
      const v = d.data();
      return cleanTel(v.telefone) === telefone && v.dataReceber === dataCompleta && v.status !== "pago";
    });

    for (const d of docsParaAtualizar) {
      const v = d.data();
      await updateDoc(doc(db, "vendas", d.id), {
        status: "pago",
        faltaReceber: 0,
        valorParcial: parseFloat(v.valor) || 0,
        dataReceber: null
      });
    }

    // atualizar localStorage e interface
    const snap2 = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

    alert("Cobrança marcada como paga!");
    mostrarDia(dataCompleta);
  } catch (err) {
    console.error("Erro em marcarPagoGrupo:", err);
    alert("Erro ao marcar pagamento. Veja console.");
  }
};

// Registrar pagamento parcial para o grupo (inline form)
window.marcarParcialGrupo = (telefone, dataCompleta) => {
  const container = document.getElementById(`parcial-${idForTel(telefone)}`);
  if (!container) return alert("Container de parcial não encontrado.");

  // Se já existe form visível, remove (toggle)
  if (container.innerHTML.trim()) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div style="border:1px dashed #ccc; padding:8px; margin-top:8px; border-radius:6px;">
      <label>Valor total recebido:</label>
      <input type="number" id="valorRecebidoGrupo-${idForTel(telefone)}" placeholder="Ex: 50.00" step="0.01" />
      <label>Data para o restante (opcional):</label>
      <input type="date" id="novaDataGrupo-${idForTel(telefone)}" />
      <div style="margin-top:6px;">
        <button id="confirmarParcialGrupo-${idForTel(telefone)}">Confirmar</button>
        <button id="cancelarParcialGrupo-${idForTel(telefone)}">Cancelar</button>
      </div>
    </div>
  `;

  document.getElementById(`cancelarParcialGrupo-${idForTel(telefone)}`).onclick = () => {
    container.innerHTML = "";
  };

  document.getElementById(`confirmarParcialGrupo-${idForTel(telefone)}`).onclick = async () => {
    const valorStr = document.getElementById(`valorRecebidoGrupo-${idForTel(telefone)}`).value;
    const novaData = document.getElementById(`novaDataGrupo-${idForTel(telefone)}`).value;
    const recebido = parseFloat(String(valorStr).replace(",", "."));
    if (isNaN(recebido) || recebido <= 0) {
      return alert("Valor inválido.");
    }

    try {
      const snap = await getDocs(collection(db, "vendas"));
      const docsGrupo = snap.docs
        .map(d => ({ id: d.id, v: d.data() }))
        .filter(o => cleanTel(o.v.telefone) === telefone && o.v.dataReceber === dataCompleta && o.v.status !== "pago");

      if (!docsGrupo.length) {
        alert("Nenhuma pendência encontrada para este cliente/data.");
        container.innerHTML = "";
        return;
      }

      // calcula faltante por documento
      const itens = docsGrupo.map(o => {
        const falta = (parseFloat(o.v.faltaReceber) > 0) ? parseFloat(o.v.faltaReceber) : (parseFloat(o.v.valor) || 0);
        return { id: o.id, v: o.v, falta };
      });

      let restante = recebido;

      for (const item of itens) {
        if (restante <= 0) break;
        const pagoAtual = parseFloat(item.v.valorParcial) || 0;
        const pagaAgora = Math.min(item.falta, restante);
        const novoPagoParcial = pagoAtual + pagaAgora;
        const novoFalta = Math.max(0, item.falta - pagaAgora);
        const novoStatus = novoFalta <= 0 ? "pago" : "parcial";

        await updateDoc(doc(db, "vendas", item.id), {
          valorParcial: novoPagoParcial,
          faltaReceber: novoFalta,
          status: novoStatus
        });

        restante -= pagaAgora;
      }

      // se indicou nova data, atualiza os documentos que ainda têm faltaReceber > 0
      if (novaData) {
        const snap2 = await getDocs(collection(db, "vendas"));
        const pendentesDepois = snap2.docs.filter(d => {
          const vv = d.data();
          return cleanTel(vv.telefone) === telefone && vv.dataReceber === dataCompleta && (parseFloat(vv.faltaReceber) || 0) > 0;
        });
        for (const d of pendentesDepois) {
          await updateDoc(doc(db, "vendas", d.id), { dataReceber: novaData });
        }
      }

      // atualizar localStorage e interface
      const snap3 = await getDocs(collection(db, "vendas"));
      localStorage.setItem("vendas", JSON.stringify(snap3.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

      alert("Pagamento parcial registrado.");
      container.innerHTML = "";
      mostrarDia(dataCompleta);
    } catch (err) {
      console.error("Erro em marcarParcialGrupo:", err);
      alert("Erro ao registrar pagamento parcial. Veja console.");
    }
  };
};

// Gerar link de cobrança do grupo e abrir WhatsApp (para a data selecionada)
window.cobrarWhats = async (telefone, dataCompleta) => {
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const vendasGrupo = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(v => cleanTel(v.telefone) === telefone && v.dataReceber === dataCompleta);

    if (!vendasGrupo.length) {
      alert("Nenhuma cobrança encontrada para esse cliente/data.");
      return;
    }

    const cliente = vendasGrupo[0].cliente || "";
    let listaProdutos = vendasGrupo.map(v => {
      const produtos = (v.produtosVendidos || []).join(", ");
      const valor = parseFloat(v.valor || 0).toFixed(2);
      return `- ${produtos} — R$ ${valor}`;
    }).join("\n");

    const total = vendasGrupo.reduce((s, v) => s + (parseFloat(v.faltaReceber) > 0 ? parseFloat(v.faltaReceber) : parseFloat(v.valor) || 0), 0);

    let numero = cleanTel(telefone);
    if (!numero.startsWith("55")) numero = "55" + numero;

    const mensagem = `Olá ${cliente}!, tudo bem?\n\n` +
      `💬 Passando para lembrar de uma cobrança pendente:\n\n` +
      `🗓 Data agendada: ${formatarData(dataCompleta)}\n` +
      `📅 Data(s) da(s) compra(s): ${[...new Set(vendasGrupo.map(v => formatarData(v.data)))].join(", ")}\n\n` +
      `🍬 Produtos:\n${listaProdutos}\n\n` +
      `💰 Total: R$ ${total.toFixed(2)}\n\n` +
      `💳 Chave PIX (CNPJ): 57.010.512/0001-56\n\n` +
      `📩 Envie o comprovante por gentileza.\n\n` +
      `— Ana Buck Doces`;

    const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, "_blank");
  } catch (err) {
    console.error("Erro em cobrarWhats:", err);
    alert("Erro ao montar cobrança. Veja console.");
  }
};

// === COBRAR TODAS AS COMPRAS DO CLIENTE (BOTÃO em Ver Compras) ===
window.cobrarTodasCompras = async (telefone) => {
  try {
    const snap = await getDocs(collection(db, "vendas"));
    const todas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const clienteCompras = todas.filter(v => cleanTel(v.telefone) === telefone && v.status !== "pago");

    if (!clienteCompras.length) {
      alert("Nenhuma cobrança pendente para esse cliente.");
      return;
    }

    const cliente = clienteCompras[0].cliente || "";
    const listaPorCompra = clienteCompras.map(v => {
      const produtos = (v.produtosVendidos || []).join(", ");
      return `Data compra: ${formatarData(v.data)} | Para receber: ${formatarData(v.dataReceber) || "-"}\nProdutos: ${produtos}\nValor: R$ ${parseFloat(v.valor || 0).toFixed(2)} | Pago parcial: R$ ${parseFloat(v.valorParcial || 0).toFixed(2)} | Falta: R$ ${parseFloat(v.faltaReceber || 0).toFixed(2)}\n`;
    }).join("\n---\n");

    const totalGeral = clienteCompras.reduce((s, v) => s + (parseFloat(v.valor) || 0), 0);
    const totalPago = clienteCompras.reduce((s, v) => s + (parseFloat(v.valorParcial) || 0), 0);
    const totalFalta = clienteCompras.reduce((s, v) => s + (parseFloat(v.faltaReceber) || 0), 0);

    let numero = cleanTel(telefone);
    if (!numero.startsWith("55")) numero = "55" + numero;

    const mensagem = `Olá ${cliente}!, tudo bem?\n\n` +
      `💬 Passando para lembrar das cobranças pendentes:\n\n` +
      `${listaPorCompra}\n` +
      `💰 Total geral: R$ ${totalGeral.toFixed(2)}\n` +
      `✅ Total pago: R$ ${totalPago.toFixed(2)}\n` +
      `🔔 Total falta: R$ ${totalFalta.toFixed(2)}\n\n` +
      `💳 Chave PIX (CNPJ): 57.010.512/0001-56\n\n` +
      `📩 Envie o comprovante por gentileza.\n\n` +
      `— Ana Buck Doces`;

    const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, "_blank");
  } catch (err) {
    console.error("Erro em cobrarTodasCompras:", err);
    alert("Erro ao montar cobrança de todas as compras. Veja console.");
  }
};

// Reagendar data de cobrança do grupo (inline)
window.reagendarGrupo = (telefone, dataCompleta) => {
  const container = document.getElementById(`reagendar-${idForTel(telefone)}`);
  if (!container) return alert("Container de reagendamento não encontrado.");

  // toggle
  if (container.innerHTML.trim()) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <div style="border:1px dashed #ccc; padding:8px; margin-top:8px; border-radius:6px;">
      <label>Nova data de cobrança:</label>
      <input type="date" id="novaDataReagendar-${idForTel(telefone)}" />
      <div style="margin-top:6px;">
        <button id="confirmarReagendar-${idForTel(telefone)}">Confirmar</button>
        <button id="cancelarReagendar-${idForTel(telefone)}">Cancelar</button>
      </div>
    </div>
  `;

  document.getElementById(`cancelarReagendar-${idForTel(telefone)}`).onclick = () => {
    container.innerHTML = "";
  };

  document.getElementById(`confirmarReagendar-${idForTel(telefone)}`).onclick = async () => {
    const novaData = document.getElementById(`novaDataReagendar-${idForTel(telefone)}`).value;
    if (!novaData) return alert("Informe a nova data.");

    try {
      const snap = await getDocs(collection(db, "vendas"));
      const docsPara = snap.docs.filter(d => {
        const v = d.data();
        return cleanTel(v.telefone) === telefone && v.dataReceber === dataCompleta && v.status !== "pago";
      });

      for (const d of docsPara) {
        await updateDoc(doc(db, "vendas", d.id), { dataReceber: novaData });
      }

      // atualizar localStorage e interface
      const snap2 = await getDocs(collection(db, "vendas"));
      localStorage.setItem("vendas", JSON.stringify(snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))));

      alert("Cobrança reagendada para " + novaData);
      container.innerHTML = "";
      mostrarDia(novaData);
    } catch (err) {
      console.error("Erro em reagendarGrupo:", err);
      alert("Erro ao reagendar. Veja console.");
    }
  };
};

// === Pequenas funções auxiliares para compras individuais (parcial/reagendar) ===
window.mostrarFormParcialIndividual = (idCompra, telefone) => {
  const containerId = `parcial-ind-${idCompra}`;
  let container = document.getElementById(containerId);
  if (!container) {
    // insere abaixo do item (procura o elemento compra-info do id)
    const elems = document.querySelectorAll(".compra-info");
    elems.forEach(e => {
      if (e.innerHTML.includes(idCompra) && !document.getElementById(containerId)) {
        const div = document.createElement("div");
        div.id = containerId;
        div.style.marginTop = "8px";
        div.innerHTML = `
          <input type="number" id="valorParcialInd-${idCompra}" placeholder="Valor recebido agora" step="0.01" />
          <input type="date" id="novaDataParcialInd-${idCompra}" />
          <button id="confirmParcialInd-${idCompra}">Confirmar</button>
          <button id="cancelParcialInd-${idCompra}">Cancelar</button>
        `;
        e.appendChild(div);

        document.getElementById(`cancelParcialInd-${idCompra}`).onclick = () => div.remove();
        document.getElementById(`confirmParcialInd-${idCompra}`).onclick = async () => {
          const valor = parseFloat(document.getElementById(`valorParcialInd-${idCompra}`).value);
          const novaData = document.getElementById(`novaDataParcialInd-${idCompra}`).value;
          if (isNaN(valor) || valor <= 0) return alert("Valor inválido.");
          try {
            const snap = await getDocs(collection(db, "vendas"));
            const docRef = snap.docs.find(d => d.id === idCompra);
            if (!docRef) return alert("Compra não encontrada.");
            const v = docRef.data();
            const faltaAtual = parseFloat(v.faltaReceber) > 0 ? parseFloat(v.faltaReceber) : parseFloat(v.valor || 0);
            const novoPago = (parseFloat(v.valorParcial) || 0) + valor;
            const novoFalta = Math.max(0, faltaAtual - valor);
            const novoStatus = novoFalta <= 0 ? "pago" : "parcial";
            await updateDoc(doc(db, "vendas", idCompra), {
              valorParcial: novoPago,
              faltaReceber: novoFalta,
              status: novoStatus,
              dataReceber: novoFalta > 0 && novaData ? novaData : (novoFalta > 0 ? v.dataReceber : null)
            });
            // atualizar localStorage/interface
            const s2 = await getDocs(collection(db, "vendas"));
            localStorage.setItem("vendas", JSON.stringify(s2.docs.map(d => ({ id: d.id, ...d.data() }))));
            alert("Pagamento parcial registrado.");
            div.remove();
            mostrarComprasDetalhadas(cleanTel(telefone));
          } catch (err) {
            console.error(err);
            alert("Erro ao registrar parcial.");
          }
        };
      }
    });
  } else {
    container.remove();
  }
};

window.reagendarCompraIndividual = async (idCompra, telefone) => {
  const novaData = prompt("Informe a nova data (AAAA-MM-DD):");
  if (!novaData) return;
  try {
    await updateDoc(doc(db, "vendas", idCompra), { dataReceber: novaData });
    const s2 = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(s2.docs.map(d => ({ id: d.id, ...d.data() }))));
    alert("Compra reagendada.");
    mostrarComprasDetalhadas(cleanTel(telefone));
  } catch (err) {
    console.error(err);
    alert("Erro ao reagendar compra individual.");
  }
};
