# Biometric Deduplication Frontend

## Overview

Angular frontend for the biometric facial recognition deduplication system. Provides user interface for authentication, file upload, process management, and review of deduplication results.

-Deployment ready , build with success , ken fema haja send mail

## Prerequisites

- Node.js (v16+ recommended)
- npm
- Angular CLI (`npm install -g @angular/cli`)

## Setup

1. Clone the repository
2. Navigate to the frontend directory (if not already at root)
3. Install dependencies:
   ```sh
   npm install
   ```
4. (Optional) Configure environment variables in `src/environments/environment.ts` if you need to change API endpoints or settings

## Running the Frontend

Start the development server:

```sh
ng serve
```

- Default URL: [http://localhost:4200](http://localhost:4200)
- The app will automatically reload if you change any source files.

## Building for Production

To build the frontend for production deployment:

```sh
ng build --configuration production
```

- Output will be in the `dist/` directory.

## Backend API

- The frontend communicates with the backend API (see `/Backend Stage/README.md` for backend setup)
- API documentation (Swagger): typically at `https://localhost:7294/swagger` or your configured backend URL

## Further Documentation

- Detailed feature and workflow documentation is available in `/Backend Stage/Documentation/`
- For authentication, deduplication, and process details, see the backend documentation files
