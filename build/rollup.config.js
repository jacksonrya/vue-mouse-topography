import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import css from 'rollup-plugin-css-only';
import vue from 'rollup-plugin-vue'; // Handle .vue SFC files

export default {
  input: 'src/wrapper.js', // Path relative to package.json
  output: [
    {
      format: 'umd',
      file: 'dist/vue-mouse-topography.js',
      name: 'VueMouseTopography',
      exports: 'named',
      sourcemap: true,
    },
    {
      format: 'cjs',
      file: 'dist/vue-mouse-topography.commmon.js',
      name: 'VueMouseTopography',
      exports: 'named',
      sourcemap: true,
    },
    {
      format: 'esm',
      file: 'dist/vue-mouse-topography.esm.js',
      name: 'VueMouseTopography',
      exports: 'named',
      sourcemap: true,
    },
    {
      format: 'iife',
      file: 'dist/vue-mouse-topography.min.js',
      name: 'VueMouseTopography',
      exports: 'named',
      sourcemap: true,
    },
  ],
  plugins: [
    css({ output: 'vue-mouse-topography.min.css' }),
    vue({ css: false }),
    nodeResolve(),
    commonjs(),
  ],
}
