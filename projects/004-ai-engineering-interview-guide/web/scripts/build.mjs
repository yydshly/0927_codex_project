import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
const source = JSON.parse(await readFile(path.join(root, '../data/source-summary.json'), 'utf8'));
const questions = JSON.parse(await readFile(path.join(root, '../data/questions.json'), 'utf8'));
const notes = JSON.parse(await readFile(path.join(root, '../data/answer-notes.json'), 'utf8'));
const questionTitles = JSON.parse(await readFile(path.join(root, '../data/question-titles-zh.json'), 'utf8'));
if (questions.commit !== source.commit || questions.questions.length !== source.totals.question_entries) throw new Error('Question data does not match the source snapshot.');
if (questions.questions.filter(question => question.answer_links.length).length !== questions.answer_linked_count) throw new Error('Answer-link count mismatch.');
for (const id of Object.keys(notes.notes)) if (!questions.questions.some(question => question.id === id)) throw new Error(`Unknown answer note: ${id}`);
for (const id of Object.keys(notes.notes)) if (!questionTitles[id]) throw new Error(`Missing Chinese question title: ${id}`);
for (const id of Object.keys(questionTitles)) if (!questions.questions.some(question => question.id === id)) throw new Error(`Unknown Chinese question title: ${id}`);
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'content.js', 'app.js']) {
  await copyFile(path.join(root, file), path.join(output, file));
}
await writeFile(path.join(output, 'source-data.js'), `export default ${JSON.stringify(source)};\n`);
await writeFile(path.join(output, 'question-data.js'), `export const catalog = ${JSON.stringify(questions)};\nexport const answerNotes = ${JSON.stringify(notes)};\nexport const questionTitles = ${JSON.stringify(questionTitles)};\n`);
await copyFile(path.join(root, '../notes/UPSTREAM-LICENSE.txt'), path.join(output, 'UPSTREAM-LICENSE.txt'));
console.log(`Built ${output} — ${questions.questions.length} questions, ${questions.answer_linked_count} answer-linked, ${Object.keys(notes.notes).length} site notes.`);
