# Web-Based IDE - Backend

Backend API server for the Web-Based IDE project, built with Node.js, Express, TypeScript, and PostgreSQL.

<img width="1321" height="604" alt="webide1" src="https://github.com/user-attachments/assets/cb8e365e-8249-4e0c-949d-3b18f77aba47" />

<img width="735" height="853" alt="webide2" src="https://github.com/user-attachments/assets/7da20aec-8518-462b-8919-3f82674612e9" />

<img width="1520" height="864" alt="webide3" src="https://github.com/user-attachments/assets/ca07aec2-7284-41ea-ba4c-653661be8da7" />

<img width="1105" height="822" alt="webide4" src="https://github.com/user-attachments/assets/2d84982f-808c-4643-b3a6-94af69e9ebca" />

## Features

- RESTful API with Express
- TypeScript for type safety
- PostgreSQL database with connection pooling
- JWT-based authentication
- Comprehensive test coverage with Jest
- Health check endpoint for monitoring

## Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL (v12+)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=web_ide
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your-secret-key
```

4. Create the PostgreSQL database:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE web_ide;
\q
```

5. Initialize the database schema:
```bash
npm run db:init
```

## Development

Start the development server with hot-reload:
```bash
npm run dev
```

The server will start on http://localhost:5000

## Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm test` - Run test suite
- `npm run db:init` - Initialize database schema

## API Endpoints

### Health Check
- **GET** `/api/health` - Server health check
  - Returns: `{ status: "ok", timestamp: string, uptime: number }`

### Authentication (Coming Soon)
- **POST** `/api/auth/register` - Register new user
- **POST** `/api/auth/login` - Login user
- **POST** `/api/auth/logout` - Logout user
- **GET** `/api/auth/me` - Get current user

### Projects (Coming Soon)
- **GET** `/api/projects` - Get user's projects
- **POST** `/api/projects` - Create new project
- **GET** `/api/projects/:id` - Get single project
- **PUT** `/api/projects/:id` - Update project
- **DELETE** `/api/projects/:id` - Delete project

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table
```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  html_code TEXT DEFAULT '',
  css_code TEXT DEFAULT '',
  js_code TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

The test suite includes:
- Health check endpoint tests
- Database connection tests
- Unit tests for models (coming soon)
- Integration tests for API endpoints (coming soon)

## Project Structure

```
backend/
├── src/
│   ├── server.ts          # Express server setup
│   ├── db.ts              # Database connection module
│   ├── models/            # Data models (coming soon)
│   ├── routes/            # API routes (coming soon)
│   ├── middleware/        # Express middleware (coming soon)
│   └── services/          # Business logic (coming soon)
├── database/
│   ├── schema.sql         # Database schema
│   └── init.ts            # Database initialization script
├── tests/
│   ├── setup.ts           # Test configuration
│   ├── health.test.ts     # Health endpoint tests
│   └── db.test.ts         # Database tests
├── .env.example           # Example environment variables
├── .gitignore             # Git ignore rules
├── jest.config.js         # Jest configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment (development/production/test) | development |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:3000 |
| DB_HOST | PostgreSQL host | localhost |
| DB_PORT | PostgreSQL port | 5432 |
| DB_NAME | Database name | web_ide |
| DB_USER | Database user | postgres |
| DB_PASSWORD | Database password | postgres |
| JWT_SECRET | Secret key for JWT | (required) |
| JWT_EXPIRES_IN | JWT expiration time | 7d |

## Error Handling

The API uses a centralized error handling middleware that returns errors in the format:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Maintain test coverage above 80%
4. Use meaningful commit messages
5. Update documentation as needed

## License

ISC

# Web-Based IDE - Frontend
Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
                                                                           
