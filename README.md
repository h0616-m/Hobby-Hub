# Hobby Hub

Hobby Hub is a community web application where people can connect around shared interests. Users can choose hobbies, discover and create posts, interact with posts, and participate in hobby-based chatrooms. The project also includes authentication and an administrative dashboard.

## Features

- **User authentication** — sign up, log in, and manage an authenticated session.
- **Hobby selection** — select interests to personalize the feed and discover relevant communities.
- **Community feed** — browse and search posts by hobby, title, or content.
- **Create and view posts** — publish hobby-related posts and open individual post details.
- **Post interactions** — comments and voting/likes are supported by the application API.
- **Hobby chatrooms** — open chatrooms associated with hobbies; the backend exposes message and streaming endpoints.
- **Admin dashboard** — administrative user management, banning/unbanning, and hobby analytics endpoints.
- **Responsive React interface** — single-page frontend built with React and Vite.

## Technology Stack

### Frontend
- React 18
- React Router
- Vite
- JavaScript and CSS

### Backend
- Java 17
- Spring Boot
- Spring Web MVC
- Spring Security
- Spring JDBC
- OAuth 2.0 client support (Google sign-in configuration is included)

### Database
- PostgreSQL (configured by default)
- H2 database dependency is also included for runtime/testing scenarios

## Project Structure

```text
Hobby-Hub-main/
├── frontend/
│   └── HobbyHub/
│       ├── src/
│       │   ├── api/             # Frontend API helpers
│       │   ├── context/         # Shared application state
│       │   ├── pages/           # Pages such as the admin dashboard
│       │   ├── App.jsx          # Routes and protected routes
│       │   └── ...              # Feed, posts, authentication, chatrooms, styles
│       ├── public/              # Public assets
│       ├── package.json
│       └── vite.config.js
├── src/main/java/com/hobby/hub/
│   ├── config/                  # Security configuration
│   ├── controller/              # REST/API controllers
│   ├── dto/                     # Request data objects
│   ├── model/                   # Domain models
│   ├── repository/              # Database access
│   └── HubApplication.java      # Spring Boot entry point
├── src/main/resources/
│   ├── application.properties   # Application and environment configuration
│   ├── schema.sql               # Database schema
│   └── data.sql                 # Initial data
├── Hobby_Meet_Up1.sql           # Additional SQL schema/design
├── pom.xml                      # Maven configuration
└── Dockerfile
```

## Prerequisites

Install the following before running the project:

- Java 17 or a compatible JDK
- Node.js and npm
- Maven (or use the included Maven wrapper)
- A PostgreSQL database, unless you configure another supported database

## Configuration

The backend reads database and Google OAuth settings from environment variables. Configure these in your local environment before running the backend:

| Variable | Purpose |
|---|---|
| `DB_URL` | JDBC URL for your PostgreSQL database |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Optional OAuth callback URI |

Example for a local PostgreSQL database (replace values with your own):

```bash
export DB_URL="jdbc:postgresql://localhost:5432/hobbyhub"
export DB_USERNAME="your_database_user"
export DB_PASSWORD="your_database_password"
export GOOGLE_CLIENT_ID="your_google_client_id"
export GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

On Windows PowerShell, use `$env:VARIABLE_NAME="value"` to set an environment variable for the current terminal session.

**Security note:** Never commit real passwords, OAuth secrets, access tokens, or other credentials to Git. If credentials have already been committed or shared, rotate/revoke them and remove them from the repository history as appropriate. Use environment variables or a secrets manager instead.

## Running the Application

The project has a Spring Boot backend and a React frontend. Run them in separate terminals.

### 1. Start the backend

From the project root:

```bash
./mvnw spring-boot:run
```

On Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend is configured to use port **8080** by default. Ensure the database is reachable and the environment variables are configured first.

### 2. Start the frontend

Open another terminal:

```bash
cd frontend/HobbyHub
npm install
npm run start
```

Vite will print the local development URL in the terminal (commonly `http://localhost:5173`).

### 3. Build the frontend

From `frontend/HobbyHub`:

```bash
npm run build
```

The production build is written to `frontend/HobbyHub/dist/`.

## Main Application Routes

| Route | Purpose |
|---|---|
| `/auth` | Sign in / sign up |
| `/hobbies` | Choose hobbies |
| `/feed` | Browse and search the community feed |
| `/post/:id` | View a post and its interactions |
| `/chatroom/:id` | Open a hobby chatroom |
| `/admin` | Administrative dashboard (admin access required) |

Some routes require an authenticated user. Admin routes require administrator privileges.

## API and Database Notes

The Spring Boot backend contains controllers for authentication, posts, chatrooms, and administration. SQL initialization is configured in `application.properties`; check `schema.sql` and `data.sql` before connecting to a database you care about.

The repository also includes ER-diagram files and an additional SQL file documenting database relationships/design.

## Troubleshooting

- **Backend won't start:** Check your Java version, Maven output, database connection settings, and port 8080 availability.
- **Frontend dependencies fail:** Confirm Node.js/npm are installed, then run `npm install` inside `frontend/HobbyHub`.
- **Login/OAuth errors:** Verify Google OAuth credentials and the configured redirect URI in your Google Cloud project and application environment.
- **Database initialization errors:** Review `schema.sql`, `data.sql`, and the active database configuration. Avoid pointing development initialization scripts at production data.
- **Frontend cannot reach the backend:** Check the API base URL and any proxy/CORS settings in the frontend configuration.

## Development Status

This README documents the structure and configuration visible in the repository. Depending on the environment, database credentials, OAuth configuration, and deployment settings may need to be supplied before the application runs successfully.

## License

No license file was identified in the project archive. Add a `LICENSE` file if you intend to publish or distribute the project with explicit license terms.
