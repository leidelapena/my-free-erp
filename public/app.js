// LOGIN LOGIC (Pansamantalang simple muna para maka-access agad sa dashboard)
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem("erp_logged_in", "true");
        window.location.href = "/dashboard";
    });
}

// DASHBOARD LOGIC
const inventoryTable = document.getElementById('inventoryTable');
if (inventoryTable) {
    if (localStorage.getItem("erp_logged_in") !== "true") {
        window.location.href = "/";
    }
    loadInventory();

    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            category: document.getElementById('prodCategory').value,
            item_name: document.getElementById('prodName').value,
            uom: document.getElementById('prodUom').value,
            chiller: parseInt(document.getElementById('stockChiller').value) || 0,
            commissary: parseInt(document.getElementById('stockCommissary').value) || 0,
            dry_stock: parseInt(document.getElementById('stockDry').value) || 0,
            freezer: parseInt(document.getElementById('stockFreezer').value) || 0,
            packaging: parseInt(document.getElementById('stockPackaging').value) || 0,
            scrap: parseInt(document.getElementById('stockScrap').value) || 0
        };

        try {
            const response = await fetch('/api/inventory', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Gave error saving data.");
            
            document.getElementById('productForm').reset();
            // I-reset sa zero ang numbers pagkatapos mag-save
            document.getElementById('stockChiller').value = 0;
            document.getElementById('stockCommissary').value = 0;
            document.getElementById('stockDry').value = 0;
            document.getElementById('stockFreezer').value = 0;
            document.getElementById('stockPackaging').value = 0;
            document.getElementById('stockScrap').value = 0;

            loadInventory();
        } catch (error) {
            alert(error.message);
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem("erp_logged_in");
        window.location.href = "/";
    });
}

async function loadInventory() {
    inventoryTable.innerHTML = "<tr><td colspan='12' style='text-align:center;'>Kinukuha ang pinakabagong ulat mula sa Google Sheets...</td></tr>";

    try {
        const response = await fetch('https://onrender.com');
        const rows = await response.json();

        // ⚠️ PAG-CHECK: Kung may error na binalik ang server, ipakita ang mismong detalye nito
        if (rows.error) {
            throw new Error(rows.error);
        }

        // Siguraduhing listahan (array) ang natanggap bago mag-forEach
        if (!Array.isArray(rows)) {
            throw new Error("Maling format ng data ang nakuha mula sa server.");
        }

        inventoryTable.innerHTML = "";
        if (rows.length === 0) {
            inventoryTable.innerHTML = "<tr><td colspan='12' style='text-align:center;'>Walang laman ang iyong Google Sheet. Magsimula gamit ang form sa itaas.</td></tr>";
            return;
        }

        rows.forEach((row, index) => {
            const tr = `<tr>
                <td>${index + 1}</td>
                <td><span class="category-badge">${row[0] || ''}</span></td>
                <td><b>${row[1] || ''}</b></td>
                <td>${row[2] || ''}</td>
                <td>${row[3] || 0}</td>
                <td>${row[4] || 0}</td>
                <td>${row[5] || 0}</td>
                <td>${row[6] || 0}</td>
                <td>${row[7] || 0}</td>
                <td>${row[8] || 0}</td>
                <td class="total-cell">${row[9] || 0}</td>
                <td><span style="color:var(--text-muted); font-size:11px;">Naka-save</span></td>
            </tr>`;
            inventoryTable.innerHTML += tr;
        });
    } catch (error) {
        inventoryTable.innerHTML = `<tr><td colspan='12' style='color:var(--accent-red); text-align:center; font-weight:bold;'>Error sa pag-load: ${error.message}</td></tr>`;
    }
}
