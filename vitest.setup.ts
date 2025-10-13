// Randomize timezone for each test run to ensure timezone independence
const timezones = [
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
];

if (!process.env.TZ) {
  const randomTimezone = timezones[Math.floor(Math.random() * timezones.length)];
  process.env.TZ = randomTimezone;
}

console.log(`🌍 Running tests with timezone: ${process.env.TZ}`);
