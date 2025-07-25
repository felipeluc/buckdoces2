import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Configuração do Firebase
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

// Função de login
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

  const mensagem = `Olá ${cliente}!\n\n` +
                   `Segue o comprovante da sua compra na Ana Buck Doces:\n\n` +
                   `Produtos:\n${listaProdutos}\n\n` +
                   `Valor: R$ ${valor}\n` +
                   `Status: ${status.toUpperCase()}${status !== "pago" ? `\nPagamento para: ${dataReceber}` : ""}\n\n` +
                   `PIX para pagamento:\nCHAVE CNPJ: 57.010.512/0001-56\n` +
                   `Por favor, envie o comprovante após o pagamento. 😊`;

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
    .reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || parseFloat(v.valor) || 0), 0);

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
      const totalDia = vendasDoDia.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || parseFloat(v.valor) || 0), 0);
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

    const total = vendas.reduce((acc, v) => {
      const falta = parseFloat(v.faltaReceber);
      const valor = parseFloat(v.valor);
      return acc + (falta > 0 ? falta : valor);
    }, 0);

    const totalPagoParcial = vendas.reduce((acc, v) => acc + (parseFloat(v.valorParcial) || 0), 0);
    const totalOriginal = vendas.reduce((acc, v) => acc + (parseFloat(v.valor) || 0), 0);

    const status = vendas.every(v => v.status === "pago") ? "✅ Pago" : "🔔 Pendência";

    const compras = vendas.map(v => {
      const produtosFormatado = (v.produtosVendidos || [])
        .map(p => `<div>${p}</div>`).join("");
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
        <p><strong>Total da compra:</strong> R$ ${totalOriginal.toFixed(2)}</p>
        <p><strong>Pago parcial:</strong> R$ ${totalPagoParcial.toFixed(2)}</p>
        <p><strong>Falta pagar:</strong> R$ ${total.toFixed(2)}</p>
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
  showDashboard(); // Atualiza o dashboard também
};

window.marcarParcialGrupo = (telefone, dataCompleta) => {
  const div = document.getElementById(`parcial-${telefone}`);
  div.innerHTML = `
    <input type="number" id="valorRecebido-${telefone}" placeholder="Valor recebido agora" />
    <input type="date" id="novaDataParcial-${telefone}" />
    <button onclick="confirmarParcial('${telefone}', '${dataCompleta}')">Confirmar</button>
  `;
};

window.confirmarParcial = async (telefone, dataCompleta) => {
  const recebidoAgora = parseFloat(document.getElementById(`valorRecebido-${telefone}`).value);
  const novaData = document.getElementById(`novaDataParcial-${telefone}`).value;

  if (isNaN(recebidoAgora) || recebidoAgora <= 0 || !novaData) {
    alert("Preencha os campos corretamente.");
    return;
  }

  const snap = await getDocs(collection(db, "vendas"));
  const docs = snap.docs.filter(doc => {
    const v = doc.data();
    return v.telefone === telefone && v.dataReceber === dataCompleta && v.status !== "pago";
  });

  // total que falta somando todos os documentos
  const totalFaltando = docs.reduce((acc, doc) => {
    const v = doc.data();
    return acc + (parseFloat(v.faltaReceber) > 0
      ? parseFloat(v.faltaReceber)
      : parseFloat(v.valor));
  }, 0);

  if (recebidoAgora > totalFaltando) {
    alert("Valor recebido é maior que o total em aberto.");
    return;
  }

  let restante = totalFaltando - recebidoAgora;

  for (const docRef of docs) {
    const docId = docRef.id;
    const v = docRef.data();
    const atualFalta = parseFloat(v.faltaReceber) > 0 ? parseFloat(v.faltaReceber) : parseFloat(v.valor);

    const novoFalta = Math.min(restante, atualFalta);
    const novoRecebido = atualFalta - novoFalta;

    restante -= novoRecebido;

    await updateDoc(doc(db, "vendas", docId), {
      status: "parcial",
      valorParcial: (parseFloat(v.valorParcial) || 0) + novoRecebido,
      faltaReceber: novoFalta,
      dataReceber: novoFalta > 0 ? novaData : null
    });
  }

  alert("Pagamento parcial atualizado com sucesso!");
  mostrarDia(dataCompleta);
  showDashboard();
};
