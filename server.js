const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔑 GOOGLE CONFIGURATION (Mula sa iyong na-download na JSON key file)
const SPREADSHEET_ID = '1nYoKIT4IDUbcojGHi9gqNgBUtpImErXnom80NtlE0fQ';
const CLIENT_EMAIL = 'IYONG-SERVICE-ACCOUNT-EMAIL'; // <-- I-paste ang email mula sa JSON file
const PRIVATE_KEY = 'IYONG-PRIVATE-KEY'.replace(/\\n/g, '\n'); // <-- I-paste ang buong private key kasama ang -----BEGIN PRIVATE KEY-----

const auth = new google.auth.JWT(
    CLIENT_EMAIL,
    null,
    PRIVATE_KEY,
    ['https://googleapis.com']
);

const sheets = google.sheets({ version: 'v4', auth });

// API: Kumuha ng Data mula sa Google Sheet
app.get('/api/inventory', async (req, res) => {
    try {
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Inventory!A2:K', // Binabasa ang Sheet na may pangalang 'Inventory' mula row 2 pababa
        });
        const rows = result.data.values || [];
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Magdagdag ng Bagong Row sa Google Sheet
app.post('/api/inventory', async (req, res) => {
    const { category, item_name, uom, chiller, commissary, dry_stock, freezer, packaging, scrap } = req.body;
    
    // Pagkalkula ng Total Qty sa server-side para sa kaligtasan ng data
    const totalQty = Number(chiller) + Number(commissary) + Number(dry_stock) + Number(freezer) + Number(packaging) + Number(scrap);

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Inventory!A2',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[category, item_name, uom, chiller, commissary, dry_stock, freezer, packaging, scrap, totalQty]]
            }
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mga Pahina
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); });

app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });
