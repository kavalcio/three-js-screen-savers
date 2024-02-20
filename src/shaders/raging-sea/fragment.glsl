precision mediump float;

varying vec2 vUv;
varying float vElevation;
varying vec3 vPeakColor;
varying vec3 vValleyColor;

uniform float uTime;

#define M_PI 3.1415926535897932384626433832795

void main()
{
  gl_FragColor = vec4(mix(vValleyColor, vPeakColor, vElevation), 1.0);
}
