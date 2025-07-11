# Credo Tri IndyCar Mobile App

A React Native mobile application for IndyCar racing fans, providing real-time race information, team details, track insights, and exclusive VIP experiences.

## � Features

### 🏁 Race Management
- **Live Race Schedule**: View upcoming IndyCar races with real-time countdown timers
- **Race Details**: Access comprehensive race information including venue details, practice sessions, qualifying rounds, and race times
- **Next Race Countdown**: Dynamic countdown timer showing days, hours, minutes, and seconds until the next race

### 👥 Team Information
- **Driver Profiles**: Detailed driver information including biographies, achievements, and social media links
- **Team Details**: Complete team information with descriptions and branding
- **Car Gallery**: Visual showcase of team cars with high-quality images

### 🏎️ Track Information
- **Track Details**: Comprehensive track information including venue specifics, coordinates, and historical data
- **Event Integration**: Real-time event data integration with Strapi CMS backend

### 🎫 VIP Experiences
- **Exclusive Access**: Browse and book VIP racing experiences
- **Event Management**: Manage VIP passes and credentials
- **Experience Details**: Detailed descriptions of premium racing experiences

### 🔔 Notifications
- **Race Alerts**: Get notified about upcoming races and important events
- **Push Notifications**: Real-time updates using Expo Notifications

### 🎨 Design & UX
- **Dark/Light Theme**: Automatic theme switching based on device preferences
- **Responsive Design**: Optimized for both iOS and Android devices
- **Modern UI**: Clean, racing-inspired interface with custom fonts and colors
- **Smooth Animations**: Powered by React Native Reanimated

## 🛠️ Technology Stack

### Frontend
- **React Native**: 0.79.5
- **Expo SDK**: 53.0.19
- **TypeScript**: Full type safety throughout the application
- **Expo Router**: File-based routing system

### Navigation & UI
- **React Navigation**: Bottom tabs and stack navigation
- **React Native Paper**: Material Design components
- **Custom Fonts**: Roobert font family for consistent branding
- **Vector Icons**: Comprehensive icon library

### Data & State Management
- **Formik**: Form handling and validation
- **Date-fns**: Date manipulation and formatting
- **Real-time Data**: Integration with SportRadar API for race data

### Backend Integration
- **Strapi CMS**: Headless CMS for content management
- **REST API**: RESTful API integration for dynamic content
- **Media Management**: Image and asset management through Strapi

### Development & Build
- **EAS Build**: Expo Application Services for cloud builds
- **Metro**: React Native bundler
- **Jest**: Testing framework
- **ESLint**: Code linting and quality assurance

## 📁 Project Structure

```
credo-tri-indy-car/
├── app/                          # Main application screens
│   ├── (tabs)/                  # Tab-based navigation screens
│   │   ├── index.tsx            # Home screen with race countdown
│   │   ├── schedule.tsx         # Race schedule listing
│   │   ├── team.tsx             # Team and driver information
│   │   ├── track.tsx            # Track details and information
│   │   └── navigation.tsx       # Navigation utilities
│   ├── car.tsx                  # Car details screen
│   ├── experience.tsx           # VIP experiences screen
│   └── welcome.tsx              # Welcome/onboarding screen
├── components/                   # Reusable UI components
│   ├── BrandLogo.tsx           # Team branding component
│   ├── Button.tsx              # Custom button component
│   ├── NotificationBell.tsx    # Notification indicator
│   ├── VIPTile.tsx             # VIP experience tile
│   └── forms/                  # Form components
├── constants/                    # App constants and configuration
│   └── Colors.ts               # Color scheme definitions
├── hooks/                        # Custom React hooks
│   ├── useColorScheme.ts       # Theme management hook
│   └── useThemeColor.ts        # Color theming utilities
├── race_data/                    # Static race data
│   ├── scheduleData.json       # Race schedule information
│   └── experiencesData.json    # VIP experiences data
├── services/                     # API and external service integrations
│   ├── ExperiencesService.ts   # VIP experiences API
│   └── NotificationService.ts  # Push notification handling
├── theme/                        # Theming system
│   ├── TeamThemeContext.tsx    # Team-specific theming
│   └── useTeamTheme.ts         # Team theme hook
└── assets/                       # Static assets
    ├── fonts/                   # Custom fonts (Roobert family)
    ├── icons/                   # App icons and UI icons
    └── images/                  # Images and branding assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio & Android SDK (for Android development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YourOrg/credo-tri-indy-car.git
   cd credo-tri-indy-car
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

### Development Commands

```bash
# Start Expo development server
npm start

# Run on Android device/emulator
npm run android

# Run on iOS device/simulator
npm run ios

# Run on web
npm run web

# Run tests
npm test

# Lint code
npm run lint

# Reset project (remove cache, reinstall dependencies)
npm run reset-project
```

## 📱 Platform Support

- **iOS**: 13.0+
- **Android**: API Level 24+ (Android 7.0)
- **Web**: Modern browsers with ES6+ support

## 🎨 Theming & Design

The app features a comprehensive theming system supporting both light and dark modes:

### Color Scheme
- **Primary Colors**: Team-specific branding colors
- **Background**: Adaptive based on system theme
- **Text**: High contrast for accessibility
- **Accent**: Racing-inspired highlight colors

### Typography
- **Primary Font**: Roobert (Regular, Medium, SemiBold)
- **Fallback**: System fonts for optimal performance

### Design Principles
- **Racing-Inspired**: Bold, dynamic design reflecting the speed of IndyCar
- **Accessibility**: WCAG compliant color contrasts and touch targets
- **Performance**: Optimized animations and smooth interactions

## 🔧 Configuration

### Environment Setup
The app uses environment-specific configurations:

- **Development**: Local development with hot reloading
- **Production**: Optimized builds for app stores
- **Staging**: Testing environment with production-like data

### API Configuration
- **Strapi Backend**: Configure base URL in service files
- **SportRadar API**: Race data integration
- **Push Notifications**: Expo notification service setup

## 🏗️ Build & Deployment

### Local Builds
```bash
# Android APK
npx expo run:android --variant debug

# iOS build (requires macOS and Xcode)
npx expo run:ios --configuration Debug
```

### EAS Build (Recommended)
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both platforms
eas build --platform all
```

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API and service testing
- **E2E Tests**: Critical user flow testing

## 📊 Performance

### Optimization Features
- **Code Splitting**: Dynamic imports for optimal bundle size
- **Image Optimization**: Responsive images with appropriate sizing
- **Caching**: Intelligent data caching for offline capability
- **Bundle Analysis**: Regular bundle size monitoring

### Performance Metrics
- **App Size**: Optimized for minimal download size
- **Load Time**: Fast initial load and navigation
- **Memory Usage**: Efficient memory management
- **Battery Impact**: Optimized for minimal battery drain

## 🔒 Security

- **Data Encryption**: Sensitive data encryption at rest and in transit
- **API Security**: Secure API communication with authentication
- **Privacy**: User data protection and privacy compliance
- **Updates**: Regular security updates and dependency management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting with ESLint
- Write tests for new features
- Update documentation as needed
- Follow the existing component and styling patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- **Issues**: GitHub Issues for bug reports and feature requests
- **Documentation**: Check the `/docs` folder for detailed guides
- **Contact**: Reach out to the development team

## 🏁 Acknowledgments

- **IndyCar**: For the thrilling racing content and data
- **Expo Team**: For the excellent development platform
- **React Native Community**: For the robust ecosystem
- **Contributors**: Everyone who has contributed to this project

---

**Built with ❤️ for IndyCar racing fans**
