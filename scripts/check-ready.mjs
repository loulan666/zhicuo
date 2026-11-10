import {runtimeStatus} from '../lib/sandbox.mjs';
const status=await runtimeStatus();
console.log('Docker engine:',status.ready?'ready':'not ready');
for(const language of status.languages)console.log(language.id+': '+(language.ready?'image ready':'not ready'));
console.log('AI model:',process.env.AI_MODEL?'configured':'missing');
console.log('AI key:',process.env.AI_API_KEY?'configured (hidden)':'missing');
process.exitCode=status.ready&&status.languages.every(l=>l.ready)&&process.env.AI_API_KEY?0:1;
