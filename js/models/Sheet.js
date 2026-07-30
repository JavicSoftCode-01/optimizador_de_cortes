/**
 * Clase que representa una Plancha Metálica (Sheet).
 * Aplica los principios de Encapsulamiento y Abstracción (POO).
 */
export class Sheet {
  /**
   * @param {number|string} id - Identificador único de la plancha (ej: 1, 2, "Plancha 1").
   * @param {number} width - Ancho total de la plancha en milímetros (mm).
   * @param {number} height - Alto/Largo total de la plancha en milímetros (mm).
   * @param {number} thickness - Espesor de la plancha en mm (informativo para el render 3D).
   */
  constructor(id, width, height, thickness = 3) {
    this.id = id;
    this.width = Number(width);
    this.height = Number(height);
    this.thickness = Number(thickness);

    /**
     * Lista de cortes colocados en esta plancha.
     * Cada elemento almacena la referencia a la pieza y sus coordenadas asignadas:
     * { cutPiece, x, y, rotated }
     */
    this.placedCuts = [];
  }

  /**
   * Área total de la plancha en mm²
   * @returns {number}
   */
  get totalArea() {
    return this.width * this.height;
  }

  /**
   * Área útil ocupada por todas las piezas colocadas (en mm²)
   * @returns {number}
   */
  get usedArea() {
    return this.placedCuts.reduce((total, placement) => {
      return total + placement.cutPiece.area;
    }, 0);
  }

  /**
   * Área desperdiciada en mm²
   * @returns {number}
   */
  get wasteArea() {
    return Math.max(0, this.totalArea - this.usedArea);
  }

  /**
   * Porcentaje de aprovechamiento de la plancha (0% a 100%)
   * @returns {number}
   */
  get efficiency() {
    if (this.totalArea === 0) return 0;
    return (this.usedArea / this.totalArea) * 100;
  }

  /**
   * Porcentaje de desperdicio de la plancha (0% a 100%)
   * @returns {number}
   */
  get wastePercentage() {
    return 100 - this.efficiency;
  }

  /**
   * Agrega un corte posicionado sobre esta plancha
   * @param {Object} placement
   * @param {import('./CutPiece.js').CutPiece} placement.cutPiece - Instancia de la pieza
   * @param {number} placement.x - Posición X dentro de la plancha
   * @param {number} placement.y - Posición Y dentro de la plancha
   * @param {boolean} placement.rotated - Indica si la pieza fue rotada 90 grados
   */
  addCut(placement) {
    this.placedCuts.push(placement);
  }

  /**
   * Elimina todos los cortes asignados a esta plancha
   */
  clearCuts() {
    this.placedCuts = [];
  }
}
