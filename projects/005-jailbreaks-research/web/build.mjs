import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = dirname(fileURLToPath(import.meta.url));
const output = join(root, 'dist');
const source = JSON.parse(await readFile(join(root, '../data/source-index.json'), 'utf8'));
const keys = ['repository', 'revision', 'review_date', 'files_total', 'substantive_prompt_or_config_files', 'category_counts', 'files'];
const publicData = Object.fromEntries(keys.map(key => [key, source[key]]));
await writeFile(join(root, 'source-data.js'), 'window.RESEARCH_SOURCE = ' + JSON.stringify(publicData, null, 2) + ';\n', 'utf8');
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'source-data.js']) {
  await copyFile(join(root, name), join(output, name));
}
await mkdir(join(output, 'assets'), { recursive: true });
for (const name of ['jailbreaks-overview.png', 'jailbreaks-overview.svg']) {
  await copyFile(join(root, '../assets', name), join(output, 'assets', name));
}
console.log('Built static guide: dist/index.html');
