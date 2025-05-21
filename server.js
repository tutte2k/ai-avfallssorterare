const express = require("express");
const multer = require("multer");
const dotenv = require("dotenv");

// Initialize environment variables
dotenv.config();
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("❌ API_KEY missing in .env file");
  process.exit(1);
}

// API URLs for Hugging Face models
const API_URL =
  "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
const IMG_API_URL =
  "https://api-inference.huggingface.co/models/facebook/convnext-tiny-224";

const app = express();

// Logger setup
const logger = console;

// Middleware
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.mimetype)) {
      logger.warn(`Invalid file type: ${file.mimetype}`);
      return cb(new Error("Only JPEG and PNG images are allowed"));
    }
    cb(null, true);
  },
});

// Serve index.html
app.get("/", (req, res) => {
  logger.info("Serving index.html");
  res.sendFile(__dirname + "/index.html");
});

// POST endpoint for image processing
app.post("/prompt", upload.single("image"), async (req, res) => {
  logger.info("POST /prompt called");

  try {
    const { file } = req;
    if (!file) {
      logger.warn("No image uploaded");
      return res.status(400).json({ error: "No image uploaded" });
    }

    logger.info(`Image received: ${file.originalname} (${file.mimetype})`);

    // Query image with Hugging Face API
    async function queryImage(imageBuffer) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 50000);

      try {
        const response = await fetch(IMG_API_URL, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/octet-stream",
          },
          method: "POST",
          body: imageBuffer,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.text();
          logger.error(`Image API error: ${response.status} - ${text}`);

          throw new Error(`Image API failed (${response.status})`);
        }

        const result = await response.json();
        logger.info("Image API response received");
        return result;
      } catch (error) {
        logger.error(`Image API request failed: ${error.message}`);
        throw error;
      }
    }

    async function queryText(data) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify(data),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.text();
          logger.error(`Text API error: ${response.status} - ${text}`);

          throw new Error(`Text API failed (${response.status})`);
        }

        const result = await response.json();
        logger.info("Text API response received");
        return result;
      } catch (error) {
        logger.error(`Text API request failed: ${error.message}`);
        throw error;
      }
    }

    // Step 1: Analyze image
    const imageResponse = await queryImage(file.buffer);

    if (
      !Array.isArray(imageResponse) ||
      imageResponse.length === 0 ||
      !imageResponse[0]?.label
    ) {
      logger.error("Invalid image API response");
      return res.status(500).json({ error: "Could not interpret image" });
    }

    console.log(imageResponse);
    const topLabel = imageResponse.shift().label;
    logger.info(`Identified label: ${topLabel}`);

    // Step 2: Classify recycling category
    const classificationResponse = await queryText({
      inputs: `Which container should this item go in for recycling: ${topLabel}`,
      parameters: {
        candidate_labels: ["glass", "metal", "paper", "plastic", "food"],
      },
    });

    const { labels, scores } = classificationResponse;
    if (!labels || !scores || labels.length !== scores.length) {
      logger.error("Invalid text API response");
      return res
        .status(500)
        .json({ error: "Invalid response from text model" });
    }

    // Format results
    const result = labels.map((label, i) => ({
      label,
      score: `${(scores[i] * 100).toFixed(2)}%`,
    }));

    console.log(result);

    logger.info("Sending result to client");
    res.json({ result });
  } catch (error) {
    logger.error(`Request failed: ${error.message}`);
    res.status(500).json({ error: error.message || "Failed to process image" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
