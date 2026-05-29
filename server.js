const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔑 GOOGLE CONFIGURATION (Ligtas na babasahin mula sa Render Environment Variables)
const SPREADSHEET_ID = '1nYoKIT4IDUbcojGHi9gqNgBUtpImErXnom80NtlE0fQ';
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL; 
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY, 'base64').toString('utf8').replace(/\\n/g, '\n') : undefined; // Pag-verify kung kumpleto ang mga susi sa server environment bago simulan ang Google Auth
let auth, sheets;
try {
    if (CLIENT_EMAIL && PRIVATE_KEY) {
        auth = new google.auth.JWT(
            CLIENT_EMAIL,
            null,
            PRIVATE_KEY,
            ['https://googleapis.com']
        );
        sheets = google.sheets({ version: 'v4', auth });
    }
} catch (e) {
    console.error("Auth Initialization Error:", e.message);
}

// API ROUTE: Kumuha ng Data mula sa Google Sheet
app.get('/api/inventory', async (req, res) => {
    try {
        if (!sheets) throw new Error("Google API credentials are not properly configured on Render.");
        
        const result = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Inventory!A2:K', 
        });
        const rows = result.data.values || [];
        res.json(rows);
    } catch (error) {
        console.error("GET Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// API ROUTE: Magdagdag ng Bagong Row sa Google Sheet
app.post('/api/inventory', async (req, res) => {
    try {
        if (!sheets) throw new Error("Google API credentials are not properly configured on Render.");
        
        const { category, item_name, uom, chiller, commissary, dry_stock, freezer, packaging, scrap } = req.body;
        const totalQty = Number(chiller) + Number(commissary) + Number(dry_stock) + Number(freezer) + Number(packaging) + Number(scrap);

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
        console.error("POST Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Front-end Routing Hooks
app.get('/', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'index.html')); });
app.get('/dashboard', (req, res) => { res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); });

app.listen(PORT, () => { console.log(`Server is running successfully on port ${PORT}`); });
