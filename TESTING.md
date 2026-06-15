# ✅ Guia de Testes - UniTask

## 🧪 Plano de Teste Completo

Use este guia para validar todas as funcionalidades antes de fazer deploy.

## 1️⃣ Testes de Autenticação

### 1.1 Cadastro com Email/Senha

- [ ] Abra login.html
- [ ] Clique em "Cadastro"
- [ ] Preencha email válido
- [ ] Preencha senha com 6+ caracteres
- [ ] Confirme senha (deve ser igual)
- [ ] Clique em "Criar Conta"
- [ ] Deve mostrar toast de sucesso
- [ ] Volta automaticamente para login

### 1.2 Login com Email/Senha

- [ ] Preencha email cadastrado
- [ ] Preencha senha correta
- [ ] Clique em "Entrar"
- [ ] Deve redirecionar para dashboard
- [ ] Deve mostrar nome/email no sidebar

### 1.3 Login com Google

- [ ] Clique em "Entrar com Google"
- [ ] Selecione conta Google
- [ ] Deve redirecionar para dashboard
- [ ] Deve mostrar nome Google no sidebar

### 1.4 Persistência de Sessão

- [ ] Faça login
- [ ] Feche a aba/navegador
- [ ] Abra novamente o site
- [ ] Deve estar logado automaticamente

### 1.5 Logout

- [ ] Clique em "Sair" no sidebar
- [ ] Confirme na caixa de diálogo
- [ ] Deve redirecionar para login
- [ ] Deve limpar sessão

### 1.6 Validações de Formulário

**Cadastro:**

- [ ] Email vazio → aviso
- [ ] Email inválido → aviso
- [ ] Senha vazia → aviso
- [ ] Senha < 6 caracteres → aviso
- [ ] Senhas diferentes → aviso

**Login:**

- [ ] Email vazio → aviso
- [ ] Senha vazia → aviso
- [ ] Email não cadastrado → erro
- [ ] Senha errada → erro
- [ ] Muitas tentativas → erro com espera

## 2️⃣ Testes de Tarefas

### 2.1 Adicionar Tarefa

- [ ] Clique em "➕ Adicionar Tarefa"
- [ ] Modal abre corretamente
- [ ] Preencha todos os campos obrigatórios:
  - [ ] Título
  - [ ] Matéria
  - [ ] Data de entrega (não pode ser no passado)
- [ ] Descrição (opcional)
- [ ] Prioridade (padrão: Média)
- [ ] Clique em "Salvar Tarefa"
- [ ] Toast de sucesso aparece
- [ ] Modal fecha
- [ ] Tarefa aparece na lista
- [ ] Resumo atualiza

### 2.2 Editar Tarefa

- [ ] Clique no ícone de lápis de uma tarefa
- [ ] Modal abre com dados da tarefa
- [ ] Modifique título
- [ ] Modifique matéria
- [ ] Clique em "Salvar Tarefa"
- [ ] Tarefa atualiza na lista
- [ ] Toast de sucesso aparece

### 2.3 Deletar Tarefa

- [ ] Clique no ícone X de uma tarefa
- [ ] Caixa de confirmação aparece
- [ ] Clique em OK
- [ ] Tarefa some da lista
- [ ] Toast de sucesso aparece
- [ ] Resumo atualiza

### 2.4 Marcar como Concluída

- [ ] Clique no checkbox de uma tarefa
- [ ] Tarefa recebe estilo "completed"
- [ ] Título fica com strike-through
- [ ] Opacidade reduz
- [ ] Resumo atualiza (concluídas +1)
- [ ] Clique novamente para desmarcar
- [ ] Volta ao estado normal

## 3️⃣ Testes de Filtros

### 3.1 Pesquisa

- [ ] Adicione várias tarefas com títulos diferentes
- [ ] Digite no campo "🔍 Pesquisar"
- [ ] Lista filtra em tempo real
- [ ] Pesquisa funciona para título E descrição
- [ ] Case-insensitive (maiúsculas/minúsculas)
- [ ] Apague texto → mostra todas novamente

### 3.2 Filtro por Matéria

- [ ] Crie tarefas de diferentes matérias
- [ ] Selecione uma matéria no filtro
- [ ] Mostra apenas tarefas dessa matéria
- [ ] "Todas as matérias" mostra tudo

### 3.3 Filtro por Status

- [ ] Selecione "Pendentes"
- [ ] Mostra apenas pendentes
- [ ] Selecione "Concluídas"
- [ ] Mostra apenas concluídas
- [ ] "Todos os status" mostra tudo

### 3.4 Filtro por Prioridade

- [ ] Crie tarefas com diferentes prioridades
- [ ] Selecione cada prioridade
- [ ] Mostra apenas essa prioridade
- [ ] "Todas as prioridades" mostra tudo

### 3.5 Ordenação

- [ ] "Prazo (próximo)" → ordena por data (próximo)
- [ ] "Prioridade" → Alta > Média > Baixa
- [ ] "Mais recente" → tarefas recentes primeiro

### 3.6 Combinar Filtros

- [ ] Selecione matéria + status + prioridade
- [ ] Deve aplicar todos simultaneamente
- [ ] Clique em "🔄 Limpar"
- [ ] Todos os filtros são resetados

## 4️⃣ Testes de Interface

### 4.1 Tema Claro/Escuro

- [ ] Clique no ícone de lua (tema claro)
- [ ] Interface fica com cores escuras
- [ ] Legibilidade mantida
- [ ] Ícone muda para sol
- [ ] Feche e abra → tema mantém
- [ ] Clique sol para voltar ao claro

### 4.2 Resumo de Tarefas

- [ ] Total: deve contar todas as tarefas
- [ ] Concluídas: deve contar apenas concluídas
- [ ] Pendentes: deve contar apenas pendentes
- [ ] Atrasadas: deve contar tarefas vencidas

### 4.3 Alertas Visuais

- [ ] Crie tarefa com data próxima (1-3 dias)
- [ ] Card deve ter fundo amarelado
- [ ] Mostra "Faltam X dia(s)"
- [ ] Crie tarefa vencida
- [ ] Card deve ter fundo avermelhado
- [ ] Mostra "Atrasada!"
- [ ] Animação de pulso em tarefas atrasadas

### 4.4 Sidebar Responsiva

- [ ] Desktop (>768px)
  - [ ] Sidebar fixa à esquerda
  - [ ] Menu visível
  - [ ] Usuário informações visíveis
- [ ] Tablet (768px)
  - [ ] Layout adaptado
  - [ ] Sidebar responsiva
- [ ] Mobile (<768px)
  - [ ] Sidebar colapsada/horizontal
  - [ ] Menu acessível
  - [ ] Tudo legível

### 4.5 Loading e Notificações

- [ ] Ao fazer login → loading aparece
- [ ] Ao adicionar tarefa → loading aparece
- [ ] Ao editar → loading aparece
- [ ] Ao deletar → loading aparece
- [ ] Ao logout → loading aparece
- [ ] Todas as ações mostram toast apropriado

## 5️⃣ Testes de Dados

### 5.1 Armazenamento Firestore

- [ ] Abra Firebase Console
- [ ] Vá para Firestore Database
- [ ] Coleção "tasks" existe
- [ ] Cada tarefa tem todos os campos:
  - [ ] title
  - [ ] subject
  - [ ] description
  - [ ] dueDate
  - [ ] priority
  - [ ] status
  - [ ] uid
  - [ ] createdAt
  - [ ] updatedAt

### 5.2 Isolamento de Dados

- [ ] Crie 2 contas diferentes
- [ ] Cada uma cria suas tarefas
- [ ] Userário 1 não vê tarefas do 2
- [ ] Logout de 1 e login de 2
- [ ] Vê apenas suas próprias tarefas

### 5.3 Sincronização em Tempo Real

- [ ] Abra Firestore Console em uma aba
- [ ] Abra aplicação em outra aba
- [ ] Adicione tarefa na app
- [ ] Verifique no Firestore (deve aparecer)
- [ ] Modifique documento no Firestore
- [ ] App deve atualizar em tempo real

## 6️⃣ Testes Responsivos

### 6.1 Desktop (1920x1080)

- [ ] Todos elementos visíveis
- [ ] Sidebar à esquerda
- [ ] Conteúdo bem distribuído
- [ ] Sem scroll horizontal

### 6.2 Tablet (768x1024)

- [ ] Layout adaptado
- [ ] Sem elementos cortados
- [ ] Toque funciona
- [ ] Legibilidade OK

### 6.3 Mobile (375x667)

- [ ] Sidebar colapsada
- [ ] Cards ocupam tela inteira
- [ ] Botões acessíveis (>44px)
- [ ] Sem scroll horizontal
- [ ] Toque funciona
- [ ] Tipografia legível

## 7️⃣ Testes de Segurança

### 7.1 Proteção de Rotas

- [ ] Sem autenticação → redireciona para login
- [ ] URL direto /dashboard.html → redireciona
- [ ] Sessão expirada → redireciona

### 7.2 Segurança de Dados

- [ ] Inspete dados no console
- [ ] Senhas nunca aparecem
- [ ] Email do usuário apenas seu
- [ ] Token nunca exposto

### 7.3 XSS Protection

- [ ] Digite `<script>alert('xss')</script>` em tarefa
- [ ] Não executa script
- [ ] Mostra texto escapado

## 8️⃣ Testes de Performance

### 8.1 Tempo de Carregamento

- [ ] Dashboard carrega em < 2s
- [ ] Login carrega em < 1s
- [ ] Filtros aplicam em tempo real

### 8.2 Animações Suaves

- [ ] Transições não travadas
- [ ] Loading animation fluida
- [ ] Cards aparecem com fade-in
- [ ] Modal desliza suavemente

### 8.3 Responsividade

- [ ] Resize da janela = layout adapta
- [ ] Sem lag ao arrastar
- [ ] Scroll suave

## 9️⃣ Testes de Acessibilidade

### 9.1 Teclado

- [ ] Tab funciona para navegar
- [ ] Enter ativa botões
- [ ] Esc fecha modais

### 9.2 Cores

- [ ] Contaste legível
- [ ] Não apenas cor para indicar (também ícone/texto)
- [ ] Modo alto contraste OK

### 9.3 Leitores de Tela

- [ ] Imagens têm alt text
- [ ] Botões têm labels
- [ ] Estrutura semântica HTML

## 🔟 Teste Final - Fluxo Completo

1. [ ] Abra navegador anônimo
2. [ ] Acesse site
3. [ ] Veja página inicial
4. [ ] Clique em "Começar Agora"
5. [ ] Crie nova conta
6. [ ] Vá para dashboard
7. [ ] Adicione várias tarefas
8. [ ] Aplique filtros
9. [ ] Marque como concluída
10. [ ] Edite uma tarefa
11. [ ] Delete uma tarefa
12. [ ] Mude tema
13. [ ] Faça logout
14. [ ] Faça login novamente
15. [ ] Veja tarefas persistidas
16. [ ] Redimensione janela (responsive)
17. [ ] Teste no mobile
18. [ ] Tudo funciona? ✅

## 📊 Checklist Final

### Autenticação

- [ ] Email/Senha funciona
- [ ] Google funciona
- [ ] Logout funciona
- [ ] Sessão persiste

### Tarefas

- [ ] Adicionar funciona
- [ ] Editar funciona
- [ ] Deletar funciona
- [ ] Marcar conclusão funciona

### Filtros

- [ ] Pesquisa funciona
- [ ] Filtros funcionam
- [ ] Ordenação funciona
- [ ] Combinações funcionam

### Interface

- [ ] Tema funciona
- [ ] Responsivo
- [ ] Animações suaves
- [ ] Loading/notificações

### Dados

- [ ] Firestore integrado
- [ ] Dados sincronizados
- [ ] Isolamento de usuário
- [ ] Atualizações em tempo real

### Deploy

- [ ] Configuração Firebase OK
- [ ] Domínio autorizado
- [ ] Regras Firestore corretas
- [ ] Deploy sem erros

---

**Total de Testes:** 100+
**Tempo Estimado:** 2-3 horas

Se todos os testes passarem ✅, o projeto está pronto para produção!
