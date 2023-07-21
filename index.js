const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");

app.use(express.static("public"));
app.use(express.json());
app.use(cors());

app.use("/", require("./routes/api"));
app.use("/audios", express.static(path.join(__dirname, "audios")));

app.use(function (err, req, res, next) {
  res.status(422).send({ error: err.message });
});

const port = process.env.PORT || 4000;

app.listen(port, function () {
  console.log("Todo listo, escuchando en puerto:", port);
});
