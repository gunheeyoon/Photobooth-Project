#version 300 es
precision highp float;

#define DIRECTIONAL 0
#define POINT 1
#define SPOTLIGHT 2
#define AMBIENT 3

in vec4 frag_pos;
in vec4 frag_normal;

out vec4 output_color;

uniform mat4 cameraTransform;

uniform vec3 mainColor;

struct Light {
    int type;
    bool enabled;
    vec3 pos;
    vec3 dir;
    vec3 color;
    float illuminance;
    float angle;
    float angleSmoothness;
    int r;
    int g;
    int b;
};

uniform int numLights;
uniform Light lights[10];

float random(vec3 seed) {
    seed = seed + vec3(123.456, 789.123, 456.789);
    return fract(sin(dot(seed, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
}

vec3 color2float(int r1, int g1, int b1) {
    float r2 = float(r1);
    float g2 = float(g1);
    float b2 = float(b1);
    float r = r2 / 255.0;
    float g = g2 / 255.0;
    float b = b2 / 255.0;
    return vec3(r, g, b);
}

void main() {
    mat4 W2C = inverse(cameraTransform);
    vec3 intensity = vec3(0.0, 0.0, 0.0);
    
    vec3 N = normalize(frag_normal.xyz);
    
    for (int i=0; i<numLights; i++){
        if (lights[i].enabled == false) continue;
        
        if (lights[i].type == DIRECTIONAL) {
            // TODO: implement diffuse and specular reflections for directional light
            //diffuse
            vec4 lit = vec4(-lights[i].dir, 0);
            vec3 L = normalize((W2C * lit).xyz);
            float i1 = max(dot(N, L) * lights[i].illuminance, 0.0f);
            intensity += mainColor * i1;
            //intensity += color2float(lights[i].r, lights[i].g, lights[i].b) * i1;

            //specular
            vec3 V = normalize((W2C * frag_pos).xyz);
            vec3 H = normalize(L - V);
            float i2 = max(dot(N, H), 0.0f);
            float i3 = pow(i2, 20.0f) * lights[i].illuminance;
            intensity += mainColor * i3;
            //intensity += color2float(lights[i].r, lights[i].g, lights[i].b) * i3;
        }
        else if (lights[i].type == POINT) {
            continue;
        }
        else if (lights[i].type == SPOTLIGHT) {
            continue;
        }
        else if (lights[i].type == AMBIENT) {
            // TODO: implement ambient reflection
            //intensity += mainColor * lights[i].illuminance;
            intensity += color2float(lights[i].r, lights[i].g, lights[i].b) * lights[i].illuminance;
        }
    }
    
    output_color = vec4(intensity, 1.0);
    
    output_color.rgb = pow(output_color.rgb, vec3(1.0 / 2.2));  // Gamma correction
}

