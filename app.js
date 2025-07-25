// Parte 1
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFImw6Px0VKLiSVba8L-9PdjLPIU_HmSM",
  authDomain: "financeiro-409db.firebaseapp.com",
  projectId: "financeiro-409db",
  storageBucket: "financeiro-409db.appspot.com",
  messagingSenderId: "524594753881",
  appId: "1:524594753881:web:7a709f1313ad3e2dfdc5e3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const root = document.getElementById("root");

function setRootHTML(html) {
  root.innerHTML = html;
}

// Continuação nas próximas partes...
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

PIX para pagamento:
CHAVE CNPJ: 57.010.512/0001-56
Por favor, envie o comprovante.`;

  const link = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  window.open(link, "_blank");
};
window.showDashboard = async (usuario) => {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <p><strong>Total de Vendas:</strong> <span id="total-vendas">R$ 0,00</span></p>
      <p><strong>Total a Receber:</strong> <span id="total-receber">R$ 0,00</span></p>
      <button onclick="showCobranca('${usuario}')">Ver Cobranças</button>
    </div>
  `;

  const snap = await getDocs(collection(db, "vendas"));
  let total = 0;
  let aReceber = 0;

  snap.docs.forEach(doc => {
    const d = doc.data();
    if (d.usuario === usuario) {
      total += Number(d.valor || 0);
      if (d.status === "nao") {
        aReceber += Number(d.valor);
      } else if (d.status === "parcial") {
        aReceber += Number(d.faltaReceber || 0);
      }
    }
  });

  document.getElementById("total-vendas").textContent = `R$ ${total.toFixed(2)}`;
  document.getElementById("total-receber").textContent = `R$ ${aReceber.toFixed(2)}`;
};

window.showCobranca = async (usuario) => {
  const root = document.getElementById("root");
  root.innerHTML = `<div class="card"><h2>Cobranças</h2><input type="month" id="filtroMes" onchange="filtrarCobrancas('${usuario}')"></div><div id="calendario"></div>`;

  const hoje = new Date();
  const mesAtual = hoje.toISOString().slice(0, 7);
  document.getElementById("filtroMes").value = mesAtual;

  filtrarCobrancas(usuario);
};

window.filtrarCobrancas = async (usuario) => {
  const mesSelecionado = document.getElementById("filtroMes").value;
  const snap = await getDocs(collection(db, "vendas"));
  const dados = {};

  snap.docs.forEach(doc => {
    const d = doc.data();
    if (d.usuario === usuario && d.status !== "pago" && d.dataReceber?.startsWith(mesSelecionado)) {
      if (!dados[d.dataReceber]) dados[d.dataReceber] = [];
      dados[d.dataReceber].push({ ...d, id: doc.id });
    }
  });

  const diasMes = new Date(mesSelecionado.split("-")[0], mesSelecionado.split("-")[1], 0).getDate();
  let html = `<div class="calendar">`;
  for (let i = 1; i <= diasMes; i++) {
    const dia = i.toString().padStart(2, "0");
    const data = `${mesSelecionado}-${dia}`;
    const vendas = dados[data] || [];
    let totalDia = vendas.reduce((soma, v) => soma + (v.status === "parcial" ? Number(v.faltaReceber || 0) : Number(v.valor || 0)), 0);

    html += `
      <div class="calendar-day" onclick="abrirDia('${data}', '${usuario}')">
        ${dia}
        ${totalDia > 0 ? `<div class="calendar-day-value">R$ ${totalDia.toFixed(2)}</div>` : ""}
      </div>
    `;
  }
  html += `</div>`;
  document.getElementById("calendario").innerHTML = html;
};
window.abrirDia = async (dataSelecionada, usuario) => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendasDia = snap.docs
    .filter(doc => {
      const d = doc.data();
      return d.usuario === usuario && d.dataReceber === dataSelecionada && d.status !== "pago";
    })
    .map(doc => ({ ...doc.data(), id: doc.id }));

  if (vendasDia.length === 0) {
    alert("Nenhuma cobrança para esse dia.");
    return;
  }

  const root = document.getElementById("root");
  let html = `<div class="card"><h3>${dataSelecionada}</h3>`;

  let total = 0, pagoParcial = 0, falta = 0;
  vendasDia.forEach(v => {
    total += Number(v.valor || 0);
    pagoParcial += Number(v.valorRecebido || 0);
    falta += v.status === "parcial" ? Number(v.faltaReceber || 0) : Number(v.valor || 0);

    html += `
      <div class="compra-info">
        <p><strong>Cliente:</strong> ${v.cliente}</p>
        <p><strong>Valor:</strong> R$ ${v.valor}</p>
        <p><strong>Produtos:</strong> ${v.produtos?.join(", ")}</p>
        <p><strong>Forma:</strong> ${v.forma}</p>
        <p><strong>Local:</strong> ${v.local}</p>
        ${v.obs ? `<p><strong>Obs:</strong> ${v.obs}</p>` : ""}
      </div>
    `;
  });

  html += `
    <p><strong>Total da compra:</strong> R$ ${total.toFixed(2)}</p>
    ${pagoParcial > 0 ? `<p><strong>Pago parcial:</strong> R$ ${pagoParcial.toFixed(2)}</p>` : ""}
    ${falta > 0 ? `<p><strong>Falta pagar:</strong> R$ ${(falta - pagoParcial).toFixed(2)}</p>` : ""}

    <button onclick="marcarComoPago('${dataSelecionada}', '${usuario}')">Cobrei - Já pago</button>
    <button onclick="enviarCobranca('${dataSelecionada}', '${usuario}')">Cobrei - Não pago</button>
    <button onclick="pagoParcial('${dataSelecionada}', '${usuario}')">Pago parcial</button>
    <br><button onclick="showCobranca('${usuario}')">Voltar</button>
  </div>`;

  root.innerHTML = html;
};

window.marcarComoPago = async (data, usuario) => {
  const snap = await getDocs(collection(db, "vendas"));
  const updates = snap.docs.filter(doc => {
    const d = doc.data();
    return d.usuario === usuario && d.dataReceber === data && d.status !== "pago";
  });

  for (const docSnap of updates) {
    await updateDoc(doc(db, "vendas", docSnap.id), { status: "pago" });
  }

  alert("Cobranças marcadas como pagas.");
  showDashboard(usuario);
};

window.enviarCobranca = async (data, usuario) => {
  const snap = await getDocs(collection(db, "vendas"));
  const docs = snap.docs.filter(doc => {
    const d = doc.data();
    return d.usuario === usuario && d.dataReceber === data && d.status !== "pago";
  });

  if (docs.length === 0) return alert("Nenhuma cobrança.");

  const dados = docs.map(doc => doc.data());
  const cliente = dados[0].cliente;
  const telefone = dados[0].telefone || "";

  const total = dados.reduce((sum, v) => sum + Number(v.valor || 0), 0);
  const parcial = dados.reduce((sum, v) => sum + Number(v.valorRecebido || 0), 0);
  const falta = total - parcial;

  let texto = `Olá ${cliente}, segue a cobrança Buck Doces.\n\n`;
  texto += `Total: R$ ${total.toFixed(2)}\n`;
  if (parcial > 0) texto += `Pago parcial: R$ ${parcial.toFixed(2)}\n`;
  texto += `Falta pagar: R$ ${falta.toFixed(2)}\n`;
  texto += `\nChave PIX para pagamento:\nCNPJ: 57.010.512/0001-56\n\nPor favor, enviar o comprovante.`;

  if (telefone.length > 10) {
    const link = `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`;
    window.open(link, "_blank");
  } else {
    alert("Telefone inválido para WhatsApp.");
  }
};
window.pagoParcial = async (dataSelecionada, usuario) => {
  const snap = await getDocs(collection(db, "vendas"));
  const docs = snap.docs.filter(doc => {
    const d = doc.data();
    return d.usuario === usuario && d.dataReceber === dataSelecionada && d.status !== "pago";
  });

  if (docs.length === 0) return alert("Nenhuma cobrança encontrada.");

  const valorRecebido = prompt("Digite quanto recebeu (R$):");
  if (!valorRecebido || isNaN(valorRecebido) || Number(valorRecebido) <= 0) {
    return alert("Valor inválido.");
  }

  const novaData = prompt("Digite a nova data para o restante (AAAA-MM-DD):");
  if (!novaData || !/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
    return alert("Data inválida.");
  }

  const totalGrupo = docs.reduce((sum, doc) => sum + Number(doc.data().valor || 0), 0);
  const valorRestante = totalGrupo - Number(valorRecebido);

  if (valorRestante < 0) return alert("Valor recebido maior que o total.");

  const valorRateado = valorRestante / docs.length;

  for (const docSnap of docs) {
    const d = docSnap.data();
    await updateDoc(doc(db, "vendas", docSnap.id), {
      status: "parcial",
      valorRecebido: Number(valorRecebido),
      faltaReceber: Number(valorRestante),
      dataReceber: novaData
    });
  }

  alert("Valor parcial salvo e cobrança reagendada.");
  showCobranca(usuario);
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
  mostrarDia(novaData);
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

function formatarData(data) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return `${dia}-${mes}-${ano}`;
}
