/* eslint-disable no-unused-vars */
import { Image } from 'image-js'
import P5 from 'p5'

import { Contours, THRESHOLD_OPTIONS } from './Contours'
import Display from './Grid'

const DEBUG = false
const DRAW_GRID = DEBUG

export class Sketcher {
  constructor(options) {
    this.canvas = new Canvas(options.canvasSize, options.canvasId)

    this.p5 = new P5(p5 => {p5.setup = Sketch.setup(p5, this.canvas.size)}, this.canvas.id)
    this.sketch = new Sketch(this.p5, this.canvas, options)

    this.p5.setup = this.sketch.setup()
    this.p5.draw = this.sketch.draw()

    this.sketch.p5 = this.p5
  }
}

export class Canvas {
  constructor(size, id = 'p5-canvas', scale = 30) {
    this.size = size
    this.id = id

    this.sketch = undefined

    // ?? Create constructor for display that only requires size and scale?
    this.display = new Display(this.size, {
      width: this.size.width / scale,
      height: this.size.height / scale,
    })
  }

  initSketch(sketchOptions) {
    // TODO: the sketch should keep track of the sketch settings? force, decay etc. are not attached to sketch's "this"
    // this.sketch = new P5(p5 => new Sketch(p5, this, sketchOptions), this.canvasId)
  }

  /**
   * Get the coordinates of a cell based on the given mouse position.
   *
   * @param {Object} mousePosition Coordinates of the mouse.
   * @returns {Object} Coordinates of the cell.
   */
  getContainingCell(mousePosition) {
    return this.display.getContainingCellCoordinates(mousePosition)
  }
}

/**
 * Manages the drawing of topography.
 * The drawing goes through a loop, each loop processes the topography data and updates the canvas
 * ONLY if the topography data has changed (done via noLoop() in setup and redraw() as necessary).
 */
class Sketch {
  constructor (p5, canvas, { preset = THRESHOLD_OPTIONS.EMPTY }) {
    this.canvasSize = canvas.size // The screen size of the sketch.
    this.display = canvas.display

    this.p5 = p5
    // this.p5.setup = this.setup
    // this.p5.draw = this.draw


    // this.p5 = new P5(p5 => { // The sketch.
    //   p5.setup = this._setup(p5)
    //   p5.draw = this._draw(p5)
    // }, canvasId)

    // this.display = new Display(canvasSize, {
    //   width: canvasSize.width / scale,
    //   height: canvasSize.height / scale,
    // })

    this.topography = new Contours(this.display, preset) // The topography...
  }

  /**
   * Returns a sketch with random topography.
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getRandomInstance ({ scale }) {
    return new this({ scale, preset: THRESHOLD_OPTIONS.RANDOM })
  }

  /**
   * Returns a sketch with no topography.
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getEmptyInstance ({ scale }) {
    return new this({ scale, preset: THRESHOLD_OPTIONS.EMPTY })
  }

  /**
   * Erases and restarts the drawing.
   */
  reset(config) {
    if (config.scale) {
      const { scale } = config
      const canvasSize = this.display.dimensions

      this.display = new Display(canvasSize, {
        width: canvasSize.width / scale,
        height: canvasSize.height / scale,
      })
      this.topography = new Contours(this.display, THRESHOLD_OPTIONS.EMPTY)
    } else {
      this.topography.reset()
    }

    this.p5.redraw()
  }

  /**
   * Replaces the drawiing with random topography.
   */
  randomize() {
    this.topography.randomize()
    this.p5.redraw()
  }

  async raiseImage(img) {
    const loadedImg = await Image.load(img)
    const resizedImg = loadedImg.resize({ height: this.display.cellDimensions.height })
    const greyImg = resizedImg.combineChannels().invert()
    console.log(resizedImg.data, this.topography.matrix)
    // TODO: matrix is inaccurate size relative to the display grid resolution
    // since matrix is not same size, image overlay cannot be easily merged
    // TODO: enable method for 'raising' to be relative to the matrix range, while also increaasing the matrix max (this can be assumed if randomize is always uses the same range and standard deviation

    
    // scale image to resolution (image pixel height = resolution height)
    // use algorithmic size shrinker (eg bicubic) (TODO: 4b0k bitmaps should be pre-shrunk server side for most common resolutions)
    // resize and center in container (fill a larger 2d array with zeros in order to 'center' the image that fits within)
    // matrix additive manipulation between the current matrix and the wide-cropped image bitmap
    // set matrix as result
  }

  // ?? should the second parameter be an object that accepts: force, radius, direction (up vs down)
  raiseAtPoint (pointOnCanvas, force = 0) {
    const { x, y } = pointOnCanvas

    const raisedDisplayCell = this._raisePointInTopography({ x, y }, force)
    // Calling redraw ensures the drawing loop is called only when necessary
    this.p5.redraw()

    return raisedDisplayCell
  }

  addPoint({ x, y }) {
    console.log('Not yet implemented', x, y)
  }

  /** p5 setup for the sketch. Runs once. */
  setup() {
    return () => {
      this.p5.createCanvas(this.canvasSize.width, this.canvasSize.height)
      this.p5.noLoop()
      this.p5.colorMode(this.p5.HSB)
      // this._resetStrokeWeight()
    }
    // this.constructor.setup(this.p5, this.canvas.size)
  }

  preload() {

  }

  static setup(p5, canvasSize) {
    return () => {
      p5.createCanvas(canvasSize.width, canvasSize.height)
      p5.noLoop()
      p5.colorMode(p5.HSB)
    }
  }

  /** p5 drawing loop for the sketch. */
  draw() {
    return () => {
      this.p5.clear()

      this._drawBackground()
      this._drawTopography()
      this._drawForeground()
    }
  }

  /**
   * Draws sketch elements that render below (z-index) the topography.
   */
  _drawBackground() {
    this.p5.background('rgba(0, 0, 0, 0)')
  }

  /**
   * Draws sketch elements that render above (z-index) the topography.
   */
  _drawForeground () {
    if (DRAW_GRID) this._drawGrid()
    // if (DRAW_INTERACTVE_DOM) this.drawInteractiveDOM()
  }

  /**
   * Applies a force to the grid point that is closest to the given canvas point.
   *
   * @returns Coordinates of the display cell that was raised.
   */
  _raisePointInTopography (canvasPoint, force) {
    // TODO: use better logic to find the closest gridpoint(or center) and change it there
    // TODO: add distributed changes
    
    // From the given point, get the closest grid column
    let x
    for (let i = 0; i < this.display.width; i++) {
      if (canvasPoint.x < (this.canvasSize.width / this.display.width * i)) {
        x = i - 1
        break
      }
    }

    // From the given point, get the closest grid row
    let y
    for (let i = 0; i < this.display.height; i++) {
      if (canvasPoint.y < (this.canvasSize.height / this.display.height * i)) {
        y = i - 1
        break
      }
    }

    this.topography.raise({ x, y }, force)

    return { x, y }
  }

  /**
   * Draws the given polygon.
   */
  _drawPolygon (polygon) {
    polygon.forEach(coor => {
      const [ x, y ] = coor
      const canvasCoor = this._getCanvasCoordinate(x, y)

      this.p5.vertex(canvasCoor.x, canvasCoor.y)
    })
  }

  /*8
   * Draws the given multipolygon.
   */
  _drawMultipolygon (mp) {
    const p5 = this.p5

    mp.forEach(polygon => {
      const positiveSpace = polygon[0]

      p5.beginShape()

      this._drawPolygon(positiveSpace)

      polygon.forEach(negativeSpace => {
        p5.beginContour()

        this._drawPolygon(negativeSpace)

        p5.endContour()
      })

      p5.endShape()
    })
  }

  /**
   * Returns the coordinate of the HTML canvas that corresponds to the given matrix coordinates.
   */
  _getCanvasCoordinate (matrixX, matrixY) {
    return {
      x: Math.floor(this.p5.map(matrixX, 0, this.display.width, 0, this.canvasSize.width)),
      y: Math.floor(this.p5.map(matrixY, 0, this.display.height, 0, this.canvasSize.height)),
    }
  }

  /**
   * Draws a dotted grid. One dot to denote the corner intersections of grid cells.
   */
  _drawGrid () {
    this.p5.stroke(0, 0, 90)
    this.p5.fill(0, 0, 90)

    this.topography.matrix.forEach((z, i) => {
      const x = i % this.display.width
      const y = i / this.display.width

      const canvasCoor = this._getCanvasCoordinate(x, y)

      this.p5.circle(canvasCoor.x, canvasCoor.y, z)
    })
  }

  /*8
   * Resets stroke weight.
   */
  _resetStrokeWeight () {
    const defaultStroke = 0.2
    this.p5.strokeWeight(defaultStroke)
  }

  /**
   * Draws the topography contours.
   */
  _drawTopography() {
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

    const fill = (color = 'rgba(0, 0, 0, 0)') => {
      p5.fill(color)
      if (STYLE_CHOROPLETH) p5.fill(color)
    }
    const stroke = color => p5.stroke(STYLE_CHOROPLETH ? '#4b4b4b' : color)

    const contours = this.topography.isobands

    // This is attempting to draw gradients. extract method for only lines (no fill)
    contours.forEach((contour, i, contours) => {
      const color = p5.lerpColor(p5.color(...START_COLOR), p5.color(...END_COLOR), i / contours.length)
      fill() // color
      stroke('black') //color
      this._resetStrokeWeight()

      if (DRAW_GRID && i === 0) {
        p5.stroke('black') // Removes outer border
        p5.noFill()
      }

      if (i === 0) p5.noStroke()
      // if (i === 1) p5.strokeWeight(1)

      this._drawMultipolygon(contour.coordinates || contour.geometry)
    })

    if (DRAW_MATRIX) {
      this.p5.stroke('black')
      this.p5.fill('black')
      this._drawGrid()
    }
  }
}
