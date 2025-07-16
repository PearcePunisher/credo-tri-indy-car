// Example usage in your main app or navigation component

import { useNotifications } from '@/hooks/useNotifications';

export default function App() {
  // These would come from your authentication system
  const userId = "user123"; // Replace with actual user ID
  const jwtToken = "your-jwt-token"; // Replace with actual JWT
  const isVIP = true; // Replace with actual VIP status

  const { sendTestNotification, updateActivity } = useNotifications({
    userId,
    jwtToken,
    isVIP
  });

  // Call updateActivity when user navigates or interacts with app
  const handleUserActivity = () => {
    updateActivity();
  };

  return (
    // Your app content
    <div>
      <button onClick={sendTestNotification}>
        Send Test Notification
      </button>
    </div>
  );
}
