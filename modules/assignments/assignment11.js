import gl from "../gl.js";
import { vec3, mat4, quat, mat3 } from "../cs380/gl-matrix.js";

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

    
      this.mesh.addAttribute(3); //position
      this.mesh.addAttribute(3); //color
      const triangle1 = [
        2, -2, -2, 1, 0, 0, 2, 2, -2, 0, 1, 0, -2, -2, -2, 0, 0, 1,
      ];
      this.mesh.addVertexData(...triangle1);
      const triangle2 = [
        2, 2, -2, 0, 1, 0, -2, 2, -2, 1, 0, 0, -2, -2, -2, 0, 0, 1,
      ];
      this.mesh.addVertexData(...triangle2);
      this.mesh.drawMode = gl.TRIANGLES;
      this.mesh.initialize();
    

    this.shader = await cs380.buildShader(VertexColorShader);
    this.background = new cs380.RenderObject(this.mesh, this.shader);

    /* fractal 1 */
    this.numOfStars = 100;
    this.fractalShader = await cs380.buildShader(SolidShader);
    this.fractalMesh1 = new cs380.Mesh();
    this.fractalMesh1.addAttribute(3); //position

    const buildStar = (N) => {
      this.fractalMesh1.addVertexData(0, 0, 1);
      for (let k = 0; k < 2 * N + 1; k++) {
        const angle = (Math.PI * 2 * k) / (2 * N);
        if (k % 2 == 0) var n = 0.5;
        else var n = 0.25;
        const p_i = vec3.fromValues(
          (n * Math.cos(angle)) / 4,
          (n * Math.sin(angle)) / 4,
          1
        );

        this.fractalMesh1.addVertexData(...p_i);
      }

      this.fractalMesh1.drawMode = gl.TRIANGLE_FAN;
      this.fractalMesh1.initialize();
    };

    buildStar(7);

    this.starArray = [];
    var x, y;
    for (let i = 0; i < this.numOfStars; i++) {
      var fractal1 = new cs380.RenderObject(this.fractalMesh1, this.fractalShader);
      fractal1.uniforms.mainColor = [168 / 255, 244 / 255, 245 / 255];

      x = Math.random() * 4 - 2;
      y = Math.random() * 10;

      vec3.set(fractal1.transform.localPosition, x, y, 1);

      this.starArray.push(fractal1);
    }

    /* fractal 2 */

    this.fractalDepth = 13;
    this.fractalNum = Math.pow(2, this.fractalDepth) - 1;
    this.fractalMesh2 = new cs380.Mesh();
    
    this.fractalMesh2.addAttribute(3); //position

    const coordinate = [0.05, -0.7, 0, -0.05, -0.7, 0, -0.05, -2, 0, 0.05, -2, 0];
    const t1 = [coordinate[0], coordinate[1], coordinate[2], coordinate[3], coordinate[4], coordinate[5], coordinate[9], coordinate[10], coordinate[11]];
    const t2 = [coordinate[3], coordinate[4], coordinate[5], coordinate[6], coordinate[7], coordinate[8], coordinate[9], coordinate[10], coordinate[11]];
    this.fractalMesh2.addVertexData(...t1);
    this.fractalMesh2.addVertexData(...t2);
    this.fractalMesh2.drawMode = gl.TRIANGLES;
    this.fractalMesh2.initialize();

    this.fractalArray = [];

    const buildFractal = () => {

      for (let i = 0; i < this.fractalNum; i++) {
        const fractal = new cs380.RenderObject(this.fractalMesh2, this.fractalShader);
        fractal.uniforms.mainColor = [206/255, 222/255, 60/255];
        this.fractalArray.push(fractal);
      }

      const recursion = (rec, start, finish) => {
        if (rec > 0) {
          const mid = Math.floor((start + finish) / 2);

          for(let i = start; i < mid + 1; i++) {
            const T1 = this.fractalArray[i].transform;
            vec3.set(T1.localPosition, T1.localPosition[0], T1.localPosition[1], 0);
            quat.rotateZ(T1.localRotation, T1.localRotation, -155 * Math.PI / 180);
            vec3.scale(T1.localScale, T1.localScale, 0.9);
          }
          for(let j = mid + 1; j < finish + 1; j++) {
            const T2 = this.fractalArray[j].transform;
            vec3.set(T2.localPosition, T2.localPosition[0], T2.localPosition[1], 0);
            quat.rotateZ(T2.localRotation, T2.localRotation, 125 * Math.PI / 180);
            vec3.scale(T2.localScale, T2.localScale, 0.9);
          }

          recursion(rec - 1, start + 1, mid);
          recursion(rec - 1, mid + 2, finish);
        }
        else {

        }
      }

      recursion(this.fractalDepth, 1, this.fractalNum - 1);
    }

    buildFractal();

    /* koch snowflake */
    

  }

  finalize() {
    // Finalize WebGL objects (mesh, shader, texture, ...)
    this.mesh.finalize();
    this.shader.finalize();

    this.fractalShader.finalize();
    this.fractalMesh1.finalize();

    this.shader2.finalize();

    for (let j = 0; j < this.numOfFractal1; j++) {
      this.meshFractalArray[j].finalize();
    }
  }

  update(elapsed, dt) {
    // Updates before rendering here
    for (let k = 0; k < this.numOfStars; k++) {
      const T1 = this.starArray[k].transform;
      quat.rotateZ(T1.localRotation, T1.localRotation, Math.PI * dt);
      vec3.set(T1.localPosition, T1.localPosition[0], T1.localPosition[1] - 0.3 * dt, 1);

    }

    // Clear canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Rest of rendering below
    this.background.render(this.camera);

    for (let i = 0; i < this.numOfStars; i++) {
      this.starArray[i].render(this.camera);
    }
    for (let j = 1; j < this.fractalNum; j++) {
      this.fractalArray[j].render(this.camera);
    }
  }
}
