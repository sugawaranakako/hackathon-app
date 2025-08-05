# Fix Vertex AI Setup - Step by Step Guide

## Current Status
❌ **No models available** (including Google's own Gemini models)  
❌ **404 errors on all model requests**  
❌ **Issue is NOT Claude-specific - it's a Vertex AI setup problem**

## Required Actions

### 1. Enable Vertex AI API
```bash
# Enable the Vertex AI API
gcloud services enable aiplatform.googleapis.com --project=xtone-devadmin

# Also enable these related APIs
gcloud services enable ml.googleapis.com --project=xtone-devadmin
gcloud services enable compute.googleapis.com --project=xtone-devadmin
```

### 2. Verify Billing Account
Go to: https://console.cloud.google.com/billing/projects
- Ensure project `xtone-devadmin` has a billing account attached
- Verify billing account is active and has payment method

### 3. Check Service Account Permissions
```bash
# Check current service account permissions
gcloud projects get-iam-policy xtone-devadmin

# Add required roles (replace SERVICE_ACCOUNT_EMAIL with your actual service account)
gcloud projects add-iam-policy-binding xtone-devadmin \
    --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
    --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding xtone-devadmin \
    --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
    --role="roles/ml.admin"
```

### 4. Enable Model Garden (for Claude models)
1. Go to: https://console.cloud.google.com/vertex-ai/model-garden
2. Search for "Claude"  
3. Enable Claude 3.5 Sonnet models
4. Accept terms of service if prompted

### 5. Test Basic Connectivity
```bash
# Test if basic Vertex AI is working
node test-basic-vertex.js
```

### 6. Check Quotas
Go to: https://console.cloud.google.com/iam-admin/quotas
- Search for "Vertex AI"
- Ensure you have quota for your region
- Request quota increase if needed

## Quick Commands to Run

```bash
# 1. Check if APIs are enabled
gcloud services list --enabled --project=xtone-devadmin | grep aiplatform

# 2. Check billing status
gcloud beta billing projects describe xtone-devadmin

# 3. Check your current authentication
gcloud auth list

# 4. Test basic access
gcloud ai models list --project=xtone-devadmin --region=us-central1
```

## Alternative: Use Different Authentication Method

If service account isn't working, try user authentication:

```bash
# Login as user instead of service account
gcloud auth login
gcloud auth application-default login

# Test again
node debug-vertex-ai.js
```

## Working Claude Model Identifiers (once setup is fixed)

Based on my research, try these in order:
1. `claude-3-5-sonnet@20240620` (stable version)
2. `claude-3-sonnet@20240229` (fallback option)  
3. `claude-3-5-sonnet` (latest without date)

## Expected Timeline
- **API enabling**: 2-5 minutes
- **Billing setup**: Immediate if account exists
- **Permissions**: Immediate
- **Model access**: 5-10 minutes after setup

## Next Steps
1. Run the commands above
2. Wait a few minutes for propagation
3. Test with: `node debug-vertex-ai.js`
4. Update your server.js with working model identifier

## Need Help?
If issues persist after these steps:
1. Check Google Cloud Console for any error messages
2. Verify project ID is correct: `xtone-devadmin`
3. Consider creating a new test project to isolate issues