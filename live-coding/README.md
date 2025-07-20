# Learning Portal

High-performance learning portal designed for 100K+ concurrent users with focus on web design, access control, and ease of access.

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (main)/            # Main application pages
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/                # Primitive UI components
│   └── shared/            # Shared components
├── lib/                   # Utilities and libraries
├── hooks/                 # Custom React hooks
└── styles/                # Global styles
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Code Quality

This project uses:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety
- **Husky** for pre-commit hooks

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom components
- **Authentication**: Clerk (planned)
- **Database**: Supabase (planned)
- **Video**: Mux (planned)

## Performance Targets

- **<2s initial page load** for course pages
- **<100ms navigation** between course modules  
- **99.9% uptime** during peak learning hours
- **Support for 100K+ concurrent video streams**

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure all checks pass before committing
4. Update documentation as needed

## License

This project is licensed under the MIT License.