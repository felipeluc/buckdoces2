// app.js

// Firebase config
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SUA_MEASUREMENT_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {
  const user = localStorage.getItem('user');
  if (user) {
    showDashboard();
  } else {
    showLogin();
  }
});

function showLogin() {
  document.body.innerHTML = `
    <div class="login-container">
      <img src="logo-buck-doces.jpeg" alt="Logo" class="logo">
      <h2 class="text-center">Ana Buck Doces</h2>
      <input type="email" id="email" placeholder="Email">
      <input type="password" id="password" placeholder="Senha">
      <button onclick="login()">Entrar</button>
    </div>
  `;
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      localStorage.setItem('user', email);
      showDashboard();
    })
    .catch(error => {
      alert("Erro ao fazer login: " + error.message);
    });
}

function logout() {
  firebase.auth().signOut().then(() => {
    localStorage.removeItem('user');
    showLogin();
  });
}
