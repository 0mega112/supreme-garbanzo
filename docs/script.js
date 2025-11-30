document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. UI LOGIC ---
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

    // --- 2. LOGIN LOGIC ---
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
            // Fetch the JSON file
            // ПРИМІТКА: Якщо ви на GitHub Pages, тут краще вказати повне посилання:
            // https://ваш-нік.github.io/репо/json_handler/balances.json
            const response = await fetch('../json_handler/balances.json');
            
            if (!response.ok) {
                throw new Error("Could not connect to database");
            }

            const balancesData = await response.json();

            if (balancesData.hasOwnProperty(enteredID)) {
                
                // SUCCESS
                const userData = balancesData[enteredID]; // This is now an object
                const userBalance = userData.balance;     // Get balance
                const userName = userData.username;       // Get username
                console.log(`User ${enteredID} logged in.`);

                // Save to localStorage
                localStorage.setItem("fyber_current_id", enteredID);
                localStorage.setItem("fyber_current_balance", userBalance);
                localStorage.setItem("fyber_username", userName);

                // Redirect
                window.location.href = "dashboard.html"; 

            } else {
                // FAIL
                alert("❌ Invalid ID\nUser not found.");
                inputField.value = ""; 
                loginBtn.textContent = originalText;
            }

        } catch (error) {
            console.error(error);
            alert("Connection error (check console)");
            loginBtn.textContent = originalText;
        }
    });
});