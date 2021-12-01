require("dotenv").config({ path: "./.env" });
const express = require("express");
const { readdirSync } = require("fs");
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || "3001";

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
/** Routes Auto loading function */
readdirSync("./routes").map((r) =>
  app.use(`/api/v1`, require(`./routes/${r}`))
);
/** error middleware */
app.use(errorMiddleware);
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
