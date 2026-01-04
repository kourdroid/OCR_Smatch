# Smatch OCR Dashboard

A multi-tenant document processing and OCR management platform built with Next.js 16, React 19, and Supabase.

## 🚀 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19 + TailwindCSS 4 |
| **State** | Zustand |
| **Backend** | Supabase (Auth, Database, Real-time) |
| **Database** | PostgreSQL with Row-Level Security |
| **Observability** | OpenTelemetry + Grafana Faro |
| **Deployment** | Vercel |

## 📁 Project Structure

```
interface/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (auth, admin)
│   │   ├── documents/          # Document listing page
│   │   ├── login/              # Authentication page
│   │   ├── settings/           # User settings
│   │   └── layout.tsx          # Root layout
│   ├── components/             # React components
│   │   ├── ui/                 # shadcn/ui primitives
│   │   └── *.tsx               # Feature components
│   ├── contexts/               # React contexts (Language)
│   ├── hooks/                  # Custom hooks (real-time, mobile)
│   ├── lib/                    # Utilities & services
│   │   ├── supabase.ts         # Supabase client
│   │   ├── document-schema.ts  # Schema validation service
│   │   └── utils.ts            # Helper functions
│   ├── stores/                 # Zustand stores
│   ├── types/                  # TypeScript definitions
│   └── middleware.ts           # Auth middleware
├── supabase/
│   └── migrations/             # Database migrations (19 files)
├── public/                     # Static assets
└── docs/
    └── ARCHITECTURE_ANALYSIS.md  # Technical analysis
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- Supabase project

### Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://...

# OpenTelemetry (optional)
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-endpoint
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic ...
```

### Installation

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start
```

## 🔐 Multi-Tenancy Architecture

The platform uses PostgreSQL Row-Level Security (RLS) to isolate tenant data:

- **Organizations**: Each tenant is an organization
- **Profiles**: Users linked to organizations
- **Documents**: Scoped by `organization_id`
- **Document Types**: Custom schemas per organization

```sql
-- Example RLS policy
CREATE POLICY "Clients see their own documents"
ON documents FOR SELECT
USING (organization_id = get_my_organization_id());
```

## 📊 Key Features

- 📄 **Document Management**: Upload, classify, and extract data from documents
- 🔍 **OCR Processing**: Automatic text extraction and field mapping
- 📈 **Real-time Updates**: Live document status via Supabase subscriptions
- 🏢 **Multi-Tenant**: Organization-based data isolation
- 🌐 **i18n**: English and French language support
- 🎨 **Modern UI**: Brand-themed with custom yellow (#FFC30D) accents

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test --coverage
```

## 📦 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment instructions.

### Quick Deploy

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

## 📚 Documentation

- [Architecture Analysis](./docs/ARCHITECTURE_ANALYSIS.md) - Deep technical review
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment steps

## 🎨 UI Style Guide

### Colors
- **Primary**: `#FFC30D` (Yellow)
- **Background**: `#FFFFFF` (White)
- **Text**: `#1A1A1A` (Near Black)
- **Muted**: `#7D7D7D` (Gray)

### Components
Built on [shadcn/ui](https://ui.shadcn.com/) with Radix primitives.

## 📝 License

Private - Smatch © 2025
