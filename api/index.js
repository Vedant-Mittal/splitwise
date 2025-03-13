const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Parse allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://YOUR_GITHUB_USERNAME.github.io', 'http://localhost:3000'];

// Enable CORS for your GitHub Pages domain
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// People endpoints
app.get('/api/people', async (req, res) => {
  try {
    const people = await prisma.person.findMany();
    res.json(people);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/people', async (req, res) => {
  try {
    const { name } = req.body;
    const person = await prisma.person.create({
      data: { name }
    });
    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/people/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const person = await prisma.person.update({
      where: { id },
      data: { name }
    });
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/people/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.person.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Expenses endpoints
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        splitAmong: true
      }
    });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Groups endpoints
app.get('/api/groups', async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      include: {
        members: {
          include: {
            person: true
          }
        }
      }
    });
    
    // Transform the data to match the expected format
    const formattedGroups = groups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      members: group.members.map(member => member.person.id)
    }));
    
    res.json(formattedGroups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Categories endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Currencies endpoints
app.get('/api/currencies', async (req, res) => {
  try {
    const currencies = await prisma.currency.findMany();
    res.json(currencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settlements endpoints
app.get('/api/settlements', async (req, res) => {
  try {
    const settlements = await prisma.settlement.findMany();
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
}

// For serverless deployment
module.exports = app; 