import admin from "firebase-admin";
import { Resend } from "resend";
import nodemailer from "nodemailer";

// ============================================
// Configuração do Fuso Horário de Brasília
// ============================================
const TIMEZONE = "America/Sao_Paulo";

// Inicializar Firebase Admin SDK
function initFirebase() {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error("Erro: A variável de ambiente FIREBASE_SERVICE_ACCOUNT não foi configurada.");
  }
  
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin inicializado com sucesso.");
  } catch (error) {
    console.error("❌ Erro ao inicializar o Firebase Admin:");
    console.error(error);
    process.exit(1);
  }
}

// Obter as datas de Hoje e Amanhã formatadas no padrão YYYY-MM-DD no fuso de Brasília
function getDeadlines() {
  const now = new Date();
  
  // Formatador nativo para garantir o fuso horário correto
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  
  const todayStr = formatter.format(now);
  
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatter.format(tomorrow);
  
  return { todayStr, tomorrowStr };
}

// Criar Template HTML Moderno e Premium para o E-mail
function buildEmailHtml(userName, todayTasks, tomorrowTasks, overdueTasks) {
  const formatTaskRow = (task) => {
    const priorityColors = {
      Alta: "#ef4444",
      Média: "#f59e0b",
      Baixa: "#10b981"
    };
    const pColor = priorityColors[task.priority] || "#3b82f6";
    
    return `
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 12px; border-left: 4px solid ${pColor}; border: 1px solid rgba(255, 255, 255, 0.05); border-left: 4px solid ${pColor};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
          <h4 style="margin: 0; font-size: 16px; color: #f8fafc; font-weight: 600;">${task.title}</h4>
          <span style="font-size: 11px; font-weight: 700; color: #ffffff; background-color: ${pColor}; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">${task.priority || "Normal"}</span>
        </div>
        ${task.description ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #94a3b8; line-height: 1.4;">${task.description}</p>` : ""}
        <div style="font-size: 12px; color: #64748b;">
          📅 Prazo: <strong style="color: #cbd5e1;">${new Date(task.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
        </div>
      </div>
    `;
  };

  let tasksSectionHtml = "";

  if (overdueTasks.length > 0) {
    tasksSectionHtml += `
      <h3 style="color: #ef4444; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 12px 0; border-bottom: 1px solid rgba(239, 68, 68, 0.2); padding-bottom: 6px;">🚨 Atrasadas (${overdueTasks.length})</h3>
      ${overdueTasks.map(formatTaskRow).join("")}
    `;
  }

  if (todayTasks.length > 0) {
    tasksSectionHtml += `
      <h3 style="color: #f59e0b; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 12px 0; border-bottom: 1px solid rgba(245, 158, 11, 0.2); padding-bottom: 6px;">⚠️ Vencem Hoje (${todayTasks.length})</h3>
      ${todayTasks.map(formatTaskRow).join("")}
    `;
  }

  if (tomorrowTasks.length > 0) {
    tasksSectionHtml += `
      <h3 style="color: #3b82f6; font-size: 16px; text-transform: uppercase; letter-spacing: 0.05em; margin: 24px 0 12px 0; border-bottom: 1px solid rgba(59, 130, 246, 0.2); padding-bottom: 6px;">📅 Vencem Amanhã (${tomorrowTasks.length})</h3>
      ${tomorrowTasks.map(formatTaskRow).join("")}
    `;
  }

  const appUrl = process.env.APP_URL || "https://unitask-app-94edc.web.app";

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lembrete UniTask</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0f172a; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0b0f19; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #1e293b 0%, #0b0f19 100%); padding: 32px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.025em; background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #3b82f6;">UniTask 🎓</h1>
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #94a3b8; font-weight: 500;">Organização acadêmica inteligente</p>
                </td>
              </tr>
              
              <!-- Corpo do e-mail -->
              <tr>
                <td style="padding: 32px 24px;">
                  <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #f8fafc;">Olá, ${userName}! 👋</h2>
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #94a3b8; line-height: 1.5;">Aqui está o resumo diário de suas atividades acadêmicas pendentes que exigem sua atenção:</p>
                  
                  ${tasksSectionHtml}
                  
                  <!-- CTA -->
                  <div align="center" style="margin-top: 36px;">
                    <a href="${appUrl}" target="_blank" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.25);">Acessar Meu Painel</a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #0b0f19; padding: 24px; border-top: 1px solid rgba(255, 255, 255, 0.03);">
                  <p style="margin: 0; font-size: 12px; color: #475569;">Este e-mail é gerado automaticamente pelo UniTask. Não responda diretamente a esta mensagem.</p>
                  <p style="margin: 6px 0 0 0; font-size: 12px; color: #3b82f6;"><a href="${appUrl}" style="color: #3b82f6; text-decoration: none;">Visitar site</a></p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Enviar e-mail usando Resend ou SMTP
async function sendEmail(to, name, todayTasks, tomorrowTasks, overdueTasks) {
  const totalCount = todayTasks.length + tomorrowTasks.length + overdueTasks.length;
  const subject = `🎓 Lembrete UniTask: você tem ${totalCount} tarefa(s) pendente(s)`;
  const html = buildEmailHtml(name, todayTasks, tomorrowTasks, overdueTasks);

  // 1. Tentar usar SMTP se configurado
  if (process.env.SMTP_HOST) {
    console.log(`🌐 Enviando e-mail via SMTP para: ${to}`);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"UniTask Lembretes" <noreply@unitask.com>',
      to,
      subject,
      html
    });
    console.log(`✅ E-mail enviado com sucesso via SMTP para ${to}`);
    return;
  }

  // 2. Tentar usar Resend se configurado
  if (process.env.RESEND_API_KEY) {
    console.log(`📨 Enviando e-mail via Resend para: ${to}`);
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromAddress = process.env.RESEND_FROM || "UniTask Lembretes <onboarding@resend.dev>";
    
    const response = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html
    });

    if (response.error) {
      throw new Error(`Erro na API Resend: ${response.error.message}`);
    }

    console.log(`✅ E-mail enviado com sucesso via Resend para ${to}. ID: ${response.data?.id}`);
    return;
  }

  throw new Error("Erro: Nenhuma credencial de envio configurada (SMTP_HOST ou RESEND_API_KEY).");
}

// Execução Principal do Script
async function main() {
  initFirebase();
  const db = admin.firestore();
  
  const { todayStr, tomorrowStr } = getDeadlines();
  console.log(`📅 Analisando datas: Hoje=${todayStr}, Amanhã=${tomorrowStr}`);

  try {
    // 1. Obter todos os usuários cadastrados no Firebase Auth
    console.log("👥 Buscando usuários cadastrados...");
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users;
    
    if (users.length === 0) {
      console.log("ℹ️ Nenhum usuário encontrado no sistema.");
      process.exit(0);
    }
    
    // Mapear usuários por ID para acesso rápido
    const userMap = new Map();
    users.forEach(u => {
      if (u.email) {
        userMap.set(u.uid, {
          email: u.email,
          displayName: u.displayName || u.email.split("@")[0]
        });
      }
    });
    
    // 2. Obter todas as tarefas do Firestore
    console.log("📋 Buscando tarefas do Firestore...");
    const tasksSnapshot = await db.collection("tasks").get();
    
    // Organizar as tarefas por UID do usuário
    const userTasks = new Map(); // uid -> { today: [], tomorrow: [], overdue: [] }
    
    tasksSnapshot.forEach(doc => {
      const task = doc.data();
      
      // Ignorar se a tarefa estiver concluída ou não tiver UID/Prazo
      if (task.status === "concluída" || !task.uid || !task.dueDate) return;
      
      const uid = task.uid;
      
      // Inicializar agrupamento para o usuário se não existir
      if (!userTasks.has(uid)) {
        userTasks.set(uid, { today: [], tomorrow: [], overdue: [] });
      }
      
      const userGroup = userTasks.get(uid);
      
      if (task.dueDate === todayStr) {
        userGroup.today.push(task);
      } else if (task.dueDate === tomorrowStr) {
        userGroup.tomorrow.push(task);
      } else if (task.dueDate < todayStr) {
        userGroup.overdue.push(task);
      }
    });

    // 3. Processar e enviar e-mails para cada usuário com tarefas relevantes
    console.log("✉️ Processando envios...");
    let sentCount = 0;
    
    for (const [uid, groups] of userTasks.entries()) {
      const user = userMap.get(uid);
      
      if (!user) {
        console.log(`⚠️ Alerta: Encontradas tarefas para UID ${uid}, mas o usuário não foi encontrado no Firebase Auth.`);
        continue;
      }
      
      const totalCount = groups.today.length + groups.tomorrow.length + groups.overdue.length;
      
      if (totalCount > 0) {
        try {
          await sendEmail(user.email, user.displayName, groups.today, groups.tomorrow, groups.overdue);
          sentCount++;
        } catch (emailError) {
          console.error(`❌ Erro ao enviar e-mail para ${user.email}:`, emailError.message);
        }
      }
    }
    
    console.log(`🏁 Processamento finalizado. Total de e-mails enviados: ${sentCount}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro fatal durante a execução:");
    console.error(error);
    process.exit(1);
  }
}

main();
