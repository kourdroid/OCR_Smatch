# Vercel Deployment Guide

## Prerequisites
- Vercel account
- GitHub repository (recommended)

## Environment Variables
Set these environment variables in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL=https://pwwfyanvizyegbirsqas.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deployment Steps

### Option 1: GitHub Integration (Recommended)
1. Push your code to a GitHub repository
2. Connect your GitHub account to Vercel
3. Import your repository in Vercel
4. Add the environment variables in Project Settings
5. Deploy automatically

### Option 2: Vercel CLI
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts
4. Add environment variables via CLI or dashboard

## Configuration Files
- `vercel.json` - Vercel-specific configuration
- `next.config.ts` - Next.js configuration with Supabase allowed hosts
- `.env.example` - Template for environment variables

## Important Notes
- Environment variables are already configured for Supabase
- Image optimization is set up for Supabase storage
- Security headers are configured
- The app is ready for production deployment

## Post-Deployment
1. Test all functionality
2. Verify Supabase connection
3. Check real-time features
4. Validate document upload/processing