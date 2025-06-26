**Create a complete authentication system for an Expo app using Strapi as the backend. Include:**

1. **React Context implementation** for auth state management
2. **JWT token handling** using AsyncStorage
3. **Login/Register screens** with form validation
4. **API integration** with Strapi's endpoints:
   - `POST /auth/local/register` for registration
   - `POST /auth/local` for login
   - `GET /users/me` for session validation
5. **Protected routing** for authenticated users
6. **Error handling** for API failures

**Technical requirements:**
- Use functional React components
- Implement secure token storage with `@react-native-async-storage/async-storage`
- TypeScript interfaces for User and AuthState
- Axios for API requests
- Formik for form management

**Output structure:**

// AuthContext.tsx
{context implementation}

// useAuth.ts
{authentication hook}

// LoginScreen.tsx
{login UI and logic}

// RegisterScreen.tsx
{registration UI and logic}

// api.ts
{Strapi API service}


**Additional instructions:**
- Prioritize security best practices (HTTPS, token expiration)
- Include loading states during API calls
- Implement password strength validation
- Provide clear error messages for failed logins
