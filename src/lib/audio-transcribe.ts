/**
 * Audio Transcription via OpenAI Whisper
 * ────────────────────────────────────────
 * Receives base64 audio from Evolution API and transcribes it
 * using OpenAI's Whisper model.
 */

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/**
 * Transcribe a base64-encoded audio to text using Whisper.
 * @param base64Audio - Base64-encoded audio data
 * @param mimetype - MIME type of the audio (e.g., "audio/ogg")
 * @returns Transcribed text or null on failure
 */
export async function transcribeAudio(
  base64Audio: string,
  mimetype: string = "audio/ogg"
): Promise<string | null> {
  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Audio, "base64");

    // Determine file extension from mimetype
    const extMap: Record<string, string> = {
      "audio/ogg": "ogg",
      "audio/ogg; codecs=opus": "ogg",
      "audio/mpeg": "mp3",
      "audio/mp4": "m4a",
      "audio/wav": "wav",
      "audio/webm": "webm",
    };
    const ext = extMap[mimetype] || "ogg";

    // Create a File object for the OpenAI API
    const file = new File([audioBuffer], `audio.${ext}`, { type: mimetype });

    const transcription = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
      language: "es", // Spanish
    });

    const text = transcription.text?.trim();
    if (!text) {
      console.warn("[Whisper] Empty transcription result");
      return null;
    }

    console.log(`[Whisper] Transcribed: "${text.slice(0, 100)}..."`);
    return text;
  } catch (error) {
    console.error("[Whisper] Transcription error:", error);
    return null;
  }
}
