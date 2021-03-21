const express = require("express");
const { json, urlencoded } = require("body-parser");
const cors = require("cors");
const StegCloak = require("stegcloak");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Steganographer = require("./steganography");
const app = express();
const port = 3400;
app.use(json());
app.use(cors());
app.use(urlencoded({ extended: true }));
const stegcloak = new StegCloak(true, false);
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage });
app.use(express.static("public"));

app.post("/hideText", (req, res) => {
  const magic = stegcloak.hide(
    req.body.secret,
    req.body.password,
    req.body.cover
  );
  res.send(magic);
});

app.post("/imgBury", upload.single("image"), (req, res, next) => {
  var outPutPath;
  if (req.file) {
    const { text, password } = req.body;
    outPutPath = path.resolve(
      __dirname,
      "uploads",
      req.file.originalname.split(".png")[0] + "--encrypted"
    );
    const textFilePath = path.resolve(
      __dirname,
      "uploads",
      req.file.originalname + ".txt"
    );
    fs.writeFileSync(textFilePath, text);
    console.log(outPutPath);
    Steganographer.embed
      .apply(this, [req.file.path, textFilePath, outPutPath, password])
      .then(() => {
        console.log(outPutPath + ".png");
        fs.createReadStream(outPutPath + ".png").pipe(res);
      });
  }
});

app.post("/imgDigUp", upload.single("decrypt"), (req, res, next) => {
  if (req.file) {
    const { password } = req.body;
    if (
      !fs.existsSync("./output/" + req.file.originalname.split(".png")[0] + "/")
    ) {
      fs.mkdirSync("./output/" + req.file.originalname.split(".png")[0] + "/");
    } else {
      fs.unlinkSync(
        "./output/" +
          req.file.originalname.split(".png")[0] +
          "/" +
          "digged-output.txt"
      );
    }
    console.log("./output/" + req.file.originalname.split(".png")[0]);
    Steganographer.digUp
      .apply(this, [
        req.file.path,
        "./output/" + req.file.originalname.split(".png")[0],
        password,
      ])
      .then((d) => {
        fs.createReadStream(d).pipe(res);
      });
  }
});

app.post("imgDigUp", (req, res) => {});

app.listen(port, () => console.log(`Listening on port ${port}..`));
