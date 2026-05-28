// CONFIGURATION: Siguraduhing tama ang iyong mga keys dito
const SUPABASE_URL = "https://bgvmwfsjsikapooitcgp.supabase.co";
const SUPABASE_KEY = "sb_publishable_JB_7iuO8hlOPImnwTF-o9Q_DymLpH1N"; // <-- I-paste dito ang iyong anon public key

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

    // Event kapag nag-submit ng bagong produkto
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('prodName').value;
        const qty = document.getElementById('prodQty').value;
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
                body: JSON.stringify({ item_name: name, stock: parseInt(qty) })
            });
            if (!response.ok) throw new Error("Hindi mai-save ang item.");
            
            document.getElementById('productForm').reset();
            loadInventory();
        } catch (error) {
            alert(error.message);
        }
    });

    // Event para sa Log Out button
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
    inventoryTable.innerHTML = "<tr><td colspan='4'>Naglo-load ng mga data...</td></tr>";
    const token = localStorage.getItem("erp_session");

    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/inventory?select=*`, {
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
            inventoryTable.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Walang laman ang imbentaryo.</td></tr>";
            return;
        }

        data.forEach(item => {
            const row = `<tr>
                <td>${item.id}</td>
                <td>${item.item_name}</td>
                <td><b>${item.stock}</b> pcs</td>
                <td><button onclick="deleteItem(${item.id})" style="background: #ef4444; color: white; padding: 5px 10px; font-size: 12px; width: auto; margin:0; cursor:pointer; border:none; border-radius:4px;">Burahin</button></td>
            </tr>`;
            inventoryTable.innerHTML += row;
        });
    } catch (error) {
        inventoryTable.innerHTML = `<tr><td colspan='4'>Error: ${error.message}</td></tr>`;
    }
}

async function deleteItem(id) {
    if (confirm("Sigurado ka bang buburahin ito?")) {
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
