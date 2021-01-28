import { Resolution } from './Resolution'
/**
 * The matrix of cells that span the sketch client.
 */
export class Grid extends Resolution {
  constructor(dimensions, resolution) {
    super(resolution.width, resolution.height)
    this._dimensions = dimensions
  }

  static simplified(dimensions, simplificationCoefficient) {
    return new this(dimensions, { width: dimensions.width / simplificationCoefficient, height: dimensions.height / simplificationCoefficient })
  }

  // fromCellDimensions({
  //   gridWidth,
  //   gridHeight,
  //   cellWidth,
  //   cellHeight,
  // }) {
  //   super(gridWidth, gridHeight)
  //   this.size = {
  //     width: cellWidth * gridWidth,
  //     height: cellHeight * gridHeight,
  //   }
  // }
  
  get dimensions() {
    return this._dimensions
  }

  get cellDimensions() {
    return {
      width: this.dimensions.width / this.columnCount,
      height: this.dimensions.height / this.rowCount,
    }
  }

  /**
   * Returns the coordinates of the cell that contains the given point.
   */
  getContainingCellCoordinates({ x, y } = {}) {
    if (x === undefined || y === undefined || !x || !y) {
      return {}
    }

    return {
      x: Math.floor(x / this.cellDimensions.width),
      y: Math.floor(y / this.cellDimensions.height),
    }
  }
}
