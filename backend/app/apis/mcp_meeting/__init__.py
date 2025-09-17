

# This file was causing duplicate endpoint conflicts
# All MCP meeting functionality has been moved to the main MCP API
# at src/app/apis/mcp/__init__.py

from fastapi import APIRouter

router = APIRouter()

# No endpoints needed - all moved to main MCP API
