# Splitwise App

A web application for splitting expenses with friends and family, built with Next.js and PostgreSQL.

## Architecture

This application is split into two parts:
1. **Frontend**: A static Next.js application hosted on GitHub Pages
2. **Backend API**: A separate Express.js API that connects to a PostgreSQL database

## Deployment Instructions

### Step 1: Deploy the Backend API to Vercel

1. Create a Vercel account if you don't have one: https://vercel.com/signup

2. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Set up your PostgreSQL database:
   - Create a PostgreSQL database using a service like [Supabase](https://supabase.com), [Neon](https://neon.tech), or [Railway](https://railway.app)
   - Get your database connection string

4. Create a `.env` file in the `api` directory by copying the example:
   ```bash
   cp api/.env.example api/.env
   ```

5. Update the `.env` file with your database connection string and CORS settings:
   ```
   DATABASE_URL="postgresql://username:password@hostname:port/database"
   ALLOWED_ORIGINS="https://YOUR_GITHUB_USERNAME.github.io,http://localhost:3000"
   ```

6. Deploy the API to Vercel:
   ```bash
   cd api
   vercel
   ```

7. Follow the prompts to link your project to Vercel.

8. Set up environment variables in Vercel:
   - Go to your project on Vercel
   - Navigate to Settings > Environment Variables
   - Add your `DATABASE_URL` and `ALLOWED_ORIGINS` variables

9. After deployment, note your API URL (e.g., `https://your-api-url.vercel.app`)

### Step 2: Update the Frontend API URL

1. Edit `app/lib/hooks/useApi.ts` to point to your deployed API URL:
   ```typescript
   if (process.env.NODE_ENV === 'production') {
     return 'https://your-api-url.vercel.app'; // Replace with your actual API URL
   }
   ```

### Step 3: Deploy the Frontend to GitHub Pages

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for GitHub Pages deployment"
   git push origin main
   ```

2. Enable GitHub Pages in your repository settings:
   - Go to your repository on GitHub
   - Navigate to Settings > Pages
   - Set the source to "GitHub Actions"

3. The GitHub Actions workflow will automatically build and deploy your site when you push to the main branch.

4. Your site will be available at `https://YOUR_GITHUB_USERNAME.github.io/splitwise`

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run the API server locally:
   ```bash
   cd api
   npm install
   npm run dev
   ```

## Features

- Add and manage people
- Create expense groups
- Add expenses with custom splits
- Multi-currency support
- Track balances between people
- Settle up debts
- Dark mode support
- Responsive design

## Important Notes

- The GitHub Pages deployment is static, so all database operations happen through the separate API
- Make sure to update CORS settings in the API to allow requests from your GitHub Pages domain
- For a production application, consider adding authentication to your API

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/splitwise.git
cd splitwise
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## How to Use

1. **Add People**: Start by adding the names of people who are sharing expenses.
2. **Add Expenses**: Enter expense details including who paid and how it should be split.
3. **View Balances**: See a summary of who owes whom and how much.
4. **Settle Up**: Use the balance information to settle up with your friends.

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [React Icons](https://react-icons.github.io/react-icons/) - Icon library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the [Splitwise](https://www.splitwise.com/) app
- Built as a learning project for Next.js and Tailwind CSS 