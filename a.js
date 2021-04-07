const { spawn } = require("child_process");
const path = require("path");
const python = spawn("python", [
  "./audio/sender.py",
  path.resolve("./uploads/sample.wav"),
  "hi there",
  path.resolve("./uploads/sample-output.wav"),
]);

python.stdout.on("data", (data) => {
  console.log("Piping data from script");
  console.log(data.toString());
});
