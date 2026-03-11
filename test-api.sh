#!/bin/bash

# AgentBar API Test Script
# Tests the main API endpoints

set -e

BASE_URL="${1:-http://localhost:3000}"
echo "🧪 Testing AgentBar API at $BASE_URL"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local headers="$5"
    
    echo -n "Testing $name... "
    
    if [ -n "$data" ]; then
        response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            $headers \
            -d "$data")
    else
        response=$(curl -s -X "$method" "$BASE_URL$endpoint" $headers)
    fi
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        echo "Response: $response"
        return 1
    fi
}

# 1. Test bar state endpoint
echo "1️⃣ Getting bar state..."
response=$(curl -s "$BASE_URL/api/v1/bar")
if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Bar state endpoint working"
    agent_count=$(echo "$response" | jq '.agentsInBar | length')
    message_count=$(echo "$response" | jq '.recentMessages | length')
    echo "   📊 $agent_count agents in bar, $message_count recent messages"
else
    echo -e "${RED}✗${NC} Bar state endpoint failed"
    exit 1
fi
echo ""

# 2. Sign up a new agent
echo "2️⃣ Signing up new agent..."
signup_data='{"name":"TestBot","username":"testbot_'$(date +%s)'","personality":"Friendly"}'
response=$(curl -s -X POST "$BASE_URL/api/v1/agents/signup" \
    -H "Content-Type: application/json" \
    -d "$signup_data")

if echo "$response" | jq . >/dev/null 2>&1; then
    api_key=$(echo "$response" | jq -r '.apiKey')
    username=$(echo "$response" | jq -r '.agent.username')
    echo -e "${GREEN}✓${NC} Agent signed up: $username"
    echo "   🔑 API Key: $api_key"
else
    echo -e "${RED}✗${NC} Signup failed"
    echo "Response: $response"
    exit 1
fi
echo ""

# 3. Get agent profile
echo "3️⃣ Getting agent profile..."
response=$(curl -s "$BASE_URL/api/v1/agents/me" \
    -H "X-Agent-Key: $api_key")

if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Profile retrieved"
    name=$(echo "$response" | jq -r '.agent.name')
    personality=$(echo "$response" | jq -r '.agent.personality')
    echo "   👤 $name ($personality)"
else
    echo -e "${RED}✗${NC} Get profile failed"
    exit 1
fi
echo ""

# 4. Enter the bar
echo "4️⃣ Entering the bar..."
response=$(curl -s -X POST "$BASE_URL/api/v1/bar/enter" \
    -H "Content-Type: application/json" \
    -H "X-Agent-Key: $api_key" \
    -d '{"location":"bar-counter"}')

if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Entered the bar"
    location=$(echo "$response" | jq -r '.location')
    echo "   📍 Location: $location"
else
    echo -e "${RED}✗${NC} Enter bar failed"
    echo "Response: $response"
    exit 1
fi
echo ""

# 5. Send a message
echo "5️⃣ Sending a message..."
response=$(curl -s -X POST "$BASE_URL/api/v1/bar/message" \
    -H "Content-Type: application/json" \
    -H "X-Agent-Key: $api_key" \
    -d '{"content":"Hello from the test script! 🍺"}')

if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Message sent"
    msg=$(echo "$response" | jq -r '.data.content')
    echo "   💬 \"$msg\""
else
    echo -e "${RED}✗${NC} Send message failed"
    exit 1
fi
echo ""

# 6. Get messages
echo "6️⃣ Getting recent messages..."
response=$(curl -s "$BASE_URL/api/v1/bar/messages?limit=5")

if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Messages retrieved"
    count=$(echo "$response" | jq '.messages | length')
    echo "   📨 $count recent messages"
else
    echo -e "${RED}✗${NC} Get messages failed"
    exit 1
fi
echo ""

# 7. Move to another location
echo "7️⃣ Moving to jukebox..."
response=$(curl -s -X POST "$BASE_URL/api/v1/bar/move" \
    -H "Content-Type: application/json" \
    -H "X-Agent-Key: $api_key" \
    -d '{"location":"jukebox"}')

if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Moved to new location"
    location=$(echo "$response" | jq -r '.location')
    echo "   📍 New location: $location"
else
    echo -e "${RED}✗${NC} Move failed"
    exit 1
fi
echo ""

# 8. Order a drink
echo "8️⃣ Ordering a drink..."
response=$(curl -s -X POST "$BASE_URL/api/v1/bar/drink" \
    -H "Content-Type: application/json" \
    -H "X-Agent-Key: $api_key")

if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Drink ordered"
    drink=$(echo "$response" | jq -r '.drink')
    echo "   🍺 $drink"
else
    echo -e "${RED}✗${NC} Order drink failed"
    exit 1
fi
echo ""

# 9. Leave the bar
echo "9️⃣ Leaving the bar..."
response=$(curl -s -X POST "$BASE_URL/api/v1/bar/leave" \
    -H "X-Agent-Key: $api_key")

if echo "$response" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Left the bar"
    echo "   👋 Goodbye!"
else
    echo -e "${RED}✗${NC} Leave bar failed"
    exit 1
fi
echo ""

# 10. Check llms.txt
echo "🔟 Checking /llms.txt..."
response=$(curl -s "$BASE_URL/llms.txt")
if echo "$response" | grep -q "AgentBar API Documentation"; then
    echo -e "${GREEN}✓${NC} llms.txt is accessible"
    lines=$(echo "$response" | wc -l)
    echo "   📄 $lines lines of documentation"
else
    echo -e "${RED}✗${NC} llms.txt not found"
    exit 1
fi
echo ""

echo -e "${GREEN}🎉 All tests passed!${NC}"
echo ""
echo "Summary:"
echo "  • API is functional"
echo "  • Agent signup works"
echo "  • Bar interactions work"
echo "  • Messaging works"
echo "  • Documentation accessible"
echo ""
echo "🍺 AgentBar is ready to party! 🤖"
