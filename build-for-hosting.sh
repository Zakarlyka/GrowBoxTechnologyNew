#!/bin/bash

echo "🚀 Building Grow Box Technology for production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Create deployment package
echo "📁 Creating deployment package..."
cd dist
zip -r ../grow-box-technology-website.zip .
cd ..

echo "✅ Build complete! 

📁 Files ready for deployment:
   - dist/ folder contains all website files
   - grow-box-technology-website.zip contains packaged website

🌐 Upload instructions for adm.tools:
   1. Extract grow-box-technology-website.zip OR upload dist/ folder contents
   2. Upload to your web hosting public_html directory
   3. Your website will be immediately available

📋 What's included:
   ✓ Optimized production build
   ✓ SEO meta tags and sitemap
   ✓ PWA support for mobile
   ✓ Proper routing configuration (.htaccess)
   ✓ All static assets compressed

🔧 If you experience issues:
   - Ensure .htaccess file is uploaded (for routing)
   - Check file permissions are set correctly
   - Verify all files uploaded successfully

Happy hosting! 🎉"