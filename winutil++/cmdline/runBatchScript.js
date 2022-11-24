/**
 * Executes shell command
 * @param {string} cmd Command you want to run
 * @returns {object} Status of command
 */
 export function executeShell(cmd) {
  return new Promise(async (resolve) => {
    const p = Deno.run({
      cmd: typeof cmd == "object" ? cmd : cmd.split(" "),
      
      stdout: "piped",
      stderr: "piped",
    });

    const rawCode = await p.status();
    
    const rawOutput = await p.output();
    const rawError = await p.stderrOutput();

    resolve({
      status: rawCode,

      stdout: rawOutput,
      stderr: rawError
    });
  });
}

/**
 * Runs string as batch file
 * @param {string} string String to be executed as batch file
 */
export async function runBatch(string) {
  try {
    Deno.removeSync(Deno.env.get("TEMP") + "\\runBatch.bat");
  } catch (e) {
    //
  }

  Deno.writeTextFileSync(Deno.env.get("TEMP") + "\\runBatch.bat", string);
  await executeShell(Deno.env.get("TEMP") + "\\runBatch.bat");
}

/**
 * Invokes UAC prompt
 * @param {string} cmd Command you want to run as Admin
 * @returns {string} Command with UAC injection
 */
export function invokeUAC(cmd) {
  return `@echo off
    :init
     setlocal DisableDelayedExpansion
     set cmdInvoke=1
     set winSysFolder=System32
     set "batchPath=%~dpnx0"
     rem this works also from cmd shell, other than %~0
     for %%k in (%0) do set batchName=%%~nk
     set "vbsGetPrivileges=%temp%\\OEgetPriv_%batchName%.vbs"
     setlocal EnableDelayedExpansion
    
    :checkPrivileges
      NET FILE 1>NUL 2>NUL
      if '%errorlevel%' == '0' ( goto gotPrivileges ) else ( goto getPrivileges )
    
    :getPrivileges
      if '%1'=='ELEV' (echo ELEV & shift /1 & goto gotPrivileges)
    
      ECHO Set UAC = CreateObject^("Shell.Application"^) > "%vbsGetPrivileges%"
      ECHO args = "ELEV " >> "%vbsGetPrivileges%"
      ECHO For Each strArg in WScript.Arguments >> "%vbsGetPrivileges%"
      ECHO args = args ^& strArg ^& " "  >> "%vbsGetPrivileges%"
      ECHO Next >> "%vbsGetPrivileges%"
      
      if '%cmdInvoke%'=='1' goto InvokeCmd 
    
      ECHO UAC.ShellExecute "!batchPath!", args, "", "runas", 1 >> "%vbsGetPrivileges%"
      goto ExecElevation
    
    :InvokeCmd
      ECHO args = "/c """ + "!batchPath!" + """ " + args >> "%vbsGetPrivileges%"
      ECHO UAC.ShellExecute "%SystemRoot%\\%winSysFolder%\\cmd.exe", args, "", "runas", 1 >> "%vbsGetPrivileges%"
    
    :ExecElevation
     "%SystemRoot%\\%winSysFolder%\\WScript.exe" "%vbsGetPrivileges%" %*
     exit /B
    
    :gotPrivileges
     setlocal & cd /d %~dp0
     if '%1'=='ELEV' (del "%vbsGetPrivileges%" 1>nul 2>nul  &  shift /1)
    
    ${cmd}`;
}