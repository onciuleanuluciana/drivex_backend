const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Permitem conexiuni cross-origin de la paginile noastre web locale și parsarea JSON-ului
app.use(cors());
app.use(express.json());

const FLEET_FILE = path.join(__dirname, 'fleet.json');
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');

// Helper functions pentru citire/scriere securizată în baza de date JSON
const readData = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const writeData = (filePath, data) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');

// === ENDPOINT-URI API REST (Bifate pentru Postman) ===

// 1. Returnează toată flota de mașini
app.get('/api/fleet', (req, res) => {
    try { res.json(readData(FLEET_FILE)); } catch (e) { res.status(500).json({ error: "Eroare DB" }); }
});

// 2. Adaugă sau actualizează o mașină în flotă (Operație CRUD)
app.post('/api/fleet', (req, res) => {
    const car = req.body;
    let fleet = readData(FLEET_FILE);
    if (car.id) {
        fleet = fleet.map(c => c.id == car.id ? car : c);
    } else {
        car.id = Date.now();
        car.isRented = false;
        fleet.push(car);
    }
    writeData(FLEET_FILE, fleet);
    res.json({ success: true, fleet });
});

// 3. Șterge o mașină definitiv (Operație CRUD)
app.delete('/api/fleet/:id', (req, res) => {
    let fleet = readData(FLEET_FILE);
    fleet = fleet.filter(c => c.id != req.params.id);
    writeData(FLEET_FILE, fleet);
    res.json({ success: true, fleet });
});

// 4. Returnează registrul central de rezervări
app.get('/api/bookings', (req, res) => {
    try { res.json(readData(BOOKINGS_FILE)); } catch (e) { res.status(500).json({ error: "Eroare DB" }); }
});

// 5. Salvează o rezervare nouă și marchează mașina ca ocupată
app.post('/api/bookings', (req, res) => {
    const newBooking = req.body;
    let bookings = readData(BOOKINGS_FILE);
    let fleet = readData(FLEET_FILE);

    bookings.push(newBooking);
    fleet = fleet.map(c => c.title === newBooking.carTitle ? { ...c, isRented: true } : c);

    writeData(BOOKINGS_FILE, bookings);
    writeData(FLEET_FILE, fleet);
    res.json({ success: true });
});

// 6. Finalizează/Arhivează o rezervare și eliberează mașina în stoc
app.delete('/api/bookings/:id/:carTitle', (req, res) => {
    let bookings = readData(BOOKINGS_FILE);
    let fleet = readData(FLEET_FILE);

    bookings = bookings.filter(b => b.id != req.params.id);
    fleet = fleet.map(c => c.title === req.params.carTitle ? { ...c, isRented: false } : c);

    writeData(BOOKINGS_FILE, bookings);
    writeData(FLEET_FILE, fleet);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`🚀 Serverul DriveX Control rulează live la adresa: http://localhost:${PORT}`);
});