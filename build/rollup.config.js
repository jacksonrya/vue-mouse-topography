// import uglify from 'rollup-plugin-uglify'
import bubel from '@rollup/plugin-buble' // Transpile/polyfill with reasonable browser support
import commonjs from '@rollup/plugin-commonjs' // Convert CommonJS modules to ES6
import vue from 'rollup-plugin-vue'; // Handle .vue SFC files

export default {
    input: 'src/wrapper.js', // Path relative to package.json
    output: {
        name: 'VueContourLines',
        exports: 'named',
    },
    moduleName: 'VueContourLines',
    plugins: [
        commonjs(),
        vue({
            css: true, // Dynamically inject css as a <style> tag
            compileTemplate: true, // Explicitly convert template to render function
        }),
        bubel(), // Transpile to ES5
    ],
}