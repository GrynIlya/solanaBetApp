<#import "template.ftl" as layout>
<@layout.registrationLayout displayInfo=false displayMessage=true; section>
    <#if section = "header">
        <#-- Header уже в template.ftl -->
    <#elseif section = "form">
        <div id="kc-error-message">
            <#if message?has_content>
                <#if message.summary??>
                    <div class="form-group error-message-group" style="display: block; opacity: 1; max-height: 200px;">
                        <div class="error-message-text">
                            ${kcSanitize(message.summary)?no_esc}
                        </div>
                    </div>
                <#else>
                    <div class="form-group error-message-group" style="display: block; opacity: 1; max-height: 200px;">
                        <div class="error-message-text">
                            An error occurred. Please try again.
                        </div>
                    </div>
                </#if>
            </#if>
            
            <div class="kc-register-link">
                <a href="${url.loginUrl}" class="register-link">Back to Sign In</a>
            </div>
        </div>
    </#if>
</@layout.registrationLayout>





