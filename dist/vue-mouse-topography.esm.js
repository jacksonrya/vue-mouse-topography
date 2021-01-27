import _ from 'lodash';
import P5 from 'p5';
import { contours } from 'd3-contour';
import { openBlock, createBlock, createCommentVNode } from 'vue';

/* eslint-disable no-unused-vars */

const EMPTY = 'empty';
const RANDOM = 'random';
const GOLDSTEIN = 'goldstein';

// List of values that seperate contour buckets. The topography heights at which contours lines are drawn.
const THRESHOLDS = {
  empty: { threshold: function () { return _.range(1, (this.bucketCount + 1) * this.zRange / this.bucketCount, CONTOUR_INTERVAL).reverse() } },
  random: { threshold: function () { return _.range(0, 100, 10) } },
  gradient: { threshold: function () { return _.range(0, this.matrixArea, this.matrixArea / 10) } },
  goldstein: { threshold: function () { return _.range(2, 21).map(p => Math.pow(2, p)) } },
};

const CONTOUR_INTERVAL = 20; // The 'vertical' distance between each contour line.

class Topography {
  constructor (resolution, viewport, preset) {
    this.resolution = resolution;
    this.viewport = viewport;

    this.min = Infinity;
    this.max = -Infinity;

    this._matrix = this._initMatrix()[preset]();
    this._threshold = THRESHOLDS[preset].threshold;
  }

  static random (resolution) {
    return new this(resolution)
  }

  get zRange () {
    return Math.ceil(this.max - this.min)
  }

  // The number of sorting buckets to accomodate all topography heights.
  get bucketCount () {
    return Math.ceil(this.max / CONTOUR_INTERVAL)
  }

  _getMatrixIndex (x, y) { // TODO move to matrix class
    return Math.floor((y * this.resolution.columnCount) + x)
  }

  _addToMatrixValue (i, z) {
    this._matrix[i] += z;
  }

  _getMatrixValue (i) {
    if (i < 0 || i > this.matrixArea) {
      return undefined
    }

    return this._matrix[i]
  }

  raise ({ x, y }, zDelta = 100, density = 4) {
    // calculate distances to closest nodes
    const pos = this._getMatrixIndex(x, y);
    // this._matrix[pos] += zDelta
    this._addToMatrixValue(pos, zDelta);
    // TODO  raise values of neighbors at a fraction of zDelta
    // antialias with new values

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i !== 0 || j !== 0) {
          this._addToMatrixValue(this._getMatrixIndex(x + i, y + j), zDelta / density);
        }
      }
    }

    this.antialias({ x, y });

    const z = this._matrix[pos];

    if (z < this.min) this.min = z;
    if (z > this.max) this.max = z;
  }

  // ?? This helps make fluid diagonals drawn, but doesn't spread the force effect
  antialias ({ x, y }, iterations = 0) {
    const ITERATION_CAP = 2;
    if (!x || !y) return
    if (iterations === ITERATION_CAP) return
    if (x < 0 || y < 0 || x >= this.resolution.columnCount || y >= this.resolution.rowCount) return

    const neighborCoors = new Array(8);
    const neighborIndexes = new Array(8);

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const coor = [ x + j, y + i ];
        neighborIndexes.push(this._getMatrixIndex(...coor));
        neighborCoors.push(...coor);
      }
    }

    const neighbors = neighborIndexes.map(i => {
      return this._getMatrixValue(i)
    });

    // console.log(x, y, this._getMatrixIndex(x, y))

    const currMatrixValue = this._getMatrixValue(this._getMatrixIndex(x, y));
    // console.log([currMatrixValue, ...neighbors])
    const newMatrixValue = [ currMatrixValue, ...neighbors ].reduce((prev, curr) => prev + curr) / 9;
    // console.log(newMatrixValue)
    this._addToMatrixValue(this._getMatrixIndex(x, y), (newMatrixValue || 0)); // TODO: this is always returning 0 ? is newMatrixValue always invalid?

    // TODO: filter internal coordinates, only antialias the edge of the current range --- DON'T ANTIALIAS WHAT"S ALREADY BEEN ANTIALIASED
    neighborCoors.forEach(coor => {
      this.antialias(coor, iterations + 1);
    });
  }

  getIsobands (matrix = this.getMatrix()) {
    const n = this.resolution.columnCount;
    const m = this.resolution.rowCount;

    const contours$1 = contours()
      .size([ n, m ])
      .thresholds(this._threshold());

    return contours$1(matrix)
  }

  // https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
  _randomBm () {
    let u = 0; let v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 10.0 + 0.5; // Translate to 0 -> 1
    if (num > 1 || num < 0) return this._randomBm() // resample between 0 and 1
    return num
  }

  get matrixArea () {
    return this.resolution?.cellCount || 0
  }

  _initMatrix () {
    const initValues = () => {
      return _.fill(new Array(this.matrixArea), 10) // TODO init should be to 0, but might have an edge-case bug, so testing w 10 :)
    };

    const matrices = {
      gradient: () => {
        return _.range(0, this.matrixArea)
      },
      random: () => {
        const values = initValues();

        let curr = 0;

        for (let x = 0; x < this.resolution.columnCount; x++) {
          for (let y = 0; y < this.resolution.rowCount; y++) {
            const z = [
              0,
              Math.random() * 100,
              (x * 10) + y,
              this._randomBm() * 100,
            ][3];

            if (z < this.min) this.min = z;
            if (z > this.max) this.max = z;

            // values[x * 10 + y] = z
            values[curr] = z;
            curr++;
          }
        }

        return values
      },
      goldstein: () => {
        const values = initValues();

        function goldsteinPrice (x, y) {
          return (1 + Math.pow(x + y + 1, 2) * (19 - 14 * x + 3 * x * x - 14 * y + 6 * x * x + 3 * y * y)) *
            (30 + Math.pow(2 * x - 3 * y, 2) * (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y * y))
        }

        // Populate a grid of n×m values where -2 ≤ x ≤ 2 and -2 ≤ y ≤ 1.
        const n = this.resolution.columnCount;
        const m = this.resolution.rowCount;
        for (let j = 0.5, k = 0; j < m; ++j) {
          for (let i = 0.5; i < n; ++i, ++k) {
            values[k] = goldsteinPrice(i / n * 4 - 2, 1 - j / m * 3);
          }
        }

        return values
      },

    };

    // console.log(initValues())

    matrices.empty = initValues; // initValues

    return matrices
  }

  getMatrix () {
    return this._matrix
  }
}

/* eslint-disable no-unused-vars */

// The resolution of the drawing--contour line granularity.
class Resolution {
  constructor (width, height) {
    this.width = width;
    this.height = height;
  }

  get columnCount () {
    return Math.ceil(this.width)
  }

  get rowCount () {
    return Math.ceil(this.height)
  }

  get size () {
    return {
      width: this.columnCount,
      height: this.rowCount,
    }
  }

  get aspectRatio () {
    return this.columnCount / this.rowCount
  }

  get cellCount () {
    return this.columnCount * this.rowCount
  }
}

/**
 * The matrix of cells that span the sketch client.
 */
class Plat {
  constructor (size, resolution) {
    this.size = size;
    this.resolution = resolution;
  }

  get cellSize () {
    return {
      width: this.size.width / this.resolution.columnCount,
      height: this.size.height / this.resolution.rowCount,
    }
  }

  getCell (mousePosition) {
    if (!mousePosition || !mousePosition.x || !mousePosition.y) {
      return {}
    }

    return {
      x: Math.floor(mousePosition.x / this.cellSize.width),
      y: Math.floor(mousePosition.y / this.cellSize.height),
    }
  }
}

class TopographySketch {
  constructor ({
    canvasId = 'p5-canvas',
    dimensions = undefined,
    simplify = 30,
    preset = EMPTY, 
  }) {
    this.canvasId = canvasId; // The element's id for the p5 sketch.
    this.dimensions = dimensions; // The screen size of the topography container.

    this.p5 = new P5(p5 => { // The sketch.
      p5.setup = this.setup(p5);
      p5.draw = this.draw(p5);
    }, canvasId);

    this.resolution = new Resolution(dimensions.width / simplify, dimensions.height / simplify); // The resolution of the structured grid.
    this._plat = new Plat(this.dimensions, this.resolution);

    this.topography = new Topography(this.resolution, this.dimensions, preset); // The topography...
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getGoldsteinInstance ({
    canvasId, dimensions, simplify, 
  }) {
    return new this({
      canvasId, dimensions, simplify, preset: GOLDSTEIN, 
    })
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getRandomInstance ({
    canvasId, dimensions, simplify, 
  }) {
    return new this({
      canvasId, dimensions, simplify, preset: RANDOM, 
    })
  }

  /**
   *
   * @param {Object} topographyConfig
   * @returns {TopographySketch}
   */
  static getEmptyInstance ({
    canvasId, dimensions, simplify, 
  }) {
    return new this({
      canvasId, dimensions, simplify, preset: EMPTY, 
    })
  }

  get plat () {
    return this._plat
  }

  /**
   * Get the coordinates of a cell based on the given mouse position.
   * @param {Object} mousePosition Coordinates of the mouse.
   * @returns {Object} Coordinates of the cell.
   */
  getCell (mousePosition) {
    return this.plat.getCell(mousePosition)
  }

  addPoint () {
    console.log('Adding point not yet implemented.');
  }

  setup (p5) {
    return () => {
      p5.createCanvas(this.dimensions.width, this.dimensions.height);
      p5.noLoop();
      p5.colorMode(p5.HSB);
      this.resetStrokeWeight();
    }
  }

  draw (p5) {
    return () => {
      p5.push();

      this.drawBackground();
      this.drawTopography();
      this.drawForeground();

      p5.pop();
    }
  }

  /**
   * Draws sketch elements that render below (z-index) the topography.
   */
  drawBackground () {
    this.p5.background('white');
  }

  /**
   * Draws sketch elements that render above (z-index) the topography.
   */
  drawForeground () {
  }

  drawInteractiveDOM () {
    const els = document.getElementsByClassName('topography-block');

    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      const {
        x, y, width, height, 
      } = rect;

      const padding = 40;

      this.p5.rect(x + window.scrollX - padding, y + window.scrollY - padding, width + padding * 2, height + padding * 2);
    });
  }

  update (mousePosition, force = 0) {
    const { x, y } = mousePosition;

    this._updateMatrix({ x, y }, force);
    this.p5.redraw();
  }

  _updateMatrix (mousePosition, force) {
    // TODO: use better logic to find the closest gridpoint(or center) and change it there
    // TODO: add distributed changes
    let x;
    for (let i = 0; i < this.resolution.columnCount; i++) {
      if (mousePosition.x < (this.dimensions.width / this.resolution.columnCount * i)) {
        x = i - 1;
        break
      }
    }

    let y;
    for (let i = 0; i < this.resolution.rowCount; i++) {
      if (mousePosition.y < (this.dimensions.height / this.resolution.rowCount * i)) {
        y = i - 1;
        break
      }
    }

    this.topography.raise({ x, y }, force);
  }

  makeMultipolygon (mp) {
    const p5 = this.p5;

    mp.forEach(polygon => {
      const positiveSpace = polygon[0];

      p5.beginShape();

      this.makePolygon(positiveSpace);

      polygon.forEach(negativeSpace => {
        p5.beginContour();

        this.makePolygon(negativeSpace);

        p5.endContour();
      });

      p5.endShape();
    });
  }

  getCanvasCoordinate (matrixX, matrixY) {
    return {
      x: Math.floor(this.p5.map(matrixX, 0, this.resolution.columnCount, 0, this.dimensions.width)),
      y: Math.floor(this.p5.map(matrixY, 0, this.resolution.rowCount, 0, this.dimensions.height)),
    }
  }

  makePolygon (polygon) {
    polygon.forEach(coor => {
      const [ x, y ] = coor;
      const canvasCoor = this.getCanvasCoordinate(x, y);

      this.p5.vertex(canvasCoor.x, canvasCoor.y);
    });
  }

  makeMatrix (matrix) {
    matrix.forEach((z, i) => {
      const x = i % this.resolution.columnCount;
      const y = i / this.resolution.columnCount;

      const canvasCoor = this.getCanvasCoordinate(x, y);

      this.p5.circle(canvasCoor.x, canvasCoor.y, z);
    });
  }

  drawGrid () {
    this.p5.stroke(0, 0, 90);
    this.p5.fill(0, 0, 90);
    this.makeMatrix(_.fill(new Array(this.topography.matrixArea), 2));
  }

  resetStrokeWeight () {
    const defaultStroke = 0.2;
    this.p5.strokeWeight(defaultStroke);
  }

  drawTopography () {
    const p5 = this.p5;
    const START_COLOR = [ 
      0,
      0,
      0, 
    ]; // SHOULD BE #4b4b4b
    const END_COLOR = [ 
      0,
      0,
      60, 
    ];

    const fill = (color = 'white') => {
      p5.fill('white');
    };
    const stroke = color => p5.stroke( color);

    const contours = this.topography.getIsobands();

    contours.forEach((contour, i, contours) => {
      const color = p5.lerpColor(p5.color(...START_COLOR), p5.color(...END_COLOR), i / contours.length);
      fill(color);
      stroke(color);
      this.resetStrokeWeight();

      if (i === 0) p5.noStroke();
      // if (i === 1) p5.strokeWeight(1)

      this.makeMultipolygon(contour.coordinates || contour.geometry);
    });
  }
}

const DEFAULT_SIMPLIFY_COEFFICIENT = 20; // Degree of polygon simplification
const DEFAULT_PING_TIME = 15; // Amount of time(ms) between updates, in milliseconds.
const DEFAULT_FORCE = 8; // The amount of 'z' added to a point during mouse movement.
const DEFAULT_DECAY_TIME = 2000; // Amount of time(ms) before a cell stops growing when the mouse hovers over a cell.

var id = 0; // Unique id of of this component // TODO: test that this enables parallel topography instances

var script = {
  name: 'VueMouseTopography',
  props: {
    // Degree to which simplification is applied to the contours.
    simplify: {
      type: Number,
      required: false,
      default () {
        return DEFAULT_SIMPLIFY_COEFFICIENT
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
  },
  data () {
    return {
      sketchId: 'p5-canvas-' + ++id, // Unique id that matches the a child element's id.
      sketch: undefined, // The p5 sketch.
      mousePosition: undefined, // Mouse position coordinates relative to the root element's size.
      prevMousePosition: undefined, // Previous mouse position.
      mouseCell: undefined, // Coordinates of the resolution cell that the mouse is within.
      prevMouseCell: undefined, // Previous coordinates of the resolution cell that the mouse was within.
      updateIntervalId: undefined, // The id of the interval between updates.
      restingPointerStartTime: undefined,
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

    // Whether or not the mouse has moved since the last rendering update.
    mouseMoved () {
      if (!this.mousePosition) { return this.mousePosition !== this.prevMousePosition }

      return !(
        this.mousePosition.x === this.prevMousePosition.x &&
        this.mousePosition.y === this.prevMousePosition.y
      )
    },
  },
  mounted () {
    const topographyConfig = {
      canvasId: this.sketchId,
      dimensions: { width: this.width, height: this.height },
      simplify: this.simplify,
    };

    this.sketch = TopographySketch.getEmptyInstance(topographyConfig);

    this.updateIntervalId = setInterval(this.update, this.ping);
  },
  unmounted () {
    clearInterval(this.updateIntervalId);
  },
  methods: {
    /**
     * @param {Event} e A mouse event.
     * @returns {x: Number, y: Number} Mouse coordinates within this element's DOM box.
     */
    getMousePosition (e) {
      const rect = this.$el.getBoundingClientRect();
      return {
        x: e.pageX - rect.x,
        y: e.pageY + Math.abs(rect.y),
      }
    },

    handleClick (e) {
      this.sketch.addPoint(this.getMousePosition(e));
    },

    handleMousemove (e) {
      this.prevMousePosition = this.mousePosition;

      this.mousePosition = this.getMousePosition(e);

      this.updateMouseCell();
    },

    updateMouseCell () {
      this.prevMouseCell = this.mouseCell;
      this.mouseCell = this.sketch.getCell(this.mousePosition);

      if (this.mouseCellChanged(this.prevMouseCell, this.mouseCell)) {
        this.restingPointerStartTime = new Date().getTime();
      }
    },

    // The resolution cell that the mouse is hovering over.
    mouseCellChanged (prevMouseCell, mouseCell) {
      if (!prevMouseCell && !mouseCell) return false

      return !_.isEqual(prevMouseCell, mouseCell)
    },

    /**
     * Updates the drawing to represent the current mouse position if one exists.
     */
    update () {
      if (this.mousePosition) {
        const hoverTime = new Date().getTime() - this.restingPointerStartTime;

        let hoverForce = (this.decay - hoverTime) / this.decay;
        if (hoverForce < 0) hoverForce = 0;

        const force = this.mouseCellChanged(this.prevMouseCell, this.mouseCell)
          ? this.force
          : (hoverForce * this.force) / 6; // arbitrary fraction of the default

        this.sketch.update(this.mousePosition, force || 0);
      }

      this.prevMousePosition = this.mousePosition;
      this.updateMouseCell();
    },

    /**
     * Resets the variables that change the state of the topography.
     */
    disable () {
      this.restingPointerStartTime = undefined;
      this.mousePosition = undefined;
      this.mouseCell = undefined;
    },
  },
};

function render(_ctx, _cache, $props, $setup, $data, $options) {
  return (openBlock(), createBlock("div", {
    class: "topography",
    onClick: _cache[1] || (_cache[1] = (...args) => ($options.handleClick && $options.handleClick(...args))),
    onMousemove: _cache[2] || (_cache[2] = (...args) => ($options.handleMousemove && $options.handleMousemove(...args))),
    onMouseleave: _cache[3] || (_cache[3] = $event => ($options.disable()))
  }, [
    createCommentVNode(" <div "),
    createCommentVNode("   :id=\"sketchId\" "),
    createCommentVNode("   class=\"p5&#45;canvas\" "),
    createCommentVNode(" /> ")
  ], 32 /* HYDRATE_EVENTS */))
}

script.render = render;
script.__file = "src/vue-mouse-topography.vue";

// Declare install function executed by Vue.use()
function install(Vue) {
  if (install.installed) return;
  install.installed = true;
  Vue.component('VueMouseTopography', script);
}

// Create module definition for Vue.use()
const plugin = { install };

// Auto-install when vue is found (eg. in browser via <script> tag)
let GlobalVue = null;
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue;
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue;
}
if (GlobalVue) {
  GlobalVue.use(plugin);
}

// Can import as directive - e.g. import { VueContourLines } from 'vue-mouse-topography';
const VueMouseTopography = script;

export default script;
export { VueMouseTopography, install };
