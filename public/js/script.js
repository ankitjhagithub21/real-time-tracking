const socket = io();

let userName = "";
let userMarker = null;
const userMarkers = {};

// Initialize the map (hidden initially)
const map = L.map("map").setView([0, 0], 16);

// Add the tile layer from OpenStreetMap
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Show map and start tracking after entering username
document.getElementById("startTracking").addEventListener("click", () => {
    const input = document.getElementById("username");
    userName = input.value.trim();

    if (!userName) {
        alert("Please enter your name.");
        return;
    }

    // Notify server about user name
    socket.emit("userJoined", userName);

    // Hide the form and show the map
    document.getElementById("user-form").style.display = "none";
    document.getElementById("map").style.display = "block";

    // Start geolocation tracking
    startTracking();
});

// Update location and send it to the server
function updateLocation(position) {
    const { latitude, longitude } = position.coords;
    const userCoords = [latitude, longitude];

    // Add or update the user's marker
    if (!userMarker) {
        userMarker = L.marker(userCoords)
            .addTo(map)
            .bindPopup(`${userName}`)
            .openPopup();
    } else {
        userMarker.setLatLng(userCoords).update();
    }

    // Center the map to the user's location
    map.setView(userCoords, 18); // Adjust zoom to show the sector clearly

    // Send the updated location to the server
    socket.emit("updateLocation", { name: userName, latitude, longitude });
}

// Start geolocation tracking
function startTracking() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            updateLocation,
            (err) => alert("Error getting your location: " + err.message),
            { enableHighAccuracy: true }
        );
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

// Handle updates from all users
socket.on("userLocations", (locations) => {
    locations.forEach((user) => {
        if (!userMarkers[user.id]) {
            // Add marker for new users
            userMarkers[user.id] = L.marker([user.latitude, user.longitude])
                .addTo(map)
                .bindPopup(`${user.name}'s location`);
        } else {
            // Update existing user's marker
            userMarkers[user.id].setLatLng([user.latitude, user.longitude]).update();
        }
    });
});

// Handle user disconnection and remove their marker
socket.on("userDisconnected", (userId) => {
    if (userMarkers[userId]) {
        map.removeLayer(userMarkers[userId]);
        delete userMarkers[userId];
    }
});
