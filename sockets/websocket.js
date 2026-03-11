import { Server } from "socket.io";
import path from "path";
import speech from "@google-cloud/speech";
import jwt from "jsonwebtoken"; // Add this import

import {
  createConversationHistory,
  getResponseFromLLM,
  normalizeUserInput,
} from "../services/llmService.js";

import { synthesizeToBase64 } from "../services/ttsService.js";
import ChatSession from "../models/chatSession.model.js";
import ChatMessage from "../models/chat.model.js";

function cleanTextForSpeech(text = "") {
  return String(text)
    .replace(/```/g, "")
    .replace(/`+/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#+\s?/g, "")
    .replace(/[*]+/g, "")
    .replace(/_+/g, " ")
    .replace(/(^|[^:])\/\/+/g, "$1")
    .replace(/[-–—]{2,}/g, ", ")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// 🎙 Google Speech Client
const client = new speech.SpeechClient({
  keyFilename: path.join(
    process.cwd(),
    "keys/weenglish-6bb28-92b6c109b652.json"
  ),
});

export const initVoiceChatSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { 
      origin: "*",
      methods: ["GET", "POST"]
    },
  });

  io.on("connection", async (socket) => {
    /* ================= 🔐 TOKEN AUTHENTICATION ================= */
    const token = socket.handshake.auth?.token;
    if (!token) {
      console.log("❌ No token provided");
      socket.disconnect();
      return;
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id; // Assuming your token has an 'id' field
      socket.user = decoded; // Optional: attach user data to socket
      console.log("✅ Authenticated user:", userId);
    } catch (err) {
      console.log("❌ Invalid token:", err.message);
      socket.disconnect();
      return;
    }
    /* ================= END TOKEN AUTH ================= */

    /* ================= 🗂 SESSION ================= */
    let session;
    try {
      session = await ChatSession.create({
        user: userId, // Store user ID from token
        startTime: new Date(),
      });
    } catch (err) {
      console.error("❌ Session creation failed:", err);
      socket.disconnect();
      return;
    }

    /* ================= 🧠 PER-CONNECTION STATE ================= */
    let recognizeStream = null;
    let streamActive = false;
    let audioQueue = [];
    let isProcessingQueue = false;
    const conversationHistory = createConversationHistory();

    /* ================= 🎙 INITIALIZE STREAM ================= */
    const initializeStream = () => {
      console.log("🎙 Initializing Google Cloud STT stream for user:", userId);
      
      // Clean up existing stream
      if (recognizeStream) {
        try {
          recognizeStream.end();
          recognizeStream.destroy();
        } catch (err) {
          // Ignore
        }
        recognizeStream = null;
      }

      // Create a proper duplex stream
      const requestConfig = {
        config: {
          encoding: "LINEAR16",
          sampleRateHertz: 16000,
          languageCode: "ml-IN",
          alternativeLanguageCodes: ["en-IN", "hi-IN", "en-US"],
          enableAutomaticPunctuation: true,
          model: "latest_long",
        },
        interimResults: true,
        singleUtterance: false,
      };

      console.log("📡 Creating streamingRecognize request...");
      
      try {
        // Create the streaming recognize request
        recognizeStream = client.streamingRecognize(requestConfig);
        
        // Set up event handlers
        recognizeStream.on('error', (error) => {
          console.error('❌ STT Stream Error:', error.message);
          console.error('❌ Error details:', error);
          streamActive = false;
          recognizeStream = null;
          
          socket.emit('sttError', {
            message: 'Speech recognition failed',
            code: error.code || 'UNKNOWN'
          });
        });

        recognizeStream.on('data', async (data) => {
          try {
            if (data.results && data.results[0]) {
              const result = data.results[0];
              const isFinal = result.isFinal;
              
              if (result.alternatives && result.alternatives[0]) {
                const transcript = result.alternatives[0].transcript;
                const confidence = result.alternatives[0].confidence || 0;
                
                if (transcript.trim().length > 0) {
                  console.log(`📝 User ${userId}: "${transcript}" (${isFinal ? 'FINAL' : 'INTERIM'}, ${confidence.toFixed(2)})`);
                  
                  if (!isFinal) {
                    const normalized = await normalizeUserInput(transcript);
                    socket.emit('partialTranscript', normalized);
                    return;
                  }
                  
                  // Final transcript
                  const normalizedTranscript = await normalizeUserInput(transcript);
                  
                  // Save user message WITH user ID
                  // try {
                  //   await ChatMessage.create({
                  //     session: session._id.toString(),
                  //     user: userId, // Add user ID here
                  //     message: normalizedTranscript,
                  //     isUser: true,
                  //     timestamp: new Date(),
                  //   });
                  // } catch (dbError) {
                  //   console.error('Error saving user message:', dbError);
                  // }
                  
                  // Get AI response
                  const botData = await getResponseFromLLM(
                    normalizedTranscript,
                    conversationHistory
                  );
                  
                  // // Save AI response WITH user ID
                  // try {
                  //   await ChatMessage.create({
                  //     session: session._id.toString(),
                  //     user: userId, // Add user ID here
                  //     message: botData.aiReply,
                  //     isUser: false,
                  //     timestamp: new Date(),
                  //   });
                  // } catch (dbError) {
                  //   console.error('Error saving bot message:', dbError);
                  // }
                  
                  const cleanedAiReply = cleanTextForSpeech(botData.aiReply);
                  const ttsText = cleanedAiReply || botData.aiReply;
                  
                  // Convert to speech
                  const audio = await synthesizeToBase64(ttsText, "ml-IN");
                  
                  // Send to client
                  socket.emit('botMessage', {
                    transcript: botData.correctedTranscript || normalizedTranscript,
                    text: cleanedAiReply || botData.aiReply,
                    audio: audio,
                    confidence: confidence,
                  });
                  
                  console.log(`🤖 Bot replied to user ${userId} (${botData.aiReply.length} chars)`);
                }
              }
            }
          } catch (error) {
            console.error('Error processing STT data:', error);
          }
        });

        recognizeStream.on('end', () => {
          console.log('🔚 STT stream ended');
          streamActive = false;
          recognizeStream = null;
        });

        // Mark stream as active after a short delay
        setTimeout(() => {
          streamActive = true;
          console.log('✅ STT stream is now active');
          
          // Process any queued audio
          processAudioQueue();
        }, 100);
        
      } catch (error) {
        console.error('❌ Failed to initialize STT stream:', error);
        socket.emit('sttError', {
          message: 'Failed to initialize speech recognition',
          code: 'INIT_FAILED'
        });
      }
    };

    /* ================= 🔊 PROCESS AUDIO QUEUE ================= */
    const processAudioQueue = () => {
      if (!streamActive || !recognizeStream || isProcessingQueue) {
        return;
      }
      
      isProcessingQueue = true;
      
      while (audioQueue.length > 0 && streamActive && recognizeStream) {
        const audioData = audioQueue.shift();
        try {
          // Write audio data to stream
          recognizeStream.write(audioData);
        } catch (error) {
          console.error('Error writing audio to stream:', error);
          // Put back in queue
          audioQueue.unshift(audioData);
          break;
        }
      }
      
      isProcessingQueue = false;
    };

    /* ================= 🎧 HANDLE AUDIO CHUNKS ================= */
    const handleAudioChunk = (buffer) => {
      if (!buffer || buffer.length === 0) {
        return null;
      }
      
      // Check if it's WAV format
      const isWav = buffer.length > 44 && 
                   buffer.toString('ascii', 0, 4) === 'RIFF';
      
      let audioContent;
      
      if (isWav) {
        // Strip WAV header (44 bytes)
        audioContent = buffer.slice(44);
        if (audioContent.length === 0) {
          return null;
        }
      } else {
        // Assume it's raw PCM
        audioContent = buffer;
      }
      
      // Ensure minimum audio length (100ms at 16kHz/16-bit)
      if (audioContent.length < 3200) {
        return null;
      }
      
      return audioContent;
    };

    /* ================= 🛑 CLEANUP ================= */
    const cleanup = async () => {
      console.log(`🧹 Cleaning up for user ${userId}`);
      
      if (recognizeStream) {
        try {
          recognizeStream.end();
          recognizeStream.destroy();
        } catch (err) {
          // Ignore cleanup errors
        }
        recognizeStream = null;
      }
      
      streamActive = false;
      audioQueue = [];
      
      // Update session end time
      try {
        await ChatSession.findByIdAndUpdate(session._id, {
          endTime: new Date(),
        });
      } catch (err) {
        console.error('Error updating session:', err);
      }
    };

    /* ================= 📡 SOCKET EVENT HANDLERS ================= */
    
    // Audio chunk from client
    socket.on('audioChunk', (data) => {
      try {
        if (!data) return;
        
        const buffer = Buffer.from(data);
        const audioContent = handleAudioChunk(buffer);
        
        if (!audioContent) {
          return;
        }
        
        // Initialize stream if not exists
        if (!recognizeStream) {
          console.log('🎤 First audio chunk received, initializing stream...');
          audioQueue.push(audioContent);
          initializeStream();
          return;
        }
        
        // If stream exists but not active yet, queue the audio
        if (!streamActive) {
          audioQueue.push(audioContent);
          return;
        }
        
        // Stream is active, write directly or queue
        if (recognizeStream.writable) {
          try {
            recognizeStream.write(audioContent);
          } catch (error) {
            console.error('Direct write failed, queuing:', error.message);
            audioQueue.push(audioContent);
          }
        } else {
          audioQueue.push(audioContent);
        }
        
      } catch (error) {
        console.error('Error handling audio chunk:', error);
      }
    });

    // Start call
    socket.on('startCall', () => {
      console.log(`📞 Call start requested by user: ${userId}`);
      // Initialize stream immediately when call starts
      initializeStream();
      socket.emit('callStarted', {
        message: 'Call started - stream initializing',
        timestamp: new Date().toISOString()
      });
    });

    // Hang up
    socket.on('hangUp', async () => {
      console.log(`📞 Hang up received from user: ${userId}`);
      await cleanup();
      socket.emit('callEnded', { message: 'Call ended' });
      socket.disconnect();
    });

    // Disconnect
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 User ${userId} disconnected:`, reason);
      await cleanup();
    });

    // Send connection confirmation
    socket.emit('connected', {
      userId: userId, // Send user ID back to client
      connectionId: socket.id,
      sessionId: session._id,
      message: 'Connected to voice chat server',
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Voice chat socket server initialized');
};
