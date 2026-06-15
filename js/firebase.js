// ============================================
// Firebase Configuration and Initialization
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

// ============================================
// IMPORTANTE: Configurar com seus dados!
// ============================================
// Acesse: https://console.firebase.google.com
// Copie as credenciais do seu projeto
// Substitua os valores abaixo

const firebaseConfig = {
  apiKey: "AIzaSyBUs9v87s_wg74obqaavIC_n-XCUpeW4kE",
  authDomain: "unitask-app-94edc.firebaseapp.com",
  projectId: "unitask-app-94edc",
  storageBucket: "unitask-app-94edc.firebasestorage.app",
  messagingSenderId: "284346302703",
  appId: "1:284346302703:web:f3d2b9df0b0784b69e1b1a",
  measurementId: "G-3PG8BZK4MN"
};

// ============================================
// Inicializar Firebase
// ============================================

// Inicializar o app Firebase
const app = initializeApp(firebaseConfig);

// Obter instâncias dos serviços
export const auth = getAuth(app);
export const db = getFirestore(app);

// ============================================
// Gerenciar estado de autenticação
// ============================================

export function setupAuthListener(callback) {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

// ============================================
// Log inicial para confirmar configuração
// ============================================

console.log("🔥 Firebase inicializado com sucesso!");
console.log("📱 App ID:", app.options.appId);
console.log("🌍 Auth Domain:", app.options.authDomain);
