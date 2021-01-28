<template>
  <div id="app">
    <mouse-topo
      ref="topo"
      class="contours"
      :simplify="controls.simplify.value"
      :ping="controls.ping.value"
      :force="controls.force.value"
      :decay="controls.decay.value"
    />
    <table class="controls">
      <thead><tr>Controls</tr></thead>

      <tbody>
        <tr
          v-for="(control, name) in controls"
          :key="name"
        >
          <td><label for="name">{{ name }} ({{ control.units || '' }})</label></td>
          <td>
            <input
              id="name"
              v-model.number="control.value"
              type="range"
              name="name"
              :min="control.min"
              :max="control.max"
            >
          </td>
          <td>
            <div class="control-value">
              {{ control.value }}
            </div>
          </td>
        </tr>
      </tbody>

      <button @click="reset">
        reset
      </button>
      <button @click="randomize">
        randomize
      </button>
    </table>
  </div>
</template>

<script>
import MouseTopo from './vue-mouse-topography.vue';

const CONTROLS = {
  simplify: {
    min: 1,
    max: 100,
    units: null,
    value: 20,
  },
  ping: {
    min: 15,
    max: 1000,
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
  name: 'App',
  components: { MouseTopo },
  data() {
    return { controls: CONTROLS }
  },
  methods: {
    reset () {
      this.$refs.topo.reset()
    },
    randomize () {
      this.$refs.topo.randomize()
    },
  },
};
</script>

<style>
#app {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

  display: flex;
}

#app > .contours {
  border: 5px solid black;
  width: 50%;
  height: 50%;
}
</style>
