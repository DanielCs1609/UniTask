# 📚 Documentação Técnica - UniTask

## 🏗️ Arquitetura do Projeto

### Estrutura Modular

O projeto utiliza módulos ES6 para separação de responsabilidades:

```
firebase.js          → Inicialização e configuração do Firebase
  ↓
auth.js              → Autenticação e gerenciamento de usuários
  ↓
dashboard.js         → Lógica de tarefas e Firestore
  ↓
HTML/CSS             → Apresentação e interação
```

### Fluxo de Dados

```
Usuário Interage
       ↓
HTML captura evento
       ↓
JavaScript executa função
       ↓
Firebase atualiza dados
       ↓
Firestore emite mudanças (listener)
       ↓
Dashboard re-renderiza
       ↓
Usuário vê atualização em tempo real
```

## 📦 Módulos e Funções Principais

### firebase.js

**Responsabilidade:** Inicializar Firebase e gerenciar conexão

```javascript
// Exportadas:
-auth - // Instância do Firebase Auth
  db - // Instância do Firestore
  setupAuthListener; // Listener para mudanças de autenticação
```

### auth.js

**Responsabilidade:** Autenticação e notificações

```javascript
// Exportadas:
-registerUser() - // Cadastro com email/senha
  loginUser() - // Login com email/senha
  loginWithGoogle() - // Login social
  logoutUser() - // Logout
  getCurrentUser() - // Obter usuário atual
  showToast() - // Notificação toast
  showLoading() - // Mostrar carregamento
  hideLoading(); // Ocultar carregamento
```

### dashboard.js

**Responsabilidade:** Gerenciamento completo de tarefas

```javascript
// Exportadas:
-initializeDashboard() - // Inicializar listeners
  addTask() - // Adicionar tarefa
  editTask() - // Editar tarefa
  deleteTask() - // Deletar tarefa
  toggleTaskStatus() - // Marcar como concluída
  applyFilters() - // Aplicar filtros
  getTasks() - // Obter todas as tarefas
  getFilteredTasks() - // Obter tarefas filtradas
  getCurrentUserData(); // Obter dados do usuário
```

## 🔄 Fluxo de Autenticação

```
1. Usuário acessa login.html
2. Escolhe: Email/Senha ou Google
3. Firebase valida credenciais
4. Sessão é armazenada no localStorage
5. setupAuthListener() detecta autenticação
6. Redireciona para dashboard.html
7. Dashboard carrega dados do usuário
```

## 💾 Estrutura do Firestore

### Coleção: tasks

```
/tasks
  ├── {taskId1}
  │   ├── title: string
  │   ├── subject: string
  │   ├── description: string
  │   ├── dueDate: string (YYYY-MM-DD)
  │   ├── priority: string (high|medium|low)
  │   ├── status: string (pendente|concluída)
  │   ├── uid: string (user id do criador)
  │   ├── createdAt: timestamp
  │   └── updatedAt: timestamp
  │
  └── {taskId2}
      └── ...
```

## 🔐 Segurança

### Regras do Firestore

```firestore
match /tasks/{taskId} {
  allow read, update, delete: if request.auth.uid == resource.data.uid;
  allow create: if request.auth.uid == request.resource.data.uid;
}
```

**O que significa:**

- Usuário só pode ler suas próprias tarefas
- Usuário só pode editar suas próprias tarefas
- Usuário só pode deletar suas próprias tarefas
- Ao criar, o uid deve ser do usuário autenticado

## 🎨 Padrões CSS

### Convenção de Nomenclatura

```css
/* Componentes */
.component-name {
}

/* Estados */
.component-name.active {
}
.component-name.disabled {
}
.component-name.loading {
}

/* Modificadores */
.component-name-small {
}
.component-name-large {
}

/* Elementos Filhos */
.component-name-header {
}
.component-name-body {
}
.component-name-footer {
}
```

### Exemplo

```css
.task-card {
} /* Componente principal */
.task-card.completed {
} /* Estado */
.task-card-header {
} /* Elemento filho */
.task-card-title {
} /* Elemento filho específico */
```

### Variáveis CSS

Sempre use variáveis para:

- **Cores:** `var(--color-primary)`
- **Espaçamento:** `var(--spacing-lg)`
- **Tipografia:** `var(--transition-normal)`
- **Sombras:** `var(--shadow-lg)`

## 📱 Responsividade

### Breakpoints

```css
/* Mobile first */
/* < 480px */ /* Padrão */
/* >= 480px */ /* @media (min-width: 480px) */
/* >= 768px */ /* @media (min-width: 768px) */
/* >= 1024px */ /* @media (min-width: 1024px) */
```

### Exemplo

```css
.card {
  width: 100%; /* Mobile */
}

@media (min-width: 768px) {
  .card {
    width: 50%; /* Tablet e acima */
  }
}
```

## 🔧 Como Adicionar Novas Funcionalidades

### 1. Adicionar Nova Matéria

**arquivo:** `login.html`, `dashboard.html`

```html
<!-- Encontre os <select> e adicione -->
<option value="Nova Matéria">Nova Matéria</option>
```

### 2. Adicionar Novo Campo em Tarefa

**passo 1:** Atualizar Firestore (dashboard.js)

```javascript
// Na função addTask(), adicione:
const newTask = {
  // ... campos existentes
  novocampo: taskData.novocampo,
  // ... timestamp
};
```

**passo 2:** Atualizar Modal (dashboard.html)

```html
<div class="form-group">
  <label for="taskNovocampo">Novo Campo</label>
  <input type="text" id="taskNovocamp" />
</div>
```

**passo 3:** Atualizar Renderização (dashboard.js)

```javascript
// Na função createTaskCard()
`<p>${task.novocamp}</p>`;
```

### 3. Adicionar Novo Filtro

**passo 1:** Adicionar Select (dashboard.html)

```html
<select id="novoFiltro" onchange="applyFiltersHandler()">
  <option value="all">Todas</option>
  <option value="valor1">Valor 1</option>
  <option value="valor2">Valor 2</option>
</select>
```

**passo 2:** Atualizar applyFilters() (dashboard.js)

```javascript
export function applyFilters(filters = {}) {
  // ... código existente

  // Adicionar novo filtro
  if (filters.novoFiltro && filters.novoFiltro !== "all") {
    filteredTasks = filteredTasks.filter(
      (task) => task.campo === filters.novoFiltro,
    );
  }

  // ...
}
```

**passo 3:** Atualizar applyFiltersHandler() (dashboard.html)

```javascript
window.applyFiltersHandler = function () {
  const filters = {
    // ... existentes
    novoFiltro: document.getElementById("novoFiltro").value,
  };
  applyFilters(filters);
};
```

### 4. Adicionar Nova Validação

**Arquivo:** `auth.js`

```javascript
export async function loginUser(email, password) {
  try {
    // Adicione validação
    if (!isValidDomain(email)) {
      showToast("Use seu email institucional!", "warning");
      return false;
    }

    // ... resto da função
  }
}

// Nova função de validação
function isValidDomain(email) {
  return email.endsWith('@universidade.edu.br');
}
```

### 5. Adicionar Novo Tema

**Arquivo:** `css/style.css`

```css
/* Novo tema */
[data-theme="custom"] {
  --color-primary: #seu-cor;
  --color-bg: #sua-cor;
  /* ... etc */
}
```

**No HTML:**

```javascript
document.documentElement.setAttribute("data-theme", "custom");
```

## 🧪 Testing

### Testar Autenticação

```javascript
// Abra Console (F12) e execute:

// Verificar usuário autenticado
firebase.auth().currentUser;

// Fazer logout
firebase.auth().signOut();

// Verificar token
firebase.auth().currentUser.getIdToken();
```

### Testar Firestore

```javascript
// No Console do Firebase:
db.collection("tasks")
  .where("uid", "==", firebase.auth().currentUser.uid)
  .get()
  .then((snapshot) => console.log(snapshot.docs.map((d) => d.data())));
```

## 🚀 Performance

### Otimizações Implementadas

1. **Listeners em Tempo Real**
   - Atualiza automaticamente sem refresh
   - Reduz requisições

2. **Lazy Loading**
   - Carrega dados conforme necessário
   - Melhor experiência em conexão lenta

3. **Validação Frontend**
   - Evita requisições desnecessárias
   - Feedback imediato

4. **CSS Minificado**
   - Incluir em produção para reduzir tamanho

5. **Caching**
   - LocalStorage para preferências de tema
   - Sessão persistente

## 📊 Métricas Importantes

| Métrica               | Alvo    | Status |
| --------------------- | ------- | ------ |
| Tempo de carregamento | < 2s    | ✅     |
| Lighthouse Score      | > 90    | ✅     |
| Mobile-Friendly       | Sim     | ✅     |
| HTTPS                 | Sim     | ✅     |
| Acessibilidade        | WCAG AA | ✅     |

## 🔗 Dependências Externas

### Firebase SDK

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
```

**Versão Atual:** 12.13.0 (Verificar atualizações)

### Atualizar Firebase SDK

1. Verifique versão mais recente em:
   https://github.com/firebase/firebase-js-sdk/releases

2. Atualize os imports em todos os arquivos:

   ```javascript
   // De:
   firebase-app@12.13.0

   // Para:
   firebase-app@nova-versao
   ```

## 📝 Padrões de Código

### Variáveis

```javascript
// ✅ Bom
const userEmail = "user@example.com";
let taskCount = 0;

// ❌ Evitar
const ue = "user@example.com";
var task_count = 0;
```

### Funções

```javascript
// ✅ Bom
async function updateUserProfile(userId, newData) {
  try {
    // ... lógica
  } catch (error) {
    console.error("Erro ao atualizar:", error);
  }
}

// ❌ Evitar
function upd(id, d) {
  /* ... */
}
```

### Comentários

```javascript
// ✅ Bom - Explica o "por quê"
// Validar email antes de enviar para evitar requisições inúteis
if (isValidEmail(email)) {
  /* ... */
}

// ❌ Evitar - Óbvio
// Incrementar contador
count++;
```

## 🐛 Debug

### Ativar Logs do Firebase

```javascript
// Em firebase.js após initializeApp()
import { enableLogging } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

// Ativa logs detalhados (usar apenas em desenvolvimento)
enableLogging(true);
```

### Debugar com Console

```javascript
// Ver todas as tarefas carregadas
console.log("Tarefas:", getTasks());

// Ver tarefas filtradas
console.log("Filtradas:", getFilteredTasks());

// Ver usuário atual
console.log("Usuário:", getCurrentUserData());
```

## 📚 Recursos de Aprendizado

### Firebase

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase JavaScript SDK](https://github.com/firebase/firebase-js-sdk)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

### JavaScript

- [MDN Web Docs](https://developer.mozilla.org/)
- [ES6 Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [Async/Await](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises)

### CSS

- [CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- [Flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [Grid](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)

---

**Última atualização:** 2024
**Versão:** 1.0.0
