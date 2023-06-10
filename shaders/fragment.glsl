precision mediump float;

uniform float uTime;

void main()
{
  gl_FragColor = vec4(sin(uTime / 2.) + 0.2, cos(uTime * 2.) + 0.2, 0.0, 0.5);
}
