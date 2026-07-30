/**
 * Servicio encargado de la generación y descarga de reportes técnicos en PDF.
 * Aplica captura del área de visualización mediante html2canvas y estructuración de tablas con jsPDF.
 */
export class PDFService {
  /**
   * Genera y descarga el informe de optimización en PDF.
   *
   * @param {Array<import('../models/Sheet.js').Sheet>} sheets - Lista de planchas generadas con sus cortes
   * @param {Array<import('../models/CutPiece.js').CutPiece>} cutsList - Lista original de piezas solicitadas
   * @param {HTMLElement|HTMLCanvasElement} visualElement - Contenedor del visor 3D a capturar
   */
  static async generateReport(sheets, cutsList, visualElement) {
    if (!window.jspdf) {
      console.error("Error: La librería jsPDF no está disponible.");
      alert("No se pudo cargar la librería para generar el PDF.");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let currentY = 20;

    // --- 1. ENCABEZADO Y TÍTULO ---
    doc.setFillColor(15, 23, 42); // Color #0f172a (Dark Slate)
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('OptiCut 3D - Reporte de Optimización de Corte', margin, 16);

    currentY = 35;

    // --- 2. RESUMEN EJECUTIVO / MÉTRICAS GENERALES ---
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Resumen General', margin, currentY);
    currentY += 8;

    const totalSheets = sheets.length;
    const totalPlacedCuts = sheets.reduce((sum, s) => sum + s.placedCuts.length, 0);
    const avgEfficiency = totalSheets > 0
      ? (sheets.reduce((sum, s) => sum + s.efficiency, 0) / totalSheets).toFixed(2)
      : '0.00';
    const avgWaste = (100 - parseFloat(avgEfficiency)).toFixed(2);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')} - ${new Date().toLocaleTimeString('es-ES')}`, margin, currentY);
    currentY += 6;
    doc.text(`Cantidad total de planchas requeridas: ${totalSheets}`, margin, currentY);
    currentY += 6;
    doc.text(`Total de piezas posicionadas: ${totalPlacedCuts}`, margin, currentY);
    currentY += 6;
    doc.text(`Aprovechamiento global de material: ${avgEfficiency}%`, margin, currentY);
    currentY += 6;
    doc.text(`Desperdicio global estimado: ${avgWaste}%`, margin, currentY);
    currentY += 12;

    // --- 3. CAPTURA DEL VISOR 3D ---
    if (visualElement) {
      try {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('2. Vista de Distribución en Plancha', margin, currentY);
        currentY += 8;

        const canvasImage = await window.html2canvas(visualElement, {
          scale: 1.5,
          useCORS: true,
          logging: false
        });

        const imgData = canvasImage.toDataURL('image/png');
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvasImage.height * imgWidth) / canvasImage.width;

        // Ajuste de altura máxima para mantener la proporcionalidad en la hoja A4
        const maxHeight = 85;
        const finalHeight = Math.min(imgHeight, maxHeight);

        doc.addImage(imgData, 'PNG', margin, currentY, imgWidth, finalHeight);
        currentY += finalHeight + 12;
      } catch (err) {
        console.warn("No se pudo adjuntar la captura del canvas al PDF:", err);
      }
    }

    // --- 4. DETALLE POR PLANCHA Y DESGLOSE DE CORTES ---
    sheets.forEach((sheet, index) => {
      // Si el espacio vertical se agota, crear una nueva página
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235); // Color primario
      doc.text(`Plancha #${index + 1} (${sheet.width} x ${sheet.height} x ${sheet.thickness} mm)`, margin, currentY);
      currentY += 6;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`Aprovechamiento: ${sheet.efficiency.toFixed(2)}% | Desperdicio: ${sheet.wastePercentage.toFixed(2)}% | Piezas en esta plancha: ${sheet.placedCuts.length}`, margin, currentY);
      currentY += 8;

      // Cabecera de la tabla de cortes
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY, pageWidth - (margin * 2), 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.text('#', margin + 2, currentY + 5);
      doc.text('Nombre / ID', margin + 12, currentY + 5);
      doc.text('Dimensiones (mm)', margin + 60, currentY + 5);
      doc.text('Posición X, Y (mm)', margin + 110, currentY + 5);
      doc.text('Rotación', margin + 155, currentY + 5);

      currentY += 9;
      doc.setFont('helvetica', 'normal');

      // Filas con la ubicación de cada pieza
      sheet.placedCuts.forEach((item, pIndex) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }

        const p = item.cutPiece;
        doc.text(`${pIndex + 1}`, margin + 2, currentY);
        doc.text(`${p.name}`, margin + 12, currentY);
        doc.text(`${p.width} x ${p.height}`, margin + 60, currentY);
        doc.text(`X: ${item.x.toFixed(1)}, Y: ${item.y.toFixed(1)}`, margin + 110, currentY);
        doc.text(item.rotated ? '90° (Rotado)' : '0° (Normal)', margin + 155, currentY);

        currentY += 6;
      });

      currentY += 10;
    });

    // Guardar y descargar el archivo PDF
    doc.save(`OptiCut_Reporte_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
