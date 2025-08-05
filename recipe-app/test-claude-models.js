#!/usr/bin/env node

const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

const projectId = process.env.ANTHROPIC_VERTEX_PROJECT_ID || 'xtone-devadmin';
const location = process.env.CLOUD_ML_REGION || 'us-east5';

// List of model identifiers to test
const modelsToTest = [
  'claude-3-5-sonnet-v2@20241022',
  'claude-3-5-sonnet@20240620', 
  'claude-3-5-sonnet-20241022',
  'claude-3-5-sonnet',
  'claude-3-5-sonnet-v2',
  'claude-3-5-sonnet@20241001',
  'claude-3-5-sonnet@20240620'
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
    console.log(`❌ FAILED: ${modelId}`);
    console.log(`🔍 Error: ${error.message}`);
    return { modelId, success: false, error: error.message };
  }
}

async function findWorkingModel() {
  console.log('🚀 Testing Claude models on Vertex AI...');
  console.log(`📍 Project: ${projectId}`);
  console.log(`🌍 Location: ${location}`);
  console.log(`🔑 Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS ? '✅ Set' : '❌ Not set'}`);
  
  const results = [];
  
  for (const modelId of modelsToTest) {
    const result = await testModel(modelId);
    results.push(result);
    
    // If we find a working model, we can optionally break early
    if (result.success) {
      console.log(`\n🎉 Found working model: ${modelId}`);
      console.log(`💡 Update your server.js line 17 to: const model = '${modelId}';`);
    }
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(50));
  
  const workingModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);
  
  if (workingModels.length > 0) {
    console.log(`✅ Working models (${workingModels.length}):`);
    workingModels.forEach(model => {
      console.log(`   - ${model.modelId}`);
    });
    
    console.log(`\n🔧 RECOMMENDED FIX:`);
    console.log(`Update your server.js file:`);
    console.log(`const model = '${workingModels[0].modelId}';`);
    
  } else {
    console.log('❌ No working models found');
    console.log('🔍 Possible issues:');
    console.log('   - Authentication problems');
    console.log('   - Region not supported');
    console.log('   - Claude models not enabled in your project');
    console.log('   - Different model naming convention');
  }
  
  if (failedModels.length > 0) {
    console.log(`\n❌ Failed models (${failedModels.length}):`);
    failedModels.forEach(model => {
      console.log(`   - ${model.modelId}: ${model.error}`);
    });
  }
}

// Run the test
findWorkingModel().catch(error => {
  console.error('🚨 Script failed:', error);
  process.exit(1);
});