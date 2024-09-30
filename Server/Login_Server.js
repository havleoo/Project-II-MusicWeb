require("dotenv").config();
const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const SpotifyWebApi = require("spotify-web-api-node");

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const con = mysql.createConnection({
  user: "root",
  host: "localhost",
  password: "",
  database: "project_ii",
});

// User registration endpoint
app.post("/register", (req, res) => {
  const { email, username, password } = req.body;

  if (!username || !password) {
    return res.send({ message: "Username and password are required." });
  } else {
    con.query(
      "INSERT INTO users (UserID, Username, Password) VALUES(?, ?, ?)",
      [email, username, password],
      (err, result) => {
        if (err) {
          res.send({ message: "Email has been used" });
        } else {
          res.send(result);
        }
      }
    );
  }
});

// User login endpoint
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  con.query(
    "SELECT * FROM users WHERE UserID = ? AND Password = ?",
    [email, password],
    (err, result) => {
      if (err) {
        res.send({ err });
      } else {
        if (result.length > 0) {
          res.send(result);
        } else {
          res.send({ message: "WRONG EMAIL OR PASSWORD" });
        }
      }
    }
  );
});

// Spotify API setup
const spotifyApi = new SpotifyWebApi({
  redirectUri: process.env.REDIRECT_URI,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
});

// Endpoint to handle Spotify login
app.post("/spotify-login", (req, res) => {
  const code = req.body.code;
  spotifyApi.authorizationCodeGrant(code)
    .then(data => {
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch(err => {
      console.error("Error during authorization code grant:", err);
      res.sendStatus(400);
    });
});

// Endpoint to refresh access token
app.post("/refresh", (req, res) => {
  const refreshToken = req.body.refreshToken;
  spotifyApi.setRefreshToken(refreshToken);
  spotifyApi.refreshAccessToken()
    .then(data => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch(err => {
      console.error("Error refreshing access token:", err);
      res.sendStatus(400);
    });
});

app.listen(3001, () => {
  console.log("Running backend server");
});
