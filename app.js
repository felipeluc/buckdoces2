// app.js completo com funcionalidade WhatsApp e cadastro
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const produtosLista = ["Trufa", "Cone", "Brigadeiro", "Bolo", "Torta"];

window.showCadastro = (usuario) => {
  const produtoOptions = produtosLista
    .map(p => `<label><input type="checkbox" value="${p}" /> ${p}</label>`) 
    .join("");

  document.getElementById("root").innerHTML = `
    <div class="card">
      <h2>Cadastro de Venda</h2>
      <input id="cliente" placeholder="Nome do cliente" />
      <input id="telefone" placeholder="Telefone (ex: 5511999999999)" />
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
    </div>
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
  const produtosSelecionados = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

  if (!cliente || !telefone || !local || isNaN(valor)) {
    alert("Preencha todos os campos obrigatórios corretamente.");
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

  // Envio via WhatsApp
  const mensagem = `Olá ${cliente}, aqui é da Ana Buck Doces. Obrigado pela sua compra!
Valor: R$ ${valor.toFixed(2)}
Produtos: ${produtosSelecionados.join(", ")}
Forma de pagamento: ${forma}
Data: ${data}

Qualquer dúvida estamos à disposição! 💖`;

  const linkWhats = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
  window.open(linkWhats, "_blank");

  alert("Venda salva e comprovante enviado!");
};
