import gl from "../gl.js";
import { vec3, mat4, quat, glMatrix } from "../cs380/gl-matrix.js";

import * as cs380 from "../cs380/cs380.js";

import { UnlitTextureShader } from "../unlit_texture_shader.js";
import { LightType, Light, BlinnPhongShader } from "../blinn_phong.js";
import { SimpleShader } from "../simple_shader.js";
import { VertexColorShader } from "../vertex_color_shader.js";
import { MyMaterialShader } from "../my_material.js";
import { Skybox, SkyboxShader } from "../skybox_shader.js";
import { PipEdgeShader } from "../pip_edge_shader.js";
import { PipShader } from "../pip_shader.js";

class TextureShader extends cs380.BaseShader {
  static get source() {
    return [
      [gl.VERTEX_SHADER, "resources/uv_simple.vert"],
      [gl.FRAGMENT_SHADER, "resources/uv_simple.frag"],
    ];
  }
  generateUniformLocations() {
    return {
      projectionMatrix: gl.getUniformLocation(this.program, "projectionMatrix"),
      cameraTransform: gl.getUniformLocation(this.program, "cameraTransform"),
      modelTransform: gl.getUniformLocation(this.program, "modelTransform"),
      mainTexture: gl.getUniformLocation(this.program, "mainTexture"),
    };
  }
  setUniforms(kv) {
    this.setUniformMat4(kv, "projectionMatrix");
    this.setUniformMat4(kv, "cameraTransform");
    this.setUniformMat4(kv, "modelTransform");
    this.setUniformTexture(kv, "mainTexture", 0);
  }
}

class Framebuffer {
  constructor() {
    this.finalize();
  }

  finalize() {
    gl.deleteTexture(this.colorTexture);
    gl.deleteRenderbuffer(this.dbo);
    gl.deleteFramebuffer(this.fbo);
    this.initialized = false;
  }

  initialize(width, height) {
    if (this.initialized) this.finalize();

    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    this.colorTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
    // Unlike picking buffer, it uses linear sampling
    // so that the sampled image is less blocky under extreme distortion
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGB,
      width,
      height,
      0,
      gl.RGB,
      gl.UNSIGNED_BYTE,
      null
    );

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      this.colorTexture,
      0
    );

    this.dbo = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.dbo);
    gl.renderbufferStorage(
      gl.RENDERBUFFER,
      gl.DEPTH_COMPONENT16,
      width,
      height
    );

    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.RENDERBUFFER,
      this.dbo
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }
}

class AnimatedBackground {
  async initialize() {
    this.mesh = new cs380.Mesh();

    
      this.mesh.addAttribute(3); //position
      this.mesh.addAttribute(3); //color
      const triangle1 = [
        5, -5, -2, 1, 0, 0, 5, 5, -2, 0, 1, 0, -5, -5, -2, 0, 0, 1,
      ];
      this.mesh.addVertexData(...triangle1);
      const triangle2 = [
        5, 5, -2, 0, 1, 0, -5, 5, -2, 1, 0, 0, -5, -5, -2, 0, 0, 1,
      ];
      this.mesh.addVertexData(...triangle2);
      this.mesh.drawMode = gl.TRIANGLES;
      this.mesh.initialize();
    

    this.shader = await cs380.buildShader(VertexColorShader);
    this.background = new cs380.RenderObject(this.mesh, this.shader);
  }

  render(camera) {
    this.background.render(camera);
  }
}

class Pip {
  async initialize(width, height, trans, scale) {
    this.framebuffer = new Framebuffer();
    this.framebuffer.initialize(width, height);

    const planeMeshData = cs380.primitives.generatePlane(1, 1);
    const planeMesh = cs380.Mesh.fromData(planeMeshData);
    //const shader = await cs380.buildShader(PipEdgeShader);
    const shader = await cs380.buildShader(PipShader);

    this.transform = new cs380.Transform();
    quat.rotateY(this.transform.localRotation, quat.create(), Math.PI);

    this.image = new cs380.RenderObject(planeMesh, shader);
    //this.image.uniforms.useScreenSpace = true;
    this.image.uniforms.useColor = false;
    this.image.uniforms.mainTexture = this.framebuffer.colorTexture;
    this.image.uniforms.width = width;
    this.image.uniforms.height = height;
    this.image.transform.localPosition = trans;
    this.image.transform.localScale = scale;
    this.image.transform.setParent(this.transform);

    this.thingsToClear = [shader, planeMesh, this.framebuffer];
  }

  render(camera) {
    const prevDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
    gl.depthFunc(gl.ALWAYS);
    this.image.render(camera);
    gl.depthFunc(prevDepthFunc);
  }
  finalize() {
    for (const thing of this.thingsToClear) {
      thing.finalize();
    }
  }
}

class PhotoFilm {
  async initialize(width, height) {
    this.enabled = false;
    this.printFinished = false;
    this.width = width;
    this.height = height;

    this.framebuffer = new Framebuffer();
    this.framebuffer.initialize(width, height);

    const planeMeshData = cs380.primitives.generatePlane(1, 1);
    const planeMesh = cs380.Mesh.fromData(planeMeshData);
    const shader = await cs380.buildShader(UnlitTextureShader);

    this.transform = new cs380.Transform();
    quat.rotateY(this.transform.localRotation, quat.create(), Math.PI);

    this.background = new cs380.RenderObject(planeMesh, shader);
    this.background.uniforms.useScreenSpace = true;
    this.background.uniforms.useColor = true;
    this.background.uniforms.solidColor = vec3.fromValues(1, 1, 1);
    vec3.set(this.background.transform.localScale, 1.2, 1.4, 1);
    this.background.transform.setParent(this.transform);

    this.image = new cs380.RenderObject(planeMesh, shader);
    this.image.uniforms.useScreenSpace = true;
    this.image.uniforms.useColor = false;
    this.image.uniforms.mainTexture = this.framebuffer.colorTexture;
    vec3.set(this.image.transform.localPosition, 0, 0.1, 0);
    this.image.transform.setParent(this.transform);

    this.thingsToClear = [shader, planeMesh, this.framebuffer];

    this.handleMouseDown = (e) => {
      if (this.printFinished) this.hide();
    };
    document.addEventListener("mousedown", this.handleMouseDown);
  }

  render(camera) {
    if (!this.enabled) return;
    const prevDepthFunc = gl.getParameter(gl.DEPTH_FUNC);
    gl.depthFunc(gl.ALWAYS);
    this.background.render(camera);
    this.image.render(camera);
    gl.depthFunc(prevDepthFunc);
  }

  finalize() {
    for (const thing of this.thingsToClear) {
      thing.finalize();
    }

    document.removeEventListener("mousedown", this.handleMouseDown);
  }

  show(elapsed) {
    this.enabled = true;
    this.printFinished = false;
    this.showStartTime = elapsed;
  }

  update(elapsed) {
    if (!this.enabled) return;
    const time = elapsed - this.showStartTime;
    let yPos = 2 - Math.min(2, time * 0.8);
    this.transform.localPosition[1] = yPos;

    this.printFinished = yPos < 0.001;
  }

  hide() {
    this.enabled = false;
  }
}

export default class Assignment4 extends cs380.BaseApp {
  async initialize() {
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Basic setup for camera
    const { width, height } = gl.canvas.getBoundingClientRect();
    this.width = width;
    this.height = height;

    const aspectRatio = width / height;
    this.camera = new cs380.Camera();
    vec3.set(this.camera.transform.localPosition, 0, 2, 9);
    this.camera.transform.lookAt(vec3.fromValues(0, -1, -9));
    mat4.perspective(
      this.camera.projectionMatrix,
      (45 * Math.PI) / 180,
      aspectRatio,
      0.01,
      1000
    );

    this.width = width;
    this.height = height;

    // Rest of initialization below
    this.thingsToClear = [];

    this.photo = new PhotoFilm();
    await this.photo.initialize(width, height);
    this.thingsToClear.push(this.photo);

    // TODO: initialize your object + scene here

    // SKYBOX
    const textureLoader = cs380.TextureLoader.load({
      uv_checker: "resources/uv_checker.png",

      posX: "resources/skybox/right.jpg",
      negX: "resources/skybox/left.jpg",
      posY: "resources/skybox/top.jpg",
      negY: "resources/skybox/bottom.jpg",
      posZ: "resources/skybox/front.jpg",
      negZ: "resources/skybox/back.jpg",
    });

    const shaderLoader = cs380.ShaderLoader.load({
      skyboxShader: SkyboxShader.source,
      textureShader: TextureShader.source,
    });

    const loaderResult = await Promise.all([textureLoader, shaderLoader]);
    const textureLoaderResult = loaderResult[0];
    const shaderLoaderResult = loaderResult[1];

    // create Skybox
    // generate cubemap texture
    const cubemap = new cs380.Cubemap();
    this.thingsToClear.push(cubemap);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    cubemap.initialize([
      [gl.TEXTURE_CUBE_MAP_POSITIVE_X, textureLoaderResult.posX],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_X, textureLoaderResult.negX],
      [gl.TEXTURE_CUBE_MAP_POSITIVE_Y, textureLoaderResult.posY],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, textureLoaderResult.negY],
      [gl.TEXTURE_CUBE_MAP_POSITIVE_Z, textureLoaderResult.posZ],
      [gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, textureLoaderResult.negZ],
    ]);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const skyboxShader = new SkyboxShader();
    this.thingsToClear.push(skyboxShader);
    skyboxShader.initialize(shaderLoaderResult.skyboxShader);

    const cubeMeshData = cs380.primitives.generateCube();
    const skyboxMesh = cs380.Mesh.fromData(cubeMeshData);

    this.thingsToClear.push(skyboxMesh);
    this.skybox = new Skybox(skyboxMesh, skyboxShader);
    this.skybox.uniforms.mainTexture = cubemap.id;

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

    //my material shader1
    const materialAmbient1 = [1.0, 1.0, 1.0];
    const materialDiffuse1 = [1.0, 1.0, 1.0];
    const materialSpecular1 = [1.0, 1.0, 1.0];
    const shine1 = 100.0;
    const myMaterialShader1 = await cs380.buildShader(
      MyMaterialShader,
      ...materialAmbient1,
      ...materialDiffuse1,
      ...materialSpecular1,
      shine1
    );
    this.thingsToClear.push(myMaterialShader1);

    //my material shader2
    const materialAmbient2 = [0.2, 0.2, 0.2];
    const materialDiffuse2 = [0.3, 0.0, 1.0];
    const materialSpecular2 = [0.7, 0.0, 0.7];
    const shine2 = 10.0;
    const myMaterialShader2 = await cs380.buildShader(
      MyMaterialShader,
      ...materialAmbient2,
      ...materialDiffuse2,
      ...materialSpecular2,
      shine2
    );
    this.thingsToClear.push(myMaterialShader2);

    // cone mesh
    const coneMeshData = cs380.primitives.generateCone(64, 0.8, 1);
    const coneMesh = cs380.Mesh.fromData(coneMeshData);
    this.thingsToClear.push(coneMesh);

    // body mesh
    const bodyMeshData = cs380.primitives.generateCone(32, 0.35, 1);
    const bodyMesh = cs380.Mesh.fromData(bodyMeshData);
    this.thingsToClear.push(bodyMesh);

    // arm mesh
    const upperArmMeshData = cs380.primitives.generateCylinder(16, 0.05, 0.3);
    const upperArmMesh = cs380.Mesh.fromData(upperArmMeshData);
    this.thingsToClear.push(upperArmMesh);

    const lowerArmMeshData = cs380.primitives.generateCylinder(16, 0.05, 0.3);
    const lowerArmMesh = cs380.Mesh.fromData(lowerArmMeshData);
    this.thingsToClear.push(lowerArmMesh);

    // leg mesh
    const upperLegMeshData = cs380.primitives.generateCylinder(16, 0.05, 0.3);
    const upperLegMesh = cs380.Mesh.fromData(upperLegMeshData);
    this.thingsToClear.push(upperLegMesh);

    const lowerLegMeshData = cs380.primitives.generateCylinder(16, 0.05, 0.3);
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
    const eyeMeshData = cs380.primitives.generateCylinder(16, 0.05, 0.05);
    const eyeMesh = cs380.Mesh.fromData(eyeMeshData);
    this.thingsToClear.push(eyeMesh);

    // background mesh
    const backgroundMeshData = cs380.primitives.generateCube(8, 8, 0.5);
    const backgroundMesh = cs380.Mesh.fromData(backgroundMeshData);
    this.thingsToClear.push(backgroundMesh);

    const cubeMeshData1 = cs380.primitives.generateCube(1, 1, 1);
    const cubeMesh = cs380.Mesh.fromData(cubeMeshData1);
    this.thingsToClear.push(cubeMesh);

    // pillar mesh
    const pillarMeshData = cs380.primitives.generateCube(1, 7, 1);
    const pillarMesh = cs380.Mesh.fromData(pillarMeshData);
    this.thingsToClear.push(pillarMesh);

    //create pip
    this.picture = new Pip();
    this.thingsToClear.push(this.picture);
    await this.picture.initialize(
      width,
      height,
      vec3.fromValues(0.0, 0.75, 4.0), //translation
      vec3.fromValues(5.0, 5.0, 5.0)   //scale
    ); 

    this.animatedBackground = new AnimatedBackground();
    await this.animatedBackground.initialize();

    /*-----------------------------------------

    this.mesh = new cs380.Mesh();
    this.mesh.addAttribute(3); // position
    this.mesh.addAttribute(3); //color
    this.mesh.addVertexData(
      0,
      1,
      0,
      1,
      0,
      0,
      -1,
      0,
      0,
      0,
      1,
      0,
      1,
      0,
      0,
      0,
      0,
      1
    );
    this.mesh.initialize();

    this.shader = await cs380.buildShader(VertexColorShader);

    this.triangle = new cs380.RenderObject(this.mesh, this.shader);

    /*-----------------------------------------*/

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

    this.cube1 = new cs380.PickableObject(
      cubeMesh,
      myMaterialShader1,
      pickingShader,
      29
    );
    this.cube2 = new cs380.PickableObject(
      cubeMesh,
      myMaterialShader2,
      pickingShader,
      30
    );

    this.pillar1 = new cs380.PickableObject(
      pillarMesh,
      myMaterialShader1,
      pickingShader,
      31
    );
    this.pillar2 = new cs380.PickableObject(
      pillarMesh,
      myMaterialShader2,
      pickingShader,
      32
    );
    this.pillar3 = new cs380.PickableObject(
      pillarMesh,
      myMaterialShader1,
      pickingShader,
      33
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

    vec3.set(RUA.localPosition, 0.3, 0, 0);
    quat.rotateZ(RUA.localRotation, RUA.localRotation, Math.PI / 2);
    vec3.set(LUA.localPosition, -0.3, 0, 0);
    quat.rotateZ(LUA.localRotation, LUA.localRotation, -Math.PI / 2);

    vec3.set(RAJ.localScale, 0.07, 0.07, 0.07);
    vec3.set(LAJ.localScale, 0.07, 0.07, 0.07);

    vec3.set(RLA.localPosition, 0, -0.3, 0);
    vec3.set(LLA.localPosition, 0, -0.3, 0);

    vec3.set(RHAND.localScale, 0.1, 0.1, 0.1);
    vec3.set(LHAND.localScale, 0.1, 0.1, 0.1);

    vec3.set(RHIP.localPosition, 0.2, -0.05, 0);
    vec3.set(LHIP.localPosition, -0.2, -0.05, 0);
    vec3.set(RHIP.localScale, 0.1, 0.1, 0.1);
    vec3.set(LHIP.localScale, 0.1, 0.1, 0.1);

    vec3.set(RUL.localPosition, 0, -0.38, 0);
    vec3.set(LUL.localPosition, 0, -0.38, 0);

    vec3.set(RLJ.localScale, 0.08, 0.08, 0.08);
    vec3.set(LLJ.localScale, 0.08, 0.08, 0.08);

    vec3.set(RLL.localPosition, 0, -0.36, 0);
    vec3.set(LLL.localPosition, 0, -0.36, 0);

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
    vec3.set(this.eye1.transform.localPosition, 0.1, 0.1, 0.25);
    vec3.set(this.eye2.transform.localPosition, -0.1, 0.1, 0.25);
    vec3.set(this.mouth.transform.localPosition, 0, -0.1, 0.25);

    vec3.set(this.background.transform.localPosition, 0, 1.5, -5.5);
    quat.rotateX(
      this.floor.transform.localRotation,
      this.floor.transform.localRotation,
      -Math.PI / 2
    );
    vec3.set(this.floor.transform.localPosition, 0, -2, 0);

    vec3.set(this.cube1.transform.localPosition, 3, -1, -3.5);
    vec3.set(this.cube2.transform.localPosition, -3, -1, -3.5);

    vec3.set(this.pillar1.transform.localPosition, 3, 0, -4.5);
    vec3.set(this.pillar2.transform.localPosition, -3, 0, -4.5);
    vec3.set(this.pillar3.transform.localPosition, 0, 4, -4.5);

    quat.rotateZ(
      this.pillar3.transform.localRotation,
      this.pillar3.transform.localRotation,
      -Math.PI / 2
    );

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
    light0.illuminance = 0.2;
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
    light3.transform.localPosition = [0, 0, 5];
    light3.transform.lookAt([0, 0, -1]);
    light3.angle = 20; // in degrees
    light3.angleSmoothness = 5;
    light3.type = LightType.SPOTLIGHT;
    this.lights.push(light3);

    const light4 = new Light();
    light4.illuminance = 0.5;
    light4.r = 0;
    light4.g = 0;
    light4.b = 255;
    light4.transform.localPosition = [0, 5, -4];
    quat.rotateX(
      light4.transform.localRotation,
      light4.transform.localRotation,
      -Math.PI / 2
    );
    light4.angle = 10;
    light4.type = LightType.SPOTLIGHT;
    this.lights.push(light4);

    const light5 = new Light();
    light5.illuminance = 3;
    light5.r = 0;
    light5.g = 255;
    light5.b = 0;
    light5.transform.localPosition = [2, 0, -4];
    light5.type = LightType.POINT;
    this.lights.push(light5);

    const light6 = new Light();
    light6.illuminance = 3;
    light6.r = 0;
    light6.g = 255;
    light6.b = 0;
    light6.transform.localPosition = [-2, 0, -4];
    light6.type = LightType.POINT;
    this.lights.push(light6);

    const light7 = new Light();
    light7.illuminance = 3;
    light7.r = 0;
    light7.g = 255;
    light7.b = 0;
    light7.transform.localPosition = [2, 4, -4];
    light7.type = LightType.POINT;
    this.lights.push(light7);

    const light8 = new Light();
    light8.illuminance = 3;
    light8.r = 0;
    light8.g = 255;
    light8.b = 0;
    light8.transform.localPosition = [-2, 4, -4];
    light8.type = LightType.POINT;
    this.lights.push(light8);

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
    this.rightHand.uniforms.lights = this.lights;
    this.leftHand.uniforms.lights = this.lights;
    this.rightFoot.uniforms.lights = this.lights;
    this.leftFoot.uniforms.lights = this.lights;

    this.cube1.uniforms.lights = this.lights;
    this.cube2.uniforms.lights = this.lights;

    this.pillar1.uniforms.lights = this.lights;
    this.pillar2.uniforms.lights = this.lights;
    this.pillar3.uniforms.lights = this.lights;

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

    // Setup GUIs
    // TODO: add camera effects of your own
    // Change "my-effect" and "My camera effect" to fitting name for your effect.
    // You can add multiple options.
    document.getElementById("settings").innerHTML = `
      <!-- Camera shutter UI --> 
      <audio id="shutter-sfx">
        <source src="resources/shutter_sfx.ogg" type="audio/ogg">
      </audio> 
      <button type="button" id="shutter">Take a picture!</button><br/>

      <!-- TODO: Add camera effect lists here --> 
      <label for="setting-effect">Camera effect</label>
      <select id="setting-effect">
        <option value="none">None</option>
        <option value="my-effect">My camera effect</option>
      </select> <br/>

      <!-- OPTIONAL: Add more UI elements here --> 

      <h3>Basic requirements</h3>
      <ul>
        <li>Reuse HW1 Animated Background [1 pt]</li>
        <li>Reuse HW2: Avatar with adjustable pose [0.5 pt]</li>
        <li>Reuse HW3: Phong shading lightings [1 pt]</li>
        <li>Skybox [0.5 pt] </li>
        <li>Camera Effects [2 pt] </li>
        <li>Show some creativity in your scene [1 pts]</li>
      </ul>
      Implement creative camera effects for your virtual camera booth. <br/>
      <strong>Have fun!</strong>
    `;

    // GL settings
    //gl.enable(gl.CULL_FACE);
    //gl.cullFace(gl.BACK);
    //gl.frontFace(gl.CCW);

    const shutterAudio = document.getElementById("shutter-sfx");
    document.getElementById("shutter").onclick = () => {
      this.shutterPressed = true;
      shutterAudio.play();
    };

    this.camereEffect = "none";
    cs380.utils.setInputBehavior(
      "setting-effect",
      (val) => {
        this.camereEffect = val;
      },
      true,
      false
    );
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
    for (const thing of this.thingsToClear) {
      thing.finalize();
    }
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
    // TODO: Update objects here

    this.simpleOrbitControl.update(dt);

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
      -0.5 + Math.sin(-angle)
    );
    vec3.set(
      this.lights[4].transform.localPosition,
      3 * Math.cos(angle),
      5,
      -0.5 + 3 * Math.sin(angle)
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

    // OPTIONAL: render PickableObject to the picking buffer here
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickingBuffer.fbo);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // renderPicking() here
    /*
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
    */

    // Render effect-applied scene to framebuffer of the photo if shutter is pressed
    if (this.shutterPressed) {
      this.shutterPressed = false;
      this.renderImage(
        this.photo.framebuffer.fbo,
        this.photo.width,
        this.photo.height
      );
      this.photo.show(elapsed); // Initiates photo-printing animation
    }

    // Render effect-applied scene to the screen
    this.renderImage(null);
    this.renderImage(this.picture.framebuffer.fbo, null, null, true); //animated background

    // Photos are rendered at the very last
    this.photo.update(elapsed);
    this.photo.render(this.camera);
  }

  renderScene() {
    // TODO: render scene *without* any effect
    // It would consist of every render(...) calls of objects in the scene
    /* Example code
    this.skybox.render(this.camera);
    this.animatedBackground.render(this.camera);
    this.avatar.render(this.camera);
    ...
    */
    this.skybox.render(this.camera);
    this.picture.render(this.camera);

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

    this.cube1.render(this.camera);
    this.cube2.render(this.camera);

    this.pillar1.render(this.camera);
    this.pillar2.render(this.camera);
    this.pillar3.render(this.camera);
  }

  renderImage(fbo = null, width = null, height = null, background = false) {
    // Parameters:
    //  * fbo: Target framebuffer object, default is to the canvas
    //  * width: Width of the target framebuffer, default is canvas'
    //  * height: Height of the target framebuffer default is canvas'

    if (!width) width = this.width;
    if (!height) height = this.height;
    if (this.camereEffect == "none") {
      // no camera effect - render directly to the scene
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      if(background) {
        //this.skybox.render(this.camera);
        this.animatedBackground.render(this.camera);
      }
      else {
        this.renderScene();
      }

      //this.renderScene();
    } else {
      // TODO: render the scene with some camera effect to the target framebuffer object (fbo)
      // Write at least one camera effect shader, which takes a rendered texture and draws modified version of the given texture
      //
      // Step-by-step guide:
      //  1) Bind a separate framebuffer that you initialized beforehand
      //  2) Render the scene to the framebuffer
      //    - You probably need to use this.renderScene() here
      //    - If the width/height differ from the target framebuffer, use gl.viewPort(..)
      //  3) Bind a target framebuffer (fbo)
      //  4) Render a plane that fits the viewport with a camera effect shader
      //    - The plane should perfectly fit the viewport regardless of the camera movement (similar to skybox)
      //    - You may change the shader for a RenderObject like below:
      //        this.my_object.render(this.camera, *my_camera_effect_shader*)

      // TODO: Remove the following line after you implemented.
      // (and please, remove any console.log(..) within the update loop from your submission)
      console.log("TODO: camera effect (" + this.camereEffect + ")");

      // Below codes will do no effectl it just renders the scene. You may (should?) delete this.
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, width, height);
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clearDepth(1.0);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LESS);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      this.renderScene();
    }
  }
}
