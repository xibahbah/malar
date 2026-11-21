export function createCart(products,storage){
 if(!storage){try{storage=globalThis.localStorage}catch{};if(!storage)storage={getItem(){return null},setItem(){throw Error('Unavailable')}}}
 const key='malar-garland-proto-v1',valid=new Set(products.map(p=>p.id));let items={};
 try{const raw=JSON.parse(storage.getItem(key)||'{}');for(const [id,q] of Object.entries(raw))if(valid.has(id)&&Number.isInteger(q)&&q>0&&q<=20)items[id]=q}catch{}
 const listeners=new Set();let persistent=true;
 const snapshot=()=>({items:{...items},count:Object.values(items).reduce((a,b)=>a+b,0),total:products.reduce((sum,p)=>sum+p.price*(items[p.id]||0),0),persistent});
 function emit(){try{storage.setItem(key,JSON.stringify(items));persistent=true}catch{persistent=false}listeners.forEach(fn=>fn(snapshot()))}
 return {snapshot,subscribe(fn){listeners.add(fn);fn(snapshot());return ()=>listeners.delete(fn)},set(id,q){if(!valid.has(id)||!Number.isFinite(q))return;const n=Math.min(20,Math.max(0,Math.trunc(q)));if(n)items[id]=n;else delete items[id];emit()},add(id){this.set(id,(items[id]||0)+1)},clear(){items={};emit()}};
}
