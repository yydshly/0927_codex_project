import test from 'node:test';
import assert from 'node:assert/strict';
import {labs,defaults} from './catalog.mjs';
import {runChecks} from './checks.mjs';
import {Shallow} from './models.mjs';
for (const [id,lab] of Object.entries(labs)) {
  test(`${lab.name}: default and extreme parameter invariants`,()=>{
    const variants=[defaults(id),Object.fromEntries(lab.controls.map(c=>[c.key,c.options?c.options[0][0]:c.min])),Object.fromEntries(lab.controls.map(c=>[c.key,c.options?c.options.at(-1)[0]:c.max]))];
    for(const p of variants)for(const check of runChecks(id,p))assert.ok(check.pass,`${JSON.stringify(p)} ${check.name}: ${check.value} expected ${check.expected} ± ${check.tolerance}`);
  });
}
test('Shallow model remains finite and balances water after 60 simulated seconds',()=>{
  for(const p of [defaults('flow'),{...defaults('flow'),slope:.08,obstacle:1.2,friction:0,inflow:.15}]){
    const m=new Shallow(p);for(let i=0;i<1800;i++)m.step(1/30);
    assert.ok([...m.field,...m.u,...m.v].every(Number.isFinite));
    assert.ok(Math.abs(m.metrics()[1])<1e-7);
  }
});
