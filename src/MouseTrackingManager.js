/**
 * Tracks the mouse movements within a given HTML element.
 */

// SHOULD THIS BE TRACKING THE CELL OF THE SIMPLIFICATION GRID? OR JUST THE MOUSE MOVEMENTS
export default class MouseTrackingManager {
  constructor(interfaceEl) {
    this.interfaceEl = interfaceEl

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

  static getMousePositionInEl(e) {
    const rect = e.srcElement.getBoundingClientRect()
    return { x: e.x - rect.x, y: e.y - rect.y }
  }

  get mousePosition() {
    return this.currMousePos
  }

  get relativeMousePosition() {
    const { x, y } = this.currMousePos
    const { width, height } = this.interfaceEl.getBoundingClientRect()
    return {
      rx: x / width,
      ry: y / height,
    }
  }

  getMappedMousePosition({ width, height }) {
    const { rx, ry } = this.relativeMousePosition
    return { x: rx * width, y: ry * height }
  }

  /**
   * Updates the mouse position with a given mouse move event.
   */
  updateMousePosition(e = null) {
    this.prevMousePos = this.currMousePos

    if (e !== null) {
      // this.interfaceEl = e.srcElement
      this.currMousePos = this.constructor.getMousePositionInEl(e)
    }
  }

  // Resets the variables that change the state of topography?
  // TODO: disconnect wording from topography. figure out what this does and how to reverse it
  disable() {
    this.hoverStartTime = null
    this.currMousePos = null
  }
}
