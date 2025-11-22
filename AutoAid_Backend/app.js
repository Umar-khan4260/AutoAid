const http = require("http");

const express = require("express");

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true })); // For form data
app.use(express.json()); // For JSON data

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(` app listening on port ${port}`);
});
