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

    // Lista de clientes únicos por telefone (unifica por telefone, mostra só nome)
    const clientes = pendentes
      .filter(v => v.local === localSelecionado)
      .reduce((acc, v) => {
        const tel = (v.telefone || "").replace(/\D/g, "");
        if (!acc.some(c => c.telefone === tel)) {
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

  // Filtro MÊS (adaptado para cliente)
  document.getElementById("mesFiltro").addEventListener("change", e => {
    const mes = e.target.value; // 'YYYY-MM'
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

    // Monta o calendário com resumo das compras do dia (produtos, total, pago parcial, falta)
    const calendarioHtml = Array.from({ length: 31 }, (_, i) => {
      const diaStr = String(i + 1).padStart(2, "0");
      const vendasDoDia = diasDoMes[diaStr] || [];

      if (!vendasDoDia.length) {
        return `<div class="calendar-day" style="opacity:0.3;">${diaStr}</div>`;
      }

      // Resumo dos produtos (todos em lista única, sem repetições)
      const produtosSet = new Set();
      vendasDoDia.forEach(v => {
        (v.produtosVendidos || []).forEach(p => produtosSet.add(p));
      });
      const produtosResumo = Array.from(produtosSet).join(", ");

      // Totais
      const totalDia = vendasDoDia.reduce((acc, v) => {
        const falta = parseFloat(v.faltaReceber) || 0;
        return acc + (falta > 0 ? falta : parseFloat(v.valor) || 0);
      }, 0);
      const totalPagoParcial = vendasDoDia.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
      const totalFalta = totalDia - totalPagoParcial;

      const valorHtml = `
        <div class="calendar-day-value">
          <div><strong>Produtos:</strong> ${produtosResumo}</div>
          <div><strong>Total:</strong> ${totalDia.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          <div><strong>Pago parcial:</strong> ${totalPagoParcial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
          <div><strong>Falta pagar:</strong> ${totalFalta.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
        </div>
      `;

      return `
        <div class="calendar-day" onclick="mostrarDia('${mes}-${diaStr}')">
          <div><strong>${diaStr}</strong></div>
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
    (!telefoneSelecionado || (v.telefone || "").replace(/\D/g, "") === telefoneSelecionado)
  );

  if (!vendasDoDia.length) {
    document.getElementById("detalhesDia").innerHTML = "<p>Sem cobranças neste dia.</p>";
    return;
  }

  // Agrupa por telefone (cliente)
  const grupos = {};
  vendasDoDia.forEach(v => {
    const tel = (v.telefone || "").replace(/\D/g, "") || "sem-telefone";
    if (!grupos[tel]) grupos[tel] = [];
    grupos[tel].push(v);
  });

  const cards = Object.entries(grupos).map(([telefone, vendas]) => {
    const nome = vendas[0].cliente || "Sem nome";

    const totalOriginal = vendas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
    const totalPagoParcial = vendas.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
    const faltaPagar = vendas.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

    const status = vendas.every(v => v.status === "pago") ? "✅ Pago" : "🔔 Pendência";

    const comprasResumoHtml = `
      <p><strong>Total da compra:</strong> ${totalOriginal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <p><strong>Pago parcial:</strong> ${totalPagoParcial.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
      <p><strong>Falta pagar:</strong> ${faltaPagar.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
    `;

    return `
      <div class="card">
        <h3>${nome} - ${telefone}</h3>
        <p><strong>Status:</strong> ${status}</p>
        ${comprasResumoHtml}
        <button onclick="mostrarComprasDetalhadas('${telefone}')">Ver Compras</button>
        <button onclick="marcarPagoGrupo('${telefone}', '${dataCompleta}')">Pago</button>
        <button onclick="marcarParcialGrupo('${telefone}', '${dataCompleta}')">Pago Parcial</button>
        <button onclick="cobrarWhats('${telefone}', '${dataCompleta}')">Cobrar no WhatsApp</button>
        <button onclick="reagendarGrupo('${telefone}', '${dataCompleta}')">Reagendar cobrança</button>
        <div id="reagendar-${telefone}"></div>
        <div id="parcial-${telefone}"></div>
        <div id="compras-detalhadas-${telefone}" style="margin-top:10px; display:none;"></div>
      </div>
    `;
  }).join("");

  document.getElementById("detalhesDia").innerHTML = `<h3>${formatarData(dataCompleta)}</h3>${cards}`;
};

// === MOSTRAR COMPRAS DETALHADAS DO CLIENTE ===
window.mostrarComprasDetalhadas = (telefone) => {
  const snap = JSON.parse(localStorage.getItem("vendas") || "[]");
  const comprasCliente = snap.filter(v => (v.telefone || "").replace(/\D/g, "") === telefone);

  if (!comprasCliente.length) {
    alert("Nenhuma compra encontrada para este cliente.");
    return;
  }

  const container = document.getElementById(`compras-detalhadas-${telefone}`);
  // Se já está visível, oculta; se não, mostra e preenche
  if (container.style.display === "block") {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  // === Monta cards de compras individuais (completa) ===
  const cardsCompras = comprasCliente.map(v => {
    const produtosFormatado = (v.produtosVendidos || []).map(p => `<div>${p}</div>`).join("");
    return `
      <div class="compra-info" style="border:1px solid #ccc; padding:8px; margin-bottom:8px; border-radius:6px;">
        <p><strong>Data:</strong> ${formatarData(v.data)}</p>
        <p><strong>Local:</strong> ${v.local}</p>
        <p><strong>Valor:</strong> ${parseFloat(v.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <p><strong>Status:</strong> ${v.status}</p>
        <p><strong>Forma de Pagamento:</strong> ${v.forma || "-"}</p>
        <p><strong>Para pagar em:</strong> ${formatarData(v.dataReceber) || "-"}</p>
        <p><strong>Produtos:</strong><br>${produtosFormatado}</p>
        <button onclick="marcarPagoCompra('${v.id}', '${telefone}')">Pago</button>
        <button onclick="cobrarWhatsCompra('${v.id}', '${telefone}')">Cobrar no WhatsApp</button>
      </div>
    `;
  }).join("");

  // Totais detalhados da compra
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
    <button onclick="pagarTudoCliente('${telefone}')">Pagar tudo</button>
    <button onclick="mostrarFormParcialTotal('${telefone}')">Pago parcial</button>
    <div id="parcial-total-${telefone}"></div>
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

    const nome = v.cliente;
    const dataAgendada = formatarData(v.dataReceber);
    const dataCompra = formatarData(v.data);
    const valorTotal = parseFloat(v.valor || 0);
    const valorParcial = parseFloat(v.valorParcial || 0);
    const falta = parseFloat(v.faltaReceber || valorTotal - valorParcial);
    const listaProdutos = (v.produtosVendidos || []).map(p => `${p}`).join("\n");

    let numeroWhats = telefone.replace(/\D/g, "");
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

    // Atualiza localStorage e interface
    const snapAtual = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));

    alert("Todas as compras do cliente marcadas como pagas.");
    mostrarComprasDetalhadas(telefone);
    const mesFiltro = document.getElementById("mesFiltro")?.value;
    if (mesFiltro) mostrarDia(mesFiltro + "-01");
  } catch (err) {
    console.error("Erro em pagarTudoCliente:", err);
    alert("Erro ao pagar tudo. Veja console.");
  }
};

// === MOSTRAR FORM PARA PAGAMENTO PARCIAL TOTAL ===
window.mostrarFormParcialTotal = (telefone) => {
  const container = document.getElementById(`parcial-total-${telefone}`);
  if (container.style.display === "block") {
    container.style.display = "none";
    container.innerHTML = "";
    return;
  }

  container.style.display = "block";
  container.innerHTML = `
    <label>Valor pago parcial:</label>
    <input type="number" step="0.01" id="valorParcialTotal-${telefone}" placeholder="0,00" />
    <button onclick="marcarParcialTotal('${telefone}')">Salvar</button>
  `;
};

// === MARCAR PAGAMENTO PARCIAL TOTAL ===
window.marcarParcialTotal = async (telefone) => {
  const valorStr = document.getElementById(`valorParcialTotal-${telefone}`).value;
  const valorParcial = parseFloat(valorStr);
  if (isNaN(valorParcial) || valorParcial <= 0) {
    alert("Informe um valor parcial válido.");
    return;
  }

  try {
    const snap = await getDocs(collection(db, "vendas"));
    const comprasPendentes = snap.docs.filter(d => {
      const v = d.data();
      return (v.telefone || "").replace(/\D/g, "") === telefone && v.status !== "pago";
    });

    if (!comprasPendentes.length) {
      alert("Nenhuma compra pendente para pagamento parcial.");
      return;
    }

    // Soma do total das compras
    const totalGeral = comprasPendentes.reduce((acc, d) => acc + (parseFloat(d.data().valor) || 0), 0);

    if (valorParcial > totalGeral) {
      alert("O valor parcial não pode ser maior que o total das compras pendentes.");
      return;
    }

    // Distribui proporcionalmente valorParcial entre compras
    for (const docRef of comprasPendentes) {
      const v = docRef.data();
      const valorCompra = parseFloat(v.valor) || 0;
      const proporcao = valorCompra / totalGeral;
      const valorPagoParcial = valorParcial * proporcao;
      const novaFalta = valorCompra - valorPagoParcial;

      await updateDoc(doc(db, "vendas", docRef.id), {
        status: novaFalta <= 0 ? "pago" : "pendente",
        valorParcial: valorPagoParcial,
        faltaReceber: novaFalta > 0 ? novaFalta : 0
      });
    }

    // Atualiza localStorage e interface
    const snapAtual = await getDocs(collection(db, "vendas"));
    localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));

    alert("Pagamento parcial salvo.");
    mostrarComprasDetalhadas(telefone);
    const mesFiltro = document.getElementById("mesFiltro")?.value;
    if (mesFiltro) mostrarDia(mesFiltro + "-01");
  } catch (err) {
    console.error("Erro em marcarParcialTotal:", err);
    alert("Erro ao salvar pagamento parcial. Veja console.");
  }
};

// === COBRAR TUDO NO WHATSAPP (EXTRATO DETALHADO) ===
window.cobrarWhats = async (telefone, dataCompleta) => {
  try {
    const snap = JSON.parse(localStorage.getItem("vendas") || "[]");
    const comprasCliente = snap.filter(v => (v.telefone || "").replace(/\D/g, "") === telefone && v.status !== "pago");

    if (!comprasCliente.length) {
      alert("Nenhuma compra pendente para cobrança.");
      return;
    }

    const nome = comprasCliente[0]?.cliente || "Cliente";
    let numeroWhats = telefone.replace(/\D/g, "");
    if (!numeroWhats.startsWith("55")) numeroWhats = "55" + numeroWhats;

    // Monta mensagem estilo extrato detalhado
    let msg = `Olá ${nome}, tudo bem?\n\nSegue o extrato das suas compras pendentes:\n\n`;

    comprasCliente.forEach((v, idx) => {
      const dataCompra = formatarData(v.data);
      const produtos = (v.produtosVendidos || []).join(", ");
      const valorTotal = parseFloat(v.valor || 0).toFixed(2);
      const valorPagoParcial = parseFloat(v.valorParcial || 0).toFixed(2);
      const falta = parseFloat(v.faltaReceber || (v.valor - v.valorParcial)).toFixed(2);

      msg += `${idx + 1}. Data: ${dataCompra} | Produtos: ${produtos}\n` +
        `   Valor: R$ ${valorTotal} | Pago: R$ ${valorPagoParcial} | Falta: R$ ${falta}\n\n`;
    });

    msg += `💳 Chave PIX:\nCNPJ 57.010.512/0001-56\n\n` +
           `📩 Por favor, envie o comprovante.\n\n` +
           `— Ana Buck Doces`;

    const link = `https://wa.me/${numeroWhats}?text=${encodeURIComponent(msg)}`;
    window.open(link, "_blank");
  } catch (err) {
    console.error("Erro em cobrarWhats:", err);
    alert("Erro ao gerar cobrança. Veja console.");
  }
};

// === FORM PARA REAGENDAR COBRANÇA DO GRUPO ===
window.reagendarGrupo = (telefone, dataCompleta) => {
  const container = document.getElementById(`reagendar-${telefone}`);
  container.innerHTML = `
    <input type="date" id="novaDataReagendar-${telefone}" />
    <button onclick="confirmarReagendarGrupo('${telefone}', '${dataCompleta}')">Confirmar</button>
    <button onclick="cancelarReagendarGrupo('${telefone}')">Cancelar</button>
  `;
};

// === CANCELAR FORM DE REAGENDAR ===
window.cancelarReagendarGrupo = (telefone) => {
  const container = document.getElementById(`reagendar-${telefone}`);
  container.innerHTML = "";
};

// === CONFIRMAR REAGENDAMENTO GRUPO ===
window.confirmarReagendarGrupo = async (telefone, dataCompleta) => {
  const novaData = document.getElementById(`novaDataReagendar-${telefone}`).value;
  if (!novaData) return alert("Selecione uma data.");

  const snap = await getDocs(collection(db, "vendas"));
  const vendasParaAtualizar = snap.docs.filter(docRef => {
    const v = docRef.data();
    return (v.telefone || "").replace(/\D/g, "") === telefone && v.dataReceber === dataCompleta;
  });

  for (const docRef of vendasParaAtualizar) {
    await updateDoc(doc(db, "vendas", docRef.id), { dataReceber: novaData });
  }

  // Atualiza localStorage
  const snapAtual = await getDocs(collection(db, "vendas"));
  localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));

  alert("Reagendamento concluído.");
  cancelarReagendarGrupo(telefone);
  const mesFiltro = document.getElementById("mesFiltro")?.value;
  if (mesFiltro) mostrarDia(mesFiltro + "-01");
};

// === FUNÇÕES PARA MARCAR PAGO E PARCIAL EM GRUPO ===
window.marcarPagoGrupo = async (telefone, dataCompleta) => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendasParaAtualizar = snap.docs.filter(docRef => {
    const v = docRef.data();
    return (v.telefone || "").replace(/\D/g, "") === telefone && v.dataReceber === dataCompleta && v.status !== "pago";
  });

  for (const docRef of vendasParaAtualizar) {
    const v = docRef.data();
    await updateDoc(doc(db, "vendas", docRef.id), {
      status: "pago",
      faltaReceber: 0,
      valorParcial: parseFloat(v.valor) || 0,
      dataReceber: null
    });
  }

  // Atualiza localStorage e interface
  const snapAtual = await getDocs(collection(db, "vendas"));
  localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));

  alert("Grupo marcado como pago.");
  mostrarDia(dataCompleta);
};

window.marcarParcialGrupo = (telefone, dataCompleta) => {
  const container = document.getElementById(`parcial-${telefone}`);
  container.innerHTML = `
    <input type="number" step="0.01" id="valorParcial-${telefone}" placeholder="Valor pago parcial" />
    <button onclick="confirmarParcialGrupo('${telefone}', '${dataCompleta}')">Confirmar</button>
    <button onclick="cancelarParcialGrupo('${telefone}')">Cancelar</button>
  `;
};

window.cancelarParcialGrupo = (telefone) => {
  const container = document.getElementById(`parcial-${telefone}`);
  container.innerHTML = "";
};

window.confirmarParcialGrupo = async (telefone, dataCompleta) => {
  const valorStr = document.getElementById(`valorParcial-${telefone}`).value;
  const valorParcial = parseFloat(valorStr);
  if (isNaN(valorParcial) || valorParcial <= 0) {
    alert("Informe um valor parcial válido.");
    return;
  }

  const snap = await getDocs(collection(db, "vendas"));
  const vendasParaAtualizar = snap.docs.filter(docRef => {
    const v = docRef.data();
    return (v.telefone || "").replace(/\D/g, "") === telefone && v.dataReceber === dataCompleta && v.status !== "pago";
  });

  const totalDia = vendasParaAtualizar.reduce((acc, docRef) => acc + (parseFloat(docRef.data().valor) || 0), 0);
  if (valorParcial > totalDia) {
    alert("O valor parcial não pode ser maior que o total do dia.");
    return;
  }

  for (const docRef of vendasParaAtualizar) {
    const v = docRef.data();
    const proporcao = (parseFloat(v.valor) || 0) / totalDia;
    const valorPago = valorParcial * proporcao;
    const novaFalta = (parseFloat(v.valor) || 0) - valorPago;

    await updateDoc(doc(db, "vendas", docRef.id), {
      status: novaFalta <= 0 ? "pago" : "pendente",
      valorParcial: valorPago,
      faltaReceber: novaFalta > 0 ? novaFalta : 0
    });
  }

  // Atualiza localStorage e interface
  const snapAtual = await getDocs(collection(db, "vendas"));
  localStorage.setItem("vendas", JSON.stringify(snapAtual.docs.map(d => ({ id: d.id, ...d.data() }))));

  alert("Pagamento parcial do grupo salvo.");
  cancelarParcialGrupo(telefone);
  mostrarDia(dataCompleta);
};

// === FORMATA DATA YYYY-MM-DD para DD/MM/YYYY ===
function formatarData(data) {
  if (!data) return "";
  const partes = data.split("-");
  if (partes.length < 3) return data;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
