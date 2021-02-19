import isEqual from 'lodash-es/isEqual.js'

import MouseTrackingManager from './MouseTrackingManager'
import Sketch from './Sketch'


/**
 * Manages the connection between mouse movements, topography contruction, and the speed/ force of
 * that construction
 */
export class MouseTopography {
  constructor({
    canvasId,
    canvasSize,
    scale,
    force,
    decay,
    ping,
    interfaceEl,
    style,
  }) {
    this.topographySketch = Sketch.getEmptyInstance({
      canvasId,
      canvasSize,
      scale,
      style,
    })

    this.canvasSize = canvasSize

    // Update the drawing at a constant interval
    this.updateIntervalId = setInterval(this.update.bind(this), ping)

    this.decay = decay
    this.force = force

    this.mouse = new MouseTrackingManager(interfaceEl)

    this.currHoveredCell = null
    this.prevHoveredCell = null

    this.hoverStartTime = null
  }

  updatePing(ping) {
    clearInterval(this.updateIntervalId)

    this.updateIntervalId = setInterval(this.update.bind(this), ping)
  }

  updateDecay(decay) {
    this.decay = decay
  }

  updateForce(force) {
    this.force = force
  }

  /** Whether the mouse has moved between display cells. */
  get mouseCellChanged() {
    if (!this.prevHoveredCell && !this.currHoveredCell) return false

    return !isEqual(this.prevHoveredCell, this.currHoveredCell)
  }

  /** Returns the amount of time the user spends hovering over a specific display cell. */
  get timeSpentHoveringOverCell() {
    if (this.hoverStartTime === undefined) return null

    return new Date().getTime() - this.hoverStartTime
  }

  /** Returns whether the user has moved their mouse to a new cell. */
  get mouseMovedToDifferentCell() {
    if (!this.prevHoveredCell) return true
    if (!this.currHoveredCell) return this.currHoveredCell !== this.prevHoveredCell

    return !(
      this.currHoveredCell.x === this.prevHoveredCell.x &&
      this.currHoveredCell.y === this.prevHoveredCell.y
    )
  }

  /** 
   * Updates the topography drawing. Adds topography (amount dependent on applied force) based
   * on the location of the mouse. If the mouse is is hovering within a display cell, the force decays.
   * Otherwise, the force is constant while the mouse is moving between cells.
   */
  update() {
    if (this.currHoveredCell) {
      const hoverTime = this.timeSpentHoveringOverCell || 0

      // Gradually lessen the force of drawing during the decay period while the user doesn't move the mouse
      let hoverForce = (this.decay - hoverTime) / this.decay
      if (hoverForce < 0) hoverForce = 0

      // If the mouse has moved, apply the full force; otherwise, apply the decaying force.
      const force = this.mouseMovedToDifferentCell
        ? this.force
        : (hoverForce * this.force) / 6 // arbitrary fraction of the default

      this.currHoveredCell = this.topographySketch.raiseAtPoint(this.mouse.getMappedMousePosition(this.canvasSize), force || 0)
    }

    this._updateHoveredCell()
  }

  /** Update the mouse position via the given mouse event's data */
  updateMousePosition(e) {
    this.mouse.updateMousePosition(e)
    this._updateHoveredCell(e)
  }

  /** Updates which display cell is currently hovered by the user. */
  _updateHoveredCell(e = null) {
    this.prevHoveredCell = this.currHoveredCell

    if (e !== null) {
      this.currHoveredCell = this.topographySketch.getContainingCell(this.mouse.getMappedMousePosition(this.canvasSize))
      if (this.mouseCellChanged) {
        this.resetHoveringTimer()
      }
    }
  }

  /** Resets the timer that keeps track of how long the user is hovering over a display cell. */
  resetHoveringTimer() {
    this.hoverStartTime = new Date().getTime()
  }

  /** Erases the topography and restarts the sketch with a new configuration. */
  resetSketch(config) {
    this.topographySketch.reset(config)
  }

  /** Randomizes the topography. */
  randomizeSketch() {
    this.topographySketch.randomize()
  }

  handleClick(e) {
    console.log('Not yet implemented', e)
  }

  /** Turns off updates to the sketch and interactions with the sketch. */
  disable() {
    this.mouse.disable()
    this.currHoveredCell = null
    this.prevHoveredCell = null
    this.hoverStartTime = null
  }

  /** Removes any variables not cleaned up by the garbage collector. */
  kill() {
    clearInterval(this.updateIntervalId)
  }
}
