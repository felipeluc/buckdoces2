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
  const produtoOptions = produtosLista
    .map((p, index) => `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
        <label>${p}</label>
        <div style="display: flex; gap: 5px;">
          <button onclick="alterarQtd(${index}, -1)">-</button>
          <input type="number" id="qtd-${index}" value="0" min="0" style="width: 40px; text-align:center;" readonly />
          <button onclick="alterarQtd(${index}, 1)">+</button>
        </div>
      </div>
    `).join("");

  document.getElementById("conteudo").innerHTML = `
    <h2>Cadastro de Venda</h2>
    <input id="cliente" placeholder="Nome do cliente" />
    <input id="telefone" placeholder="Telefone (ex: 5599999999999)" />
    <input id="local" placeholder="Local da venda" />
    <input id="valor" placeholder="Valor (R$)" type="number" />
    <div><strong>Produtos vendidos:</strong><br>${produtoOptions}</div>
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

// Função para alterar a quantidade de um produto
window.alterarQtd = (index, delta) => {
  const input = document.getElementById(`qtd-${index}`);
  let atual = parseInt(input.value);
  atual = isNaN(atual) ? 0 : atual + delta;
  input.value = atual < 0 ? 0 : atual;
};

// Enviar comprovante via WhatsApp
window.enviarComprovante = () => {
  const numero = document.getElementById("telefone")?.value.trim();
  const valor = document.getElementById("valor")?.value.trim();
  const cliente = document.getElementById("cliente")?.value.trim();
  const status = document.getElementById("status")?.value;
  const dataReceber = document.getElementById("dataReceber")?.value || "";
  const valorParcial = document.getElementById("valorParcial")?.value || "";
  const falta = document.getElementById("falta")?.value || "";

  const produtos = produtosLista.map((p, i) => {
    const qtd = parseInt(document.getElementById(`qtd-${i}`).value);
    return qtd > 0 ? `${p} x${qtd}` : null;
  }).filter(Boolean).join("\n");

  if (!numero || !valor || !cliente) {
    alert("Preencha nome, telefone e valor.");
    return;
  }

  let msg = `Olá ${cliente}! Segue o comprovante da sua compra na Ana Buck Doces:\n\n` +
            `Produtos:\n${produtos}\n\nValor: R$ ${valor}\nForma: ${status.toUpperCase()}\n`;

  if (status === "parcial") {
    msg += `Valor pago: R$ ${valorParcial}\nFalta: R$ ${falta}\n`;
  }

  if (status !== "pago" && dataReceber) {
    msg += `Data para pagamento: ${dataReceber}\n`;
  }

  msg += `\nAgradecemos pela preferência! 😊`;

  const link = `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
  window.open(link, "_blank");
};
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

  // Captura produtos com quantidade
  const produtosVendidos = produtosLista
    .map((p, i) => {
      const qtd = parseInt(document.getElementById(`qtd-${i}`).value || 0);
      return qtd > 0 ? { nome: p, quantidade: qtd } : null;
    })
    .filter(Boolean);

  if (!cliente || !telefone || !valor || produtosVendidos.length === 0) {
    alert("Preencha todos os campos obrigatórios e selecione pelo menos um produto.");
    return;
  }

  // Verifica duplicidade
  const snap = await getDocs(collection(db, "vendas"));
  const duplicado = snap.docs.some(doc => {
    const d = doc.data();
    return d.usuario === usuario &&
           d.cliente === cliente &&
           d.local === local &&
           d.valor === valor &&
           d.status === status &&
           JSON.stringify(d.produtosVendidos || []) === JSON.stringify(produtosVendidos) &&
           d.dataReceber === (status !== "pago" ? dataReceber : null) &&
           d.data === data;
  });

  if (duplicado) {
    alert("Venda duplicada. Já existe com os mesmos dados.");
    return;
  }

  await addDoc(collection(db, "vendas"), {
    usuario,
    cliente,
    telefone,
    local,
    valor,
    status,
    forma,
    valorParcial: status === "parcial" ? valorParcial : null,
    faltaReceber: status === "parcial" ? faltaReceber : (status === "nao" ? valor : 0),
    dataReceber: status !== "pago" ? dataReceber : null,
    data,
    produtosVendidos
  });

  alert("Venda salva!");
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
  const pendentes = vendas.filter(v => v.status !== "pago" && v.dataReceber);

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
      const totalDia = vendasDoDia.reduce((acc, v) => acc + (v.faltaReceber || v.valor), 0);
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

    const cards = vendasDoDia.map(v => {
      const produtosHtml = (v.produtosVendidos || [])
        .map(p => `• ${p.nome} (${p.quantidade})`)
        .join("<br>");

      return `
        <div class="card">
          <p><strong>${v.cliente}</strong> - ${v.local}</p>
          <p>Valor: R$ ${v.faltaReceber || v.valor}</p>
          <p>Forma: ${v.forma || "Não informado"}</p>
          <p>Status: ${v.status === "parcial" ? "Parcial" : "Não pago"}</p>
          <p>Para: ${v.dataReceber}</p>
          <p>Produtos:<br>${produtosHtml}</p>
          <button onclick="marcarPago('${v.id}')">Cobrei - já pago</button>
          <button onclick="naoPago('${v.id}')">Cobrei - não pago</button>
          <button onclick="reagendar('${v.id}')">Reagendar cobrança</button>
          <div id="reagendar-${v.id}"></div>
        </div>`;
    }).join("");

    document.getElementById("detalhesDia").innerHTML = `<h3>${dataCompleta}</h3>${cards}`;
  };
};
window.marcarPago = async (id) => {
  const ref = doc(db, "vendas", id);
  await updateDoc(ref, { status: "pago", dataReceber: null, faltaReceber: 0 });
  alert("Status atualizado para pago");
  showCobranca();
};

window.naoPago = async (id) => {
  alert("A venda continua marcada como não paga.");
};

window.reagendar = (id) => {
  document.getElementById(`reagendar-${id}`).innerHTML = `
    <input type="date" id="novaData-${id}" />
    <button onclick="salvarReagendamento('${id}')">Salvar nova data</button>
  `;
};

window.salvarReagendamento = async (id) => {
  const novaData = document.getElementById(`novaData-${id}`).value;
  if (!novaData) {
    alert("Selecione a nova data");
    return;
  }

  const ref = doc(db, "vendas", id);
  await updateDoc(ref, { dataReceber: novaData });
  alert("Data reagendada com sucesso");
  showCobranca();
};
