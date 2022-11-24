import { executeShell } from "../../cmdline/runBatchScript.js";

/**
 * Saves data from the registry, using hives. 
 * You will probably want exportReg instead.
 * DO NOT PUT USER INPUT THROUGH THIS. THIS IS A COMMAND LINE WRAPPER.
 * @param {string} key Key path
 * @param {string} path Path to write backup to
 */
export async function save(key, path) {
  const cmdResult = await executeShell(["cmd", "/c", "reg", "save", key, path, "/y"]);
  if (cmdResult.status.code == 1) {
    console.log("ERROR!\n\n" + new TextDecoder().decode(cmdResult.stderr));
    throw new Error("Regedit returned a status code of 1")
  };
}