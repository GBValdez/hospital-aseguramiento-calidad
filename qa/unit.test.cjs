const test = require('node:test');
const assert = require('node:assert/strict');
const { load, dep } = require('./loader.cjs');
const utils = load('front/src/app/utils/utils.ts');
const { convertMomentToDate } = load('front/src/app/utils/formatDate.ts');
const { AuthGuard } = load('front/src/app/utils/modules/auth/guards/auth.guard.ts');
const { LocalStorageService } = load('front/src/app/utils/local-storage.service.ts');
const { AuthService } = load('front/src/app/utils/modules/auth/services/auth.service.ts');
const moment = dep('moment');
const empty = utils.formIsEmptyValidator();
for (const [id, value, expected] of [
  ['U01', {a:null,b:undefined}, {formNotEmpty:true}],
  ['U02', {a:'   '}, {formNotEmpty:true}],
  ['U03', {a:[]}, {formNotEmpty:true}],
  ['U04', {a:0}, null], ['U05', {a:false}, null], ['U06', {a:'consulta'}, null]
]) test(`${id} validación de formulario ${JSON.stringify(value)}`, () => assert.deepEqual(empty({value}), expected));
test('U07 filtros omiten vacíos y conservan cero y false', () => assert.deepEqual(utils.fixedQueryParams({a:'', b:null,c:undefined,page:0,all:false}), {page:0,all:false}));
test('U08 filtros serializan listas', () => assert.deepEqual(utils.fixedQueryParams({ids:[1,2]}), {ids:'1,2'}));
test('U09 filtros convierten Moment a ISO', () => assert.equal(utils.fixedQueryParams({date:moment.utc('2026-10-19')}).date, '2026-10-19T00:00:00.000Z'));
test('U10 conversión conserva Date nativo', () => { const result=convertMomentToDate({date:new Date('2026-10-19T00:00:00Z')}); assert.ok(result.date instanceof Date, 'Date se pierde al recorrer sus propiedades'); });
test('U11 filtros serializan Date nativo a ISO', () => assert.equal(utils.fixedQueryParams({date:new Date('2026-10-19T00:00:00Z')}).date, '2026-10-19T00:00:00.000Z'));
test('U12 conversión admite null y primitivos', () => {assert.equal(convertMomentToDate(null),null);assert.equal(convertMomentToDate(7),7)});
function guard(auth, roles, mode, allowed) {
  const calls=[]; const g=new AuthGuard({navigate:p=>calls.push(p)}, {hasAuth:()=>auth,getAuth:()=>({roles:['userNormal']})});
  assert.equal(g.canActivate({data:{isProtect:mode,roles}}, {}),allowed);
  if (!allowed) assert.equal(calls.length,1);
}
test('U13 ruta pública accesible sin sesión',()=>guard(false,undefined,25,true));
test('U14 ruta protegida rechaza anónimo',()=>guard(false,undefined,20,false));
test('U15 login admite anónimo',()=>guard(false,undefined,30,true));
test('U16 login redirige sesión activa',()=>guard(true,undefined,30,false));
test('U17 ruta admite rol autorizado',()=>guard(true,['userNormal'],20,true));
test('U18 ruta rechaza rol distinto',()=>guard(true,['ADMINISTRATOR'],20,false));
function storage() {
  const map=new Map(); global.localStorage={getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)};
  return new LocalStorageService();
}
test('U19 almacenamiento conserva datos sintéticos',()=>{const s=storage();s.setItem('auth',{roles:['userNormal']},1);assert.deepEqual(s.getItem('auth'),{roles:['userNormal']})});
test('U20 clave inexistente devuelve null',()=>assert.equal(storage().getItem('missing'),null));
test('U21 eliminar sesión elimina su valor',()=>{const s=storage();s.setItem('auth',{roles:[]},1);s.removeItem('auth');assert.equal(s.getItem('auth'),null)});
test('U22 lectura descarta sesión vencida',()=>{const s=storage();s.setItem('auth',{roles:[]},-1);assert.equal(s.getItem('auth'),null)});
test('U23 existencia rechaza sesión vencida',()=>{const s=storage();s.setItem('auth',{roles:[]},-1);assert.equal(s.hasItem('auth'),false)});
test('U24 autenticación rechaza sesión vencida',()=>{const s=storage();s.setItem('auth',{roles:['userNormal']},-1);const a=new AuthService('browser',{navigate:()=>{}},s);assert.equal(a.hasAuth(),false)});
test('U25 roles rechazan usuario sin sesión',()=>{const a=new AuthService('browser',{},storage());assert.equal(a.hasRoles(['ADMINISTRATOR']),false)});
test('U26 roles aceptan coincidencia y rechazan otros',()=>{const s=storage();const a=new AuthService('browser',{},s);a.setAuth({roles:['userNormal']});assert.equal(a.hasRoles(['userNormal']),true);assert.equal(a.hasRoles(['ADMINISTRATOR']),false)});
test('U27 logout elimina sesión y vuelve a login',()=>{const s=storage();const calls=[];const a=new AuthService('browser',{navigate:p=>calls.push(p)},s);a.setAuth({roles:['userNormal']});a.logout();assert.equal(a.getAuth(),null);assert.deepEqual(calls,[['/login']])});
