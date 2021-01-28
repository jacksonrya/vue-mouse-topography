/**
 * The matrix of cells that span the sketch client.
 */
export class Grid {
  constructor (size, resolution) {
    this.size = size
    this.resolution = resolution
  }

  get cellSize () {
    return {
      width: this.size.width / this.resolution.columnCount,
      height: this.size.height / this.resolution.rowCount,
    }
  }

  getCell (mousePosition) {
    if (!mousePosition || !mousePosition.x || !mousePosition.y) {
      return {}
    }

    return {
      x: Math.floor(mousePosition.x / this.cellSize.width),
      y: Math.floor(mousePosition.y / this.cellSize.height),
    }
  }
}
