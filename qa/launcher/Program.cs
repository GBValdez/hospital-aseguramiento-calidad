using System.Text.Json;
using System.Text.RegularExpressions;
using Npgsql;

var original = Environment.GetEnvironmentVariable("QA_PROJECT_ROOT") ?? throw new Exception("Definir QA_PROJECT_ROOT");
var work = Environment.GetEnvironmentVariable("QA_WORK_DIR") ?? throw new Exception("Definir QA_WORK_DIR fuera del repositorio");
var database = Environment.GetEnvironmentVariable("QA_DB_NAME") ?? "hospital_qa_20261019_ayu";
if (!Regex.IsMatch(database, "^hospital_qa_[0-9]{8}_[a-z0-9_]+$")) throw new Exception("Solo bases hospital_qa_FECHA_SUFIJO");
using var config = JsonDocument.Parse(await File.ReadAllTextAsync(Path.Combine(original, "back", "appsettings.Development.json")));
var cs = new NpgsqlConnectionStringBuilder(config.RootElement.GetProperty("ConnectionStrings").GetProperty("DefaultConnection").GetString()) { Timeout=15, CommandTimeout=30, SslMode=SslMode.VerifyFull };
var mode=args.FirstOrDefault();
if(mode=="create") {
    await using var c=new NpgsqlConnection(cs.ConnectionString); await c.OpenAsync();
    await using var cmd=new NpgsqlCommand("CREATE DATABASE "+new NpgsqlCommandBuilder().QuoteIdentifier(database),c);
    await cmd.ExecuteNonQueryAsync(); Console.WriteLine("QA_DATABASE_CREATED "+database); return;
}
if(mode!="launch") throw new Exception("Usar create para una base nueva o launch para iniciar QA");
cs.Database=database;
await using(var check=new NpgsqlConnection(cs.ConnectionString)) {
    await check.OpenAsync(); await using var cmd=new NpgsqlCommand("select current_database()",check);
    if((string)(await cmd.ExecuteScalarAsync())! != database) throw new Exception("Database guard");
}
Directory.CreateDirectory(work);
var dotnet=Environment.GetEnvironmentVariable("QA_DOTNET") ?? "dotnet";
var start=new System.Diagnostics.ProcessStartInfo(dotnet) { WorkingDirectory=Path.Combine(original,"back"),UseShellExecute=false,WindowStyle=System.Diagnostics.ProcessWindowStyle.Hidden };
start.ArgumentList.Add(Path.Combine(original,"back","bin","Debug","net8.0","fletesProyect.dll"));
start.Environment["ASPNETCORE_ENVIRONMENT"]="QA";
start.Environment["ASPNETCORE_URLS"]="http://127.0.0.1:5279";
start.Environment["ConnectionStrings__DefaultConnection"]=cs.ConnectionString;
var key=Convert.ToHexString(System.Security.Cryptography.RandomNumberGenerator.GetBytes(32));
start.Environment["keyJwt"]=key;await File.WriteAllTextAsync(Path.Combine(work,"qa-jwt.key"),key);
start.Environment["keyResetPasswordKey"]="hospital-qa-aislado";
start.Environment["FrontUrl"]="http://127.0.0.1:4205";
start.Environment["Email__DeliveryMode"]="Pickup";
start.Environment["Email__PickupDirectory"]=Path.Combine(work,"qa-mail");
start.Environment["Email__UserName"]="qa@example.test";
start.Environment["DataProtection__KeysDirectory"]=Path.Combine(work,"qa-keys");
start.Environment["Logging__LogLevel__Default"]="Warning";
start.Environment["Logging__LogLevel__Microsoft.Hosting.Lifetime"]="Information";
using var process=System.Diagnostics.Process.Start(start)!;
Console.WriteLine("QA_API_STARTED database="+database);await process.WaitForExitAsync();Environment.ExitCode=process.ExitCode;
