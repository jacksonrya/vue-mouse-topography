/**
 * The resolution of the drawing--contour line granularity.
 */
export class Resolution {
  constructor (width, height) {
    this.width = width
    this.height = height
  }

  get columnCount () {
    return Math.ceil(this.width)
  }

  get rowCount () {
    return Math.ceil(this.height)
  }

  get resolutionSize () {
    return {
      width: this.columnCount,
      height: this.rowCount,
    }
  }

  get aspectRatio () {
    return this.columnCount / this.rowCount
  }

  get cellCount () {
    return this.columnCount * this.rowCount
  }
}
