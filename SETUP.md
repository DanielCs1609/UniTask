# 🚀 Guia de Setup do UniTask

Este guia fornece instruções passo-a-passo para configurar e fazer deploy do UniTask.

## 📋 Pré-requisitos

1. **Conta Google** - para criar projeto Firebase
2. **Node.js + npm** - para Firebase CLI (optional)
3. **Navegador moderno** - Chrome, Firefox, Safari ou Edge
4. **Editor de código** - VS Code recomendado

## 🔧 PASSO 1: Criar Projeto Firebase

### 1.1 Acessar Firebase Console

1. Abra https://firebase.google.com
2. Clique em "Ir para console" ou https://console.firebase.google.com
3. Faça login com sua conta Google

### 1.2 Criar Novo Projeto

1. Clique em "Criar projeto"
2. Digite o nome do projeto (ex: "unitask-app")
3. Deixe as opções padrão
4. Clique em "Criar projeto"
5. Aguarde a criação (~1-2 minutos)

## 🔐 PASSO 2: Configurar Autenticação

### 2.1 Habilitar Email/Senha

1. No menu lateral, clique em **Construção → Autenticação**
2. Clique na aba **Provedores**
3. Clique em **Email/Senha**
4. Ative o primeiro toggle (Email/Senha)
5. Clique em **Salvar**

### 2.2 Habilitar Google Sign-In

1. Em **Provedores**, clique em **Google**
2. Ative o primeiro toggle
3. Preencha:
   - **Nome do projeto:** (preenchido automaticamente)
   - **Email de suporte:** seu@email.com
4. Clique em **Salvar**
5. Volte e abra **Google** novamente
6. Clique em **Web SDK configuration**
7. Note o seu **Web Client ID** e **Web Client Secret** (vamos precisar depois)

### 2.3 Adicionar Domínios Autorizados

1. Em **Autenticação → Configurações**
2. Procure por **Domínios autorizados**
3. Clique em **Adicionar domínio**
4. Adicione os seguintes domínios:
   ```
   localhost:5000
   localhost:8080
   localhost:3000
   seu-projeto-id.firebaseapp.com
   ```
5. Clique em **Adicionar**

## 💾 PASSO 3: Configurar Firestore Database

### 3.1 Criar Database

1. No menu, vá para **Construção → Firestore Database**
2. Clique em **Criar banco de dados**
3. Selecione:
   - **Modo de início:** Começar em modo de teste
   - **Localização:** america-south1 (ou sua região)
4. Clique em **Criar**
5. Aguarde a criação

### 3.2 Atualizar Regras de Segurança

1. Em **Firestore Database**, vá para aba **Regras**
2. Apague o conteúdo existente
3. Cole este código:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para tarefas
    match /tasks/{taskId} {
      // Permitir leitura/escrita apenas do proprietário
      allow read, update, delete: if request.auth != null && request.auth.uid == resource.data.uid;

      // Permitir criação com uid do usuário
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

4. Clique em **Publicar**

## 🔑 PASSO 4: Obter Credenciais Firebase

### 4.1 Acessar Configurações do Projeto

1. No console Firebase, clique no ícone de **engrenagem** (Configurações)
2. Selecione **Configurações do projeto**

### 4.2 Copiar Firebase Config

1. Procure por **Seus aplicativos** ou **SDK do Firebase para web**
2. Copie o objeto `firebaseConfig` completo
3. Deve parecer assim:

```javascript
{
  apiKey: "AIzaSy...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc...",
  measurementId: "G-XXXXX"
}
```

## ⚙️ PASSO 5: Configurar Aplicação

### 5.1 Atualizar firebase.js

1. Abra o arquivo `js/firebase.js`
2. Encontre a seção `firebaseConfig`
3. Substitua pelos seus dados copiados:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy_SEU_API_KEY_AQUI",
  authDomain: "seu-projeto-id.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX",
};
```

4. Salve o arquivo
5. Remova as linhas de comentário de exemplo

### 5.2 Atualizar .firebaserc

1. Abra `.firebaserc`
2. Substitua `"seu-projeto-id"` pelo seu ID real:

```json
{
  "projects": {
    "default": "unitask-app-12345"
  }
}
```

3. Salve o arquivo

## 🧪 PASSO 6: Testar Localmente

### Opção A: Com Live Server (Recomendado para Iniciantes)

**VS Code:**

1. Instale a extensão "Live Server"
2. Na raiz do projeto, clique com botão direito em `index.html`
3. Selecione "Open with Live Server"
4. Uma aba abrirá automaticamente em `http://127.0.0.1:5500`

**Teste:**

1. Clique em "Começar Agora"
2. Crie uma conta nova
3. Adicione uma tarefa
4. Verifique se aparece no Firestore

### Opção B: Com Firebase CLI (Recomendado para Deploy)

**1. Instalar Firebase CLI**

```bash
npm install -g firebase-tools
```

**2. Login**

```bash
firebase login
```

**3. Iniciar servidor local**

```bash
# Na pasta do projeto
firebase serve --host 0.0.0.0 --port 5000
```

**4. Acessar**

- Abra: http://localhost:5000

**5. Parar servidor**

- Pressione `CTRL + C` no terminal

## ✅ Testar Funcionalidades

### Checklist de Teste

- [ ] Página inicial carrega
- [ ] Login com email funciona
- [ ] Cadastro com validação funciona
- [ ] Login com Google funciona
- [ ] Dashboard carrega após login
- [ ] Adicionar tarefa funciona
- [ ] Editar tarefa funciona
- [ ] Deletar tarefa funciona
- [ ] Marcar como concluída funciona
- [ ] Filtros funcionam
- [ ] Pesquisa funciona
- [ ] Tema claro/escuro funciona
- [ ] Responsivo no mobile
- [ ] Logout funciona

## 🚀 PASSO 7: Fazer Deploy no Firebase Hosting

### 7.1 Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 7.2 Login no Firebase

```bash
firebase login
```

Você será aberto uma janela do navegador. Autorize a CLI do Firebase.

### 7.3 Inicializar Projeto (primeira vez)

```bash
cd caminho/para/UniTask
firebase init hosting
```

Respostas recomendadas:

- **Qual é o seu diretório público?** → `.` (ponto)
- **Configurar como single-page app?** → `y` (sim)
- **Sobrescrever index.html?** → `N` (não)

### 7.4 Fazer Deploy

```bash
firebase deploy --only hosting
```

Aguarde. Você verá a URL: `https://seu-projeto-id.firebaseapp.com`

## 🌐 Após Deploy

### Verificar Aplicação

1. Abra a URL de deploy fornecida
2. Teste todas as funcionalidades
3. Verifique no mobile

### Compartilhar

- Cole a URL em seu portfólio
- Compartilhe com amigos/professores
- Use para demonstrações

## 🔍 Verificar no Firestore

1. No Firebase Console, vá para **Firestore Database**
2. Procure por coleção **tasks**
3. Você deve ver suas tarefas criadas
4. Cada tarefa deve ter:
   - `title`
   - `subject`
   - `description`
   - `dueDate`
   - `priority`
   - `status`
   - `uid`
   - `createdAt`
   - `updatedAt`

## 🐛 Solução de Problemas

### "Erro: Firebase não está configurado"

**Solução:**

- Verifique se copiou corretamente para `js/firebase.js`
- Confirme que não há erros de digitação
- Abra Console (F12) e procure por erros

### "Erro ao fazer login com Google"

**Solução:**

- Verifique se você adicionou o domínio em **Autenticação → Configurações**
- Para localhost: adicione `localhost:5000`
- Aguarde alguns minutos após adicionar o domínio

### "Tarefas não salvam"

**Solução:**

- Verifique regras do Firestore
- Abra Console (F12) → Aba **Network** → procure por erro
- Confirme que o Firestore está criado
- Verifique se seu UID está correto

### "Página em branco após deploy"

**Solução:**

- Verifique arquivo `firebase.json`
- Limpe cache do navegador (CTRL+SHIFT+DEL)
- Tente novamente em aba anônima

### "Erro 404 após deploy"

**Solução:**

- Verifique `firebase.json`
- Certifique-se de que existe `index.html` na raiz
- Execute `firebase deploy --only hosting` novamente

## 📞 Suporte Rápido

### Comandos Úteis Firebase

```bash
# Ver qual projeto está configurado
firebase projects:list

# Mudar projeto
firebase use seu-projeto-id

# Ver logs
firebase functions:log

# Redeploy
firebase deploy

# Limpar cache
firebase cache:clear
```

### Links Úteis

- [Firebase Console](https://console.firebase.google.com)
- [Documentação Firebase](https://firebase.google.com/docs)
- [Stack Overflow Firebase](https://stackoverflow.com/questions/tagged/firebase)

## ✨ Pronto!

Seu UniTask está configurado e pronto para usar! 🎉

### Próximos Passos

1. Customize as cores e matérias
2. Adicione mais validações se quiser
3. Implemente recursos adicionais
4. Compartilhe com amigos
5. Use no seu portfólio

---

**Dúvidas?** Consulte o README.md para mais informações!
