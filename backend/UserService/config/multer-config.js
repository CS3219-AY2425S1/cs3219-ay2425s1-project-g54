import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, ".");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1000000, // 5MB
  },
  fileFilter: function (req, file, cb) {
    let extName = path.extname(file.originalname);
    let ext = extName.substring(1).toLowerCase();
    if (ext !== "png" && ext !== "jpg" && ext !== "jpeg") {
      return cb(new Error("Only images are allowed"));
    }
    cb(null, true);
  },
});

export default upload;
