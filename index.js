const express = require("express");
const { json, urlencoded } = require("body-parser");
const cors = require("cors");
const StegCloak = require("stegcloak");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const Jimp = require("jimp");
const Steganographer = require("./steganography");
const app = express();
const port = 3400;
app.use(json());
app.use(cors());
app.use(urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.static("uploads"));

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

app.post("/hideText", (req, res) => {
  const magic = stegcloak.hide(
    req.body.secret,
    req.body.password,
    req.body.cover
  );
  res.send(magic);
});

app.post("/revealText", (req, res) => {
  const result = stegcloak.reveal(req.body.payload, req.body.password);
  res.send(result);
});

app.post("/hideAudio", upload.single("audio"), (req, res, next) => {
  const { secret } = req.body;
  req.file = req.file.originalname;
  const output = req.file.split(".")[0] + "-output.wav";
  console.log("hi");
  let audio;
  if (~req.file.indexOf("mp3")) {
    audio = spawn("python", [
      "./audio/sender.py",
      "false",
      secret,
      path.resolve("./uploads/" + output),
      path.resolve("./uploads/" + req.file),
    ]);
  } else {
    audio = spawn("python", [
      "./audio/sender.py",
      path.resolve("./uploads/" + req.file),
      secret,
      path.resolve("./uploads/" + output),
    ]);
  }

  audio.stdout.on("data", (data) => {
    console.log(data.toString());
    res.send(output);
  });
  audio.stdout.on("error", (data) => {
    console.error(data);
  });
});

app.post("/revealAudio", (req, res) => {
  if (req.file) {
    const audio = spawn("./audio/sender.py", [req.file]);
    audio.stdout.on("data", (data) => {
      let output = data.toString();
      console.log(output);
    });
  }
});

app.post("/imgBury", upload.single("image"), (req, res, next) => {
  var outPutPath;
  if (req.file) {
    const { text, password } = req.body;
    if (~req.file.originalname.indexOf(".jpg")) {
      Jimp.read(req.file.path, function (err, image) {
        if (err) {
          console.log(err);
        } else {
          image.write("./uploads/converted.png");
          outPutPath = path.resolve(
            __dirname,
            "uploads",
            "converted_" + +new Date() + ".png".split(".png")[0] + "--encrypted"
          );
          const textFilePath = path.resolve(
            __dirname,
            "uploads",
            "converted.txt"
          );
          fs.writeFileSync(textFilePath, text);
          console.log(outPutPath);
          Steganographer.embed
            .apply(this, [
              path.resolve("./uploads/converted.png"),
              textFilePath,
              outPutPath,
              password,
            ])
            .then(() => {
              console.log(outPutPath + ".png");
              res.send(
                outPutPath.slice(
                  outPutPath.lastIndexOf("/") + 1,
                  outPutPath.length
                ) + ".png"
              );
            });
        }
      });
    } else {
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
          res.send(
            outPutPath.slice(
              outPutPath.lastIndexOf("/") + 1,
              outPutPath.length
            ) + ".png"
          );
        });
    }
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
