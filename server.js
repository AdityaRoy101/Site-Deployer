import './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

process.on('uncaughtException', (err) => {
	console.error('There was an uncaught error', err);
	process.exit(1);
});