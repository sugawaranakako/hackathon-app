#!/usr/bin/env node

const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

const projectId = process.env.ANTHROPIC_VERTEX_PROJECT_ID || 'xtone-devadmin';

// Test different regions
const regionsToTest = [
  'us-central1',
  'us-east4', 
  'us-west1',
  'us-east5',
  'europe-west4',
  'asia-southeast1'
];

// Test basic Google models first
const googleModelsToTest = [
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro',
  'gemini-pro-vision'
];

// Test Claude models with different patterns
const claudeModelsToTest = [
  'claude-3-sonnet@20240229',
  'claude-3-opus@20240229', 
  'claude-3-haiku@20240307',
  'claude-3-5-sonnet@20240620',
  'claude-3-5-sonnet@20241022'
];

async function testModelInRegion(modelId, region) {
  console.log(`\n🧪 Testing ${modelId} in ${region}...`);
  
  try {
    const vertex_ai = new VertexAI({
      project: projectId,
      location: region,
    });

    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: modelId,
      generationConfig: {
        maxOutputTokens: 50,
        temperature: 0.1,
      },
    });

    const result = await generativeModel.generateContent([{
      role: 'user',
      parts: [{ text: 'Hi' }]
    }]);

    const response = await result.response;
    const text = response.candidates[0].content.parts[0].text;
    
    console.log(`✅ SUCCESS: ${modelId} in ${region}`);
    console.log(`📝 Response: ${text.substring(0, 30)}...`);
    return { modelId, region, success: true, response: text };
    
  } catch (error) {
    const errorType = error.message.includes('not found') ? 'NOT_FOUND' :
                     error.message.includes('not supported') ? 'API_ISSUE' :
                     error.message.includes('permission') ? 'PERMISSION' :
                     error.message.includes('quota') ? 'QUOTA' :
                     'OTHER';
                     
    console.log(`❌ FAILED: ${modelId} in ${region} (${errorType})`);
    return { modelId, region, success: false, error: error.message, errorType };
  }
}

async function comprehensiveTest() {
  console.log('🔍 COMPREHENSIVE VERTEX AI DEBUG');
  console.log('='.repeat(50));
  console.log(`📍 Project: ${projectId}`);
  console.log(`🔑 Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅ Set' : '❌ Not set'}`);
  
  const allResults = [];
  
  // Test Google models first to verify basic connectivity
  console.log('\n🟦 TESTING GOOGLE MODELS (to verify basic access)');
  for (const region of regionsToTest.slice(0, 3)) { // Test first 3 regions
    for (const model of googleModelsToTest.slice(0, 2)) { // Test first 2 models
      const result = await testModelInRegion(model, region);
      allResults.push(result);
      
      if (result.success) {
        console.log(`🎉 Found working Google model: ${model} in ${region}`);
        console.log('✅ Basic Vertex AI access confirmed!');
        break; // Stop testing once we find one working model
      }
    }
    
    // If we found a working model, test Claude in the same region
    const workingGoogle = allResults.find(r => r.success && r.region === region);
    if (workingGoogle) {
      console.log(`\n🟣 TESTING CLAUDE MODELS in working region: ${region}`);
      for (const claudeModel of claudeModelsToTest) {
        const result = await testModelInRegion(claudeModel, region);
        allResults.push(result);
        
        if (result.success) {
          console.log(`🎉 Found working Claude model: ${claudeModel} in ${region}`);
          break;
        }
      }
      break; // Stop testing other regions once we find a working region
    }
  }
  
  // Summary
  console.log('\n📊 COMPREHENSIVE SUMMARY');
  console.log('='.repeat(50));
  
  const workingModels = allResults.filter(r => r.success);
  const regionResults = {};
  
  allResults.forEach(result => {
    if (!regionResults[result.region]) {
      regionResults[result.region] = { total: 0, working: 0, failed: 0 };
    }
    regionResults[result.region].total++;
    if (result.success) {
      regionResults[result.region].working++;
    } else {
      regionResults[result.region].failed++;
    }
  });
  
  console.log('\n🌍 REGION STATUS:');
  Object.entries(regionResults).forEach(([region, stats]) => {
    const status = stats.working > 0 ? '✅ WORKING' : '❌ NO ACCESS';
    console.log(`   ${region}: ${status} (${stats.working}/${stats.total} models)`);
  });
  
  if (workingModels.length > 0) {
    console.log('\n✅ WORKING CONFIGURATIONS:');
    workingModels.forEach(model => {
      console.log(`   - ${model.modelId} in ${model.region}`);
    });
    
    const workingClaude = workingModels.find(m => m.modelId.includes('claude'));
    if (workingClaude) {
      console.log(`\n🔧 RECOMMENDED FIX FOR YOUR CODE:`);
      console.log(`Update server.js:`);
      console.log(`const model = '${workingClaude.modelId}';`);
      console.log(`const location = '${workingClaude.region}';`);
    } else {
      console.log('\n⚠️ NO CLAUDE MODELS AVAILABLE');
      console.log('Possible solutions:');
      console.log('1. Enable Claude models in Google Cloud Console');
      console.log('2. Check billing account and quotas');
      console.log('3. Request access to Claude models');
      console.log('4. Try different regions');
    }
  } else {
    console.log('\n❌ NO WORKING MODELS FOUND');
    console.log('\n🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Verify Google Cloud project billing is enabled');
    console.log('2. Check Vertex AI API is enabled');
    console.log('3. Verify service account has proper permissions');
    console.log('4. Try different regions');
    console.log('5. Check quota limits in Google Cloud Console');
  }
  
  // Error analysis
  const errorTypes = {};
  allResults.filter(r => !r.success).forEach(result => {
    errorTypes[result.errorType] = (errorTypes[result.errorType] || 0) + 1;
  });
  
  if (Object.keys(errorTypes).length > 0) {
    console.log('\n📋 ERROR ANALYSIS:');
    Object.entries(errorTypes).forEach(([errorType, count]) => {
      console.log(`   ${errorType}: ${count} occurrences`);
    });
  }
}

// Run the comprehensive test
comprehensiveTest().catch(error => {
  console.error('🚨 Debug script failed:', error);
  process.exit(1);
});