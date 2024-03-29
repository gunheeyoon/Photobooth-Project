import gl from "./gl.js";

import { vec3, vec4 } from "./cs380/gl-matrix.js";

import * as cs380 from "./cs380/cs380.js";

import { LightType, Light } from "./blinn_phong.js";

export class MyMaterialShader extends cs380.BaseShader {
  static get source() {
    // Define shader codes here
    return [
      [gl.VERTEX_SHADER, "resources/my_material.vert"],
      [gl.FRAGMENT_SHADER, "resources/my_material.frag"],
    ];
  }

  constructor(
    ambientR,
    ambientG,
    ambientB,
    diffuseR,
    diffuseG,
    diffuseB,
    specularR,
    specularG,
    specularB,
    shininess
  ) {
    super();
    this.ambientR = ambientR;
    this.ambientG = ambientG;
    this.ambientB = ambientB;
    this.diffuseR = diffuseR;
    this.diffuseG = diffuseG;
    this.diffuseB = diffuseB;
    this.specularR = specularR;
    this.specularG = specularG;
    this.specularB = specularB;
    this.shininess = shininess;
  }

  generateUniformLocations() {
    return {
      // Below three are must-have uniform variables,
      projectionMatrix: gl.getUniformLocation(this.program, "projectionMatrix"),
      cameraTransform: gl.getUniformLocation(this.program, "cameraTransform"),
      modelTransform: gl.getUniformLocation(this.program, "modelTransform"),

      // Shader-specific uniforms
      mainColor: gl.getUniformLocation(this.program, "mainColor"),
      numLights: gl.getUniformLocation(this.program, "numLights"),
      ambientR: gl.getUniformLocation(this.program, "ambientR"),
      ambientG: gl.getUniformLocation(this.program, "ambientG"),
      ambientB: gl.getUniformLocation(this.program, "ambientB"),
      diffuseR: gl.getUniformLocation(this.program, "diffuseR"),
      diffuseG: gl.getUniformLocation(this.program, "diffuseG"),
      diffuseB: gl.getUniformLocation(this.program, "diffuseB"),
      specularR: gl.getUniformLocation(this.program, "specularR"),
      specularG: gl.getUniformLocation(this.program, "specularG"),
      specularB: gl.getUniformLocation(this.program, "specularB"),
      shininess: gl.getUniformLocation(this.program, "shininess"),
    };
  }

  setUniforms(kv) {
    this.setUniformMat4(kv, "projectionMatrix");
    this.setUniformMat4(kv, "cameraTransform");
    this.setUniformMat4(kv, "modelTransform");

    // Set shader-specific uniforms here
    this.setUniformVec3(kv, "mainColor", 1, 1, 1);
    this.setUniformFloat(kv, "ambientR", this.ambientR);
    this.setUniformFloat(kv, "diffuseR", this.diffuseR);
    this.setUniformFloat(kv, "specularR", this.specularR);
    this.setUniformFloat(kv, "ambientG", this.ambientG);
    this.setUniformFloat(kv, "diffuseG", this.diffuseG);
    this.setUniformFloat(kv, "specularG", this.specularG);
    this.setUniformFloat(kv, "ambientB", this.ambientB);
    this.setUniformFloat(kv, "diffuseB", this.diffuseB);
    this.setUniformFloat(kv, "specularB", this.specularB);
    this.setUniformFloat(kv, "shininess", this.shininess);

    if ("lights" in kv) {
      const lights = kv["lights"];
      const lightProperties = [
        "type",
        "enabled",
        "pos",
        "illuminance",
        "dir",
        "angle",
        "angleSmoothness",
        "color",
        "r",
        "g",
        "b",
      ];
      const numLights = Math.min(lights.length, 10);
      gl.uniform1i(this.uniformLocations.numLights, numLights);
      for (let i = 0; i < numLights; i++) {
        const light = lights[i];
        const locations = lightProperties.reduce((obj, x) => {
          obj[x] = gl.getUniformLocation(this.program, `lights[${i}].${x}`);
          return obj;
        }, {});
        gl.uniform1i(locations.type, light.type);
        gl.uniform1i(locations.enabled, light.enabled);
        gl.uniform3f(locations.pos, ...light.pos);
        gl.uniform3f(locations.dir, ...light.dir);
        gl.uniform3i(locations.color, ...light.color);
        gl.uniform1f(locations.illuminance, light.illuminance);
        gl.uniform1f(locations.angle, light.angle);
        gl.uniform1f(locations.angleSmoothness, light.angleSmoothness);
        gl.uniform1i(locations.r, light.r);
        gl.uniform1i(locations.g, light.g);
        gl.uniform1i(locations.b, light.b);
      }
    } else {
      gl.uniform1i(this.uniformLocations.numLights, 0);
    }
  }
}
