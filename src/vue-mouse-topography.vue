<template>
  <div 
    id="default-interface"
    class="topography"
  >
    <!-- <div -->
    <!--   :id="sketchId" -->
    <!--   class="p5&#45;canvas" -->
    <!-- /> -->
  </div>
</template>

<script>
import { MouseTopography } from './MouseTopography'

const DEFAULT_SCALE_COEFFICIENT = 20 // Degree of polygon simplification
const DEFAULT_PING_TIME = 15 // Amount of time(ms) between updates, in milliseconds.
const DEFAULT_FORCE = 8 // The amount of 'z' added to a point during mouse movement.
const DEFAULT_DECAY_TIME = 2000 // Amount of time(ms) before a cell stops growing when the mouse hovers over a cell.

const DEFAULT_INTERFACE_ID = 'default-interface'

var id = 0 // Unique id of of this component // TODO: test that this enables parallel topography instances

// TODO: clean up contours.js

export default {
  name: 'VueMouseTopography',
  props: {
    // Degree to which simplification is applied to the contours.
    scale: {
      type: Number,
      required: false,
      default () {
        return DEFAULT_SCALE_COEFFICIENT
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

    // The ID of the HTML element that acts as the mouse interface. The element that will be used to track the mouse.
    interfaceId: {
      type: String,
      required: false,
      default () {
        return DEFAULT_INTERFACE_ID
      },
    },

    paused: {
      type: Boolean,
      required: false,
      default() {
        return false
      },
    },
  },
  data () {
    return {
      sketchId: 'p5-canvas-' + ++id, // Unique id that matches the a child element's id.
      mouseTopo: undefined, // Topography drawing bound to mouse movements
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

    topoConfig () {
      return {
        canvasId: this.sketchId,
        canvasSize: { width: this.width, height: this.height },
        scale: this.scale,
        decay: this.decay,
        force: this.force,
        ping: this.ping,
        interfaceId: this.interfaceId,
      }
    },

    /** The element that is the mouse interface for drawing the topography. Any element in the document. */
    mouseInterfaceEl() {
      return document.getElementById(this.interfaceId)
    }, 

    /** The mouse interface's events and handler functions for when each event is triggered */
    interfaceEventHandlers() {
      return {
        mousemove: this.handleMousemove,
        mouseleave: this.disable,
        click: this.handleClick,
      }
    },
  },
  watch: {
    decay: function(newDecay) {
      this.mouseTopo.updateDecay(newDecay)
    },
    force: function(newForce) {
      this.mouseTopo.updateForce(newForce)
    },
    ping: function(newPing) {
      this.mouseTopo.updatePing(newPing)
    },
    paused: function(newPaused) {
      newPaused ? this.pause() : this.resume()
    },
  },
  mounted () {
    this.mouseTopo = new MouseTopography(this.topoConfig)
    this.trackMouse()
  },
  unmounted () {
    this.untrackMouse()
    this.mouseTopo.kill()
  },
  methods: {
    handleClick (e) {
      this.mouseTopo.handleClick(e)
    },

    handleMousemove (e) {
      this.mouseTopo.updateMousePosition(e)
    },

    handleMouseleave () {
      this.disable()
    },

    pause() {
      this.untrackMouse()
    },

    resume() {
      this.trackMouse()
    },

    trackMouse() {
      // ?? should the event listeners capture events (be the first to process before others in the DOM tree)
      // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener#matching_event_listeners_for_removal
      Object.entries(this.interfaceEventHandlers).forEach(([ event, handler ]) => {
        this.mouseInterfaceEl.addEventListener(event, handler)
      })
    },

    untrackMouse() {
      Object.entries(this.interfaceEventHandlers).forEach(([ event, handler ]) => {
        this.mouseInterfaceEl.removeEventListener(event, handler)
      })
    },

    /** Resets the topography and updates the config. */
    reset () {
      this.mouseTopo.resetSketch(this.topoConfig)
    },

    /** Randomizes the topography. */
    randomize() {
      this.mouseTopo.randomizeSketch()
    },

    /**
     * Resets the variables that change the state of the topography.
     */
    disable () {
      this.mouseTopo.disable()
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
