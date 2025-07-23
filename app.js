import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MSG_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.login = async () => {
  const nome = document.getElementById("nome").value.trim();
  if (!nome) return alert("Digite seu nome.");
  localStorage.setItem("usuario", nome);
  showDashboard();
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
window.marcarPagoGrupo = async (telefone, dataCompleta) => {
  const snap = await getDocs(collection(db, "vendas"));
  const docsParaAtualizar = snap.docs.filter(doc => {
    const v = doc.data();
    return v.telefone === telefone && v.dataReceber === dataCompleta && v.status !== "pago";
  });

  for (const docRef of docsParaAtualizar) {
    await updateDoc(doc(db, "vendas", docRef.id), {
      status: "pago",
      faltaReceber: 0,
      dataReceber: null
    });
  }

  // Atualiza localStorage com os dados novos
  const snapAtualizado = await getDocs(collection(db, "vendas"));
  const vendasAtualizadas = snapAtualizado.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  localStorage.setItem("vendas", JSON.stringify(vendasAtualizadas));

  alert("Status atualizado para 'pago'.");

  // Atualiza o visual do dia
  mostrarDia(dataCompleta);

  // Recalcula os valores no calendário
  const inputMes = document.getElementById("mesFiltro");
  if (inputMes && inputMes.value) {
    inputMes.dispatchEvent(new Event("change"));
  }
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
    const vendasFiltradas = JSON.parse(localStorage.getItem("vendas")).filter(v => v.status !== "pago" && v.dataReceber?.startsWith(mes));

    vendasFiltradas.forEach(v => {
      const dia = v.dataReceber.split("-")[2];
      if (!diasDoMes[dia]) diasDoMes[dia] = [];
      diasDoMes[dia].push(v);
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
  const vendasDoDia = todasVendas.filter(v => v.dataReceber === dataCompleta || (v.status === "pago" && v.dataReceber === null && v.data === dataCompleta));

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
    const total = vendas.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || parseFloat(v.valor) || 0), 0);
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
          <p><strong>Para pagar em:</strong> ${v.dataReceber ? formatarData(v.dataReceber) : "-"}</p>
          <p><strong>Produtos:</strong><br>${produtosFormatado}</p>
        </div>
      `;
    }).join("<hr>");

    return `
      <div class="card">
        <h3>${nome} - ${telefone}</h3>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Total:</strong> R$ ${total.toFixed(2)}</p>
        ${compras}
        <button onclick="marcarPagoGrupo('${telefone}', '${dataCompleta}')">Pago</button>
        <button onclick="cobrarWhats('${telefone}', '${dataCompleta}')">Cobrar no WhatsApp</button>
        <button onclick="reagendarGrupo('${telefone}', '${dataCompleta}')">Reagendar cobrança</button>
        <div id="reagendar-${telefone}"></div>
      </div>
    `;
  }).join("");

  document.getElementById("detalhesDia").innerHTML = `<h3>${formatarData(dataCompleta)}</h3>${cards}`;
};
window.cobrarWhats = (telefone, dataCompleta) => {
  const snap = JSON.parse(localStorage.getItem("vendas"));
  const grupo = snap.filter(v => v.telefone === telefone && v.dataReceber === dataCompleta && v.status !== "pago");

  if (!grupo.length) return alert("Nenhuma cobrança ativa encontrada.");

  const nome = grupo[0].cliente;
  const dataAgendada = formatarData(grupo[0].dataReceber);
  const datasCompras = grupo.map(v => formatarData(v.data)).join(" | ");
  const total = grupo.reduce((acc, v) => acc + (parseFloat(v.faltaReceber) || parseFloat(v.valor)), 0);

  const listaProdutos = grupo.flatMap(v => v.produtosVendidos || [])
    .map(p => `- ${p}`)
    .join("\n");

  const msg = `Olá ${nome}!, tudo bem?\n
Estou passando para lembrar que há um valor pendente conosco:\n
Data agendada para pagamento: ${dataAgendada}\n
Datas das compra: ${datasCompras}\n
Produtos e quantidades:\n${listaProdutos}\n
Valor total: R$ ${total.toFixed(2)}\n
Por favor realizar o pagamento conforme nosso combinado, qualquer dúvida estou à disposição!\n
— Ana Buck Doces`;

  const link = `https://wa.me/${telefone}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
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

  // Atualiza localStorage com dados atualizados
  const snapAtualizado = await getDocs(collection(db, "vendas"));
  const vendasAtualizadas = snapAtualizado.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  localStorage.setItem("vendas", JSON.stringify(vendasAtualizadas));

  alert("Data reagendada com sucesso!");
  mostrarDia(dataCompleta);

  // Atualiza calendário
  const inputMes = document.getElementById("mesFiltro");
  if (inputMes && inputMes.value) {
    inputMes.dispatchEvent(new Event("change"));
  }
};

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}-${mes}-${ano}`;
}
