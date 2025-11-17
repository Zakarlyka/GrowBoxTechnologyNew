# Deployment Guide - Grow Box Technology

This guide explains how to deploy your Grow Box Technology IoT platform to various hosting providers.

## Building for Production

Before deployment, build the project:

```bash
npm install
npm run build
```

This creates a `dist` folder with all compiled assets ready for deployment.

## Hosting on adm.tools

1. Build the project: `npm run build`
2. Upload the entire `dist` folder contents to your adm.tools hosting
3. The site will work immediately with proper routing support via `.htaccess`

## Other Hosting Options

### Netlify
- Connect your GitHub repository
- Build command: `npm run build`
- Publish directory: `dist`
- The `netlify.toml` file is already configured

### Vercel
- Connect your GitHub repository  
- The `vercel.json` file handles routing automatically

### Static File Hosting
- Upload `dist` folder contents to any web server
- Ensure `.htaccess` file is uploaded for proper routing

## Configuration Files Included

- `public/.htaccess` - Apache server routing
- `public/_redirects` - Netlify routing
- `netlify.toml` - Netlify configuration
- `vercel.json` - Vercel configuration
- `public/404.html` - GitHub Pages fallback

## Environment Variables

The application uses Supabase for backend services. Make sure your Supabase project is properly configured:

1. Authentication providers (if using OAuth)
2. Database policies and permissions
3. CORS settings for your domain

## SEO & PWA Features

The site includes:
- Complete SEO meta tags
- PWA manifest for mobile app experience
- Optimized robots.txt and sitemap.xml
- Open Graph and Twitter Card support

## Troubleshooting

If you experience routing issues:
1. Ensure `.htaccess` is uploaded (Apache servers)
2. Check server configuration supports HTML5 pushState routing
3. Verify all static assets are accessible

The site is designed to work on any modern hosting platform without additional configuration.