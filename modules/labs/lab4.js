import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { SimpleShader } from "../simple_shader.js";

export default class Lab4App extends cs380.BaseApp {
  async initialize() {
    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 8);
    this.camera.transform.lookAt(vec3.fromValues(-0, -0, -8));
    mat4.perspective(
      this.camera.projectionMatrix,
      glMatrix.toRadian(45),
      aspectRatio,
      0.01,
      100
    );

    // things to finalize()
    this.thingsToClear = [];

    // initialize mesh and shader
    const cubeMeshData = cs380.primitives.generateCube();
    const cubeMesh = cs380.Mesh.fromData(cubeMeshData);
    const sphereMeshData = cs380.primitives.generateSphere();
    const sphereMesh = cs380.Mesh.fromData(sphereMeshData);
    const simpleShader = await cs380.buildShader(SimpleShader);

    this.thingsToClear.push(cubeMesh, sphereMesh, simpleShader);

    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    // TODO : add Pickable cube
    this.sphere = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      1
    );

    // add Pickable Cube
    this.cube = new cs380.PickableObject(
      cubeMesh,
      simpleShader,
      pickingShader,
      2
    );

    // TODO : add your own transformations for sphere and cube
    vec3.set(this.cube.transform.localPosition, 1, 0, 0);
    vec3.set(this.sphere.transform.localPosition, -1, 0, 0);

    // Event listener for interactions
    this.handleKeyDown = (e) => {
      // e.repeat is true when the key has been helded for a while
      if (e.repeat) return;
      this.onKeyDown(e.key);
    };
    this.handleMouseDown = (e) => {
      // e.button = 0 if it is left mouse button
      if (e.button !== 0) return;
      this.onMouseDown(e);
    };
    document.addEventListener("keydown", this.handleKeyDown);
    gl.canvas.addEventListener("mousedown", this.handleMouseDown);

    // HTML interaction
    document.getElementById("settings").innerHTML = `
      <ul>
        <li>
          <strong>Submission:</strong> A picture that contains transformed sphere and cube.
        </li>
      </ul>
    `;

    // GL settings
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
  }

  onKeyDown(key) {
    // TODO : write down your transformation code
    console.log(`key down: ${key}`);
    const S = this.sphere.transform;

    if (key == "s") {
      var scale = Math.random() + 0.5;
      var rotation = Math.random() * 180;
      var x1 = Math.random() * 0.5 + 1;
      var y1 = Math.random() * 0.5 + 1;
      var z1 = Math.random() * 0.5 + 1;

      var mag = Math.sqrt(Math.pow(x1, 2) + Math.pow(y1, 2) + Math.pow(z1, 2));

      const axis = [x1 / mag, y1 / mag, z1 / mag];

      vec3.set(S.localScale, 1, scale, 1);
      quat.setAxisAngle(S.localRotation, axis, (rotation * Math.PI) / 180);
    }
  }

  onMouseDown(e) {
    const { left, bottom } = gl.canvas.getBoundingClientRect();
    const x = e.clientX - left;
    const y = bottom - e.clientY;

    // Object with this index has just picked
    const index = this.pickingBuffer.pick(x, y);

    // TODO : write down your transformation code
    console.log(`onMouseDown() got index ${index}`);
    const C = this.cube.transform;

    if (index == 2) {
      var scale = Math.random() + 0.5;
      var rotation = Math.random() * 180;
      var x1 = Math.random() * 0.5 + 1;
      var y1 = Math.random() * 0.5 + 1;
      var z1 = Math.random() * 0.5 + 1;

      var mag = Math.sqrt(Math.pow(x1, 2) + Math.pow(y1, 2) + Math.pow(z1, 2));

      const axis = [x1 / mag, y1 / mag, z1 / mag];

      vec3.set(C.localScale, scale, 1, 1);
      quat.setAxisAngle(C.localRotation, axis, (rotation * Math.PI) / 180);
    }
  }

  finalize() {
    document.removeEventListener("keydown", this.handleKeyDown);
    gl.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.thingsToClear.forEach((it) => it.finalize());
  }

  update(elapsed, dt) {
    // 1. Render picking information first
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingBuffer.fbo);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // TODO : call renderPicking() for the PickableObject
    this.sphere.renderPicking(this.camera);
    this.cube.renderPicking(this.camera);

    // 2. Render real scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    this.sphere.render(this.camera);
    this.cube.render(this.camera);
  }
}
