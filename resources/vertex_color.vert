#version 300 es

layout(location = 0) in vec4 in_pos;
layout(location = 1) in vec3 in_color;

out vec3 vertexColor;

uniform mat4 projectionMatrix;
uniform mat4 cameraTransform;
uniform mat4 modelTransform;

mat4 getNormalMatrix(mat4 MVM)
{
	mat4 invm = inverse(MVM);
	invm[0][3] = 0.0;
	invm[1][3] = 0.0;
	invm[2][3] = 0.0;

	return transpose(invm);
}

void main() {
    mat4 MVM = inverse(cameraTransform) * modelTransform;
    
	vertexColor = in_color;
    gl_Position = projectionMatrix * MVM * in_pos;
}
