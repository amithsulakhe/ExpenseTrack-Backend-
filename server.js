import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import { spawn } from 'child_process';
import crypto from 'crypto';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

app.get('/', (req, res) => {
  return res.json({ message: "Welocome to Start Photography web  Application" })
});

app.get("/error", (req, res) => {
  process.exit(1);
});

app.post("/github/webhook", (req, res) => {

  // console.log("Headers:", req.headers);
  // console.log("Body:", req.body);

  const githubSignature = req.headers['x-hub-signature-256'];
  // console.log("Github Signature:", githubSignature);

  if (!githubSignature) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const hmac = crypto.createHmac('sha256', "Ammu@123");
  hmac.update(JSON.stringify(req.body));
  const calculatedSignature = hmac.digest('hex');
  const signature = githubSignature.replace('sha256=', '');

  if (calculatedSignature !== signature) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const repository = req.body.repository.name === "ExpenseTrack-Backend-" ? "backend" : "frontend";
  console.log("Repository:", repository);



  res.json({ message: 'Ok' });

  const child = spawn('bash', [`/home/ubuntu/deploy-${repository}.sh`]);


  child.stdout.on('data', (data) => {
    process.stdout.write(data);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  child.on('close', (code) => {


    if (code === 0) {
      console.log('Script executed successfully');
    } else {
      console.log('Script execution failed');
    }
  });

  child.on('error', (error) => {

    console.log("Error in spawning the script");
    console.error('Error executing script:', error);
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expenses')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
