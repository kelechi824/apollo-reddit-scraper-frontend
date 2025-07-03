# Apollo's Reddit Prospecting & Content Generation Tool

Modern React frontend for Apollo Reddit Content Creator, featuring a comprehensive UI for analyzing Reddit content, identifying audience insights, and generating SEO-optimized content with AI.

## 🚀 Features

- **Modern UI**: Clean Apollo-branded interface with Tailwind CSS
- **Reddit Analysis**: Search and analyze posts from specific subreddits
- **AI Business Intelligence**: OpenAI-powered pain point and opportunity analysis
- **Content Generation**: Claude Sonnet 4 for SEO-optimized articles and LinkedIn posts
- **Brand Kit System**: Customizable brand variables with liquid template syntax
- **Chat Discovery**: Socratic learning interface for sales exploration and Reddit conversation starter
- **Real-time Status**: Backend connection monitoring
- **Responsive Design**: Mobile-friendly layout with navigation sidebar

## 🛠️ Tech Stack

- **Framework**: React 18+ with TypeScript
- **Styling**: Tailwind CSS 3.x
- **HTTP Client**: Axios 1.10.0
- **State Management**: React Hooks (useState, useEffect)
- **Storage**: localStorage for persistence
- **Build Tool**: Create React App
- **Icons**: Lucide React

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

## 🎨 Application Pages

### Landing Page
- Apollo-branded hero section with value proposition
- Social proof and company logos
- Mobile-responsive with hamburger menu
- Clear call-to-action for starting analysis

### Analysis Interface
- Keyword and subreddit selection with pill UI
- Results display with pain points, insights, and opportunities
- Integration with content creation and chat features

### Brand Kit
- 12+ customizable brand variables
- Liquid template syntax support ({{ brand_kit.* }})
- Persistent localStorage saving
- Used for content generation personalization

### Content Creation
- Customizable System and User prompts
- Generate SEO-optimized articles using Reddit insights
- LinkedIn thought leadership post creation
- Brand kit variable injection
- Export to Google Docs functionality

### Chat Discovery
- Socratic learning methodology for sales discovery and Reddit conversation starter
- Apollo solution positioning guidance
- Conversation stage tracking
- Multi-persona engagement strategies

### Settings & History
- Analysis preferences and API configuration
- Search history with localStorage persistence
- Theme customization and data management

## 🚦 Scripts

- `npm start` - Start development server (localhost:3002)
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 📱 Responsive Design

- **Desktop**: Grid layout with sidebar navigation
- **Tablet**: Responsive grid with collapsible elements
- **Mobile**: Single-column with slide-in navigation menu

## 🎯 Development Status

### Completed ✅
- [x] React app with TypeScript and Tailwind CSS
- [x] Apollo branding with custom design system
- [x] Complete Reddit analysis workflow interface
- [x] Content creation modal with Claude integration
- [x] Brand kit system with liquid template variables
- [x] Chat discovery interface for sales exploration
- [x] Mobile-responsive design with hamburger navigation
- [x] Real-time backend monitoring and error handling
- [x] localStorage persistence for settings and history

### Todo 📝
- [ ] Advanced form validation
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements
- [ ] Dark mode theme
- [ ] Export enhancements

## 🔧 Development

### Project Structure
```
├── public/             # Static assets and images
├── src/
│   ├── App.tsx        # Main router and layout
│   ├── pages/         # Page components
│   │   ├── LandingPage.tsx    # Marketing landing page
│   │   ├── AppPage.tsx        # Main analysis interface
│   │   ├── BrandKitPage.tsx   # Brand variables configuration
│   │   ├── HistoryPage.tsx    # Analysis history
│   │   └── SettingsPage.tsx   # User preferences
│   ├── components/    # Reusable components
│   │   ├── AnalysisInterface.tsx      # Main workflow interface
│   │   ├── AnalysisResultPanel.tsx    # Results display
│   │   ├── ContentCreationModal.tsx   # AI content generation
│   │   ├── LinkedInPostModal.tsx      # LinkedIn post creation
│   │   ├── DigDeeperModal.tsx         # Chat discovery interface
│   │   └── Navigation.tsx             # Sidebar navigation
│   ├── services/      # API and external integrations
│   ├── types/         # TypeScript definitions
│   └── index.css     # Global styles and design system
├── tailwind.config.ts # Tailwind configuration
└── package.json      # Dependencies and scripts
```

### Design System

#### Apollo Brand Colors
- Primary: Apollo Yellow (#EBF212)
- Secondary: Black (#000000)
- Background: White (#FFFFFF)
- Gray Scale: 50-900 variants
- Success: Green (#10B981)
- Error: Red (#EF4444)

#### Typography
- Font Family: Founders Grotesk, Inter, system fonts
- Headers: Font weight 600-700
- Body: Font weight 400
- Code: Monospace family

### Key Components

#### AnalysisInterface
- Keyword selection with chip UI
- Subreddit dropdown with popular options
- Real-time workflow execution
- Error handling and loading states

#### ContentCreationModal
- Reddit context integration
- Brand kit variable injection
- Claude Sonnet 4 content generation
- Export functionality

#### Navigation
- Mobile-responsive sidebar
- Route-based active states
- Hamburger menu for mobile
- Apollo branding integration

## 🔌 API Integration

### Backend Communication
- Automatic health check monitoring
- Real-time status updates
- Comprehensive error handling
- Timeout and retry logic

### Workflow Integration
```javascript
// Complete analysis pipeline
POST /api/workflow/run-analysis
{
  "keywords": ["sales automation"],
  "subreddits": ["sales"],
  "limit": 5
}
```

### Content Generation
```javascript
// Generate content with brand context
POST /api/content/generate
{
  "post_context": { /* Reddit analysis results */ },
  "brand_kit": { /* User's brand variables */ },
  "system_prompt": "...",
  "user_prompt": "..."
}
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
