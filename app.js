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

const senhas = {
  "Ana Buck": "Ana1234",
  "João Buck": "João1234"
};

window.login = () => {
  const usuario = document.getElementById("user").value;
  const senha = document.getElementById("senha").value;
  if (senhas[usuario] === senha) {
    showTabs(usuario);
  } else {
    alert("Senha incorreta");
  }
};

function showTabs(user) {
  document.getElementById("main").innerHTML = `
    <div class="card">
      <button onclick="showCadastro('${user}')">Cadastrar Venda</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
    </div>
    <div id="conteudo" class="card"></div>
  `;
}

const produtosLista = [
  "Cone", "Trufa", "Bolo de pote", "Pão de mel",
  "Escondidinho de uva", "Bombom de uva", "BomBom de morango",
  "Coxinha de morango", "Camafeu", "Caixinha", "Mousse", "Lanche natural",
  "Maça do amor", "Kit cesta", "Kit caneca", "Morango do amor"
];
window.showCadastro = (usuario) => {
  const produtoOptions = produtosLista
    .map((produto, index) => `
      <div style="display: flex; align-items: center; margin-bottom: 5px;">
        <label style="flex: 1;">${produto}</label>
        <button onclick="alterarQuantidade(${index}, -1)">-</button>
        <span id="quantidade-${index}" style="margin: 0 5px;">0</span>
        <button onclick="alterarQuantidade(${index}, 1)">+</button>
      </div>
    `).join("");

  document.getElementById("conteudo").innerHTML = `
    <h2>Cadastro de Venda</h2>
    <input id="cliente" placeholder="Nome do cliente" />
    <input id="telefone" placeholder="Telefone (ex: 5599999999999)" />
    <input id="local" placeholder="Local da venda" />
    <input id="valor" placeholder="Valor (R$)" type="number" />
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

window.alterarQuantidade = (index, delta) => {
  const span = document.getElementById(`quantidade-${index}`);
  let valor = parseInt(span.innerText);
  valor = Math.max(0, valor + delta);
  span.innerText = valor;
};

function obterProdutosSelecionados() {
  return produtosLista
    .map((produto, index) => {
      const quantidade = parseInt(document.getElementById(`quantidade-${index}`).innerText);
      return quantidade > 0 ? `${produto} (${quantidade})` : null;
    })
    .filter(Boolean);
}
window.cadastrar = async (usuario) => {
  const cliente = document.getElementById("cliente").value.trim();
  const telefone = document.getElementById("telefone").value.trim();
  const local = document.getElementById("local").value.trim();
  const valor = parseFloat(document.getElementById("valor").value);
  const status = document.getElementById("status").value;
  const forma = document.getElementById("forma")?.value || "";
  const dataReceber = document.getElementById("dataReceber")?.value || "";
  const valorParcial = parseFloat(document.getElementById("valorParcial")?.value || 0);
  const faltaReceber = parseFloat(document.getElementById("falta")?.value || 0);
  const data = new Date().toISOString().split("T")[0];
  const produtosSelecionados = obterProdutosSelecionados();

  if (!cliente || !telefone || !local || isNaN(valor) || produtosSelecionados.length === 0) {
    alert("Preencha todos os campos e selecione ao menos um produto.");
    return;
  }

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

  await addDoc(collection(db, "vendas"), {
    usuario, cliente, telefone, local, valor, status, forma,
    valorParcial: status === "parcial" ? valorParcial : null,
    faltaReceber: status === "parcial" ? faltaReceber : (status === "nao" ? valor : 0),
    dataReceber: status !== "pago" ? dataReceber : null,
    data,
    produtosVendidos: produtosSelecionados
  });

  alert("Venda salva!");
};
window.enviarComprovante = () => {
  const numero = document.getElementById("telefone")?.value.trim();
  const valor = document.getElementById("valor")?.value.trim();
  const cliente = document.getElementById("cliente")?.value.trim();
  const status = document.getElementById("status")?.value;
  const dataReceber = document.getElementById("dataReceber")?.value || "";
  const produtosSelecionados = obterProdutosSelecionados();

  if (!numero || !valor || !cliente || produtosSelecionados.length === 0) {
    alert("Preencha todos os campos antes de enviar o comprovante.");
    return;
  }

  const listaProdutos = produtosSelecionados.map(p => `- ${p}`).join("\n");

  const mensagem = `Olá ${cliente}!

Segue o comprovante da sua compra na Ana Buck Doces:

Produtos:
${listaProdutos}

Valor: R$ ${valor}
Status: ${status.toUpperCase()}${status !== "pago" ? `\nPagamento para: ${dataReceber}` : ""}

CHAVE PIX (CNPJ): 57.010.512/0001-56
Por favor, envie o comprovante após o pagamento. 😊

Agradecemos pela preferência!`;

  const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");
};
window.showDashboard = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => doc.data());

  const hoje = new Date().toISOString().split("T")[0];
  const hojeVendas = vendas.filter(v => v.data === hoje);
  const totalHoje = hojeVendas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);

  const aReceber = vendas
    .filter(v => v.status !== "pago")
    .reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

  let html = `
    <h2>Dashboard</h2>
    <p>Vendas hoje: ${hojeVendas.length}</p>
    <p>Total vendido hoje: R$ ${totalHoje.toFixed(2)}</p>
    <p>Valor a receber: R$ ${aReceber.toFixed(2)}</p>
  `;

  document.getElementById("conteudo").innerHTML = html;
};
window.showCobranca = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const pendentes = vendas.filter(v => v.status !== "pago" && v.dataReceber);

  localStorage.setItem("vendas", JSON.stringify(vendas));

  let html = `
    <h2>Cobrança</h2>
    <input type="month" id="mesFiltro" />
    <div id="calendario"></div>
    <div id="detalhesDia"></div>
  `;

  document.getElementById("conteudo").innerHTML = html;

  document.getElementById("mesFiltro").addEventListener("change", e => {
    const mes = e.target.value;
    if (!mes) return;

    const diasDoMes = {};
    pendentes.forEach(v => {
      if (v.dataReceber?.startsWith(mes)) {
        const dia = v.dataReceber.split("-")[2];
        if (!diasDoMes[dia]) diasDoMes[dia] = [];
        diasDoMes[dia].push(v);
      }
    });

    const calendarioHtml = Array.from({ length: 31 }, (_, i) => {
      const diaStr = String(i + 1).padStart(2, "0");
      const vendasDoDia = diasDoMes[diaStr] || [];

      const totalDia = vendasDoDia.reduce((acc, v) => {
        if (v.status === "parcial") {
          return acc + (parseFloat(v.faltaReceber) || 0);
        }
        return acc + (parseFloat(v.valor) || 0);
      }, 0);

      const valorHtml = totalDia > 0 ? `<div class="calendar-day-value">R$ ${totalDia.toFixed(2)}</div>` : "";
      return `
        <div class="calendar-day" onclick="mostrarDia('${mes}-${diaStr}')">
          <div>${diaStr}</div>
          ${valorHtml}
        </div>`;
    }).join("");

    document.getElementById("calendario").innerHTML = `<div class="calendar">${calendarioHtml}</div>`;
  });
};
window.mostrarDia = (dataCompleta) => {
  const snap = localStorage.getItem("vendas");
  const todasVendas = JSON.parse(snap);
  const vendasDoDia = todasVendas.filter(v => v.dataReceber === dataCompleta);

  if (!vendasDoDia.length) {
    document.getElementById("detalhesDia").innerHTML = "<p>Sem cobranças neste dia.</p>";
    return;
  }

  const grupos = {};
  vendasDoDia.forEach(v => {
    const tel = v.telefone || "sem-telefone";
    if (!grupos[tel]) grupos[tel] = [];
    grupos[tel].push(v);
  });

  const cards = Object.entries(grupos).map(([telefone, vendas]) => {
    const nome = vendas[0].cliente;

    const total = vendas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
    const totalPagoParcial = vendas.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
    const totalFalta = vendas.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || 0), 0);

    const status = vendas.every(v => v.status === "pago") ? "✅ Pago" : "🔔 Pendência";

    const compras = vendas.map(v => {
      const produtosFormatado = (v.produtosVendidos || []).map(p => `<div>${p}</div>`).join("");
      return `
        <div class="compra-info">
          <p><strong>Data:</strong> ${formatarData(v.data)}</p>
          <p><strong>Local:</strong> ${v.local}</p>
          <p><strong>Valor:</strong> R$ ${parseFloat(v.valor).toFixed(2)}</p>
          <p><strong>Status:</strong> ${v.status}</p>
          <p><strong>Forma de Pagamento:</strong> ${v.forma || "-"}</p>
          <p><strong>Para pagar em:</strong> ${formatarData(v.dataReceber) || "-"}</p>
          <p><strong>Produtos:</strong><br>${produtosFormatado}</p>
        </div>
      `;
    }).join("<hr>");

    return `
      <div class="card">
        <h3>${nome} - ${telefone}</h3>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Total da compra:</strong> R$ ${total.toFixed(2)}</p>
        <p><strong>Pago parcial:</strong> R$ ${totalPagoParcial.toFixed(2)}</p>
        <p><strong>Falta pagar:</strong> R$ ${totalFalta.toFixed(2)}</p>
        ${compras}
        <button onclick="marcarPagoGrupo('${telefone}', '${dataCompleta}')">Pago</button>
        <button onclick="marcarParcialGrupo('${telefone}', '${dataCompleta}')">Pago Parcial</button>
        <button onclick="cobrarWhats('${telefone}', '${dataCompleta}')">Cobrar no WhatsApp</button>
        <button onclick="reagendarGrupo('${telefone}', '${dataCompleta}')">Reagendar cobrança</button>
        <div id="reagendar-${telefone}"></div>
        <div id="parcial-${telefone}"></div>
      </div>
    `;
  }).join("");

  document.getElementById("detalhesDia").innerHTML = `<h3>${formatarData(dataCompleta)}</h3>${cards}`;
};
window.confirmarParcial = async (telefone, dataOriginal) => {
  const recebido = parseFloat(document.getElementById(`valorParcial-${telefone}`).value) || 0;
  const novaData = document.getElementById(`dataParcial-${telefone}`).value;

  if (!recebido || !novaData) {
    alert("Informe o valor recebido e a nova data");
    return;
  }

  const snap = await getDocs(collection(db, "vendas"));
  const todasVendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const grupoVendas = todasVendas.filter(v =>
    v.telefone === telefone &&
    v.dataReceber === dataOriginal &&
    v.status !== "pago"
  );

  if (grupoVendas.length === 0) {
    alert("Nenhuma venda encontrada para esse grupo.");
    return;
  }

  // Soma total do grupo atual
  const totalGrupo = grupoVendas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);
  const faltaReceber = totalGrupo - recebido;

  // Atualiza todas as vendas do grupo para nova data e status "parcial"
  for (let venda of grupoVendas) {
    const ref = doc(db, "vendas", venda.id);
    await updateDoc(ref, {
      status: "parcial",
      dataReceber: novaData,
      valorParcial: recebido,
      faltaReceber: faltaReceber
    });
  }

  alert("Recebimento parcial registrado!");
  showCobranca();
};
function formatarData(dataStr) {
  if (!dataStr) return "-";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}
window.marcarPagoGrupo = async (telefone, dataCompleta) => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.filter(doc => {
    const v = doc.data();
    return v.telefone === telefone && v.dataReceber === dataCompleta && v.status !== "pago";
  });

  for (const docRef of vendas) {
    await updateDoc(doc(db, "vendas", docRef.id), {
      status: "pago",
      faltaReceber: 0,
      valorParcial: null,
      dataReceber: null
    });
  }

  alert("Status atualizado para 'pago'.");
  mostrarDia(dataCompleta);
  showDashboard();
};
window.marcarParcialGrupo = (telefone, dataCompleta) => {
  const div = document.getElementById(`parcial-${telefone}`);
  div.innerHTML = `
    <input type="number" id="valorParcial-${telefone}" placeholder="Valor recebido agora" />
    <input type="date" id="dataParcial-${telefone}" />
    <button onclick="confirmarParcial('${telefone}', '${dataCompleta}')">Confirmar</button>
  `;
};
window.reagendarGrupo = (telefone, dataCompleta) => {
  const div = document.getElementById(`reagendar-${telefone}`);
  div.innerHTML = `
    <input type="date" id="novaData-${telefone}" />
    <button onclick="confirmarReagendar('${telefone}', '${dataCompleta}')">Confirmar</button>
  `;
};
window.confirmarReagendar = async (telefone, dataCompleta) => {
  const novaData = document.getElementById(`novaData-${telefone}`).value;
  if (!novaData) return alert("Selecione uma nova data.");

  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.filter(doc => {
    const v = doc.data();
    return v.telefone === telefone && v.dataReceber === dataCompleta && v.status !== "pago";
  });

  for (const docRef of vendas) {
    await updateDoc(doc(db, "vendas", docRef.id), {
      dataReceber: novaData
    });
  }

  alert("Data reagendada com sucesso!");
  mostrarDia(dataCompleta);
};
window.cobrarWhats = (telefone, dataCompleta) => {
  const snap = JSON.parse(localStorage.getItem("vendas"));
  const grupo = snap.filter(v => v.telefone === telefone && v.dataReceber === dataCompleta && v.status !== "pago");

  if (!grupo.length) return alert("Nenhuma cobrança ativa encontrada.");

  const nome = grupo[0].cliente;
  const dataAgendada = formatarData(grupo[0].dataReceber);
  const datasCompras = grupo.map(v => formatarData(v.data)).join(" | ");

  const totalCompra = grupo.reduce((acc, v) => acc + parseFloat(v.valor || 0), 0);
  const valorRecebido = grupo.reduce((acc, v) => acc + parseFloat(v.valorParcial || 0), 0);
  const valorFalta = grupo.reduce((acc, v) =>
    acc + (parseFloat(v.faltaReceber) > 0
      ? parseFloat(v.faltaReceber)
      : (v.status !== "pago" ? parseFloat(v.valor) : 0)), 0);

  const listaProdutos = grupo.flatMap(v => v.produtosVendidos || [])
    .map(p => `${p}`)
    .join("\n");

  const msg = `Olá ${nome}!, tudo bem?\n\n` +
              `Estou passando para lembrar que há um valor pendente conosco:\n\n` +
              `🗓 Data agendada para pagamento: ${dataAgendada}\n` +
              `📅 Datas das compras: ${datasCompras}\n\n` +
              `🍬 Produtos e quantidades:\n${listaProdutos}\n\n` +
              `💰 Total da compra: R$ ${totalCompra.toFixed(2)}\n` +
              `✅ Valor recebido: R$ ${valorRecebido.toFixed(2)}\n` +
              `🔔 Falta pagar: R$ ${valorFalta.toFixed(2)}\n\n` +
              `🔑 Chave PIX para pagamento:\nCNPJ 57.010.512/0001-56\n\n` +
              `📩 Por favor, envie o comprovante assim que realizar o pagamento.\n\n` +
              `— Ana Buck Doces`;

  const link = `https://wa.me/${telefone}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
};
function showDashboard() {
  const user = localStorage.getItem("usuarioLogado");
  if (!user) return showLogin();

  document.getElementById("root").innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <p><strong>Vendas totais:</strong> <span id="vendasTotais">-</span></p>
      <p><strong>Total a receber:</strong> <span id="totalReceber">-</span></p>
      <p><strong>Total recebido:</strong> <span id="totalRecebido">-</span></p>
    </div>
    <div style="text-align:center;">
      <button onclick="showCadastro()">Cadastrar Venda</button>
      <button onclick="showCobranca()">Cobranças</button>
    </div>
  `;

  atualizarDashboard();
}
async function atualizarDashboard() {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => doc.data());

  let total = 0;
  let recebido = 0;
  let aReceber = 0;

  for (const v of vendas) {
    const valor = parseFloat(v.valor || 0);
    const parcial = parseFloat(v.valorParcial || 0);
    const falta = parseFloat(v.faltaReceber || 0);

    total += valor;
    recebido += parcial;
    if (v.status !== "pago") {
      aReceber += falta > 0 ? falta : valor;
    }
  }

  document.getElementById("vendasTotais").innerText = `R$ ${total.toFixed(2)}`;
  document.getElementById("totalReceber").innerText = `R$ ${aReceber.toFixed(2)}`;
  document.getElementById("totalRecebido").innerText = `R$ ${recebido.toFixed(2)}`;
}
function showTabs() {
  const html = `
    <div style="text-align:center; margin-bottom: 20px;">
      <button onclick="showCadastro()">Cadastro</button>
      <button onclick="showDashboard()">Dashboard</button>
      <button onclick="showCobranca()">Cobrança</button>
    </div>
  `;
  return html;
}
function formatarData(data) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}
// Ao carregar a página
window.onload = () => {
  const user = localStorage.getItem("usuarioLogado");
  if (user) {
    showDashboard();
  } else {
    showLogin();
  }
};
