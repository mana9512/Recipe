# Recipe Portal

A full-stack application for managing recipes, creating grocery lists, and generating new recipes using AI.

## Features

- Search recipes by name with real-time suggestions
- Select up to 4 recipes and generate a consolidated grocery list
- Add new recipes using AI-powered recipe generation
- Scale recipes to 8 servings automatically
- Separate handling for main ingredients and spices
- Google OAuth authentication
- Real-time search functionality

## Project Structure

```
Recipe/
├── frontend/         # React frontend application
│   ├── src/         # Source files
│   ├── public/      # Public assets
│   └── build/       # Production build
├── backend/         # Express backend server
│   ├── src/         # Source files
│   ├── routes/      # API routes
│   └── public/      # Served static files
└── README.md        # Project documentation
```

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- Google OAuth credentials (for authentication)

## Setup & Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Recipe
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Environment Setup:

Backend `.env` file (create in backend directory):
```
MONGODB_URI=your_mongodb_connection_string
PORT=8000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENAI_API_KEY=openai_key
```

Frontend `.env` file (create in frontend directory):
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## Development

1. Start the backend server in development mode:
```bash
cd backend
npm run dev  # Uses nodemon for auto-reloading
```

2. In a separate terminal, start the frontend development server:
```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:8000`.

## Production Build

To build and deploy the application:

1. Build the frontend:
```bash
cd frontend
npm start
```
cd ../backend
npm run import-recipes  #to upload csv to mongodb
npm start
```

The application will be served from `http://localhost:8000`.

## API Endpoints

### Authentication
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `GET /auth/logout` - Logout

### Recipes
- `GET /api/recipes/search?q=query` - Search recipes by name
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

## Troubleshooting

1. If MongoDB connection fails:
   - Verify your MongoDB URI in the backend `.env` file
   - Ensure MongoDB service is running
   - Check network connectivity

2. If Google authentication fails:
   - Verify Google OAuth credentials in both frontend and backend `.env` files
   - Ensure callback URLs match in Google Console settings
   - Check if cookies are enabled in your browser

3. If the application doesn't load:
   - Check if both frontend and backend servers are running
   - Verify the port numbers in your `.env` files
   - Clear browser cache and reload

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
