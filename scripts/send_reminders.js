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

// Obter as datas dos prazos formatadas no padrão YYYY-MM-DD no fuso de Brasília
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
  
  // 1 dia antes (Amanhã)
  const d1 = new Date(now);
  d1.setDate(d1.getDate() + 1);
  const tomorrowStr = formatter.format(d1);
  
  // 3 dias antes
  const d3 = new Date(now);
  d3.setDate(d3.getDate() + 3);
  const in3DaysStr = formatter.format(d3);
  
  // 7 dias antes (1 semana)
  const d7 = new Date(now);
  d7.setDate(d7.getDate() + 7);
  const in7DaysStr = formatter.format(d7);
  
  return { todayStr, tomorrowStr, in3DaysStr, in7DaysStr };
}

// Criar Template HTML Moderno e Premium para o E-mail (Compatível com Gmail/Outlook)
function buildEmailHtml(userName, todayTasks, tomorrowTasks, overdueTasks, in3DaysTasks, in7DaysTasks) {
  const formatTaskRow = (task) => {
    // Definir as cores e fundos específicos de prioridade para modo escuro compatível
    const priorityStyles = {
      Alta: {
        border: "#ef4444",
        bg: "#2d1b1e",
        text: "#f87171"
      },
      Média: {
        border: "#f59e0b",
        bg: "#2d2415",
        text: "#fb923c"
      },
      Baixa: {
        border: "#10b981",
        bg: "#152a21",
        text: "#34d399"
      }
    };
    
    const style = priorityStyles[task.priority] || { border: "#3b82f6", bg: "#1e293b", text: "#60a5fa" };
    
    return `
      <div style="background-color: #111827; padding: 18px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #1f2937; border-left: 4px solid ${style.border};">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <h4 style="margin: 0; font-size: 15px; color: #f9fafb; font-weight: 600; font-family: sans-serif;">${task.title}</h4>
                  </td>
                  <td align="right" style="width: 80px;">
                    <span style="font-size: 10px; font-weight: bold; font-family: sans-serif; color: ${style.text}; background-color: ${style.bg}; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;">${task.priority || "Média"}</span>
                  </td>
                </tr>
              </table>
              ${task.description ? `<p style="margin: 8px 0 12px 0; font-size: 13px; color: #9ca3af; line-height: 1.5; font-family: sans-serif;">${task.description}</p>` : `<div style="height: 8px;"></div>`}
              <div style="font-size: 12px; color: #6b7280; font-family: sans-serif;">
                📅 Prazo: <strong style="color: #d1d5db;">${new Date(task.dueDate + "T00:00:00").toLocaleDateString("pt-BR")}</strong>
              </div>
            </td>
          </tr>
        </table>
      </div>
    `;
  };

  let tasksSectionHtml = "";

  if (overdueTasks.length > 0) {
    tasksSectionHtml += `
      <div style="margin: 28px 0 10px 0; font-size: 12px; font-weight: 700; color: #ef4444; letter-spacing: 0.08em; text-transform: uppercase; font-family: sans-serif;">🚨 Atrasadas (${overdueTasks.length})</div>
      <div style="height: 1px; background-color: #1f2937; margin-bottom: 14px;"></div>
      ${overdueTasks.map(formatTaskRow).join("")}
    `;
  }

  if (todayTasks.length > 0) {
    tasksSectionHtml += `
      <div style="margin: 28px 0 10px 0; font-size: 12px; font-weight: 700; color: #f59e0b; letter-spacing: 0.08em; text-transform: uppercase; font-family: sans-serif;">⚠️ Vencem Hoje (${todayTasks.length})</div>
      <div style="height: 1px; background-color: #1f2937; margin-bottom: 14px;"></div>
      ${todayTasks.map(formatTaskRow).join("")}
    `;
  }

  if (tomorrowTasks.length > 0) {
    tasksSectionHtml += `
      <div style="margin: 28px 0 10px 0; font-size: 12px; font-weight: 700; color: #3b82f6; letter-spacing: 0.08em; text-transform: uppercase; font-family: sans-serif;">📅 Vencem Amanhã / 1 Dia (${tomorrowTasks.length})</div>
      <div style="height: 1px; background-color: #1f2937; margin-bottom: 14px;"></div>
      ${tomorrowTasks.map(formatTaskRow).join("")}
    `;
  }

  if (in3DaysTasks.length > 0) {
    tasksSectionHtml += `
      <div style="margin: 28px 0 10px 0; font-size: 12px; font-weight: 700; color: #fb923c; letter-spacing: 0.08em; text-transform: uppercase; font-family: sans-serif;">⏳ Vencem em 3 Dias (${in3DaysTasks.length})</div>
      <div style="height: 1px; background-color: #1f2937; margin-bottom: 14px;"></div>
      ${in3DaysTasks.map(formatTaskRow).join("")}
    `;
  }

  if (in7DaysTasks.length > 0) {
    tasksSectionHtml += `
      <div style="margin: 28px 0 10px 0; font-size: 12px; font-weight: 700; color: #10b981; letter-spacing: 0.08em; text-transform: uppercase; font-family: sans-serif;">🔔 Vencem em 1 Semana (${in7DaysTasks.length})</div>
      <div style="height: 1px; background-color: #1f2937; margin-bottom: 14px;"></div>
      ${in7DaysTasks.map(formatTaskRow).join("")}
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
    <body style="margin: 0; padding: 0; background-color: #030712; color: #f3f4f6; -webkit-font-smoothing: antialiased; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #030712; padding: 40px 12px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #0b0f19; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
              
              <!-- Header -->
              <tr>
                <td align="center" style="background-color: #0b0f19; padding: 36px 20px 24px 20px; border-bottom: 1px solid #1f2937;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #3b82f6; font-family: sans-serif; letter-spacing: -0.02em;">UniTask 🎓</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #6b7280; font-weight: 500; font-family: sans-serif;">Organização acadêmica inteligente</p>
                </td>
              </tr>
              
              <!-- Corpo do e-mail -->
              <tr>
                <td style="padding: 36px 24px;">
                  <h2 style="margin: 0 0 10px 0; font-size: 19px; font-weight: 700; color: #ffffff; font-family: sans-serif;">Olá, ${userName}! 👋</h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; color: #9ca3af; line-height: 1.5; font-family: sans-serif;">Aqui está o resumo diário de suas atividades acadêmicas pendentes que exigem sua atenção:</p>
                  
                  ${tasksSectionHtml}
                  
                  <!-- CTA -->
                  <div align="center" style="margin-top: 36px;">
                    <a href="${appUrl}" target="_blank" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; font-family: sans-serif;">Acessar Meu Painel</a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td align="center" style="background-color: #0b0f19; padding: 24px; border-top: 1px solid #1f2937;">
                  <p style="margin: 0; font-size: 11px; color: #4b5563; font-family: sans-serif; line-height: 1.4;">Este e-mail é gerado automaticamente pelo UniTask. Não responda diretamente a esta mensagem.</p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; font-family: sans-serif;"><a href="${appUrl}" style="color: #3b82f6; text-decoration: none; font-weight: 600;">Acessar Painel do UniTask</a></p>
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
async function sendEmail(to, name, todayTasks, tomorrowTasks, overdueTasks, in3DaysTasks, in7DaysTasks) {
  const totalCount = todayTasks.length + tomorrowTasks.length + overdueTasks.length + in3DaysTasks.length + in7DaysTasks.length;
  const subject = `🎓 Lembrete UniTask: você tem ${totalCount} tarefa(s) pendente(s)`;
  const html = buildEmailHtml(name, todayTasks, tomorrowTasks, overdueTasks, in3DaysTasks, in7DaysTasks);

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
  
  const { todayStr, tomorrowStr, in3DaysStr, in7DaysStr } = getDeadlines();
  console.log(`📅 Analisando datas: Hoje=${todayStr}, Amanhã=${tomorrowStr}, Em 3 Dias=${in3DaysStr}, Em 1 Semana=${in7DaysStr}`);

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
    const userTasks = new Map(); // uid -> { today: [], tomorrow: [], overdue: [], in3Days: [], in7Days: [] }
    
    tasksSnapshot.forEach(doc => {
      const task = doc.data();
      
      // Ignorar se a tarefa estiver concluída ou não tiver UID/Prazo
      if (task.status === "concluída" || !task.uid || !task.dueDate) return;
      
      const uid = task.uid;
      
      // Inicializar agrupamento para o usuário se não existir
      if (!userTasks.has(uid)) {
        userTasks.set(uid, { today: [], tomorrow: [], overdue: [], in3Days: [], in7Days: [] });
      }
      
      const userGroup = userTasks.get(uid);
      
      if (task.dueDate === todayStr) {
        userGroup.today.push(task);
      } else if (task.dueDate === tomorrowStr) {
        userGroup.tomorrow.push(task);
      } else if (task.dueDate === in3DaysStr) {
        userGroup.in3Days.push(task);
      } else if (task.dueDate === in7DaysStr) {
        userGroup.in7Days.push(task);
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
      
      const totalCount = groups.today.length + groups.tomorrow.length + groups.overdue.length + groups.in3Days.length + groups.in7Days.length;
      
      if (totalCount > 0) {
        try {
          await sendEmail(user.email, user.displayName, groups.today, groups.tomorrow, groups.overdue, groups.in3Days, groups.in7Days);
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
