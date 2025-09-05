const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');

async function startNgrok() {
  try {
    const port = process.env.PORT || 3000;
    
    console.log('Starting ngrok tunnel...');
    const url = await ngrok.connect(port);
    
    console.log(`\n🚀 ngrok tunnel started!`);
    console.log(`📡 Public URL: ${url}`);
    console.log(`🔗 Local URL: http://localhost:${port}`);
    console.log(`\n📝 Update your .env file with:`);
    console.log(`BASE_URL=${url}`);
    
    // Optionally update .env file automatically
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('BASE_URL=')) {
        envContent = envContent.replace(/BASE_URL=.*/, `BASE_URL=${url}`);
      } else {
        envContent += `\nBASE_URL=${url}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log(`✅ .env file updated automatically`);
    }
    
    console.log(`\n🔄 Restart your server to use the new webhook URL`);
    
  } catch (error) {
    console.error('Failed to start ngrok:', error);
    process.exit(1);
  }
}

startNgrok();