<script>
import MouseTopo from './../MouseTopography.vue'

const CONTROLS = {
  scale: {
    min: 1,
    max: 100,
    units: null,
    value: 20,
  },
  ping: {
    min: 5,
    max: 50,
    units: 'ms',
    value: 15,
  },
  force: {
    min: 1,
    max: 10,
    units: null,
    value: 8,
  },
  decay: {
    min: 15,
    max: 3000,
    units: 'ms',
    value: 2000,
  },
}

export default {
  name: 'HomeRoute',
  components: { MouseTopo },
  data() {
    return {
      paused: false, interfaceId: 'mouse-interface', controls: CONTROLS, 
    }
  },
  methods: {
    reset () {
      this.$refs.topo.reset()
    },
    randomize () {
      this.$refs.topo.randomize()
    },
  },
}

</script>

<template>
  <div class="full-viewport__container">
    <mouse-topo
      ref="topo"
      class="contours bordered"
      :scale="controls.scale.value"
      :ping="controls.ping.value"
      :force="controls.force.value"
      :decay="controls.decay.value"
      :paused="paused"
      :interface-id="interfaceId"
    />
  </div>
</template>

<style>

</style>
