/* eslint-disable no-unused-vars */
import * as B from 'array-blur'
import * as d3 from 'd3-contour'
import fill from 'lodash-es/fill.js'
import range from 'lodash-es/range.js'

export const THRESHOLD_OPTIONS = { EMPTY: 'empty' }

// List of values that seperate contour buckets. The z-axis values at which contours lines are drawn.
const THRESHOLDS = {}

const CONTOUR_INTERVAL = 20 // The 'vertical' distance between each contour line.

/**
 * Manages the creation of isoband contours.
 */
export class Contours {
  constructor (resolution, preset = THRESHOLD_OPTIONS.EMPTY) {
    this.resolution = resolution

    this.min = Infinity
    this.max = -Infinity

    this.preset = preset

    this._matrix = undefined
    this._threshold = undefined
    this._init()
  }

  _init() {
    this._matrix = this._initMatrix()[this.preset]()
    this._threshold = THRESHOLDS[this.preset]
  }

  static random (resolution) {
    return new this(resolution)
  }

  get matrix() {
    return this._matrix
  }

  set matrix(matrix) {
    // validate that the new matrix can replace the old
    this._matrix = matrix;
  }

  get matrixArea() {
    if (!this.resolution) return 0

    return this.resolution.cellCount
  }

  get zRange () {
    return Math.ceil(this.max - this.min)
  }

  // The number of sorting buckets to accomodate all z-axis values.
  get bucketCount () {
    return Math.ceil(this.max / CONTOUR_INTERVAL)
  }

  get isobands() {
    return this._getIsobands(this.matrix)
  }

  updateResolution(resolution) {
    this.resolution = resolution
    this._init()
  }

  resetMatrix() {

  }

  _getMatrixIndex (x, y) { // TODO move to matrix class
    return Math.floor((y * this.resolution.width) + x)
  }

  _setMatrixValue(i, v) {
    this._matrix[i] = v
  }

  _addToMatrixValue(i, z) {
    if (z === 0) return

    this._setMatrixValue(i, this._matrix[i] + z)
  }

  _getMatrixValue (i) {
    if (i < 0 || i > this.matrixArea) {
      return undefined
    }

    return this._matrix[i]
  }

  reset() {
    this._clearMatrix()
  }

  randomize() {
    this._randomizeMatrix()
  }

  raise ({ x, y }, zDelta = 100, density = 4) {
    const pos = this._getMatrixIndex(x, y)
    this._addToMatrixValue(pos, zDelta)

    // Raises the the surrounding neighbors of the given cell by a constant fraction
    // of the center(given) cell.
    //                         
    //   0.25 0.25 0.25               
    //   0.25 1.00 0.25            
    //   0.25 0.25 0.25            
    //                         
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i !== 0 || j !== 0) {
          this._addToMatrixValue(this._getMatrixIndex(x + i, y + j), zDelta / density)
        }
      }
    }

    this._blur({ x, y })

    const z = this._matrix[pos]

    if (z < this.min) this.min = z
    if (z > this.max) this.max = z
  }

  _blur({ x, y }, iterations = 0) {
    const ITERATION_CAP = 1 // To ensure decent performance
    if (!x || !y) return
    if (iterations === ITERATION_CAP) return
    if (x < 0 || y < 0 || x >= this.resolution.width || y >= this.resolution.height) return

    // Get coordinates and index positions (in 1-d array data structure) of the neighbors
    // to the given point
    const neighborCoors = []
    const neighborIndexes = []
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const coor = [ x + j, y + i ]
        neighborCoors.push(coor)
        neighborIndexes.push(this._getMatrixIndex(...coor))
      }
    }

    const preValues = neighborIndexes.map(i => {
      return this._getMatrixValue(i)
    })

    const blurredValues = B.blur().radius(2).width(3)(preValues)

    neighborIndexes.forEach((cellPosition, i) => {
      this._setMatrixValue(cellPosition, blurredValues[i])
    })
  }

  /**
   * Returns an array of Multipolygons that represent the mapped contours of the given matrix.
   * Each contour line is placed at an consistent interval. The number of buckets grows as the
   * highest value in the matrix grows.
   * TODO: should there be a maximum number of buckets for performance reasons?
   */
  _getIsobands (matrix) {
    const x = this.resolution.width
    const y = this.resolution.height

    // Equation ensures that the highest value is always contained within a bucket
    const thresholdMax = (this.bucketCount + 1) * this.zRange / this.bucketCount
    const thresholds = range(1, thresholdMax, CONTOUR_INTERVAL).reverse()

    const contours = d3.contours()
      .size([ x, y ])
      .thresholds(thresholds)

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

  _clearMatrix() {
    this.matrix = fill(new Array(this.matrixArea), 10)
  }

  _randomizeMatrix() {
    const values = fill(new Array(this.matrixArea), 10) // TODO reduce redundancy with clearmatrix

    let curr = 0

    for (let x = 0; x < this.resolution.width; x++) {
      for (let y = 0; y < this.resolution.height; y++) {
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

    this.matrix = values
  }

  _initMatrix () {
    const initValues = () => {
      return fill(new Array(this.matrixArea), 10) // TODO init should be to 0, but might have an edge-case bug, so testing w 10 :)
    }

    const matrices = {
      random: () => {
        const values = initValues()

        let curr = 0

        for (let x = 0; x < this.resolution.width; x++) {
          for (let y = 0; y < this.resolution.height; y++) {
            const z = [
              0,
              Math.random() * 100,
              (x * 10) + y,
              this._randomBm() * 100,
            ][3]

            if (z < this.min) this.min = z
            if (z > this.max) this.max = z

            values[curr] = z
            curr++
          }
        }

        return values
      },
      empty: initValues,
    }

    return matrices
  }
}
