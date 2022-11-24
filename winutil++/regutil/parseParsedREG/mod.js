export function parseRegJSON(data, enableWarns) {
  const newObj = {};

  for (const name of Object.keys(data)) {
    const regData = data[name];

    if (typeof regData != "object") continue;
    if (!regData.type) continue;

    if (!regData.value) {
      newObj[name] = undefined;
    }

    switch (regData.type) {
      case "REG_SZ": {
        newObj[name] = regData.value;
        continue;
      }

      case "REG_EXPAND_SZ": {
        newObj[name] = regData.value;
        continue;
      }

      case "REG_DWORD": {
        if (enableWarns) console.log("winutil++/regUtilParse <internal>: I can't parse DWORDS well! Jankily parsing them, instead...");
        newObj[name] = Number(regData.value);

        continue;
      }

      default: {
        if (enableWarns)
          console.log("winutil++/regUtilParse <internal>: Unknown item! Name: %s, Type: %s, with value: %s.", name, regData.type, regData.value);

        newObj[name] = null;
        continue;
      }
    }
  }

  return newObj;
}