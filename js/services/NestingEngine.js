import { Sheet } from '../models/Sheet.js';

/**
 * Servicio encargado del algoritmo de optimización de espacio (2D Nesting / Bin Packing).
 * Implementa MaxRects (Best Short Side Fit) con soporte para Kerf y múltiples planchas.
 */
export class NestingEngine {
  /**
   * Ejecuta la optimización de cortes sobre el lote de piezas solicitado.
   *
   * @param {Object} sheetConfig - Configuración de la plancha { width, height, thickness }
   * @param {Array<import('../models/CutPiece.js').CutPiece>} cutsList - Lista de tipos de corte
   * @param {number} kerf - Espesor de la herramienta de corte en mm
   * @returns {Array<Sheet>} Arreglo de planchas generadas con sus cortes ubicados
   */
  static optimize(sheetConfig, cutsList, kerf = 0) {
    const kerfValue = Number(kerf);

    // 1. Descomponer el requerimiento en un listado plano de piezas unitarias
    let remainingPieces = [];
    cutsList.forEach((cut) => {
      for (let i = 0; i < cut.quantity; i++) {
        remainingPieces.push(cut.cloneIndividual(`${cut.id}_${i + 1}`));
      }
    });

    // 2. Ordenamiento Heurístico (Mayor Área Primero)
    // Colocar piezas grandes primero maximiza drásticamente el % de aprovecho
    remainingPieces.sort((a, b) => b.area - a.area);

    const sheets = [];
    let sheetId = 1;

    // 3. Generación continua de planchas hasta ubicar todas las piezas
    while (remainingPieces.length > 0) {
      const currentSheet = new Sheet(
        sheetId,
        sheetConfig.width,
        sheetConfig.height,
        sheetConfig.thickness
      );

      // Rectángulos de espacio libre disponibles en la plancha actual
      let freeRectangles = [
        {
          x: 0,
          y: 0,
          width: currentSheet.width,
          height: currentSheet.height
        }
      ];

      const unplacedInThisSheet = [];

      for (const piece of remainingPieces) {
        // Dimensiones efectivas sumando el Kerf (separación de la herramienta)
        const effectiveW = piece.width + kerfValue;
        const effectiveH = piece.height + kerfValue;

        // Buscar el espacio libre donde mejor encaje la pieza
        const bestFit = NestingEngine.findBestFit(
          freeRectangles,
          effectiveW,
          effectiveH
        );

        if (bestFit) {
          // Asignar posición a la pieza en esta plancha
          currentSheet.addCut({
            cutPiece: piece,
            x: bestFit.x,
            y: bestFit.y,
            rotated: bestFit.rotated
          });

          // Determinar ancho/alto ocupado según si se rotó la pieza
          const placedW = bestFit.rotated ? effectiveH : effectiveW;
          const placedH = bestFit.rotated ? effectiveW : effectiveH;

          const placedRect = {
            x: bestFit.x,
            y: bestFit.y,
            width: placedW,
            height: placedH
          };

          // Subdividir y limpiar espacios libres sobrantes
          freeRectangles = NestingEngine.splitFreeRectangles(freeRectangles, placedRect);
          freeRectangles = NestingEngine.pruneFreeRectangles(freeRectangles);
        } else {
          // Si no cabe en la plancha actual, pasa a la lista de pendientes
          unplacedInThisSheet.push(piece);
        }
      }

      // Validación para evitar bucle infinito si una pieza es más grande que la plancha misma
      if (unplacedInThisSheet.length === remainingPieces.length) {
        console.warn(
          `Atención: La pieza "${remainingPieces[0].name}" (${remainingPieces[0].width}x${remainingPieces[0].height}mm) excede las dimensiones de la plancha.`
        );
        break;
      }

      sheets.push(currentSheet);
      remainingPieces = unplacedInThisSheet;
      sheetId++;
    }

    return sheets;
  }

  /**
   * Encuentra la mejor posición buscando minimizar el espacio desperdiciado en el lado corto (BSSF)
   */
  static findBestFit(freeRects, pieceW, pieceH) {
    let bestFit = null;
    let bestShortSideFit = Infinity;
    let bestLongSideFit = Infinity;

    for (const rect of freeRects) {
      // 1. Probar Orientación Normal (sin rotar)
      if (pieceW <= rect.width && pieceH <= rect.height) {
        const leftoverX = Math.abs(rect.width - pieceW);
        const leftoverY = Math.abs(rect.height - pieceH);
        const shortSideFit = Math.min(leftoverX, leftoverY);
        const longSideFit = Math.max(leftoverX, leftoverY);

        if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestFit = { x: rect.x, y: rect.y, rotated: false };
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
        }
      }

      // 2. Probar Orientación Rotada 90°
      if (pieceH <= rect.width && pieceW <= rect.height) {
        const leftoverX = Math.abs(rect.width - pieceH);
        const leftoverY = Math.abs(rect.height - pieceW);
        const shortSideFit = Math.min(leftoverX, leftoverY);
        const longSideFit = Math.max(leftoverX, leftoverY);

        if (shortSideFit < bestShortSideFit || (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)) {
          bestFit = { x: rect.x, y: rect.y, rotated: true };
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
        }
      }
    }

    return bestFit;
  }

  /**
   * Recorta los rectángulos libres que hayan sido traslapados por la pieza colocada
   */
  static splitFreeRectangles(freeRects, placedRect) {
    const newFreeRects = [];

    for (const rect of freeRects) {
      if (!NestingEngine.intersects(rect, placedRect)) {
        newFreeRects.push(rect);
        continue;
      }

      // Subdividir en hasta 4 sub-rectángulos (Arriba, Abajo, Izquierda, Derecha)
      if (placedRect.y > rect.y && placedRect.y < rect.y + rect.height) {
        newFreeRects.push({
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: placedRect.y - rect.y
        });
      }

      if (placedRect.y + placedRect.height < rect.y + rect.height) {
        newFreeRects.push({
          x: rect.x,
          y: placedRect.y + placedRect.height,
          width: rect.width,
          height: (rect.y + rect.height) - (placedRect.y + placedRect.height)
        });
      }

      if (placedRect.x > rect.x && placedRect.x < rect.x + rect.width) {
        newFreeRects.push({
          x: rect.x,
          y: rect.y,
          width: placedRect.x - rect.x,
          height: rect.height
        });
      }

      if (placedRect.x + placedRect.width < rect.x + rect.width) {
        newFreeRects.push({
          x: placedRect.x + placedRect.width,
          y: rect.y,
          width: (rect.x + rect.width) - (placedRect.x + placedRect.width),
          height: rect.height
        });
      }
    }

    return newFreeRects;
  }

  /**
   * Elimina rectángulos redundantes o contenidos dentro de otros para acelerar búsquedas
   */
  static pruneFreeRectangles(freeRects) {
    for (let i = 0; i < freeRects.length; i++) {
      for (let j = i + 1; j < freeRects.length; j++) {
        if (NestingEngine.isContainedIn(freeRects[i], freeRects[j])) {
          freeRects.splice(i, 1);
          i--;
          break;
        }
        if (NestingEngine.isContainedIn(freeRects[j], freeRects[i])) {
          freeRects.splice(j, 1);
          j--;
        }
      }
    }
    return freeRects;
  }

  static intersects(r1, r2) {
    return !(
      r2.x >= r1.x + r1.width ||
      r2.x + r2.width <= r1.x ||
      r2.y >= r1.y + r1.height ||
      r2.y + r2.height <= r1.y
    );
  }

  static isContainedIn(r1, r2) {
    return (
      r1.x >= r2.x &&
      r1.y >= r2.y &&
      r1.x + r1.width <= r2.x + r2.width &&
      r1.y + r1.height <= r2.y + r2.height
    );
  }
}
