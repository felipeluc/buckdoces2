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

// ====================== COBRANÇA ======================
async function showCobranca() {
    root.innerHTML = `
        <div class="tela">
            <h2>Cobrança</h2>
            <div>
                <select id="filtroLocal">
                    <option value="">Selecione o local</option>
                </select>
                <select id="filtroCliente" disabled>
                    <option value="">Selecione o cliente</option>
                </select>
                <select id="filtroMes" disabled>
                    <option value="">Selecione o mês</option>
                </select>
            </div>
            <div id="calendarioCobranca"></div>
            <div id="detalhesDia"></div>
        </div>
    `;

    const snap = await getDocs(collection(db, "vendas"));
    const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const pendentes = vendas.filter(v => v.status !== "pago" && v.dataReceber);
    const locais = [...new Set(pendentes.map(v => v.local))];
    const selLocal = document.getElementById("filtroLocal");
    locais.forEach(l => {
        selLocal.innerHTML += `<option value="${l}">${l}</option>`;
    });

    selLocal.addEventListener("change", () => {
        const local = selLocal.value;
        const clientes = [...new Set(pendentes.filter(v => v.local === local).map(v => v.cliente))];
        const selCliente = document.getElementById("filtroCliente");
        selCliente.innerHTML = `<option value="">Selecione o cliente</option>`;
        clientes.forEach(c => {
            selCliente.innerHTML += `<option value="${c}">${c}</option>`;
        });
        selCliente.disabled = false;
    });

    document.getElementById("filtroCliente").addEventListener("change", () => {
        const local = selLocal.value;
        const cliente = document.getElementById("filtroCliente").value;
        const meses = [...new Set(pendentes.filter(v => v.local === local && v.cliente === cliente).map(v => v.dataReceber.slice(0, 7)))];
        const selMes = document.getElementById("filtroMes");
        selMes.innerHTML = `<option value="">Selecione o mês</option>`;
        meses.forEach(m => {
            selMes.innerHTML += `<option value="${m}">${m}</option>`;
        });
        selMes.disabled = false;
    });

    document.getElementById("filtroMes").addEventListener("change", () => {
        const local = selLocal.value;
        const cliente = document.getElementById("filtroCliente").value;
        const mes = document.getElementById("filtroMes").value;
        const vendasMes = pendentes.filter(v => v.local === local && v.cliente === cliente && v.dataReceber.startsWith(mes));

        let dias = {};
        vendasMes.forEach(v => {
            if (!dias[v.dataReceber]) dias[v.dataReceber] = 0;
            dias[v.dataReceber] += v.total;
        });

        let html = `<div class="calendario">`;
        for (let dia in dias) {
            html += `<div class="dia" onclick="mostrarDia('${local}', '${cliente}', '${dia}')">${formatarData(dia)}<br>R$ ${dias[dia].toFixed(2)}</div>`;
        }
        html += `</div>`;
        document.getElementById("calendarioCobranca").innerHTML = html;
    });
}

async function mostrarDia(local, cliente, dia) {
    const snap = await getDocs(collection(db, "vendas"));
    const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const vendasDia = vendas.filter(v => v.local === local && v.cliente === cliente && v.dataReceber === dia && v.status !== "pago");

    let grupos = {};
    vendasDia.forEach(v => {
        if (!grupos[v.telefone]) grupos[v.telefone] = [];
        grupos[v.telefone].push(v);
    });

    let html = "";
    for (let tel in grupos) {
        const lista = grupos[tel];
        const totalOriginal = lista.reduce((sum, v) => sum + v.total, 0);
        const pagoParcial = lista.reduce((sum, v) => sum + (v.pagoParcial || 0), 0);
        const faltaPagar = totalOriginal - pagoParcial;

        html += `
            <div class="card-cobranca">
                <h3>${lista[0].cliente} (${lista[0].local})</h3>
                <p>Telefone: ${tel}</p>
                <p>Total Original: R$ ${totalOriginal.toFixed(2)}</p>
                <p>Pago Parcial: R$ ${pagoParcial.toFixed(2)}</p>
                <p>Falta Pagar: R$ ${faltaPagar.toFixed(2)}</p>
                <div class="botoes-cobranca">
                    <button onclick="mostrarComprasDetalhadas('${tel}', '${dia}')">Ver Compras</button>
                    <button onclick="marcarPagoGrupo('${tel}', '${dia}')">Pago</button>
                    <button onclick="marcarParcialGrupo('${tel}', '${dia}')">Pago Parcial</button>
                    <button onclick="cobrarWhats('${tel}', '${dia}')">Cobrar no WhatsApp</button>
                    <button onclick="reagendarGrupo('${tel}', '${dia}')">Reagendar cobrança</button>
                </div>
                <div id="compras-${tel}-${dia}" class="detalhes-compras" style="display:none;"></div>
            </div>
        `;
    }

    document.getElementById("detalhesDia").innerHTML = html;
}

function formatarData(data) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}-${mes}-${ano}`;
}

// =============== FUNÇÕES NOVAS PARA BOTÕES ===============
async function mostrarComprasDetalhadas(tel, dia) {
    const snap = await getDocs(collection(db, "vendas"));
    const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lista = vendas.filter(v => v.telefone === tel && v.dataReceber === dia && v.status !== "pago");

    let html = "<ul>";
    lista.forEach(v => {
        html += `<li>${v.produto} - R$ ${v.total.toFixed(2)} (${v.status})</li>`;
    });
    html += "</ul>";

    const div = document.getElementById(`compras-${tel}-${dia}`);
    div.innerHTML = html;
    div.style.display = div.style.display === "none" ? "block" : "none";
}

async function marcarPagoGrupo(tel, dia) {
    const snap = await getDocs(collection(db, "vendas"));
    const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(v => v.telefone === tel && v.dataReceber === dia && v.status !== "pago");

    for (let v of lista) {
        await updateDoc(doc(db, "vendas", v.id), { status: "pago" });
    }
    alert("Cobrança marcada como paga!");
    mostrarDia(lista[0].local, lista[0].cliente, dia);
}

async function marcarParcialGrupo(tel, dia) {
    const valor = parseFloat(prompt("Digite o valor pago:"));
    if (isNaN(valor) || valor <= 0) return;

    const snap = await getDocs(collection(db, "vendas"));
    const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(v => v.telefone === tel && v.dataReceber === dia && v.status !== "pago");

    for (let v of lista) {
        const pagoAtual = v.pagoParcial || 0;
        await updateDoc(doc(db, "vendas", v.id), { pagoParcial: pagoAtual + valor });
    }
    alert("Pagamento parcial registrado!");
    mostrarDia(lista[0].local, lista[0].cliente, dia);
}

async function cobrarWhats(tel, dia) {
    const snap = await getDocs(collection(db, "vendas"));
    const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(v => v.telefone === tel && v.dataReceber === dia && v.status !== "pago");

    const total = lista.reduce((sum, v) => sum + v.total, 0);
    const cliente = lista[0].cliente;
    const msg = `Olá ${cliente}, lembrando da sua cobrança no valor total de R$ ${total.toFixed(2)} para ${formatarData(dia)}.`;
    window.open(`https://wa.me/${tel.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, "_blank");
}

async function reagendarGrupo(tel, dia) {
    const novaData = prompt("Digite a nova data (AAAA-MM-DD):");
    if (!novaData) return;

    const snap = await getDocs(collection(db, "vendas"));
    const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(v => v.telefone === tel && v.dataReceber === dia && v.status !== "pago");

    for (let v of lista) {
        await updateDoc(doc(db, "vendas", v.id), { dataReceber: novaData });
    }
    alert("Cobrança reagendada!");
    mostrarDia(lista[0].local, lista[0].cliente, novaData);
}

// deixar funções acessíveis no escopo global
window.mostrarDia = mostrarDia;
window.mostrarComprasDetalhadas = mostrarComprasDetalhadas;
window.marcarPagoGrupo = marcarPagoGrupo;
window.marcarParcialGrupo = marcarParcialGrupo;
window.cobrarWhats = cobrarWhats;
window.reagendarGrupo = reagendarGrupo;
