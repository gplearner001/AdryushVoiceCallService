# Voice Agent Frontend

Next.js frontend application for the Voice Agent API management dashboard.

## Features

- Real-time API status monitoring
- Call management interface
- Knowledge base visualization
- Responsive design with Tailwind CSS

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_API_URL`: URL of your Express.js backend API

## Deployment on Vercel

1. Connect your GitHub repository to Vercel
2. Set the environment variable:
   - `NEXT_PUBLIC_API_URL`: Your Render backend URL (e.g., `https://your-app.onrender.com`)
3. Deploy

### Build Command
```bash
npm run build
```

### Output Directory
```
.next
```

## Project Structure

```
frontend/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```