// ============================================
// Dashboard Module - Gerenciamento de Tarefas e Matérias
// ============================================

import {
  collection,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import { db, setupAuthListener } from "./firebase.js";
import { showToast, showLoading, hideLoading } from "./auth.js";

// ============================================
// Configuração Global
// ============================================

let currentUser = null;
let tasks = [];
let filteredTasks = [];
let subjects = [];
let subjectsLoaded = false;
let unsubscribeTasks = null;
let unsubscribeSubjects = null;

let productivityChartInstance = null;
let distributionChartInstance = null;
let calendarDate = new Date();
let selectedCalendarDay = null; // "YYYY-MM-DD"

const tasksCollection = collection(db, "tasks");

const DEFAULT_FILTERS = {
  search: "",
  subject: "all",
  status: "all",
  priority: "all",
  sort: "dueDate"
};

let activeFilters = { ...DEFAULT_FILTERS };

const DEFAULT_SUBJECT_COLOR = "#3b82f6";
const DEFAULT_SUBJECT_ICON = "fa-regular fa-folder";
const UNCATEGORIZED_SUBJECT = {
  id: "",
  name: "Sem categoria",
  normalizedName: "sem categoria",
  color: "#64748b",
  icon: "fa-regular fa-folder-open"
};

const ALLOWED_SUBJECT_ICONS = new Set([
  "fa-regular fa-folder",
  "fa-solid fa-book-open",
  "fa-solid fa-briefcase",
  "fa-solid fa-graduation-cap",
  "fa-solid fa-code",
  "fa-solid fa-user",
  "fa-solid fa-users",
  "fa-solid fa-church",
  "fa-solid fa-bullseye",
  "fa-solid fa-pen-nib",
  "fa-solid fa-flask",
  "fa-solid fa-layer-group"
]);

// ============================================
// Inicializar Listeners de Autenticação
// ============================================

export function initializeDashboard(authCallback) {
  setupAuthListener((user) => {
    cleanupFirestoreListeners();

    currentUser = user;
    tasks = [];
    filteredTasks = [];
    subjects = [];
    subjectsLoaded = false;
    activeFilters = { ...DEFAULT_FILTERS };

    if (user) {
      console.log("Usuário autenticado:", user.email);
      setupSubjectsListener();
      setupTasksListener();
    } else {
      updateSummary();
      renderSubjectOptions();
      renderSubjectsList();
      renderTasks();
    }

    authCallback(user);
  });
}

function cleanupFirestoreListeners() {
  if (unsubscribeTasks) {
    unsubscribeTasks();
    unsubscribeTasks = null;
  }

  if (unsubscribeSubjects) {
    unsubscribeSubjects();
    unsubscribeSubjects = null;
  }

  if (productivityChartInstance) {
    productivityChartInstance.destroy();
    productivityChartInstance = null;
  }
  if (distributionChartInstance) {
    distributionChartInstance.destroy();
    distributionChartInstance = null;
  }
}

// ============================================
// LISTENERS EM TEMPO REAL DO FIRESTORE
// ============================================

function setupTasksListener() {
  if (!currentUser) return;

  const q = query(tasksCollection, where("uid", "==", currentUser.uid));

  unsubscribeTasks = onSnapshot(q, (snapshot) => {
    tasks = [];
    snapshot.forEach((docSnapshot) => {
      tasks.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
      });
    });

    console.log("Tarefas carregadas:", tasks.length);

    updateSummary();
    renderSubjectsList();
    renderCalendar();
    renderNotificationsAndDeadlines();
    renderCharts();
    applyFilters(activeFilters);
  }, (error) => {
    console.error("Erro ao carregar tarefas:", error);
    showToast("Erro ao carregar tarefas: " + error.message, "error");
  });
}

function setupSubjectsListener() {
  if (!currentUser) return;

  const subjectsCollection = getSubjectsCollectionRef();

  unsubscribeSubjects = onSnapshot(subjectsCollection, (snapshot) => {
    subjects = [];
    snapshot.forEach((docSnapshot) => {
      subjects.push({
        id: docSnapshot.id,
        ...docSnapshot.data()
      });
    });

    subjects.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    subjectsLoaded = true;

    console.log("Matérias carregadas:", subjects.length);

    renderSubjectOptions();
    renderSubjectsList();
    applyFilters(activeFilters);
  }, (error) => {
    subjectsLoaded = true;
    console.error("Erro ao carregar matérias:", error);
    showToast("Erro ao carregar matérias: " + error.message, "error");
    renderSubjectOptions();
    renderSubjectsList();
  });
}

// ============================================
// CRUD DE MATÉRIAS / CATEGORIAS
// ============================================

export async function addSubject(subjectData) {
  try {
    if (!currentUser) {
      showToast("Você não está autenticado!", "error");
      return false;
    }

    const preparedSubject = prepareSubjectData(subjectData);
    if (!preparedSubject) return false;

    const subjectId = createSubjectId(preparedSubject.normalizedName);
    const subjectRef = getSubjectDocRef(subjectId);
    const existingSubject = await getDoc(subjectRef);

    if (existingSubject.exists()) {
      showToast("Já existe uma matéria com esse nome.", "warning");
      return false;
    }

    showLoading("Salvando matéria...");

    await setDoc(subjectRef, {
      ...preparedSubject,
      uid: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    hideLoading();
    showToast("Matéria criada com sucesso!", "success");
    return true;
  } catch (error) {
    hideLoading();
    showToast("Erro ao criar matéria: " + error.message, "error");
    console.error("Erro:", error);
    return false;
  }
}

export async function editSubject(subjectId, subjectData) {
  try {
    if (!currentUser) {
      showToast("Você não está autenticado!", "error");
      return false;
    }

    const currentSubject = getSubjectById(subjectId);
    if (!currentSubject) {
      showToast("Matéria não encontrada.", "error");
      return false;
    }

    const preparedSubject = prepareSubjectData(subjectData);
    if (!preparedSubject) return false;

    const newSubjectId = createSubjectId(preparedSubject.normalizedName);
    const oldSubjectRef = getSubjectDocRef(subjectId);
    const newSubjectRef = getSubjectDocRef(newSubjectId);

    if (newSubjectId !== subjectId) {
      const existingSubject = await getDoc(newSubjectRef);
      if (existingSubject.exists()) {
        showToast("Já existe uma matéria com esse nome.", "warning");
        return false;
      }
    }

    showLoading("Atualizando matéria...");

    const batch = writeBatch(db);
    const subjectPayload = {
      ...preparedSubject,
      uid: currentUser.uid,
      updatedAt: serverTimestamp()
    };

    if (newSubjectId !== subjectId) {
      batch.set(newSubjectRef, {
        ...subjectPayload,
        createdAt: currentSubject.createdAt || serverTimestamp()
      });
      batch.delete(oldSubjectRef);
    } else {
      batch.update(oldSubjectRef, subjectPayload);
    }

    await batch.commit();

    const affectedTasks = tasks.filter((task) => taskBelongsToSubject(task, currentSubject));
    await updateTaskSubjects(affectedTasks, {
      subjectId: newSubjectId,
      subject: preparedSubject.name,
      subjectColor: preparedSubject.color,
      subjectIcon: preparedSubject.icon,
      updatedAt: serverTimestamp()
    });

    hideLoading();
    showToast("Matéria atualizada com sucesso!", "success");
    return true;
  } catch (error) {
    hideLoading();
    showToast("Erro ao editar matéria: " + error.message, "error");
    console.error("Erro:", error);
    return false;
  }
}

export async function deleteSubject(subjectId) {
  try {
    if (!currentUser) {
      showToast("Você não está autenticado!", "error");
      return false;
    }

    const subject = getSubjectById(subjectId);
    if (!subject) {
      showToast("Matéria não encontrada.", "error");
      return false;
    }

    showLoading("Excluindo matéria...");

    await deleteDoc(getSubjectDocRef(subjectId));

    const affectedTasks = tasks.filter((task) => taskBelongsToSubject(task, subject));
    await updateTaskSubjects(affectedTasks, {
      subjectId: "",
      subject: UNCATEGORIZED_SUBJECT.name,
      subjectColor: UNCATEGORIZED_SUBJECT.color,
      subjectIcon: UNCATEGORIZED_SUBJECT.icon,
      updatedAt: serverTimestamp()
    });

    if (activeFilters.subject === subjectId) {
      activeFilters.subject = "all";
      const subjectFilter = document.getElementById("subjectFilter");
      if (subjectFilter) subjectFilter.value = "all";
    }

    hideLoading();
    showToast("Matéria excluída com sucesso!", "success");
    return true;
  } catch (error) {
    hideLoading();
    showToast("Erro ao excluir matéria: " + error.message, "error");
    console.error("Erro:", error);
    return false;
  }
}

async function updateTaskSubjects(taskList, updates) {
  if (taskList.length === 0) return;

  for (let i = 0; i < taskList.length; i += 450) {
    const batch = writeBatch(db);
    const taskChunk = taskList.slice(i, i + 450);

    taskChunk.forEach((task) => {
      batch.update(doc(db, "tasks", task.id), updates);
    });

    await batch.commit();
  }
}

// ============================================
// ADICIONAR NOVA TAREFA
// ============================================

export async function addTask(taskData) {
  try {
    if (!currentUser) {
      showToast("Você não está autenticado!", "error");
      return false;
    }

    const validatedTask = validateTaskData(taskData);
    if (!validatedTask) return false;

    showLoading("Adicionando tarefa...");

    const newTask = {
      ...validatedTask,
      status: "pendente",
      uid: currentUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await addDoc(tasksCollection, newTask);

    hideLoading();
    showToast("Tarefa adicionada com sucesso!", "success");
    return true;
  } catch (error) {
    hideLoading();
    showToast("Erro ao adicionar tarefa: " + error.message, "error");
    console.error("Erro:", error);
    return false;
  }
}

// ============================================
// EDITAR TAREFA
// ============================================

export async function editTask(taskId, updates) {
  try {
    if (!currentUser) {
      showToast("Você não está autenticado!", "error");
      return false;
    }

    const validatedTask = validateTaskData(updates, { partial: true });
    if (!validatedTask) return false;

    showLoading("Atualizando tarefa...");

    const taskRef = doc(db, "tasks", taskId);

    await updateDoc(taskRef, {
      ...validatedTask,
      updatedAt: serverTimestamp()
    });

    hideLoading();
    showToast("Tarefa atualizada com sucesso!", "success");
    return true;
  } catch (error) {
    hideLoading();
    showToast("Erro ao editar tarefa: " + error.message, "error");
    console.error("Erro:", error);
    return false;
  }
}

// ============================================
// DELETAR TAREFA
// ============================================

export async function deleteTask(taskId) {
  try {
    if (!currentUser) {
      showToast("Você não está autenticado!", "error");
      return false;
    }

    showLoading("Deletando tarefa...");

    const taskRef = doc(db, "tasks", taskId);
    await deleteDoc(taskRef);

    hideLoading();
    showToast("Tarefa deletada com sucesso!", "success");
    return true;
  } catch (error) {
    hideLoading();
    showToast("Erro ao deletar tarefa: " + error.message, "error");
    console.error("Erro:", error);
    return false;
  }
}

// ============================================
// MARCAR COMO CONCLUÍDO/PENDENTE
// ============================================

export async function toggleTaskStatus(taskId, currentStatus) {
  const newStatus = currentStatus === "concluída" ? "pendente" : "concluída";
  return editTask(taskId, { status: newStatus });
}

// ============================================
// APLICAR FILTROS E PESQUISA
// ============================================

export function applyFilters(filters = activeFilters) {
  activeFilters = {
    ...activeFilters,
    ...filters
  };

  filteredTasks = [...tasks];

  if (activeFilters.dueDate) {
    filteredTasks = filteredTasks.filter((task) => task.dueDate === activeFilters.dueDate);
  }

  if (activeFilters.subject && activeFilters.subject !== "all") {
    const selectedSubject = getSubjectById(activeFilters.subject);
    filteredTasks = filteredTasks.filter((task) => {
      if (task.subjectId === activeFilters.subject) return true;
      return selectedSubject ? taskBelongsToSubject(task, selectedSubject) : false;
    });
  }

  if (activeFilters.status && activeFilters.status !== "all") {
    filteredTasks = filteredTasks.filter((task) => task.status === activeFilters.status);
  }

  if (activeFilters.priority && activeFilters.priority !== "all") {
    filteredTasks = filteredTasks.filter((task) => task.priority === activeFilters.priority);
  }

  if (activeFilters.search && activeFilters.search.trim() !== "") {
    const searchLower = activeFilters.search.toLowerCase();
    filteredTasks = filteredTasks.filter((task) =>
      (task.title || "").toLowerCase().includes(searchLower) ||
      (task.description || "").toLowerCase().includes(searchLower) ||
      getTaskSubjectMeta(task).name.toLowerCase().includes(searchLower)
    );
  }

  if (activeFilters.sort === "dueDate") {
    filteredTasks.sort((a, b) => parseLocalDate(a.dueDate) - parseLocalDate(b.dueDate));
  } else if (activeFilters.sort === "priority") {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    filteredTasks.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
  } else if (activeFilters.sort === "recent") {
    filteredTasks.sort((a, b) => {
      const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }

  console.log("Filtros aplicados. Tarefas encontradas:", filteredTasks.length);
  renderTasks();
}

// ============================================
// RESUMO DAS TAREFAS
// ============================================

function calculateSummary() {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === "concluída").length,
    pending: tasks.filter((task) => task.status === "pendente").length,
    em_andamento: tasks.filter((task) => task.status === "em_andamento").length,
    overdue: tasks.filter((task) => task.status !== "concluída" && isPastDate(task.dueDate)).length
  };
}

function updateSummary() {
  const summary = calculateSummary();

  const totalEl = document.getElementById("totalTasks");
  const completedEl = document.getElementById("completedTasks");
  const pendingEl = document.getElementById("pendingTasks");
  const overdueEl = document.getElementById("overdueTasks");

  if (totalEl) totalEl.textContent = summary.total;
  if (completedEl) completedEl.textContent = summary.completed;
  if (pendingEl) pendingEl.textContent = summary.pending;
  if (overdueEl) overdueEl.textContent = summary.overdue;

  // Progress Bar Widths
  const totalFill = document.getElementById("totalTasksFill");
  const completedFill = document.getElementById("completedTasksFill");
  const pendingFill = document.getElementById("pendingTasksFill");
  const overdueFill = document.getElementById("overdueTasksFill");

  if (totalFill) totalFill.style.width = "100%";
  
  const completedPct = summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0;
  const pendingPct = summary.total > 0 ? Math.round(((summary.pending + summary.em_andamento) / summary.total) * 100) : 0;
  const overduePct = summary.total > 0 ? Math.round((summary.overdue / summary.total) * 100) : 0;

  if (completedFill) completedFill.style.width = `${completedPct}%`;
  if (pendingFill) pendingFill.style.width = `${pendingPct}%`;
  if (overdueFill) overdueFill.style.width = `${overduePct}%`;

  // Badges update
  const completedBadge = document.getElementById("completedTasksBadge");
  const pendingBadge = document.getElementById("pendingTasksBadge");
  const overdueBadge = document.getElementById("overdueTasksBadge");
  const totalTasksBadge = document.getElementById("totalTasksBadge");

  if (completedBadge) completedBadge.textContent = `${completedPct}%`;
  if (pendingBadge) pendingBadge.textContent = `${pendingPct}%`;
  if (overdueBadge) {
    if (summary.overdue > 5) {
      overdueBadge.textContent = "Crítico";
      overdueBadge.className = "summary-badge danger";
    } else if (summary.overdue > 0) {
      overdueBadge.textContent = "Atenção";
      overdueBadge.className = "summary-badge warning";
    } else {
      overdueBadge.textContent = "Excelente";
      overdueBadge.className = "summary-badge success";
    }
  }

  // Calculate dynamic weekly variance badge for Total Tasks
  if (totalTasksBadge) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    let tasksThisWeek = 0;
    tasks.forEach(t => {
      const createdDate = t.createdAt ? new Date(t.createdAt.seconds * 1000) : new Date();
      if (createdDate >= oneWeekAgo) {
        tasksThisWeek++;
      }
    });

    const previousTotal = summary.total - tasksThisWeek;
    const variance = previousTotal > 0 ? Math.round((tasksThisWeek / previousTotal) * 100) : (tasksThisWeek > 0 ? 100 : 0);
    
    totalTasksBadge.textContent = `+${variance}%`;
  }

  // Subtexts update
  const totalSubEl = document.getElementById("totalTasksSubtext");
  const completedSubEl = document.getElementById("completedTasksSubtext");
  const pendingSubEl = document.getElementById("pendingTasksSubtext");
  const overdueSubEl = document.getElementById("overdueTasksSubtext");

  if (totalSubEl) {
    totalSubEl.textContent = summary.total === 0 
      ? "Nenhuma tarefa cadastrada" 
      : `${summary.total} ${summary.total === 1 ? 'tarefa registrada' : 'tarefas registradas'}`;
  }

  if (completedSubEl) {
    completedSubEl.textContent = `${completedPct}% concluído`;
  }

  if (pendingSubEl) {
    const totalPending = summary.pending + summary.em_andamento;
    if (totalPending === 0) {
      pendingSubEl.textContent = "Nenhuma tarefa pendente";
    } else {
      pendingSubEl.textContent = `${summary.em_andamento} em andamento`;
    }
  }

  if (overdueSubEl) {
    overdueSubEl.textContent = summary.overdue > 0 
      ? `${summary.overdue} ${summary.overdue === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}` 
      : "Tudo em dia!";
  }

  // Controlar a visibilidade de seções com base na existência de tarefas
  const summaryGrid = document.getElementById("summaryGrid");
  const widgetCharts = document.getElementById("widgetCharts");
  const filtersSection = document.getElementById("filtersSection");
  const dashboardGrid = document.querySelector(".dashboard-grid");

  if (tasks.length === 0) {
    if (summaryGrid) summaryGrid.style.display = "none";
    if (widgetCharts) widgetCharts.style.display = "none";
    if (filtersSection) filtersSection.style.display = "none";
    if (dashboardGrid) dashboardGrid.classList.add("no-tasks");
  } else {
    if (summaryGrid) summaryGrid.style.display = "grid";
    if (widgetCharts) widgetCharts.style.display = "grid";
    if (dashboardGrid) dashboardGrid.classList.remove("no-tasks");
    
    // filtros só devem aparecer se a aba lista estiver ativa
    const tabList = document.getElementById("tabList");
    const isListView = tabList ? tabList.classList.contains("active") : true;
    if (filtersSection) filtersSection.style.display = isListView ? "block" : "none";
  }
}

// ============================================
// RENDERIZAÇÃO DE MATÉRIAS
// ============================================

function renderSubjectOptions() {
  const subjectFilter = document.getElementById("subjectFilter");
  const taskSubject = document.getElementById("taskSubject");

  if (subjectFilter) {
    const selectedValue = subjects.some((subject) => subject.id === subjectFilter.value)
      ? subjectFilter.value
      : "all";

    subjectFilter.innerHTML = "";
    subjectFilter.appendChild(createOption("all", "Todas as matérias"));

    subjects.forEach((subject) => {
      subjectFilter.appendChild(createOption(subject.id, subject.name));
    });

    subjectFilter.value = selectedValue;
    activeFilters.subject = selectedValue;
  }

  if (taskSubject) {
    const selectedValue = taskSubject.value;
    taskSubject.innerHTML = "";

    if (!subjectsLoaded) {
      taskSubject.appendChild(createOption("", "Carregando matérias..."));
      taskSubject.disabled = true;
      return;
    }

    if (subjects.length === 0) {
      taskSubject.appendChild(createOption("", "Crie uma matéria primeiro"));
      taskSubject.disabled = true;
      return;
    }

    taskSubject.disabled = false;
    taskSubject.appendChild(createOption("", "Selecione a matéria"));

    subjects.forEach((subject) => {
      taskSubject.appendChild(createOption(subject.id, subject.name));
    });

    taskSubject.value = subjects.some((subject) => subject.id === selectedValue) ? selectedValue : "";
  }
}

function renderSubjectsList() {
  const subjectsList = document.getElementById("subjectsList");
  const subjectsCount = document.getElementById("subjectsCount");

  if (subjectsCount) {
    const suffix = subjects.length === 1 ? "cadastrada" : "cadastradas";
    subjectsCount.textContent = `${subjects.length} ${suffix}`;
  }

  if (!subjectsList) return;

  subjectsList.innerHTML = "";

  if (!subjectsLoaded) {
    subjectsList.innerHTML = `
      <div class="subjects-empty">
        <span class="subjects-empty-icon"><i class="fa-solid fa-spinner fa-spin"></i></span>
        <span>Carregando matérias...</span>
      </div>
    `;
    return;
  }

  if (subjects.length === 0) {
    subjectsList.innerHTML = `
      <div class="subjects-empty">
        <span class="subjects-empty-icon"><i class="fa-regular fa-folder-open"></i></span>
        <span>Nenhuma matéria cadastrada</span>
      </div>
    `;
    return;
  }

  subjects.forEach((subject) => {
    const item = document.createElement("article");
    item.className = "subject-item";
    item.style.setProperty("--subject-color", sanitizeColor(subject.color));

    const taskCount = tasks.filter((task) => taskBelongsToSubject(task, subject)).length;
    const iconClass = normalizeIcon(subject.icon);

    item.innerHTML = `
      <div class="subject-main">
        <span class="subject-icon"><i class="${iconClass}"></i></span>
        <div class="subject-info">
          <strong>${escapeHtml(subject.name)}</strong>
          <span>${taskCount} ${taskCount === 1 ? "tarefa" : "tarefas"}</span>
        </div>
      </div>
      <div class="subject-actions">
        <button type="button" class="subject-action-btn" title="Editar matéria" aria-label="Editar matéria">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button type="button" class="subject-action-btn danger" title="Excluir matéria" aria-label="Excluir matéria">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    `;

    const [editButton, deleteButton] = item.querySelectorAll(".subject-action-btn");
    editButton.addEventListener("click", () => window.openEditSubjectModal?.(subject.id));
    deleteButton.addEventListener("click", () => window.confirmDeleteSubject?.(subject.id));

    subjectsList.appendChild(item);
  });
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

// ============================================
// RENDERIZAR TAREFAS NA TELA
// ============================================

function renderTasks() {
  const tasksContainer = document.getElementById("tasksContainer");

  if (tasksContainer) {
    tasksContainer.innerHTML = "";

    if (filteredTasks.length === 0) {
      tasksContainer.innerHTML = `
        <div class="empty-state" style="padding: var(--spacing-2xl) var(--spacing-lg); display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed var(--border); border-radius: var(--radius-xl); background: rgba(255, 255, 255, 0.01);">
          <div class="empty-icon" style="font-size: 3.5rem; margin-bottom: var(--spacing-md); filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.2));">🚀</div>
          <h3 style="font-size: 1.5rem; margin-bottom: var(--spacing-xs); font-weight: 700; color: var(--text-primary);">Vamos começar?</h3>
          <p style="color: var(--text-secondary); margin-bottom: var(--spacing-xl); max-width: 300px; text-align: center;">Crie sua primeira tarefa e organize seus estudos.</p>
          <button class="btn btn-primary" onclick="openAddModal()" style="display: inline-flex; align-items: center; gap: var(--spacing-sm); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
            <i class="fa-solid fa-plus"></i> Criar tarefa
          </button>
        </div>
      `;
    } else {
      filteredTasks.forEach((task) => {
        const taskElement = createTaskCard(task);
        tasksContainer.appendChild(taskElement);
      });
    }
  }

  renderKanbanBoard();
}

function renderKanbanBoard() {
  const listPending = document.getElementById("listPending");
  const listProgress = document.getElementById("listProgress");
  const listCompleted = document.getElementById("listCompleted");
  
  const countPending = document.getElementById("countPending");
  const countProgress = document.getElementById("countProgress");
  const countCompleted = document.getElementById("countCompleted");

  if (!listPending || !listProgress || !listCompleted) return;

  listPending.innerHTML = "";
  listProgress.innerHTML = "";
  listCompleted.innerHTML = "";

  let pendingCount = 0;
  let progressCount = 0;
  let completedCount = 0;

  filteredTasks.forEach((task) => {
    const card = createKanbanCard(task);
    if (task.status === "concluída") {
      listCompleted.appendChild(card);
      completedCount++;
    } else if (task.status === "em_andamento") {
      listProgress.appendChild(card);
      progressCount++;
    } else {
      listPending.appendChild(card);
      pendingCount++;
    }
  });

  if (countPending) countPending.textContent = pendingCount;
  if (countProgress) countProgress.textContent = progressCount;
  if (countCompleted) countCompleted.textContent = completedCount;

  if (pendingCount === 0) {
    listPending.innerHTML = `<div class="deadline-empty">Sem tarefas</div>`;
  }
  if (progressCount === 0) {
    listProgress.innerHTML = `<div class="deadline-empty">Sem tarefas</div>`;
  }
  if (completedCount === 0) {
    listCompleted.innerHTML = `<div class="deadline-empty">Sem tarefas</div>`;
  }
}

function createKanbanCard(task) {
  const card = document.createElement("div");
  card.className = "kanban-card";
  card.setAttribute("draggable", "true");
  card.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", task.id);
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => {
    card.classList.remove("dragging");
  });

  const subjectMeta = getTaskSubjectMeta(task);
  const priorityMeta = getPriorityMeta(task.priority);
  const dueDate = parseLocalDate(task.dueDate);
  const formattedDate = dueDate.toLocaleDateString("pt-BR");

  card.innerHTML = `
    <div class="kanban-card-title">${escapeHtml(task.title)}</div>
    <div class="kanban-card-meta">
      <span class="kanban-card-subject" style="--subject-color: ${subjectMeta.color}">
        <i class="${subjectMeta.icon}"></i>
        <span>${escapeHtml(subjectMeta.name)}</span>
      </span>
      <span class="kanban-card-priority" style="--priority-color: ${priorityMeta.color}">
        <i class="fa-solid fa-circle" style="font-size: 8px; color: ${priorityMeta.color}"></i>
        ${priorityMeta.name}
      </span>
    </div>
    <div class="kanban-card-footer">
      <span class="kanban-card-date">
        <i class="fa-regular fa-calendar"></i>
        <span>${formattedDate}</span>
      </span>
      <div class="kanban-card-actions">
        <button class="kanban-card-btn" onclick="window.openEditModal('${task.id}')" title="Editar" aria-label="Editar tarefa">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="kanban-card-btn danger" onclick="window.confirmDelete('${task.id}')" title="Deletar" aria-label="Deletar tarefa">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>
  `;
  return card;
}

function renderCalendar() {
  const calendarGrid = document.getElementById("calendarGrid");
  const calendarMonthYear = document.getElementById("calendarMonthYear");

  if (!calendarGrid || !calendarMonthYear) return;

  calendarGrid.innerHTML = "";

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  for (let i = 0; i < firstDayIndex; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "calendar-day-cell empty";
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= totalDays; day++) {
    const cell = document.createElement("div");
    cell.className = "calendar-day-cell";
    cell.textContent = day;

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === day) {
      cell.classList.add("current-day");
    }

    if (selectedCalendarDay === dateStr) {
      cell.classList.add("active-day");
    }

    const dayTasks = tasks.filter((t) => t.dueDate === dateStr);
    if (dayTasks.length > 0) {
      cell.classList.add("has-tasks");
      
      const activeDayTasks = dayTasks.filter((t) => t.status !== "concluída");
      if (activeDayTasks.length > 0) {
        const hasHigh = activeDayTasks.some((t) => t.priority === "high");
        const hasMedium = activeDayTasks.some((t) => t.priority === "medium");
        
        if (hasHigh) {
          cell.classList.add("tasks-urgent");
        } else if (hasMedium) {
          cell.classList.add("tasks-next");
        } else {
          cell.classList.add("tasks-common");
        }
      } else {
        // Se todas as tarefas do dia foram concluídas, exibe indicador comum
        cell.classList.add("tasks-common");
      }
    }

    cell.addEventListener("click", () => {
      if (selectedCalendarDay === dateStr) {
        selectedCalendarDay = null;
        cell.classList.remove("active-day");
        activeFilters.dueDate = null;
      } else {
        selectedCalendarDay = dateStr;
        document.querySelectorAll(".calendar-day-cell.active-day").forEach((c) => {
          c.classList.remove("active-day");
        });
        cell.classList.add("active-day");
        activeFilters.dueDate = dateStr;
      }
      applyFilters(activeFilters);
    });

    calendarGrid.appendChild(cell);
  }
}

function renderNotificationsAndDeadlines() {
  const notifList = document.getElementById("notifList");
  const notifBadge = document.getElementById("notifBadge");
  const notifPanelCount = document.getElementById("notifPanelCount");
  const upcomingDeadlinesList = document.getElementById("upcomingDeadlinesList");

  if (!notifList && !upcomingDeadlinesList) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notifications = [];
  const upcomingDeadlines = [];

  tasks.forEach((task) => {
    if (task.status === "concluída") return;

    const dueDate = parseLocalDate(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      notifications.push({
        type: "overdue",
        title: `Tarefa Atrasada: "${task.title}"`,
        text: `Venceu em ${dueDate.toLocaleDateString("pt-BR")}.`,
        task
      });
    } else if (diffDays <= 1) {
      notifications.push({
        type: "near",
        title: `Vence em breve: "${task.title}"`,
        text: diffDays === 0 ? "Entrega HOJE!" : "Entrega AMANHÃ!",
        task
      });
    }

    if (diffDays >= 0 && diffDays <= 7) {
      upcomingDeadlines.push({
        days: diffDays,
        task
      });
    }
  });

  upcomingDeadlines.sort((a, b) => a.days - b.days);

  if (notifList) {
    notifList.innerHTML = "";
    if (notifications.length === 0) {
      notifList.innerHTML = `<div class="notifications-empty">Nenhuma notificação importante no momento.</div>`;
      if (notifBadge) notifBadge.style.display = "none";
      if (notifPanelCount) notifPanelCount.textContent = "0";
    } else {
      notifications.forEach((notif) => {
        const item = document.createElement("div");
        item.className = `notification-item ${notif.type}`;
        item.innerHTML = `
          <div class="notification-item-icon">
            <i class="${notif.type === "overdue" ? "fa-solid fa-triangle-exclamation" : "fa-solid fa-circle-exclamation"}"></i>
          </div>
          <div class="notification-item-content">
            <h4>${escapeHtml(notif.title)}</h4>
            <p>${escapeHtml(notif.text)}</p>
          </div>
        `;
        item.addEventListener("click", () => {
          window.openEditModal(notif.task.id);
        });
        notifList.appendChild(item);
      });

      if (notifBadge) {
        notifBadge.textContent = notifications.length;
        notifBadge.style.display = "flex";
      }
      if (notifPanelCount) {
        notifPanelCount.textContent = notifications.length;
      }
    }
  }

  if (upcomingDeadlinesList) {
    upcomingDeadlinesList.innerHTML = "";
    if (upcomingDeadlines.length === 0) {
      upcomingDeadlinesList.innerHTML = `<div class="deadline-empty">Sem prazos para os próximos 7 dias.</div>`;
    } else {
      upcomingDeadlines.forEach((item) => {
        const div = document.createElement("article");
        div.className = `deadline-item ${item.days <= 1 ? "urgent" : ""}`;
        
        const subjectMeta = getTaskSubjectMeta(item.task);
        const formattedDate = parseLocalDate(item.task.dueDate).toLocaleDateString("pt-BR");
        const badgeText = item.days === 0 ? "Hoje" : (item.days === 1 ? "Amanhã" : `${item.days} dias`);

        div.innerHTML = `
          <div class="deadline-item-left">
            <div class="deadline-item-title">${escapeHtml(item.task.title)}</div>
            <div class="deadline-item-subject" style="--subject-color: ${subjectMeta.color}">
              <i class="${subjectMeta.icon}"></i>
              <span>${escapeHtml(subjectMeta.name)}</span>
            </div>
          </div>
          <div class="deadline-item-date">${badgeText} (${formattedDate})</div>
        `;
        div.addEventListener("click", () => {
          window.openEditModal(item.task.id);
        });
        upcomingDeadlinesList.appendChild(div);
      });
    }
  }
}

function toggleChartPlaceholder(canvasId, show, icon, message) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const wrapper = canvas.parentElement;
  if (!wrapper) return;
  
  let placeholder = wrapper.querySelector(".chart-placeholder");
  if (show) {
    canvas.style.display = "none";
    if (!placeholder) {
      placeholder = document.createElement("div");
      placeholder.className = "chart-placeholder";
      placeholder.innerHTML = `
        <div class="chart-placeholder-icon">${icon}</div>
        <p>${message}</p>
      `;
      wrapper.appendChild(placeholder);
    }
  } else {
    canvas.style.display = "block";
    if (placeholder) {
      placeholder.remove();
    }
  }
}

function renderCharts() {
  const productivityCtx = document.getElementById("productivityChart");
  const distributionCtx = document.getElementById("distributionChart");

  if (!productivityCtx || !distributionCtx) return;

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const last7DaysLabels = [];
  const completedCounts = Array(7).fill(0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7DaysLabels.push(daysOfWeek[d.getDay()]);
    
    tasks.forEach(t => {
      if (t.status === "concluída") {
        const taskDate = t.updatedAt ? new Date(t.updatedAt.seconds * 1000) : parseLocalDate(t.dueDate);
        if (taskDate.toDateString() === d.toDateString()) {
          completedCounts[6 - i]++;
        }
      }
    });
  }

  const hasProductivityData = completedCounts.some(count => count > 0);
  toggleChartPlaceholder("productivityChart", !hasProductivityData, "📊", "Os gráficos aparecerão quando você concluir tarefas.");

  if (hasProductivityData) {
    if (productivityChartInstance) {
      productivityChartInstance.data.labels = last7DaysLabels;
      productivityChartInstance.data.datasets[0].data = completedCounts;
      productivityChartInstance.update();
    } else {
      productivityChartInstance = new Chart(productivityCtx, {
        type: "bar",
        data: {
          labels: last7DaysLabels,
          datasets: [{
            label: "Concluídas",
            data: completedCounts,
            backgroundColor: "#3b82f6",
            borderColor: "#3b82f6",
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1, color: "#94a3b8" },
              grid: { color: "rgba(30, 41, 59, 0.5)" }
            },
            x: {
              ticks: { color: "#94a3b8" },
              grid: { display: false }
            }
          }
        }
      });
    }
  } else {
    if (productivityChartInstance) {
      productivityChartInstance.destroy();
      productivityChartInstance = null;
    }
  }

  const summary = calculateSummary();
  const distributionData = [summary.pending, summary.em_andamento, summary.completed];
  const hasDistributionData = distributionData.some(val => val > 0);
  
  toggleChartPlaceholder("distributionChart", !hasDistributionData, "📈", "Nenhuma atividade registrada ainda.");

  if (hasDistributionData) {
    if (distributionChartInstance) {
      distributionChartInstance.data.datasets[0].data = distributionData;
      distributionChartInstance.update();
    } else {
      distributionChartInstance = new Chart(distributionCtx, {
        type: "doughnut",
        data: {
          labels: ["Pendente", "Em Andamento", "Concluída"],
          datasets: [{
            data: distributionData,
            backgroundColor: ["#f59e0b", "#3b82f6", "#10b981"],
            borderWidth: 1,
            borderColor: "#0d172a"
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "bottom",
              labels: { color: "#94a3b8", boxWidth: 12, font: { size: 11 } }
            }
          },
          cutout: "70%"
        }
      });
    }
  } else {
    if (distributionChartInstance) {
      distributionChartInstance.destroy();
      distributionChartInstance = null;
    }
  }
}

window.changeCalendarMonth = function(offset) {
  calendarDate.setMonth(calendarDate.getMonth() + offset);
  renderCalendar();
};

window.onDragOver = function(e) {
  e.preventDefault();
  const column = e.currentTarget;
  column.classList.add("drag-over");
};

window.onDragLeave = function(e) {
  const column = e.currentTarget;
  column.classList.remove("drag-over");
};

window.onDrop = async function(e, status) {
  e.preventDefault();
  const column = e.currentTarget;
  column.classList.remove("drag-over");
  
  const taskId = e.dataTransfer.getData("text/plain");
  if (taskId) {
    await editTask(taskId, { status: status });
  }
};

// ============================================
// CRIAR CARTÃO DE TAREFA
// ============================================

function createTaskCard(task) {
  const isOverdue = task.status !== "concluída" && isPastDate(task.dueDate);
  const daysUntil = getDaysUntilDeadline(task.dueDate);
  const isNearDeadline = task.status !== "concluída" && daysUntil <= 3 && daysUntil >= 0;

  const card = document.createElement("div");
  card.className = `task-card ${task.status === "concluída" ? "completed" : ""} ${isOverdue ? "overdue" : ""} ${isNearDeadline ? "near-deadline" : ""}`;

  const dueDate = parseLocalDate(task.dueDate);
  const formattedDate = dueDate.toLocaleDateString("pt-BR");
  const subjectMeta = getTaskSubjectMeta(task);
  const priorityMeta = getPriorityMeta(task.priority);

  let deadlineText = "";
  if (isOverdue) {
    deadlineText = `<span class="deadline-tag overdue">Atrasada</span>`;
  } else if (isNearDeadline) {
    deadlineText = `<span class="deadline-tag near">Faltam ${daysUntil} dia(s)</span>`;
  } else {
    deadlineText = `<span class="deadline-tag">${formattedDate}</span>`;
  }

  card.innerHTML = `
    <div class="task-card-header">
      <div class="task-header-left">
        <input type="checkbox" class="task-checkbox" ${task.status === "concluída" ? "checked" : ""}
               onchange="window.toggleTaskStatus('${task.id}', '${task.status}')">
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
      </div>
      <div class="task-actions">
        <button class="task-btn edit-btn" onclick="window.openEditModal('${task.id}')" title="Editar" aria-label="Editar tarefa">
          <i class="fa-regular fa-pen-to-square"></i>
        </button>
        <button class="task-btn delete-btn" onclick="window.confirmDelete('${task.id}')" title="Deletar" aria-label="Deletar tarefa">
          <i class="fa-regular fa-trash-can"></i>
        </button>
      </div>
    </div>

    <div class="task-body">
      <div class="task-meta">
        <span class="task-subject" style="--subject-color: ${subjectMeta.color}">
          <i class="${subjectMeta.icon}"></i>
          <span>${escapeHtml(subjectMeta.name)}</span>
        </span>
        <span class="task-priority" style="--priority-color: ${priorityMeta.color}">
          ${priorityMeta.name}
        </span>
      </div>

      ${task.description ? `<p class="task-description">${escapeHtml(task.description)}</p>` : ""}

      <div class="task-footer">
        <div class="task-deadline">
          <i class="fa-regular fa-calendar"></i>
          ${deadlineText}
        </div>
        <div class="task-status">
          <i class="${task.status === "concluída" ? "fa-regular fa-circle-check" : "fa-regular fa-clock"}"></i>
          ${task.status === "concluída" ? "Concluída" : "Pendente"}
        </div>
      </div>
    </div>
  `;

  return card;
}

// ============================================
// VALIDAÇÕES E UTILIDADES
// ============================================

function validateTaskData(taskData, options = {}) {
  const partial = options.partial === true;
  const validated = {};

  if (!partial || Object.prototype.hasOwnProperty.call(taskData, "title")) {
    if (!taskData.title || taskData.title.trim() === "") {
      showToast("Digite o título da tarefa!", "warning");
      return null;
    }
    validated.title = taskData.title.trim();
  }

  if (!partial || Object.prototype.hasOwnProperty.call(taskData, "subjectId") || Object.prototype.hasOwnProperty.call(taskData, "subject")) {
    const selectedSubject = resolveSubjectInput(taskData);

    if (!selectedSubject) {
      showToast("Selecione uma matéria válida.", "warning");
      return null;
    }

    validated.subjectId = selectedSubject.id;
    validated.subject = selectedSubject.name;
    validated.subjectColor = selectedSubject.color;
    validated.subjectIcon = selectedSubject.icon;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(taskData, "description")) {
    validated.description = taskData.description?.trim() || "";
  }

  if (!partial || Object.prototype.hasOwnProperty.call(taskData, "dueDate")) {
    if (!taskData.dueDate) {
      showToast("Defina a data de entrega!", "warning");
      return null;
    }

    if (isPastDate(taskData.dueDate)) {
      showToast("A data de entrega não pode ser no passado!", "warning");
      return null;
    }

    validated.dueDate = taskData.dueDate;
  }

  if (!partial || Object.prototype.hasOwnProperty.call(taskData, "priority")) {
    validated.priority = ["high", "medium", "low"].includes(taskData.priority)
      ? taskData.priority
      : "medium";
  }

  if (Object.prototype.hasOwnProperty.call(taskData, "status")) {
    if (["concluída", "em_andamento", "pendente"].includes(taskData.status)) {
      validated.status = taskData.status;
    } else {
      validated.status = "pendente";
    }
  }

  return validated;
}

function prepareSubjectData(subjectData) {
  const name = cleanSubjectName(subjectData.name);

  if (!name) {
    showToast("Digite o nome da matéria.", "warning");
    return null;
  }

  const normalizedName = normalizeSubjectName(name);

  return {
    name,
    normalizedName,
    color: sanitizeColor(subjectData.color),
    icon: normalizeIcon(subjectData.icon)
  };
}

function cleanSubjectName(name) {
  return (name || "").trim().replace(/\s+/g, " ");
}

function normalizeSubjectName(name) {
  return cleanSubjectName(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function createSubjectId(normalizedName) {
  const subjectId = normalizedName
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return subjectId || "categoria";
}

function resolveSubjectInput(taskData) {
  if (taskData.subjectId) {
    return getSubjectById(taskData.subjectId);
  }

  if (taskData.subject) {
    return getSubjectByName(taskData.subject);
  }

  return null;
}

function getSubjectByName(name) {
  const normalizedName = normalizeSubjectName(name);
  return subjects.find((subject) => subject.normalizedName === normalizedName) || null;
}

function getTaskSubjectMeta(task) {
  const linkedSubject = getSubjectForTask(task);

  if (linkedSubject) {
    return {
      id: linkedSubject.id,
      name: linkedSubject.name,
      color: sanitizeColor(linkedSubject.color),
      icon: normalizeIcon(linkedSubject.icon)
    };
  }

  if (task.subject) {
    return {
      id: task.subjectId || "",
      name: task.subject,
      color: sanitizeColor(task.subjectColor || DEFAULT_SUBJECT_COLOR),
      icon: normalizeIcon(task.subjectIcon || DEFAULT_SUBJECT_ICON)
    };
  }

  return UNCATEGORIZED_SUBJECT;
}

function taskBelongsToSubject(task, subject) {
  if (!subject) return false;
  if (task.subjectId === subject.id) return true;
  return !task.subjectId && normalizeSubjectName(task.subject || "") === subject.normalizedName;
}

function sanitizeColor(color) {
  return /^#[0-9a-f]{6}$/i.test(color || "") ? color : DEFAULT_SUBJECT_COLOR;
}

function normalizeIcon(icon) {
  return ALLOWED_SUBJECT_ICONS.has(icon) ? icon : DEFAULT_SUBJECT_ICON;
}

function getSubjectsCollectionRef() {
  return collection(db, "users", currentUser.uid, "subjects");
}

function getSubjectDocRef(subjectId) {
  return doc(db, "users", currentUser.uid, "subjects", subjectId);
}

function parseLocalDate(dateString) {
  if (!dateString) return new Date(0);

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isPastDate(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = parseLocalDate(dateString);
  date.setHours(0, 0, 0, 0);

  return date < today;
}

function getDaysUntilDeadline(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = parseLocalDate(dueDate);
  deadline.setHours(0, 0, 0, 0);

  const diff = deadline - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getPriorityMeta(priority) {
  const priorityMap = {
    high: { name: "Alta", color: "#ef4444" },
    medium: { name: "Média", color: "#f59e0b" },
    low: { name: "Baixa", color: "#22c55e" }
  };

  return priorityMap[priority] || priorityMap.medium;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// ============================================
// FUNÇÕES GLOBAIS PARA HTML
// ============================================

window.toggleTaskStatus = async function(taskId, currentStatus) {
  await toggleTaskStatus(taskId, currentStatus);
};

window.confirmDelete = function(taskId) {
  const confirmed = confirm("Tem certeza que deseja deletar esta tarefa?");
  if (confirmed) {
    deleteTask(taskId);
  }
};

// ============================================
// EXPORTAR FUNÇÕES E DADOS
// ============================================

export function getTasks() {
  return tasks;
}

export function getFilteredTasks() {
  return filteredTasks;
}

export function getSubjects() {
  return subjects;
}

export function getSubjectById(subjectId) {
  return subjects.find((subject) => subject.id === subjectId) || null;
}

export function getSubjectForTask(task) {
  if (task.subjectId) {
    const linkedSubject = getSubjectById(task.subjectId);
    if (linkedSubject) return linkedSubject;
  }

  if (task.subject) {
    return getSubjectByName(task.subject);
  }

  return null;
}

export function getCurrentUserData() {
  return currentUser;
}

export function getDefaultSubjectColor() {
  return DEFAULT_SUBJECT_COLOR;
}

export function getDefaultSubjectIcon() {
  return DEFAULT_SUBJECT_ICON;
}
