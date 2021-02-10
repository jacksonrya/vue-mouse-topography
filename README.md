# vue-mouse-topography

A heatmap of mouse movements in the style of topography.

The interface from which the mouse is tracked can be different from the canvas (default). If a custom interface is used,
it should exist behind other elements meant for interaction; the interface can't sit atop the DOM because it doesn't
propogate events down.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
