#!/usr/bin/env node

const { VertexAI } = require('@google-cloud/vertexai');
require('dotenv').config();

const projectId = process.env.ANTHROPIC_VERTEX_PROJECT_ID || 'xtone-devadmin';
const location = 'us-central1'; // Standard region

async function testBasicVertexAI() {
  console.log('🔧 BASIC VERTEX AI CONNECTIVITY TEST');
  console.log('='.repeat(40));
  console.log(`📍 Project: ${projectId}`);
  console.log(`🌍 Region: ${location}`);
  console.log(`🔑 Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS || 'Not set (using default)'}`);
  
  try {
    console.log('\n🚀 Creating Vertex AI client...');
    const vertex_ai = new VertexAI({
      project: projectId,
      location: location,
    });
    
    console.log('✅ Vertex AI client created successfully');
    
    console.log('\n🧪 Testing simple Gemini model...');
    
    // Try the most basic Gemini model
    const model = vertex_ai.preview.getGenerativeModel({
      model: 'gemini-1.5-flash-001',
      generationConfig: {
        maxOutputTokens: 20,
        temperature: 0.1,
      },
    });
    
    console.log('✅ Model instance created');
    
    console.log('📤 Sending test request...');
    const result = await model.generateContent([{
      role: 'user',
      parts: [{ text: 'Say "Hello"' }]
    }]);
    
    const response = await result.response;
    const text = response.candidates[0].content.parts[0].text;
    
    console.log('✅ SUCCESS! Basic Vertex AI is working');
    console.log(`📝 Response: "${text}"`);
    console.log('\n🎉 Vertex AI setup is correct!');
    console.log('❓ Issue is likely Claude model availability/naming');
    
    return true;
    
  } catch (error) {
    console.log('❌ BASIC CONNECTIVITY FAILED');
    console.log(`📝 Error: ${error.message}`);
    
    // Analyze the error
    if (error.message.includes('not found')) {
      console.log('\n🔍 DIAGNOSIS: Model or project not found');
      console.log('💡 SOLUTIONS:');
      console.log('  1. Enable Vertex AI API: gcloud services enable aiplatform.googleapis.com');
      console.log('  2. Check billing is enabled');
      console.log('  3. Verify project ID is correct');
    } else if (error.message.includes('permission')) {
      console.log('\n🔍 DIAGNOSIS: Permission issue');
      console.log('💡 SOLUTIONS:');
      console.log('  1. Add role: gcloud projects add-iam-policy-binding xtone-devadmin --member="serviceAccount:EMAIL" --role="roles/aiplatform.user"');
      console.log('  2. Try user auth: gcloud auth application-default login');
    } else if (error.message.includes('quota')) {
      console.log('\n🔍 DIAGNOSIS: Quota exceeded');
      console.log('💡 SOLUTIONS:');
      console.log('  1. Check quotas in Cloud Console');
      console.log('  2. Request quota increase');
    } else {
      console.log('\n🔍 DIAGNOSIS: Unknown error');
      console.log('💡 SOLUTIONS:');
      console.log('  1. Check all APIs are enabled');
      console.log('  2. Verify authentication setup');
      console.log('  3. Try different region');
    }
    
    return false;
  }
}

// Run the test
testBasicVertexAI().then(success => {
  if (success) {
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Now we know Vertex AI works');
    console.log('2. Test Claude models specifically');
    console.log('3. Enable Claude models in Model Garden if needed');
    process.exit(0);
  } else {
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Follow the solutions above');
    console.log('2. Run this test again: node test-basic-vertex.js');
    console.log('3. Once basic connectivity works, test Claude models');
    process.exit(1);
  }
}).catch(error => {
  console.error('🚨 Script failed unexpectedly:', error);
  process.exit(1);
});