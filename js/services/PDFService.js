/**
 * Servicio encargado de la generación y descarga de reportes técnicos en PDF.
 * Incluye un plano 2D de cada plancha con sus piezas y medidas para respaldo documental.
 */
export class PDFService {
  static mmToCm(value) {
    const cm = Number(value) / 10;
    return Number.isInteger(cm) ? `${cm}` : cm.toFixed(1);
  }

  static formatCmDimensions(width, height) {
    return `${PDFService.mmToCm(width)} x ${PDFService.mmToCm(height)} cm`;
  }

  static getPlacementDimensions(placement) {
    const item = placement.cutPiece;
    const pieceWidth  = placement.rotated ? item.height : item.width;
    const pieceHeight = placement.rotated ? item.width  : item.height;
    return { pieceWidth, pieceHeight, x: placement.x, y: placement.y, name: item.name };
  }

  /**
   * Dibuja el plano 2D centrado. Devuelve la Y donde termina el bloque.
   */
  static drawSheetPlan(doc, sheet, margin, startY, pageWidth) {
    const availableWidth  = pageWidth - margin * 2;
    const leftLabelSpace  = 20;                    // espacio para etiqueta de alto
    const maxDrawWidth    = availableWidth - leftLabelSpace;
    const maxDrawHeight   = 110;

    const scale = Math.min(
      maxDrawWidth  / Math.max(sheet.width,  1),
      maxDrawHeight / Math.max(sheet.height, 1)
    );

    const sheetDrawWidth  = sheet.width  * scale;
    const sheetDrawHeight = sheet.height * scale;

    // Centrar el dibujo en el área disponible
    const drawAreaLeft = margin + leftLabelSpace;
    const left = drawAreaLeft + (maxDrawWidth - sheetDrawWidth) / 2;
    const top  = startY + 2;

    const originX = left;
    const originY = top + sheetDrawHeight;

    // ── Plano ────────────────────────────────────────────────────
    // ── Fondo blanco de la plancha con borde ───────────────────────────────
    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(0.6);
    doc.setFillColor(255, 255, 255);
    doc.rect(left, top, sheetDrawWidth, sheetDrawHeight, 'FD');

    // ── Piezas colocadas ───────────────────────────────────────────────────
    sheet.placedCuts.forEach((placement) => {
      const dims = PDFService.getPlacementDimensions(placement);
      const rectX = originX + dims.x * scale;
      const rectY = originY - dims.y * scale - dims.pieceHeight * scale;
      const rectW = dims.pieceWidth  * scale;
      const rectH = dims.pieceHeight * scale;

      // Verde sobrio para las piezas
      doc.setFillColor(46, 160, 67);
      doc.setDrawColor(20, 80, 30);
      doc.setLineWidth(0.3);
      doc.rect(rectX, rectY, rectW, rectH, 'FD');

      // Etiquetas dentro de la pieza
      if (rectW > 14 && rectH > 9) {
        // Nombre
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const nameW = doc.getTextWidth(dims.name);
        doc.text(
          dims.name,
          rectX + (rectW - nameW) / 2,
          rectY + (rectH > 18 ? rectH * 0.38 : rectH * 0.5)
        );
        // Dimensión (solo si hay altura suficiente)
        if (rectH > 16) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'normal');
          const dimLabel = `${PDFService.mmToCm(dims.pieceWidth)} x ${PDFService.mmToCm(dims.pieceHeight)} cm`;
          const dimW = doc.getTextWidth(dimLabel);
          doc.text(dimLabel, rectX + (rectW - dimW) / 2, rectY + rectH * 0.65);
        }
      }
    });

    // ── Cotas exteriores ───────────────────────────────────────────────────
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);

    // Cota inferior (ancho)
    const cotaBottomY = originY + 3;
    doc.line(originX, cotaBottomY, originX + sheetDrawWidth, cotaBottomY);
    doc.line(originX,                  originY, originX,                  cotaBottomY + 2);
    doc.line(originX + sheetDrawWidth, originY, originX + sheetDrawWidth, cotaBottomY + 2);

    // Cota lateral izquierda (alto)
    const cotaLeftX = originX - 3;
    doc.line(cotaLeftX, top, cotaLeftX, originY);
    doc.line(cotaLeftX - 2, top,     originX, top);
    doc.line(cotaLeftX - 2, originY, originX, originY);

    // ── Textos de dimensiones exteriores ───────────────────────────────────
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);

    // Ancho (centrado debajo)
    const widthLabel = `${PDFService.mmToCm(sheet.width)} cm`;
    const widthLabelW = doc.getTextWidth(widthLabel);
    doc.text(widthLabel, originX + (sheetDrawWidth - widthLabelW) / 2, cotaBottomY + 7);

    // Alto (rotado 90°, centrado a la izquierda) — jsPDF usa { angle } para rotar
    const heightLabel = `${PDFService.mmToCm(sheet.height)} cm`;
    doc.text(
      heightLabel,
      cotaLeftX - 5,
      top + sheetDrawHeight / 2,
      { angle: 90 }
    );

    return top + sheetDrawHeight + 18;
  }

  /**
   * Genera y descarga el informe de optimización en PDF.
   *
   * @param {Array<import('../models/Sheet.js').Sheet>} sheets
   * @param {Array<import('../models/CutPiece.js').CutPiece>} cutsList
   * @param {HTMLElement|HTMLCanvasElement} visualElement
   */
  static async generateReport(sheets, cutsList, visualElement) {
    if (!window.jspdf) {
      console.error('Error: La librería jsPDF no está disponible.');
      throw new Error('jsPDF no está disponible.');
    }
    if (!window.html2canvas) {
      console.error('Error: La librería html2canvas no está disponible.');
      throw new Error('html2canvas no está disponible.');
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let   currentY = 20;

    // ── Cabecera principal ──────────────────────────────────────────────────
    doc.setFillColor(25, 35, 55);
    doc.rect(0, 0, pageWidth, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('OptiCut 3D - Reporte de Optimización de Corte', margin, 13);

    currentY = 26;

    // ── Información General ─────────────────────────────────────────────────
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMACIÓN GENERAL', margin, currentY);
    currentY += 7;

    const totalSheets     = sheets.length;
    const totalPlacedCuts = sheets.reduce((s, sh) => s + sh.placedCuts.length, 0);
    const avgEfficiency   = totalSheets > 0
      ? (sheets.reduce((s, sh) => s + sh.efficiency, 0) / totalSheets).toFixed(2)
      : '0.00';
    const avgWaste = (100 - parseFloat(avgEfficiency)).toFixed(2);

    const summaryRows = [
      ['Fecha de emisión:',             `${new Date().toLocaleDateString('es-ES')} - ${new Date().toLocaleTimeString('es-ES')}`],
      ['Planchas requeridas:',          `${totalSheets}`],
      ['Piezas posicionadas:',          `${totalPlacedCuts}`],
      ['Aprovechamiento global:',       `${avgEfficiency}%`],
      ['Desperdicio global estimado:',  `${avgWaste}%`],
    ];

    doc.setFontSize(12);
    summaryRows.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text(label, margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(value, margin + 68, currentY);
      currentY += 6.5;
    });

    currentY += 2;

    // ── Una sección por plancha ─────────────────────────────────────────────
    sheets.forEach((sheet, index) => {
      // Salto de página si no hay espacio para el encabezado
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      // ── Encabezado de plancha ─────────────────────────────────────────────
      doc.setFillColor(25, 35, 55);
      doc.rect(margin, currentY - 1, pageWidth - margin * 2, 10, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(
        `Plancha #${index + 1}  ·  ${PDFService.mmToCm(sheet.width)} x ${PDFService.mmToCm(sheet.height)} x ${PDFService.mmToCm(sheet.thickness)} cm`,
        margin + 3, currentY + 6
      );
      currentY += 16;

      // ── Estadísticas de la plancha ────────────────────────────────────────
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(
        `Aprovechamiento: ${sheet.efficiency.toFixed(2)}%   |   Desperdicio: ${sheet.wastePercentage.toFixed(2)}%   |   Piezas: ${sheet.placedCuts.length}`,
        margin, currentY
      );
      currentY += 5;

      // Línea separadora
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 5;

      // ── Plano 2D ──────────────────────────────────────────────────────────
      // Necesita ~145 mm; si no cabe, nueva página
      if (currentY + 145 > pageHeight - 10) {
        doc.addPage();
        currentY = 20;
      }

      const drawEndY = PDFService.drawSheetPlan(doc, sheet, margin, currentY, pageWidth);
      currentY = drawEndY + 2;

      // ── Tabla de cortes ───────────────────────────────────────────────────
      if (currentY + 30 > pageHeight - 10) {
        doc.addPage();
        currentY = 20;
      }

      // Título
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Detalle de cortes asignados', margin, currentY);
      currentY += 4;

      // Cabecera de la tabla
      const colNum  = margin;
      const colName = margin + 12;
      const colDims = margin + 72;
      const colRot  = margin + 135;
      const tableW  = pageWidth - margin * 2;
      const rowH    = 8;

      doc.setFillColor(25, 35, 55);
      doc.rect(margin, currentY, tableW, rowH, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('#',           colNum  + 2, currentY + 5.5);
      doc.text('Nombre',      colName + 2, currentY + 5.5);
      doc.text('Dimensiones', colDims + 2, currentY + 5.5);
      doc.text('Rotación',    colRot  + 2, currentY + 5.5);
      currentY += rowH;

      // Filas de datos
      sheet.placedCuts.forEach((item, rowIdx) => {
        // Nueva página si no cabe la fila (sin repetir cabecera)
        if (currentY + rowH > pageHeight - 10) {
          doc.addPage();
          currentY = 20;
        }

        const p = item.cutPiece;

        // Fondo alternado (gris muy suave / blanco)
        doc.setFillColor(rowIdx % 2 === 0 ? 245 : 255, rowIdx % 2 === 0 ? 246 : 255, rowIdx % 2 === 0 ? 248 : 255);
        doc.rect(margin, currentY, tableW, rowH, 'F');

        // Línea inferior de fila
        doc.setDrawColor(210, 210, 210);
        doc.setLineWidth(0.2);
        doc.line(margin, currentY + rowH, margin + tableW, currentY + rowH);

        // Texto
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'normal');
        doc.text(`${rowIdx + 1}`, colNum + 2, currentY + 5.5);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text(`${p.name}`, colName + 2, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.text(PDFService.formatCmDimensions(p.width, p.height), colDims + 2, currentY + 5.5);
        doc.text(item.rotated ? '90° (Rotado)' : '0° (Normal)', colRot + 2, currentY + 5.5);

        currentY += rowH;
      });

      // Borde exterior de toda la tabla
      doc.setDrawColor(25, 35, 55);
      doc.setLineWidth(0.4);
      const tableTopY = currentY - (sheet.placedCuts.length + 1) * rowH;
      doc.rect(margin, tableTopY, tableW, (sheet.placedCuts.length + 1) * rowH, 'S');

      currentY += 14;
    });

    doc.save(`OptiCut_Reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
