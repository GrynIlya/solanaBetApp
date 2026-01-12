<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false displayMessage=!messagesPerField.existsError('username','password'); section>
    <#if section = "header">
        <#-- Header уже в template.ftl -->
    <#elseif section = "form">
        <#-- Logo -->
        <div class="logo-container">
            <svg width="240" height="96" viewBox="0 0 450 160" fill="none" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
                <defs>
                    <radialGradient id="logo-coreGradient">
                        <stop offset="0%" stop-color="#FFD600" />
                        <stop offset="100%" stop-color="#FF6F00" />
                    </radialGradient>
                    <linearGradient id="logo-textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#1e3a8a" />
                        <stop offset="50%" stop-color="#3b82f6" />
                        <stop offset="100%" stop-color="#60a5fa" />
                    </linearGradient>
                    <linearGradient id="logo-textShine" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="transparent" />
                        <stop offset="30%" stop-color="transparent" />
                        <stop offset="40%" stop-color="#60a5fa" stop-opacity="0.6" />
                        <stop offset="48%" stop-color="#ffffff" stop-opacity="0.95" />
                        <stop offset="50%" stop-color="#ffffff" stop-opacity="1" />
                        <stop offset="52%" stop-color="#ffffff" stop-opacity="0.95" />
                        <stop offset="60%" stop-color="#60a5fa" stop-opacity="0.6" />
                        <stop offset="70%" stop-color="transparent" />
                        <stop offset="100%" stop-color="transparent" />
                        <animate attributeName="x1" values="-100%;200%" dur="3s" repeatCount="indefinite" calcMode="linear" />
                        <animate attributeName="x2" values="0%;300%" dur="3s" repeatCount="indefinite" calcMode="linear" />
                    </linearGradient>
                    <style>
                        @keyframes logo-orbit-rotate {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        .logo-orbit-group {
                            transform-origin: 70px 70px;
                            animation: logo-orbit-rotate linear infinite;
                        }
                        .logo-orbit-0 { animation-duration: 20s; }
                        .logo-orbit-1 { animation-duration: 15s; }
                        .logo-orbit-2 { animation-duration: 12s; }
                        .logo-orbit-3 { animation-duration: 10s; }
                        .logo-orbit-4 { animation-duration: 8s; }
                        @keyframes logo-pulse {
                            0%, 100% { opacity: 0.9; }
                            50% { opacity: 1; }
                        }
                        .logo-core-pulse { animation: logo-pulse 2s ease-in-out infinite; }
                    </style>
                </defs>
                
                <!-- Outer orbit (36 particles) -->
                <g class="logo-orbit-group logo-orbit-0">
                    <circle cx="112.00" cy="70.00" r="2.5" fill="#FF1744" opacity="0.85" />
                    <circle cx="111.36" cy="77.29" r="2.5" fill="#FF1744" opacity="0.85" />
                    <circle cx="109.47" cy="84.36" r="2.5" fill="#FF1744" opacity="0.85" />
                    <circle cx="106.37" cy="91.00" r="2.5" fill="#FF3D00" opacity="0.85" />
                    <circle cx="102.17" cy="97.00" r="2.5" fill="#FF3D00" opacity="0.85" />
                    <circle cx="97.00" cy="102.17" r="2.5" fill="#FF6F00" opacity="0.85" />
                    <circle cx="91.00" cy="106.37" r="2.5" fill="#FF6F00" opacity="0.85" />
                    <circle cx="84.36" cy="109.47" r="2.5" fill="#FF6F00" opacity="0.85" />
                    <circle cx="77.29" cy="111.36" r="2.5" fill="#FF9100" opacity="0.85" />
                    <circle cx="70.00" cy="112.00" r="2.5" fill="#FF9100" opacity="0.85" />
                    <circle cx="62.71" cy="111.36" r="2.5" fill="#FFAB00" opacity="0.85" />
                    <circle cx="55.64" cy="109.47" r="2.5" fill="#FFAB00" opacity="0.85" />
                    <circle cx="49.00" cy="106.37" r="2.5" fill="#FFD600" opacity="0.85" />
                    <circle cx="43.00" cy="102.17" r="2.5" fill="#FFD600" opacity="0.85" />
                    <circle cx="37.83" cy="97.00" r="2.5" fill="#FFD600" opacity="0.85" />
                    <circle cx="33.63" cy="91.00" r="2.5" fill="#FFEA00" opacity="0.85" />
                    <circle cx="30.53" cy="84.36" r="2.5" fill="#FFEA00" opacity="0.85" />
                    <circle cx="28.64" cy="77.29" r="2.5" fill="#FFC400" opacity="0.85" />
                    <circle cx="28.00" cy="70.00" r="2.5" fill="#FFC400" opacity="0.85" />
                    <circle cx="28.64" cy="62.71" r="2.5" fill="#FFC400" opacity="0.85" />
                    <circle cx="30.53" cy="55.64" r="2.5" fill="#FF9E80" opacity="0.85" />
                    <circle cx="33.63" cy="49.00" r="2.5" fill="#FF9E80" opacity="0.85" />
                    <circle cx="37.83" cy="43.00" r="2.5" fill="#FF6E40" opacity="0.85" />
                    <circle cx="43.00" cy="37.83" r="2.5" fill="#FF6E40" opacity="0.85" />
                    <circle cx="49.00" cy="33.63" r="2.5" fill="#FF4081" opacity="0.85" />
                    <circle cx="55.64" cy="30.53" r="2.5" fill="#FF4081" opacity="0.85" />
                    <circle cx="62.71" cy="28.64" r="2.5" fill="#FF4081" opacity="0.85" />
                    <circle cx="70.00" cy="28.00" r="2.5" fill="#F50057" opacity="0.85" />
                    <circle cx="77.29" cy="28.64" r="2.5" fill="#F50057" opacity="0.85" />
                    <circle cx="84.36" cy="30.53" r="2.5" fill="#E91E63" opacity="0.85" />
                    <circle cx="91.00" cy="33.63" r="2.5" fill="#E91E63" opacity="0.85" />
                    <circle cx="97.00" cy="37.83" r="2.5" fill="#E91E63" opacity="0.85" />
                    <circle cx="102.17" cy="43.00" r="2.5" fill="#FF1744" opacity="0.85" />
                    <circle cx="106.37" cy="49.00" r="2.5" fill="#FF1744" opacity="0.85" />
                    <circle cx="109.47" cy="55.64" r="2.5" fill="#FF5252" opacity="0.85" />
                    <circle cx="111.36" cy="62.71" r="2.5" fill="#FF5252" opacity="0.85" />
                </g>
                
                <!-- Second orbit (30 particles) -->
                <g class="logo-orbit-group logo-orbit-1">
                    <circle cx="102.48" cy="80.05" r="2.3" fill="#FF1744" opacity="0.85" />
                    <circle cx="99.68" cy="86.58" r="2.3" fill="#FF1744" opacity="0.85" />
                    <circle cx="95.59" cy="92.39" r="2.3" fill="#FF3D00" opacity="0.85" />
                    <circle cx="90.37" cy="97.22" r="2.3" fill="#FF3D00" opacity="0.85" />
                    <circle cx="84.27" cy="100.86" r="2.3" fill="#FF6F00" opacity="0.85" />
                    <circle cx="77.54" cy="103.15" r="2.3" fill="#FF6F00" opacity="0.85" />
                    <circle cx="70.48" cy="104.00" r="2.3" fill="#FF9100" opacity="0.85" />
                    <circle cx="63.40" cy="103.35" r="2.3" fill="#FF9100" opacity="0.85" />
                    <circle cx="56.61" cy="101.25" r="2.3" fill="#FFAB00" opacity="0.85" />
                    <circle cx="50.41" cy="97.79" r="2.3" fill="#FFAB00" opacity="0.85" />
                    <circle cx="45.06" cy="93.11" r="2.3" fill="#FFD600" opacity="0.85" />
                    <circle cx="40.80" cy="87.42" r="2.3" fill="#FFD600" opacity="0.85" />
                    <circle cx="37.82" cy="80.96" r="2.3" fill="#FFEA00" opacity="0.85" />
                    <circle cx="36.24" cy="74.03" r="2.3" fill="#FFEA00" opacity="0.85" />
                    <circle cx="36.14" cy="66.93" r="2.3" fill="#FFC400" opacity="0.85" />
                    <circle cx="37.52" cy="59.95" r="2.3" fill="#FFC400" opacity="0.85" />
                    <circle cx="40.32" cy="53.42" r="2.3" fill="#FF9E80" opacity="0.85" />
                    <circle cx="44.41" cy="47.61" r="2.3" fill="#FF9E80" opacity="0.85" />
                    <circle cx="49.63" cy="42.78" r="2.3" fill="#FF6E40" opacity="0.85" />
                    <circle cx="55.73" cy="39.14" r="2.3" fill="#FF6E40" opacity="0.85" />
                    <circle cx="62.46" cy="36.85" r="2.3" fill="#FF4081" opacity="0.85" />
                    <circle cx="69.52" cy="36.00" r="2.3" fill="#FF4081" opacity="0.85" />
                    <circle cx="76.60" cy="36.65" r="2.3" fill="#F50057" opacity="0.85" />
                    <circle cx="83.39" cy="38.75" r="2.3" fill="#F50057" opacity="0.85" />
                    <circle cx="89.59" cy="42.21" r="2.3" fill="#E91E63" opacity="0.85" />
                    <circle cx="94.94" cy="46.89" r="2.3" fill="#E91E63" opacity="0.85" />
                    <circle cx="99.20" cy="52.58" r="2.3" fill="#FF1744" opacity="0.85" />
                    <circle cx="102.18" cy="59.04" r="2.3" fill="#FF1744" opacity="0.85" />
                    <circle cx="103.76" cy="65.97" r="2.3" fill="#FF5252" opacity="0.85" />
                    <circle cx="103.86" cy="73.07" r="2.3" fill="#FF5252" opacity="0.85" />
                </g>
                
                <!-- Third orbit (24 particles) -->
                <g class="logo-orbit-group logo-orbit-2">
                    <circle cx="91.46" cy="84.68" r="2.1" fill="#FF1744" opacity="0.85" />
                    <circle cx="86.93" cy="89.73" r="2.1" fill="#FF1744" opacity="0.85" />
                    <circle cx="81.24" cy="93.44" r="2.1" fill="#FF3D00" opacity="0.85" />
                    <circle cx="74.79" cy="95.55" r="2.1" fill="#FF3D00" opacity="0.85" />
                    <circle cx="68.02" cy="95.92" r="2.1" fill="#FF6F00" opacity="0.85" />
                    <circle cx="61.37" cy="94.53" r="2.1" fill="#FF9100" opacity="0.85" />
                    <circle cx="55.32" cy="91.46" r="2.1" fill="#FF9100" opacity="0.85" />
                    <circle cx="50.27" cy="86.93" r="2.1" fill="#FFAB00" opacity="0.85" />
                    <circle cx="46.56" cy="81.24" r="2.1" fill="#FFD600" opacity="0.85" />
                    <circle cx="44.45" cy="74.79" r="2.1" fill="#FFD600" opacity="0.85" />
                    <circle cx="44.08" cy="68.02" r="2.1" fill="#FFEA00" opacity="0.85" />
                    <circle cx="45.47" cy="61.37" r="2.1" fill="#FFEA00" opacity="0.85" />
                    <circle cx="48.54" cy="55.32" r="2.1" fill="#FFC400" opacity="0.85" />
                    <circle cx="53.07" cy="50.27" r="2.1" fill="#FF9E80" opacity="0.85" />
                    <circle cx="58.76" cy="46.56" r="2.1" fill="#FF9E80" opacity="0.85" />
                    <circle cx="65.21" cy="44.45" r="2.1" fill="#FF6E40" opacity="0.85" />
                    <circle cx="71.98" cy="44.08" r="2.1" fill="#FF4081" opacity="0.85" />
                    <circle cx="78.63" cy="45.47" r="2.1" fill="#FF4081" opacity="0.85" />
                    <circle cx="84.68" cy="48.54" r="2.1" fill="#F50057" opacity="0.85" />
                    <circle cx="89.73" cy="53.07" r="2.1" fill="#F50057" opacity="0.85" />
                    <circle cx="93.44" cy="58.76" r="2.1" fill="#E91E63" opacity="0.85" />
                    <circle cx="95.55" cy="65.21" r="2.1" fill="#FF1744" opacity="0.85" />
                    <circle cx="95.92" cy="71.98" r="2.1" fill="#FF1744" opacity="0.85" />
                    <circle cx="94.53" cy="78.63" r="2.1" fill="#FF5252" opacity="0.85" />
                </g>
                
                <!-- Fourth orbit (18 particles) -->
                <g class="logo-orbit-group logo-orbit-3">
                    <circle cx="81.19" cy="84.10" r="1.9" fill="#FF1744" opacity="0.85" />
                    <circle cx="75.69" cy="87.08" r="1.9" fill="#FF1744" opacity="0.85" />
                    <circle cx="69.51" cy="87.99" r="1.9" fill="#FF3D00" opacity="0.85" />
                    <circle cx="63.38" cy="86.74" r="1.9" fill="#FF6F00" opacity="0.85" />
                    <circle cx="58.06" cy="83.47" r="1.9" fill="#FF9100" opacity="0.85" />
                    <circle cx="54.17" cy="78.57" r="1.9" fill="#FFAB00" opacity="0.85" />
                    <circle cx="52.19" cy="72.64" r="1.9" fill="#FFD600" opacity="0.85" />
                    <circle cx="52.37" cy="66.39" r="1.9" fill="#FFD600" opacity="0.85" />
                    <circle cx="54.66" cy="60.58" r="1.9" fill="#FFEA00" opacity="0.85" />
                    <circle cx="58.81" cy="55.90" r="1.9" fill="#FFC400" opacity="0.85" />
                    <circle cx="64.31" cy="52.92" r="1.9" fill="#FF9E80" opacity="0.85" />
                    <circle cx="70.49" cy="52.01" r="1.9" fill="#FF6E40" opacity="0.85" />
                    <circle cx="76.62" cy="53.26" r="1.9" fill="#FF4081" opacity="0.85" />
                    <circle cx="81.94" cy="56.53" r="1.9" fill="#FF4081" opacity="0.85" />
                    <circle cx="85.83" cy="61.43" r="1.9" fill="#F50057" opacity="0.85" />
                    <circle cx="87.81" cy="67.36" r="1.9" fill="#E91E63" opacity="0.85" />
                    <circle cx="87.63" cy="73.61" r="1.9" fill="#FF1744" opacity="0.85" />
                    <circle cx="85.34" cy="79.42" r="1.9" fill="#FF5252" opacity="0.85" />
                </g>
                
                <!-- Inner orbit (12 particles) -->
                <g class="logo-orbit-group logo-orbit-4">
                    <circle cx="73.62" cy="79.32" r="1.7" fill="#FF1744" opacity="0.85" />
                    <circle cx="68.48" cy="79.88" r="1.7" fill="#FF3D00" opacity="0.85" />
                    <circle cx="63.74" cy="77.80" r="1.7" fill="#FF6F00" opacity="0.85" />
                    <circle cx="60.68" cy="73.62" r="1.7" fill="#FF9100" opacity="0.85" />
                    <circle cx="60.12" cy="68.48" r="1.7" fill="#FFD600" opacity="0.85" />
                    <circle cx="62.20" cy="63.74" r="1.7" fill="#FFEA00" opacity="0.85" />
                    <circle cx="66.38" cy="60.68" r="1.7" fill="#FFC400" opacity="0.85" />
                    <circle cx="71.52" cy="60.12" r="1.7" fill="#FF9E80" opacity="0.85" />
                    <circle cx="76.26" cy="62.20" r="1.7" fill="#FF4081" opacity="0.85" />
                    <circle cx="79.32" cy="66.38" r="1.7" fill="#F50057" opacity="0.85" />
                    <circle cx="79.88" cy="71.52" r="1.7" fill="#E91E63" opacity="0.85" />
                    <circle cx="77.80" cy="76.26" r="1.7" fill="#FF1744" opacity="0.85" />
                </g>
                
                <!-- Center core -->
                <circle cx="70" cy="70" r="4" fill="url(#logo-coreGradient)" opacity="0.9" class="logo-core-pulse" />
                
                <!-- Company name -->
                <text x="128" y="85" font-family="'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="48" font-weight="700" fill="url(#logo-textGradient)">FairBacksy</text>
                <text x="128" y="85" font-family="'Archivo', 'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="48" font-weight="700" fill="url(#logo-textShine)" opacity="0.8">FairBacksy</text>
            </svg>
        </div>

        <#-- Сообщение об ошибке (рендерится сервером, если есть) -->
        <#if message?has_content && message.type == 'error'>
            <div class="form-group error-message-group" style="display: block; opacity: 1; max-height: 200px;">
                <div class="error-message-text">
                    ${kcSanitize(message.summary)?no_esc}
                </div>
            </div>
        </#if>

        <form id="kc-form-login" action="${url.loginAction}" method="post">
            <#if auth.selectedCredential?has_content>
                <input type="hidden" id="id-hidden-input" name="credentialId" value="${auth.selectedCredential}"/>
            </#if>

            <div class="form-group">
                <input 
                    tabindex="1" 
                    id="username" 
                    class="form-control" 
                    name="username" 
                    value="${(auth.attemptedUsername!'')}" 
                    type="email" 
                    placeholder="Email" 
                    autofocus 
                    autocomplete="off"
                />
            </div>

            <div class="form-group password-group" style="display: none; opacity: 0;">
                <div style="position: relative;">
                    <input 
                        tabindex="2" 
                        id="password" 
                        class="form-control" 
                        name="password" 
                        type="password" 
                        placeholder="Password" 
                        autocomplete="off"
                    />
                    <button 
                        type="button" 
                        class="password-toggle" 
                        id="password-toggle"
                        aria-label="Show password"
                    >
                        <svg class="password-icon-eye" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        <svg class="password-icon-eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    </button>
                </div>
            </div>

            <div class="form-group forgot-password-group">
                <a href="${url.loginResetCredentialsUrl}" class="register-link">Forgot password?</a>
            </div>

            <div class="form-group login-submit">
                <input tabindex="3" class="btn btn-primary btn-block btn-lg" name="login" id="kc-login" type="submit" value="Sign In"/>
            </div>

            <div class="kc-register-link">
                <a href="http://localhost:5173/register" class="register-link">Don't have an account? Create Account</a>
            </div>
        </form>

        <script>
            (function() {
                const emailInput = document.getElementById('username');
                const passwordGroup = document.querySelector('.password-group');
                const passwordInput = document.getElementById('password');
                const forgotPasswordGroup = document.querySelector('.forgot-password-group');
                const errorMessageGroup = document.querySelector('.error-message-group');
                const form = document.getElementById('kc-form-login');
                let failedAttempts = parseInt(sessionStorage.getItem('failedLoginAttempts') || '0', 10);

                // Email validation regex
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                // Restore email and password from sessionStorage
                const savedEmail = sessionStorage.getItem('savedEmail');
                const savedPassword = sessionStorage.getItem('savedPassword');
                if (savedEmail) {
                    emailInput.value = savedEmail;
                }
                if (savedPassword && passwordInput) {
                    passwordInput.value = savedPassword;
                }

                // Show password field if email is valid
                function checkEmail() {
                    const email = emailInput.value.trim();
                    const isValid = emailRegex.test(email);
                    
                    if (isValid) {
                        passwordGroup.style.display = 'block';
                        setTimeout(() => {
                            passwordGroup.style.opacity = '1';
                        }, 10);
                    } else {
                        passwordGroup.style.opacity = '0';
                        setTimeout(() => {
                            passwordGroup.style.display = 'none';
                        }, 300);
                    }
                }

                // Show forgot password after 2 failed attempts
                if (failedAttempts >= 2) {
                    forgotPasswordGroup.style.display = 'block';
                    forgotPasswordGroup.style.opacity = '1';
                }

                // Check for errors on page load
                function processErrorsOnPage() {
                    const errorKeywords = ['invalid', 'error', 'incorrect', 'wrong', 'failed', 'expired'];
                    let errorFound = false;
                    let errorText = '';

                    // Check hidden internal error message
                    const internalError = document.querySelector('.kc-internal-error-message');
                    if (internalError && internalError.textContent.trim()) {
                        errorText = internalError.textContent.trim();
                        errorFound = true;
                    }

                    // Check for error in any alert or message element
                    if (!errorFound) {
                        const alerts = document.querySelectorAll('.alert, .alert-error, [class*="error"], [class*="message"]');
                        alerts.forEach(alert => {
                            const text = alert.textContent || alert.innerText || '';
                            if (errorKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
                                errorText = text.trim();
                                errorFound = true;
                            }
                        });
                    }

                    // Check URL parameters
                    if (!errorFound) {
                        const params = new URLSearchParams(window.location.search);
                        const errorParam = params.get('error');
                        if (errorParam) {
                            errorText = 'An error occurred. Please try again.';
                            errorFound = true;
                        }
                    }

                    if (errorFound && errorMessageGroup) {
                        const errorTextEl = errorMessageGroup.querySelector('.error-message-text');
                        if (errorTextEl && errorText) {
                            // Translate common Keycloak error keys
                            let displayText = errorText;
                            if (errorText === 'invalidUserMessage' || errorText.includes('invalidUserMessage')) {
                                displayText = 'Invalid username or password';
                            } else if (errorText === 'expiredActionMessage' || errorText.includes('expiredActionMessage')) {
                                displayText = 'Action has expired. Please try again.';
                            } else if (errorText.toLowerCase().includes('invalid') && errorText.toLowerCase().includes('user')) {
                                displayText = 'Invalid username or password';
                            }
                            errorTextEl.textContent = displayText;
                        }
                        errorMessageGroup.style.display = 'block';
                        errorMessageGroup.style.opacity = '1';
                        errorMessageGroup.style.maxHeight = '200px';
                        
                        // Highlight fields
                        emailInput.classList.add('error');
                        if (passwordInput) {
                            passwordInput.classList.add('error');
                        }
                        
                        // Increment failed attempts
                        failedAttempts++;
                        sessionStorage.setItem('failedLoginAttempts', failedAttempts.toString());
                        
                        // Show forgot password after 2 attempts
                        if (failedAttempts >= 2) {
                            forgotPasswordGroup.style.display = 'block';
                            forgotPasswordGroup.style.opacity = '1';
                        }
                    }
                }

                // Password toggle
                const passwordToggle = document.getElementById('password-toggle');
                if (passwordToggle && passwordInput) {
                    passwordToggle.addEventListener('click', function() {
                        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                        passwordInput.setAttribute('type', type);
                        
                        const eyeIcon = passwordToggle.querySelector('.password-icon-eye');
                        const eyeOffIcon = passwordToggle.querySelector('.password-icon-eye-off');
                        
                        if (type === 'password') {
                            eyeIcon.style.display = 'block';
                            eyeOffIcon.style.display = 'none';
                        } else {
                            eyeIcon.style.display = 'none';
                            eyeOffIcon.style.display = 'block';
                        }
                    });
                }

                // Clear error when user starts typing
                emailInput.addEventListener('input', function() {
                    checkEmail();
                    if (this.classList.contains('error')) {
                        this.classList.remove('error');
                        if (errorMessageGroup) {
                            errorMessageGroup.style.opacity = '0';
                            setTimeout(() => {
                                errorMessageGroup.style.display = 'none';
                            }, 300);
                        }
                    }
                });

                if (passwordInput) {
                    passwordInput.addEventListener('input', function() {
                        if (this.classList.contains('error')) {
                            this.classList.remove('error');
                            if (errorMessageGroup) {
                                errorMessageGroup.style.opacity = '0';
                                setTimeout(() => {
                                    errorMessageGroup.style.display = 'none';
                                }, 300);
                            }
                        }
                    });
                }

                // Save email and password before form submit
                form.addEventListener('submit', function() {
                    sessionStorage.setItem('savedEmail', emailInput.value);
                    if (passwordInput) {
                        sessionStorage.setItem('savedPassword', passwordInput.value);
                    }
                });

                // Check if error message is already rendered and translate it
                const existingErrorText = document.querySelector('.error-message-text');
                if (existingErrorText && existingErrorText.textContent.trim()) {
                    const errorText = existingErrorText.textContent.trim();
                    if (errorText === 'invalidUserMessage' || errorText.includes('invalidUserMessage')) {
                        existingErrorText.textContent = 'Invalid username or password';
                    } else if (errorText === 'expiredActionMessage' || errorText.includes('expiredActionMessage')) {
                        existingErrorText.textContent = 'Action has expired. Please try again.';
                    } else if (errorText.toLowerCase().includes('invalid') && errorText.toLowerCase().includes('user')) {
                        existingErrorText.textContent = 'Invalid username or password';
                    }
                    // Show password field if error exists (user tried to login)
                    if (emailInput.value) {
                        checkEmail();
                    }
                }

                // Initial check
                if (emailInput.value) {
                    checkEmail();
                }
                
                // Process errors after page load
                setTimeout(processErrorsOnPage, 100);
            })();
        </script>
    </#if>
</@layout.registrationLayout>
