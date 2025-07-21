import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
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

const root = document.getElementById("root");
root.innerHTML = `
  <h2>Calendário de Cobranças</h2>
  <input type="month" id="mesSelect" />
  <div id="calendario"></div>
  <div class="day-details" id="detalhesDia"></div>
`;

document.getElementById("mesSelect").addEventListener("change", async (e) => {
  const mes = e.target.value;
  const snap = await getDocs(collection(db, "vendas"));
  const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const dias = {};

  vendas.forEach(v => {
    if ((v.dataReceber || "").startsWith(mes)) {
      if (!dias[v.dataReceber]) dias[v.dataReceber] = [];
      dias[v.dataReceber].push(v);
    }
  });

  const [ano, mesNum] = mes.split("-").map(Number);
  const primeiro = new Date(ano, mesNum - 1, 1);
  const ultimo = new Date(ano, mesNum, 0);
  const inicioSemana = primeiro.getDay();
  const totalDias = ultimo.getDate();
  let html = "";

  for (let i = 0; i < inicioSemana; i++) {
    html += `<div></div>`;
  }

  for (let d = 1; d <= totalDias; d++) {
    const data = `${mes}-${String(d).padStart(2, "0")}`;
    const valor = (dias[data] || []).reduce((acc, v) => acc + (v.faltaReceber || v.valor), 0);
    const valorHtml = valor > 0 ? `<div class="amount">R$ ${valor.toFixed(2)}</div>` : "";
    html += `<div class="calendar-day" onclick="window.abrirDetalhes('${data}')">${d}${valorHtml}</div>`;
  }

  document.getElementById("calendario").innerHTML = `<div class="calendar">${html}</div>`;

  window.abrirDetalhes = (dia) => {
    const registros = dias[dia] || [];
    if (!registros.length) {
      document.getElementById("detalhesDia").innerHTML = "<p>Sem cobranças</p>";
      return;
    }

    const detalhes = registros.map(v => `
      <div class="day-card">
        <p><strong>${v.cliente}</strong> - ${v.local} - R$ ${v.faltaReceber || v.valor}</p>
        <button onclick="alert('Cobrei - já pago')">Cobrei - Já pago</button>
        <button onclick="alert('Cobrei - não pago')">Cobrei - Não pago</button>
        <button onclick="alert('Reagendar cobrança')">Reagendar</button>
      </div>
    `).join("");

    document.getElementById("detalhesDia").innerHTML = detalhes;
  };
});
