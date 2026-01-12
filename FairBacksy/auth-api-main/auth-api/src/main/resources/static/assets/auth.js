'use strict';

// PKCE utilities
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)).replace(/[+/=]/g, m => ({ '+': '-', '/': '_', '=': '' }[m]));
}

async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash))).replace(/[+/=]/g, m => ({ '+': '-', '/': '_', '=': '' }[m]));
}

function loginWithKeycloak() {
    const verifier = generateCodeVerifier();
    localStorage.setItem('code_verifier', verifier);
    console.log('PKCE login started, verifier stored');
    generateCodeChallenge(verifier).then(challenge => {
        const params = new URLSearchParams({
            client_id: 'forms-spa',
            redirect_uri: `${window.location.origin}/callback.html`,
            response_type: 'code',
            scope: 'openid',
            code_challenge: challenge,
            code_challenge_method: 'S256',
            state: 'login' // optional, for security
        });
        const authorizeUrl = `http://localhost:8080/realms/forms-realm/protocol/openid-connect/auth?${params}`;
        console.log('Redirecting to Keycloak authorize:', authorizeUrl);
        window.location.href = authorizeUrl;
    }).catch(err => {
        document.getElementById('message').textContent = 'Ошибка генерации PKCE';
        console.error(err);
    });
}

async function handleCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
        document.getElementById('message').textContent = `Ошибка авторизации: ${error}`;
        return;
    }

    if (!code) {
        document.getElementById('message').textContent = 'Код авторизации не получен';
        return;
    }

    const verifier = localStorage.getItem('code_verifier');
    if (!verifier) {
        document.getElementById('message').textContent = 'Code verifier не найден';
        console.error('Missing code_verifier in localStorage');
        return;
    }

    try {
        console.log('Exchanging code for tokens');
        const response = await fetch('/public/api/exchange-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, codeVerifier: verifier })
        });
        const body = await response.json();
        if (!response.ok) {
            throw new Error(body.error || 'Ошибка обмена кода');
        }
        console.log('Token exchange success', body);
        localStorage.setItem('access_token', body.accessToken);
        localStorage.setItem('refresh_token', body.refreshToken || '');
        localStorage.removeItem('code_verifier');
        document.getElementById('message').textContent = 'Авторизация успешна, перенаправление...';
        history.replaceState({}, document.title, '/callback.html');
        setTimeout(() => window.location.replace('/dashboard.html'), 800);
    } catch (err) {
        document.getElementById('message').textContent = err.message;
        console.error('Token exchange failed', err);
    }
}

function setupRegisterForm(endpoint) {
    const form = document.getElementById('register-form');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(body.error || 'Ошибка регистрации');
            }
            document.getElementById('message').textContent = 'Регистрация успешна. Теперь войдите.';
            form.reset();
        } catch (err) {
            document.getElementById('message').textContent = err.message;
        }
    });
}

function setupLoginButton() {
    const button = document.getElementById('login-button');
    if (!button) return;
    button.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Login button clicked');
        loginWithKeycloak();
    });
}

async function loadDashboard() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.warn('Access token not found, redirecting to login');
        document.getElementById('welcome').textContent = 'Токен не найден, перенаправление на вход...';
        setTimeout(() => window.location.href = '/login.html', 1200);
        return;
    }
    try {
        console.log('Loading dashboard, token prefix:', token.substring(0, 15));
        const response = await fetch('/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
            console.warn('Received 401 from /me, removing token');
            localStorage.removeItem('access_token');
            document.getElementById('welcome').textContent = 'Сессия истекла, перенаправление на вход...';
            window.location.href = '/login.html';
            return;
        }
        const body = await response.json();
        console.log('Dashboard data loaded', body);
        document.getElementById('welcome').textContent = `Добро пожаловать, ${body.email || body.sub}`;
        document.getElementById('roles').textContent = JSON.stringify(body.roles, null, 2);
    } catch (err) {
        console.error('Failed to load dashboard', err);
        document.getElementById('welcome').textContent = 'Не удалось загрузить данные';
    }
}

function logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login.html';
}
