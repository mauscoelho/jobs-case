# Job Search Application - Starred Code Challenge

A candidate-centric job search platform built with Remix and Cloudflare, allowing candidates to browse, search, and favorite job opportunities.

## 🎯 Challenge Requirements Implemented

- ✅ Browse job opportunities (titles, descriptions, companies)
- ✅ Search functionality by job title
- ✅ Favorite/unfavorite jobs feature
- ✅ Filter jobs by favorites
- ✅ Server-side caching for better performance
- ✅ Clean and responsive UI with Tailwind CSS

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. For production build:
```bash
npm run build
npm run start
```

## 🛠 Technical Decisions

### Architecture
- **Remix Framework**: Chosen for its server-side rendering capabilities and seamless form handling
- **Cloudflare**: For reliable and fast edge deployment
- **In-memory Caching**: Implemented to reduce API calls and improve performance

### Features Prioritized
1. Core job browsing and search functionality
2. Server-side caching to optimize API calls
3. Favorite functionality with server-side state management
4. Clean, responsive UI with proper feedback

### Future Improvements (Given More Time)
1. Persistent storage for favorites (currently in-memory)
2. User authentication
3. Better error handling and feedback
4. Better UI/UX

## 🎨 UI Components
- Responsive search bar with clear functionality
- Radio buttons for search type selection
- Favorite toggle with heart icons
- Job cards with company and description
- Favorites filter toggle

## 🔄 Data Flow
1. API calls are cached server-side for 1 hour
2. Search and filters are handled through URL parameters
3. Favorites are managed server-side with in-memory storage
4. Client-side favorite filtering for better UX

## 📝 API Integration
The application integrates with the provided jobs API endpoint:
- GET `/jobs?page={number}` for job listings
- Search functionality implemented through data filtering

## 💭 Considerations
- Implemented server-side caching to reduce API calls
- Kept favorites on server-side for future persistence implementation
- Used URL parameters for shareable search results
- Maintained clean code structure with separate concerns

## 🏗 Project Structure
```
app/
├── routes/
│   └── _index.tsx      # Main route with search and listing
├── services/
│   └── jobs-api.ts     # API and cache handling
└── types.ts            # TypeScript definitions
```
```
