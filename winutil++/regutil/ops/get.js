import { query } from "./query.js";

export async function get(key) {
  const rootKey = key.split("\\");
  rootKey.pop();

  const regData = await query(rootKey.join("\\"));

  return regData[key.replace(rootKey.join("\\"), "")];
}