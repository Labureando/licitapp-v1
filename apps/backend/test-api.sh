#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000/api"

echo -e "${BLUE}=== Licitapp API Testing Script ===${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}[1/7] Testing Health Check...${NC}"
curl -s http://localhost:3000/health | jq '.' > /dev/null && echo -e "${GREEN}✓ Health Check OK${NC}" || echo -e "${RED}✗ Health Check FAILED${NC}"

# Test 2: Signup
echo -e "\n${YELLOW}[2/7] Testing Signup...${NC}"
SIGNUP_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser'$(date +%s)'@example.com",
    "firstName": "Test",
    "lastName": "User",
    "password": "SecurePassword123!"
  }')

echo "$SIGNUP_RESPONSE" | jq '.' > /dev/null && echo -e "${GREEN}✓ Signup OK${NC}" || echo -e "${RED}✗ Signup FAILED${NC}"

# Test 3: Login
echo -e "\n${YELLOW}[3/7] Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "SecurePassword123!"
  }')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token // empty')
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id // empty')

if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Login OK (Token: ${ACCESS_TOKEN:0:20}...)${NC}"
else
  echo -e "${RED}✗ Login FAILED${NC}"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi

# Test 4: Get Current User
echo -e "\n${YELLOW}[4/7] Testing Get Current User...${NC}"
curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.' > /dev/null && echo -e "${GREEN}✓ Get Current User OK${NC}" || echo -e "${RED}✗ Get Current User FAILED${NC}"

# Test 5: Create Organization
echo -e "\n${YELLOW}[5/7] Testing Create Organization...${NC}"
ORG_RESPONSE=$(curl -s -X POST "$BASE_URL/organizations" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Organization",
    "description": "Organization for testing",
    "phone": "+34 912 345 678",
    "website": "https://test-org.example.com"
  }')

ORG_ID=$(echo "$ORG_RESPONSE" | jq -r '.data.id // empty')

if [ -n "$ORG_ID" ] && [ "$ORG_ID" != "null" ]; then
  echo -e "${GREEN}✓ Create Organization OK (ID: ${ORG_ID:0:8}...)${NC}"
else
  echo -e "${RED}✗ Create Organization FAILED${NC}"
  echo "$ORG_RESPONSE" | jq '.'
fi

# Test 6: Create Alert
echo -e "\n${YELLOW}[6/7] Testing Create Alert...${NC}"
ALERT_RESPONSE=$(curl -s -X POST "$BASE_URL/alerts" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test Alert",
    "descripcion": "Alert for testing",
    "criterios": {
      "tipoContrato": ["SERVICIOS"],
      "estado": ["ABIERTA"]
    }
  }')

ALERT_ID=$(echo "$ALERT_RESPONSE" | jq -r '.id // empty')

if [ -n "$ALERT_ID" ] && [ "$ALERT_ID" != "null" ]; then
  echo -e "${GREEN}✓ Create Alert OK (ID: ${ALERT_ID:0:8}...)${NC}"
else
  echo -e "${RED}✗ Create Alert FAILED${NC}"
  echo "$ALERT_RESPONSE" | jq '.'
fi

# Test 7: Test Authorization (without token)
echo -e "\n${YELLOW}[7/7] Testing Authorization (should fail without token)...${NC}"
UNAUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/alerts")

if echo "$UNAUTH_RESPONSE" | jq '.' | grep -q "401\|Unauthorized"; then
  echo -e "${GREEN}✓ Authorization Check OK (correctly denied without token)${NC}"
else
  echo -e "${YELLOW}⚠ Authorization might not be working as expected${NC}"
  echo "$UNAUTH_RESPONSE" | jq '.'
fi

echo -e "\n${BLUE}=== Testing Complete ===${NC}\n"
echo -e "${GREEN}Key Credentials for Next Tests:${NC}"
echo -e "Access Token: ${GREEN}${ACCESS_TOKEN:0:30}...${NC}"
echo -e "User ID: ${GREEN}${USER_ID}${NC}"
echo -e "Organization ID: ${GREEN}${ORG_ID}${NC}"
echo -e "Alert ID: ${GREEN}${ALERT_ID}${NC}"
