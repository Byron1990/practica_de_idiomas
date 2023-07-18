const express = require("express");
const multer = require("multer");
const { Configuration, OpenAIApi } = require("openai");

const router = express.Router();
const upload = multer();
const dotenv = require("dotenv");
dotenv.config();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

async function transcribe(buffer) {
  const response = await openai.createTranscription(
    buffer, // El archivo de audio que se va a transcribir.
    "whisper-1", // El módelo a usar.
    undefined, // El prompt para usarse en la transcripción.
    "json", // El formato de la transcripción.
    1, // Temperatura
    "es" // Lenguage
  );
  return response;
}

async function chat(prompt) {
  const chatCompletion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
  });
  return chatCompletion;
}

router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

router.post("/", upload.any("file"), async (req, res) => {
  const audio_file = req.files[0];
  const buffer = audio_file.buffer;
  buffer.name = audio_file.originalname;

  try {
    const transcriptionResponse = await transcribe(buffer);
    const transcriptionText = transcriptionResponse.data.text;
    const chatResponse = await chat(transcriptionText);
    res.send({
      type: "POST",
      transcription: chatResponse.data.choices[0].message.content,
      audioFileName: buffer.name,
    });
  } catch (err) {
    res.send({ type: "POST", message: err });
  }
});

module.exports = router;
