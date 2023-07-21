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

//Texto a voz
const path = require("path");
const voice = require("elevenlabs-node");
const fs = require("fs-extra");
const player = require("play-sound")((opts = {}));

const apiKey = process.env.ELEVENLABS_API_KEY; // Your API key from Elevenlabs
const voiceID = "MF3mGyEYCl7XYWbV9V6O"; // The ID of the voice you want to get
const fileName = "audio.mp3"; // The name of your audio file
const modelID = "eleven_multilingual_v1";
const stability = 0;
const similarity_boost = 0;
//

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
    console.log("Solicitud: ", transcriptionText);
    const chatResponse = await chat(transcriptionText);
    const textInput = chatResponse.data.choices[0].message.content;
    console.log("Respuesta: ", chatResponse.data.choices[0].message.content);

    const audioPath = path.join(__dirname, "../audios", "audio.mp3");
    voice
      .textToSpeechStream(
        apiKey,
        voiceID,
        textInput,
        stability,
        similarity_boost,
        modelID
      )
      .then((voiceStream) => {
        const writeStream = fs.createWriteStream(audioPath);
        voiceStream.pipe(writeStream);

        writeStream.on("finish", () => {
          res.send({
            type: "POST",
            transcription: chatResponse.data.choices[0].message.content,
            audioURL: `/audios/audio.mp3`, // Enviar la URL del archivo de audio al cliente
          });
        });
      })
      .catch((err) => {
        console.error("Error al generar el audio:", err);
        res.send({ type: "POST", message: err });
      });
  } catch (err) {
    console.log("Error al enviar el POST", err.message);
    res.send({ type: "POST", message: err });
  }
});

const generateAudio = (text, audioFileName) => {
  return new Promise((resolve, reject) => {
    say.export(text, "Microsoft David Desktop", 1, audioFileName, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = router;
