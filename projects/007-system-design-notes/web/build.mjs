import { mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, 'dist');
mkdirSync(out, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js', 'favicon.svg']) {
  copyFileSync(join(here, name), join(out, name));
}
copyFileSync(join(here, '..', 'assets', 'goal-capability-map.svg'), join(out, 'goal-capability-map.svg'));
console.log(`Built system-design-notes guide: ${resolve(out)}`);
