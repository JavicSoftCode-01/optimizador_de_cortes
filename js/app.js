import {Sheet} from './models/Sheet.js';
import {CutPiece} from './models/CutPiece.js';
import {NestingEngine} from './services/NestingEngine.js';
import {PDFService} from './services/PDFService.js';
import {Scene3D} from './view/Scene3D.js';
import {UIManager} from './view/UIManager.js';
import {ToastService} from './services/ToastService.js';

/**
 * Clase principal de la Aplicación.
 */
class App {
  constructor() {
    this.scene3D = null;
    this.uiManager = null;
    this.storageKey = 'optiCut_report_backup_v1';

    this.calculatedSheets = [];
    this.currentSheetIndex = 0;
  }

  init() {
    console.log('Inicializando OptiCut 3D...');

    this.scene3D = new Scene3D('canvas-container');
    this.uiManager = new UIManager();

    this.bindCallbacks();
    this.hydrateFromStorage();

    if (this.calculatedSheets.length > 0) {
      this.renderCurrentState();
    } else {
      this.renderInitialEmptySheet();
    }
  }

  renderInitialEmptySheet() {
    const sheetConfig = this.uiManager.getSheetConfig();
    const emptySheet = new Sheet(1, sheetConfig.width, sheetConfig.height, sheetConfig.thickness);
    this.scene3D.renderSheet(emptySheet);
    this.uiManager.updateDashboard(this.calculatedSheets, this.calculatedSheets.reduce((total, sheet) => total + sheet.placedCuts.length, 0));
    this.uiManager.updateNavigation(this.currentSheetIndex, Math.max(this.calculatedSheets.length, 1));
    this.uiManager.renderLegend(emptySheet.placedCuts);
  }

  bindCallbacks() {
    this.uiManager.onApplySheetCallback = () => {
      this.handleApplySheetConfig();
    };

    this.uiManager.onOptimizeCallback = () => {
      this.runOptimization();
    };

    this.uiManager.onSheetChangeCallback = (delta) => {
      this.handleSheetChange(delta);
    };

    this.uiManager.onExportPDFCallback = () => {
      this.handleExportPDF();
    };

    this.uiManager.onCutAddedCallback = (cut) => {
      ToastService.show('success', 'Corte agregado', `"${cut.name}" — ${cut.width} × ${cut.height} mm · Cant: ${cut.quantity}`);
      this.saveState();
    };

    this.uiManager.onCutsListChangedCallback = () => {
      this.saveState();
    };

    this.uiManager.onClearAllDataCallback = () => {
      this.clearAllData();
    };
  }

  hydrateFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;

      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return;

      if (data.sheetConfig) {
        const cfg = data.sheetConfig;
        this.uiManager.sheetHeightInput.value = cfg.height ?? this.uiManager.sheetHeightInput.value;
        this.uiManager.sheetWidthInput.value = cfg.width ?? this.uiManager.sheetWidthInput.value;
        this.uiManager.sheetThicknessInput.value = cfg.thickness ?? this.uiManager.sheetThicknessInput.value;
        this.uiManager.sheetKerfInput.value = cfg.kerf ?? this.uiManager.sheetKerfInput.value;
      }

      if (Array.isArray(data.cutsList)) {
        this.uiManager.cutsList = data.cutsList.map((cut) => new CutPiece(
          cut.id ?? 0,
          cut.name ?? 'Pieza',
          cut.width ?? 0,
          cut.height ?? 0,
          cut.quantity ?? 1,
          cut.color ?? null
        ));
      }

      if (Array.isArray(data.calculatedSheets) && data.calculatedSheets.length > 0) {
        this.calculatedSheets = data.calculatedSheets.map((sheet) => {
          const restoredSheet = new Sheet(
            sheet.id ?? 1,
            sheet.width ?? this.uiManager.getSheetConfig().width,
            sheet.height ?? this.uiManager.getSheetConfig().height,
            sheet.thickness ?? this.uiManager.getSheetConfig().thickness
          );

          restoredSheet.placedCuts = Array.isArray(sheet.placedCuts)
            ? sheet.placedCuts.map((placement) => ({
                x: Number(placement.x) || 0,
                y: Number(placement.y) || 0,
                rotated: Boolean(placement.rotated),
                cutPiece: placement.cutPiece ? new CutPiece(
                  placement.cutPiece.id ?? 0,
                  placement.cutPiece.name ?? 'Pieza',
                  placement.cutPiece.width ?? 0,
                  placement.cutPiece.height ?? 0,
                  placement.cutPiece.quantity ?? 1,
                  placement.cutPiece.color ?? null
                ) : null
              }))
            : [];

          return restoredSheet;
        });

        this.currentSheetIndex = Number.isInteger(data.currentSheetIndex) ? data.currentSheetIndex : 0;
        if (this.currentSheetIndex >= this.calculatedSheets.length) {
          this.currentSheetIndex = 0;
        }
        this.renderCurrentState();
      }

      this.uiManager.renderCutsTable();
      this.uiManager.updateDashboard(this.calculatedSheets, this.calculatedSheets.reduce((total, sheet) => total + sheet.placedCuts.length, 0));
      this.uiManager.updateNavigation(this.currentSheetIndex, Math.max(this.calculatedSheets.length, 1));
      this.uiManager.renderLegend(this.calculatedSheets[this.currentSheetIndex]?.placedCuts || []);
    } catch (error) {
      console.warn('No se pudo restaurar el estado guardado:', error);
      localStorage.removeItem(this.storageKey);
    }
  }

  saveState() {
    if (!this.uiManager) return;

    const payload = {
      sheetConfig: this.uiManager.getSheetConfig(),
      cutsList: this.uiManager.cutsList.map((cut) => ({
        id: cut.id,
        name: cut.name,
        width: cut.width,
        height: cut.height,
        quantity: cut.quantity,
        color: cut.color
      })),
      calculatedSheets: this.calculatedSheets.map((sheet) => ({
        id: sheet.id,
        width: sheet.width,
        height: sheet.height,
        thickness: sheet.thickness,
        placedCuts: sheet.placedCuts.map((placement) => ({
          x: placement.x,
          y: placement.y,
          rotated: placement.rotated,
          cutPiece: {
            id: placement.cutPiece.id,
            name: placement.cutPiece.name,
            width: placement.cutPiece.width,
            height: placement.cutPiece.height,
            quantity: placement.cutPiece.quantity,
            color: placement.cutPiece.color
          }
        }))
      })),
      currentSheetIndex: this.currentSheetIndex
    };

    localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }

  clearAllData() {
    this.uiManager.cutsList = [];
    this.calculatedSheets = [];
    this.currentSheetIndex = 0;

    this.uiManager.renderCutsTable();
    this.uiManager.updateDashboard([], 0);
    this.uiManager.updateNavigation(0, 1);
    this.uiManager.renderLegend([]);
    this.renderInitialEmptySheet();
    localStorage.removeItem(this.storageKey);

    ToastService.show('warning', 'Bitácora eliminada', 'Se borraron todos los datos actuales del almacenamiento local.');
  }

  /**
   * Actualiza las dimensiones de la plancha en 3D y muestra toast de confirmación
   */
  handleApplySheetConfig() {
    const cfg = this.uiManager.getSheetConfig();

    if (this.uiManager.cutsList.length > 0 && this.calculatedSheets.length > 0) {
      this.runOptimization();
    } else {
      this.renderInitialEmptySheet();
    }

    this.saveState();
    ToastService.show('info', 'Dimensiones aplicadas', `Plancha: ${cfg.width} × ${cfg.height} mm · Espesor: ${cfg.thickness} mm · Kerf: ${cfg.kerf} mm`);
  }

  /**
   * Flujo principal con bloqueo seguro de botón durante la optimización
   */
  async runOptimization() {
    const cutsList = this.uiManager.cutsList;

    if (cutsList.length === 0) {
      ToastService.show(
        'info',
        'No tienes Cortes',
        'Agrega al menos un corte a la lista antes de optimizar.'
        );
      return;
    }

    const sheetConfig = this.uiManager.getSheetConfig();
    const sheetW = sheetConfig.width;
    const sheetH = sheetConfig.height;

    const exceedingCuts = cutsList.filter((cut) => {
      const fitsNormal = cut.width <= sheetW && cut.height <= sheetH;
      const fitsRotated = cut.width <= sheetH && cut.height <= sheetW;
      return !fitsNormal && !fitsRotated;
    });

    if (exceedingCuts.length > 0) {
      ToastService.show('error', 'Cortes excedentes', `Los siguientes cortes sobrepasan las dimensiones de la plancha base.`);
      return;
    }

    this.uiManager.setOptimizeButtonLoading(true);
    this.uiManager.showLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      this.calculatedSheets = NestingEngine.optimize(sheetConfig, cutsList, sheetConfig.kerf);
      this.currentSheetIndex = 0;
      this.renderCurrentState();
      this.saveState();
      ToastService.show('success', 'Optimización completada', 'La distribución y la bitácora local se han actualizado.');
    } catch (error) {
      console.error('Error durante el cálculo de optimización:', error);
      ToastService.show('error', 'Error en optimización', 'Ocurrió un problema al procesar los cortes. Revisa la consola.');
    } finally {
      this.uiManager.setOptimizeButtonLoading(false);
      this.uiManager.showLoading(false);
    }
  }

  renderCurrentState() {
    if (!this.calculatedSheets || this.calculatedSheets.length === 0) {
      this.uiManager.updateDashboard([], 0);
      this.uiManager.updateNavigation(0, 1);
      this.uiManager.renderLegend([]);
      return;
    }

    const currentSheet = this.calculatedSheets[this.currentSheetIndex];

    this.scene3D.renderSheet(currentSheet);

    const totalPiecesPlaced = this.calculatedSheets.reduce((total, sheet) => total + sheet.placedCuts.length, 0);

    this.uiManager.updateDashboard(this.calculatedSheets, totalPiecesPlaced);
    this.uiManager.updateNavigation(this.currentSheetIndex, this.calculatedSheets.length);
    this.uiManager.renderLegend(currentSheet.placedCuts);
  }

  handleSheetChange(delta) {
    const newIndex = this.currentSheetIndex + delta;

    if (newIndex >= 0 && newIndex < this.calculatedSheets.length) {
      this.currentSheetIndex = newIndex;
      this.renderCurrentState();
      this.saveState();
    }
  }

  async handleExportPDF() {
    if (!this.calculatedSheets || this.calculatedSheets.length === 0) {
      ToastService.show('info', 'No tienes Cortes', 'Primero debes agregar cortes y presionar "Calcular Optimización".');
      return;
    }

    const canvasContainer = document.getElementById('canvas-container');
    const cutsList = this.uiManager.cutsList;

    this.uiManager.showLoading(true);

    try {
      await PDFService.generateReport(this.calculatedSheets, cutsList, canvasContainer);
      ToastService.show('success', 'Descargar', 'El PDF de optimización se ha generado correctamente.');
    } catch (error) {
      console.error('Error al exportar el PDF:', error);
      ToastService.show('error', 'No se pudo descargar', 'La librería de exportación no está disponible. Verifica la conexión o vuelve a recargar la página.');
    } finally {
      this.uiManager.showLoading(false);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
