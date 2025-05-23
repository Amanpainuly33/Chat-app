require("dotenv").config();
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const Message = require("./models/Message");
const User = require("./models/User");

const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://chat-app-six-ochre-62.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Authorization"],
  },
});

const HuffmanCoding = require("./utils/huffman");
const huffman = new HuffmanCoding();

// Middleware

app.use(cors({
  origin: "https://chat-app-six-ochre-62.vercel.app",
  credentials: true,
  methods: ["GET", "POST"],
  allowedHeaders: ["Authorization", "Content-Type"]
}));
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI + "test")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Routes
app.post("/api/register", async (req, res) => {
  try {
    console.log(" Body on register (browser):", req.body);
    const { username, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = new User({ username, password });
    await user.save(); //pre function gets executed first

    const token = jwt.sign({ username: user.username }, JWT_SECRET);
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Error registering user" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ username: user.username }, JWT_SECRET);
    await User.findByIdAndUpdate(user._id, { online: true });

    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
});

//auth middleware
const auth = async (req, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ valid: false, message: "No token provided" });
  }

  // Verify the token
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res
      .status(403)
      .json({ valid: false, message: "Invalid or expired token" });
  }

  // Check that the user still exists
  try {
    const user = await User.findOne({ username: payload.username });
    if (!user) {
      return res.status(401).json({ valid: false, message: "User not found" });
    }
    // 4. Everything's good
    req.username = payload.username;
    next();
  } catch (error) {
    console.error("Token validation error:", error);
    return res
      .status(500)
      .json({ valid: false, message: "Error validating token" });
  }
};

//used in search bar
app.get("/api/users", auth, async (req, res) => {
  try {
    const myusername = req.username; //sended in auth middleware
    const users = await User.find(
      { username: { $ne: myusername } },
      "username online lastSeen"
    );

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

//THis is hit by auth context to validate the token
app.get("/api/validate-token", auth, async (req, res) => {
  // Everything's good cuz the middleware has checked and passed the flow here
  return res.json({ valid: true });
});

// Authentication middleware for sockerio
const authenticateToken = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error("Authentication error"));
    socket.user = user;
    next();
  });
};

// Socket.IO Connection Handling
io.use(authenticateToken);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.user.username);

  // Update user status to online
  User.findOneAndUpdate(
    { username: socket.user.username },
    { online: true, lastSeen: new Date() }
  ).catch(console.error);

  // Handle private messages with conditional Huffman compression
  socket.on("privateMessage", async ({ text, receiver, isFile, fileName }) => {
    try {
      const originalSize = Buffer.byteLength(text, "utf8");
      console.log(`Original message size: ${originalSize} bytes`);

      let toStore = text;
      let wasCompressed = false;

      // For files, show file-specific compression info
      if (isFile) {
        console.log(`Original file size: ${originalSize} bytes`);
        if (originalSize > 1024) {
          const compressedData = huffman.encode(text);
          const compressedSize = compressedData.encoded.length;
          console.log(`Compressed file size: ${compressedSize} bytes`);
          console.log(
            `File compression ratio: ${(
              (1 - compressedSize / originalSize) *
              100
            ).toFixed(2)}%`
          );
          toStore = JSON.stringify(compressedData);
          wasCompressed = true;
        } else {
          console.log('File size <= 1KB, no compression needed');
        }
      } 
      // For regular messages, show message compression info
      else if (originalSize > 50) {
        const compressedData = huffman.encode(text);
        const compressedSize = compressedData.encoded.length;
        console.log(`Compressed message size: ${compressedSize} bytes`);
        console.log(
          `Message compression ratio: ${(
            (1 - compressedSize / originalSize) *
            100
          ).toFixed(2)}%`
        );
        toStore = JSON.stringify(compressedData);
        wasCompressed = true;
      }

      const message = new Message({
        text: toStore,
        sender: socket.user.username,
        receiver: receiver,
        timestamp: new Date(),
        compressed: wasCompressed,
        isFile: isFile || false,
        fileName: fileName || null
      });
      await message.save();

      // Emit to sender
      socket.emit("privateMessage", {
        text: text,
        sender: socket.user.username,
        receiver: receiver,
        timestamp: message.timestamp,
        compressed: wasCompressed,
        isFile: isFile || false,
        fileName: fileName || null
      });

      // Emit to receiver if online
      const receiverSocket = Array.from(io.sockets.sockets.values()).find(
        (s) => s.user?.username === receiver
      );

      if (receiverSocket) {
        receiverSocket.emit("privateMessage", {
          text: text,
          sender: socket.user.username,
          receiver: receiver,
          timestamp: message.timestamp,
          compressed: wasCompressed,
          isFile: isFile || false,
          fileName: fileName || null
        });
      }
    } catch (error) {
      console.error("Error handling private message:", error);
    }
  });

  // Handle history requests with conditional Huffman decompression
  socket.on('getMessageHistory', async ({ otherUser }) => {
    try {
      const messages = await Message.find({
        $or: [
          { sender: socket.user.username, receiver: otherUser },
          { sender: otherUser, receiver: socket.user.username }
        ]
      })
      .sort({ timestamp: 1 })
      .lean();

      const history = messages.map(msg => {
        let textOut = msg.text;

        if (msg.compressed) {
          try {
            // a) Parse the JSON string back to object
            const payloadObj = JSON.parse(msg.text);
            // b) Reconstruct the Buffer from the stored array
            if (payloadObj.encoded?.data) {
              payloadObj.encoded = Buffer.from(payloadObj.encoded.data);
            }
            // c) Decode
            textOut = huffman.decode(payloadObj);
          } catch (e) {
            console.error('Error decoding compressed message:', e);
          }
        }

        return {
          text: textOut,
          sender: msg.sender,
          receiver: msg.receiver,
          timestamp: msg.timestamp,
          compressed: msg.compressed,
          isFile: msg.isFile,
          fileName: msg.fileName
        };
      });

      // Emit back to the requester
      socket.emit('messageHistory', history);

    } catch (error) {
      console.error('Error handling message history:', error);
    }
  });

  socket.on("disconnect", async () => {
    try {
      await User.findOneAndUpdate(
        { username: socket.user.username },
        { online: false, lastSeen: new Date() }
      );
      console.log("User disconnected:", socket.user.username);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
