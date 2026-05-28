// CONFIGURATION: Siguraduhing tama ang iyong mga keys dito
const SUPABASE_URL = "https://bgvmwfsjsikapooitcgp.supabase.co";
const SUPABASE_KEY = "sb_publishable_JB_7iuO8hlOPImnwTF-o9Q_DymLpH1N"; // <-- I-paste dito ang iyong anon public key

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMsg = document.getElementById('errorMsg');

        errorMsg.innerText = "Nagbe-verify...";

        try {
            // Direktang request sa Supabase Auth API nang hindi kailangan ang supabase.js library
            const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: "POST",
                headers: {
                    "apikey": SUPABASE_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error_description || data.message || "Maling login.");
            }

            // I-save ang login token ng user sa browser memory
            localStorage.setItem("erp_session", data.access_token);
            window.location.href = "/dashboard";

        } catch (error) {
            errorMsg.innerText = "Error: " + error.message;
        }
    });
}
