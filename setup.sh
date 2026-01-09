#!/bin/bash

# Setup script for Document Comparison Tool with Gemini AI Integration

echo "🚀 Setting up Document Comparison Tool with Gemini AI..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📋 Creating .env.local from template..."
    cp env.example .env.local
    echo "✅ Created .env.local file"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env.local and add your Gemini API key!"
    echo "   Get your API key from: https://makersuite.google.com/app/apikey"
    echo ""
else
    echo "ℹ️  .env.local already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Gemini API key is configured
if grep -q "your_gemini_api_key_here" .env.local 2>/dev/null; then
    echo ""
    echo "⚠️  WARNING: Please update your Gemini API key in .env.local"
    echo "   Replace 'your_gemini_api_key_here' with your actual API key"
    echo ""
fi

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Add your Gemini API key to .env.local"
echo "   2. Run: npm run dev"
echo "   3. Test with the enhanced sample files:"
echo "      - test-data1-enhanced.json"
echo "      - test-data2-enhanced.json"
echo ""
echo "🧠 Features enabled:"
echo "   ✅ AI-powered semantic matching"
echo "   ✅ Advanced date format recognition"
echo "   ✅ Insurance terminology matching"
echo "   ✅ Intelligent caching system"
echo "   ✅ Hybrid rule-based + AI approach"
echo ""
