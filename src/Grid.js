import { Resolution } from './Resolution'
/**
 * The matrix of cells that span the sketch client.
 */
export default class Grid extends Resolution {
  constructor(dimensions, resolution) {
    super(resolution.width, resolution.height)
    this._dimensions = dimensions
  }

  get dimensions() {
    return this._dimensions
  }

  get cellDimensions() {
    return {
      width: this.dimensions.width / this.width,
      height: this.dimensions.height / this.height,
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
