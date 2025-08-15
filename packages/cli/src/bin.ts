import { main } from './cli';

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});
process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
});

void main();
