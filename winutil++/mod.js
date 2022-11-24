import { getAllApps } from "./getallapps/mod.js";
import { getWallpaperPath } from "./getdesktopwallpaper/mod.js";

const win32Utils = {
  getAllApps,
  getWallpaperPath
}

import * as regUtil from "./regutil/mod.js";
import * as userUtil from "./userutil/mod.js";

export {
  win32Utils,

  regUtil,
  userUtil
};