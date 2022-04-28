import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { SimpleShader } from "../simple_shader.js";

export default class Lab5App extends cs380.BaseApp {
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

    // SimpleOrbitControl
    const orbitControlCenter = vec3.fromValues(0, 0, 0);
    this.simpleOrbitControl = new cs380.utils.SimpleOrbitControl(
      this.camera,
      orbitControlCenter
    );
    this.thingsToClear.push(this.simpleOrbitControl);

    // TODO: initialize mesh and shader
    const sphereMeshData = cs380.primitives.generateSphere();
    const sphereMesh = cs380.Mesh.fromData(sphereMeshData);
    const simpleShader = await cs380.buildShader(SimpleShader);
    this.thingsToClear.push(sphereMesh, simpleShader);

    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    // TODO: initialize PickableObject for your solar system
    this.sphere1 = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      1
    );

    this.sphere2 = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      2
    );

    this.sphere3 = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      3
    );

    this.sphere2.transform.setParent(this.sphere1.transform);
    this.sphere3.transform.setParent(this.sphere2.transform);

    vec3.set(this.sphere1.transform.localPosition, 0, 0, 0);
    vec3.set(this.sphere2.transform.localPosition, 0, 4, 0);
    vec3.set(this.sphere3.transform.localPosition, 0, 3, 0);

    vec3.set(this.sphere1.transform.localScale, 0.7, 0.7, 0.7);
    vec3.set(this.sphere2.transform.localScale, 0.7, 0.7, 0.7);
    vec3.set(this.sphere3.transform.localScale, 0.6, 0.6, 0.6);

    this.sphere1.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];
    this.sphere2.uniforms.mainColor = [168 / 255, 58 / 255, 50 / 255];
    this.sphere3.uniforms.mainColor = [145 / 255, 50 / 255, 168 / 255];

    // Event listener for interactions
    this.handleMouseDown = (e) => {
      // e.button = 0 if it is left mouse button
      if (e.button !== 0) return;
      this.onMouseDown(e);
    };
    gl.canvas.addEventListener("mousedown", this.handleMouseDown);

    // HTML interaction
    document.getElementById("settings").innerHTML = `
      <ul>
        <li>
          <strong>Submission:</strong> 3 screenshots with your solar system;
          the camera should move around the sun, earth, and moon, respectively.
        </li>
      </ul>
    `;

    // GL settings
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
  }

  onMouseDown(e) {
    const { left, bottom } = gl.canvas.getBoundingClientRect();
    const x = e.clientX - left;
    const y = bottom - e.clientY;

    // Object with this index has just picked
    const index = this.pickingBuffer.pick(x, y);

    // TODO : write down your code
    console.log(`onMouseDown() got index ${index}`);
    if (index == 1) {
      this.camera.transform.setParent(this.sphere1.transform);
      vec3.set(this.camera.transform.localPosition, 0, 0, 8);
    } else if (index == 2) {
      this.camera.transform.setParent(this.sphere2.transform);
      vec3.set(this.camera.transform.localPosition, 0, 0, 8);
    } else if (index == 3) {
      this.camera.transform.setParent(this.sphere3.transform);
      vec3.set(this.camera.transform.localPosition, 0, 0, 8);
    } else {
      this.camera.transform.setParent(null);
      vec3.set(this.camera.transform.localPosition, 0, 0, 8);
    }
  }

  finalize() {
    gl.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.thingsToClear.forEach((it) => it.finalize());
    gl.disable(gl.CULL_FACE);
  }

  update(elapsed, dt) {
    // TODO: update your solar system movement here
    this.simpleOrbitControl.update(dt);

    const T1 = this.sphere1.transform;
    const T2 = this.sphere2.transform;
    const T3 = this.sphere3.transform;

    quat.rotateZ(T1.localRotation, T1.localRotation, (Math.PI * dt) / 3);
    quat.rotateZ(T2.localRotation, T2.localRotation, Math.PI * dt * 2);
    quat.rotateZ(T3.localRotation, T3.localRotation, Math.PI * dt);

    const angle = Math.PI * elapsed;
    vec3.set(
      this.sphere3.transform.localPosition,
      3 * Math.cos(angle),
      3 * Math.sin(angle),
      0
    );

    // 1. Render picking information first
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingBuffer.fbo);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.sphere1.renderPicking(this.camera);
    this.sphere2.renderPicking(this.camera);
    this.sphere3.renderPicking(this.camera);

    // 2. Render real scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.sphere1.render(this.camera);
    this.sphere2.render(this.camera);
    this.sphere3.render(this.camera);
  }
}
