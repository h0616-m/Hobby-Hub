const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;
        const messageEl = document.getElementById('message');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usernameInput,
                    password: passwordInput
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Success: ' + data.message);
                window.location.href = '/dashboard.html';
            } else {
                messageEl.innerText = data.message;
            }
        } catch (err) {
            messageEl.innerText = 'Unable to connect to backend server.';
        }
    });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = document.getElementById('username').value;
        const passwordInput = document.getElementById('password').value;
        const messageEl = document.getElementById('message');

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: usernameInput,
                    password: passwordInput
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('Success: ' + data.message);
                window.location.href = '/login.html';
            } else {
                messageEl.innerText = data.message;
            }
        } catch (err) {
            messageEl.innerText = 'Unable to connect to backend server.';
        }
    });
}