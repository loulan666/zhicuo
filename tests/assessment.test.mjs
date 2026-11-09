import {test} from 'node:test';
import assert from 'node:assert/strict';
import {languages,assess} from '../public/curriculum.js';
test('each language has six valid questions with distinct options',()=>{
 assert.equal(languages.length,7);
 for(const l of languages){assert.equal(l.questions.length,6);for(const q of l.questions){assert.equal(new Set(q.options).size,4);assert.ok(q.answer>=0&&q.answer<4);}}
});
test('unknown answers never imply mastery',()=>{for(const l of languages){const r=assess(l,Array(6).fill(3));assert.equal(r.correct,0);assert.deepEqual(r.scores,Array(6).fill(0));}});
test('correct and partial answers produce evidence based scores',()=>{for(const l of languages){const answers=l.questions.map(q=>q.answer);assert.equal(assess(l,answers).correct,6);answers[2]=3;assert.equal(assess(l,answers).correct,5);assert.equal(assess(l,answers).scores[2],0);}});
