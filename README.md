# Adonis App

This project is a REST API server built with [AdonisJS](https://adonisjs.com/), using Lucid ORM and VineJS for validation.

To get started, follow the instructions below to set up the project on your local machine.

## Project Structure

```
|-- app/
|   |-- controllers/           # Controllers for resource operations
|   |-- exceptions/            # Custom exception handlers
|   |-- middleware/            # HTTP middleware
|   |-- models/                # Lucid ORM models
|   |-- validators/            # VineJS validators
|-- bin/
|   |-- console.ts             # Ace command line entry
|   |-- server.ts              # App server entry
|-- config/                    # App configuration files
|-- database/
|   |-- factories/             # Model factories for testing/seeding
|   |-- migrations/            # Database migration files
|   |-- seeders/               # Database seeders
|-- start/
|   |-- env.ts                 # Environment setup
|   |-- kernel.ts              # HTTP kernel (middleware registration)
|   |-- routes.ts              # Route definitions
|-- storage/                   # File uploads and storage
|-- tests/                     # Test files
|-- .env.example               # Example environment variables
|-- .gitignore
|-- package.json
|-- tsconfig.json
|-- Dockerfile
|-- compose.yaml
```

## Setup Instructions

1. Clone the repository or download the source code.

2. Navigate to the project directory.

3. Install the dependencies using npm:

   ```bash
   npm install
   ```

4. Create a `.env` file in the root directory. Use `.env.example` as a template.

5. Run the following command to migrate the database:

   ```bash
   npm run db-migrate
   ```

6. (Optional) Seed the database with sample data:

   ```bash
   npm run db-seed
   ```

7. Start the development server:

   ```bash
   npm run dev
   ```

8. Access the API at `http://localhost:3333` or the configured `PORT` in your `.env` file.

9. Run linting:

   ```bash
   npm run lint
   ```

10. Run tests:

    ```bash
    npm test
    ```

11. Run tests with coverage report:

    ```bash
    npm run test:coverage
    ```

12. For a production build, run:

    ```bash
    npm run build
    ```

13. Start the production server:

    ```bash
    npm start
    ```

## Additional Information

### Data Definition

- The database schema is defined by Lucid models in `app/models/`.
- Migration files are located under `database/migrations/`.
