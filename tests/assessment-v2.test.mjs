import {test} from 'node:test';
import assert from 'node:assert/strict';
import {languages} from '../public/curriculum.js';
import {assessmentQuestions,gradeAssessment,assessmentCounts} from '../public/assessment.js';
import {learningPlan} from '../public/remediation.js';
test('v2 samples each dimension three times in all seven languages',()=>{
 for(const l of languages){const qs=assessmentQuestions(l);assert.equal(qs.length,18);assert.equal(new Set(qs.map(q=>q.id)).size,18);for(let d=0;d<6;d++)assert.equal(qs.filter(q=>q.dimension===d).length,3);for(const q of qs){assert.equal(new Set(q.options).size,4);assert.equal(q.options[3],'不知道');assert.ok(q.answer>=0&&q.answer<3);}}
});
test('partial answers aggregate by dimension rather than question position',()=>{
 const l=languages[0],qs=assessmentQuestions(l),answers=qs.map(q=>q.answer);answers[1]=3;answers[2]=3;
 const r=gradeAssessment(l,answers);assert.equal(r.correct,16);assert.deepEqual(r.counts[0],{correct:1,total:3});assert.deepEqual(r.scores,[33,100,100,100,100,100]);
 assert.deepEqual(gradeAssessment(l,Array(18).fill(3)).scores,Array(6).fill(0));
 const plan=learningPlan(l.id,[{...r,language:l.id}],[]);assert.equal(plan.find(p=>p.id==='sum').status,'建议补练');
});
test('v1 records keep their denominator and scoring',()=>{
 const l=languages[0];const r=gradeAssessment(l,l.questions.map(q=>q.answer),'foundation-v1');assert.equal(r.total,6);assert.deepEqual(r.counts[0],{correct:1,total:1});
 assert.deepEqual(assessmentCounts({scores:[0,100,0,100,0,100]})[1],{correct:1,total:1});
 assert.throws(()=>assessmentQuestions(l,'unknown'),/INVALID_ASSESSMENT_VERSION/);
});
