const express = require("express");
const cors = require("cors");
const { OAuth2Client } = require("google-auth-library");

const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_ID = "auth.json";
const client = new OAuth2Client(CLIENT_ID);

app.post("/verify", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });

    const payload = ticket.getPayload();
    res.json(payload);
  } catch (err) {
    res.status(401).send("Invalid token");
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));