# Customer App

A modern, production-ready React application built with cutting-edge technologies and best practices.

## 🚀 Tech Stack

### Core

- **Build Tool**: Vite
- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui

### State Management

- **Forms**: React Hook Form + Zod
- **API**: React Query + Axios
- **Global State**: Zustand

### Routing & Testing

- **Routing**: React Router
- **Testing**: Vitest + React Testing Library

### DevOps

- **Deployment**: Vercel / AWS Amplify
- **CI/CD**: GitHub Actions
- **Containerization**: Docker

## 📦 Project Structure

```
customer-app/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── layout/        # Layout components
│   │   └── ui/            # shadcn/ui components
│   ├── lib/               # Utilities and API client
│   ├── pages/             # Page components
│   ├── store/             # Zustand stores
│   ├── test/              # Test setup
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── Dockerfile             # Production Dockerfile
├── Dockerfile.dev         # Development Dockerfile
├── docker-compose.yml     # Docker Compose configuration
└── package.json
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Docker (optional)

### Local Development

1. Clone the repository:

```bash
git clone <repository-url>
cd customer-app
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Start development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate test coverage report

## 🐳 Docker

### Development

Run the app in development mode with Docker:

```bash
docker-compose up
```

### Production

Build and run production image:

```bash
docker-compose --profile production up app-prod
```

Or build manually:

```bash
docker build -t customer-app .
docker run -p 8080:80 customer-app
```

## 🧪 Testing

Run tests:

```bash
npm run test
```

Run tests in watch mode:

```bash
npm run test -- --watch
```

Generate coverage report:

```bash
npm run test:coverage
```

## 🚀 Deployment

### Vercel

1. Install Vercel CLI:

```bash
npm i -g vercel
```

2. Deploy:

```bash
vercel
```

### AWS Amplify

1. Connect your repository to AWS Amplify
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Deploy

### Manual Deployment

Build the project:

```bash
npm run build
```

The `dist` folder contains the production-ready files.

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### Adding shadcn/ui Components

Add new components using the CLI:

```bash
npx shadcn@latest add [component-name]
```

Example:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
```

## 📝 Code Style

This project uses:

- ESLint for code linting
- TypeScript for type checking
- Prettier-compatible formatting (via ESLint)

Run linter:

```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/)
- [React](https://react.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://github.com/pmndrs/zustand)
