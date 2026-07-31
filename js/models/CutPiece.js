/**
 * Clase que representa un Requerimiento de Pieza a Cortar (CutPiece).
 * Encapsula las dimensiones, cantidad, nombre y color asignado.
 */
export class CutPiece {
  /**
   * @param {string|number} id - Identificador único de la pieza.
   * @param {string} name - Nombre opcional (ej: "Pieza A", "Placa Soporte").
   * @param {number} width - Ancho de la pieza en mm.
   * @param {number} height - Alto de la pieza en mm.
   * @param {number} quantity - Cantidad requerida de este tipo de pieza.
   * @param {string} [color] - Color asignado (Hex o HSL). Si se omite, genera uno dinámico.
   */
  constructor(id, name, width, height, quantity = 1, color = null, isCalculated = false) {
    this.id = id;
    this.name = name || `Corte #${id}`;
    this.width = Number(width);
    this.height = Number(height);
    this.quantity = Number(quantity);
    this.color = color || CutPiece.generateDistinctColor(id);
    this.isCalculated = Boolean(isCalculated);
  }

  /**
   * Área de una sola pieza en mm²
   * @returns {number}
   */
  get area() {
    return this.width * this.height;
  }

  /**
   * Área total acumulada multiplicando por la cantidad solicitada (mm²)
   * @returns {number}
   */
  get totalArea() {
    return this.area * this.quantity;
  }

  /**
   * Genera un color HSL vibrante y distinguible basado en un identificador,
   * garantizando que cada tipo de corte sea fácilmente reconocible en el visor 3D.
   * @param {string|number} seed
   * @returns {string} Color HSL
   */
  static generateDistinctColor(seed) {
    // Genera un ángulo HSL repartido uniformemente (Golden Ratio) para evitar colores idénticos
    const hue = (Number(seed) * 137.508) % 360;
    return `hsl(${Math.floor(hue)}, 70%, 50%)`;
  }

  /**
   * Crea una copia clonada para representar una unidad individual durante el cálculo de empaquetado.
   * @param {string|number} individualId - ID único de la pieza unitaria.
   * @returns {CutPiece}
   */
  cloneIndividual(individualId) {
    return new CutPiece(
      individualId,
      this.name,
      this.width,
      this.height,
      1,
      this.color
    );
  }
}
