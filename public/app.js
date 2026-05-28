// CONFIGURATION: Siguraduhing tama ang iyong mga keys dito
const SUPABASE_URL = 'https://bgvmwfsjsikapooitcgp.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JB_7iuO8hlOPImnwTF-o9Q_DymLpH1N'; // <-- I-paste dito ang iyong anon public key

// LOGIN LOGIC
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.innerText = "Nagbe-verify...";

        try {
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: "POST",
                headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error_description || data.message || "Maling login.");

            localStorage.setItem("erp_session", data.access_token);
            window.location.href = "/dashboard";
        } catch (error) {
            errorMsg.innerText = "Error: " + error.message;
        }
    });
}

// DASHBOARD LOGIC
const inventoryTable = document.getElementById('inventoryTable');
if (inventoryTable) {
    checkUser();
    loadInventory();

    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('prodCategory').value;
        const name = document.getElementById('prodName').value;
        const uom = document.getElementById('prodUom').value;
        
        const chiller = parseInt(document.getElementById('stockChiller').value) || 0;
        const commissary = parseInt(document.getElementById('stockCommissary').value) || 0;
        const dry_stock = parseInt(document.getElementById('stockDry').value) || 0;
        const freezer = parseInt(document.getElementById('stockFreezer').value) || 0;
        const packaging = parseInt(document.getElementById('stockPackaging').value) || 0;
        const scrap = parseInt(document.getElementById('stockScrap').value) || 0;

        const token = localStorage.getItem("erp_session");

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/inventory`, {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                body: JSON.stringify({ 
                    category, 
                    item_name: name, 
                    uom, 
                    chiller, 
                    commissary, 
                    dry_stock, 
                    freezer, 
                    packaging, 
                    scrap 
                })
            });
            if (!response.ok) throw new Error("Hindi mai-save ang aytem sa database.");
            
            document.getElementById('productForm').reset();
            // I-reset sa default zero ang mga number fields pagkatapos mag-save
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
        localStorage.removeItem("erp_session");
        window.location.href = "/";
    });
}

function checkUser() {
    const token = localStorage.getItem("erp_session");
    if (!token) window.location.href = "/";
}

async function loadInventory() {
    inventoryTable.innerHTML = "<tr><td colspan='12' style='text-align:center;'>Kinukuha ang pinakabagong report...</td></tr>";
    const token = localStorage.getItem("erp_session");

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*&order=id.asc`, {
            method: "GET",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);

        inventoryTable.innerHTML = "";
        if (data.length === 0) {
            inventoryTable.innerHTML = "<tr><td colspan='12' style='text-align:center;'>Walang laman ang imbentaryo. Magsimula sa pamamagitan ng form sa itaas.</td></tr>";
            return;
        }

        data.forEach((item, index) => {
            // Awtomatikong pagkalkula ng kabuuan tulad ng formula sa Google Sheets
            const totalQty = (item.chiller || 0) + (item.commissary || 0) + (item.dry_stock || 0) + (item.freezer || 0) + (item.packaging || 0) + (item.scrap || 0);

            const row = `<tr>
                <td>${index + 1}</td>
                <td style='color: #38bdf8; font-weight: bold;'>${item.category || 'N/A'}</td>
                <td><b>${item.item_name}</b></td>
                <td>${item.uom || 'PCS'}</td>
                <td>${item.chiller || 0}</td>
                <td>${item.commissary || 0}</td>
                <td>${item.dry_stock || 0}</td>
                <td>${item.freezer || 0}</td>
                <td>${item.packaging || 0}</td>
                <td>${item.scrap || 0}</td>
                <td style='background-color: #0f172a; font-weight: bold; color: #10b981;'>${totalQty}</td>
                <td><button onclick="deleteItem(${item.id})" style="background: #ef4444; color: white; padding: 4px 8px; font-size: 11px; width: auto; margin:0; cursor:pointer; border:none; border-radius:4px;">Burahin</button></td>
            </tr>`;
            inventoryTable.innerHTML += row;
        });
    } catch (error) {
        inventoryTable.innerHTML = `<tr><td colspan='12' style='color:#ef4444;'>Error: ${error.message}</td></tr>`;
    }
}

async function deleteItem(id) {
    if (confirm("Sigurado ka bang buburahin ang item na ito sa ulat?")) {
        const token = localStorage.getItem("erp_session");
        await fetch(`${SUPABASE_URL}/rest/v1/inventory?id=eq.${id}`, {
            method: "DELETE",
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${token}`
            }
        });
        loadInventory();
    }
}
