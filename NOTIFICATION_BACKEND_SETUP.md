# Complete Backend Notification Setup Guide

This guide provides comprehensive documentation for setting up the backend notification system for the Credo Tri Indy Car app, including experience notifications, push notifications, and database schemas.

## Table of Contents
- [Overview](#overview)
- [Strapi Backend Setup](#strapi-backend-setup)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Push Notification Integration](#push-notification-integration)
- [Experience Notifications](#experience-notifications)
- [Frontend Integration](#frontend-integration)
- [Testing & Deployment](#testing--deployment)

## Overview

The notification system supports:
- **Experience Notifications**: Automated reminders for scheduled experiences
- **Race Updates**: Real-time race information and updates
- **General Announcements**: Admin-triggered notifications
- **VIP Notifications**: Exclusive notifications for VIP users
- **Push Notifications**: Via Expo Push Notification Service

## Strapi Backend Setup

### 1. Install Required Dependencies

```bash
npm install expo-server-sdk
npm install node-cron
npm install @strapi/plugin-users-permissions
```

### 2. Environment Configuration

Create/update `.env` file in your Strapi backend:

```env
# Expo Push Notifications
EXPO_ACCESS_TOKEN=your_expo_access_token_here

# Database Configuration
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Admin JWT Secret
ADMIN_JWT_SECRET=your_admin_jwt_secret_here

# App Keys
APP_KEYS=your_app_keys_here

# API Token Salt
API_TOKEN_SALT=your_api_token_salt_here

# Notification Settings
NOTIFICATION_SCHEDULE_ENABLED=true
NOTIFICATION_DEBUG_MODE=false
```

### 3. Content Type Schemas

#### Notification Content Type
Create `src/api/notification/content-types/notification/schema.json`:

```json
{
  "kind": "collectionType",
  "collectionName": "notifications",
  "info": {
    "singularName": "notification",
    "pluralName": "notifications",
    "displayName": "Notification",
    "description": "Push notifications and in-app messages"
  },
  "options": {
    "draftAndPublish": true,
    "timestamps": true
  },
  "pluginOptions": {},
  "attributes": {
    "title": {
      "type": "string",
      "required": true,
      "maxLength": 100
    },
    "body": {
      "type": "text",
      "required": true,
      "maxLength": 500
    },
    "category": {
      "type": "enumeration",
      "enum": [
        "experience_reminder",
        "experience_update",
        "experience_cancellation",
        "race_update",
        "general_announcement"
      ],
      "required": true
    },
    "type": {
      "type": "enumeration",
      "enum": [
        "one_hour_before",
        "twenty_minutes_before",
        "at_event_time",
        "update",
        "cancellation",
        "announcement"
      ],
      "required": true
    },
    "targetType": {
      "type": "enumeration",
      "enum": ["all", "vip", "specific"],
      "required": true,
      "default": "all"
    },
    "status": {
      "type": "enumeration",
      "enum": ["draft", "scheduled", "sent", "failed"],
      "required": true,
      "default": "draft"
    },
    "scheduledAt": {
      "type": "datetime"
    },
    "sentAt": {
      "type": "datetime"
    },
    "data": {
      "type": "json",
      "description": "Additional notification payload data"
    },
    "targetUsers": {
      "type": "relation",
      "relation": "manyToMany",
      "target": "plugin::users-permissions.user"
    },
    "experienceId": {
      "type": "integer",
      "description": "Related experience ID if applicable"
    },
    "priority": {
      "type": "enumeration",
      "enum": ["low", "normal", "high", "urgent"],
      "default": "normal"
    },
    "sound": {
      "type": "boolean",
      "default": true
    },
    "badge": {
      "type": "integer",
      "default": 1
    }
  }
}
```

#### Experience Content Type Extension
Extend your existing experience schema to include notification settings:

```json
{
  "notificationSettings": {
    "type": "json",
    "description": "Notification timing and preferences"
  },
  "reminderEnabled": {
    "type": "boolean",
    "default": true
  },
  "reminderTimes": {
    "type": "json",
    "description": "Array of reminder times in minutes before event",
    "default": [60, 20, 0]
  }
}
```

#### User Extended Schema
Extend the user model to include notification preferences:

```json
{
  "expoPushToken": {
    "type": "string",
    "description": "Expo push notification token"
  },
  "notificationsEnabled": {
    "type": "boolean",
    "default": true
  },
  "isVIP": {
    "type": "boolean",
    "default": false
  },
  "notificationPreferences": {
    "type": "json",
    "description": "User notification preferences",
    "default": {
      "experienceReminders": true,
      "raceUpdates": true,
      "generalAnnouncements": true,
      "vipNotifications": true
    }
  },
  "timezone": {
    "type": "string",
    "default": "America/New_York"
  }
}
```

## API Endpoints

### 1. Notification Controller
Create `src/api/notification/controllers/notification.js`:

```javascript
const { Expo } = require('expo-server-sdk');

module.exports = {
  /**
   * Send push notifications
   */
  async send(ctx) {
    const { notificationId } = ctx.params;
    
    try {
      const notification = await strapi.entityService.findOne(
        'api::notification.notification',
        notificationId,
        { populate: ['targetUsers'] }
      );

      if (!notification) {
        return ctx.notFound('Notification not found');
      }

      if (notification.status === 'sent') {
        return ctx.badRequest('Notification already sent');
      }

      // Get target users
      let targetUsers = await this.getTargetUsers(notification);

      if (targetUsers.length === 0) {
        return ctx.badRequest('No valid recipients found');
      }

      // Send via Expo
      const result = await this.sendExpoNotifications(notification, targetUsers);

      // Update notification status
      await strapi.entityService.update(
        'api::notification.notification',
        notificationId,
        {
          data: {
            status: 'sent',
            sentAt: new Date(),
            data: {
              ...notification.data,
              sentToCount: result.successCount,
              failedCount: result.failedCount
            }
          }
        }
      );

      return ctx.send({
        message: 'Notification sent successfully',
        sentCount: result.successCount,
        failedCount: result.failedCount
      });

    } catch (error) {
      console.error('Error sending notification:', error);
      return ctx.internalServerError('Failed to send notification');
    }
  },

  /**
   * Schedule experience notifications
   */
  async scheduleExperienceNotifications(ctx) {
    const { experienceId } = ctx.params;
    const { userId } = ctx.request.body;

    try {
      const experience = await strapi.entityService.findOne(
        'api::experience.experience',
        experienceId
      );

      if (!experience) {
        return ctx.notFound('Experience not found');
      }

      const user = await strapi.entityService.findOne(
        'plugin::users-permissions.user',
        userId
      );

      if (!user || !user.expoPushToken) {
        return ctx.badRequest('User not found or no push token available');
      }

      // Create scheduled notifications
      const notifications = await this.createExperienceReminders(experience, user);

      return ctx.send({
        message: 'Experience notifications scheduled successfully',
        notifications: notifications.map(n => ({
          id: n.id,
          scheduledAt: n.scheduledAt,
          type: n.type
        }))
      });

    } catch (error) {
      console.error('Error scheduling experience notifications:', error);
      return ctx.internalServerError('Failed to schedule notifications');
    }
  },

  /**
   * Cancel experience notifications
   */
  async cancelExperienceNotifications(ctx) {
    const { experienceId } = ctx.params;
    const { userId } = ctx.request.body;

    try {
      // Find and delete scheduled notifications
      const notifications = await strapi.entityService.findMany(
        'api::notification.notification',
        {
          filters: {
            experienceId,
            targetUsers: userId,
            status: 'scheduled'
          }
        }
      );

      for (const notification of notifications) {
        await strapi.entityService.delete(
          'api::notification.notification',
          notification.id
        );
      }

      return ctx.send({
        message: 'Experience notifications cancelled successfully',
        cancelledCount: notifications.length
      });

    } catch (error) {
      console.error('Error cancelling experience notifications:', error);
      return ctx.internalServerError('Failed to cancel notifications');
    }
  },

  /**
   * Update user push token
   */
  async updatePushToken(ctx) {
    const { userId } = ctx.params;
    const { expoPushToken } = ctx.request.body;

    try {
      // Validate push token format
      if (!Expo.isExpoPushToken(expoPushToken)) {
        return ctx.badRequest('Invalid push token format');
      }

      await strapi.entityService.update(
        'plugin::users-permissions.user',
        userId,
        {
          data: { expoPushToken }
        }
      );

      return ctx.send({
        message: 'Push token updated successfully'
      });

    } catch (error) {
      console.error('Error updating push token:', error);
      return ctx.internalServerError('Failed to update push token');
    }
  },

  // Helper methods
  async getTargetUsers(notification) {
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
            fields: ['id', 'expoPushToken', 'notificationPreferences']
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
            fields: ['id', 'expoPushToken', 'notificationPreferences']
          }
        );
        break;
        
      case 'specific':
        targetUsers = notification.targetUsers.filter(
          user => user.expoPushToken && user.notificationsEnabled
        );
        break;
    }

    return targetUsers;
  },

  async sendExpoNotifications(notification, targetUsers) {
    const expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
    const messages = [];

    for (const user of targetUsers) {
      if (!Expo.isExpoPushToken(user.expoPushToken)) {
        console.error(`Invalid push token for user ${user.id}: ${user.expoPushToken}`);
        continue;
      }

      messages.push({
        to: user.expoPushToken,
        sound: notification.sound ? 'default' : null,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
        priority: notification.priority === 'high' ? 'high' : 'normal'
      });
    }

    if (messages.length === 0) {
      throw new Error('No valid push tokens found');
    }

    // Send in chunks
    const chunks = expo.chunkPushNotifications(messages);
    let successCount = 0;
    let failedCount = 0;

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        
        ticketChunk.forEach(ticket => {
          if (ticket.status === 'ok') {
            successCount++;
          } else {
            failedCount++;
            console.error('Push notification failed:', ticket.message);
          }
        });
      } catch (error) {
        console.error('Error sending notification chunk:', error);
        failedCount += chunk.length;
      }
    }

    return { successCount, failedCount };
  },

  async createExperienceReminders(experience, user) {
    const experienceStart = new Date(experience.startDateTime);
    const reminderTimes = experience.reminderTimes || [60, 20, 0]; // minutes before
    const notifications = [];

    for (const minutesBefore of reminderTimes) {
      const scheduledAt = new Date(experienceStart.getTime() - (minutesBefore * 60 * 1000));
      
      // Skip if time is in the past
      if (scheduledAt <= new Date()) continue;

      let type, title, body;
      
      if (minutesBefore === 60) {
        type = 'one_hour_before';
        title = `${experience.title} starts in 1 hour`;
        body = `Your experience "${experience.title}" begins at ${experienceStart.toLocaleTimeString()}. Get ready!`;
      } else if (minutesBefore === 20) {
        type = 'twenty_minutes_before';
        title = `${experience.title} starts in 20 minutes`;
        body = `Don't forget! Your experience starts soon at ${experience.location || 'the venue'}.`;
      } else if (minutesBefore === 0) {
        type = 'at_event_time';
        title = `${experience.title} is starting now!`;
        body = `Your experience is beginning. Head to ${experience.location || 'the venue'} now.`;
      }

      const notification = await strapi.entityService.create(
        'api::notification.notification',
        {
          data: {
            title,
            body,
            category: 'experience_reminder',
            type,
            targetType: 'specific',
            status: 'scheduled',
            scheduledAt,
            experienceId: experience.id,
            targetUsers: [user.id],
            data: {
              experienceId: experience.id,
              experienceTitle: experience.title,
              location: experience.location,
              startTime: experience.startDateTime
            }
          }
        }
      );

      notifications.push(notification);
    }

    return notifications;
  }
};
```

### 2. Routes Configuration
Create `src/api/notification/routes/notification.js`:

```javascript
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
      path: '/notifications/schedule-experience/:experienceId',
      handler: 'notification.scheduleExperienceNotifications',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'DELETE',
      path: '/notifications/cancel-experience/:experienceId',
      handler: 'notification.cancelExperienceNotifications',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'PUT',
      path: '/notifications/push-token/:userId',
      handler: 'notification.updatePushToken',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'GET',
      path: '/notifications',
      handler: 'notification.find',
      config: {
        auth: {
          scope: ['authenticated']
        }
      }
    },
    {
      method: 'POST',
      path: '/notifications',
      handler: 'notification.create',
      config: {
        auth: {
          scope: ['admin']
        }
      }
    }
  ]
};
```

### 3. Cron Job for Scheduled Notifications
Create `src/extensions/notification-scheduler/strapi-server.js`:

```javascript
const cron = require('node-cron');
const { Expo } = require('expo-server-sdk');

module.exports = (plugin) => {
  const initializeCronJobs = () => {
    // Run every minute to check for scheduled notifications
    cron.schedule('* * * * *', async () => {
      if (process.env.NOTIFICATION_SCHEDULE_ENABLED !== 'true') return;
      
      try {
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        
        // Find notifications scheduled for the next 5 minutes
        const scheduledNotifications = await strapi.entityService.findMany(
          'api::notification.notification',
          {
            filters: {
              status: 'scheduled',
              scheduledAt: {
                $gte: now,
                $lte: fiveMinutesFromNow
              }
            },
            populate: ['targetUsers']
          }
        );

        for (const notification of scheduledNotifications) {
          const scheduledTime = new Date(notification.scheduledAt);
          
          // Check if it's time to send
          if (scheduledTime <= now) {
            try {
              // Send the notification
              const controller = strapi.controller('api::notification.notification');
              await controller.sendExpoNotifications(notification, notification.targetUsers);
              
              // Update status
              await strapi.entityService.update(
                'api::notification.notification',
                notification.id,
                {
                  data: {
                    status: 'sent',
                    sentAt: new Date()
                  }
                }
              );
              
              console.log(`✅ Sent scheduled notification: ${notification.title}`);
            } catch (error) {
              console.error(`❌ Failed to send scheduled notification ${notification.id}:`, error);
              
              // Mark as failed
              await strapi.entityService.update(
                'api::notification.notification',
                notification.id,
                {
                  data: {
                    status: 'failed'
                  }
                }
              );
            }
          }
        }
        
      } catch (error) {
        console.error('Error in notification scheduler:', error);
      }
    });

    console.log('📅 Notification scheduler initialized');
  };

  return {
    register() {
      // Register the cron jobs when Strapi starts
      initializeCronJobs();
    },
  };
};
```

## Experience Notifications Implementation

### 1. Frontend Service Updates
Update your `ExperiencesService.ts`:

```typescript
import { ENV_CONFIG } from '@/constants/Environment';

export class ExperiencesService {
  private baseUrl = ENV_CONFIG.STRAPI_BASE_URL;

  async scheduleNotifications(experienceId: number, userId?: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const currentUserId = userId || await this.getCurrentUserId();
      
      const response = await fetch(
        `${this.baseUrl}/api/notifications/schedule-experience/${experienceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to schedule notifications');
      }

      return true;
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      return false;
    }
  }

  async cancelNotifications(experienceId: number, userId?: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const currentUserId = userId || await this.getCurrentUserId();
      
      const response = await fetch(
        `${this.baseUrl}/api/notifications/cancel-experience/${experienceId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: currentUserId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel notifications');
      }

      return true;
    } catch (error) {
      console.error('Error cancelling notifications:', error);
      return false;
    }
  }

  async getNotificationStatus(experienceId: number, userId?: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      const currentUserId = userId || await this.getCurrentUserId();
      
      const response = await fetch(
        `${this.baseUrl}/api/notifications?filters[experienceId][$eq]=${experienceId}&filters[targetUsers][$eq]=${currentUserId}&filters[status][$eq]=scheduled`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      return data.data && data.data.length > 0;
    } catch (error) {
      console.error('Error getting notification status:', error);
      return false;
    }
  }

  async updatePushToken(userId: string, pushToken: string): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      
      const response = await fetch(
        `${this.baseUrl}/api/notifications/push-token/${userId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ expoPushToken: pushToken }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error updating push token:', error);
      return false;
    }
  }

  private async getAuthToken(): Promise<string> {
    // Implement your auth token retrieval logic
    // This should return the JWT token for the current user
    return '';
  }

  private async getCurrentUserId(): Promise<string> {
    // Implement your user ID retrieval logic
    return '';
  }
}

export const experiencesService = new ExperiencesService();
```

### 2. Enhanced Notification Service Updates
Update the `registerForPushNotifications` method in your `EnhancedNotificationService.ts`:

```typescript
async registerForPushNotifications(userId: string, jwtToken: string): Promise<boolean> {
  try {
    // Get push token
    const token = await this.getPushToken();
    if (!token) return false;

    // Update user's push token in backend
    const response = await fetch(
      `${ENV_CONFIG.STRAPI_BASE_URL}/api/notifications/push-token/${userId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({ expoPushToken: token }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update push token on server');
    }

    console.log('✅ Push token registered successfully');
    return true;
  } catch (error) {
    console.error('❌ Error registering push token:', error);
    return false;
  }
}
```

## Testing & Deployment

### 1. Testing Notifications
Create test endpoints for development:

```javascript
// Add to notification controller
async testNotification(ctx) {
  const { userId, title, body } = ctx.request.body;
  
  try {
    const user = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      userId,
      { fields: ['id', 'expoPushToken'] }
    );

    if (!user?.expoPushToken) {
      return ctx.badRequest('User not found or no push token');
    }

    const expo = new Expo();
    const message = {
      to: user.expoPushToken,
      sound: 'default',
      title: title || 'Test Notification',
      body: body || 'This is a test notification',
      data: { test: true }
    };

    const tickets = await expo.sendPushNotificationsAsync([message]);
    
    return ctx.send({
      message: 'Test notification sent',
      ticket: tickets[0]
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return ctx.internalServerError('Failed to send test notification');
  }
}
```

### 2. Environment Setup
Ensure your Expo project has the correct configuration in `app.json`:

```json
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff",
      "androidMode": "default",
      "androidCollapsedTitle": "Credo Tri Indy Car"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ]
  }
}
```

### 3. Production Considerations
- Set up proper error logging and monitoring
- Implement rate limiting for notification endpoints
- Use environment-specific Expo access tokens
- Set up database backups for notification history
- Implement proper user permission handling
- Add notification analytics and tracking

This setup provides a complete notification system with experience reminders, push notifications, and proper backend integration. The system is scalable and can handle various notification types while maintaining user preferences and proper scheduling.
