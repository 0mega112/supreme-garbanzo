// --- FIREBASE IMPORTS (Must be at the top) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, child, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// --- CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyBWKNOFsaM0VIwZCgz-fxocwjkAY72mefg",
    authDomain: "fyber-mini-app.firebaseapp.com",
    databaseURL: "https://fyber-mini-app-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "fyber-mini-app",
    storageBucket: "fyber-mini-app.firebasestorage.app",
    messagingSenderId: "622613200958",
    appId: "1:622613200958:web:061496e31f2bafd352516f",
    measurementId: "G-C720SK2JKJ"
};

// --- INITIALIZE FIREBASE ---
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. UI LOGIC (Kept exactly the same) ---
    const inputField = document.getElementById('fyber-input');
    const keypad = document.getElementById('keypad');
    const backspaceBtn = document.getElementById('backspace-btn');
    const loginBtn = document.getElementById('login-btn');

    // Keypad Logic
    keypad.addEventListener('click', (e) => {
        const key = e.target.closest('.key');
        if (!key || key.classList.contains('backspace')) return;
        const value = key.getAttribute('data-value');
        if (value) insertAtCursor(inputField, value);
    });

    backspaceBtn.addEventListener('click', () => {
        const start = inputField.selectionStart;
        const end = inputField.selectionEnd;
        const currentText = inputField.value;
        if (start !== end) {
            inputField.value = currentText.substring(0, start) + currentText.substring(end);
            inputField.setSelectionRange(start, start);
        } else if (start > 0) {
            inputField.value = currentText.substring(0, start - 1) + currentText.substring(end);
            inputField.setSelectionRange(start - 1, start - 1);
        }
        inputField.focus();
    });

    function insertAtCursor(input, text) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentText = input.value;
        input.value = currentText.substring(0, start) + text + currentText.substring(end);
        input.setSelectionRange(start + 1, start + 1);
        input.focus();
    }

    // --- 2. LOGIN LOGIC (Updated for Firebase) ---
    loginBtn.addEventListener('click', async () => {
        const enteredID = inputField.value.trim();

        if (!enteredID) {
            alert("Please enter ID");
            return;
        }

        // Show loading state
        const originalText = loginBtn.textContent;
        loginBtn.textContent = "Checking...";

        try {
            // Reference to the database root
            const dbRef = ref(db);
            
            // fetch ONLY the specific ID node (more efficient/secure than downloading the whole DB)
            const snapshot = await get(child(dbRef, enteredID));

            if (snapshot.exists()) {
                // SUCCESS
                const userData = snapshot.val();
                
                // Extract data (handling the object structure from Python)
                const userBalance = userData.balance; 
                const userName = userData.username;

                console.log(`User ${enteredID} logged in.`);

                // Save to localStorage
                localStorage.setItem("fyber_current_id", enteredID);
                localStorage.setItem("fyber_current_balance", userBalance);
                localStorage.setItem("fyber_username", userName);

                // Redirect
                window.location.href = "dashboard.html"; 

            } else {
                // FAIL (ID does not exist in Firebase)
                alert("❌ Invalid ID\nUser not found.");
                inputField.value = ""; 
                loginBtn.textContent = originalText;
            }

        } catch (error) {
            console.error("Firebase Login Error:", error);
            alert("Connection error. Please try again.");
            loginBtn.textContent = originalText;
        }
    });
});