import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDGg5JtE_7gVRhTlRY30bpXsmMpvPEQ3tw",
  authDomain: "buckdoces.firebaseapp.com",
  projectId: "buckdoces",
  storageBucket: "buckdoces.firebasestorage.app",
  messagingSenderId: "781727917443",
  appId: "1:781727917443:web:c9709b3813d28ea60982b6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Resto do código de login e dashboard igual...

window.showCobranca = async () => {
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const hoje = new Date().toISOString().split("T")[0];
  const cobrarHoje = vendas.filter(v => v.dataReceber === hoje);

  let html = `<h2>Cobrança</h2><h3>Cobrar hoje</h3>`;
  if (cobrarHoje.length === 0) html += `<p>Nenhuma cobrança hoje.</p>`;
  cobrarHoje.forEach(v => {
    html += `
      <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px">
        <p><strong>${v.cliente}</strong> - ${v.local} - R$ ${v.faltaReceber || v.valor}</p>
        <button onclick="marcarPago('${v.id}')">Cobrei - já pago</button>
        <button onclick="naoPago('${v.id}')">Cobrei - não pago</button>
        <button onclick="reagendar('${v.id}')">Reagendar cobrança</button>
        <div id="reagendar-${v.id}"></div>
      </div>
    `;
  });

  html += `<hr><input type="month" id="mesFiltro" /><div id="calendarioMes"></div><div id="vendasDoDia"></div>`;
  document.getElementById("conteudo").innerHTML = html;

  document.getElementById("mesFiltro").addEventListener("change", e => {
    const mes = e.target.value;
    const dias = {};

    vendas.forEach(v => {
      if ((v.dataReceber || "").startsWith(mes)) {
        dias[v.dataReceber] = (dias[v.dataReceber] || 0) + (v.faltaReceber || v.valor);
      }
    });

    const date = new Date(mes + "-01");
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    let cal = `<h3>Calendário ${mes}</h3><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">`;
    for (let i = 1; i <= lastDay; i++) {
      const d = `${mes}-${String(i).padStart(2, '0')}`;
      cal += `<div style="border:1px solid #ccc;padding:5px;cursor:pointer" onclick="mostrarVendasDia('${d}')">${i}<br/><small>R$ ${(dias[d] || 0).toFixed(2)}</small></div>`;
    }
    cal += `</div>`;
    document.getElementById("calendarioMes").innerHTML = cal;
  });

  window.mostrarVendasDia = (dia) => {
    const vendasDia = vendas.filter(v => v.dataReceber === dia);
    if (!vendasDia.length) return document.getElementById("vendasDoDia").innerHTML = "<p>Nenhuma venda.</p>";

    let lista = `<h3>Vendas em ${dia}</h3>`;
    vendasDia.forEach(v => {
      lista += `
        <div style="border:1px solid #ccc;padding:10px;margin-bottom:10px">
          <p><strong>${v.cliente}</strong> - ${v.local} - R$ ${v.faltaReceber || v.valor}</p>
          <button onclick="marcarPago('${v.id}')">Cobrei - já pago</button>
          <button onclick="naoPago('${v.id}')">Cobrei - não pago</button>
          <button onclick="reagendar('${v.id}')">Reagendar cobrança</button>
          <div id="reagendar-${v.id}"></div>
        </div>
      `;
    });
    document.getElementById("vendasDoDia").innerHTML = lista;
  };
};

// funções marcarPago, naoPago e reagendar seguem como estavam...
