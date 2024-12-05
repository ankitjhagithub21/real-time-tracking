const express = require("express");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

// Store user data with name and location
let userLocations = [];

app.use(express.static(path.join(__dirname, "public")));

// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Handle socket.io connection
io.on("connection", (socket) => {
  console.log(`New connection: ${socket.id}`);
  let userName = "";

  // Handle user joining with their name
  socket.on("userJoined", (name) => {
    userName = name;
    console.log(`${userName} joined with ID: ${socket.id}`);

    // Broadcast the new user joined event to all clients
    io.emit("userJoinedNotification", `${userName} has joined the map`);

    // Add the new user to the list of users
    userLocations.push({
      id: socket.id,
      name: userName,
      latitude: 0,
      longitude: 0,
    });
  });

  // Handle location updates
  socket.on("updateLocation", ({ name, latitude, longitude }) => {
    const userIndex = userLocations.findIndex((user) => user.id === socket.id);

    if (userIndex === -1) {
      userLocations.push({ id: socket.id, name, latitude, longitude });
    } else {
      userLocations[userIndex] = { id: socket.id, name, latitude, longitude };
    }

    // Broadcast updated locations to all connected clients
    io.emit("userLocations", userLocations);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`${userName} disconnected.`);
    // Remove the user from the user list when they disconnect
    userLocations = userLocations.filter((user) => user.id !== socket.id);

    // Notify clients to remove the disconnected user's marker
    io.emit("userDisconnected", socket.id);
  });
});

// Render the index page
app.get("/", (req, res) => {
  res.render("index");
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
