#!/bin/bash
# Test orchestrator via REST API
#
# Usage: ./scripts/test_orchestrator_api.sh
#
# Make sure backend is running: cd app/api && uvicorn main:app --reload

API_BASE="http://localhost:8000"
API_KEY="fido"  # Your OWNER_API_KEY from env file

echo "🎯 Testing Orchestrator API"
echo "========================================="

# 1. Start orchestrator
echo -e "\n1️⃣  Starting orchestrator..."
curl -s -X POST "$API_BASE/clone/orchestrator/start" \
  -H "Authorization: Bearer $API_KEY" | jq .

sleep 1

# 2. Check status
echo -e "\n2️⃣  Checking status..."
curl -s "$API_BASE/clone/orchestrator/status" \
  -H "Authorization: Bearer $API_KEY" | jq .

sleep 1

# 3. Stop orchestrator
echo -e "\n3️⃣  Stopping orchestrator..."
curl -s -X POST "$API_BASE/clone/orchestrator/stop" \
  -H "Authorization: Bearer $API_KEY" | jq .

echo -e "\n✅ API test complete!"
echo ""
echo "💡 The orchestrator is ready to coordinate all Fido tasks!"

