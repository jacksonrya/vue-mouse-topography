'use strict'

import vueContourLines from './vue-contour-lines.vue'

// Declare install function executed by Vue.use()
export function install(Vue) {
	if (install.installed) return;
	install.installed = true;
	Vue.component('vue-contour-lines', vueContourLines);
}

// To allow use as module (npm/webpack/etc.) export vueContourLines
// export default vueContourLines;
export default {install}