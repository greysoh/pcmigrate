import { invokeUAC, runBatch } from "../../cmdline/runBatchScript.js";

/**
 * Runs regedit commands
 * @param {array} array Array of registry commands you want to run.
 * @example [{ "key": "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer", "path": "BackgroundType", "value": "1", "type": "REG_DWORD" }]
 * @returns {JSON} Status of command
 */
export async function set(...array) {
  let batchScript = invokeUAC(`rem Regedit commands\n\n`);

  for (let i of array) {
    function fixString(value) {
      if (typeof value === "string") {
        return `"${value}"`;
      }

      return value;
    }

    if (i.path == null && i.value == null && i.type == null) {
      batchScript += `reg add "${i.key}" /f\n`;
    } else if (i.path == null && i.value == null && i.type == "DELETE") {
      batchScript += `reg delete "${i.key}" /f\n`;
    } else if (i.value == null && i.type == "DELETE") {
      batchScript += `reg delete "${i.key}" /v "${i.path}" /f\n`;
    } else {
      batchScript += `reg add "${i.key}" /v "${i.path}" /t ${
        i.type
      } /d ${fixString(i.value)} /f\n`;
    }
  }

  const commandOutput = await runBatch(batchScript);
  return commandOutput;
}