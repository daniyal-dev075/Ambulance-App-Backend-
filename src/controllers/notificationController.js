const { db, messaging } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

const sendNotification = async (req, res) => {
  try {
    const { userId, fcmToken, message } = req.body;

    if (!userId || !fcmToken || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const payload = {
      token: fcmToken,
      notification: {
        title: 'Ambulance System',
        body: message
      }
    };

    await messaging.send(payload);

    const notificationId = uuidv4();
    const notificationData = {
      notificationId,
      userId,
      message,
      timestamp: new Date().toISOString(),
      isRead: false
    };

    await db.collection('notifications').doc(notificationId).set(notificationData);

    res.status(200).json({ message: 'Notification sent successfully', notification: notificationData });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
};

module.exports = { sendNotification };
