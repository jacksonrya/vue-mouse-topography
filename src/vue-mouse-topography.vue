<template>
  <div 
    id="default-interface"
    ref="root"
    class="topography"
    :class="{ noninteractive: !usingDefaultInterface }"
  >
    <div
      :id="sketchId"
      class="p5-canvas"
    />
  </div>
</template>

<script setup>
import {
  computed, defineExpose, defineProps, ref, watch, onMounted, onUnmounted,
} from 'vue'

import { MouseTopography } from './MouseTopography'

var id = 0 // Unique id of of this component // TODO: test that this enables parallel topography instances

// TODO: clean up contours.js


const props = defineProps( {
  // Degree to which simplification is applied to the contours.
  scale: {
    type: Number,
    required: false,
    default () {
      return 20
    },
  },

  // Amount of time(ms) between updates.
  ping: {
    type: Number,
    required: false,
    default () {
      return 15
    },
  },

  // The amount of 'z' added to a point during mouse movement.
  force: {
    type: Number,
    required: false,
    default () {
      return 8
    },
  },

  // Amount of time(ms) before a cell stops growing when the mouse hovers over a cell.
  decay: {
    type: Number,
    required: false,
    default () {
      return 2000
    },
  },

  // The ID of the HTML element that acts as the mouse interface. The element that will be used to track the mouse.
  interfaceId: {
    type: String,
    required: false,
    default () {
      return 'default-interface'
    },
  },

  paused: {
    type: Boolean,
    required: false,
    default() {
      return false
    },
  },
})

const sketchId = 'p5-canvas-' + ++id; // Unique id that matches the a child element's id.
const mouseTopo = undefined; // Topography drawing bound to mouse movements

const root = ref(null)

const usingDefaultInterface = computed(() => {
  return props.interfaceId == 'default-interface'
})

// Width of this component's root element.
const width = computed(() => {
  return Math.ceil(root.clientWidth)
})

// Height of this component's root element.
const height = computed(() => {
  return Math.ceil(root.clientHeight)
})

const topoConfig = computed(() => {
  return {
    canvasId: sketchId,
    canvasSize: { width, height },
    scale: props.scale,
    decay: props.decay,
    force: props.force,
    ping: props.ping,
    interfaceEl: document.getElementById(props.interfaceId),
  }
})

/** The element that is the mouse interface for drawing the topography. Any element in the document. */
const mouseInterfaceEl = computed(() => {
  return document.getElementById(props.interfaceId)
}) 

/** The mouse interface's events and handler functions for when each event is triggered */
const interfaceEventHandlers = computed(() => {
  return {
    mousemove: handleMousemove,
    mouseleave: disable,
    click: handleClick,
  }
})


watch(() => props.decay, newDecay => {
  this.mouseTopo.updateDecay(newDecay)
})

watch(() => props.force, newForce => {
  this.mouseTopo.updateForce(newForce)
})

watch(() => props.ping, newPing => {
  this.mouseTopo.updatePing(newPing)
})

watch(() => props.paused, newPaused => {
  newPaused ? pause() : resume()
})

onMounted(() => {
  mouseTopo.value = new MouseTopography(topoConfig)
  trackMouse()
})

onUnmounted(() => {
  untrackMouse()
  mouseTopo.value.kill()
})

function handleClick(e) {
  mouseTopo.value.handleClick(e)
}

function handleMousemove(e) {
  mouseTopo.value.updateMousePosition(e)
}

function handleMouseleave() {
  disable()
}

function pause() {
  untrackMouse()
}

function resume() {
  trackMouse()
}

function trackMouse() {
  // ?? should the event listeners capture events (be the first to process before others in the DOM tree)
  // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener#matching_event_listeners_for_removal
  Object.entries(interfaceEventHandlers).forEach(([ event, handler ]) => {
    mouseInterfaceEl.addEventListener(event, handler, { capture: true })
  })
}

function untrackMouse() {
  Object.entries(interfaceEventHandlers).forEach(([ event, handler ]) => {
    mouseInterfaceEl.removeEventListener(event, handler, { capture: true })
  })
}

/** Resets the topography and updates the config. */
function reset() {
  mouseTopo.value.resetSketch(this.topoConfig)
}

/** Randomizes the topography. */
function randomize() {
  mouseTopo.value.randomizeSketch()
}

/**
 * Resets the variables that change the state of the topography.
 */
function disable() {
  mouseTopo.value.disable()
}

defineExpose({
  pause,
  resume,
  disable,
  reset,
  randomize,
})
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

.noninteractive {
  pointer-events: none;
}
</style>
