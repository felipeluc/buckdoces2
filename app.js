// PARTE 1 - Inicialização Firebase e login --------------------------------------
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
  <h1>Buck Doces</h1>
  <div class="card">
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
  "João Buck": "Joao1234"
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
  "Coxinha de morango", "Camafeu", "Caixinha", "Mousse", "Lanche natural"
];

window.showCadastro = (usuario) => {
  const produtoInputs = produtosLista.map(p => `
    <div class="produto-item">
      <label>${p}</label>
      <input type="number" id="qtd-${p}" value="0" min="0" style="width: 60px;" />
    </div>
  `).join("");

  document.getElementById("conteudo").innerHTML = `
    <h2>Cadastro de Venda</h2>
    <input id="cliente" placeholder="Nome do cliente" />
    <input id="telefone" placeholder="Telefone (ex: 5599999999999)" />
    <input id="local" placeholder="Local da venda" />
    <input id="valor" placeholder="Valor (R$)" type="number" />
    <div><strong>Produtos vendidos:</strong><div class="produtos-container">${produtoInputs}</div></div>
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
// Parte 3 — Função para cadastrar a venda
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

  const produtosSelecionados = produtosLista.map(produto => {
    const qtd = parseInt(document.getElementById(`prod-${produto}`)?.value || 0);
    return qtd > 0 ? { nome: produto, quantidade: qtd } : null;
  }).filter(Boolean);

  const snap = await getDocs(collection(db, "vendas"));
  const duplicado = snap.docs.some(doc => {
    const d = doc.data();
    return d.usuario === usuario &&
           d.cliente === cliente &&
           d.telefone === telefone &&
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

// Parte 4 — Enviar comprovante via WhatsApp com produtos e status
window.enviarComprovante = () => {
  const numero = document.getElementById("telefone")?.value.trim();
  const valor = document.getElementById("valor")?.value.trim();
  const cliente = document.getElementById("cliente")?.value.trim();
  const status = document.getElementById("status")?.value;
  const dataReceber = document.getElementById("dataReceber")?.value;

  const produtosSelecionados = produtosLista.map(produto => {
    const qtd = parseInt(document.getElementById(`prod-${produto}`)?.value || 0);
    return qtd > 0 ? `${qtd}x ${produto}` : null;
  }).filter(Boolean);

  if (!numero || !valor || !cliente || produtosSelecionados.length === 0) {
    alert("Preencha o nome, telefone, valor e selecione produtos antes de enviar o comprovante.");
    return;
  }

  let statusTexto = "";
  if (status === "pago") {
    statusTexto = "✅ Pago";
  } else if (status === "nao") {
    statusTexto = `💰 Pagamento em aberto para ${dataReceber}`;
  } else if (status === "parcial") {
    statusTexto = `🟡 Pagamento parcial (restante até ${dataReceber})`;
  }

  const mensagem = `Olá ${cliente}! 🍬\n\nSegue o comprovante da sua compra na Ana Buck Doces:\n\n` +
                   `Produtos: \n${produtosSelecionados.join("\n")}\n\n` +
                   `Valor total: R$ ${valor}\nStatus: ${statusTexto}\n\nAgradecemos pela preferência! 😊`;

  const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");
};
window.showDashboard = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => doc.data());
  const hoje = new Date().toISOString().split("T")[0];
  const hojeVendas = vendas.filter(v => v.data === hoje);
  const totalHoje = hojeVendas.reduce((acc, v) => acc + v.valor, 0);
  const aReceber = vendas.filter(v => v.status !== "pago")
                         .reduce((acc, v) => acc + (v.faltaReceber || v.valor), 0);

  let html = `<h2>Dashboard</h2>
    <p>Vendas hoje: ${hojeVendas.length}</p>
    <p>Total vendido: R$ ${totalHoje.toFixed(2)}</p>
    <p>A receber: R$ ${aReceber.toFixed(2)}</p>`;

  document.getElementById("conteudo").innerHTML = html;
};

window.showCobranca = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const pendentes = vendas.filter(v => v.dataReceber);

  let html = `<h2>Cobrança</h2>
    <input type="month" id="mesFiltro" />
    <div id="calendario"></div>
    <div id="detalhesDia"></div>`;

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
      const totalDia = vendasDoDia.filter(v => v.status !== "pago")
                                   .reduce((acc, v) => acc + (v.faltaReceber || v.valor), 0);
      const valorHtml = totalDia > 0 ? `<div class="calendar-day-value">R$ ${totalDia.toFixed(2)}</div>` : "";
      return `
        <div class="calendar-day" onclick="mostrarDia('${mes}-${diaStr}')">
          <div>${diaStr}</div>
          ${valorHtml}
        </div>`;
    }).join("");

    document.getElementById("calendario").innerHTML = `<div class="calendar">${calendarioHtml}</div>`;
  });

  window.mostrarDia = (dataCompleta) => {
    const vendasDoDia = pendentes.filter(v => v.dataReceber === dataCompleta);
    if (!vendasDoDia.length) {
      document.getElementById("detalhesDia").innerHTML = "<p>Sem cobranças neste dia.</p>";
      return;
    }

    const agrupado = {};
    vendasDoDia.forEach(v => {
      if (!agrupado[v.telefone]) agrupado[v.telefone] = [];
      agrupado[v.telefone].push(v);
    });

    let html = `<h3>${dataCompleta}</h3>`;

    for (const tel in agrupado) {
      const grupo = agrupado[tel];
      const clienteNome = grupo[0].cliente;
      const totalGrupo = grupo.filter(v => v.status !== "pago")
                              .reduce((acc, v) => acc + (v.faltaReceber || v.valor), 0);
      const compras = grupo.map(v => `
        <li>
          ${v.produtosVendidos.map(p => `${p.quantidade || 1}x ${p.nome}`).join(", ")} —
          ${v.local} — R$ ${v.faltaReceber || v.valor} —
          Status: ${v.status} ${v.status !== "pago" ? `📅 ${v.dataReceber}` : "✅"}
        </li>
      `).join("");

      html += `
        <div class="card">
          <p><strong>${clienteNome}</strong> — Total: R$ ${totalGrupo.toFixed(2)}</p>
          <ul>${compras}</ul>
          <button onclick="cobrarWhats('${tel}', '${clienteNome}', ${totalGrupo.toFixed(2)})">Cobrar no WhatsApp</button>
          <button onclick="cobrarNovamente('${tel}', '${clienteNome}', ${totalGrupo.toFixed(2)})">Cobrar de novo</button>
          <button onclick="marcarPagoGrupo('${tel}', '${dataCompleta}')">Pago</button>
          <button onclick="abrirReagendamento('${tel}')">Reagendar cobrança</button>
          <div id="reagendar-${tel}"></div>
        </div>`;
    }

    document.getElementById("detalhesDia").innerHTML = html;
  };
};
window.cobrarWhats = (telefone, cliente, total) => {
  const mensagem = `Olá ${cliente}, tudo bem? 😊\n\nEstou passando para lembrar que há um valor pendente conosco:\n\nValor: R$ ${total.toFixed(2)}\n\nQualquer dúvida estou à disposição.\n\n— Ana Buck Doces 🍬`;
  const link = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");
};

window.cobrarNovamente = (telefone, cliente, total) => {
  const mensagem = `Oi ${cliente}! 😊\n\nMesmo que o pagamento já tenha sido feito, caso tenha sido agendado ou esteja em andamento, por favor, desconsidere esta mensagem.\n\nValor mencionado: R$ ${total.toFixed(2)}\n\nObrigada! 🍬`;
  const link = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");
};

window.marcarPagoGrupo = async (telefone, dataReceber) => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const grupo = vendas.filter(v => v.telefone === telefone && v.dataReceber === dataReceber);

  for (const venda of grupo) {
    const ref = doc(db, "vendas", venda.id);
    await updateDoc(ref, {
      status: "pago",
      dataReceber: null,
      faltaReceber: 0
    });
  }

  alert("Status do grupo atualizado para pago!");
  showCobranca();
};

window.marcarPagoParcialGrupo = async (telefone, dataReceber) => {
  const valorParcial = prompt("Digite o valor parcial recebido do grupo:");
  const restante = prompt("Digite o valor que ainda falta:");

  if (!valorParcial || !restante) {
    alert("Valores inválidos.");
    return;
  }

  const novaData = prompt("Nova data para cobrança do restante (AAAA-MM-DD):");
  if (!novaData) {
    alert("Data inválida.");
    return;
  }

  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const grupo = vendas.filter(v => v.telefone === telefone && v.dataReceber === dataReceber);

  for (const venda of grupo) {
    const ref = doc(db, "vendas", venda.id);
    await updateDoc(ref, {
      status: "parcial",
      valorParcial: parseFloat(valorParcial),
      faltaReceber: parseFloat(restante),
      dataReceber: novaData
    });
  }

  alert("Grupo marcado como pagamento parcial.");
  showCobranca();
};

window.abrirReagendamento = (telefone) => {
  document.getElementById(`reagendar-${telefone}`).innerHTML = `
    <input type="date" id="novaData-${telefone}" />
    <button onclick="salvarReagendamento('${telefone}')">Salvar nova data</button>
  `;
};

window.salvarReagendamento = async (telefone) => {
  const novaData = document.getElementById(`novaData-${telefone}`).value;
  if (!novaData) return alert("Selecione a nova data");

  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const grupo = vendas.filter(v => v.telefone === telefone);

  for (const venda of grupo) {
    const ref = doc(db, "vendas", venda.id);
    await updateDoc(ref, { dataReceber: novaData });
  }

  alert("Data reagendada com sucesso para o grupo.");
  showCobranca();
};
// Atualização visual dos cards após marcar como pago (sem sumir do card)
window.atualizarStatusVisual = (telefone, dataReceber) => {
  const statusEl = document.querySelector(`#status-${telefone}`);
  if (statusEl) {
    statusEl.innerHTML = `<span class="status pago">Pago</span>`;
  }

  // Atualizar o calendário para remover o valor do dia
  showCobranca();
};

// Estilos dinâmicos de status (chamado por mostrarDia)
function getStatusClass(status) {
  switch (status) {
    case "pago":
      return "pago";
    case "parcial":
      return "parcial";
    case "nao":
      return "nao-pago";
    default:
      return "";
  }
}

// Inicialização (caso queira aplicar lógica ao carregar tudo no futuro)
document.addEventListener("DOMContentLoaded", () => {
  // Futuras integrações podem entrar aqui
});
