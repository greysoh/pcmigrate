import { regUtil } from '../mod.js';
import { parseRegJSON } from '../regutil/mod.js';

export async function getAllApps() {
  const list = [];
  
  const x64Apps = await regUtil.query('HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall')
  const x86Apps = await regUtil.query('HKLM\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall');

  const userX64Apps = await regUtil.query('HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall')
  const userX86Apps = await regUtil.query('HKCU\\SOFTWARE\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall');

  const apps = {...x64Apps, ...userX64Apps, ...x86Apps, ...userX86Apps};

  for (const appName of Object.keys(apps)) {
    const appEntry = await regUtil.query(appName);
    const regParsed = parseRegJSON(appEntry);

    list.push({
      type: appName.startsWith("HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft") || 
            appName.startsWith("HKEY_CURRENT_USER\\SOFTWARE\\Microsoft")   ? "x64" : "x86",
      
      name: regParsed.DisplayName,
      ver: regParsed.DisplayVersion,
      dev: regParsed.Publisher,

      rawData: regParsed
    });
  }

  return list;
}