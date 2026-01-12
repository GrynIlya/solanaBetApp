#!/usr/bin/env bash
set -euo pipefail
KC=${KC:-http://localhost:8080}
ADMIN_USER=${ADMIN_USER:-admin}
ADMIN_PASS=${ADMIN_PASS:-admin}

echo "[*] Admin token..."
TOKEN=$(curl -s -X POST "$KC/realms/master/protocol/openid-connect/token"   -d grant_type=password -d client_id=admin-cli   -d username="$ADMIN_USER" -d password="$ADMIN_PASS" | jq -r .access_token)

echo "[*] Realm forms-realm..."
curl -s -X POST "$KC/admin/realms" -H "Authorization: Bearer $TOKEN"   -H "Content-Type: application/json" -d '{"realm":"forms-realm","enabled":true}' || true

echo "[*] Roles user/admin..."
for r in user admin; do
  curl -s -X POST "$KC/admin/realms/forms-realm/roles" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"$r\"}" || true
done

echo "[*] Client forms-spa..."
curl -s -X POST "$KC/admin/realms/forms-realm/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId":"forms-spa",
    "publicClient":true,
    "redirectUris":["http://localhost:5173/*"],
    "webOrigins":["http://localhost:5173"],
    "standardFlowEnabled":true,
    "implicitFlowEnabled":false,
    "directAccessGrantsEnabled":true
  }' || true

echo "[*] User test..."
UL=$(curl -i -s -X POST "$KC/admin/realms/forms-realm/users" -H "Authorization: Bearer $TOKEN"   -H "Content-Type: application/json" -d '{"username":"test","enabled":true,"email":"test@example.com","emailVerified":true}' | awk '/Location/ {print $2}' | tr -d '\r')
UID=$(basename "$UL" 2>/dev/null || echo "")
if [ -n "$UID" ]; then
  curl -s -X PUT "$KC/admin/realms/forms-realm/users/$UID/reset-password" -H "Authorization: Bearer $TOKEN"     -H "Content-Type: application/json" -d '{"type":"password","value":"pass1234","temporary":false}' >/dev/null
  RU=$(curl -s -H "Authorization: Bearer $TOKEN" "$KC/admin/realms/forms-realm/roles/user")
  curl -s -X POST "$KC/admin/realms/forms-realm/users/$UID/role-mappings/realm" \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "[$RU]" >/dev/null
fi
echo "[*] Done."
