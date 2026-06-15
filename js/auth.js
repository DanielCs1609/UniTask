// ============================================
// Firebase Authentication Module
// ============================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { auth } from "./firebase.js";

// ============================================
// Configurar Persistência de Sessão
// ============================================

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Erro ao configurar persistência:", error);
});

// ============================================
// Provider do Google
// ============================================

const googleProvider = new GoogleAuthProvider();

// ============================================
// Sistema de Notificações Toast
// ============================================

export function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Adicionar ícone baseado no tipo
  const icons = {
    success: "✓",
    error: "✕",
    warning: "!",
    info: "ℹ"
  };
  
  toast.textContent = `${icons[type]} ${message}`;
  document.body.appendChild(toast);
  
  // Animação de entrada
  setTimeout(() => toast.classList.add("show"), 10);
  
  // Remover após 3 segundos
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// Mostrar/Ocultar Loading
// ============================================

export function showLoading(message = "Carregando...") {
  let loader = document.getElementById("loader");
  if (!loader) {
    loader = document.createElement("div");
    loader.id = "loader";
    loader.innerHTML = `
      <div class="loader-overlay">
        <div class="loader-content">
          <div class="spinner"></div>
          <p>${message}</p>
        </div>
      </div>
    `;
    document.body.appendChild(loader);
  }
  loader.style.display = "flex";
}

export function hideLoading() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

// ============================================
// CADASTRO COM EMAIL E SENHA
// ============================================

export async function registerUser(email, password, confirmPassword, name) {
  try {
    // Validações
    if (!name || !name.trim()) {
      showToast("Preencha seu nome completo!", "warning");
      return false;
    }

    if (!email || !password || !confirmPassword) {
      showToast("Preencha todos os campos!", "warning");
      return false;
    }

    if (password !== confirmPassword) {
      showToast("As senhas não coincidem!", "error");
      return false;
    }

    if (password.length < 6) {
      showToast("A senha deve ter pelo menos 6 caracteres!", "warning");
      return false;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Email inválido!", "warning");
      return false;
    }

    showLoading("Criando conta...");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Atualizar perfil com o nome de exibição
    await updateProfile(userCredential.user, { displayName: name });
    
    hideLoading();
    showToast("Conta criada com sucesso!", "success");
    return userCredential.user;

  } catch (error) {
    hideLoading();
    
    // Tratamento de erros específicos
    if (error.code === "auth/email-already-in-use") {
      showToast("Email já está registrado!", "error");
    } else if (error.code === "auth/weak-password") {
      showToast("A senha é muito fraca!", "error");
    } else if (error.code === "auth/invalid-email") {
      showToast("Email inválido!", "error");
    } else {
      showToast("Erro ao criar conta: " + error.message, "error");
    }
    
    console.error("Erro no registro:", error);
    return false;
  }
}

// ============================================
// LOGIN COM EMAIL E SENHA
// ============================================

export async function loginUser(email, password) {
  try {
    if (!email || !password) {
      showToast("Preencha email e senha!", "warning");
      return false;
    }

    showLoading("Entrando...");

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    hideLoading();
    showToast("Bem-vindo de volta!", "success");
    return userCredential.user;

  } catch (error) {
    hideLoading();
    
    // Tratamento de erros
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      showToast("E-mail ou senha incorretos!", "error");
    } else if (error.code === "auth/invalid-email") {
      showToast("Email inválido!", "error");
    } else if (error.code === "auth/too-many-requests") {
      showToast("Muitas tentativas falhas. Tente novamente mais tarde!", "error");
    } else {
      showToast("Erro ao fazer login: " + error.message, "error");
    }
    
    console.error("Erro no login:", error);
    return false;
  }
}

// ============================================
// LOGIN COM GOOGLE
// ============================================

export async function loginWithGoogle() {
  try {
    showLoading("Conectando com Google...");

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    hideLoading();
    showToast(`Bem-vindo, ${user.displayName}!`, "success");
    return user;

  } catch (error) {
    hideLoading();
    
    if (error.code === "auth/popup-closed-by-user") {
      console.log("Login cancelado pelo usuário");
    } else if (error.code === "auth/popup-blocked") {
      showToast("Pop-up bloqueado. Permita pop-ups para fazer login com Google!", "error");
    } else {
      showToast("Erro ao fazer login com Google: " + error.message, "error");
    }
    
    console.error("Erro no login Google:", error);
    return false;
  }
}

// ============================================
// LOGOUT
// ============================================

export async function logoutUser() {
  try {
    showLoading("Saindo...");
    await signOut(auth);
    hideLoading();
    showToast("Desconectado com sucesso!", "success");
    return true;
  } catch (error) {
    hideLoading();
    showToast("Erro ao desconectar: " + error.message, "error");
    console.error("Erro no logout:", error);
    return false;
  }
}

// ============================================
// Obter usuário atual
// ============================================

export function getCurrentUser() {
  return auth.currentUser;
}
