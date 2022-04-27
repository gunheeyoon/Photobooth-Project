import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { SimpleShader } from "../simple_shader.js";

export default class Assignment2 extends cs380.BaseApp {
  async initialize() {
    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 5);
    mat4.perspective(
      this.camera.projectionMatrix,
      glMatrix.toRadian(45),
      aspectRatio,
      0.01,
      100
    );

    this.thingsToClear = [];

    // SimpleOrbitControl
    const orbitControlCenter = vec3.fromValues(0, 0, 0);
    this.simpleOrbitControl = new cs380.utils.SimpleOrbitControl(
      this.camera,
      orbitControlCenter
    );
    this.thingsToClear.push(this.simpleOrbitControl);

    // simpleSahder
    const simpleShader = await cs380.buildShader(SimpleShader);
    this.thingsToClear.push(simpleShader);

    // cone mesh
    const coneMeshData = cs380.primitives.generateCone(64, 0.8, 1);
    const coneMesh = cs380.Mesh.fromData(coneMeshData);
    this.thingsToClear.push(coneMesh);

    // sphere mesh
    const sphereMeshdata = cs380.primitives.generateSphere();
    const sphereMesh = cs380.Mesh.fromData(sphereMeshdata);
    this.thingsToClear.push(sphereMesh);

    // cylinder mesh
    const cylinderMeshData = cs380.primitives.generateCylinder(64, 0.8, 1);
    const cylinderMesh = cs380.Mesh.fromData(cylinderMeshData);
    this.thingsToClear.push(cylinderMesh);

    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    // initialize objects
    this.body = new cs380.PickableObject(
      coneMesh,
      simpleShader,
      pickingShader,
      1
    );
    this.head = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      2
    );
    this.rightShoulder = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      3
    );
    this.leftShoulder = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      4
    );
    this.rightUpperArm = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      5
    );
    this.leftUpperArm = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      6
    );
    this.rightArmJoint = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      7
    );
    this.leftArmJoint = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      8
    );
    this.rightLowerArm = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      9
    );
    this.leftLowerArm = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      10
    );
    this.rightHand = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      11
    );
    this.leftHand = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      12
    );
    this.rightHip = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      13
    );
    this.leftHip = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      14
    );
    this.rightUpperLeg = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      15
    );
    this.leftUpperLeg = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      16
    );
    this.rightLegJoint = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      17
    );
    this.leftLegJoint = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      18
    );
    this.rightLowerLeg = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      19
    );
    this.leftLowerLeg = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      20
    );
    this.rightFoot = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      21
    );
    this.leftFoot = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      22
    );

    this.cone = new cs380.PickableObject(
      coneMesh,
      simpleShader,
      pickingShader,
      1
    );
    this.sphere = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      2
    );
    this.cylinder = new cs380.PickableObject(
      cylinderMesh,
      simpleShader,
      pickingShader,
      3
    );

    // move around the objects
    let BODY = this.body.transform;
    let HEAD = this.head.transform;
    let RS = this.rightShoulder.transform;
    let LS = this.leftShoulder.transform;
    let RUA = this.rightUpperArm.transform;
    let LUA = this.leftUpperArm.transform;
    let RAJ = this.rightArmJoint.transform;
    let LAJ = this.leftArmJoint.transform;
    let RLA = this.rightLowerArm.transform;
    let LLA = this.leftLowerArm.transform;
    let RHAND = this.rightHand.transform;
    let LHAND = this.leftHand.transform;
    let RHIP = this.rightHip.transform;
    let LHIP = this.leftHip.transform;
    let RUL = this.rightUpperLeg.transform;
    let LUL = this.leftUpperLeg.transform;
    let RLJ = this.rightLegJoint.transform;
    let LLJ = this.leftLegJoint.transform;
    let RLL = this.rightLowerLeg.transform;
    let LLL = this.leftLowerLeg.transform;
    let RF = this.rightFoot.transform;
    let LF = this.leftFoot.transform;

    // set initial position, scale, rotation
    vec3.set(BODY.localScale, 0.5, 1, 1);

    vec3.set(HEAD.localPosition, 0, 1, 0);
    vec3.set(HEAD.localScale, 0.3, 0.3, 0.3);

    // set hierarchy
    HEAD.setParent(BODY); // parent of head is body
    RS.setParent(BODY); // parent of right shoulder is body
    LS.setParent(BODY); // parent of left shoulder is body
    RHIP.setParent(BODY); // parent of right hip is body
    LHIP.setParent(BODY); // parent of left hip is body

    RUA.setParent(RS); // parent of right upper arm is right shoulder
    LUA.setParent(LS); // parent of left upper arm is left shoulder
    RAJ.setParent(RUA); // parent of right arm joint is right upper arm
    LAJ.setParent(LUA); // parent of left arm joint is left upper arm
    RLA.setParent(RAJ); // parent of right lower arm is right arm joint
    LLA.setParent(LAJ); // parent of left lower arm is left arm joint
    RHAND.setParent(RLA); // parent of right hand is right lower arm
    LHAND.setParent(LLA); // parent of left hand is left lower arm

    RUL.setParent(RHIP); // parent of right upper leg is right hip
    LUL.setParent(LHIP); // parent of left upper leg is left hip
    RLJ.setParent(RUL); // parent of right leg joint is right upper leg
    LLJ.setParent(LUL); // parent of left leg joint is left upper leg
    RLL.setParent(RLJ); // parent of right lower leg is right leg joint
    LLL.setParent(LLJ); // parent of left lower leg is left leg joint
    RF.setParent(RLL); // parent of right foot is right lower leg
    LF.setParent(LLL); // parent of left foot is left lower leg

    // set the remaining position, scale, rotation

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

    document.getElementById("settings").innerHTML = `
      <h3>Basic requirements</h3>
      <ul>
        <li>Generate 3D geometric objects: cone and cylinder</li>
        <li>Construct your avatar with hierarchical modeling containing at least 10 parts</li>
        <li>Introduce interactive avatar posing from keyboard and mouse inputs</li>
        <li>Show some creativity in your scene</li>
      </ul>
      <strong>Start early!</strong>
    `;

    // GL settings
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
  }

  onKeyDown(key) {
    console.log(`key down: ${key}`);
  }

  onMouseDown(e) {
    const { left, bottom } = gl.canvas.getBoundingClientRect();
    const x = e.clientX - left;
    const y = bottom - e.clientY;

    // Object with this index has just picked
    const index = this.pickingBuffer.pick(x, y);

    console.log(`onMouseDown() got index ${index}`);
  }

  finalize() {
    // Finalize WebGL objects (mesh, shader, texture, ...)
    document.removeEventListener("keydown", this.handleKeyDown);
    gl.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.thingsToClear.forEach((it) => it.finalize());
  }

  update(elapsed, dt) {
    // Updates before rendering here
    this.simpleOrbitControl.update(dt);

    // Render picking information first
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingBuffer.fbo);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // renderPicking() here
    this.body.renderPicking(this.camera);
    this.head.renderPicking(this.camera);

    // Render real scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // render() here
    this.body.render(this.camera);
    this.head.render(this.camera);
  }
}
