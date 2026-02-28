#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Directory for the virtual environment
VENV_DIR=".chroma_venv"

echo "======================================"
echo "ChromaDB Local Server Orchestrator"
echo "======================================"

# 1. Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 could not be found. Please install Python 3."
    exit 1
fi

# 2. Create Virtual Environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating new Python virtual environment in $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
else
    echo "✅ Found existing virtual environment."
fi

# 3. Activate Virtual Environment
echo "🔄 Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# 4. Install dependencies inside the isolated environment
echo "📥 Ensuring chromadb is installed (this might take a moment on first run)..."
python3 -m pip install --upgrade pip > /dev/null 2>&1
python3 -m pip install chromadb > /dev/null 2>&1

# 5. Start Chroma Server
echo "🚀 Starting ChromaDB Server locally on port 8000..."
echo "📂 Data will be persisted to ./chroma_data"
echo "➡️ Please leave this terminal window open."
echo "======================================"

# Execute chroma run
chroma run --path ./chroma_data --host localhost --port 8000
