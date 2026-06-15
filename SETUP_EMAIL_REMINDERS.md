# 🎓 Configuração do Sistema de Lembrete de Tarefas por E-mail

Este guia explica como configurar as chaves necessárias no seu repositório do GitHub para que a rotina diária de e-mails (`daily_reminders.yml`) funcione corretamente.

---

## 🛠️ Passo 1: Gerar a Chave de Serviço do Firebase (Admin SDK)

O script que roda no GitHub Actions precisa de acesso administrativo seguro para ler as tarefas do Firestore e as informações dos usuários no Firebase Auth.

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Abra o seu projeto **UniTask**.
3. No menu lateral, clique no ícone de engrenagem ⚙️ ao lado de **Visão geral do projeto** e selecione **Configurações do projeto**.
4. Vá para a aba **Contas de serviço**.
5. Clique no botão **Gerar nova chave privada**.
6. Uma janela de confirmação será aberta. Clique em **Gerar chave**.
7. O download de um arquivo `.json` será feito automaticamente. **Guarde esse arquivo em um local seguro temporariamente e nunca o envie ao GitHub.**

---

## 📧 Passo 2: Obter a Chave de API da Resend (Serviço de E-mail)

Usaremos o Resend como provedor de envio de e-mails gratuitos (limite de 3.000 e-mails por mês).

1. Acesse o site [resend.com](https://resend.com) e crie uma conta gratuita.
2. No painel da Resend, vá na aba **API Keys** no menu esquerdo.
3. Clique em **Create API Key**.
4. Dê um nome à chave (ex: `UniTask Reminders`) e conceda a permissão **Sending access**.
5. Clique em **Add** e copie a chave gerada (ela começa com `re_...`).

*Nota:* No plano gratuito da Resend, por padrão você pode enviar e-mails de `onboarding@resend.dev` apenas para o **seu próprio e-mail cadastrado na Resend**. Caso queira enviar para outros domínios ou usar um e-mail personalizado, você pode adicionar e verificar o seu domínio próprio na aba **Domains** da Resend gratuitamente.

---

## 🔐 Passo 3: Cadastrar as Chaves no GitHub Secrets

Agora, conectaremos essas duas chaves secretas com o repositório do seu projeto no GitHub de forma segura.

1. Acesse o seu repositório do **UniTask** no GitHub.
2. Clique na aba **Settings** (Configurações) no menu superior do repositório.
3. No menu lateral esquerdo, sob a seção *Security*, clique em **Secrets and variables** e depois em **Actions**.
4. Clique no botão verde **New repository secret** no canto superior direito.

Cadastre as seguintes duas chaves:

### 1. Conta de Serviço do Firebase
* **Name**: `FIREBASE_SERVICE_ACCOUNT`
* **Secret**: Cole todo o conteúdo em texto do arquivo `.json` baixado no **Passo 1** (incluindo chaves `{}` e aspas).

### 2. Chave de API do Resend
* **Name**: `RESEND_API_KEY`
* **Secret**: Cole a chave de API que você copiou no **Passo 2** (começando com `re_...`).

---

## 🚀 Passo 4: Como Testar ou Rodar Manualmente

Uma vez configuradas as Secrets no repositório, o GitHub Actions passará a rodar automaticamente todos os dias às **08:00 (horário de Brasília)**.

Se você quiser testar o envio imediatamente sem precisar esperar o horário agendado:
1. Vá na aba **Actions** no topo do seu repositório no GitHub.
2. No menu esquerdo, clique em **Envio Diário de Lembretes UniTask**.
3. Clique no botão cinza à direita escrito **Run workflow** (Executar fluxo).
4. Selecione a branch principal (geralmente `main` ou `master`) e clique em **Run workflow**.
5. A automação começará a rodar imediatamente em alguns segundos e você poderá acompanhar o status e os logs do script.
