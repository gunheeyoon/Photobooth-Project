#version 300 es

layout(location = 0) in vec3 in_pos;

out vec3 uv;

uniform mat4 projectionMatrix;
uniform mat4 cameraTransform;
uniform mat4 modelTransform;

void main() {
  //TODO: implement uv and gl_Position
  
  mat4 newCameraTransform = cameraTransform;

  newCameraTransform[3][0] = 0.0;
  newCameraTransform[3][1] = 0.0;
  newCameraTransform[3][2] = 0.0;

  mat4 MVM = inverse(newCameraTransform) * modelTransform;
  vec4 pos = MVM * vec4(in_pos, 1);
  uv = pos.xyz;

  vec4 frag_pos = modelTransform * vec4(in_pos, 1);
  gl_Position = projectionMatrix * frag_pos;
}
