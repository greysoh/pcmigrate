import { executeShell } from "../../cmdline/runBatchScript.js";

/**
 * Exports data from the registry, using registry backups instead of hives.
 * DO NOT PUT USER INPUT THROUGH THIS. THIS IS A COMMAND LINE WRAPPER.
 * @param {string} key Key path
 * @param {string} path Path to write backup to
 */
export async function exportReg(key, path) {
  const cmdResult = await executeShell(["cmd", "/c", "reg", "export", key, path, "/y"]);
  if (cmdResult.status.code == 1) {
    console.log("ERROR!\n\n" + new TextDecoder().decode(cmdResult.stderr));
    throw new Error("Regedit returned a status code of 1")
  };
}