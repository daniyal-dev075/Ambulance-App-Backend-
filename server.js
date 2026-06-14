const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./src/routes/authRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const driverRoutes = require('./src/routes/driverRoutes');
const hospitalRoutes = require('./src/routes/hospitalRoutes');
const etaRoutes = require('./src/routes/etaRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/eta', etaRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Ambulance Booking System Backend is running.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
