import { executeShell } from "../../cmdline/runBatchScript.js";
import { parseReg } from "./parseReg.js";

const validReg = /\w+(?:\\[^\\]*)+$/;

function resolveRegName(reg) {
  if (reg.startsWith("HKCU")) return reg.replace("HKCU", "HKEY_CURRENT_USER");
  if (reg.startsWith("HKLM")) return reg.replace("HKLM", "HKEY_LOCAL_MACHINE");
  if (reg.startsWith("HKCR")) return reg.replace("HKCR", "HKEY_CLASSES_ROOT");

  return reg;
}

/**
 * Queries for data in the registry.
 * If you're looking to get a value from the registry, use get instead.
 * DO NOT PUT USER INPUT THROUGH THIS. THIS IS A COMMAND LINE WRAPPER.
 * @param {string} rawKey Registry key
 * @returns {object} JSON Object with all data inside it
 */
export async function query(rawKey) {
  if (!validReg.test(rawKey)) throw new Error(`"${rawKey}" is not a valid registry key!`);
  
  const key = resolveRegName(rawKey);
  
  const cmdResult = await executeShell(["cmd", "/c", "reg", "query", key]);
  const text = new TextDecoder().decode(cmdResult.stdout);

  const objData = {};
  let currentItem;

  for (const i of text.split("\r\n")) {
    const regFind = parseReg(i);

    if (!regFind) continue;

    if (validReg.test(regFind.key)) {
      if (!regFind.value) {
        objData[regFind.key] = {};
        currentItem = regFind.key;

        continue;
      }
    }

    if (!currentItem || !regFind.value) continue;
    objData[currentItem][regFind.key] = { type: regFind.type, value: regFind.value };
  }

  if (!objData[key]) {
    return objData;
  } else {
    const finalObj = objData[key];

    for (const i of Object.keys(objData)) {
      if (i == key) continue;

      finalObj[i] == objData[i];
    }
  
    return finalObj;
  }
}