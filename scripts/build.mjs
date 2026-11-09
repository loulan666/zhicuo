import {build} from 'esbuild';
await build({entryPoints:['src/Platform.tsx'],bundle:true,outfile:'public/platform.js',format:'esm',minify:true,sourcemap:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'}});
console.log('React application built.');
