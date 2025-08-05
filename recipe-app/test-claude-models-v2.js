#!/usr/bin/env node

const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

const projectId = process.env.ANTHROPIC_VERTEX_PROJECT_ID || 'xtone-devadmin';
const location = process.env.CLOUD_ML_REGION || 'us-east5';

// Additional model identifiers to test based on current Vertex AI patterns
const modelsToTest = [
  // Try different date formats
  'claude-3-5-sonnet@20241210',
  'claude-3-5-sonnet@20241120', 
  'claude-3-5-sonnet@20241001',
  'claude-3-5-sonnet@20240701',
  'claude-3-5-sonnet@20240601',
  // Try different naming patterns
  'claude-3-5-sonnet-20241210',
  'claude-3-5-sonnet-20241120',
  'claude-3-sonnet-3-5@20241022',
  'claude-3.5-sonnet@20241022',
  // Try region-specific versions
  'claude-3-5-sonnet-001',
  'claude-3-5-sonnet-002',
  // Try standard model names without dates
  'claude-3-5-sonnet-latest',
  'claude-3-5-sonnet-stable'
];

const vertex_ai = new VertexAI({
  project: projectId,
  location: location,
});

async function testModel(modelId) {
  console.log(`\n🧪 Testing model: ${modelId}`);
  
  try {
    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: modelId,
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.1,
      },
    });

    const result = await generativeModel.generateContent([{
      role: 'user',
      parts: [{ text: 'Say "Hello" in Japanese.' }]
    }]);

    const response = await result.response;
    const text = response.candidates[0].content.parts[0].text;
    
    console.log(`✅ SUCCESS: ${modelId}`);
    console.log(`📝 Response: ${text.substring(0, 50)}...`);
    return { modelId, success: true, response: text };
    
  } catch (error) {
    const errorInfo = error.message.includes('not supported in the generateContent API') 
      ? 'Model exists but needs different API method'
      : error.message.includes('not found') 
        ? 'Model not found or no access'
        : 'Other error';
        
    console.log(`❌ FAILED: ${modelId}`);
    console.log(`🔍 Error Type: ${errorInfo}`);
    console.log(`📝 Error: ${error.message.substring(0, 100)}...`);
    return { modelId, success: false, error: error.message, errorType: errorInfo };
  }
}

async function listAvailableModels() {
  console.log('\n🔍 Trying to list available models...');
  
  try {
    // Try to list models (this might not work but worth trying)
    const models = await vertex_ai.preview.listModels();
    console.log('📋 Available models:', models);
  } catch (error) {
    console.log('❌ Could not list models:', error.message);
  }
}

async function checkProjectAccess() {
  console.log('\n🔑 Checking project access...');
  
  try {
    // Try a simple operation to verify access
    const testModel = vertex_ai.preview.getGenerativeModel({
      model: 'gemini-pro', // Try a known Google model
      generationConfig: { maxOutputTokens: 10 }
    });
    
    await testModel.generateContent([{
      role: 'user', 
      parts: [{ text: 'Hi' }]
    }]);
    
    console.log('✅ Project access confirmed - can access Google models');
    console.log('❌ Issue is specifically with Claude model availability');
    
  } catch (error) {
    console.log('❌ Project access issue:', error.message);
  }
}

async function findWorkingModel() {
  console.log('🚀 Testing additional Claude models on Vertex AI...');
  console.log(`📍 Project: ${projectId}`);
  console.log(`🌍 Location: ${location}`);
  
  await checkProjectAccess();
  await listAvailableModels();
  
  const results = [];
  
  for (const modelId of modelsToTest) {
    const result = await testModel(modelId);
    results.push(result);
    
    if (result.success) {
      console.log(`\n🎉 Found working model: ${modelId}`);
      break; // Stop on first success
    }
  }
  
  console.log('\n📊 ADDITIONAL TEST SUMMARY:');
  console.log('='.repeat(50));
  
  const workingModels = results.filter(r => r.success);
  const needsDifferentAPI = results.filter(r => r.errorType === 'Model exists but needs different API method');
  const notFound = results.filter(r => r.errorType === 'Model not found or no access');
  
  if (workingModels.length > 0) {
    console.log(`✅ Working models found: ${workingModels.length}`);
    workingModels.forEach(model => {
      console.log(`   - ${model.modelId}`);
    });
  } else {
    console.log('❌ Still no working models found');
  }
  
  if (needsDifferentAPI.length > 0) {
    console.log(`\n⚠️ Models that exist but need different API (${needsDifferentAPI.length}):`);
    needsDifferentAPI.forEach(model => {
      console.log(`   - ${model.modelId}`);
    });
    console.log('💡 These models might work with chat completion API instead of generateContent');
  }
  
  console.log(`\n📋 Total models tested: ${results.length}`);
  console.log(`📋 Not found: ${notFound.length}`);
  console.log(`📋 API method issues: ${needsDifferentAPI.length}`);
}

// Run the test
findWorkingModel().catch(error => {
  console.error('🚨 Script failed:', error);
  process.exit(1);
});