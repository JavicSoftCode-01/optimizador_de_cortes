import {CutPiece} from '../models/CutPiece.js';
import { ToastService } from '../services/ToastService.js';

export class UIManager {
  constructor() {
    this.cutsList = [];

    this.onOptimizeCallback = null;
    this.onExportPDFCallback = null;
    this.onSheetChangeCallback = null;
    this.onApplySheetCallback = null;
    this.onCutAddedCallback = null;
    this.onCutsListChangedCallback = null;
    this.onClearAllDataCallback = null;

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
    this.btnClearStorage = document.getElementById('btn-clear-storage');
    this.clearDataModal = document.getElementById('clear-data-modal');
    this.btnConfirmClearData = document.getElementById('btn-confirm-clear-data');
    this.btnCancelClearData = document.getElementById('btn-cancel-clear-data');

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

    // Modal de Duplicados
    this.duplicateModal = document.getElementById('duplicate-modal');
    this.duplicateModalTitle = document.getElementById('duplicate-modal-title');
    this.duplicateModalMsg = document.getElementById('duplicate-modal-msg');
    this.duplicateExistingInfo = document.getElementById('duplicate-existing-info');
    this.duplicateNameGroup = document.getElementById('duplicate-name-group');
    this.duplicateNameLabel = document.getElementById('duplicate-name-label');
    this.duplicateNewNameInput = document.getElementById('duplicate-new-name');
    this.btnModalSum = document.getElementById('btn-modal-sum');
    this.btnModalSumText = document.getElementById('btn-modal-sum-text');
    this.btnModalNew = document.getElementById('btn-modal-new');
    this.btnModalNewText = document.getElementById('btn-modal-new-text');
    this.btnModalCancel = document.getElementById('btn-modal-cancel');
    this.pendingCut = null;
    this.pendingDuplicateTarget = null;
    this.modalMode = null;
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

    if (this.btnClearStorage) {
      this.btnClearStorage.addEventListener('click', () => {
        if (this.clearDataModal) this.clearDataModal.classList.remove('hidden');
      });
    }

    if (this.btnConfirmClearData) {
      this.btnConfirmClearData.addEventListener('click', () => {
        this.closeClearDataModal();
        if (this.onClearAllDataCallback) this.onClearAllDataCallback();
      });
    }

    if (this.btnCancelClearData) {
      this.btnCancelClearData.addEventListener('click', () => {
        this.closeClearDataModal();
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

    // Eventos del Modal de Duplicados
    if (this.btnModalSum) {
      this.btnModalSum.addEventListener('click', () => {
        this.handleModalSum();
      });
    }

    if (this.btnModalNew) {
      this.btnModalNew.addEventListener('click', () => {
        this.handleModalNew();
      });
    }

    if (this.btnModalCancel) {
      this.btnModalCancel.addEventListener('click', () => {
        this.closeDuplicateModal();
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

    const sheetConfig = this.getSheetConfig();
    const sheetW = sheetConfig.width;
    const sheetH = sheetConfig.height;

    // Validación 1: Protección contra dimensiones que sobrepasan la plancha base
    const fitsNormal = width <= sheetW && height <= sheetH;
    const fitsRotated = width <= sheetH && height <= sheetW;

    if (!fitsNormal && !fitsRotated) {
      ToastService.show('error', 'Cortes excedentes', `La pieza "${name || 'Sin nombre'}" (${width} x ${height} mm) excede las dimensiones de la plancha base (${sheetW} x ${sheetH} mm).\n\nNo se puede agregar un corte que sobrepasa la dimensión de la plancha.`, 10000);
      return;
    }

    const finalName = name || `Pieza ${String.fromCharCode(65 + (this.cutsList.length % 26))}`;
    const normalizedName = finalName.toLowerCase();

    // Buscar si existe un corte con el MISMO NOMBRE
    const existingByName = this.cutsList.find((c) => c.name.toLowerCase() === normalizedName);

    if (existingByName) {
      const dimsMatch = (existingByName.width === width && existingByName.height === height) ||
                        (existingByName.width === height && existingByName.height === width);

      this.pendingCut = { name: finalName, width, height, qty };
      this.pendingDuplicateTarget = existingByName;

      if (dimsMatch) {
        // CONDICIONAL 1: Mismo nombre Y mismas dimensiones (Ancho y Alto)
        this.openExactDuplicateModal(existingByName, this.pendingCut);
      } else {
        // CONDICIONAL 2: Mismo nombre PERO dimensiones diferentes
        this.openNameConflictModal(existingByName, this.pendingCut);
      }
      return;
    }

    this.createAndAddCut(finalName, width, height, qty);
    this.clearCutForm();
  }

  openExactDuplicateModal(existing, incoming) {
    if (!this.duplicateModal) return;

    this.modalMode = 'EXACT';

    if (this.duplicateModalTitle) {
      this.duplicateModalTitle.textContent = '¡Registro Idéntico Detectado!';
    }

    this.duplicateModalMsg.innerHTML = `Ya existe un registro con el mismo nombre (<strong>${existing.name}</strong>) y las mismas medidas (<strong>${incoming.width} x ${incoming.height} mm</strong>). ¿Desea sumar la cantidad al registro existente o crear un nuevo registro?`;

    this.duplicateExistingInfo.innerHTML = `
      <strong>Registro existente:</strong> ${existing.name}<br>
      • Medidas: ${existing.width} x ${existing.height} mm<br>
      • Cantidad actual: <strong>${existing.quantity}</strong> piezas
    `;

    if (this.btnModalSum) this.btnModalSum.style.display = 'inline-flex';
    if (this.btnModalSumText) this.btnModalSumText.textContent = `Sumar (+${incoming.qty}) a ${existing.name}`;

    if (this.btnModalNew) this.btnModalNew.style.display = 'inline-flex';
    if (this.btnModalNewText) this.btnModalNewText.textContent = 'Crear nuevo registro';

    // Mostrar campo para especificar el nuevo nombre diferenciado
    if (this.duplicateNameGroup) this.duplicateNameGroup.style.display = 'block';
    if (this.duplicateNameLabel) this.duplicateNameLabel.textContent = 'Nombre para el nuevo registro (opcional):';
    if (this.duplicateNewNameInput) {
      this.duplicateNewNameInput.value = `${incoming.name} 2`;
    }

    this.duplicateModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  openNameConflictModal(existing, incoming) {
    if (!this.duplicateModal) return;

    this.modalMode = 'NAME_CONFLICT';

    if (this.duplicateModalTitle) {
      this.duplicateModalTitle.textContent = '¡Nombre Ya Registrado!';
    }

    this.duplicateModalMsg.innerHTML = `Este nombre (<strong>${existing.name}</strong>) ya está registrado con medidas diferentes (<strong>${existing.width} x ${existing.height} mm</strong>). Cambie el nombre para que no haya confusión.`;

    this.duplicateExistingInfo.innerHTML = `
      <strong>Medidas del registro existente (${existing.name}):</strong> ${existing.width} x ${existing.height} mm<br>
      <strong>Nuevas medidas ingresadas:</strong> ${incoming.width} x ${incoming.height} mm
    `;

    if (this.btnModalSum) this.btnModalSum.style.display = 'none';

    if (this.btnModalNew) this.btnModalNew.style.display = 'inline-flex';
    if (this.btnModalNewText) this.btnModalNewText.textContent = 'Guardar con nuevo nombre';

    if (this.duplicateNameGroup) this.duplicateNameGroup.style.display = 'block';
    if (this.duplicateNameLabel) this.duplicateNameLabel.textContent = 'Ingrese un nuevo nombre diferente:';
    if (this.duplicateNewNameInput) {
      this.duplicateNewNameInput.value = '';
      setTimeout(() => this.duplicateNewNameInput.focus(), 100);
    }

    this.duplicateModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  closeDuplicateModal() {
    if (this.duplicateModal) {
      this.duplicateModal.classList.add('hidden');
    }
    if (this.duplicateNewNameInput) {
      this.duplicateNewNameInput.value = '';
    }
    this.pendingCut = null;
    this.pendingDuplicateTarget = null;
    this.modalMode = null;
  }

  handleModalSum() {
    if (!this.pendingCut || !this.pendingDuplicateTarget) return;

    this.pendingDuplicateTarget.quantity += this.pendingCut.qty;
    this.pendingDuplicateTarget.isCalculated = false;
    this.renderCutsTable();
    if (this.onCutsListChangedCallback) this.onCutsListChangedCallback();
    this.clearCutForm();
    this.closeDuplicateModal();
  }

  handleModalNew() {
    if (!this.pendingCut) return;

    let requestedName = this.duplicateNewNameInput ? this.duplicateNewNameInput.value.trim() : '';

    if (this.modalMode === 'NAME_CONFLICT') {
      if (!requestedName) {
        alert('Por favor, ingrese un nombre diferente para registrar esta pieza.');
        if (this.duplicateNewNameInput) this.duplicateNewNameInput.focus();
        return;
      }

      const lower = requestedName.toLowerCase();
      if (this.cutsList.some((c) => c.name.toLowerCase() === lower)) {
        alert(`El nombre "${requestedName}" ya está registrado en la lista. Elija un nombre diferente.`);
        if (this.duplicateNewNameInput) this.duplicateNewNameInput.focus();
        return;
      }

      this.createAndAddCut(requestedName, this.pendingCut.width, this.pendingCut.height, this.pendingCut.qty);
    } else {
      // CONDICIONAL 1: Mismo nombre y mismas medidas
      let newName = requestedName;
      if (!newName) {
        newName = `${this.pendingCut.name} 2`;
      }

      // Validar que el nuevo nombre no colisione con ningún registro existente
      const lower = newName.toLowerCase();
      if (this.cutsList.some((c) => c.name.toLowerCase() === lower)) {
        alert(`El nombre "${newName}" ya existe en la lista. Por favor, especifique un nombre diferente para la nueva pieza.`);
        if (this.duplicateNewNameInput) this.duplicateNewNameInput.focus();
        return;
      }

      this.createAndAddCut(newName, this.pendingCut.width, this.pendingCut.height, this.pendingCut.qty);
    }

    this.clearCutForm();
    this.closeDuplicateModal();
  }


  createAndAddCut(name, width, height, qty) {
    const finalName = name || `Pieza ${String.fromCharCode(65 + (this.cutsList.length % 26))}`;
    const newId = this.cutsList.length + 1;
    const newCut = new CutPiece(newId, finalName, width, height, qty, null, false);
    this.cutsList.push(newCut);
    this.renderCutsTable();
    if (this.onCutsListChangedCallback) this.onCutsListChangedCallback();
    if (this.onCutAddedCallback) this.onCutAddedCallback(newCut);
  }

  clearCutForm() {
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
      const isCalculated = Boolean(cut.isCalculated);
      const statusBadge = isCalculated
        ? `<span class="status-badge status-calculated" title="Calculado e incluido en la optimización 3D">
             <i data-lucide="check"></i>
           </span>`
        : `<span class="status-badge status-pending" title="Pendiente por calcular optimización">
             P
           </span>`;

      tr.innerHTML = `
        <td>
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${cut.color}; margin-right:6px;"></span>
          <strong>${cut.name}</strong>
        </td>
        <td>${cut.width} x ${cut.height}</td>
        <td>${cut.quantity}</td>
        <td>
          <div style="display:inline-flex; align-items:center; gap:6px;">
            ${statusBadge}
            <button class="btn-icon btn-delete" data-index="${index}" title="Eliminar pieza" style="width:28px; height:28px; padding:0;">
              <i data-lucide="trash-2" style="width:14px; height:14px;"></i>
            </button>
          </div>
        </td>
      `;
      this.cutsTableBody.appendChild(tr);
    });

    this.cutsTableBody.querySelectorAll('.btn-delete').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.getAttribute('data-index'));
        const removedCut = this.cutsList[idx];
        const removedName = removedCut ? removedCut.name : '';
        const wasCalculated = removedCut ? Boolean(removedCut.isCalculated) : false;
        this.cutsList.splice(idx, 1);
        this.renderCutsTable();
        if (this.onCutsListChangedCallback) this.onCutsListChangedCallback(removedName, wasCalculated);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  closeClearDataModal() {
    if (this.clearDataModal) this.clearDataModal.classList.add('hidden');
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
    const safeValues = sheets.map((sheet) => {
      const value = Number(sheet?.efficiency);
      return Number.isFinite(value) ? value : 0;
    });
    const avgEfficiency = (safeValues.reduce((sum, value) => sum + value, 0) / totalSheets).toFixed(2);
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
