const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 🔑 GOOGLE CONFIGURATION (Mula sa iyong na-download na JSON key file)
const SPREADSHEET_ID = '1nYoKIT4IDUbcojGHi9gqNgBUtpImErXnom80NtlE0fQ';
const CLIENT_EMAIL = 'erp-service@my-erp-system-497709.iam.gserviceaccount.com'; // <-- I-paste ang email mula sa JSON file
const PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDR1KzHvyqJpOM8\nC78LuRkQ120JhHSzfsh8tP48YTDjfPAlV4KP4e0KjrxRYKMC3UmIloI/rZBvCKsh\n8afjM1yKZo/BsvBW571SYPS7gMKLaPFoNAzN/BmgZl+a0C4oPg8a6l3bJGD3z8ZE\n0JN3qBxWSxGG7m9BCPuow2aLYrryywZ5BNTKymA8tkl+T6Zco9Hfae6SJlz1SHzb\n2j0ZppSR0Z/rE3cIGOeineZ1FUF3288G5J7HF66F6tQqeRRAuPgJSxgpnTvvYljX\nOPBROLIeJ9r7a1UNTIWS6g0VWdlSLDymoWYbXZ/mJ8AYMhfZA1h30wqUDgioIX5j\nQ/yiM7OpAgMBAAECggEAGLKxy6kitqTj4lN3n0egPa09tlsS6XXI33TmX/EIsh4o\nnhyYz5rGLfHzFJkNVu75Esy0dA5X69nXWt1453NKNzgvP5tyUqhgTmv/Inrba1Fk\n6OEHiM9drNWf9zb919rGKGLhvUOg7kpUihEK6pCtFTMs0vcJvVvzUz/8t/ddDerF\nMbctS9Pa5FOaWDs9BfRxaTs7BUtwDz0HOmISU2SM9hP3dM0YzIuQEx7CR9UYDoPq\ngdL13TNEARhd3z1foTSBNytgpk4/Xcg0lfE41spZN6piIFedqLFNt283lbcPX9BT\nDpR1a0RLTWp2nmflME5RxIiH5zXHH3BXM6vmvP16AQKBgQDx79HjagVm9RJ7k4Qw\n2ygAvY1ejfYUt0pNiSOo/vIZ1NZ6ZQns976nmol2cA4oxKA3xfan3pViLLul1fUl\nGFcMuCCrSf21zTgYU42RTHLiVyy4422VlmZRhJGkMcqwW+KLj2EHeb5rV0r8Anbj\nJ7AQ4jWrOnYSv2jeW0yx2exJoQKBgQDeBxiPLeO/MpVQFGyjEHfsBimt7t4iUiJX\nsoMutFQ6IvcdAJwJk/U1yZhoGgW00m3NFzLerURVGP1NidZ5IK3E9uEF35fm53B2\nVnnUw30iFECQ6YntYlurb67tEpide9cJeCv+RGCpyDddHJ3y6RhFkKB6PVRQzKnN\nfwCSGoH9CQKBgQDCSgtOC9hmxCyhnOetrHHFlnOvGWYjYMaE2bsPfh3CbNAI3pdH\n+/TZ+BqoSHi2eKEJ6SqZyQBCJRZUqSwDLDbL+hoSNItQsot3zbGEm9Yuuj8qA0n/\ntRZaJJIpP+s8Ea4u0WfkbvpijWmkU/5RkY+tH1xmM76ac6it2LgQo6dDwQKBgBiv\n40wwRw2AW1fPHZE4CI2G1eWQFMTuKwFjSPDNfjwEnUNtSOxLtk0nwDl7Az1q1Gik\ndrSJwXpQ0AFqHR3Uw12OMdEMXoB/JWMTFHLS1bwPUmqKfRqXAChcv69+jNed6HgW\nE5YvFixqpbVFtE5JGrjJbv6IiTJ+vzapM3ALYH65AoGBAL9JdGUitKORLb1bInLa\nloeoDnwt2JtTHw2FkMt8zgNuiXUd6PJK1zYZG2hrUWL6yGI/OBvOI/S2WxpeZpCk\nvtMZwgPF4b1m0AYaBzBPrJaSOiuRhIA9hMuT7VyJnwCdzJZGPZHK6xn2cIVO/BLi\nSWarB9G9g5sJbR4nJEM0+dL9\n-----END PRIVATE KEY-----\n'.replace(/\\n/g, '\n'); // <-- I-paste ang buong private key kasama ang -----BEGIN PRIVATE KEY-----

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
