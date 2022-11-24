import { regUtil } from '../mod.js';
import { parseRegJSON } from '../regutil/mod.js';

export async function getWallpaperPath() {
  const desktopData = await regUtil.query('HKEY_CURRENT_USER\\Control Panel\\Desktop');
  const parsedData = parseRegJSON(desktopData);

  return parsedData.WallPaper;
}