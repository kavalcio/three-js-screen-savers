uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

uniform float uTime;
uniform vec2 uWaveFrequency;
uniform float uWaveAmplitude;
uniform vec2 uAnimationSpeed;
uniform vec3 uPeakColor;
uniform vec3 uValleyColor;
uniform float uColorOffset;
uniform float uColorDamping;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vUv;
varying float vElevation;
varying vec3 vPeakColor;
varying vec3 vValleyColor;

// TODO: if vElevation isn't used in fragment shader for anything else in frag shader, just mix colors here and send interpolated vertex color to frag shader

void main()
{
  vUv = uv;
  vPeakColor = uPeakColor;
  vValleyColor = uValleyColor;
  
  vec4 modelPosition = modelMatrix * vec4(position, 1.0);

  float elevation =
    sin(modelPosition.x * uWaveFrequency.x + uTime * uAnimationSpeed.x)
    * sin(modelPosition.z * uWaveFrequency.y + uTime * uAnimationSpeed.y)
    * uWaveAmplitude;
  modelPosition.y += elevation;
  // vElevation = (elevation + uWaveAmplitude / 2.) / uWaveAmplitude;
  vElevation = (elevation + uColorOffset) / uColorDamping;

  vec4 viewPosition = viewMatrix * modelPosition;

  vec4 projectedPosition = projectionMatrix * viewPosition;

  gl_Position = projectedPosition;
}
