// --- FIREBASE IMPORTS ---
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
    
    // --- 1. DOM ELEMENTS ---
    const inputField = document.getElementById('fyber-input');
    const keypad = document.getElementById('keypad');
    const backspaceBtn = document.getElementById('backspace-btn');
    const loginBtn = document.getElementById('login-btn');
    
    // New Error Overlay Elements
    const errorOverlay = document.getElementById('error-overlay');
    const closeErrorBtn = document.getElementById('close-error-btn');

    // --- 2. HELPER FUNCTIONS ---

    // Function to Show Error Overlay
    function showErrorMessage() {
        if(errorOverlay) {
            errorOverlay.classList.add('active');
        }
    }

    // Function to Hide Error Overlay
    function hideErrorMessage() {
        if(errorOverlay) {
            errorOverlay.classList.remove('active');
            inputField.value = ""; // Clear input on retry
        }
    }

    // Function for Keypad Input
    function insertAtCursor(input, text) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentText = input.value;
        input.value = currentText.substring(0, start) + text + currentText.substring(end);
        input.setSelectionRange(start + 1, start + 1);
        input.focus();
    }

    // --- 3. EVENT LISTENERS (UI) ---

    // Keypad Logic
    if (keypad) {
        keypad.addEventListener('click', (e) => {
            const key = e.target.closest('.key');
            if (!key || key.classList.contains('backspace')) return;
            const value = key.getAttribute('data-value');
            if (value) insertAtCursor(inputField, value);
        });
    }

    // Backspace Logic
    if (backspaceBtn) {
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
    }

    // Error Overlay Closing Logic
    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', hideErrorMessage);
    }

    // Close if clicked outside the card
    if (errorOverlay) {
        errorOverlay.addEventListener('click', (e) => {
            if (e.target === errorOverlay) {
                hideErrorMessage();
            }
        });
    }

    // --- 4. LOGIN LOGIC (Firebase + Error Overlay) ---
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const enteredID = inputField.value.trim();

            if (!enteredID) {
                // If input is empty, maybe just focus or small alert
                // For now, let's just focus the input
                inputField.focus();
                return;
            }

            // UI Loading State
            const originalText = loginBtn.textContent;
            loginBtn.textContent = "..."; // Visual feedback during load
            loginBtn.disabled = true; // Prevent double clicks

            try {
                const dbRef = ref(db);
                // Fetch specific ID
                const snapshot = await get(child(dbRef, enteredID));

                if (snapshot.exists()) {
                    // --- SUCCESS ---
                    const userData = snapshot.val();
                    const userBalance = userData.balance; 
                    const userName = userData.username;

                    console.log(`User ${enteredID} logged in.`);

                    // Save Data
                    localStorage.setItem("fyber_current_id", enteredID);
                    localStorage.setItem("fyber_current_balance", userBalance);
                    localStorage.setItem("fyber_username", userName);

                    // Redirect
                    window.location.href = "dashboard.html"; 

                } else {
                    // --- FAIL (SHOW OVERLAY) ---
                    showErrorMessage(); // <--- REPLACED ALERT WITH THIS
                    
                    // Reset Button
                    loginBtn.textContent = originalText;
                    loginBtn.disabled = false;
                }

            } catch (error) {
                console.error("Firebase Login Error:", error);
                alert("Connection error. Please try again."); // Keep native alert for system errors
                loginBtn.textContent = originalText;
                loginBtn.disabled = false;
            }
        });
    }

    const overlayBackBtn = document.getElementById('overlay-back-btn');
    
    // Attach the hide function to the new arrow button
    if (overlayBackBtn) {
        overlayBackBtn.addEventListener('click', hideErrorMessage);
    }

    // ... inside DOMContentLoaded ...

    const noIdLink = document.getElementById('no-id-link'); // The text link
    const getIdBtn = document.getElementById('get-id-btn'); // The button in error card

    // Helper function to open link properly
    function openAdminChat() {
        const adminLink = "https://t.me/FYBER_TEAM";
        
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.openTelegramLink(adminLink);
        } else {
            window.location.href = adminLink;
        }
    }

    // Attach to the "Get ID" Button
    if (getIdBtn) {
        getIdBtn.addEventListener('click', openAdminChat);
    }

    // Attach to the "No ID?" Text Link
    if (noIdLink) {
        noIdLink.addEventListener('click', (e) => {
            e.preventDefault(); // Stop the # from jumping to top of page
            openAdminChat();
        });
    }

    // 1. Get the stored balance from Login (saved in previous step)
    // Default to 0 if nothing is found
    const rawBalance = localStorage.getItem("fyber_current_balance") || "0";
    
    // Clean the string (remove '$' or spaces if they exist in DB) to get a pure number
    const targetBalance = parseInt(rawBalance.toString().replace(/[^0-9]/g, ''), 10);
    
    // 2. Select the element
    const balanceElement = document.getElementById('balance-amount');

    if (balanceElement && targetBalance > 0) {
        animateValue(balanceElement, 0, targetBalance, 2000); // 2000ms = 2 seconds duration
    } else if (balanceElement) {
        // If balance is 0, just show it immediately
        balanceElement.textContent = "0 $";
    }

    // --- COUNTING FUNCTION ---
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            
            // Calculate progress (0 to 1)
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // --- THE MAGIC SAUCE (Easing Function) ---
            // This formula makes it start fast and slow down significantly at the end
            // "easeOutExpo" formula: 1 - Math.pow(2, -10 * progress)
            const easeProgress = (progress === 1) ? 1 : 1 - Math.pow(2, -10 * progress);

            // Calculate current number based on eased progress
            const currentVal = Math.floor(easeProgress * (end - start) + start);

            // Update HTML with formatting (e.g., 10 500 $)
            obj.textContent = currentVal.toLocaleString('ru-RU') + ' $';

            // Continue if not finished
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                // Ensure it ends on the exact number
                obj.textContent = end.toLocaleString('ru-RU') + ' $';
            }
        };

        window.requestAnimationFrame(step);
    }

});