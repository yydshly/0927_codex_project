import {mkdir, copyFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
const vendor = path.join(output, 'vendor');
await rm(output, {recursive: true, force: true});
await mkdir(vendor, {recursive: true});
for (const name of ['index.html', 'styles.css', 'app.js', 'planner.mjs', 'favicon.svg']) {
  await copyFile(path.join(root, name), path.join(output, name));
}
await copyFile(path.join(root, '..', 'assets', 'understanding-map.svg'), path.join(output, 'understanding-map.svg'));
const three = path.join(root, 'node_modules', 'three');
for (const name of ['three.module.js', 'three.core.js']) {
  await copyFile(path.join(three, 'build', name), path.join(vendor, name));
}
await copyFile(path.join(three, 'examples/jsm/controls/OrbitControls.js'), path.join(vendor, 'OrbitControls.js'));
await copyFile(path.join(three, 'examples/jsm/utils/BufferGeometryUtils.js'), path.join(vendor, 'BufferGeometryUtils.js'));
await copyFile(path.join(three, 'LICENSE'), path.join(vendor, 'THREE-LICENSE.txt'));
console.log('Built independent static demonstration at web/dist/');
