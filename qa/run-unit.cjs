const {run}=require('node:test'); const fs=require('node:fs');const path=require('node:path');
const dir=path.resolve(process.env.QA_EVIDENCE_DIR||path.join(__dirname,'evidencias','nueva-ejecucion'));fs.mkdirSync(dir,{recursive:true});
const results=[];const stream=run({files:['unit.test.cjs','static.test.cjs'].map(x=>path.join(__dirname,x)),concurrency:1});
stream.on('test:pass',d=>{if (/^[US]\d\d\b/.test(d.name)) {results.push({id:d.name.slice(0,3),name:d.name,status:'APROBADA',duration_ms:d.details.duration_ms});console.log('APROBADA '+d.name)}});
stream.on('test:fail',d=>{if (/^[US]\d\d\b/.test(d.name)) {results.push({id:d.name.slice(0,3),name:d.name,status:'FALLIDA',duration_ms:d.details.duration_ms,error:d.details.error?.cause?.message||d.details.error?.message});console.log('FALLIDA  '+d.name)}});
stream.on('error',e=>{console.error(e);process.exitCode=2});
stream.on('end',()=>{const summary={executed_at:new Date().toISOString(),scope:'Lógica TypeScript con dobles de Angular y revisión estática C#; no prueba API/DB',total:results.length,passed:results.filter(x=>x.status==='APROBADA').length,failed:results.filter(x=>x.status==='FALLIDA').length,results};fs.writeFileSync(path.join(dir,'unit-static.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({total:summary.total,passed:summary.passed,failed:summary.failed}));if(summary.failed)process.exitCode=1;if(summary.total!==33)process.exitCode=2});
stream.resume();
