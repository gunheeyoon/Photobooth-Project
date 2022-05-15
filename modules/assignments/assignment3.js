import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { LightType, Light, BlinnPhongShader } from "../blinn_phong.js";
import { SimpleShader } from "../simple_shader.js";

export default class Assignment3 extends cs380.BaseApp {
  async initialize() {
    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 0, 4);
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

    // initialize picking shader & buffer
    const pickingShader = await cs380.buildShader(cs380.PickingShader);
    this.pickingBuffer = new cs380.PickingBuffer();
    this.pickingBuffer.initialize(width, height);
    this.thingsToClear.push(pickingShader, this.pickingBuffer);

    // simpleShader
    const simpleShader = await cs380.buildShader(SimpleShader);
    this.thingsToClear.push(simpleShader);

    // blinn-phong shader
    const blinnPhongShader = await cs380.buildShader(BlinnPhongShader);
    this.thingsToClear.push(blinnPhongShader);

    // cone mesh
    const coneMeshData = cs380.primitives.generateCone(64, 0.8, 1);
    const coneMesh = cs380.Mesh.fromData(coneMeshData);
    this.thingsToClear.push(coneMesh);

    // body mesh
    const bodyMeshData = cs380.primitives.generateCone(32, 0.35, 1);
    const bodyMesh = cs380.Mesh.fromData(bodyMeshData);
    this.thingsToClear.push(bodyMesh);

    // arm mesh
    const upperArmMeshData = cs380.primitives.generateCylinder(16, 5, 30);
    const upperArmMesh = cs380.Mesh.fromData(upperArmMeshData);
    this.thingsToClear.push(upperArmMesh);

    const lowerArmMeshData = cs380.primitives.generateCylinder(16, 0.08, 0.5);
    const lowerArmMesh = cs380.Mesh.fromData(lowerArmMeshData);
    this.thingsToClear.push(lowerArmMesh);

    // leg mesh
    const upperLegMeshData = cs380.primitives.generateCylinder(16, 5, 30);
    const upperLegMesh = cs380.Mesh.fromData(upperLegMeshData);
    this.thingsToClear.push(upperLegMesh);

    const lowerLegMeshData = cs380.primitives.generateCylinder(16, 0.08, 0.5);
    const lowerLegMesh = cs380.Mesh.fromData(lowerLegMeshData);
    this.thingsToClear.push(lowerLegMesh);

    // sphere mesh
    const sphereMeshdata = cs380.primitives.generateSphere();
    const sphereMesh = cs380.Mesh.fromData(sphereMeshdata);
    this.thingsToClear.push(sphereMesh);

    // cylinder mesh
    const cylinderMeshData = cs380.primitives.generateCylinder(32, 0.2, 0.7);
    const cylinderMesh = cs380.Mesh.fromData(cylinderMeshData);
    this.thingsToClear.push(cylinderMesh);

    // eye and mouth mesh
    const eyeMeshData = cs380.primitives.generateCylinder(16, 0.5, 0.1);
    const eyeMesh = cs380.Mesh.fromData(eyeMeshData);
    this.thingsToClear.push(eyeMesh);

    // background mesh
    const backgroundMeshData = cs380.primitives.generateCube(20, 20, 0.5);
    const backgroundMesh = cs380.Mesh.fromData(backgroundMeshData);
    this.thingsToClear.push(backgroundMesh);

    // initialize objects
    this.body = new cs380.PickableObject(
      bodyMesh,
      blinnPhongShader,
      pickingShader,
      1
    );
    this.head = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      2
    );
    this.rightShoulder = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      3
    );
    this.leftShoulder = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      4
    );
    this.rightUpperArm = new cs380.PickableObject(
      upperArmMesh,
      blinnPhongShader,
      pickingShader,
      5
    );
    this.leftUpperArm = new cs380.PickableObject(
      upperArmMesh,
      blinnPhongShader,
      pickingShader,
      6
    );
    this.rightArmJoint = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      7
    );
    this.leftArmJoint = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      8
    );
    this.rightLowerArm = new cs380.PickableObject(
      lowerArmMesh,
      blinnPhongShader,
      pickingShader,
      9
    );
    this.leftLowerArm = new cs380.PickableObject(
      lowerArmMesh,
      blinnPhongShader,
      pickingShader,
      10
    );
    this.rightHand = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      11
    );
    this.leftHand = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      12
    );
    this.rightHip = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      13
    );
    this.leftHip = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      14
    );
    this.rightUpperLeg = new cs380.PickableObject(
      upperLegMesh,
      blinnPhongShader,
      pickingShader,
      15
    );
    this.leftUpperLeg = new cs380.PickableObject(
      upperLegMesh,
      blinnPhongShader,
      pickingShader,
      16
    );
    this.rightLegJoint = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      17
    );
    this.leftLegJoint = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      18
    );
    this.rightLowerLeg = new cs380.PickableObject(
      lowerLegMesh,
      blinnPhongShader,
      pickingShader,
      19
    );
    this.leftLowerLeg = new cs380.PickableObject(
      lowerLegMesh,
      blinnPhongShader,
      pickingShader,
      20
    );
    this.rightFoot = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      21
    );
    this.leftFoot = new cs380.PickableObject(
      sphereMesh,
      blinnPhongShader,
      pickingShader,
      22
    );

    this.cameraControl = new cs380.PickableObject(
      sphereMesh,
      simpleShader,
      pickingShader,
      23
    );

    this.background = new cs380.PickableObject(
      backgroundMesh,
      blinnPhongShader,
      pickingShader,
      24
    );

    this.eye1 = new cs380.PickableObject(
      eyeMesh,
      blinnPhongShader,
      pickingShader,
      25
    );
    this.eye2 = new cs380.PickableObject(
      eyeMesh,
      blinnPhongShader,
      pickingShader,
      26
    );
    this.mouth = new cs380.PickableObject(
      eyeMesh,
      blinnPhongShader,
      pickingShader,
      27
    );

    this.floor = new cs380.PickableObject(
      backgroundMesh,
      blinnPhongShader,
      pickingShader,
      28
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

    // invisible sphere object for controlling camera
    this.camera.transform.setParent(this.cameraControl.transform);

    // eyes and mouth hierarchy
    this.eye1.transform.setParent(HEAD);
    this.eye2.transform.setParent(HEAD);
    this.mouth.transform.setParent(HEAD);

    // set the remaining position, scale, rotation
    vec3.set(BODY.localPosition, 0, -0.5, 0);

    vec3.set(HEAD.localPosition, 0, 1, 0);
    vec3.set(HEAD.localScale, 0.3, 0.3, 0.3);

    vec3.set(RS.localScale, 0.1, 0.1, 0.1);
    vec3.set(LS.localScale, 0.1, 0.1, 0.1);
    vec3.set(RS.localPosition, 0.2, 0.5, 0);
    vec3.set(LS.localPosition, -0.2, 0.5, 0);

    vec3.set(RUA.localPosition, 30, 0, 0);
    quat.rotateZ(RUA.localRotation, RUA.localRotation, Math.PI / 2);
    vec3.set(LUA.localPosition, -30, 0, 0);
    quat.rotateZ(LUA.localRotation, LUA.localRotation, -Math.PI / 2);

    vec3.set(RAJ.localScale, 7, 7, 7);
    vec3.set(LAJ.localScale, 7, 7, 7);

    vec3.set(RLA.localPosition, 0, -0.5, 0);
    vec3.set(LLA.localPosition, 0, -0.5, 0);

    vec3.set(RHAND.localScale, 0.1, 0.1, 0.1);
    vec3.set(LHAND.localScale, 0.1, 0.1, 0.1);

    vec3.set(RHIP.localPosition, 0.2, -0.05, 0);
    vec3.set(LHIP.localPosition, -0.2, -0.05, 0);
    vec3.set(RHIP.localScale, 0.1, 0.1, 0.1);
    vec3.set(LHIP.localScale, 0.1, 0.1, 0.1);

    vec3.set(RUL.localPosition, 0, -30, 0);
    vec3.set(LUL.localPosition, 0, -30, 0);

    vec3.set(RLJ.localScale, 7, 7, 7);
    vec3.set(LLJ.localScale, 7, 7, 7);

    vec3.set(RLL.localPosition, 0, -0.6, 0);
    vec3.set(LLL.localPosition, 0, -0.6, 0);

    vec3.set(RF.localScale, 0.1, 0.1, 0.1);
    vec3.set(LF.localScale, 0.1, 0.1, 0.1);

    quat.rotateX(
      this.eye1.transform.localRotation,
      this.eye1.transform.localRotation,
      Math.PI / 2
    );
    quat.rotateX(
      this.eye2.transform.localRotation,
      this.eye2.transform.localRotation,
      Math.PI / 2
    );
    quat.rotateX(
      this.mouth.transform.localRotation,
      this.mouth.transform.localRotation,
      Math.PI / 2
    );
    vec3.set(this.eye1.transform.localPosition, 1, 1, 3);
    vec3.set(this.eye2.transform.localPosition, -1, 1, 3);
    vec3.set(this.mouth.transform.localPosition, 0, -0.7, 3.2);

    vec3.set(this.background.transform.localPosition, 0, 0, -10);
    quat.rotateX(
      this.floor.transform.localRotation,
      this.floor.transform.localRotation,
      -Math.PI / 2
    );
    vec3.set(this.floor.transform.localPosition, 0, -2, 0);

    this.state = 0;
    this.cameraState = 0;
    this.transition = 0;

    this.cameraAngle = 0;

    this.bodyAngle = 0;
    this.headAngle = 0;

    this.rightShoulderAngle = 0;
    this.leftShoulderAngle = 0;
    this.rightArmJointAngle = 0;
    this.leftArmJointAngle = 0;

    this.rightHipAngle = 0;
    this.leftHipAngle = 0;
    this.rightLegJointAngle = 0;
    this.leftLegJointAngle = 0;

    // colors
    this.background.uniforms.mainColor = [49 / 255, 50 / 255, 51 / 255];
    this.floor.uniforms.mainColor = [49 / 255, 50 / 255, 51 / 255];
    this.eye1.uniforms.mainColor = [0, 0, 0];
    this.eye2.uniforms.mainColor = [0, 0, 0];
    this.mouth.uniforms.mainColor = [0, 0, 0];
    // colors - joints
    this.rightShoulder.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];
    this.leftShoulder.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];
    this.rightArmJoint.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];
    this.leftArmJoint.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];
    this.rightHip.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];
    this.leftHip.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];
    this.rightLegJoint.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];
    this.leftLegJoint.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];

    // colors - arms
    this.rightUpperArm.uniforms.mainColor = [119 / 255, 50 / 255, 168 / 255];
    this.rightLowerArm.uniforms.mainColor = [119 / 255, 50 / 255, 168 / 255];
    this.leftUpperArm.uniforms.mainColor = [119 / 255, 50 / 255, 168 / 255];
    this.leftLowerArm.uniforms.mainColor = [119 / 255, 50 / 255, 168 / 255];

    // colors - legs
    this.rightUpperLeg.uniforms.mainColor = [181 / 255, 41 / 255, 20 / 255];
    this.rightLowerLeg.uniforms.mainColor = [181 / 255, 41 / 255, 20 / 255];
    this.leftUpperLeg.uniforms.mainColor = [181 / 255, 41 / 255, 20 / 255];
    this.leftLowerLeg.uniforms.mainColor = [181 / 255, 41 / 255, 20 / 255];

    // colors - body
    this.body.uniforms.mainColor = [50 / 255, 168 / 255, 82 / 255];

    // initialize light sources
    this.lights = [];
    const lightDir = vec3.create();

    const light0 = new Light();
    light0.illuminance = 0.1;
    light0.color = [255, 165, 0];
    light0.r = 255;
    light0.g = 165;
    light0.b = 0;
    light0.type = LightType.AMBIENT;
    this.lights.push(light0);

    const light1 = new Light();
    vec3.set(lightDir, -1, -1, -1);
    light1.illuminance = 0.0;
    light1.color = [255, 0, 0];
    light1.r = 255;
    light1.g = 0;
    light1.b = 0;
    light1.transform.lookAt(lightDir);
    light1.type = LightType.DIRECTIONAL;
    this.lights.push(light1);

    const light2 = new Light();
    light2.illuminance = 1;
    light2.r = 255;
    light2.g = 0;
    light2.b = 0;
    light2.transform.localPosition = [2, 0, 0];
    light2.type = LightType.POINT;
    this.lights.push(light2);

    const light3 = new Light();
    light3.illuminance = 0.2;
    light3.r = 255;
    light3.g = 255;
    light3.b = 0;
    light3.transform.localPosition = [-2, 0, -3];
    light3.transform.lookAt([0, 0, -1]);
    light3.angle = 20; // in degrees
    light3.angleSmoothness = 5;
    light3.type = LightType.SPOTLIGHT;
    this.lights.push(light3);

    const light4 = new Light();
    light4.illuminance = 0.5;
    light4.r = 0;
    light4.g = 255;
    light4.b = 0;
    light4.transform.localPosition = [0, 5, -4];
    quat.rotateX(
      light4.transform.localRotation,
      light4.transform.localRotation,
      -Math.PI / 2
    );
    light4.angle = 10;
    light4.type = LightType.SPOTLIGHT;
    this.lights.push(light4);

    this.body.uniforms.lights = this.lights;
    this.head.uniforms.lights = this.lights;
    this.background.uniforms.lights = this.lights;
    this.floor.uniforms.lights = this.lights;
    this.eye1.uniforms.lights = this.lights;
    this.eye2.uniforms.lights = this.lights;
    this.mouth.uniforms.lights = this.lights;
    this.rightShoulder.uniforms.lights = this.lights;
    this.leftShoulder.uniforms.lights = this.lights;
    this.rightArmJoint.uniforms.lights = this.lights;
    this.leftArmJoint.uniforms.lights = this.lights;
    this.rightHip.uniforms.lights = this.lights;
    this.leftHip.uniforms.lights = this.lights;
    this.rightLegJoint.uniforms.lights = this.lights;
    this.leftLegJoint.uniforms.lights = this.lights;
    this.rightUpperArm.uniforms.lights = this.lights;
    this.rightLowerArm.uniforms.lights = this.lights;
    this.leftUpperArm.uniforms.lights = this.lights;
    this.leftLowerArm.uniforms.lights = this.lights;
    this.rightUpperLeg.uniforms.lights = this.lights;
    this.rightLowerLeg.uniforms.lights = this.lights;
    this.leftUpperLeg.uniforms.lights = this.lights;
    this.leftLowerLeg.uniforms.lights = this.lights;

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
        <li>Implement point light, and spotlight [2 pts]</li>
        <li>Update the implementation to support colored (RGB) light [1 pts]</li>
        <li>Update the implementation to support materials (reflection coefficients, shineness) [2 pts] </li>
        <li>Show some creativity in your scene [1 pts]</li>
      </ul>
      Import at least two models to show material differnece <br/>
      Use your creativity (animation, interaction, etc.) to make each light source is recognized respectively. <br/>
      <strong>Start early!</strong>
    `;

    // GL settings
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);
  }

  onKeyDown(key) {
    console.log(`key down: ${key}`);
    if (key == "w") {
      this.reset();
      this.state = 1;
    } else if (key == "a") {
      this.cameraState = 1;
    } else if (key == "d") {
      this.cameraState = 2;
    } else if (key == "s") {
      this.reset();
      this.state = 2;
    } else if (key == "f") {
      this.cameraState = 3;
    }
  }

  onMouseDown(e) {
    const { left, bottom } = gl.canvas.getBoundingClientRect();
    const x = e.clientX - left;
    const y = bottom - e.clientY;

    // Object with this index has just picked
    const index = this.pickingBuffer.pick(x, y);

    console.log(`onMouseDown() got index ${index}`);
    if (index == 2) {
      // if head is clicked
      // do 360
      this.reset();
      this.state = 3;
    }
  }

  finalize() {
    // Finalize WebGL objects (mesh, shader, texture, ...)
    document.removeEventListener("keydown", this.handleKeyDown);
    gl.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.thingsToClear.forEach((it) => it.finalize());
  }

  pose1(dt) {
    if (this.leftArmJointAngle < Math.PI / 2) {
      quat.rotateZ(
        this.leftArmJoint.transform.localRotation,
        this.leftArmJoint.transform.localRotation,
        (-Math.PI * dt) / 8
      );
      this.leftArmJointAngle += (Math.PI * dt) / 8;
    }

    if (this.rightArmJointAngle > -Math.PI / 2) {
      quat.rotateZ(
        this.rightArmJoint.transform.localRotation,
        this.rightArmJoint.transform.localRotation,
        (-Math.PI * dt) / 8
      );
      this.rightArmJointAngle -= (Math.PI * dt) / 8;
    }

    if (this.leftHipAngle < Math.PI / 2) {
      quat.rotateZ(
        this.leftHip.transform.localRotation,
        this.leftHip.transform.localRotation,
        (-Math.PI * dt) / 8
      );
      this.leftHipAngle += (Math.PI * dt) / 8;
    }

    if (this.leftLegJointAngle < Math.PI / 2) {
      quat.rotateZ(
        this.leftLegJoint.transform.localRotation,
        this.leftLegJoint.transform.localRotation,
        (Math.PI * dt) / 8
      );
      this.leftLegJointAngle += (Math.PI * dt) / 8;
    }

    if (this.rightLegJointAngle < Math.PI / 2) {
      quat.rotateZ(
        this.rightLegJoint.transform.localRotation,
        this.rightLegJoint.transform.localRotation,
        (Math.PI * dt) / 8
      );
      this.rightLegJointAngle += (Math.PI * dt) / 8;
    }

    if (this.bodyAngle < Math.PI / 4) {
      quat.rotateZ(
        this.body.transform.localRotation,
        this.body.transform.localRotation,
        (Math.PI * dt) / 8
      );
      this.bodyAngle += (Math.PI * dt) / 8;
    }
  }

  pose2(dt) {
    if (this.rightShoulderAngle < Math.PI / 4) {
      quat.rotateZ(
        this.rightShoulder.transform.localRotation,
        this.rightShoulder.transform.localRotation,
        (Math.PI * dt) / 8
      );
      this.rightShoulderAngle += (Math.PI * dt) / 8;
    }

    if (this.leftShoulderAngle < Math.PI / 2) {
      quat.rotateY(
        this.leftShoulder.transform.localRotation,
        this.leftShoulder.transform.localRotation,
        (Math.PI * dt) / 8
      );
      this.leftShoulderAngle += (Math.PI * dt) / 8;
    }

    if (this.leftArmJointAngle < Math.PI / 2) {
      quat.rotateY(
        this.leftArmJoint.transform.localRotation,
        this.leftArmJoint.transform.localRotation,
        (Math.PI * dt) / 8
      );
      this.leftArmJointAngle += (Math.PI * dt) / 8;
    }

    if (this.leftArmJointAngle < (Math.PI * 3) / 4) {
      quat.rotateZ(
        this.leftArmJoint.transform.localRotation,
        this.leftArmJoint.transform.localRotation,
        (-Math.PI * dt) / 8
      );
      this.leftArmJointAngle += (Math.PI * dt) / 8;
    }

    if (this.rightHipAngle < Math.PI / 2) {
      quat.rotateX(
        this.rightHip.transform.localRotation,
        this.rightHip.transform.localRotation,
        (-Math.PI * dt) / 8
      );
      this.rightHipAngle += (Math.PI * dt) / 8;
    }

    if (this.rightLegJointAngle < Math.PI / 2) {
      quat.rotateX(
        this.rightLegJoint.transform.localRotation,
        this.rightLegJoint.transform.localRotation,
        (Math.PI * dt) / 8
      );
      this.rightLegJointAngle += (Math.PI * dt) / 8;
    }

    if (this.headAngle < Math.PI / 5) {
      quat.rotateY(
        this.head.transform.localRotation,
        this.head.transform.localRotation,
        (Math.PI * dt) / 8
      );
      quat.rotateZ(
        this.head.transform.localRotation,
        this.head.transform.localRotation,
        (Math.PI * dt) / 8
      );
      this.headAngle += (Math.PI * dt) / 8;
    }
  }

  roll(dt) {
    this.pose1(dt);
    quat.rotateZ(
      this.body.transform.localRotation,
      this.body.transform.localRotation,
      (Math.PI * dt) / 2
    );
  }

  reset() {
    quat.set(this.head.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.rightShoulder.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.rightArmJoint.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.leftShoulder.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.leftArmJoint.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.rightHip.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.rightLegJoint.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.leftHip.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.leftLegJoint.transform.localRotation, 0, 0, 0, 1);
    quat.set(this.body.transform.localRotation, 0, 0, 0, 1);

    this.bodyAngle = 0;
    this.headAngle = 0;

    this.rightShoulderAngle = 0;
    this.leftShoulderAngle = 0;
    this.rightArmJointAngle = 0;
    this.leftArmJointAngle = 0;

    this.rightHipAngle = 0;
    this.leftHipAngle = 0;
    this.rightLegJointAngle = 0;
    this.leftLegJointAngle = 0;
  }

  update(elapsed, dt) {
    // Updates before rendering here
    //this.simpleOrbitControl.update(dt);

    quat.rotateY(
      this.lights[3].transform.localRotation,
      this.lights[3].transform.localRotation,
      (Math.PI * dt) / 3
    );

    var angle = Math.PI * elapsed;
    vec3.set(
      this.lights[2].transform.localPosition,
      Math.cos(angle),
      0,
      -4 + Math.sin(-angle)
    );
    vec3.set(
      this.lights[4].transform.localPosition,
      3 * Math.cos(angle),
      5,
      -4 + Math.sin(angle)
    );

    if (this.state == 1) {
      this.pose1(dt);
    }

    if (this.state == 2) {
      this.pose2(dt);
    }

    if (this.state == 3) {
      this.roll(dt);
    }

    if (this.cameraState == 1) {
      quat.rotateY(
        this.cameraControl.transform.localRotation,
        this.cameraControl.transform.localRotation,
        (Math.PI * dt) / 3
      );
    }
    if (this.cameraState == 2) {
      quat.rotateY(
        this.cameraControl.transform.localRotation,
        this.cameraControl.transform.localRotation,
        (-Math.PI * dt) / 3
      );
    }

    // Render picking information first
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingBuffer.fbo);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // renderPicking() here
    // renderPicking() here
    this.body.renderPicking(this.camera);
    this.head.renderPicking(this.camera);
    this.rightUpperArm.renderPicking(this.camera);
    this.leftUpperArm.renderPicking(this.camera);
    this.rightLowerArm.renderPicking(this.camera);
    this.leftLowerArm.renderPicking(this.camera);
    this.rightUpperLeg.renderPicking(this.camera);
    this.leftUpperLeg.renderPicking(this.camera);
    this.rightLowerLeg.renderPicking(this.camera);
    this.leftLowerLeg.renderPicking(this.camera);

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
    this.rightShoulder.render(this.camera);
    this.leftShoulder.render(this.camera);
    this.rightUpperArm.render(this.camera);
    this.leftUpperArm.render(this.camera);
    this.rightArmJoint.render(this.camera);
    this.leftArmJoint.render(this.camera);
    this.rightLowerArm.render(this.camera);
    this.leftLowerArm.render(this.camera);
    this.rightHand.render(this.camera);
    this.leftHand.render(this.camera);
    this.rightHip.render(this.camera);
    this.leftHip.render(this.camera);
    this.rightUpperLeg.render(this.camera);
    this.leftUpperLeg.render(this.camera);
    this.rightLegJoint.render(this.camera);
    this.leftLegJoint.render(this.camera);
    this.rightLowerLeg.render(this.camera);
    this.leftLowerLeg.render(this.camera);
    this.leftFoot.render(this.camera);
    this.rightFoot.render(this.camera);

    this.eye1.render(this.camera);
    this.eye2.render(this.camera);
    this.mouth.render(this.camera);

    this.background.render(this.camera);
    this.floor.render(this.camera);
  }
}
