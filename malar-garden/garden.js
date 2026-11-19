
const dialog = document.querySelector('dialog');
document.querySelector('#menu').onclick = () => dialog.showModal();
dialog.querySelectorAll('a').forEach(link => link.onclick = () => dialog.close());

let audio, volume, playing = false;
const sound = document.querySelector('#sound');
sound.onclick = async () => {
  if (!audio) {
    audio = new AudioContext();
    volume = audio.createGain();
    volume.gain.value = 0;
    volume.connect(audio.destination);
    [146.83, 220, 293.8].forEach(hz => {
      const tone = audio.createOscillator();
      tone.frequency.value = hz;
      tone.connect(volume);
      tone.start();
    });
  }
  await audio.resume();
  playing = !playing;
  volume.gain.setTargetAtTime(playing ? .019 : 0, audio.currentTime, .3);
  sound.textContent = playing ? 'Sound on' : 'Sound off';
  sound.setAttribute('aria-pressed', String(playing));
};

function garden(hero) {
  const canvas = hero.querySelector('canvas');
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, depth:true});
  if (!gl || gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)<2) {
    const panBackground=()=>{
      const stage=hero.parentElement;
      const fraction=Math.min(1,Math.max(0,-stage.getBoundingClientRect().top/Math.max(1,stage.offsetHeight-hero.offsetHeight)));
      hero.style.setProperty('--wall-position',(fraction*100)+'%');
    };
    panBackground();
    addEventListener('scroll',panBackground,{passive:true});
    addEventListener('resize',panBackground);
    return;
  }
  const program = gl.createProgram();
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s,source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(s));
    gl.attachShader(program,s);
  }
  shader(gl.VERTEX_SHADER,`
    precision highp float;
    attribute vec2 pos;
    varying vec2 uv;
    uniform highp sampler2D field,heightMap;
    uniform vec2 cover,lightPoint;
    uniform float pan,resting;
    void main(){
      uv=pos*.5+.5;
      vec2 p=vec2(uv.x,1.-uv.y);
      vec2 tex=(p-.5)*cover+.5+vec2(0.,pan);
      float h=texture2D(heightMap,tex).r;
      float rise=max(resting,smoothstep(.025,.78,texture2D(field,p).r));
      float rim=1.-smoothstep(.90,1.,max(abs(pos.x),abs(pos.y)));
      float z=.060*h*rise*rim;
      vec2 gaze=vec2((lightPoint.x-.5)*.52,.31+(.5-lightPoint.y)*.40);
      gl_Position=vec4(pos+gaze*z,-z,1.-z);
    }`);
  shader(gl.FRAGMENT_SHADER,`
    precision highp float;
    varying vec2 uv;
    uniform highp sampler2D mural, field, heightMap, normalMap, shapeMap;
    uniform vec2 cover, pixel, lightPoint;
    uniform float resting, pan;
    void main(){
      vec2 p=vec2(uv.x,1.-uv.y);
      vec2 tex=(p-.5)*cover+.5+vec2(0.,pan);
      float h=texture2D(heightMap,tex).r;
      vec3 contact=texture2D(field,p).rgb;
      float brush=contact.r;
      vec2 sweep=(contact.gb*255.-128.)/126.;
      // Adjacent pixels on one carved form share a contact anchor.
      vec4 shape=texture2D(shapeMap,tex);
      vec2 anchor=(shape.rg-.5-vec2(0.,pan))/cover+.5;
      vec2 branch=mix(p,anchor,.82);
      vec2 drift=(texture2D(shapeMap,tex+pixel*8.).ba-vec2(.45,.5))*pixel*22./cover;
      float shared=texture2D(field,branch+drift).r;
      float carved=smoothstep(.035,.62,shape.b);
      float wick=texture2D(field,mix(p,anchor,.54)-drift).r;
      float reached=.62*brush+.27*wick+.21*shared;
      // As pressure falls, a contact plane passes through the relief from back to front.
      float depth=smoothstep(.06,.92,h);
      float plane=mix(.52,.032,depth)+.025*(shape.a-.5);
      float lift=smoothstep(plane,plane+mix(.37,.49,depth),reached)
                 *max(mix(.015,.94,carved),.96*depth);
      float localLift=lift;
      lift=max(lift,resting);
      vec2 surface=tex;
      vec3 art=texture2D(mural,surface).rgb;
      float value=dot(art,vec3(.299,.587,.114));
      vec3 normal=normalize(texture2D(normalMap,surface).rgb*2.-1.);
      vec2 toward=(lightPoint-p)*cover/pixel;
      toward/=max(length(toward),.21*min(cover.x/pixel.x,cover.y/pixel.y));
      vec3 key=normalize(vec3(-.55,.60,.82));
      vec3 lamp=normalize(key+vec3(toward.x,-toward.y,0.)*.44);
      vec3 bounce=normalize(vec3(-lamp.xy,.55));
      float facing=max(0.,dot(normal,lamp))-lamp.z;
      float reflected=max(0.,dot(normal,bounce))-bounce.z;
      float warm=smoothstep(.012,.28,facing);
      float cool=smoothstep(.018,.32,reflected)*(1.-warm*.65);
      // The trail stores local swipe velocity. Only its moving edges catch colored light.
      float speedTint=smoothstep(.018,.60,length(sweep));
      vec3 glint=vec3(.023,.016,-.017)*warm+vec3(-.016,.024,-.013)*cool;
      vec3 illumination=localLift*(vec3(.070)*max(facing,0.)+vec3(.032)*min(facing,0.)+speedTint*glint);
      // Keep mineral specks attached to the wall as the camera scrolls.
      vec2 stone=tex/pixel;
      vec2 cell=floor(stone*.46);
      vec3 hash=fract(vec3(cell.xyx)*vec3(.1031,.1030,.0973));
      hash+=dot(hash,hash.yzx+33.33);
      vec2 seed=fract((hash.xx+hash.yz)*hash.zy);
      vec2 offset=fract(stone*.46)-(.22+.56*seed);
      float pore=1.-smoothstep(.055,.26,length(offset));
      float fleck=smoothstep(.69,.92,seed.x)-smoothstep(.63,.88,seed.y);
      vec3 rosewood=vec3(33.,21.,14.)/255.;
      float wall=(shape.a-.5)*.010+pore*fleck*.033;
      // Separate the wide baked shadow from the fine creases that describe the carving.
      vec2 span=pixel*8.;
      vec3 surroundings=texture2D(mural,surface+vec2(span.x,0.)).rgb
                       +texture2D(mural,surface-vec2(span.x,0.)).rgb
                       +texture2D(mural,surface+vec2(0.,span.y)).rgb
                       +texture2D(mural,surface-vec2(0.,span.y)).rgb;
      float nearby=dot(surroundings,vec3(.299,.587,.114))*.25;
      float darkness=max(.84-value,0.);
      float crease=min(darkness,max(nearby-value,0.));
      // Cast shade contracts toward the carving as it sinks; contact detail stays attached.
      vec2 shadowProbe=surface+vec2(-3.,4.)*pixel*(1.-lift);
      float castDark=max(0.,.84-dot(texture2D(mural,shadowProbe).rgb,vec3(.299,.587,.114)));
      float broad=.32*min(darkness-crease,castDark)*pow(lift,1.65);
      float contactShade=.58*crease*lift;
      float shadow=-min(.095*lift,broad+contactShade);
      float light=max(value-.84,0.)*pow(lift,.88);
      gl_FragColor=vec4(rosewood+wall*mix(1.,.35,lift)+shadow*.66+vec3(1.55,1.12,.75)*light+illumination*vec3(1.35,1.12,.88),1.);
    }`);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buff=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buff);
  const cells=248, side=cells+1;
  const vertices=new Float32Array(side*side*2);
  const indices=new Uint16Array((2*side+2)*cells-2);
  let i=0;
  for(let y=0;y<side;y++){
    for(let x=0;x<side;x++){
      const v=y*side+x;
      vertices[v*2]=2*x/cells-1;
      vertices[v*2+1]=2*y/cells-1;
      if(y<cells){indices[i++]=v; indices[i++]=v+side;}
    }
    if(y<cells-1){indices[i++]=(y+2)*side-1; indices[i++]=(y+1)*side;}
  }
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,indices,gl.STATIC_DRAW);
  gl.enable(gl.DEPTH_TEST);
  const pos=gl.getAttribLocation(program,'pos');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const loc=Object.fromEntries(['cover','pan','pixel','lightPoint','resting'].map(k=>[k,gl.getUniformLocation(program,k)]));
  function makeTexture(unit,name){
    const tex=gl.createTexture();
    gl.activeTexture(gl.TEXTURE0+unit);
    gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.uniform1i(gl.getUniformLocation(program,name),unit);
    for(const prop of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,prop,gl.CLAMP_TO_EDGE);
    for(const prop of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,prop,gl.LINEAR);
    return tex;
  }
  const art=makeTexture(0,'mural'), depth=makeTexture(1,'heightMap');
  makeTexture(2,'field');
  const normals=makeTexture(3,'normalMap');
  const shapes=makeTexture(4,'shapeMap');
  gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  const portrait=matchMedia('(max-aspect-ratio:1/1)'), reduce=matchMedia('(prefers-reduced-motion:reduce)');
  let w,h,energy,field,bytes,source,artSize,frame=0,visible=true,previousTime=0;
  let lastLamp={x:.31,y:.34};
  let strokeX,strokeY,contactTime;
  let target=null, head=null, seed=true, introStart=0;
  function schedule(){
    if(!frame && visible && artSize && !document.hidden) frame=requestAnimationFrame(draw);
  }
  function resize(){
    const d=Math.min(devicePixelRatio,1.6);
    canvas.width=Math.round(hero.clientWidth*d);
    canvas.height=Math.round(hero.clientHeight*d);
    gl.viewport(0,0,canvas.width,canvas.height);
    w=Math.max(32,Math.round(hero.clientWidth/6));
    h=Math.max(32,Math.round(hero.clientHeight/6));
    energy=new Float32Array(w*h); field=new Float32Array(w*h); bytes=new Uint8Array(w*h*3);
    strokeX=new Float32Array(w*h);
    strokeY=new Float32Array(w*h);
    contactTime=new Float64Array(w*h);
    gl.activeTexture(gl.TEXTURE2);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,w,h,0,gl.RGB,gl.UNSIGNED_BYTE,bytes);
    head=null;
    const files=portrait.matches?['art/wall-tall-water.jpg','art/wall-tall-water-geometry.png','art/wall-tall-water-surface.jpg','art/wall-tall-water-shapes.png']:['art/wall-water.jpg','art/wall-water-geometry.png','art/wall-water-surface.jpg','art/wall-water-shapes.png'];
    if(source!==files[0]){
      source=files[0];
      Promise.all(files.map(url=>new Promise((resolve,reject)=>{
        const img=new Image(); img.onload=()=>resolve(img);img.onerror=reject;img.src=url;
      }))).then(images=>{
        if(source!==files[0]) return;
        images.forEach((img,i)=>{
          gl.activeTexture(gl.TEXTURE0+[0,1,3,4][i]);
          gl.bindTexture(gl.TEXTURE_2D,[art,depth,normals,shapes][i]);
          const format=i===3?gl.RGBA:gl.RGB;
          let source=img;
          const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);
          if(img.height>max){
            source=document.createElement('canvas');
            source.width=Math.max(1,Math.round(img.width*max/img.height));
            source.height=max;
            source.getContext('2d').drawImage(img,0,0,source.width,source.height);
          }
          gl.texImage2D(gl.TEXTURE_2D,0,format,format,gl.UNSIGNED_BYTE,source);
        });
        artSize=[images[0].width,images[0].height];schedule();
      }).catch(()=>canvas.classList.remove('ready'));
    }
    schedule();
  }
  const dot=document.createElement('span');
  dot.className='garden-pointer';
  dot.setAttribute('aria-hidden','true');
  hero.append(dot);
  let leader=null;
  function mark(e){
    if(reduce.matches || !e.isPrimary) return;
    const r=hero.getBoundingClientRect();
    target={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};
    hero.classList.toggle('tracking',e.pointerType==='mouse' && !e.target.closest('a,button'));
    seed=false;
    schedule();
  }
  function release(){
    target=null; leader=null; head=null;
    hero.classList.remove('tracking');
    schedule();
  }
  // Rasterize the full swept segment. A quick flick and a slow stroke leave continuous paths.
  function stroke(a,b,dt,time){
    const ax=a.x*w,ay=a.y*h,dx=(b.x-a.x)*w,dy=(b.y-a.y)*h;
    const radius=Math.min(w,h)*.37, span=dx*dx+dy*dy;
    const speedScale=1/Math.max(1,dt*Math.min(w,h)*1.55,Math.hypot(dx,dy));
    const x0=Math.max(0,Math.floor(Math.min(ax,ax+dx)-radius)), x1=Math.min(w-1,Math.ceil(Math.max(ax,ax+dx)+radius));
    const y0=Math.max(0,Math.floor(Math.min(ay,ay+dy)-radius)), y1=Math.min(h-1,Math.ceil(Math.max(ay,ay+dy)+radius));
    for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
      const t=span?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/span)):0;
      const rx=(x-ax-t*dx)/radius, ry=(y-ay-t*dy)/radius;
      const angle=Math.atan2(ry,rx);
      const edge=.83+.095*Math.sin(3*angle+.7)+.055*Math.cos(5*angle-1.)+.02*Math.sin(7*angle);
      const r=Math.hypot(rx,ry)/edge;
      const u=Math.max(0,Math.min(1,(1-r)/.82));
      const i=y*w+x;
      const weight=u*u*(3-2*u);
      energy[i]=Math.max(energy[i],weight);
      if(weight>.01 && Math.hypot(dx,dy)*speedScale>.035){
        // Preserve the last directional impulse during stationary hover.
        const blend=1-Math.exp(-dt*45*weight);
        const carry=Math.exp(-(time-contactTime[i])/200);
        strokeX[i]=strokeX[i]*carry*(1-blend)+dx*speedScale*weight*blend;
        strokeY[i]=strokeY[i]*carry*(1-blend)+dy*speedScale*weight*blend;
        contactTime[i]=time;
      }
    }
  }
  function draw(t){
    frame=0;
    if(!visible || document.hidden) return;
    const dt=Math.min(.25,(t-previousTime)/1000 || .016);
    previousTime=t;
    if(!introStart) introStart=t;
    if(seed && t-introStart>1600){seed=false;head=null;}
    const aim=target||(seed?{x:.31,y:.34}:null);
    const decay=Math.exp(-dt/.405), attack=1-Math.exp(-dt/.15);
    for(let i=0;i<energy.length;i++) energy[i]*=decay;
    if(aim && !reduce.matches){
      leader=leader||aim;
      const follow=1-Math.exp(-dt/.095);
      leader={x:leader.x+(aim.x-leader.x)*follow,y:leader.y+(aim.y-leader.y)*follow};
      const from=head||leader,ease=1-Math.exp(-dt/.13);
      head={x:from.x+(leader.x-from.x)*ease,y:from.y+(leader.y-from.y)*ease};
      dot.style.left=(100*head.x)+'%';
      dot.style.top=(100*head.y)+'%';
      stroke(from,head,dt,t);
    }
    let moving=false;
    for(let i=0;i<field.length;i++){
      field[i]+=(energy[i]-field[i])*attack;
      const age=(t-contactTime[i])*.001;
      const spring=age<1.25 ? Math.exp(-6*age) : 0;
      bytes[i*3]=Math.round(field[i]*255);
      bytes[i*3+1]=128+Math.round(126*strokeX[i]*spring);
      bytes[i*3+2]=128+Math.round(126*strokeY[i]*spring);
      if(bytes[i*3]>0) moving=true;
    }
    gl.activeTexture(gl.TEXTURE2);
    gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,w,h,gl.RGB,gl.UNSIGNED_BYTE,bytes);
    const ratio=canvas.width/canvas.height/(artSize[0]/artSize[1]);
    gl.uniform2f(loc.cover,Math.min(1,ratio),Math.min(1,1/ratio));
    gl.uniform2f(loc.pixel,1/artSize[0],1/artSize[1]);
    const lamp=head||lastLamp;
    lastLamp=lamp;
    gl.uniform2f(loc.lightPoint,lamp.x,lamp.y);
    gl.uniform1f(loc.resting,reduce.matches?.76:0);
    const stage=hero.parentElement;
    const progress=Math.max(0,Math.min(1,-stage.getBoundingClientRect().top/Math.max(1,stage.offsetHeight-hero.offsetHeight)));
    gl.uniform1f(loc.pan,(progress-.5)*(1.-Math.min(1,1/ratio)));

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLE_STRIP,indices.length,gl.UNSIGNED_SHORT,0);
    canvas.classList.add('ready');
    if(!reduce.matches && (aim||moving)) schedule();
  }
  hero.addEventListener('pointermove',mark);
  hero.addEventListener('pointerdown',mark);
  hero.addEventListener('pointerleave',release);
  hero.addEventListener('pointercancel',release);
  hero.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse') release();});
  window.addEventListener('blur',release);
  new ResizeObserver(resize).observe(hero);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(!visible)release();schedule();}).observe(hero);
  document.addEventListener('visibilitychange',schedule);
  reduce.addEventListener('change',schedule);
  addEventListener('scroll',schedule,{passive:true});
  canvas.addEventListener('webglcontextlost',()=>canvas.classList.remove('ready'));
  resize();
}
garden(document.querySelector('#garden .hero'));

