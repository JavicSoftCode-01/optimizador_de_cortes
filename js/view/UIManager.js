import {CutPiece} from '../models/CutPiece.js';

export class UIManager {
  constructor() {
    this.cutsList = [];

    this.onOptimizeCallback = null;
    this.onExportPDFCallback = null;
    this.onSheetChangeCallback = null;
    this.onApplySheetCallback = null; // Callback para el botón Aplicar

    this.initDOMReferences();
    this.bindEvents();
    this.renderCutsTable();
  }

  initDOMReferences() {
    // Parámetros de Plancha (Alto/Largo primero, Ancho segundo)
    this.sheetHeightInput = document.getElementById('sheet-height');
    this.sheetWidthInput = document.getElementById('sheet-width');
    this.sheetThicknessInput = document.getElementById('sheet-thickness');
    this.sheetKerfInput = document.getElementById('sheet-kerf');
    this.btnApplySheet = document.getElementById('btn-apply-sheet');

    // Formulario de Cortes
    this.formCut = document.getElementById('form-cut');
    this.cutNameInput = document.getElementById('cut-name');
    this.cutWidthInput = document.getElementById('cut-width');
    this.cutHeightInput = document.getElementById('cut-height');
    this.cutQtyInput = document.getElementById('cut-qty');
    this.cutsTableBody = document.getElementById('cuts-table-body');

    // Botones
    this.btnOptimize = document.getElementById('btn-optimize');
    this.btnExportPDF = document.getElementById('btn-export-pdf');
    this.btnThemeToggle = document.getElementById('btn-theme-toggle');

    // Navegación
    this.btnPrevSheet = document.getElementById('btn-prev-sheet');
    this.btnNextSheet = document.getElementById('btn-next-sheet');
    this.sheetNavInfo = document.getElementById('sheet-nav-info');

    // Estadísticas
    this.statEfficiency = document.getElementById('stat-efficiency');
    this.statWaste = document.getElementById('stat-waste');
    this.statTotalSheets = document.getElementById('stat-total-sheets');
    this.statTotalPieces = document.getElementById('stat-total-pieces');

    this.legendContainer = document.getElementById('cuts-legend-container');
    this.loadingOverlay = document.getElementById('loading-overlay');
  }

  bindEvents() {
    // Evento Aplicar Medidas
    if (this.btnApplySheet) {
      this.btnApplySheet.addEventListener('click', () => {
        if (this.onApplySheetCallback) this.onApplySheetCallback();
      });
    }

    this.formCut.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAddCut();
    });

    this.btnOptimize.addEventListener('click', () => {
      if (this.onOptimizeCallback) this.onOptimizeCallback();
    });

    this.btnExportPDF.addEventListener('click', () => {
      if (this.onExportPDFCallback) this.onExportPDFCallback();
    });

    if (this.btnThemeToggle) {
      this.btnThemeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
      });
    }

    if (this.btnPrevSheet) {
      this.btnPrevSheet.addEventListener('click', () => {
        if (this.onSheetChangeCallback) this.onSheetChangeCallback(-1);
      });
    }

    if (this.btnNextSheet) {
      this.btnNextSheet.addEventListener('click', () => {
        if (this.onSheetChangeCallback) this.onSheetChangeCallback(1);
      });
    }
  }

  setOptimizeButtonLoading(isLoading) {
    if (!this.btnOptimize) return;

    if (isLoading) {
      this.btnOptimize.disabled = true;
      this.btnOptimize.style.opacity = '0.75';
      this.btnOptimize.style.cursor = 'not-allowed';
      this.btnOptimize.innerHTML = `
        <style>
          @keyframes spin-loader { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <svg style="width: 18px; height: 18px; animation: spin-loader 0.8s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
          <path d="M12 2 a10 10 0 0 1 10 10" stroke-linecap="round"></path>
        </svg>
        <span>Procesando...</span>
      `;
    } else {
      this.btnOptimize.disabled = false;
      this.btnOptimize.style.opacity = '1';
      this.btnOptimize.style.cursor = 'pointer';
      this.btnOptimize.innerHTML = `
        <i data-lucide="cpu"></i>
        <span>Calcular Optimización</span>
      `;
      if (window.lucide) window.lucide.createIcons();
    }
  }

  handleAddCut() {
    const name = this.cutNameInput.value.trim();
    const width = Number(this.cutWidthInput.value);
    const height = Number(this.cutHeightInput.value);
    const qty = Number(this.cutQtyInput.value);

    if (!width || !height || !qty || width <= 0 || height <= 0 || qty <= 0) {
      alert('Por favor, ingresa dimensiones y cantidades válidas.');
      return;
    }

    const newId = this.cutsList.length + 1;
    const newCut = new CutPiece(newId, name, width, height, qty);

    this.cutsList.push(newCut);
    this.renderCutsTable();

    this.cutNameInput.value = '';
    this.cutWidthInput.value = '';
    this.cutHeightInput.value = '';
    this.cutQtyInput.value = '1';
    this.cutNameInput.focus();
  }

  renderCutsTable() {
    this.cutsTableBody.innerHTML = '';

    if (this.cutsList.length === 0) {
      this.cutsTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 16px;">
            No hay cortes agregados aún.
          </td>
        </tr>`;
      return;
    }

    this.cutsList.forEach((cut, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${cut.color}; margin-right:6px;"></span>
          <strong>${cut.name}</strong>
        </td>
        <td>${cut.width} x ${cut.height}</td>
        <td>${cut.quantity}</td>
        <td>
          <button class="btn-icon btn-delete" data-index="${index}" title="Eliminar pieza" style="width:28px; height:28px; padding:0;">
            <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
          </button>
        </td>
      `;
      this.cutsTableBody.appendChild(tr);
    });

    this.cutsTableBody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.getAttribute('data-index'));
        this.cutsList.splice(idx, 1);
        this.renderCutsTable();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  getSheetConfig() {
    return {
      height: Number(this.sheetHeightInput.value),
      width: Number(this.sheetWidthInput.value),
      thickness: Number(this.sheetThicknessInput.value),
      kerf: Number(this.sheetKerfInput.value)
    };
  }

  updateDashboard(sheets, totalPiecesPlaced) {
    if (!sheets || sheets.length === 0) {
      if (this.statEfficiency) this.statEfficiency.textContent = '0.00%';
      if (this.statWaste) this.statWaste.textContent = '0.00%';
      if (this.statTotalSheets) this.statTotalSheets.textContent = '0';
      if (this.statTotalPieces) this.statTotalPieces.textContent = '0';
      return;
    }

    const totalSheets = sheets.length;
    const avgEfficiency = (sheets.reduce((sum, s) => sum + s.efficiency, 0) / totalSheets).toFixed(2);
    const avgWaste = (100 - parseFloat(avgEfficiency)).toFixed(2);

    if (this.statEfficiency) this.statEfficiency.textContent = `${avgEfficiency}%`;
    if (this.statWaste) this.statWaste.textContent = `${avgWaste}%`;
    if (this.statTotalSheets) this.statTotalSheets.textContent = `${totalSheets}`;
    if (this.statTotalPieces) this.statTotalPieces.textContent = `${totalPiecesPlaced}`;
  }

  updateNavigation(currentIndex, totalSheets) {
    if (this.sheetNavInfo) this.sheetNavInfo.textContent = `Plancha ${currentIndex + 1} de ${totalSheets}`;
    if (this.btnPrevSheet) this.btnPrevSheet.disabled = currentIndex <= 0;
    if (this.btnNextSheet) this.btnNextSheet.disabled = currentIndex >= totalSheets - 1;
  }

  renderLegend(placedCuts) {
    if (!this.legendContainer) return;
    this.legendContainer.innerHTML = '';

    if (!placedCuts || placedCuts.length === 0) {
      this.legendContainer.innerHTML = `<span style="font-size:0.85rem; color: var(--text-muted);">Sin piezas en esta plancha</span>`;
      return;
    }

    const map = new Map();
    placedCuts.forEach((p) => {
      const piece = p.cutPiece;
      if (!map.has(piece.name)) {
        map.set(piece.name, {piece, count: 0});
      }
      map.get(piece.name).count++;
    });

    map.forEach(({piece, count}) => {
      const tag = document.createElement('div');
      tag.className = 'legend-tag';
      tag.innerHTML = `
        <span class="tag-color-indicator" style="background-color: ${piece.color};"></span>
        <span>${piece.name} (${piece.width}x${piece.height}mm) - <strong>x${count}</strong></span>
      `;
      this.legendContainer.appendChild(tag);
    });
  }

  showLoading(show) {
    if (this.loadingOverlay) {
      if (show) {
        this.loadingOverlay.classList.remove('hidden');
      } else {
        this.loadingOverlay.classList.add('hidden');
      }
    }
  }
}
