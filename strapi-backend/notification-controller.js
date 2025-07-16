const { Expo } = require('expo-server-sdk');

module.exports = {
  /**
   * Send push notifications to users
   */
  async send(ctx) {
    const { notificationId } = ctx.params;
    
    try {
      // Get the notification record
      const notification = await strapi.entityService.findOne(
        'api::notification.notification',
        notificationId,
        {
          populate: ['targetUsers']
        }
      );

      if (!notification) {
        return ctx.notFound('Notification not found');
      }

      if (notification.status === 'sent') {
        return ctx.badRequest('Notification already sent');
      }

      // Determine target users
      let targetUsers = [];
      
      switch (notification.targetType) {
        case 'all':
          targetUsers = await strapi.entityService.findMany(
            'plugin::users-permissions.user',
            {
              filters: { 
                notificationsEnabled: true,
                expoPushToken: { $ne: null }
              },
              fields: ['id', 'expoPushToken']
            }
          );
          break;
          
        case 'vip':
          targetUsers = await strapi.entityService.findMany(
            'plugin::users-permissions.user',
            {
              filters: { 
                isVIP: true,
                notificationsEnabled: true,
                expoPushToken: { $ne: null }
              },
              fields: ['id', 'expoPushToken']
            }
          );
          break;
          
        case 'specific':
          targetUsers = notification.targetUsers.filter(
            user => user.expoPushToken && user.notificationsEnabled
          );
          break;
      }

      if (targetUsers.length === 0) {
        return ctx.badRequest('No valid recipients found');
      }

      // Send notifications via Expo
      const expo = new Expo();
      const messages = [];

      for (const user of targetUsers) {
        if (!Expo.isExpoPushToken(user.expoPushToken)) {
          console.error(`Invalid push token for user ${user.id}: ${user.expoPushToken}`);
          continue;
        }

        messages.push({
          to: user.expoPushToken,
          sound: 'default',
          title: notification.title,
          body: notification.body,
          data: notification.data || {}
        });
      }

      if (messages.length === 0) {
        return ctx.badRequest('No valid push tokens found');
      }

      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending notification chunk:', error);
        }
      }

      // Update notification record
      await strapi.entityService.update(
        'api::notification.notification',
        notificationId,
        {
          data: {
            status: 'sent',
            sentAt: new Date(),
            deliveryTickets: tickets,
            sentCount: messages.length
          }
        }
      );

      ctx.send({
        success: true,
        message: `Notification sent to ${messages.length} users`,
        tickets: tickets.length
      });

    } catch (error) {
      console.error('Error sending notification:', error);
      ctx.internalServerError('Failed to send notification', { error: error.message });
    }
  },

  /**
   * Send immediate notification (create and send)
   */
  async sendImmediate(ctx) {
    const { title, body, data, targetType, userIds } = ctx.request.body;

    try {
      // Create notification record
      const notification = await strapi.entityService.create(
        'api::notification.notification',
        {
          data: {
            title,
            body,
            data,
            targetType: targetType || 'all',
            targetUsers: userIds || [],
            status: 'draft'
          }
        }
      );

      // Send it immediately
      ctx.params.notificationId = notification.id;
      return await this.send(ctx);

    } catch (error) {
      console.error('Error creating and sending notification:', error);
      ctx.internalServerError('Failed to send immediate notification');
    }
  },

  /**
   * Schedule notification for later
   */
  async schedule(ctx) {
    const { title, body, data, targetType, userIds, scheduledFor } = ctx.request.body;

    try {
      const notification = await strapi.entityService.create(
        'api::notification.notification',
        {
          data: {
            title,
            body,
            data,
            targetType: targetType || 'all',
            targetUsers: userIds || [],
            scheduledFor: new Date(scheduledFor),
            status: 'scheduled'
          }
        }
      );

      ctx.send({
        success: true,
        message: 'Notification scheduled successfully',
        notification
      });

    } catch (error) {
      console.error('Error scheduling notification:', error);
      ctx.internalServerError('Failed to schedule notification');
    }
  },

  /**
   * Process scheduled notifications (call this from a cron job)
   */
  async processScheduled(ctx) {
    try {
      const now = new Date();
      const scheduledNotifications = await strapi.entityService.findMany(
        'api::notification.notification',
        {
          filters: {
            status: 'scheduled',
            scheduledFor: { $lte: now }
          }
        }
      );

      const results = [];
      
      for (const notification of scheduledNotifications) {
        try {
          ctx.params.notificationId = notification.id;
          await this.send(ctx);
          results.push({ id: notification.id, status: 'sent' });
        } catch (error) {
          console.error(`Failed to send scheduled notification ${notification.id}:`, error);
          results.push({ id: notification.id, status: 'failed', error: error.message });
        }
      }

      ctx.send({
        success: true,
        message: `Processed ${results.length} scheduled notifications`,
        results
      });

    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      ctx.internalServerError('Failed to process scheduled notifications');
    }
  }
};
