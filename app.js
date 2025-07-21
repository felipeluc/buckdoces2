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

  html += `<hr><input type="month" id="mesFiltro" /><div id="calendario"></div><div id="infoDia"></div>`;
  document.getElementById("conteudo").innerHTML = html;

  document.getElementById("mesFiltro").addEventListener("change", e => {
    const mes = e.target.value;
    gerarCalendario(mes, vendas);
  });
};

function gerarCalendario(mesSelecionado, vendas) {
  const [ano, mes] = mesSelecionado.split("-").map(Number);
  const primeiroDia = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes, 0);
  const totalDias = ultimoDia.getDate();

  let calendario = '<div style="display:grid;grid-template-columns:repeat(7, 1fr);gap:10px">';
  for (let i = 1; i < primeiroDia.getDay(); i++) {
    calendario += `<div></div>`;
  }

  for (let dia = 1; dia <= totalDias; dia++) {
    const diaStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const doDia = vendas.filter(v => v.dataReceber === diaStr);
    const total = doDia.reduce((acc, v) => acc + (v.faltaReceber || v.valor), 0);

    calendario += `
      <div onclick="mostrarDetalhesDia('${diaStr}')"
        style="border:1px solid #ccc;padding:5px;cursor:pointer;background:#fff">
        <strong>${dia}</strong><br/>
        <span style="font-size:12px">R$ ${total.toFixed(2)}</span>
      </div>
    `;
  }

  calendario += `</div>`;
  document.getElementById("calendario").innerHTML = calendario;
}

window.mostrarDetalhesDia = (diaStr) => {
  getDocs(collection(db, "vendas")).then(snap => {
    const vendas = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const doDia = vendas.filter(v => v.dataReceber === diaStr);
    let html = `<h3>Cobranças de ${diaStr}</h3>`;
    if (doDia.length === 0) {
      html += `<p>Nenhuma cobrança nesse dia.</p>`;
    } else {
      doDia.forEach(v => {
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
    }
    document.getElementById("infoDia").innerHTML = html;
  });
};
