<template>
  <div id="app">
    <vue-contour-lines></vue-contour-lines>
  </div>
</template>

<script>
import VueContourLines from "./vue-contour-lines";

export default {
  name: "App",
  components: { VueContourLines }
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
  /* align-items: center;
  justify-content: center; */
}

#app > * {
  border: 5px solid black;
  width: 50%;
  height: 50%;
}
</style>
