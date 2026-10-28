import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
const media=JSON.parse(await readFile(new URL('../src/product-media.json',import.meta.url),'utf8')),layout={};
for(const p of [...Object.values(media.products).flat(),...media.collection]){
 const file=new URL('../public/'+p.path,import.meta.url),image=sharp(await readFile(file));
 const meta=await image.metadata(),raw=await image.resize(32,32,{fit:'fill'}).flatten({background:'#f7f5ef'}).removeAlpha().raw().toBuffer();
 const samples=[0,31,31*32,32*32-1].map(n=>[...raw.subarray(n*3,n*3+3)]);
 const rgb=[0,1,2].map(c=>Math.round(samples.reduce((n,s)=>n+s[c],0)/samples.length));
 layout[p.path]={background:'#'+rgb.map(c=>c.toString(16).padStart(2,'0')).join(''),brightness:(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)>145?'light':'dark',width:meta.width,height:meta.height};
}
await writeFile(new URL('../src/photo-layout.json',import.meta.url),JSON.stringify(layout,null,2)+'\n');console.log(`Tła ${Object.keys(layout).length} fotografii zmierzone bez modyfikowania obrazów.`);
