# 🧠 Gemini 2.5-Pro AI Integration Guide

## Overview

Your Document Comparison Tool now supports **Google Gemini 2.5-Pro AI** for advanced semantic matching! This provides superior accuracy for comparing insurance documents with complex variations in dates, terminology, and formats.

## 🎯 What Gemini AI Fixes

### **Date Matching Examples:**
- ✅ `"01-01-2025"` = `"1 jan 2025"` = `"January 1, 2025"`
- ✅ `"12/31/2025"` = `"December 31, 2025"` = `"31 Dec 2025"`

### **Insurance Term Matching:**
- ✅ `"General Liability"` = `"GL"` = `"CGL"`
- ✅ `"Workers Compensation"` = `"WC"` = `"Workers Comp"`

### **Currency Matching:**
- ✅ `"$1,000,000"` = `"1000000"` = `"$1M"` = `"One Million"`

### **Yes/No Variations:**
- ✅ `"Yes"` = `"Y"` = `"Included"` = `"Covered"`
- ✅ `"No"` = `"N"` = `"Excluded"` = `"Not Covered"`

### **Percentage Matching:**
- ✅ `"2.5%"` = `"2.5 percent"` = `"0.025"`

## 🚀 Setup Instructions

### Step 1: Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### Step 2: Configure Environment
1. Copy `env.example` to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` and add your API key:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_ENABLE_GEMINI=true
   NEXT_PUBLIC_SHOW_AI_STATUS=true
   ```

### Step 3: Test the Integration
1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Upload the test files: `test-data1-enhanced.json` and `test-data2-enhanced.json`

3. Compare the documents and see AI-enhanced matching in action!

## 🎛️ Configuration Options

```env
# Core Gemini Settings
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_ENABLE_GEMINI=true
NEXT_PUBLIC_GEMINI_MODEL=gemini-1.5-pro

# Rate Limiting (important for cost control)
NEXT_PUBLIC_GEMINI_RPM=60           # Requests per minute
NEXT_PUBLIC_GEMINI_BATCH_SIZE=5     # Fields per batch  
NEXT_PUBLIC_GEMINI_DELAY=200        # Delay between batches (ms)

# Performance Settings
NEXT_PUBLIC_USE_CACHING=true        # Cache AI results
NEXT_PUBLIC_CACHE_TTL=3600000       # Cache for 1 hour

# UI Settings  
NEXT_PUBLIC_SHOW_AI_STATUS=true     # Show AI status panel
```

## 🔄 How the Hybrid System Works

### **Smart Routing Logic:**
1. **Exact Match** → Instant (no API call)
2. **Rule-Based Match** → Fast local processing
3. **Complex/Ambiguous** → Gemini AI analysis
4. **Fallback** → Rule-based if AI fails

### **When Gemini AI is Used:**
- ✅ **Critical fields** (policy numbers, dates, coverage limits)
- ✅ **Complex date formats** 
- ✅ **Currency variations**
- ✅ **Insurance abbreviations**
- ✅ **Ambiguous cases** (similarity 30-90%)

### **Performance Optimizations:**
- ✅ **Batch processing** (5 fields at a time)
- ✅ **Intelligent caching** (avoid repeat API calls)
- ✅ **Rate limiting** (respects API limits)
- ✅ **Fast local fallback** (never blocks UI)

## 💰 Cost Management

### **Estimated Costs:**
- **Small document (50 fields)**: ~$0.05-0.10
- **Large document (500 fields)**: ~$0.50-1.00
- **Monthly usage (100 docs)**: ~$50-100

### **Cost Optimization Features:**
- ✅ **Smart routing** (only use AI when needed)
- ✅ **Aggressive caching** (store results for 1 hour)
- ✅ **Batch processing** (efficient API usage)
- ✅ **Rule-based fallback** (free for simple cases)

## 🎨 UI Enhancements

When Gemini is active, you'll see:
- 🧠 **AI Status Panel** showing Gemini is active
- 📊 **Enhanced statistics** (AI vs rule-based matches)
- 🎯 **Better accuracy indicators** 
- 💡 **Match reasoning** (in development mode)

## 🔧 Advanced Configuration

### **Production Settings:**
```env
# Optimize for production
NEXT_PUBLIC_GEMINI_RPM=120
NEXT_PUBLIC_GEMINI_BATCH_SIZE=10
NEXT_PUBLIC_SHOW_AI_STATUS=false
NEXT_PUBLIC_USE_CACHING=true
```

### **Development Settings:**
```env
# Optimize for development/testing
NEXT_PUBLIC_GEMINI_RPM=30
NEXT_PUBLIC_SHOW_AI_STATUS=true
NEXT_PUBLIC_CACHE_TTL=600000  # 10 minutes
```

## 🚨 Error Handling

The system includes comprehensive error handling:
- ✅ **API failures** → Automatic fallback to rule-based
- ✅ **Rate limit exceeded** → Queue and retry
- ✅ **Network issues** → Local processing continues
- ✅ **Invalid responses** → Graceful degradation

## 📈 Monitoring

In development mode, check the browser console for:
- 🧠 Gemini API calls and results
- 📊 Processing statistics
- ⚡ Performance metrics
- 🎯 Match accuracy details

## 🎉 Expected Results

With Gemini AI active, your comparisons will be **dramatically more accurate**:

- ✅ **Date variations** will show GREEN instead of ORANGE
- ✅ **Insurance terms** will be properly matched
- ✅ **Currency formats** will be recognized as equivalent  
- ✅ **Name variations** will be handled intelligently
- ✅ **Only truly different values** will show as differences

**Your Document Comparison Tool now has industry-leading AI-powered semantic matching!** 🚀
