import {Sheet} from './models/Sheet.js';
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
    const emptySheet = new Sheet(1, sheetConfig.width, sheetConfig.height, sheetConfig.thickness);
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

    // Callback de toast desde UIManager (agregar corte exitoso)
    this.uiManager.onCutAddedCallback = (cut) => {
      ToastService.show('success', 'Corte agregado', `"${cut.name}" — ${cut.width} × ${cut.height} mm · Cant: ${cut.quantity}`);
    };
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

    ToastService.show('info', 'Dimensiones aplicadas', //  `Plancha: ${cfg.width} × ${cfg.height} mm · Espesor: ${cfg.thickness} mm · Kerf: ${cfg.kerf} mm`
    );
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
      //alert('Por favor, agrega al menos un corte a la lista antes de optimizar.');
      return;
    }

    const sheetConfig = this.uiManager.getSheetConfig();
    const sheetW = sheetConfig.width;
    const sheetH = sheetConfig.height;

    // Validar si existen cortes que sobrepasan la plancha base
    const exceedingCuts = cutsList.filter((cut) => {
      const fitsNormal = cut.width <= sheetW && cut.height <= sheetH;
      const fitsRotated = cut.width <= sheetH && cut.height <= sheetW;
      return !fitsNormal && !fitsRotated;
    });

    if (exceedingCuts.length > 0) {
      const details = exceedingCuts
        .map((c) => `• Pieza "${c.name}": ${c.width} x ${c.height} mm (Cant: ${c.quantity})`)
        .join('\n');
      ToastService.show('error', 'Cortes excedentes', `Los siguientes cortes sobrepasan las dimensiones de la plancha base.`);
      //alert(`⚠️ DIMENSIONES EXCEDENTES A CORTAR:\n\n` + `Los siguientes cortes sobrepasan las dimensiones de la plancha base (${sheetW} x ${sheetH} mm):\n\n` + `${details}\n\n` + `Por favor, ajusta las medidas de los cortes o las dimensiones de la plancha base.`);
      return;
    }

    // 1. Bloquear botón inmediatamente y mostrar el Spinner
    this.uiManager.setOptimizeButtonLoading(true);
    this.uiManager.showLoading(true);

    // Pequeña pausa asíncrona para forzar al navegador a pintar el botón bloqueado
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // 2. Ejecutar el cálculo de optimización (MaxRects 2D)
      this.calculatedSheets = NestingEngine.optimize(sheetConfig, cutsList, sheetConfig.kerf);

      this.currentSheetIndex = 0;
      this.renderCurrentState();

      // Toast de éxito al finalizar la optimización
      const totalPieces = this.calculatedSheets.reduce((t, s) => t + s.placedCuts.length, 0);
      const avgEff = (this.calculatedSheets.reduce((s, sh) => s + sh.efficiency, 0) / this.calculatedSheets.length).toFixed(1);
      ToastService.show('success', 'Optimización completada', //  `${this.calculatedSheets.length} planchas · ${totalPieces} piezas · Eficiencia promedio: ${avgEff}%`,
      );

    } catch (error) {
      console.error('Error durante el cálculo de optimización:', error);
      ToastService.show('error', 'Error en optimización', 'Ocurrió un problema al procesar los cortes. Revisa la consola.');
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
    }
  }

  async handleExportPDF() {
    if (!this.calculatedSheets || this.calculatedSheets.length === 0) {
      ToastService.show('info', 'No tienes Cortes', 'Primero debes agregar cortes y presionar "Calcular Optimización".');
      //alert('Primero debes agregar cortes y presionar "Calcular Optimización".');
      return;
    }

    const canvasContainer = document.getElementById('canvas-container');
    const cutsList = this.uiManager.cutsList;

    this.uiManager.showLoading(true);

    await PDFService.generateReport(this.calculatedSheets, cutsList, canvasContainer);

    this.uiManager.showLoading(false);
    ToastService.show('success', '📄 Reporte descargado', 'El PDF de optimización se ha generado correctamente.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
