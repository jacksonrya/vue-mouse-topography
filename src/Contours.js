/* eslint-disable no-unused-vars */
import * as d3 from 'd3-contour'
import _ from 'lodash'

export const EMPTY = 'empty'
export const RANDOM = 'random'
export const GRADIENT = 'gradient'
export const GOLDSTEIN = 'goldstein'

// List of values that seperate contour buckets. The topography heights at which contours lines are drawn.
const THRESHOLDS = {
  empty: { threshold: function () { return _.range(1, (this.bucketCount + 1) * this.zRange / this.bucketCount, CONTOUR_INTERVAL).reverse() } },
  random: { threshold: function () { return _.range(0, 100, 10) } },
  gradient: { threshold: function () { return _.range(0, this.matrixArea, this.matrixArea / 10) } },
  goldstein: { threshold: function () { return _.range(2, 21).map(p => Math.pow(2, p)) } },
}

const CONTOUR_INTERVAL = 20 // The 'vertical' distance between each contour line.

class Topography {
  constructor (resolution, viewport, preset) {
    this.resolution = resolution
    this.viewport = viewport

    this.min = Infinity
    this.max = -Infinity

    this._matrix = this._initMatrix()[preset]()
    this._threshold = THRESHOLDS[preset].threshold
  }

  static random (resolution) {
    return new this(resolution)
  }

  get zRange () {
    return Math.ceil(this.max - this.min)
  }

  // The number of sorting buckets to accomodate all topography heights.
  get bucketCount () {
    return Math.ceil(this.max / CONTOUR_INTERVAL)
  }

  _getMatrixIndex (x, y) { // TODO move to matrix class
    return Math.floor((y * this.resolution.columnCount) + x)
  }

  _addToMatrixValue (i, z) {
    this._matrix[i] += z
  }

  _getMatrixValue (i) {
    if (i < 0 || i > this.matrixArea) {
      return undefined
    }

    return this._matrix[i]
  }

  raise ({ x, y }, zDelta = 100, density = 4) {
    // calculate distances to closest nodes
    const pos = this._getMatrixIndex(x, y)
    // this._matrix[pos] += zDelta
    this._addToMatrixValue(pos, zDelta)
    // TODO  raise values of neighbors at a fraction of zDelta
    // antialias with new values

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i !== 0 || j !== 0) {
          this._addToMatrixValue(this._getMatrixIndex(x + i, y + j), zDelta / density)
        }
      }
    }

    this.antialias({ x, y })

    const z = this._matrix[pos]

    if (z < this.min) this.min = z
    if (z > this.max) this.max = z
  }

  // ?? This helps make fluid diagonals drawn, but doesn't spread the force effect
  antialias ({ x, y }, iterations = 0) {
    const ITERATION_CAP = 2
    if (!x || !y) return
    if (iterations === ITERATION_CAP) return
    if (x < 0 || y < 0 || x >= this.resolution.columnCount || y >= this.resolution.rowCount) return

    const neighborCoors = new Array(8)
    const neighborIndexes = new Array(8)

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const coor = [ x + j, y + i ]
        neighborIndexes.push(this._getMatrixIndex(...coor))
        neighborCoors.push(...coor)
      }
    }

    const neighbors = neighborIndexes.map(i => {
      return this._getMatrixValue(i)
    })

    // console.log(x, y, this._getMatrixIndex(x, y))

    const currMatrixValue = this._getMatrixValue(this._getMatrixIndex(x, y))
    // console.log([currMatrixValue, ...neighbors])
    const newMatrixValue = [ currMatrixValue, ...neighbors ].reduce((prev, curr) => prev + curr) / 9
    // console.log(newMatrixValue)
    this._addToMatrixValue(this._getMatrixIndex(x, y), (newMatrixValue || 0)) // TODO: this is always returning 0 ? is newMatrixValue always invalid?

    // TODO: filter internal coordinates, only antialias the edge of the current range --- DON'T ANTIALIAS WHAT"S ALREADY BEEN ANTIALIASED
    neighborCoors.forEach(coor => {
      this.antialias(coor, iterations + 1)
    })
  }

  getIsobands (matrix = this.getMatrix()) {
    const n = this.resolution.columnCount
    const m = this.resolution.rowCount

    const contours = d3.contours()
      .size([ n, m ])
      .thresholds(this._threshold())

    return contours(matrix)
  }

  // https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
  _randomBm () {
    let u = 0; let v = 0
    while (u === 0) u = Math.random() // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random()
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
    num = num / 10.0 + 0.5 // Translate to 0 -> 1
    if (num > 1 || num < 0) return this._randomBm() // resample between 0 and 1
    return num
  }

  get matrixArea () {
    return this.resolution?.cellCount || 0
  }

  _initMatrix () {
    const initValues = () => {
      return _.fill(new Array(this.matrixArea), 10) // TODO init should be to 0, but might have an edge-case bug, so testing w 10 :)
    }

    const matrices = {
      gradient: () => {
        return _.range(0, this.matrixArea)
      },
      random: () => {
        const values = initValues()

        let curr = 0

        for (let x = 0; x < this.resolution.columnCount; x++) {
          for (let y = 0; y < this.resolution.rowCount; y++) {
            const z = [
              0,
              Math.random() * 100,
              (x * 10) + y,
              this._randomBm() * 100,
            ][3]

            if (z < this.min) this.min = z
            if (z > this.max) this.max = z

            // values[x * 10 + y] = z
            values[curr] = z
            curr++
          }
        }

        return values
      },
      goldstein: () => {
        const values = initValues()

        function goldsteinPrice (x, y) {
          return (1 + Math.pow(x + y + 1, 2) * (19 - 14 * x + 3 * x * x - 14 * y + 6 * x * x + 3 * y * y)) *
            (30 + Math.pow(2 * x - 3 * y, 2) * (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y * y))
        }

        // Populate a grid of n×m values where -2 ≤ x ≤ 2 and -2 ≤ y ≤ 1.
        const n = this.resolution.columnCount
        const m = this.resolution.rowCount
        for (let j = 0.5, k = 0; j < m; ++j) {
          for (let i = 0.5; i < n; ++i, ++k) {
            values[k] = goldsteinPrice(i / n * 4 - 2, 1 - j / m * 3)
          }
        }

        return values
      },

    }

    // console.log(initValues())

    matrices.empty = initValues // initValues

    return matrices
  }

  getMatrix () {
    return this._matrix
  }
}

export { Topography }
