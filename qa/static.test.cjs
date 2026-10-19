// Controles estáticos. No son solicitudes HTTP ni pruebas de explotación.
const fs=require('node:fs'); const path=require('node:path'); const test=require('node:test'); const assert=require('node:assert/strict');
const {root}=require('./loader.cjs'); const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const users=read('back/users/userController.cs');
test('S01 registro público no asigna administrador',()=>{const body=users.slice(users.indexOf('register(clientCreationDto'),users.indexOf('protected override async'));assert.ok(!/new List<string>\s*\{[^}]*"ADMINISTRATOR"/.test(body),'El método register asigna ADMINISTRATOR');});
test('S02 recuperación devuelve al no encontrar usuario',()=>{const body=users.slice(users.indexOf('forgotPassword([FromBody]'),users.indexOf('[HttpPost("resetPassword")]'));assert.match(body,/if\s*\(user == null\)\s*return NoContent\(\)/,'NoContent sin return deja continuar con usuario null');});
test('S03 actualización comprueba null antes de acceder a usuario',()=>{const body=users.slice(users.indexOf('public override async Task<ActionResult> put'),users.indexOf('[HttpGet("{userName}")]'));assert.ok(body.indexOf('if (userDB == null)') < body.indexOf('userDB.deleteAt'), 'Se accede a userDB antes de validar null');});
test('S04 modelo configura índice único de DPI',()=>assert.match(read('back/context/DBProyContext.cs'),/HasIndex\(x => x.dpi\)\s*\.IsUnique\(\)/));
test('S05 reportes declaran rol administrador',()=>assert.match(read('back/Reports/ReportsController.cs'),/\[Authorize[^\]]*Roles = "ADMINISTRATOR"/));
test('S06 citas filtran paciente según claim',()=>assert.match(read('back/Appointment/citasController.cs'),/query = query.Where\(x => x.patientId == patientId\)/));
