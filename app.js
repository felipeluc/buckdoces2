// Firebase e inicialização
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getDatabase, ref, push, onValue, set } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js';

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  databaseURL: "SEU_DATABASE_URL",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

showCadastro();

function showCadastro() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="card">
      <h2>Cadastro de Vendas</h2>
      <input type="text" id="cliente" placeholder="Cliente" required />
      <input type="text" id="telefone" placeholder="Telefone com DDD (ex: 11912345678)" required />
      <input type="text" id="valor" placeholder="Valor (R$)" required />
      <select id="local">
        <option value="">Selecione o local</option>
        <option value="Escola">Escola</option>
        <option value="Trabalho">Trabalho</option>
        <option value="Outros">Outros</option>
      </select>
      <select id="formaPagamento">
        <option value="">Forma de Pagamento</option>
        <option value="Pix">Pix</option>
        <option value="Dinheiro">Dinheiro</option>
        <option value="Crédito">Crédito</option>
        <option value="Débito">Débito</option>
      </select>
      <input type="date" id="data" required />
      <select multiple id="produtos">
        <option value="Cone">Cone</option>
        <option value="Trufa">Trufa</option>
        <option value="Brownie">Brownie</option>
        <option value="Brigadeiro">Brigadeiro</option>
      </select>
      <textarea id="observacao" placeholder="Observação (opcional)"></textarea>
      <button id="salvarBtn">Salvar Venda</button>
      <button id="dashboardBtn">Dashboard</button>
      <button id="cobrancaBtn">Cobranças</button>
    </div>
  `;

  document.getElementById('salvarBtn').addEventListener('click', async () => {
    const cliente = document.getElementById('cliente').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const valor = document.getElementById('valor').value.trim();
    const local = document.getElementById('local').value;
    const formaPagamento = document.getElementById('formaPagamento').value;
    const data = document.getElementById('data').value;
    const produtos = Array.from(document.getElementById('produtos').selectedOptions).map(opt => opt.value);
    const observacao = document.getElementById('observacao').value.trim();

    if (!cliente || !valor || !local || !formaPagamento || !data || produtos.length === 0 || !telefone) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }

    const novaVenda = { cliente, telefone, valor, local, formaPagamento, data, produtos, observacao };
    await push(ref(db, 'vendas'), novaVenda);

    const numeroFormatado = telefone.replace(/\D/g, '');
    const linkWhatsapp = `https://wa.me/55${numeroFormatado}?text=${encodeURIComponent(`Olá ${cliente}, aqui está o comprovante da sua compra no valor de R$ ${valor}. Obrigado! \nProdutos: ${produtos.join(', ')} \nForma de pagamento: ${formaPagamento}`)}`;

    window.open(linkWhatsapp, '_blank');
    alert('Venda cadastrada com sucesso!');
    showCadastro();
  });

  document.getElementById('dashboardBtn').addEventListener('click', showDashboard);
  document.getElementById('cobrancaBtn').addEventListener('click', showCobranca);
}

// As funções showDashboard e showCobranca devem estar abaixo, conforme no projeto original:

function showDashboard() {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div class="card">
      <h2>Dashboard</h2>
      <div id="totais"></div>
      <button id="voltarBtn">Voltar</button>
    </div>
  `;

  const vendasRef = ref(db, 'vendas');
  onValue(vendasRef, (snapshot) => {
    let totalVendas = 0;
    let totalAReceber = 0;

    snapshot.forEach((childSnapshot) => {
      const venda = childSnapshot.val();
      totalVendas += parseFloat(venda.valor) || 0;
      if (venda.formaPagamento !== 'Pix' && venda.formaPagamento !== 'Dinheiro') {
        totalAReceber += parseFloat(venda.valor) || 0;
      }
    });

    document.getElementById('totais').innerHTML = `
      <p><strong>Total de Vendas:</strong> R$ ${totalVendas.toFixed(2)}</p>
      <p><strong>À Receber:</strong> R$ ${totalAReceber.toFixed(2)}</p>
    `;
  });

  document.getElementById('voltarBtn').addEventListener('click', showCadastro);
}

function showCobranca() {
  const root = document.getElementById('root');
  const hoje = new Date();
  const mesAtual = hoje.toISOString().substring(0, 7);

  root.innerHTML = `
    <div class="card">
      <h2>Cobranças</h2>
      <input type="month" id="filtroMes" value="${mesAtual}" />
      <input type="text" id="buscaCliente" placeholder="Buscar por cliente..." />
      <select id="filtroLocal">
        <option value="">Todos os locais</option>
        <option value="Escola">Escola</option>
        <option value="Trabalho">Trabalho</option>
        <option value="Outros">Outros</option>
      </select>
      <select id="filtroPagamento">
        <option value="">Todas formas</option>
        <option value="Pix">Pix</option>
        <option value="Dinheiro">Dinheiro</option>
        <option value="Crédito">Crédito</option>
        <option value="Débito">Débito</option>
      </select>
      <div id="calendario"></div>
      <div id="detalhesDia"></div>
      <button id="voltarBtn">Voltar</button>
    </div>
  `;

  document.getElementById('voltarBtn').addEventListener('click', showCadastro);

  const vendasRef = ref(db, 'vendas');
  onValue(vendasRef, (snapshot) => {
    const vendas = [];
    snapshot.forEach(child => {
      const v = child.val();
      v.id = child.key;
      vendas.push(v);
    });

    document.getElementById('filtroMes').addEventListener('change', () => renderCalendario(vendas));
    document.getElementById('buscaCliente').addEventListener('input', () => renderCalendario(vendas));
    document.getElementById('filtroLocal').addEventListener('change', () => renderCalendario(vendas));
    document.getElementById('filtroPagamento').addEventListener('change', () => renderCalendario(vendas));

    renderCalendario(vendas);
  });

  function renderCalendario(vendas) {
    const calendarioDiv = document.getElementById('calendario');
    calendarioDiv.innerHTML = '';

    const filtroMes = document.getElementById('filtroMes').value;
    const buscaCliente = document.getElementById('buscaCliente').value.toLowerCase();
    const filtroLocal = document.getElementById('filtroLocal').value;
    const filtroPagamento = document.getElementById('filtroPagamento').value;

    const diasMes = new Date(filtroMes.split('-')[0], filtroMes.split('-')[1], 0).getDate();

    for (let dia = 1; dia <= diasMes; dia++) {
      const dataStr = `${filtroMes}-${dia.toString().padStart(2, '0')}`;
      const vendasDoDia = vendas.filter(v =>
        v.data === dataStr &&
        (!buscaCliente || v.cliente.toLowerCase().includes(buscaCliente)) &&
        (!filtroLocal || v.local === filtroLocal) &&
        (!filtroPagamento || v.formaPagamento === filtroPagamento)
      );

      if (vendasDoDia.length > 0) {
        const totalDia = vendasDoDia.reduce((sum, v) => sum + parseFloat(v.valor || 0), 0);

        const divDia = document.createElement('div');
        divDia.className = 'calendar-day';
        divDia.innerHTML = `
          <div class="calendar-day-value">${dia}</div>
          <div class="amount">R$ ${totalDia.toFixed(2)}</div>
        `;
        divDia.addEventListener('click', () => mostrarDetalhesDia(dataStr, vendasDoDia));
        calendarioDiv.appendChild(divDia);
      }
    }
  }

  function mostrarDetalhesDia(data, vendasDoDia) {
    const detalhesDiv = document.getElementById('detalhesDia');
    detalhesDiv.innerHTML = `<h3>Detalhes de ${data}</h3>`;

    vendasDoDia.forEach(v => {
      const card = document.createElement('div');
      card.className = 'day-card';
      card.innerHTML = `
        <p><strong>Cliente:</strong> ${v.cliente}</p>
        <p><strong>Valor:</strong> R$ ${parseFloat(v.valor || 0).toFixed(2)}</p>
        <p><strong>Local:</strong> ${v.local}</p>
        <p><strong>Forma de Pagamento:</strong> ${v.formaPagamento}</p>
        <p><strong>Produtos:</strong> ${v.produtos ? v.produtos.join(', ') : ''}</p>
        <button onclick="marcarComoPago('${v.id}')">Cobrei - Já pago</button>
        <button onclick="alert('Marcar como não pago: ${v.cliente}')">Cobrei - Não pago</button>
        <button onclick="alert('Reagendar cobrança para ${v.cliente}')">Reagendar</button>
      `;
      detalhesDiv.appendChild(card);
    });
  }

  window.marcarComoPago = (id) => {
    alert(`Venda ${id} marcada como paga!`);
    // Aqui você pode atualizar o status no Firebase se desejar
  };
}
