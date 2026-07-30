import {Sheet} from './models/Sheet.js';
import {NestingEngine} from './services/NestingEngine.js';
import {PDFService} from './services/PDFService.js';
import {Scene3D} from './view/Scene3D.js';
import {UIManager} from './view/UIManager.js';

/**
 * Clase principal de la Aplicación.
 */
class App {
  constructor() {
    this.scene3D = null;
    this.uiManager = null;

    this.calculatedSheets = [];
    this.currentSheetIndex = 0;
  }

  init() {
    console.log('Inicializando OptiCut 3D...');

    this.scene3D = new Scene3D('canvas-container');
    this.uiManager = new UIManager();

    this.bindCallbacks();
    this.renderInitialEmptySheet();
  }

  renderInitialEmptySheet() {
    const sheetConfig = this.uiManager.getSheetConfig();
    const emptySheet = new Sheet(
      1,
      sheetConfig.width,
      sheetConfig.height,
      sheetConfig.thickness
    );
    this.scene3D.renderSheet(emptySheet);
  }

  bindCallbacks() {
    // Al presionar "Aplicar Dimensiones"
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
  }

  /**
   * Actualiza inmediatamente las dimensiones de la plancha en 3D
   */
  handleApplySheetConfig() {
    if (this.uiManager.cutsList.length > 0 && this.calculatedSheets.length > 0) {
      // Si ya existían cortes optimizados, recalcular con las nuevas medidas
      this.runOptimization();
    } else {
      // Si la lista está vacía, ajustar únicamente la plancha tridimensional limpia
      this.renderInitialEmptySheet();
    }
  }

  /**
   * Flujo principal con bloqueo seguro de botón durante la optimización
   */
  async runOptimization() {
    const cutsList = this.uiManager.cutsList;

    if (cutsList.length === 0) {
      alert('Por favor, agrega al menos un corte a la lista antes de optimizar.');
      return;
    }

    // 1. Bloquear botón inmediatamente y mostrar el Spinner
    this.uiManager.setOptimizeButtonLoading(true);
    this.uiManager.showLoading(true);

    // Pequeña pausa asíncrona para forzar al navegador a pintar el botón bloqueado
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const sheetConfig = this.uiManager.getSheetConfig();

      // 2. Ejecutar el cálculo de optimización (MaxRects 2D)
      this.calculatedSheets = NestingEngine.optimize(
        sheetConfig,
        cutsList,
        sheetConfig.kerf
      );

      this.currentSheetIndex = 0;
      this.renderCurrentState();

    } catch (error) {
      console.error('Error durante el cálculo de optimización:', error);
      alert('Ocurrió un error al procesar los cortes. Revisa la consola.');
    } finally {
      // 3. Desbloquear el botón una vez terminado el procesamiento (éxito o error)
      this.uiManager.setOptimizeButtonLoading(false);
      this.uiManager.showLoading(false);
    }
  }

  renderCurrentState() {
    if (!this.calculatedSheets || this.calculatedSheets.length === 0) return;

    const currentSheet = this.calculatedSheets[this.currentSheetIndex];

    this.scene3D.renderSheet(currentSheet);

    const totalPiecesPlaced = this.calculatedSheets.reduce(
      (total, sheet) => total + sheet.placedCuts.length,
      0
    );

    this.uiManager.updateDashboard(this.calculatedSheets, totalPiecesPlaced);
    this.uiManager.updateNavigation(
      this.currentSheetIndex,
      this.calculatedSheets.length
    );
    this.uiManager.renderLegend(currentSheet.placedCuts);
  }

  handleSheetChange(delta) {
    const newIndex = this.currentSheetIndex + delta;

    if (newIndex >= 0 && newIndex < this.calculatedSheets.length) {
      this.currentSheetIndex = newIndex;
      this.renderCurrentState();
    }
  }

  async handleExportPDF() {
    if (!this.calculatedSheets || this.calculatedSheets.length === 0) {
      alert('Primero debes agregar cortes y presionar "Calcular Optimización".');
      return;
    }

    const canvasContainer = document.getElementById('canvas-container');
    const cutsList = this.uiManager.cutsList;

    this.uiManager.showLoading(true);

    await PDFService.generateReport(
      this.calculatedSheets,
      cutsList,
      canvasContainer
    );

    this.uiManager.showLoading(false);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
