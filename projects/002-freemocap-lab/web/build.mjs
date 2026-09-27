import {mkdir,copyFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
const root=new URL('./',import.meta.url),dist=new URL('./dist/',root);
await mkdir(dist,{recursive:true});
for(const file of ['index.html','styles.css']) await copyFile(new URL(file,root),new URL(file,dist));
await cp(new URL('src/',root),new URL('src/',dist),{recursive:true});
await cp(new URL('samples/',root),new URL('samples/',dist),{recursive:true});
await cp(new URL('assets/',root),new URL('assets/',dist),{recursive:true});
console.log(`Static output: ${fileURLToPath(dist)}`);
