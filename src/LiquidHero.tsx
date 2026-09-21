import { useEffect, useRef } from 'react';

const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const VERT = `
uniform float uTime;
uniform float uScroll;
uniform float uAmp;
varying vec3 vN;
varying vec3 vV;
${NOISE}
vec3 displace(vec3 p){
  float n=snoise(p*1.15+vec3(0.,uTime*.22,uScroll*.9));
  n+=.5*snoise(p*2.3-vec3(uTime*.18,0.,uScroll*.5));
  return p*(1.+uAmp*n*.32);
}
void main(){
  vec3 p=normalize(position);
  vec3 d=displace(p);
  vec3 t=normalize(cross(p,vec3(0.,1.,.001)));
  vec3 b=normalize(cross(p,t));
  float e=.03;
  vec3 pt=displace(normalize(p+t*e));
  vec3 pb=displace(normalize(p+b*e));
  vec3 n=cross(pt-d,pb-d);
  n*=sign(dot(n,p));
  vN=normalize(normalMatrix*n);
  vec4 mv=modelViewMatrix*vec4(d,1.);
  vV=-mv.xyz;
  gl_Position=projectionMatrix*mv;
}`;

const FRAG = `
precision highp float;
varying vec3 vN;
varying vec3 vV;
uniform float uTime;
void main(){
  vec3 n=normalize(vN);
  vec3 v=normalize(vV);
  float fres=pow(1.-max(dot(n,v),0.),2.2);
  vec3 mint=vec3(.75,.96,.90);
  vec3 green=vec3(0.,.55,.46);
  vec3 col=mix(mint,green,smoothstep(-.6,.9,n.y*.7+n.x*.4));
  vec3 iri=.5+.5*cos(6.28318*(fres*.8+n.x*.25+uTime*.03+vec3(0.,.33,.67)));
  col=mix(col,iri,.22*fres);
  vec3 l1=normalize(vec3(-.5,.8,.6));
  float spec=pow(max(dot(reflect(-l1,n),v),0.),48.);
  float spec2=pow(max(dot(reflect(-normalize(vec3(.7,-.3,.5)),n),v),0.),24.)*.4;
  col+=vec3(1.)*(spec+spec2);
  col=mix(col,vec3(1.),fres*.35);
  float a=clamp(.62+.38*fres+spec,0.,1.)*.92;
  gl_FragColor=vec4(col,a);
}`;

/** Ana görselin arkasında süzülen, sıvı gibi akan 3B küre (three.js, tembel yüklenir). */
export function LiquidHero({ still }: { still: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let disposed = false;
    let cleanup = () => {};
    import('three').then((THREE) => {
      if (disposed) return;
      const coarse = matchMedia('(pointer: coarse)').matches;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({
          canvas,
          alpha: true,
          antialias: !coarse,
          powerPreference: 'low-power',
        });
      } catch {
        return;
      }
      renderer.setClearColor(0x000000, 0);
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
      camera.position.z = 3.5;
      const uniforms = {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uAmp: { value: 1 },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
        transparent: true,
      });
      const geometry = new THREE.IcosahedronGeometry(1, coarse ? 14 : 26);
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
      const resize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, coarse ? 1.5 : 1.75));
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(1, h);
        camera.updateProjectionMatrix();
      };
      const start = performance.now();
      let raf = 0;
      let visible = true;
      let running = false;
      const draw = () => {
        const t = (performance.now() - start) / 1000;
        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;
        const s = scrollY / Math.max(1, innerHeight);
        uniforms.uTime.value = t;
        uniforms.uScroll.value = s;
        uniforms.uAmp.value = 1 + Math.min(1.2, s * 0.8);
        mesh.rotation.y = t * 0.12 + mouse.x * 0.6;
        mesh.rotation.x = mouse.y * 0.4;
        mesh.position.y = Math.sin(t * 0.5) * 0.05 - s * 0.5;
        const k = Math.max(0.55, 1 - s * 0.35);
        mesh.scale.setScalar(k);
        renderer.render(scene, camera);
      };
      const loop = () => {
        if (!visible || document.hidden) {
          running = false;
          return;
        }
        draw();
        raf = requestAnimationFrame(loop);
      };
      const kick = () => {
        if (still || running) return;
        running = true;
        raf = requestAnimationFrame(loop);
      };
      const onMove = (e: PointerEvent) => {
        mouse.tx = (e.clientX / innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / innerHeight - 0.5) * 2;
      };
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) kick();
      });
      io.observe(canvas);
      const ro = new ResizeObserver(() => {
        resize();
        if (still) draw();
      });
      ro.observe(canvas);
      resize();
      draw();
      canvas.classList.add('ready');
      document.addEventListener('visibilitychange', kick);
      if (!still) addEventListener('pointermove', onMove, { passive: true });
      kick();
      cleanup = () => {
        cancelAnimationFrame(raf);
        io.disconnect();
        ro.disconnect();
        document.removeEventListener('visibilitychange', kick);
        removeEventListener('pointermove', onMove);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    });
    return () => {
      disposed = true;
      cleanup();
    };
  }, [still]);
  return <canvas ref={ref} className="liquid-hero" aria-hidden="true" />;
}
