const express = require("express");
const axios = require("axios");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Google Sheets URLs (from .env file)
const donationUrl = process.env.DONATION_URL;
const expenditureUrl = process.env.EXPENDITURE_URL;

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// Fetch donations data from Google Sheets
app.get("/api/donations", async (req, res) => {
  try {
    const response = await axios.get(donationUrl);
    res.send(response.data); // Send the CSV data to the front-end
  } catch (error) {
    console.error("Error fetching donations:", error);
    res.status(500).send("Error fetching donations data");
  }
});

// Fetch expenditures data from Google Sheets
app.get("/api/expenditures", async (req, res) => {
  try {
    const response = await axios.get(expenditureUrl);
    res.send(response.data); // Send the CSV data to the front-end
  } catch (error) {
    console.error("Error fetching expenditures:", error);
    res.status(500).send("Error fetching expenditures data");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
