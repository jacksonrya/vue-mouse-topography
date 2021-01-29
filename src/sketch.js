/* eslint-disable no-unused-vars */
import fill from 'lodash-es/fill.js'
import P5 from 'p5'

import { Contours, THRESHOLD_OPTIONS } from './Contours'
import { Grid } from './Grid'

const DEBUG = false
const DRAW_GRID = DEBUG
const DRAW_INTERACTVE_DOM = DEBUG

/**
 * A p5 sketch that draws topographic contour lines.
 *
 * @param {string} canvasId - The id given to the canvas HTML element.
 * @param {Object} canvasSize - The dimensions of the canvas.
 * @param {number} canvasSize.width
 * @param {number} canvasSize.height
 * @param {number} scale - The scale of each cell within the contouring grid (unit pixels).
 * @param {string} preset - A preset of values used to initialize the topography z-values.
 */
export default class {
  constructor ({
    canvasId = 'p5-canvas',
    canvasSize = undefined,
    scale = 30,
    preset = THRESHOLD_OPTIONS.EMPTY, 
  }) {
    this.canvasId = canvasId
    this.canvasSize = canvasSize

    this.p5 = new P5(p5 => { // The sketch.
      p5.setup = this._setup(p5)
      p5.draw = this._draw(p5)
    }, canvasId)

    this.preset = preset

    // The grid representing the rastered resolution of the canvas
    this.grid = Grid.simplified(this.canvasSize, scale)

    this.topography = new Contours(this.grid, this.preset) // The topography...
  }

  updateSimplification(k) {
    this.grid = Grid.simplified(this.canvasSize, k)

    this.topography = new Contours(this.grid, this.preset) // The topography...
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getGoldsteinInstance ({
    canvasId, canvasSize, scale, 
  }) {
    return new this({
      canvasId, canvasSize, scale, preset: THRESHOLD_OPTIONS.GOLDSTEIN, 
    })
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getRandomInstance ({
    canvasId, canvasSize, scale, 
  }) {
    return new this({
      canvasId, canvasSize, scale, preset: THRESHOLD_OPTIONS.RANDOM, 
    })
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getEmptyInstance ({
    canvasId, canvasSize, scale, 
  }) {
    return new this({
      canvasId, canvasSize, scale, preset: THRESHOLD_OPTIONS.EMPTY, 
    })
  }

  reset({ scale }) {
    if (scale) {
      this.updateSimplification(scale)
    } else {
      this.topography.reset()
    }
    this.p5.redraw()
  }

  randomize() {
    this.topography.randomize()
    this.p5.redraw()
  }

  update (mousePosition, force = 0) {
    const { x, y } = mousePosition

    this._updateMatrix({ x, y }, force)
    this.p5.redraw()
  }

  /**
   * Get the coordinates of a cell based on the given mouse position.
   * @param {Object} mousePosition Coordinates of the mouse.
   * @returns {Object} Coordinates of the cell.
   */
  getContainingCell(mousePosition) {
    return this.grid.getContainingCellCoordinates(mousePosition)
  }

  addPoint () {
    console.log('Adding point not yet implemented.')
  }

  _setup (p5) {
    return () => {
      p5.createCanvas(this.canvasSize.width, this.canvasSize.height)
      p5.noLoop()
      p5.colorMode(p5.HSB)
      this._resetStrokeWeight()
    }
  }

  _draw (p5) {
    return () => {
      p5.push()

      this._drawBackground()
      this._drawTopography()
      this._drawForeground()

      p5.pop()
    }
  }

  /**
   * Draws sketch elements that render below (z-index) the topography.
   */
  _drawBackground () {
    this.p5.background('white')
  }

  /**
   * Draws sketch elements that render above (z-index) the topography.
   */
  _drawForeground () {
    if (DRAW_GRID) this._drawGrid()
    // if (DRAW_INTERACTVE_DOM) this.drawInteractiveDOM()
  }

  // drawInteractiveDOM () {
  //   const els = document.getElementsByClassName('topography-block')
  //
  //   els.forEach(el => {
  //     const rect = el.getBoundingClientRect()
  //     const {
  //       x, y, width, height, 
  //     } = rect
  //
  //     const padding = 40
  //
  //     this.p5.rect(x + window.scrollX - padding, y + window.scrollY - padding, width + padding * 2, height + padding * 2)
  //   })
  // }

  _updateMatrix (mousePosition, force) {
    // TODO: use better logic to find the closest gridpoint(or center) and change it there
    // TODO: add distributed changes
    let x
    for (let i = 0; i < this.grid.columnCount; i++) {
      if (mousePosition.x < (this.canvasSize.width / this.grid.columnCount * i)) {
        x = i - 1
        break
      }
    }

    let y
    for (let i = 0; i < this.grid.rowCount; i++) {
      if (mousePosition.y < (this.canvasSize.height / this.grid.rowCount * i)) {
        y = i - 1
        break
      }
    }

    this.topography.raise({ x, y }, force)
  }

  _makePolygon (polygon) {
    polygon.forEach(coor => {
      const [ x, y ] = coor
      const canvasCoor = this._getCanvasCoordinate(x, y)

      this.p5.vertex(canvasCoor.x, canvasCoor.y)
    })
  }

  _makeMultipolygon (mp) {
    const p5 = this.p5

    mp.forEach(polygon => {
      const positiveSpace = polygon[0]

      p5.beginShape()

      this._makePolygon(positiveSpace)

      polygon.forEach(negativeSpace => {
        p5.beginContour()

        this._makePolygon(negativeSpace)

        p5.endContour()
      })

      p5.endShape()
    })
  }

  _getCanvasCoordinate (matrixX, matrixY) {
    return {
      x: Math.floor(this.p5.map(matrixX, 0, this.grid.columnCount, 0, this.canvasSize.width)),
      y: Math.floor(this.p5.map(matrixY, 0, this.grid.rowCount, 0, this.canvasSize.height)),
    }
  }

  _makeMatrix (matrix) {
    matrix.forEach((z, i) => {
      const x = i % this.grid.columnCount
      const y = i / this.grid.columnCount

      const canvasCoor = this._getCanvasCoordinate(x, y)

      this.p5.circle(canvasCoor.x, canvasCoor.y, z)
    })
  }

  /**
   * Draws a dotted grid. One dot to denote the corner intersections of grid cells.
   */
  _drawGrid () {
    this.p5.stroke(0, 0, 90)
    this.p5.fill(0, 0, 90)
    this._makeMatrix(fill(new Array(this.topography.matrixArea), 2))
  }

  _resetStrokeWeight () {
    const defaultStroke = 0.2
    this.p5.strokeWeight(defaultStroke)
  }

  _drawTopography () {
    const p5 = this.p5

    const STYLE_CHOROPLETH = false
    const START_COLOR = [ 
      0,
      0,
      0, 
    ] // SHOULD BE #4b4b4b
    const END_COLOR = [ 
      0,
      0,
      60, 
    ]
    const DRAW_MATRIX = false

    const fill = (color = 'white') => {
      p5.fill('white')
      if (STYLE_CHOROPLETH) p5.fill(color)
    }
    const stroke = color => p5.stroke(STYLE_CHOROPLETH ? '#4b4b4b' : color)

    const contours = this.topography.isobands

    contours.forEach((contour, i, contours) => {
      const color = p5.lerpColor(p5.color(...START_COLOR), p5.color(...END_COLOR), i / contours.length)
      fill(color)
      stroke(color)
      this._resetStrokeWeight()

      if (DRAW_GRID && i === 0) {
        p5.stroke('black') // Removes outer border
        p5.noFill()
      }

      if (i === 0) p5.noStroke()
      // if (i === 1) p5.strokeWeight(1)

      this._makeMultipolygon(contour.coordinates || contour.geometry)
    })

    if (DRAW_MATRIX) {
      this.p5.stroke('black')
      this.p5.fill('black')
      this._makeMatrix(this.topography.matrix)
    }
  }
}
