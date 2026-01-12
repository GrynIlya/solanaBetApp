<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8"/>
    <meta name="robots" content="noindex, nofollow">
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet"/>
        </#list>
    </#if>
    <link href="${url.resourcesPath}/css/login.css" rel="stylesheet"/>
</head>
<body class="${bodyClass}">
    <header class="border-b">
        <div class="container mx-auto px-4 py-4 flex items-center justify-between">
            <a class="text-2xl font-bold" href="http://localhost:5173/" data-discover="true">Customer App</a>
            <nav class="flex items-center gap-4">
                <a href="http://localhost:5173/" data-discover="true">
                    <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">Home</button>
                </a>
                <a href="http://localhost:5173/about" data-discover="true">
                    <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">About</button>
                </a>
                <a href="${url.loginUrl}">
                    <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">Login</button>
                </a>
                <a href="http://localhost:5173/register">
                    <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">Register</button>
                </a>
            </nav>
        </div>
    </header>
    <div id="kc-container">
        <div id="kc-container-wrapper">
            <div id="kc-content">
                <#-- Показываем сообщения Keycloak, но они будут обработаны JavaScript для красивого отображения -->
                <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <#if message.type == 'error' || message.type == 'warning'>
                        <div class="kc-internal-error-message" style="display: none;">
                            ${kcSanitize(message.summary)?no_esc}
                        </div>
                    </#if>
                </#if>
                <#nested "header">
                <#nested "form">
            </div>
        </div>
    </div>
</body>
</html>
</#macro>

