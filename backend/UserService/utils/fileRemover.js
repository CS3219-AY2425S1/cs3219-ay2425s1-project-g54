import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fileRemover = (filename) => {
  fs.unlink(path.join(__dirname, "../", filename), function (err) {
    if (err && err.code == "ENOENT") {
      // file doesnt exist
      console.log(`File ${filename} doesnt exist, wont remove it.`);
    } else if (err) {
      console.log(`Error occured while trying to remove file ${filename}`);
    } else {
      console.log(`removed ${filename}`);
    }
  });
};

export { fileRemover };
