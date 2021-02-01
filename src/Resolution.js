/**
 * The resolution of the drawing--contour line granularity.
 */
export class Resolution {
  constructor (width, height) {
    this._width = width
    this._height = height
  }

  get width () {
    return Math.ceil(this._width)
  }

  get height () {
    return Math.ceil(this._height)
  }

  get resolutionSize () {
    return {
      width: this.width,
      height: this.height,
    }
  }

  get aspectRatio () {
    return this.width / this.height
  }

  get cellCount () {
    return this.width * this.height
  }
}
