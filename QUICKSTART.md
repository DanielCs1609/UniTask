# 🎯 UniTask - Início Rápido (Quick Start)

Bem-vindo ao UniTask! Este arquivo te ajuda a começar em 10 minutos.

## 📦 O que você recebeu

Um sistema web completo e profissional de gerenciamento de tarefas acadêmicas com:

- ✅ Autenticação (Email + Google)
- ✅ Dashboard responsiva
- ✅ Gerenciamento de tarefas em tempo real
- ✅ Filtros e pesquisa
- ✅ Tema claro/escuro
- ✅ Design moderno

## ⚡ 3 Passos Rápidos

### Passo 1: Criar Projeto Firebase (5 min)

```
1. Abra https://firebase.google.com
2. Clique "Ir para console"
3. "Criar projeto" → nome "unitask"
4. Aguarde criação
5. Vá para Autenticação → ative Email/Senha e Google
6. Vá para Firestore → criar banco "Começar modo teste"
```

### Passo 2: Copiar Credenciais (2 min)

```
1. Firebase → Configurações → SDK do Firebase
2. Copie o firebaseConfig
3. Abra js/firebase.js
4. Cole seus dados em const firebaseConfig = { ... }
5. Salve
```

### Passo 3: Testar Localmente (3 min)

**Opção A - Live Server (Fácil)**

```
1. Install "Live Server" no VS Code
2. Clique direito em index.html
3. "Open with Live Server"
4. Pronto! 🎉
```

**Opção B - Firebase CLI**

```bash
npm install -g firebase-tools
firebase login
firebase serve --port 5000
# Abra http://localhost:5000
```

## 📁 Estrutura do Projeto

```
UniTask/
├── index.html           ← Página inicial
├── login.html           ← Login/Cadastro
├── dashboard.html       ← Painel principal
│
├── css/
│   └── style.css        ← Estilos (completo + responsivo)
│
├── js/
│   ├── firebase.js      ← Configuração Firebase
│   ├── auth.js          ← Autenticação
│   └── dashboard.js     ← Tarefas
│
├── README.md            ← Documentação completa
├── SETUP.md             ← Setup detalhado
├── ARCHITECTURE.md      ← Arquitetura técnica
├── TESTING.md           ← Guia de testes
└── package.json         ← Dependências
```

## 🚀 Deploy em 2 Minutos

```bash
# Após testar localmente e confirmar que tudo funciona:

firebase login
firebase deploy --only hosting

# Sua URL: https://seu-projeto-id.firebaseapp.com
```

## ✨ Funcionalidades (Checklist)

Autenticação:

- [x] Cadastro com email/senha
- [x] Login com email/senha
- [x] Login com Google
- [x] Logout
- [x] Sessão persistente

Tarefas:

- [x] Adicionar tarefa
- [x] Editar tarefa
- [x] Deletar tarefa
- [x] Marcar como concluída

Filtros:

- [x] Pesquisa por título
- [x] Filtro por matéria
- [x] Filtro por status
- [x] Filtro por prioridade
- [x] Ordenação por prazo

Interface:

- [x] Dashboard responsiva
- [x] Tema claro/escuro
- [x] Animações
- [x] Notificações
- [x] Mobile-friendly

## 🎨 Temas Disponíveis

**Modo Claro:**

- Fundo branco
- Textos escuros
- Ideal para dia

**Modo Escuro:**

- Fundo azul-marinho
- Textos claros
- Ideal para noite

Mude clicando no ícone lua/sol! 🌙☀️

## 🔐 Segurança Incluída

- ✅ Cada usuário vê apenas suas tarefas
- ✅ Senhas criptografadas
- ✅ Regras Firestore por usuário
- ✅ Validação frontend
- ✅ Proteção contra XSS

## 📱 Responsivo

- ✅ Desktop: Layout completo
- ✅ Tablet: Adaptado
- ✅ Mobile: Otimizado

Teste redimensionando a janela!

## 🆘 Problemas Comuns

### "Firebase não configurado"

→ Verificar if `js/firebase.js` tem suas credenciais

### "Login com Google não funciona"

→ Adicionar `localhost:5000` em Autenticação → Domínios autorizados

### "Tarefas não salvam"

→ Verificar if Firestore está criado
→ Verificar if regras estão corretas

### "Erro 404 após deploy"

→ Executar `firebase deploy` novamente
→ Limpar cache do navegador

## 📚 Próximas Leituras

| Arquivo         | Para quem              | Tempo     |
| --------------- | ---------------------- | --------- |
| README.md       | Documentação completa  | 20 min    |
| SETUP.md        | Configuração detalhada | 30 min    |
| ARCHITECTURE.md | Entender o código      | 40 min    |
| TESTING.md      | Testar tudo            | 2-3 horas |

## 🎓 Para Portfólio

**O que incluir:**

1. Link do deploy
2. Screenshot do dashboard
3. Gif de funcionalidades
4. Explicação breve no README
5. Link para código (GitHub)

**Texto para portfólio:**

```
UniTask - Sistema web de gerenciamento de tarefas acadêmicas
Desenvolvido em: HTML, CSS, JavaScript, Firebase
Funcionalidades: Autenticação, CRUD de tarefas, filtros, tema claro/escuro
Demo: https://seu-projeto-id.firebaseapp.com
GitHub: https://github.com/seu-usuario/unitask
```

## 💡 Dicas Importantes

1. **Backup de Dados:**
   - Firebase faz backup automático
   - Exporte dados regularmente no console

2. **Melhorias Futuras:**
   - Compartilhar tarefas em grupo
   - Notificações por email
   - Exportar para PDF
   - Integração com Google Calendar

3. **Otimizações:**
   - Minificar CSS/JS em produção
   - Usar service workers para PWA
   - Implementar analytics

## 📞 Links Úteis

| Link                                        | O que é          |
| ------------------------------------------- | ---------------- |
| https://console.firebase.google.com         | Console Firebase |
| https://firebase.google.com/docs            | Documentação     |
| https://github.com/firebase/firebase-js-sdk | SDK Firebase     |
| https://developer.mozilla.org               | Documentação Web |

## ✅ Você está pronto!

Se chegou até aqui, você tem tudo para:

- ✅ Rodar localmente
- ✅ Fazer deploy
- ✅ Mostrar no portfólio
- ✅ Continuar desenvolvendo

**Próximo passo?** Abra o SETUP.md para instruções completas!

---

**Dúvidas?** Verifique:

1. Arquivo correto está configurado?
2. Projeto Firebase criado?
3. Credenciais copiadas?
4. Domínio autorizado?

**Boa sorte! 🚀**

---

**Versão:** 1.0.0
**Última atualização:** 2024
**Status:** Pronto para Produção ✅
