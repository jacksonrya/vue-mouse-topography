import css from 'rollup-plugin-css-only';
import vue from 'rollup-plugin-vue'; // Handle .vue SFC files

export default [ {
  input: 'src/wrapper.js', // Path relative to package.json
  output: {
    format: 'esm',
    file: 'dist/vue-mouse-topography.esm.js',
  },
  plugins: [ css({ output: 'vue-mouse-topography.esm.css' }), vue({ css: false }) ],
}, {
  input: 'src/wrapper.js', // Path relative to package.json
  output: {
    format: 'iife',
    file: 'dist/vue-mouse-topography.min.js',
  },
  plugins: [ css({ output: 'vue-mouse-topography.min.css' }), vue({ css: false }) ],
} ]
