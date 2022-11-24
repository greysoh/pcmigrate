const validReg = /\w+(?:\\[^\\]*)+$/;

export function parseReg(str) {
  const regSplit = str.split("    ");
  
  if (regSplit.length == 1) {
    if (validReg.test(regSplit[0])) {
      return { key: regSplit[0] };
    }

    return null;
  }
  return { key: regSplit[1], type: regSplit[2], value: regSplit[3] };
}