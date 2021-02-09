/**
 * Tracks the mouse movements within a given HTML element.
 */

// SHOULD THIS BE TRACKING THE CELL OF THE SIMPLIFICATION GRID? OR JUST THE MOUSE MOVEMENTS
export default class MouseTrackingManager {
  constructor() {
    this.currMousePos = null
    this.prevMousePos = null
  }

  // Whether or not the mouse has moved since the last rendering update.
  get mouseMoved() {
    if (!this.currMousePos) {return this.currMousePos !== this.prevMousePos}

    return !(
      this.currMousePos.x === this.prevMousePos.x &&
      this.currMousePos.y === this.prevMousePos.y
    )
  }

  /**
     * @param {Event} e A mouse event.
     * @returns {x: Number, y: Number} Mouse coordinates within this element's DOM box.
     */
  static getMousePositionRelativeToGivenEl (e, el) {
    const rect = el.getBoundingClientRect()
    return {
      x: e.pageX - rect.x,
      y: e.pageY + Math.abs(rect.y),
    }
  }

  static getRelativeMousePosition(e) {
    const interfaceEl = e.srcElement
    const rect = interfaceEl.getBoundingClientRect()
    return { x: e.x - rect.x, y: e.y - rect.y }
  }

  get mousePosition() {
    return this.currMousePos
  }

  /**
   * Updates the mouse position with a given mouse move event.
   */
  updateMousePosition(e = null) {
    this.prevMousePos = this.currMousePos

    if (e !== null) {
      this.currMousePos = this.constructor.getRelativeMousePosition(e)
    }
  }

  // Resets the variables that change the state of topography?
  // TODO: disconnect wording from topography. figure out what this does and how to reverse it
  disable() {
    this.hoverStartTime = null
    this.currMousePos = null
  }
}
