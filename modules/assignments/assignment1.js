import gl from "../gl.js";
import { vec3, mat4 } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";
import { SolidShader } from "../solid_shader.js";
import { VertexColorShader } from "../vertex_color_shader.js";

export default class Assignment1 extends cs380.BaseApp {
  async initialize() {
    // Basic setup for camera
    const aspectRatio = gl.canvas.clientWidth / gl.canvas.clientHeight;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 0);
    mat4.ortho(
      this.camera.projectionMatrix,
      -2 * aspectRatio,
      +2 * aspectRatio,
      -2,
      +2,
      -2,
      +2
    );

    document.getElementById("settings").innerHTML = `
      <h3>Basic requirements</h3>
      <ul>
        <li>Add a background with color gradient</li>
        <li>Add 2 or more types of fractal-like natural objects</li>
        <li>Add framerate-independent natural animation</li>
        <li>Show some creativity in your scene</li>
      </ul>
    `;

    // Rest of initialization below

    /* background */
    this.mesh = new cs380.Mesh();

    const buildBackground = () => {
      this.mesh.finalize();
      this.mesh.addAttribute(3); //position
      this.mesh.addAttribute(3); //color
      //this.mesh.addAttribute(3); //color
      const triangle1 = [
        2, -2, -2, 1, 0, 0, -2, -2, -2, 0, 1, 0, 2, 2, -2, 0, 0, 1,
      ];
      this.mesh.addVertexData(...triangle1);
      const triangle2 = [
        2, 2, -2, 0, 0, 1, -2, -2, -2, 0, 1, 0, -2, 2, -2, 1, 0, 0,
      ];
      this.mesh.addVertexData(...triangle2);
      this.mesh.drawMode = gl.TRIANGLES;
      this.mesh.initialize();
    };

    buildBackground();
    this.shader = await cs380.buildShader(VertexColorShader);
    this.background = new cs380.RenderObject(this.mesh, this.shader);

    /* fractal 1 */
    this.numOfFractal1 = 10;
    this.meshArray = [];
    for (let i = 0; i < this.numOfFractal1; i++) {
      this.meshArray.push(new cs380.Mesh());
    }

    const buildStars = (N) => {
      var x, y;

      for (let i = 0; i < this.numOfFractal1; i++) {
        this.meshArray[i].addAttribute(3); // position

        x = Math.random() * 4 - 2;
        y = Math.random() * 4 - 2;

        this.meshArray[i].addVertexData(x, y, 0);
        for (let k = 0; k < 2 * N + 1; k++) {
          const angle = (Math.PI * 2 * k) / (2 * N);
          if (k % 2 == 0) var n = 0.5;
          else var n = 0.25;
          const p_i = vec3.fromValues(
            x + (n * Math.cos(angle)) / 2,
            y + (n * Math.sin(angle)) / 2,
            0
          );

          this.meshArray[i].addVertexData(...p_i);
        }
        this.meshArray[i].drawMode = gl.TRIANGLE_FAN;

        this.meshArray[i].initialize();
      }
    };
    buildStars(5);
    this.shader1 = await cs380.buildShader(SolidShader);
    this.starArray = [];
    for (let i = 0; i < this.numOfFractal1; i++) {
      let fractal1 = new cs380.RenderObject(this.meshArray[i], this.shader1);
      fractal1.uniforms.mainColor = [168 / 256, 244 / 256, 245 / 256];
      this.starArray.push(fractal1);
    }
  }

  finalize() {
    // Finalize WebGL objects (mesh, shader, texture, ...)
    this.mesh.finalize();
    this.shader.finalize();

    this.mesh1.finalize();
    this.shader1.finalize();

    for (let i = 0; i < this.numOfFractal1; i++) {
      this.meshArray[i].finalize();
    }
  }

  update(elapsed, dt) {
    // Updates before rendering here

    // Clear canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Rest of rendering below
    this.background.render(this.camera);
    for (let i = 0; i < this.numOfFractal1; i++) {
      this.starArray[i].render(this.camera);
    }
  }
}
