const dialog = document.querySelector('dialog');
const menu = document.querySelector('#menu');

if (dialog.id === 'garden-menu') {
  const panel = dialog.querySelector('.leaf-menu');
  const canvas = panel.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const leaf = new Image();
  // Sample the intact area of the same leaf so both treatments have a cut edge.
  const trim = .30;
  const folded = new URLSearchParams(location.search).get('foil') !== 'grow';
  const faces = [];
  const reflections = [];
  const reflectionAtlas = new Image();
  if(folded){
    canvas.hidden = true;
    reflectionAtlas.src = 'gilded-reflections.webp';
    const stage = document.createElement('div');
    stage.className = 'fold-stage';
    stage.setAttribute('aria-hidden','true');
    panel.prepend(stage);
    const controls = [panel.querySelector('form'), panel.querySelector('nav')];
    let parent = stage;
    for(let i=0;i<3;i++){
      const face = document.createElement('div');
      face.className = 'fold-face';
      // Keep the original leaf underneath the local crease texture.
      const sheetOffset = trim + (2-i)*(1-trim)/3;
      face.style.backgroundSize = (300/(1-trim))+'% 100%';
      face.style.backgroundPosition = (100*sheetOffset/(1-(1-trim)/3))+'% 0';
      face.dataset.fold=String(i);
      const reflection = document.createElement('div');
      reflection.className = 'foil-reflection';
      reflection.style.setProperty('--foil-column', face.style.backgroundPositionX);
      face.append(reflection);
      reflections.push(reflection);
      if(i>0) {
        const crease=document.createElement('canvas');
        crease.className='crease-detail';
        face.append(crease);
      }
      const slice=document.createElement('div');
      slice.className='ink-slice';
      const page=document.createElement('div');
      page.className='ink-page';
      page.style.left=((i-2)*100)+'%';
      // A clipped full-width impression on each panel keeps letters continuous across hinges.
      controls.forEach(control=>page.append(control.cloneNode(true)));
      page.inert=true;
      slice.append(page);
      face.append(slice);
      parent.append(face);
      parent = face;
      faces.push(face);
    }
  }
  const clamp = value => Math.max(0, Math.min(1,value));
  let frame = 0, progress = 0, material, output, arrival;
  // A shared noise grid keeps neighbouring flakes connected as they adhere.
  const lattice = new Float32Array(4096);
  let seed=80241;
  for(let i=0;i<lattice.length;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    lattice[i]=seed/4294967296;
  }
  function noise(x,y) {
    const ix=Math.floor(x), iy=Math.floor(y);
    const cell=(dx,dy)=>lattice[(((iy+dy)&63)*64)+((ix+dx)&63)];
    let u=x-ix, v=y-iy;
    u=u*u*(3-2*u); v=v*v*(3-2*v);
    return (cell(0,0)*(1-u)+cell(1,0)*u)*(1-v)+(cell(0,1)*(1-u)+cell(1,1)*u)*v;
  }
  function detailFolds() {
    const h=panel.clientHeight;
    const ratio=Math.min(2,devicePixelRatio);
    for(let i=1;i<faces.length;i++){
      const crease=faces[i].querySelector('.crease-detail');
      if(crease.height===Math.round(h*ratio) && crease.dataset.ready) continue;
      crease.dataset.ready='true';
      crease.width=Math.ceil(9*ratio);
      crease.height=Math.round(h*ratio);
      const c=crease.getContext('2d');
      c.scale(ratio,ratio);
      for(let y=0;y<h;y+=.6){
        const broad=noise(i*7,y/(i===1?28:12));
        const grain=noise(i*13,y/2.2);
        const reach=.4+broad*(i===1?2.9:1.9)+grain*.8;
        c.fillStyle='rgba(96,61,21,'+(.08+.2*grain)+')';
        c.fillRect(9-reach,y,reach,.68);
        c.fillStyle='rgba(255,239,192,'+(.12+.32*broad)+')';
        c.fillRect(8.7-reach,y,.65,.75);
      }
    }
    // A few shallow nicks interrupt the cut only on the free edge.
    const edge=[];
    for(let y=0;y<=h+3;y+=3){
      const drift=noise(17,y/59);
      const nick=Math.pow(noise(21,y/8),5)*3.6;
      edge.push((.4+2.2*drift+nick).toFixed(2)+'px '+Math.min(h,y)+'px');
    }
    faces[2].style.clipPath='polygon(100% 0,100% 100%,'+edge.reverse().join(',')+')';
  }
  if(folded){
    const updateGlint = event => {
      if(event.pointerType==='touch') return;
      const rect = panel.getBoundingClientRect();
      const x = (event.clientX-rect.left)/rect.width;
      const y = (event.clientY-rect.top)/rect.height;
      const inside = x>=0 && x<=1 && y>=0 && y<=1 && reflectionAtlas.naturalWidth;
      panel.classList.toggle('lit', Boolean(inside));
      if(!inside) return;
      // Interpolate between baked reflection directions across the entire sheet.
      const frame = clamp(.68*x+.32*y)*6;
      const lower = Math.min(5, Math.floor(frame));
      reflections.forEach(reflection=>{
        reflection.style.setProperty('--reflection-from', (lower/6*100)+'%');
        reflection.style.setProperty('--reflection-to', ((lower+1)/6*100)+'%');
        reflection.style.setProperty('--reflection-mix', frame-lower);
      });
    };
    dialog.addEventListener('pointermove',updateGlint);
    dialog.addEventListener('pointerleave',()=>panel.classList.remove('lit'));
  }
  function prepare() {
    if(folded) { detailFolds(); paint(); return; }
    if(!panel.clientWidth || !panel.clientHeight || !leaf.naturalWidth) return;
    const ratio=Math.min(devicePixelRatio,1.5);
    const w=Math.round(panel.clientWidth*ratio), h=Math.round(panel.clientHeight*ratio);
    if(material && w===canvas.width && h===canvas.height) return;
    canvas.width=w; canvas.height=h;
    ctx.drawImage(leaf,leaf.width*trim,0,leaf.width*(1-trim),leaf.height,0,0,w,h);
    material=ctx.getImageData(0,0,w,h);
    output=ctx.createImageData(w,h);
    arrival=new Float32Array(w*h);
    for(let y=0;y<h;y++){
      const py=y/ratio;
      const delay=noise(1.8,py/117)*.22;
      for(let x=0;x<w;x++){
        const i=y*w+x, k=i*4;
        if(!material.data[k+3]) continue;
        const px=x/ratio, distance=1-x/w;
        const coarse=noise(px/68,py/90);
        const folds=noise(px/21+2.3*coarse,py/33+coarse);
        const flakes=noise(px/6.2,py/8.8);
        const relief=(material.data[k]-material.data[k+2])/255;
        arrival[i]=clamp(.06+.69*distance+delay+.38*(coarse-.5)
          +.19*(folds-.5)+.077*(flakes-.5)+.03*relief)*.95;
      }
    }
    paint();
  }
  function paintFold(){
    const eased = (start, end) => {
      const t=clamp((progress-start)/(end-start));
      return t*t*(3-2*t);
    };
    const angles=[
      90*(1-eased(0,.60)),
      -180*(1-eased(.10,.83)),
      180*(1-eased(.27,1))
    ];
    let orientation=0;
    faces.forEach((face,i)=>{
      orientation+=angles[i];
      const tilt=Math.sin(orientation*Math.PI/180);
      face.style.transform='rotateY('+angles[i]+'deg)';
      face.style.setProperty('--shade',Math.max(0,-tilt)*.36);
      face.style.setProperty('--shine',Math.max(0,tilt)*.31);
      face.style.setProperty('--crease',i ? .12+.25*Math.abs(tilt) : 0);
    });
    panel.classList.toggle('in-fold',progress<1);
    faces[0].parentElement.style.visibility=progress===0 ? 'hidden' : 'visible';
  }
  function paint() {
    const ink=clamp((progress-.64)/.25);
    panel.style.setProperty('--ink',ink*ink*(3-2*ink));
    if(folded) { paintFold(); return; }
    if(!material) return;
    if(progress===1){ ctx.putImageData(material,0,0); return; }
    if(progress===0){ ctx.clearRect(0,0,canvas.width,canvas.height); return; }
    const src=material.data, dst=output.data;
    for(let i=0;i<arrival.length;i++){
      const k=i*4, age=progress-arrival[i];
      if(age<=0 || !src[k+3]) { dst[k+3]=0; continue; }
      const lift=clamp(1-age/.055);
      // Only the newly turned lip catches the light. Settled metal keeps its photographic grain.
      const shine=lift*(src[k]/255)*37;
      dst[k]=src[k]+shine; dst[k+1]=src[k+1]+shine*.86; dst[k+2]=src[k+2]+shine*.68;
      dst[k+3]=src[k+3]*clamp(age/.009);
    }
    ctx.putImageData(output,0,0);
  }
  leaf.onload=()=>{ if(dialog.open) prepare(); };
  leaf.src='gilded-edge.png';
  function animate(open) {
    cancelAnimationFrame(frame);
    const start = performance.now(), from = progress, end = open ? 1 : 0;
    const travel = folded ? (open ? 840 : 430) : (open ? 1720 : 560);
    const duration = reduced.matches ? 0 : Math.abs(end-from)*travel;
    function draw(now) {
      const t = duration ? Math.min(1,(now-start)/duration) : 1;
      progress = from + (end-from)*t;
      paint();
      if(t<1) frame=requestAnimationFrame(draw);
      else if(!open) dialog.close();
    }
    draw(start);
  }
  menu.onclick = () => {
    dialog.showModal();
    document.body.classList.add('menu-open');
    menu.setAttribute('aria-expanded','true');
    panel.style.setProperty('--ink',0);
    prepare();
    animate(true);
  };
  panel.querySelector(':scope > form').onsubmit = event => { event.preventDefault(); animate(false); };
  dialog.oncancel = event => { event.preventDefault(); animate(false); };
  dialog.onclick = event => { if(event.target===dialog) animate(false); };
  panel.querySelectorAll(':scope > nav a').forEach(link => link.onclick = () => dialog.close());
  dialog.onclose = () => {
    cancelAnimationFrame(frame);
    progress=0;
    panel.classList.remove('lit');
    menu.setAttribute('aria-expanded','false');
    document.body.classList.remove('menu-open');
  };
  new ResizeObserver(()=>{ if(dialog.open) prepare(); }).observe(panel);
} else {
  menu.onclick = () => dialog.showModal();
  dialog.querySelectorAll('a').forEach(link => link.onclick = () => dialog.close());
}

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
  const loader = document.getElementById('garden-loader');
  const loadingStartedAt = performance.now();
  const root = document.documentElement;
  const loaderNumber = loader?.querySelector('.garden-loader-number');
  let progressFrame = 0;
  function showProgress(percent, duration = 140) {
    if (!loaderNumber?.isConnected) return;
    loader.setAttribute('aria-valuenow', percent);
    cancelAnimationFrame(progressFrame);
    if (duration === 0 || reduce.matches) {
      loaderNumber.textContent = percent;
      return;
    }
    const start = Number(loaderNumber.textContent);
    const startTime = performance.now();
    function countUp(time) {
      if (!loaderNumber.isConnected) return;
      const elapsed = Math.min(1, Math.max(0, (time - startTime) / duration));
      loaderNumber.textContent = Math.floor(start + (percent - start) * elapsed);
      if (elapsed < 1) progressFrame = requestAnimationFrame(countUp);
    }
    progressFrame = requestAnimationFrame(countUp);
  }
  function dismissLoader() {
    clearTimeout(window.malarIntroFallback);
    root.classList.remove('garden-loading');
    if (!loader?.isConnected || loader.classList.contains('loaded')) return;
    loader.classList.add('loaded');
    setTimeout(() => loader.remove(), 180);
  }
  const gl = canvas.getContext('webgl', {alpha:false, antialias:false, depth:true});
  if (!gl || gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)<2) {
    root.classList.remove('relief-intro', 'relief-reveal');
    dismissLoader();
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
  const localLighting = `
    uniform vec3 userLight, wanderingLight, occasionalLight, entranceLight;
    float lightWeight(vec2 p, vec3 light){
      vec2 delta=(p-light.xy)*cover;
      float distance=.016+dot(delta,delta);
      return light.z/(distance*distance);
    }
    vec2 lightFor(vec2 p){
      float a=lightWeight(p,userLight);
      float b=lightWeight(p,wanderingLight);
      float c=lightWeight(p,occasionalLight);
      float d=lightWeight(p,entranceLight);
      return (.25*lightPoint+a*userLight.xy+b*wanderingLight.xy+c*occasionalLight.xy+d*entranceLight.xy)
             /(.25+a+b+c+d);
    }`;
  shader(gl.VERTEX_SHADER,`
    precision highp float;
    attribute vec2 pos;
    varying vec2 uv;
    uniform highp sampler2D field,heightMap;
    uniform vec2 cover,lightPoint;
    uniform float pan,resting,introDepth;
    ${localLighting}
    void main(){
      uv=pos*.5+.5;
      vec2 p=vec2(uv.x,1.-uv.y);
      vec2 tex=(p-.5)*cover+.5+vec2(0.,pan);
      float h=texture2D(heightMap,tex).r;
      float rise=max(resting,smoothstep(.025,mix(.78,.53,introDepth),texture2D(field,p).r));
      float rim=1.-smoothstep(.965,1.,max(abs(pos.x),abs(pos.y)));
      float z=mix(.060,.096,introDepth)*h*rise*rim;
      vec2 localLamp=lightFor(p);
      vec2 gaze=vec2((localLamp.x-.5)*.52,.31+(.5-localLamp.y)*.40);
      gl_Position=vec4(pos+gaze*z,-z,1.-z);
    }`);
  shader(gl.FRAGMENT_SHADER,`
    precision highp float;
    varying vec2 uv;
    uniform highp sampler2D mural, field, heightMap, normalMap, shapeMap;
    uniform vec2 cover, pixel, lightPoint;
    uniform float resting, pan, introSurface, introDepth;
    ${localLighting}
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
      float plane=mix(mix(.52,.29,introDepth),.032,depth)+.025*(shape.a-.5);
      float lift=smoothstep(plane,plane+mix(.37,.49,depth),reached*(1.+.32*introDepth))
                 *max(mix(.015,.94,carved),.96*depth);
      float localLift=lift;
      lift=max(lift,resting);
      vec2 surface=tex;
      vec3 art=texture2D(mural,surface).rgb;
      float value=dot(art,vec3(.299,.587,.114));
      vec3 normal=normalize(texture2D(normalMap,surface).rgb*2.-1.);
      vec2 toward=(lightFor(p)-p)*cover/pixel;
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
      // The opening pulse is fast, so let its directional highlights catch sooner.
      float openingGlint=introDepth*smoothstep(.025,.26,length(sweep));
      vec3 openingTint=vec3(.100,.065,-.010)*warm+vec3(-.004,.019,-.003)*cool;
      vec3 illumination=localLift*(vec3(.070)*max(facing,0.)+vec3(.032)*min(facing,0.)
                                  +speedTint*glint+openingGlint*openingTint);
      // Keep mineral specks attached to the wall as the camera scrolls.
      vec2 stone=tex/pixel;
      vec2 cell=floor(stone*.46);
      vec3 hash=fract(vec3(cell.xyx)*vec3(.1031,.1030,.0973));
      hash+=dot(hash,hash.yzx+33.33);
      vec2 seed=fract((hash.xx+hash.yz)*hash.zy);
      vec2 offset=fract(stone*.46)-(.22+.56*seed);
      float pore=1.-smoothstep(.055,.26,length(offset));
      float fleck=smoothstep(.69,.92,seed.x)-smoothstep(.63,.88,seed.y);
      vec3 wallTone=vec3(33.,21.,14.)/255.;
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
      float shadow=-min(.095*lift,broad+contactShade)*(1.+.08*introDepth);
      float light=max(value-.84,0.)*pow(lift,.88)*(1.+.18*introDepth);
      vec3 surfaceColor=wallTone+wall*mix(1.,.35,lift)+shadow*.66
                        +vec3(1.55,1.12,.75)*light+illumination*vec3(1.35,1.12,.88);
      // The half-vector picks out individual relief facets within the active brush.
      vec3 halfVector=normalize(lamp+vec3(0.,0.,1.));
      float specular=pow(max(dot(normal,halfVector),0.),46.);
      float raisedLip=smoothstep(.008,.068,value-nearby);
      float gold=localLift*warm*specular*(.30+.70*raisedLip)*(.90+.10*seed.x);
      vec3 reliefColor=surfaceColor+gold*vec3(.30,.174,.039);
      float reveal=max(introSurface,smoothstep(.01,.42,reached));
      gl_FragColor=vec4(mix(vec3(33.,21.,14.)/255.,reliefColor,reveal),1.);
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
  const loc=Object.fromEntries(['cover','pan','pixel','lightPoint','resting','introSurface','introDepth','userLight','wanderingLight','occasionalLight','entranceLight'].map(k=>[k,gl.getUniformLocation(program,k)]));
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
  let w,h,energy,field,bytes,source,artSize,frame=0,visible=true,previousTime=null;
  let lastLamp={x:.31,y:.34};
  let strokeX,strokeY,contactTime;
  let target=null, seed=true, introStart=0;
  const ambient = document.body.classList.contains('ambient-landing');
  let entranceTime = 0;
  let firstRenderReady = false;
  let revealDistance, revealWidth;
  let entering = ambient && root.classList.contains('relief-intro');
  function finishEntrance() {
    entering = false;
    root.classList.remove('relief-intro', 'relief-reveal');
    clearTimeout(window.malarIntroFallback);
  }
  function advanceEntrance(dt, time) {
    if (!entering) return;
    if (reduce.matches || !root.classList.contains('relief-intro')) {
      finishEntrance();
      return;
    }
    entranceTime += dt * 1000;
    // One outward front follows a deeply uneven arrival map, then settles.
    const progress = Math.max(0, Math.min(1, (entranceTime - 100) / 2000));
    const aspect = hero.clientWidth / hero.clientHeight;
    const reach = Math.hypot(aspect * .5, .5) + .18;
    const radius = progress * reach * 1.9;
    const fade = Math.min(1, progress * 12) * Math.min(1, (1 - progress) * 12);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (x / (w - 1) - .5) * aspect;
      const dy = y / (h - 1) - .5;
      const distance = Math.hypot(dx, dy);
      const i = y * w + x;
      const band = Math.max(0, 1 - Math.abs(revealDistance[i] - radius) / revealWidth[i]);
      const strength = band * band * (3 - 2 * band) * fade;
      energy[i] = Math.max(energy[i], strength);
      if (strength > .05) {
        strokeX[i] = dx / Math.max(.001, distance) * strength * .55;
        strokeY[i] = dy / Math.max(.001, distance) * strength * .55;
        contactTime[i] = time;
      }
    }
    const lamp = wanderers[2];
    lamp.light = {x:.5, y:.5};
    lamp.intensity = fade * .65;
    if (entranceTime >= 850) root.classList.add('relief-reveal');
    if (entranceTime >= 2150) {
      finishEntrance();
      nextStroke = startWordmarkOrbit(wanderers[0], time);
    }
  }
  const userBrush = {head:null, leader:null, light:lastLamp, intensity:0};
  const wanderers = ambient ? Array.from({length:3},()=>({
    path:null, head:null, leader:null, light:lastLamp, intensity:0
  })) : [];
  const brushes=[{brush:userBrush,uniform:'userLight',weight:1.8},
    ...wanderers.map((brush,i)=>({brush,uniform:['wanderingLight','occasionalLight','entranceLight'][i],weight:1}))];
  let nextStroke=0;
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
    // Cache the asymmetric lobes and torn edge detail once per viewport size.
    revealDistance = new Float32Array(w*h);
    revealWidth = new Float32Array(w*h);
    const aspect = hero.clientWidth / hero.clientHeight;
    for (let y=0; y<h; y++) for (let x=0; x<w; x++) {
      const dx=(x/(w-1)-.5)*aspect, dy=y/(h-1)-.5;
      const angle=Math.atan2(dy,dx), distance=Math.hypot(dx,dy);
      const lobes=1+.29*Math.sin(3*angle+.8)+.19*Math.cos(5*angle-1.1)
        +.12*Math.sin(9*angle+.4)+.07*Math.cos(17*angle);
      const roughness=.055*Math.sin(dx*29+dy*17)*Math.cos(dy*31-dx*11)
        +.025*Math.sin(dx*67-dy*43);
      const i=y*w+x;
      revealDistance[i]=Math.max(0,distance/Math.max(.55,lobes)+roughness*Math.min(1,distance*8));
      revealWidth[i]=.07+.055*(.5+.5*Math.sin(angle*7+dx*13-dy*19));
    }
    gl.activeTexture(gl.TEXTURE2);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,w,h,0,gl.RGB,gl.UNSIGNED_BYTE,bytes);
    userBrush.head=userBrush.leader=null;
    const files=portrait.matches?['wall-tall-water.jpg','wall-tall-water-geometry.png','wall-tall-water-surface.jpg','wall-tall-water-shapes.png']:['wall-water.jpg','wall-water-geometry.png','wall-water-surface.jpg','wall-water-shapes.png'];
    if(source!==files[0]){
      source=files[0];
      let decoded = 0;
      showProgress(10);
      Promise.all(files.map(async url => {
        const img = new Image();
        img.src = url;
        await img.decode();
        if (source === files[0] && !firstRenderReady) showProgress(10 + ++decoded * 15);
        return img;
      })).then(images=>{
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
        if (!firstRenderReady) showProgress(90);
        artSize=[images[0].width,images[0].height];schedule();
      }).catch(() => {
        if (source !== files[0]) return;
        canvas.classList.remove('ready');
        finishEntrance();
        dismissLoader();
      });
    }
    schedule();
  }
  function startWander(brush, time){
    const length=.035+.70*Math.pow(Math.random(),1.55);
    const edge=Math.random()<.30 ? Math.floor(Math.random()*4) : -1;
    const direction=Math.random()<.5 ? -1 : 1;
    const angle=Math.random()*2*Math.PI;
    let dx=length*Math.cos(angle),dy=length*Math.sin(angle);
    if(edge>=0){
      dx=edge<2 ? length*direction : 0;
      dy=edge<2 ? 0 : length*direction;
    }
    const pad=.065;
    let x=pad+Math.max(0,-dx)+Math.random()*(1-2*pad-Math.abs(dx));
    let y=pad+Math.max(0,-dy)+Math.random()*(1-2*pad-Math.abs(dy));
    let bend=(Math.random()-.5)*.36;
    // Trace parallel to the selected edge, with a shallow bend toward the wall.
    const inset=.015+Math.random()*.025;
    if(edge===0 || edge===1){
      y=edge===0 ? inset : 1-inset;
      bend=(edge===0 ? 1 : -1)*direction*.08;
    }
    if(edge===2 || edge===3){
      x=edge===2 ? inset : 1-inset;
      bend=(edge===2 ? -1 : 1)*direction*.08;
    }
    // Spread individual sweep speeds around a mean of 1.7× the previous rate.
    const speed=1.7*(.70+.60*Math.random());
    const easing=.20+.75*Math.random();
    const weave=edge<0 ? (Math.random()-.5)*.72 : 0;
    if(edge<0){
      const clearanceX=Math.min(x,x+dx,1-x,1-x-dx);
      const clearanceY=Math.min(y,y+dy,1-y,1-y-dy);
      const maxBend=Math.min(clearanceX/Math.max(.001,Math.abs(dy)),
                            clearanceY/Math.max(.001,Math.abs(dx)))/(1+Math.abs(weave));
      bend=Math.sign(bend)*Math.min(Math.abs(bend),maxBend);
    }
    brush.path={x,y,dx,dy,bend,easing,weave,start:time,duration:(420+length*5000)/speed};
    brush.head=brush.leader=null;
  }
  function startWordmarkOrbit(brush, time) {
    const stage = hero.getBoundingClientRect();
    const wordmark = hero.parentElement.querySelector('.wordmark').getBoundingClientRect();
    const x = (wordmark.left + wordmark.width / 2 - stage.left) / stage.width;
    const y = (wordmark.top + wordmark.height / 2 - stage.top) / stage.height;
    const radiusX = Math.min(.45, Math.max(.33, wordmark.width / (2 * stage.width) + .09));
    const radiusY = Math.min(.24, Math.max(.14, wordmark.height / (2 * stage.height) + .075));
    const duration = 1800;
    brush.head = brush.leader = null;
    brush.path = {orbit:true, x, y, radiusX, radiusY, start:time, duration};
    return time + duration;
  }
  function wanderAim(brush,time){
    const path=brush.path;
    if(!path || time<path.start) return null;
    const progress=(time-path.start)/path.duration;
    if(progress>=1){
      brush.path=null;
      return null;
    }
    if (path.orbit) {
      const angle = Math.PI * (.86 + 2 * progress);
      return {x:path.x + Math.cos(angle)*path.radiusX, y:path.y + Math.sin(angle)*path.radiusY};
    }
    const eased=progress*progress*(3-2*progress);
    const u=progress+(eased-progress)*path.easing;
    const arc=path.bend*(Math.sin(Math.PI*u)+path.weave*Math.sin(2*Math.PI*u));
    return {x:path.x+path.dx*u-path.dy*arc,y:path.y+path.dy*u+path.dx*arc};
  }
  function advanceBrush(brush,aim,dt,time,response=1){
    if(!aim){
      brush.intensity*=Math.exp(-dt/.27);
      return;
    }
    const leader=brush.leader||aim;
    const follow=1-Math.exp(-dt*response/.095);
    brush.leader={x:leader.x+(aim.x-leader.x)*follow,y:leader.y+(aim.y-leader.y)*follow};
    const from=brush.head||brush.leader;
    const ease=1-Math.exp(-dt*response/.13);
    brush.head={x:from.x+(brush.leader.x-from.x)*ease,y:from.y+(brush.leader.y-from.y)*ease};
    brush.light=brush.head;
    brush.intensity=Math.min(1,brush.intensity+dt*9);
    stroke(from,brush.head,dt,time);
  }
  function mark(e){
    if(reduce.matches || !e.isPrimary) return;
    const r=hero.getBoundingClientRect();
    target={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};
    seed=false;
    schedule();
  }
  function release(){
    target=null;
    userBrush.head=userBrush.leader=null;
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
    const firstFrame = previousTime === null;
    const elapsed = firstFrame ? .016 : (t - previousTime) / 1000;
    // Keep a slow frame during startup from skipping a visible part of the reveal.
    const dt = Math.min(entering ? .034 : .25, elapsed);
    previousTime=t;
    if(!introStart) introStart=t;
    if(seed && t-introStart>1600){
      seed=false;
      userBrush.head=userBrush.leader=null;
    }
    const motion=!reduce.matches;
    const aim=motion ? target||(!ambient&&seed ? {x:.31,y:.34} : null) : null;
    const decay=Math.exp(-dt/(entering ? .19 : .405)), attack=1-Math.exp(-dt/.15);
    for(let i=0;i<energy.length;i++) energy[i]*=decay;

    // Paint the base relief before starting the entrance clock.
    if (!firstFrame && !loader?.isConnected) advanceEntrance(dt,t);
    // Hand off to random paths after the title sweep completes.
    if(ambient && motion && !entering && t>=nextStroke){
      startWander(wanderers[0],t);
      nextStroke=t+wanderers[0].path.duration+80+1100*Math.pow(Math.random(),1.45);
      if(!wanderers[1].path && Math.random()<.14) startWander(wanderers[1],t+100+350*Math.random());
    }
    wanderers.forEach(brush=>{
      advanceBrush(brush,motion ? wanderAim(brush,t) : null,dt,t,brush.path?.orbit ? 8 : 1.7);
    });
    // The native pointer gets its own brush and interacts even during an ambient stroke.
    advanceBrush(userBrush,aim,dt,t);
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
    if(aim) lastLamp=userBrush.light;
    gl.uniform2f(loc.lightPoint,lastLamp.x,lastLamp.y);
    brushes.forEach(({brush,uniform,weight})=>{
      const strength=motion ? brush.intensity*weight : 0;
      gl.uniform3f(loc[uniform],brush.light.x,brush.light.y,strength);
    });
    gl.uniform1f(loc.resting,reduce.matches?.76:0);
    // Restore the ambient surface gradually as the opening ripple clears the frame.
    const surfaceFade = entering ? Math.max(0, Math.min(1, (entranceTime - 1300) / 800)) : 1;
    const ambientSurface = surfaceFade*surfaceFade*(3-2*surfaceFade);
    gl.uniform1f(loc.introSurface,ambientSurface);
    gl.uniform1f(loc.introDepth,1-ambientSurface);
    const stage=hero.parentElement;
    const progress=Math.max(0,Math.min(1,-stage.getBoundingClientRect().top/Math.max(1,stage.offsetHeight-hero.offsetHeight)));
    gl.uniform1f(loc.pan,(progress-.5)*(1.-Math.min(1,1/ratio)));

    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLE_STRIP,indices.length,gl.UNSIGNED_SHORT,0);
    canvas.classList.add('ready');
    if (!firstRenderReady) {
      firstRenderReady = true;
      if (loader?.isConnected) {
        // The progress reaches 100 only after the GPU finishes the first frame.
        gl.finish();
        requestAnimationFrame(() => {
          if (!loader.isConnected || loader.classList.contains('loaded')) return;
          const countDuration = reduce.matches ? 0 : Math.max(180, 650 - (performance.now() - loadingStartedAt));
          showProgress(100, countDuration);
          setTimeout(() => {
            showProgress(100, 0);
            dismissLoader();
          }, countDuration);
        });
      }
    }
    if(!reduce.matches && (aim||moving||ambient)) schedule();
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
  canvas.addEventListener('webglcontextlost', () => {
    canvas.classList.remove('ready');
    finishEntrance();
    dismissLoader();
  });
  resize();
}
garden(document.querySelector('#garden .hero'));

