const express = require("express");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

let userLocations = [];

// Serve static files
app.use(express.static(path.join(__dirname, "public")));

// Set up EJS view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Handle socket connections
io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);
    let userName = "";

    socket.on("userJoined", (name) => {
        userName = name;
        console.log(`${userName} joined with ID: ${socket.id}`);
    });

    socket.on("updateLocation", ({ name, latitude, longitude }) => {
        const userIndex = userLocations.findIndex((user) => user.id === socket.id);

        if (userIndex === -1) {
            userLocations.push({ id: socket.id, name, latitude, longitude });
        } else {
            userLocations[userIndex] = { id: socket.id, name, latitude, longitude };
        }

        io.emit("userLocations", userLocations);
    });

    socket.on("disconnect", () => {
        console.log(`${userName} disconnected.`);
        userLocations = userLocations.filter((user) => user.id !== socket.id);
        io.emit("userDisconnected", socket.id);
    });
});

// Render index page
app.get("/", (req, res) => {
    res.render("index");
});

const port = process.env.PORT || 3000
// Start server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
