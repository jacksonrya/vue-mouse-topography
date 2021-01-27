<template>
  <div 
    class="topography"
    @click="handleClick"
    @mousemove="handleMousemove"
    @mouseleave="disable()"
  >
    <!-- <div -->
    <!--   :id="sketchId" -->
    <!--   class="p5&#45;canvas" -->
    <!-- /> -->
  </div>
</template>

<script>
import { isEqual } from 'lodash'

import { TopographySketch } from './sketch'

const DEFAULT_SIMPLIFY_COEFFICIENT = 20 // Degree of polygon simplification
const DEFAULT_PING_TIME = 15 // Amount of time(ms) between updates, in milliseconds.
const DEFAULT_FORCE = 8 // The amount of 'z' added to a point during mouse movement.
const DEFAULT_DECAY_TIME = 2000 // Amount of time(ms) before a cell stops growing when the mouse hovers over a cell.

var id = 0 // Unique id of of this component // TODO: test that this enables parallel topography instances

export default {
  name: 'VueMouseTopography',
  props: {
    // Degree to which simplification is applied to the contours.
    simplify: {
      type: Number,
      required: false,
      default () {
        return DEFAULT_SIMPLIFY_COEFFICIENT
      },
    },

    // Amount of time(ms) between updates.
    ping: {
      type: Number,
      required: false,
      default () {
        return DEFAULT_PING_TIME
      },
    },

    // The amount of 'z' added to a point during mouse movement.
    force: {
      type: Number,
      required: false,
      default () {
        return DEFAULT_FORCE
      },
    },

    // Amount of time(ms) before a cell stops growing when the mouse hovers over a cell.
    decay: {
      type: Number,
      required: false,
      default () {
        return DEFAULT_DECAY_TIME
      },
    },
  },
  data () {
    return {
      sketchId: 'p5-canvas-' + ++id, // Unique id that matches the a child element's id.
      sketch: undefined, // The p5 sketch.
      mousePosition: undefined, // Mouse position coordinates relative to the root element's size.
      prevMousePosition: undefined, // Previous mouse position.
      mouseCell: undefined, // Coordinates of the resolution cell that the mouse is within.
      prevMouseCell: undefined, // Previous coordinates of the resolution cell that the mouse was within.
      updateIntervalId: undefined, // The id of the interval between updates.
      restingPointerStartTime: undefined,
    }
  },
  computed: {
    // Width of this component's root element.
    width () {
      return Math.ceil(this.$el.clientWidth)
    },

    // Height of this component's root element.
    height () {
      return Math.ceil(this.$el.clientHeight)
    },

    // Whether or not the mouse has moved since the last rendering update.
    mouseMoved () {
      if (!this.mousePosition) { return this.mousePosition !== this.prevMousePosition }

      return !(
        this.mousePosition.x === this.prevMousePosition.x &&
        this.mousePosition.y === this.prevMousePosition.y
      )
    },
  },
  mounted () {
    const topographyConfig = {
      canvasId: this.sketchId,
      dimensions: { width: this.width, height: this.height },
      simplify: this.simplify,
    }

    this.sketch = TopographySketch.getEmptyInstance(topographyConfig)

    this.updateIntervalId = setInterval(this.update, this.ping)
  },
  unmounted () {
    clearInterval(this.updateIntervalId)
  },
  methods: {
    /**
     * @param {Event} e A mouse event.
     * @returns {x: Number, y: Number} Mouse coordinates within this element's DOM box.
     */
    getMousePosition (e) {
      const rect = this.$el.getBoundingClientRect()
      return {
        x: e.pageX - rect.x,
        y: e.pageY + Math.abs(rect.y),
      }
    },

    handleClick (e) {
      this.sketch.addPoint(this.getMousePosition(e))
    },

    handleMousemove (e) {
      this.prevMousePosition = this.mousePosition

      this.mousePosition = this.getMousePosition(e)

      this.updateMouseCell()
    },

    updateMouseCell () {
      this.prevMouseCell = this.mouseCell
      this.mouseCell = this.sketch.getCell(this.mousePosition)

      if (this.mouseCellChanged(this.prevMouseCell, this.mouseCell)) {
        this.restingPointerStartTime = new Date().getTime()
      }
    },

    // The resolution cell that the mouse is hovering over.
    mouseCellChanged (prevMouseCell, mouseCell) {
      if (!prevMouseCell && !mouseCell) return false

      return !isEqual(prevMouseCell, mouseCell)
    },

    /**
     * Updates the drawing to represent the current mouse position if one exists.
     */
    update () {
      if (this.mousePosition) {
        const hoverTime = new Date().getTime() - this.restingPointerStartTime

        let hoverForce = (this.decay - hoverTime) / this.decay
        if (hoverForce < 0) hoverForce = 0

        const force = this.mouseCellChanged(this.prevMouseCell, this.mouseCell)
          ? this.force
          : (hoverForce * this.force) / 6 // arbitrary fraction of the default

        this.sketch.update(this.mousePosition, force || 0)
      }

      this.prevMousePosition = this.mousePosition
      this.updateMouseCell()
    },

    /**
     * Resets the variables that change the state of the topography.
     */
    disable () {
      this.restingPointerStartTime = undefined
      this.mousePosition = undefined
      this.mouseCell = undefined
    },
  },
}
</script>

<style>
.topography {
  position: relative;

  align-items: center;
  justify-content: center;
}

.box-1 {
  width: 200px;
  height: 300px;
  background: white;
  border: 3px solid black;

  z-index: 1;

  opacity: 0;
}

.p5-canvas {
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
  align-items: center;
  justify-content: center;

  pointer-events: none;
}

.p5-canvas .canvas {
  width: 100%;
  height: 100%;
}
</style>
