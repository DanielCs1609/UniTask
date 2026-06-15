// ============================================
// Custom Datepicker Component for UniTask
// ============================================

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

class CustomDatePicker {
  constructor(inputElement) {
    if (!inputElement) return;
    this.input = inputElement;
    this.input.readOnly = true; // Impedir teclado nativo em mobile
    this.input.style.cursor = "pointer";

    // Criar elemento popover
    this.popover = document.createElement("div");
    this.popover.className = "custom-datepicker-popover";
    this.popover.style.display = "none";
    document.body.appendChild(this.popover);

    // Estado interno
    this.selectedDate = null; // Objeto Date ou null
    this.currentViewDate = new Date(); // Mês/ano exibido no calendário

    // Se já houver um valor inicial
    if (this.input.value) {
      const parsed = this.parseDateString(this.input.value);
      if (parsed) {
        this.selectedDate = parsed;
        this.currentViewDate = new Date(parsed.getTime());
      }
    }

    this.initEvents();
    this.render();
  }

  // Converter "YYYY-MM-DD" local para objeto Date
  parseDateString(str) {
    if (!str) return null;
    const parts = str.split("-");
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  // Formatar Date para "YYYY-MM-DD"
  formatDateString(date) {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Posicionar o popover próximo ao input
  positionPopover() {
    const rect = this.input.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Posicionar logo abaixo do input
    let top = rect.bottom + scrollTop + 6;
    let left = rect.left + scrollLeft;

    // Garantir que não saia da tela na direita
    const popoverWidth = 280; // Largura estimada
    if (left + popoverWidth > window.innerWidth) {
      left = window.innerWidth - popoverWidth - 16;
    }

    this.popover.style.top = `${top}px`;
    this.popover.style.left = `${left}px`;
  }

  show() {
    // Fechar outros datepickers abertos
    document.querySelectorAll(".custom-datepicker-popover").forEach(p => {
      p.style.display = "none";
    });

    this.positionPopover();
    this.popover.style.display = "block";
    
    // Sincronizar com o valor atual do input caso tenha mudado
    if (this.input.value) {
      const parsed = this.parseDateString(this.input.value);
      if (parsed) {
        this.selectedDate = parsed;
        this.currentViewDate = new Date(parsed.getTime());
      }
    } else {
      this.selectedDate = null;
    }
    
    this.render();

    // Redimensionamento
    window.addEventListener("resize", this.handleResize);
  }

  hide() {
    this.popover.style.display = "none";
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    if (this.popover.style.display === "block") {
      this.positionPopover();
    }
  };

  initEvents() {
    // Toggle ao clicar no input
    this.input.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.popover.style.display === "block") {
        this.hide();
      } else {
        this.show();
      }
    });

    // Impedir fechamento ao clicar no próprio popover
    this.popover.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Fechar ao clicar fora
    document.addEventListener("click", () => {
      this.hide();
    });
  }

  render() {
    const year = this.currentViewDate.getFullYear();
    const month = this.currentViewDate.getMonth();

    // Cabeçalho
    this.popover.innerHTML = `
      <div class="datepicker-header">
        <button type="button" class="datepicker-nav-btn prev-month" aria-label="Mês anterior">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="datepicker-month-year">${MONTH_NAMES[month]} de ${year}</span>
        <button type="button" class="datepicker-nav-btn next-month" aria-label="Próximo mês">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
      <div class="datepicker-weekdays">
        <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
      </div>
      <div class="datepicker-days"></div>
      <div class="datepicker-footer">
        <button type="button" class="datepicker-action-btn btn-clear">Limpar</button>
        <button type="button" class="datepicker-action-btn btn-today">Hoje</button>
      </div>
    `;

    // Renderizar os dias
    const daysContainer = this.popover.querySelector(".datepicker-days");
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Células em branco anteriores
    for (let i = 0; i < firstDayIndex; i++) {
      const cell = document.createElement("div");
      cell.className = "datepicker-day empty";
      daysContainer.appendChild(cell);
    }

    // Dias do mês
    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement("div");
      cell.className = "datepicker-day";
      cell.textContent = day;

      const cellDate = new Date(year, month, day);

      // Destacar hoje
      if (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
      ) {
        cell.classList.add("today");
      }

      // Destacar data selecionada
      if (
        this.selectedDate &&
        this.selectedDate.getFullYear() === year &&
        this.selectedDate.getMonth() === month &&
        this.selectedDate.getDate() === day
      ) {
        cell.classList.add("selected");
      }

      // Bloquear seleção de datas passadas (mantendo consistência com o min date de hoje)
      const todayZeroed = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (cellDate < todayZeroed) {
        cell.classList.add("disabled");
      } else {
        // Seleção de dia
        cell.addEventListener("click", () => {
          this.selectedDate = cellDate;
          this.input.value = this.formatDateString(cellDate);
          
          // Disparar evento de change no input
          this.input.dispatchEvent(new Event("change"));
          this.hide();
        });
      }

      daysContainer.appendChild(cell);
    }

    // Registrar eventos dos botões internos
    this.popover.querySelector(".prev-month").addEventListener("click", () => {
      this.currentViewDate.setMonth(this.currentViewDate.getMonth() - 1);
      this.render();
    });

    this.popover.querySelector(".next-month").addEventListener("click", () => {
      this.currentViewDate.setMonth(this.currentViewDate.getMonth() + 1);
      this.render();
    });

    this.popover.querySelector(".btn-clear").addEventListener("click", () => {
      this.selectedDate = null;
      this.input.value = "";
      this.input.dispatchEvent(new Event("change"));
      this.hide();
    });

    this.popover.querySelector(".btn-today").addEventListener("click", () => {
      const now = new Date();
      this.selectedDate = now;
      this.currentViewDate = new Date(now.getTime());
      this.input.value = this.formatDateString(now);
      this.input.dispatchEvent(new Event("change"));
      this.hide();
    });
  }
}

// Exportar inicializador
export function initDatePicker(inputElement) {
  return new CustomDatePicker(inputElement);
}
