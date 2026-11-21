// A real subdivided foil surface: the local fold deforms both texture and lettering.
export function mountFoil(face,reduced){
 const canvas=face.querySelector('canvas'),gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
 if(!gl){canvas.dataset.renderer='fallback';return {amount(){}};}
 const vertex=`
 attribute vec2 uv; uniform vec2 pointer; uniform mediump float pressure;
 varying mediump vec2 tex; varying mediump vec3 normal;
 float heightAt(vec2 p){
   float base=.003*sin(p.x*37.+p.y*11.)+.002*sin(p.y*53.-p.x*17.);
   vec2 d=(p-pointer)*vec2(1.5,1.);
   float ridge=d.x*.82+d.y*.57;
   float fold=.085*exp(-dot(d,d)*17.)*(exp(-ridge*ridge*380.)-.33);
   return base+pressure*fold;
 }
 void main(){
   float h=heightAt(uv),e=.002;
   normal=normalize(vec3((h-heightAt(uv+vec2(e,0.)))/e/1.5,(h-heightAt(uv+vec2(0.,e)))/e,1.));
   vec2 p=(uv-.5)*1.88;
   p+=vec2(-.20,.36)*h;
   gl_Position=vec4(p,0.,1.-h*.35);tex=uv;
 }`;
 const fragment=`
 precision mediump float; uniform sampler2D foil; uniform mediump float pressure;
 varying mediump vec2 tex; varying mediump vec3 normal;
 void main(){
   vec3 n=normalize(normal),light=normalize(vec3(-.5,.65,1.));
   float diffuse=dot(n,light);
   float spec=pow(max(dot(n,normalize(light+vec3(0.,0.,1.))),0.),32.);
   vec3 color=texture2D(foil,tex).rgb;
   color*=.86+.20*diffuse;
   color+=vec3(1.,.81,.39)*spec*(.05+pressure*.20);
   gl_FragColor=vec4(color,1.);
 }`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 let program;
 try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(error){canvas.dataset.renderer='fallback';console.warn('Gift foil shader:',error.message);return {amount(){}};}
 canvas.dataset.renderer='webgl';
 gl.useProgram(program);
 const verts=[],nx=80,ny=54;
 for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)for(const [a,b]of [[0,0],[1,0],[0,1],[0,1],[1,0],[1,1]])verts.push((x+a)/nx,(y+b)/ny);
 gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);
 const attr=gl.getAttribLocation(program,'uv');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
 const pointerLoc=gl.getUniformLocation(program,'pointer'),pressureLoc=gl.getUniformLocation(program,'pressure');
 const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const art=new Image(),sheet=document.createElement('canvas');sheet.width=1200;sheet.height=800;const ctx=sheet.getContext('2d');
 let amount=50,ready=false,visible=false,frame=0,last=0,x=.5,y=.5,tx=.5,ty=.5,p=0,tp=0;
 function stamp(){
   if(!ready)return;
   ctx.drawImage(art,0,0,sheet.width,sheet.height);
   // Place the ink, including Cormorant's descending numerals, inside its own line.
   function engrave(text,x,bottom,size,font,align,spacing=0){
     ctx.font=size+'px '+font;ctx.textAlign=align;ctx.letterSpacing=spacing+'px';
     const baseline=bottom-ctx.measureText(text).actualBoundingBoxDescent;
     ctx.fillStyle='rgba(255,237,179,.64)';ctx.fillText(text,x+1,baseline+2);
     ctx.fillStyle='#51380f';ctx.fillText(text,x,baseline);
   }
   engrave('malar',600,285,150,'MalarEditorial','center',-3);
   engrave('A SMALL GESTURE',600,350,25,'MalarText','center',3);
   engrave('GIFT CARD',145,665,28,'MalarText','left',4);
   engrave('$'+amount,1055,675,158,'MalarEditorial','right',-3);
   gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,sheet);schedule();
 }
 function schedule(){if(ready&&visible&&!frame&&!document.hidden)frame=requestAnimationFrame(draw);}
 function draw(now){
   frame=0;const dt=last?Math.min(now-last,50):16;last=now;
   const k=1-Math.exp(-dt/75),q=1-Math.exp(-dt/170);x+=(tx-x)*k;y+=(ty-y)*k;p+=(tp-p)*q;
   if(reduced.matches)p=0;
   gl.viewport(0,0,canvas.width,canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
   gl.uniform2f(pointerLoc,x,y);gl.uniform1f(pressureLoc,p);gl.drawArrays(gl.TRIANGLES,0,verts.length/2);
   face.classList.add('foil-ready');
   if(!reduced.matches&&Math.abs(x-tx)+Math.abs(y-ty)+Math.abs(p-tp)>.001)schedule();else last=0;
 }
 function resize(){const d=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(face.clientWidth*d);canvas.height=Math.round(face.clientHeight*d);schedule();}
 face.addEventListener('pointermove',e=>{if(reduced.matches)return;const r=face.getBoundingClientRect();tx=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));ty=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));tp=e.buttons?1.3:1;schedule();},{passive:true});
 const release=()=>{tp=0;schedule();};face.addEventListener('pointerleave',release);face.addEventListener('pointercancel',release);face.addEventListener('pointerup',e=>{if(e.pointerType!=='mouse')release();else{tp=1;schedule();}});
 new ResizeObserver(resize).observe(face);
 new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;last=0;tp=p=0;}else schedule();},{rootMargin:'120px'}).observe(face);
 reduced.addEventListener('change',()=>{tp=p=0;schedule();});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else schedule();});
 canvas.addEventListener('webglcontextlost',()=>{ready=false;cancelAnimationFrame(frame);face.classList.remove('foil-ready');});
 art.onload=async()=>{await document.fonts.ready;ready=true;resize();stamp();};art.src=new URL('../../gift-gold.svg',import.meta.url).href;
 return {amount(next){
   amount=next;
   if(!reduced.matches){x=tx=.72;y=ty=.22;p=.85;tp=0;}
   stamp();
 }};
}
