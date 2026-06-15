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
    
    // Guardar valor inicial se houver
    const initialValue = this.input.value;
    
    this.input.readOnly = true; // Impedir teclado nativo em mobile
    this.input.style.cursor = "pointer";

    // Criar elemento popover
    this.popover = document.createElement("div");
    this.popover.className = "custom-datepicker-popover";
    this.popover.style.display = "none";
    this.popover.style.position = "fixed"; // Posição fixa para evitar scrolls do body
    document.body.appendChild(this.popover);

    // Estado interno
    this.selectedDate = null; // Objeto Date ou null
    this.currentViewDate = new Date(); // Mês/ano exibido no calendário

    // ============================================================
    // Interceptar Get/Set da Propriedade 'value' do Input
    // Permite exibir "dd/mm/aaaa" na tela, enquanto o código do
    // dashboard continua lendo/escrevendo "YYYY-MM-DD" nativamente.
    // ============================================================
    let internalValue = "";

    const toDisplayFormat = (val) => {
      if (!val) return "";
      const parts = val.split("-");
      if (parts.length !== 3) return val; // Retorna original se já estiver formatado
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const toIsoFormat = (val) => {
      if (!val) return "";
      const parts = val.split("/");
      if (parts.length !== 3) return val; // Retorna original se já for ISO
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    };

    const self = this;
    const originalValueProp = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

    Object.defineProperty(this.input, 'value', {
      get() {
        return internalValue; // O código JS do dashboard lê "YYYY-MM-DD"
      },
      set(val) {
        // Se receber formato BR (dd/mm/aaaa), converte para ISO
        let isoVal = (val && val.includes("/")) ? toIsoFormat(val) : (val || "");
        internalValue = isoVal;

        // Atualiza a tela com o formato BR (dd/mm/aaaa)
        const displayVal = toDisplayFormat(isoVal);
        originalValueProp.set.call(self.input, displayVal);

        // Atualiza o calendário interno
        const parsed = self.parseDateString(isoVal);
        if (parsed) {
          self.selectedDate = parsed;
          self.currentViewDate = new Date(parsed.getTime());
        } else {
          self.selectedDate = null;
        }
      },
      configurable: true
    });

    // Se houver um valor inicial no input, passa pelo setter customizado
    if (initialValue) {
      this.input.value = initialValue;
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

  // Posicionar o popover dinamicamente com base no espaço disponível na tela
  positionPopover() {
    const rect = this.input.getBoundingClientRect();
    const popoverHeight = this.popover.offsetHeight || 310;
    const popoverWidth = this.popover.offsetWidth || 280;

    // Calcular espaços acima e abaixo na viewport
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top = 0;
    let left = rect.left;

    // Se o espaço abaixo for insuficiente e houver mais espaço acima, abre acima
    if (spaceBelow < popoverHeight && spaceAbove > popoverHeight) {
      top = rect.top - popoverHeight - 6; // Acima do input
    } else {
      top = rect.bottom + 6; // Abaixo do input
    }

    // Evitar transbordamento lateral esquerdo/direito
    if (left + popoverWidth > window.innerWidth) {
      left = window.innerWidth - popoverWidth - 16;
    }
    if (left < 16) {
      left = 16;
    }

    // Garantir que a coordenada top não fique colada no topo absoluto
    if (top < 8) {
      top = 8;
    }

    this.popover.style.top = `${top}px`;
    this.popover.style.left = `${left}px`;
  }

  show() {
    // Fechar outros datepickers abertos
    document.querySelectorAll(".custom-datepicker-popover").forEach(p => {
      p.style.display = "none";
    });

    // Sincronizar com o valor atual do input
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
    
    // Forçar exibição antes do posicionamento para podermos medir a altura real (offsetHeight)
    this.popover.style.display = "block";
    this.positionPopover();

    // Adicionar escutadores para reposicionar em tempo real ao redimensionar ou rolar modal/página
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("scroll", this.handleScroll, true); // UseCapture true pega scrolls em sub-elementos (como modais)
  }

  hide() {
    this.popover.style.display = "none";
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.handleScroll, true);
  }

  handleResize = () => {
    if (this.popover.style.display === "block") {
      this.positionPopover();
    }
  };

  handleScroll = () => {
    if (this.popover.style.display === "block") {
      this.positionPopover();
    }
  };

  initEvents() {
    // Alternar visibilidade ao clicar no input
    this.input.addEventListener("click", (e) => {
      e.stopPropagation();
      if (this.popover.style.display === "block") {
        this.hide();
      } else {
        this.show();
      }
    });

    // Impedir que cliques no próprio popover propaguem e fechem
    this.popover.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Fechar popover ao clicar fora dele
    document.addEventListener("click", () => {
      this.hide();
    });
  }

  render() {
    const year = this.currentViewDate.getFullYear();
    const month = this.currentViewDate.getMonth();

    // Renderizar estrutura HTML
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

    const daysContainer = this.popover.querySelector(".datepicker-days");
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    // Células vazias iniciais
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

      // Destacar dia selecionado
      if (
        this.selectedDate &&
        this.selectedDate.getFullYear() === year &&
        this.selectedDate.getMonth() === month &&
        this.selectedDate.getDate() === day
      ) {
        cell.classList.add("selected");
      }

      // Bloquear dias anteriores a hoje
      const todayZeroed = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (cellDate < todayZeroed) {
        cell.classList.add("disabled");
      } else {
        // Seleção do dia
        cell.addEventListener("click", () => {
          this.selectedDate = cellDate;
          this.input.value = this.formatDateString(cellDate); // Dispara o setter para registrar em ISO e mostrar em BR
          
          this.input.dispatchEvent(new Event("change"));
          this.hide();
        });
      }

      daysContainer.appendChild(cell);
    }

    // Botões de Navegação
    this.popover.querySelector(".prev-month").addEventListener("click", () => {
      this.currentViewDate.setMonth(this.currentViewDate.getMonth() - 1);
      this.render();
    });

    this.popover.querySelector(".next-month").addEventListener("click", () => {
      this.currentViewDate.setMonth(this.currentViewDate.getMonth() + 1);
      this.render();
    });

    // Limpar data
    this.popover.querySelector(".btn-clear").addEventListener("click", () => {
      this.selectedDate = null;
      this.input.value = "";
      this.input.dispatchEvent(new Event("change"));
      this.hide();
    });

    // Definir data como hoje
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
