const fs=require('node:fs');const path=require('node:path');
const project=path.resolve(process.env.QA_PROJECT_ROOT||path.join(__dirname,'..'));
const dbName=process.env.QA_DB_NAME||'hospital_qa_20261019_ayu';
if(!/^hospital_qa_\d{8}_[a-z0-9_]+$/.test(dbName))throw Error('Las pruebas solo admiten bases hospital_qa_FECHA_SUFIJO');
const {Client}=process.env.QA_PG_MODULE?require(process.env.QA_PG_MODULE):(()=>{try{return require('pg')}catch{return require(path.join(project,'Docs/.db-tools/node_modules/pg'))}})();
const config=JSON.parse(fs.readFileSync(path.join(project,'back/appsettings.Development.json'),'utf8').replace(/^\uFEFF/,''));
const pairs={};for(const p of config.ConnectionStrings.DefaultConnection.split(';')){const i=p.indexOf('=');if(i>0)pairs[p.slice(0,i).trim().toLowerCase()]=p.slice(i+1).trim()}
function client(){return new Client({host:pairs.host,port:Number(pairs.port||5432),database:dbName,user:pairs.username||pairs['user id'],password:pairs.password,ssl:{rejectUnauthorized:true},connectionTimeoutMillis:15000,statement_timeout:30000})}
const seed=fs.readFileSync(path.join(project,'back/users/testUserSeeder.cs'),'utf8');
const password=process.env.QA_TEST_PASSWORD||seed.match(/DefaultPassword\s*=\s*"([^"]+)"/)[1];
module.exports={client,project,dbName,password};
