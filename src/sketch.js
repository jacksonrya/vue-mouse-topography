/* eslint-disable no-unused-vars */
import { fill } from 'lodash'
import P5 from 'p5'

import * as Topography from './Contours'

const DEBUG = false
const DRAW_GRID = DEBUG && false
const DRAW_INTERACTVE_DOM = DEBUG && false

// The resolution of the drawing--contour line granularity.
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

  get size () {
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

/**
 * The matrix of cells that span the sketch client.
 */
export class Plat {
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

class TopographySketch {
  constructor ({
    canvasId = 'p5-canvas',
    dimensions = undefined,
    simplify = 30,
    preset = Topography.EMPTY, 
  }) {
    this.canvasId = canvasId // The element's id for the p5 sketch.
    this.dimensions = dimensions // The screen size of the topography container.

    this.p5 = new P5(p5 => { // The sketch.
      p5.setup = this.setup(p5)
      p5.draw = this.draw(p5)
    }, canvasId)

    this.resolution = new Resolution(dimensions.width / simplify, dimensions.height / simplify) // The resolution of the structured grid.
    this._plat = new Plat(this.dimensions, this.resolution)

    this.topography = new Topography.Topography(this.resolution, this.dimensions, preset) // The topography...
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getGoldsteinInstance ({
    canvasId, dimensions, simplify, 
  }) {
    return new this({
      canvasId, dimensions, simplify, preset: Topography.GOLDSTEIN, 
    })
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getRandomInstance ({
    canvasId, dimensions, simplify, 
  }) {
    return new this({
      canvasId, dimensions, simplify, preset: Topography.RANDOM, 
    })
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getEmptyInstance ({
    canvasId, dimensions, simplify, 
  }) {
    return new this({
      canvasId, dimensions, simplify, preset: Topography.EMPTY, 
    })
  }

  get plat () {
    return this._plat
  }

  /**
   * Get the coordinates of a cell based on the given mouse position.
   * @param {Object} mousePosition Coordinates of the mouse.
   * @returns {Object} Coordinates of the cell.
   */
  getCell (mousePosition) {
    return this.plat.getCell(mousePosition)
  }

  addPoint () {
    console.log('Adding point not yet implemented.')
  }

  setup (p5) {
    return () => {
      p5.createCanvas(this.dimensions.width, this.dimensions.height)
      p5.noLoop()
      p5.colorMode(p5.HSB)
      this.resetStrokeWeight()
    }
  }

  draw (p5) {
    return () => {
      p5.push()

      this.drawBackground()
      this.drawTopography()
      this.drawForeground()

      p5.pop()
    }
  }

  /**
   * Draws sketch elements that render below (z-index) the topography.
   */
  drawBackground () {
    this.p5.background('white')

    if (DRAW_GRID) this.drawGrid()
  }

  /**
   * Draws sketch elements that render above (z-index) the topography.
   */
  drawForeground () {
    if (DRAW_INTERACTVE_DOM) this.drawInteractiveDOM()
  }

  drawInteractiveDOM () {
    const els = document.getElementsByClassName('topography-block')

    els.forEach(el => {
      const rect = el.getBoundingClientRect()
      const {
        x, y, width, height, 
      } = rect

      const padding = 40

      this.p5.rect(x + window.scrollX - padding, y + window.scrollY - padding, width + padding * 2, height + padding * 2)
    })
  }

  update (mousePosition, force = 0) {
    const { x, y } = mousePosition

    this._updateMatrix({ x, y }, force)
    this.p5.redraw()
  }

  _updateMatrix (mousePosition, force) {
    // TODO: use better logic to find the closest gridpoint(or center) and change it there
    // TODO: add distributed changes
    let x
    for (let i = 0; i < this.resolution.columnCount; i++) {
      if (mousePosition.x < (this.dimensions.width / this.resolution.columnCount * i)) {
        x = i - 1
        break
      }
    }

    let y
    for (let i = 0; i < this.resolution.rowCount; i++) {
      if (mousePosition.y < (this.dimensions.height / this.resolution.rowCount * i)) {
        y = i - 1
        break
      }
    }

    this.topography.raise({ x, y }, force)
  }

  makeMultipolygon (mp) {
    const p5 = this.p5

    mp.forEach(polygon => {
      const positiveSpace = polygon[0]

      p5.beginShape()

      this.makePolygon(positiveSpace)

      polygon.forEach(negativeSpace => {
        p5.beginContour()

        this.makePolygon(negativeSpace)

        p5.endContour()
      })

      p5.endShape()
    })
  }

  getCanvasCoordinate (matrixX, matrixY) {
    return {
      x: Math.floor(this.p5.map(matrixX, 0, this.resolution.columnCount, 0, this.dimensions.width)),
      y: Math.floor(this.p5.map(matrixY, 0, this.resolution.rowCount, 0, this.dimensions.height)),
    }
  }

  makePolygon (polygon) {
    polygon.forEach(coor => {
      const [ x, y ] = coor
      const canvasCoor = this.getCanvasCoordinate(x, y)

      this.p5.vertex(canvasCoor.x, canvasCoor.y)
    })
  }

  makeMatrix (matrix) {
    matrix.forEach((z, i) => {
      const x = i % this.resolution.columnCount
      const y = i / this.resolution.columnCount

      const canvasCoor = this.getCanvasCoordinate(x, y)

      this.p5.circle(canvasCoor.x, canvasCoor.y, z)
    })
  }

  drawGrid () {
    this.p5.stroke(0, 0, 90)
    this.p5.fill(0, 0, 90)
    this.makeMatrix(fill(new Array(this.topography.matrixArea), 2))
  }

  resetStrokeWeight () {
    const defaultStroke = 0.2
    this.p5.strokeWeight(defaultStroke)
  }

  drawTopography () {
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

    const contours = this.topography.getIsobands()

    contours.forEach((contour, i, contours) => {
      const color = p5.lerpColor(p5.color(...START_COLOR), p5.color(...END_COLOR), i / contours.length)
      fill(color)
      stroke(color)
      this.resetStrokeWeight()

      if (DRAW_GRID && i === 0) {
        p5.stroke('black') // Removes outer border
        p5.noFill()
      }

      if (i === 0) p5.noStroke()
      // if (i === 1) p5.strokeWeight(1)

      this.makeMultipolygon(contour.coordinates || contour.geometry)
    })

    if (DRAW_MATRIX) {
      this.p5.stroke('black')
      this.p5.fill('black')
      this.makeMatrix(this.topography.getMatrix())
    }
  }
}

export { TopographySketch }
