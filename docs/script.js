// --- FIREBASE IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, child, get } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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

const auth = getAuth(app);
signInAnonymously(auth).catch(() => {});

const tg = window.Telegram.WebApp;
tg.expand();

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 2. DOM ELEMENTS ---
    const inputField = document.getElementById('fyber-input');
    const keypad = document.getElementById('keypad');
    const backspaceBtn = document.getElementById('backspace-btn');
    const loginBtn = document.getElementById('login-btn');
    
    // Error Overlay Elements
    const errorOverlay = document.getElementById('error-overlay');
    const closeErrorBtn = document.getElementById('close-error-btn');
    const overlayBackBtn = document.getElementById('overlay-back-btn');

    // --- 3. HELPER FUNCTIONS ---

    function showErrorMessage() {
        if(errorOverlay) errorOverlay.classList.add('active');
    }

    function hideErrorMessage() {
        if(errorOverlay) {
            errorOverlay.classList.remove('active');
            inputField.value = ""; 
        }
    }

    function insertAtCursor(input, text) {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentText = input.value;
        input.value = currentText.substring(0, start) + text + currentText.substring(end);
        input.setSelectionRange(start + 1, start + 1);
        input.focus();
    }

    // --- 4. EVENT LISTENERS (UI) ---

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
    if (closeErrorBtn) closeErrorBtn.addEventListener('click', hideErrorMessage);
    if (overlayBackBtn) overlayBackBtn.addEventListener('click', hideErrorMessage);
    if (errorOverlay) {
        errorOverlay.addEventListener('click', (e) => {
            if (e.target === errorOverlay) hideErrorMessage();
        });
    }

    // --- 5. LOGIN LOGIC (UPDATED FOR NICKNAME) ---
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const enteredID = inputField.value.trim();

            if (!enteredID) {
                inputField.focus();
                return;
            }

            // UI Loading State
            const originalText = loginBtn.textContent;
            loginBtn.textContent = "..."; 
            loginBtn.disabled = true; 

            try {
                // const dbRef = ref(db);
                const dbRef = ref(db, 'balances');
                // Fetch specific ID
                const snapshot = await get(child(dbRef, enteredID));

                if (snapshot.exists()) {
                    // --- SUCCESS ---
                    const userData = snapshot.val();
                    const userBalance = userData.balance; 
                    
                    // --- UPDATED IMPLEMENTATION ---
                    
                    // 1. Try to get NICKNAME from Database first (was username)
                    let finalNickname = userData.nickname;

                    // 2. If Database has no nickname, try Telegram WebApp data
                    // if (!finalNickname && tg.initDataUnsafe && tg.initDataUnsafe.user) {
                    //     const tgUser = tg.initDataUnsafe.user;
                    //     // Use Username, fallback to First Name, fallback to "User"
                    //     finalNickname = tgUser.username || tgUser.first_name || "User";
                    // }

                    // 3. Absolute fallback
                    if (!finalNickname) finalNickname = userData.username;

                    console.log(`User ${enteredID} logged in as ${finalNickname}.`);

                    // Save Data to LocalStorage
                    localStorage.setItem("fyber_current_id", enteredID); 
                    localStorage.setItem("fyber_current_balance", userBalance);
                    // Updated Key to fyber_nickname
                    localStorage.setItem("fyber_nickname", finalNickname); 

                    // --- IMPLEMENTATION END ---

                    // Redirect
                    window.location.href = "dashboard.html"; 

                } else {
                    // --- FAIL ---
                    showErrorMessage();
                    loginBtn.textContent = originalText;
                    loginBtn.disabled = false;
                }

            } catch (error) {
                console.error("Firebase Login Error:", error);
                alert("Connection error. Please try again.");
                loginBtn.textContent = originalText;
                loginBtn.disabled = false;
            }
        });
    }

    // --- 6. ADMIN LINKS & ANIMATIONS ---

    const noIdLink = document.getElementById('no-id-link'); 
    const getIdBtn = document.getElementById('get-id-btn'); 

    function openAdminChat() {
        const adminLink = "https://t.me/TEAM_FYBER";
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.openTelegramLink(adminLink);
        } else {
            window.location.href = adminLink;
        }
    }

    if (getIdBtn) getIdBtn.addEventListener('click', openAdminChat);
    if (noIdLink) {
        noIdLink.addEventListener('click', (e) => {
            e.preventDefault(); 
            openAdminChat();
        });
    }

    // Balance Animation Logic
    const rawBalance = localStorage.getItem("fyber_current_balance") || "0";
    const targetBalance = parseInt(rawBalance.toString().replace(/[^0-9]/g, ''), 10);
    const balanceElement = document.getElementById('balance-amount');

    if (balanceElement && targetBalance > 0) {
        animateValue(balanceElement, 0, targetBalance, 2000); 
    } else if (balanceElement) {
        balanceElement.textContent = "0 $";
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = (progress === 1) ? 1 : 1 - Math.pow(2, -10 * progress);
            const currentVal = Math.floor(easeProgress * (end - start) + start);
            obj.textContent = currentVal.toLocaleString('ru-RU') + ' $';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.textContent = end.toLocaleString('ru-RU') + ' $';
            }
        };
        window.requestAnimationFrame(step);
    }
});
