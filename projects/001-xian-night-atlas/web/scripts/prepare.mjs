import {mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
await mkdir(path.join(root,'vendor'),{recursive:true});
await mkdir(path.join(root,'icons'),{recursive:true});
for(const file of ['three.module.js','three.core.js'])await copyFile(path.join(root,'node_modules/three/build',file),path.join(root,'vendor',file));
await copyFile(path.join(root,'node_modules/three/examples/jsm/controls/OrbitControls.js'),path.join(root,'vendor/OrbitControls.js'));
await copyFile(path.join(root,'node_modules/three/LICENSE'),path.join(root,'vendor/THREE-LICENSE.txt'));
for(const name of ['train-front','search','moon','sun','info','x','play','pause','rotate-ccw','plus','minus','compass','layers','map','clock-3','arrow-up-right','arrow-right','arrow-left-right','chevron-right','chevron-down','route','footprints','navigation','list','check','map-pin','expand','volume-2']){
  await copyFile(path.join(root,'node_modules/lucide-static/icons',`${name}.svg`),path.join(root,'icons',`${name}.svg`));
}
await copyFile(path.join(root,'node_modules/lucide-static/LICENSE'),path.join(root,'icons/LICENSE.txt'));
for(const folder of ['postprocessing','shaders'])await cp(path.join(root,'node_modules/three/examples/jsm',folder),path.join(root,'vendor',folder),{recursive:true});
console.log('Prepared local Three.js and Lucide assets.');
