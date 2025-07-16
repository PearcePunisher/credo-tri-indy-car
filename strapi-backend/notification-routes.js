module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/notifications/:notificationId/send',
      handler: 'notification.send',
      config: {
        auth: {
          scope: ['admin']
        }
      }
    },
    {
      method: 'POST',
      path: '/notifications/send-immediate',
      handler: 'notification.sendImmediate',
      config: {
        auth: {
          scope: ['admin']
        }
      }
    },
    {
      method: 'POST',
      path: '/notifications/schedule',
      handler: 'notification.schedule',
      config: {
        auth: {
          scope: ['admin']
        }
      }
    },
    {
      method: 'POST',
      path: '/notifications/process-scheduled',
      handler: 'notification.processScheduled',
      config: {
        auth: {
          scope: ['admin']
        }
      }
    }
  ]
};
