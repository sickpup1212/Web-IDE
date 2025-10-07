## **Developer Specification: Web-Based IDE**

This document outlines the requirements for a web application that functions as a real-time HTML, CSS, and JavaScript editor with project management, live previews, and AI-powered assistance.

---
## **1. System Architecture**
* **Frontend**: A **Single Page Application (SPA)**. The choice of framework (e.g., React, Vue, Svelte) is at the developer's discretion, but it must be capable of handling complex state management.
* **Backend**: A **RESTful API** built with a modern framework (e.g., Node.js with Express.js, Python with Django/FastAPI). The backend is responsible for user authentication, project CRUD operations, and proxying requests to the AI service.
* **Database**: **PostgreSQL** is the designated database for storing all user and project data.
* **AI Integration**: The backend will include an endpoint that securely communicates with a third-party Large Language Model (LLM) API (e.g., OpenAI API, Google Gemini API). API keys must be stored securely as environment variables on the server.



---
## **2. User Authentication & Data Schema**
### **2.1 Authentication Flow**
* **Gated Access**: The application's core features (dashboard, editor) are **inaccessible without a valid session**. Unauthenticated users must be redirected to a login page.
* **Required Pages**:
    * **Registration**: A form for new users to sign up with a **username** and **password**.
    * **Login**: A form for existing users to sign in.
* **Session Management**: User sessions will be managed using **JSON Web Tokens (JWT)**. Tokens should be stored in secure, `httpOnly` cookies to prevent XSS attacks.
* **Security**: Passwords must be **hashed** using a strong algorithm like **bcrypt** before being stored in the database.

### **2.2 Database Schema**
Two primary tables are required in the PostgreSQL database.

* **`users` Table**:
    * `id`: `SERIAL PRIMARY KEY`
    * `username`: `VARCHAR(255) UNIQUE NOT NULL`
    * `password_hash`: `VARCHAR(255) NOT NULL`
    * `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

* **`projects` Table**:
    * `id`: `SERIAL PRIMARY KEY`
    * `user_id`: `INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE`
    * `name`: `VARCHAR(255) NOT NULL`
    * `html_code`: `TEXT`
    * `css_code`: `TEXT`
    * `js_code`: `TEXT`
    * `created_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`
    * `updated_at`: `TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`

---
## **3. API Endpoints**
The backend must expose the following RESTful API endpoints. All `/api/projects` routes require authentication.

* `POST /api/auth/register`: Creates a new user.
* `POST /api/auth/login`: Authenticates a user and returns a JWT.
* `POST /api/auth/logout`: Invalidates the user's session.
* `GET /api/projects`: Fetches all projects for the authenticated user.
* `POST /api/projects`: Creates a new project.
* `PUT /api/projects/:id`: Updates an existing project by its ID.
* `DELETE /api/projects/:id`: Deletes a project by its ID.
* `POST /api/ai/chat`: Proxies a user's message (and optional code context) to the configured AI service.

---
## **4. Frontend Features & Behavior**
### **4.1 Project Dashboard**
* This is the default view after a user logs in.
* It displays a list of the user's projects, fetched from the `GET /api/projects` endpoint.
* Each project in the list must display its **name** and a **dropdown menu** with the following actions:
    * **Open**: Navigates the user to the editor view for that project (e.g., `/editor/:id`).
    * **Rename**: Allows the user to update the project's name. This can be an inline text edit or a modal prompt that triggers a `PUT /api/projects/:id` call.
    * **Delete**: Prompts the user for confirmation and then triggers a `DELETE /api/projects/:id` call.
    * **Export**: Generates the project's HTML, CSS, and JS content as downloadable files (`.html`, `.css`, `.js`) directly in the browser.

### **4.2 Editor View**
* **Layout**: The editor consists of a tabbed interface for HTML, CSS, and JS `<textarea>` elements, and an `<iframe>` for the live preview.
* **Live Preview**: The `<iframe>` content must be updated in real-time as the user types in any of the code text areas. Use the `srcdoc` attribute for this.
* **Save Logic**:
    * On a new, unsaved project, the "Save" button will act as "Save As," prompting for a project name before making a `POST /api/projects` request.
    * On an existing project, the "Save" button will update the content by making a `PUT /api/projects/:id` request with no prompt.
    * A "Save As" button will always prompt for a name and create a new project via `POST /api/projects`.
* **Undo/Redo**:
    * This must be a **global history stack**. Actions are pushed onto the stack in the order they occur, regardless of which code editor is active.
    * The native `undo` behavior of the `<textarea>` elements must be intercepted and managed by a custom state management solution.

### **4.3 AI Chat Modal**
* The modal is triggered by an icon in the editor's vertical toolbar.
* It must contain a scrollable chat history view, a text input for the user's message, and a "Send" button.
* A checkbox labeled **"Include project code"** must be located near the "Send" button.
* When a message is sent, the frontend calls `POST /api/ai/chat`. If the checkbox is checked, the request body must include the current content of all three code editors along with the user's message.

---
## **5. Error Handling**
* **Backend**: The API must use standard HTTP status codes to indicate success or failure (e.g., `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `404` Not Found, `500` Internal Server Error). Error responses should include a JSON body with a clear `message` field.
* **Frontend**: The client application must handle API errors gracefully.
    * Display user-friendly toast notifications or messages for errors (e.g., "Invalid username or password," "Failed to save project.").
    * Show loading indicators (e.g., spinners) during API requests.
    * Manage network failure states (e.g., display a "Connection failed" message).

---
## **6. Testing Plan**
A robust testing strategy is required to ensure application stability.

* **Unit Tests**:
    * **Backend**: Each API endpoint's logic should be tested in isolation (e.g., verify that `POST /api/projects` correctly creates a database entry).
    * **Frontend**: Individual UI components should be tested to ensure they render correctly based on props and state.
* **Integration Tests**:
    * Test the full flow of API interactions (e.g., ensure that registering, logging in, and creating a project works as a complete sequence).
    * Verify the frontend state correctly updates in response to API calls.
* **End-to-End (E2E) Tests**: Use a framework like Cypress or Playwright to automate and test critical user workflows from start to finish. Key scenarios include:
    * A user successfully registers, logs in, and logs out.
    * A user creates, saves, re-opens, renames, and deletes a project.
    * The live preview updates correctly.
    * The global undo/redo stack works as expected across all three editors.
    * The AI chat can be used both with and without code context.
