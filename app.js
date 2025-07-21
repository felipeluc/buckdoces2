<!-- Parte 3: Dashboard e Cobrança com filtro por mês e controle -->

<div id="dashboard" class="p-4">
  <h2 class="text-xl font-bold mb-4">Dashboard</h2>
  <div class="grid grid-cols-2 gap-4">
    <div class="bg-green-100 p-4 rounded-xl shadow">
      <p class="text-sm text-gray-600">Total Vendido</p>
      <p id="total-vendas" class="text-xl font-bold">R$ 0,00</p>
    </div>
    <div class="bg-yellow-100 p-4 rounded-xl shadow">
      <p class="text-sm text-gray-600">Total a Receber</p>
      <p id="total-pendente" class="text-xl font-bold">R$ 0,00</p>
    </div>
  </div>
</div>

<div id="cobrancas" class="p-4">
  <h2 class="text-xl font-bold mb-4 mt-6">Cobranças</h2>
  
  <!-- Filtro por mês -->
  <div class="flex items-center mb-4">
    <label for="mesFiltro" class="mr-2">Filtrar por mês:</label>
    <input type="month" id="mesFiltro" class="border p-2 rounded" />
    <button onclick="filtrarCobrancasPorMes()" class="ml-2 bg-blue-500 text-white px-4 py-2 rounded">Filtrar</button>
  </div>

  <!-- Resultado do filtro -->
  <div id="resumoCobrancasMes" class="mb-4 hidden">
    <h3 class="font-bold">Resumo do mês:</h3>
    <p id="valorTotalMes"></p>
  </div>

  <!-- Lista de cobranças -->
  <div id="listaCobrancas"></div>
</div>

<script>
  async function filtrarCobrancasPorMes() {
    const mes = document.getElementById("mesFiltro").value;
    if (!mes) return;
    const [ano, mesStr] = mes.split("-");
    const mesNum = parseInt(mesStr);

    const snapshot = await getDocs(collection(db, "vendas"));
    const cobrancas = [];
    let total = 0;

    snapshot.forEach(doc => {
      const data = doc.data();
      const dataVenda = new Date(data.data);
      if (
        dataVenda.getMonth() + 1 === mesNum &&
        dataVenda.getFullYear() === parseInt(ano)
      ) {
        cobrancas.push({ id: doc.id, ...data });
        total += parseFloat(data.valor);
      }
    });

    document.getElementById("resumoCobrancasMes").classList.remove("hidden");
    document.getElementById("valorTotalMes").innerText = `Total: R$ ${total.toFixed(2)}`;

    const lista = document.getElementById("listaCobrancas");
    lista.innerHTML = "";

    cobrancas.forEach(c => {
      const div = document.createElement("div");
      div.className = "border p-3 rounded mb-2 shadow";
      div.innerHTML = `
        <p><strong>Cliente:</strong> ${c.cliente}</p>
        <p><strong>Valor:</strong> R$ ${c.valor}</p>
        <p><strong>Data:</strong> ${c.data}</p>
        <div class="flex gap-2 mt-2">
          <button onclick="atualizarStatusCobranca('${c.id}', 'pago')" class="bg-green-500 text-white px-3 py-1 rounded">Cobrei - já pago</button>
          <button onclick="atualizarStatusCobranca('${c.id}', 'naoPago')" class="bg-red-500 text-white px-3 py-1 rounded">Cobrei - não pago</button>
          <button onclick="abrirReagendar('${c.id}')" class="bg-yellow-400 text-white px-3 py-1 rounded">Reagendar cobrança</button>
        </div>
        <div id="reagendar-${c.id}" class="mt-2 hidden">
          <input type="date" id="novaData-${c.id}" class="border p-1 rounded" />
          <button onclick="salvarReagendamento('${c.id}')" class="bg-blue-500 text-white px-2 py-1 rounded">Salvar</button>
        </div>
      `;
      lista.appendChild(div);
    });
  }

  function abrirReagendar(id) {
    document.getElementById(`reagendar-${id}`).classList.remove("hidden");
  }

  async function salvarReagendamento(id) {
    const novaData = document.getElementById(`novaData-${id}`).value;
    if (!novaData) return;
    await updateDoc(doc(db, "vendas", id), { data: novaData });
    alert("Data reagendada com sucesso!");
    filtrarCobrancasPorMes();
  }

  async function atualizarStatusCobranca(id, status) {
    await updateDoc(doc(db, "vendas", id), { status });
    alert("Status atualizado!");
    filtrarCobrancasPorMes();
  }
</script>
