<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Buck Doces</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
      background-color: #fff4f7;
      color: #5a3e36;
    }
    h1 {
      text-align: center;
      color: #b76e79;
      margin-top: 20px;
    }
    .card {
      background: white;
      margin: 20px auto;
      padding: 20px;
      border-radius: 20px;
      max-width: 400px;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    input, select, button {
      display: block;
      width: 100%;
      padding: 10px;
      margin-top: 10px;
      border-radius: 10px;
      border: 1px solid #ccc;
    }
    button {
      background-color: #f4a1af;
      color: white;
      border: none;
    }
    button:hover {
      background-color: #e28898;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import {
      getFirestore, collection, addDoc, getDocs, updateDoc, doc
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

    window.showCadastro = (usuario) => {
      document.getElementById("conteudo").innerHTML = `
        <h2>Cadastro de Venda</h2>
        <input id="cliente" placeholder="Nome do cliente" />
        <input id="local" placeholder="Local da venda" />
        <input id="valor" placeholder="Valor (R$)" type="number" />
        <label>Produtos vendidos:</label>
        <select id="produtos" multiple size="6">
          <option>Cone</option>
          <option>Trufa</option>
          <option>Bolo de pote</option>
          <option>Pão de mel</option>
          <option>Escondidinho de uva</option>
          <option>Bombom de uva</option>
          <option>BomBom de morango</option>
          <option>Coxinha de morango</option>
          <option>Camafeu</option>
          <option>Caixinha</option>
          <option>Mousse</option>
          <option>Lanche natural</option>
        </select>
        <select id="status">
          <option value="pago">Pago</option>
          <option value="nao">Não pago</option>
          <option value="parcial">Parcial</option>
        </select>
        <div id="extras"></div>
        <button onclick="cadastrar('${usuario}')">Salvar</button>
      `;

      document.getElementById("status").addEventListener("change", (e) => {
        const val = e.target.value;
        let html = "";
        if (val === "pago") {
          html = `<select id="forma"><option>dinheiro</option><option>cartão</option><option>pix</option></select>`;
        } else if (val === "nao") {
          html = `<input type="date" id="dataReceber" />
                  <select id="forma"><option>dinheiro</option><option>cartão</option><option>pix</option></select>`;
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
      const cliente = document.getElementById("cliente").value;
      const local = document.getElementById("local").value;
      const valor = parseFloat(document.getElementById("valor").value);
      const status = document.getElementById("status").value;
      const produtos = Array.from(document.getElementById("produtos").selectedOptions).map(o => o.value);
      const forma = document.getElementById("forma")?.value || "";
      const dataReceber = document.getElementById("dataReceber")?.value || "";
      const valorParcial = parseFloat(document.getElementById("valorParcial")?.value || 0);
      const faltaReceber = parseFloat(document.getElementById("falta")?.value || 0);
      const data = new Date().toISOString().split("T")[0];

      const snap = await getDocs(collection(db, "vendas"));
      const duplicado = snap.docs.find(doc => {
        const d = doc.data();
        return d.usuario === usuario &&
          d.cliente === cliente &&
          d.local === local &&
          d.valor === valor &&
          JSON.stringify(d.produtos || []) === JSON.stringify(produtos) &&
          d.status === status &&
          d.forma === forma &&
          (d.dataReceber || "") === dataReceber &&
          (d.valorParcial || 0) === valorParcial &&
          (d.faltaReceber || 0) === faltaReceber &&
          d.data === data;
      });

      if (duplicado) {
        alert("Essa venda já foi cadastrada!");
        return;
      }

      await addDoc(collection(db, "vendas"), {
        usuario, cliente, local, valor, status, produtos, forma,
        valorParcial: status === "parcial" ? valorParcial : null,
        faltaReceber: status === "parcial" ? faltaReceber : (status === "nao" ? valor : 0),
        dataReceber: status !== "pago" ? dataReceber : null,
        data
      });

      alert("Venda salva!");
    };
  </script>
</body>
</html>
