// Art-directed chapter rates. Captions share each card's travel and settling.
export const layers = [
 {speed:1.18,settle:85,pitch:3.2},
 {speed:1.32,settle:105,pitch:3.8},
 {speed:1.24,settle:95,pitch:3.4},
 {speed:1.38,settle:115,pitch:4},
 {speed:1.21,settle:90,pitch:3},
 {speed:1.29,settle:100,pitch:3.5}
];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
export function scrollPose(layer,scroll,center,viewport,height){
 const distance=clamp(scroll+viewport*.52-center,-viewport-height,viewport+height);
 const phase=clamp(distance/(viewport*.85),-1,1);
 const travel=-distance*(layer.speed-1);
 // A maximum 14px difference, including at fast scroll/reversal.
 return {travel,textTravel:travel+phase*14,pitch:-phase*layer.pitch,phase};
}
export const follow=(from,to,dt,settle)=>from+(to-from)*(1-Math.exp(-dt/settle));
export function endingPose(scroll,top,viewport,elapsed){
 const dark=smooth((scroll-top+viewport*.6)/(viewport*1.45));
 const gate=smooth((scroll-top-viewport*.35)/(viewport*.5));
 return {dark,gate,copy:gate*smooth((elapsed-180)/950),
  flowers:[0,1,2].map(i=>gate*smooth((elapsed-1450-i*350)/3200)),
  note:gate*smooth((elapsed-2600)/1200)};
}
