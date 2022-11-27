import { exists } from "https://deno.land/std@0.165.0/fs/exists.ts";
import { copy } from "https://deno.land/std@0.165.0/fs/copy.ts";

import { Confirm, Input } from "https://deno.land/x/cliffy@v0.25.4/mod.ts";
import axiod from "https://deno.land/x/axiod/mod.ts";

import { regUtil, userUtil, win32Utils } from "./winutil++/mod.js";
import { executeShell, runBatch } from "./winutil++/cmdline/runBatchScript.js";

const home = Deno.env.get("USERPROFILE");

if (!await userUtil.isRunningAsAdmin()) {
  console.error("You are not running as administrator!")
  console.error("Restart this program as an administrator to backup your system.\n");

  console.error("That, or you're running Linux. Install a real operating system, stupid furry");
  
  Deno.exit(1);
}

const backupOpts = {
  backupApps: true,
  backupShell: true,
  backupFolders: ["$user\\Desktop", "$user\\Documents", "$user\\Videos", "$user\\Pictures"],
  backupFiles: []
}

const backupData = {
  libkStandardVer: 0,

  apps: {
    winget: [],
    driversMisc: [],
    missing: []
  },

  desktopInfo: {
    wallpaperPath: "",

    taskbarBackupPath: "ExplorerBackups\\taskbar.reg",

    accentBackupPath: "ExplorerBackups\\accent.reg",
    colorsBackupPath: "ExplorerBackups\\colors.reg",

    advancedBackupPath: "ExplorerBackups\\adv.reg",
  },

  copyData: {
    files: [],
    folders: []
  }
};

const backupPath = Deno.env.get("TEMP") + "\\backupData";

console.log("PCMigrate Internal Build v1\n");

if (!await Confirm.prompt("Would you like to use the default backup options?")) {
  backupOpts.backupApps = await Confirm.prompt("Would you like to backup your applications?");
  backupOpts.backupShell = await Confirm.prompt("Would you like to backup your desktop preferences?");

  if (!await Confirm.prompt("Would you like to backup the default folders?")) {
    backupOpts.backupFolders = [];
  }
  
  console.log("   Here's what folders we're going to backup right now:");

  for (const folder of backupOpts.backupFolders) {
    console.log(`    - ${folder.replace("$user", home)}`);
  }

  while (await Confirm.prompt("Would you like to add more files or folders to backup?")) {
    const item = await Input.prompt("Please drag a file (or folder) to me:");
    const isFolder = await Confirm.prompt("This is a folder, right? If it's a file, please answer no.");

    if (isFolder) {
      backupOpts.backupFolders.push(item.replace(home, "$user"));
    } else {
      backupOpts.backupFiles.push(item.replace(home, "$user"));
    }
  }
}

if (await exists(backupPath)) {
  console.log("Stage 0: Removing old backup data...");
  await Deno.remove(backupPath, { recursive: true });
}

await Deno.mkdir(backupPath);

if (backupOpts.backupApps) {
  console.log("Stage 1: Getting all apps installed...");
  const apps = await win32Utils.getAllApps();

  console.log("Stage 2: Finding winget versions of apps...");

  for await (const i of apps) {
    if (!i.name) continue;
   
    if (i.name == "Branding64") continue; // I don't really know what this is -- probably windows branding config stuff
  
    if (i.name.startsWith("Windows")) continue; // Exclude core windows drivers
    if (i.name.startsWith("Microsoft Windows")) continue; // Exclude core windows drivers
    if (i.name.startsWith("Vulkan")) continue; // Exclude graphics driver components
  
    await new Promise(i => setTimeout(i, 200));
  
    if (i.name.startsWith("AMD")) {
      if (!backupData.apps.driversMisc.indexOf("AMD_GPU")) continue;
  
      console.log(" ✅ Found AMD drivers.");
  
      backupData.apps.driversMisc.push("AMD_GPU");
      continue;
    }
  
    console.log(" - Searching for %s...", i.name);
  
    const reqParams = { ensureContains: true, name: i.name, sample: 10 };
    if (i.dev) reqParams.publisher = i.dev;
  
    const req = await axiod.get("https://api.winget.run/v2/packages", { params: reqParams });
  
    let successStatus;
    for (const packageData of req.data.Packages) {
      if (i.name.startsWith(packageData.Latest.Name.replace("™", "")) 
       || i.name.toLowerCase().startsWith(packageData.Latest.Name.toLowerCase())) {
        console.log("   ✅ Found match, with id of %s.", packageData.Id);
        successStatus = true;
  
        if (backupData.apps.winget.indexOf(packageData.Id) == -1) backupData.apps.winget.push(packageData.Id);
  
        break;
      }
    }
  
    if (!successStatus) {
      console.log("   ❌ Failed to find any packages for %s.", i.name);
      backupData.apps.missing.push(i);
    }
  }
}

if (backupOpts.backupShell) {
  console.log("Stage 3: Copying basic desktop data...");

  const backgroundPath = await win32Utils.getWallpaperPath();
  const newWallpaperPath = backupPath + "\\wallpaper." + backgroundPath.split(".")[1];

  await Deno.copyFile(backgroundPath, newWallpaperPath.replace(backupPath, ""));

  backupData.desktopInfo.wallpaperPath = "\\wallpaper." + backgroundPath.split(".")[1];

  await Deno.mkdir(backupPath + "\\ExplorerBackups");

  await regUtil.exportReg("HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StuckRects3", backupPath + "\\" + backupData.desktopInfo.taskbarBackupPath);

  await regUtil.exportReg("HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Accent", backupPath + "\\" + backupData.desktopInfo.accentBackupPath);
  await regUtil.exportReg("HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize", backupPath + "\\" + backupData.desktopInfo.colorsBackupPath);

  await regUtil.exportReg("HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", backupPath + "\\" + backupData.desktopInfo.advancedBackupPath);
} else {
  console.log("Stage 3b: Removing desktop backup definitions (as you deselected the desktop option)");
  
  backupData.desktopInfo = {}
}

console.log("Stage 4: Backing up files and folders...");
await Deno.mkdir(backupPath + "\\DataBackup\\Files", { recursive: true });
await Deno.mkdir(backupPath + "\\DataBackup\\Folders", { recursive: true });

for (const file of backupOpts.backupFiles) {
  try {
    const actualPath = file.replace("$user", home);
    console.log("Copying file '%s'...", actualPath);

    const lastPathOfFile = actualPath.split("\\")[actualPath.split("\\").length-1];

    await copy(actualPath, backupPath + "\\DataBackup\\Files\\" + lastPathOfFile);
    backupData.copyData.files.push({
      from: "DataBackup\\Files\\" + lastPathOfFile,
      to: actualPath.replace(home, "$user") // Just in case :)
    });
  } catch (e) {
    console.error(" - Error! %s", e.message);
  }
}

for (const folder of backupOpts.backupFolders) {
  try {
    const actualPath = folder.replace("$user", home);
    console.log("Copying folder '%s'...", actualPath);

    const lastPathOfFolder = actualPath.split("\\")[actualPath.split("\\").length-1];
  
    await copy(actualPath, backupPath + "\\DataBackup\\Folders\\" + lastPathOfFolder);
    backupData.copyData.folders.push({
      from: "DataBackup\\Folders\\" + lastPathOfFolder,
      to: actualPath.replace(home, "$user")
    });
  } catch (e) {
    console.error(" - Error! %s", e.message);
  }
}

console.log("Finalizing backup... (1/4)");
await Deno.writeTextFile(backupPath + "/backup.json", JSON.stringify(backupData));

console.log("Finalizing backup... (2/4)");

await runBatch(`@echo off
cd "${backupPath}"
tar.exe -acf ..\\backupData.zip *`);

console.log("Finalizing backup... (3/4)");
await Deno.rename(Deno.env.get("TEMP") + "\\backupData.zip", "Migrate.pcmg");

console.log("Finalizing backup... (4/4)");
await Deno.remove(backupPath, { recursive: true });

console.log("Finished cleaning up! Your backup should be saved.");
console.log("We recommend exploring your backup at https://example.com/, to add extra data, if needed. (eta son)");