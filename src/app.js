import express from 'express';
import deployRoutes from './routes/deployRoutes.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(express.json());
app.use('/', deployRoutes);

export default app;