import os from "https://deno.land/x/dos@v0.11.0/mod.ts";
import { executeShell } from "../cmdline/runBatchScript.js";

export async function isRunningAsAdmin() {
  if (os.platform() != "windows") return false;
  
  try {
    const test = await executeShell("fltmc");
    if (test.status.code != 0) return false;

    return true;
  } catch (e) {
    return false;
  }
}