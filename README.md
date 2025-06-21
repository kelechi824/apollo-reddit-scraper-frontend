# Apollo's Reddit Prospecting & Content Generation Tool

Modern React frontend for Apollo Reddit Scraper, featuring a clean UI for analyzing Reddit content and identifying audience insights and content opportunities.

## 🚀 Features

- **Modern UI**: Clean Apollo-branded interface with Tailwind CSS
- **Real-time Status**: Backend connection monitoring
- **Responsive Design**: Mobile-friendly layout
- **Interactive Forms**: Keyword input and subreddit selection
- **Results Display**: Analyzed posts with sorting and filtering
- **Search History**: localStorage-based search persistence

## 🛠️ Tech Stack

- **Framework**: React 18+
- **Styling**: Tailwind CSS 3.x
- **HTTP Client**: Axios 1.10.0
- **State Management**: React Hooks (useState, useEffect)
- **Storage**: localStorage for search history
- **Build Tool**: Create React App

## 📋 Setup Instructions

### Prerequisites
- Node.js 18+
- Backend API running on localhost:3003

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/kelechi824/apollo-reddit-scraper-frontend.git
   cd apollo-reddit-scraper-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults should work)
   ```

4. Start the development server:
   ```bash
   npm start
   ```

Frontend runs on http://localhost:3002

## 🔑 Environment Variables

```env
# Backend API Configuration
REACT_APP_API_URL=http://localhost:3003
REACT_APP_APP_NAME=Apollo Reddit Scraper

# Development Server Port
PORT=3002
```

## 🎨 UI Components

### Header
- Apollo logo and branding
- Real-time backend connection status
- Responsive navigation

### Main Content
- Clean card-based layout
- Connection status indicators
- Search form (coming soon)
- Results display (coming soon)

### Status Indicators
- 🟢 Green: Backend connected
- 🔴 Red: Backend disconnected  
- 🟡 Yellow: Connecting...

## 🚦 Scripts

- `npm start` - Start development server (localhost:3002)
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 📱 Responsive Design

- **Desktop**: Full-width layout with sidebar
- **Tablet**: Stacked layout with collapsible elements
- **Mobile**: Single-column mobile-first design

## 🎯 Development Status

### Completed ✅
- [x] React app setup with Create React App
- [x] Tailwind CSS integration
- [x] Apollo branding and logo
- [x] Backend connection monitoring
- [x] Responsive header and layout
- [x] Environment configuration

### In Progress 🚧
- [ ] Search form component
- [ ] Subreddit dropdown
- [ ] Results display
- [ ] localStorage integration

### Todo 📝
- [ ] Form validation
- [ ] Loading states
- [ ] Error handling
- [ ] Search history
- [ ] Export functionality

## 🔧 Development

### Project Structure
```
├── public/             # Static assets
├── src/
│   ├── App.js         # Main application component
│   ├── App.css        # Component styles
│   ├── index.js       # React entry point
│   ├── index.css      # Global styles with Tailwind
│   └── components/    # React components (coming soon)
├── tailwind.config.js # Tailwind configuration
├── package.json       # Dependencies and scripts
└── README.md         # This file
```

### Tailwind Configuration
Custom Apollo colors defined:
- `apollo-yellow`: #F7DF1E (brand color)
- `apollo-black`: #000000 (text)
- `apollo-gray`: #f3f4f6 (background)

### Adding New Components
1. Create component in `src/components/`
2. Import and use in `App.js`
3. Add Tailwind classes for styling
4. Test responsiveness

## 🔌 API Integration

### Backend Connection
- Automatic health check on app load
- Real-time status updates
- Error handling for connection failures

### Axios Configuration
```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3003',
  timeout: 10000,
});
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-component`
3. Commit changes: `git commit -m 'Add new component'`
4. Push to branch: `git push origin feature/new-component`
5. Submit a Pull Request

## 📄 License

ISC

## 🔗 Related

- [Backend Repository](https://github.com/kelechi824/apollo-reddit-scraper-backend)
- [Apollo.io](https://apollo.io)

## 🎨 Design System

### Colors
- Primary: Apollo Yellow (#F7DF1E)
- Secondary: Black (#000000)
- Background: Light Gray (#f3f4f6)
- Success: Green (#10B981)
- Error: Red (#EF4444)
- Warning: Yellow (#F59E0B)

### Typography
- Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI'
- Headers: Font weight 600-700
- Body: Font weight 400
- Code: Monospace font family
