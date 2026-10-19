const fs=require('node:fs');const path=require('node:path');const s=JSON.parse(fs.readFileSync(process.env.QA_SESSION_FILE,'utf8'));
process.env.QA_LOAD_URL=s.base+'/api/reportes/resumen';process.env.QA_TEST_TOKEN=s.adminToken;
require(path.resolve(process.env.QA_LOAD_SCRIPT||path.join(__dirname,'load.cjs')));
