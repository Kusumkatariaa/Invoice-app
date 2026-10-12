# Invoice App

A web-based invoice management application built with React, TypeScript, and Tailwind CSS. It allows users to manage invoices and items through a simple interface.

## Features

- User registration and login
- Invoice listing and search
- Create and edit invoices
- Invoice print preview
- Date-range filters: Today, Week, Month, Year, and Custom
- Column chooser for the invoice table
- Export invoice data to CSV
- Item Master management
- Dashboard with invoice summary and charts

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- REST API

## Getting Started

### Prerequisites

- Node.js
- npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Kusumkatariaa/Invoice-app.git
   ```

2. Navigate to the project directory:

   ```bash
   cd Invoice-app
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL shown in your terminal.

## Build

To create a production build:

```bash
npm run build
```

## API

The application communicates with a REST API for authentication and invoice-related operations.

## Notes

- Authentication uses a token returned by the API.
- A valid API connection is required for features that use server data.
