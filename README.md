# LIVOApp Frontend

Frontend application of LIVOApp - A hybrid web and mobile application built with Vue.js, Ionic Framework, and Capacitor.

## Tech Stack

This is a single page application (SPA) built with modern web technologies:

- **Vue 3** - Progressive JavaScript framework
- **Ionic 7** - Mobile UI component library
- **Capacitor 5** - Native mobile runtime
- **Vuex** - State management pattern and centralized store
- **Vue Router** - Official router for Vue.js
- **Axios** - Promise-based HTTP client for API calls
- **Ionicons** - Premium icon library
- **TypeScript** - Type-safe JavaScript

## Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)
- For mobile development:
  - **Android**: [Android Studio](https://developer.android.com/studio) with Android SDK
  - **iOS**: [Xcode](https://developer.apple.com/xcode/) (macOS only)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/LIVO-App/app
   cd app
   ```

2. **Clone and run the backend** (required for API calls)
   ```bash
   git clone https://github.com/LIVO-App/backend
   # Follow backend setup instructions
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

## Development

### Web Development

**Start development server** (with hot reload):
```bash
npm run serve
```
- Open your browser at [http://localhost:8080](http://localhost:8080)
- Changes will automatically reload in the browser

**Start with Ionic CLI** (production mode with SSL):
```bash
npm run ionic_serve
```

### Environment Configuration

The app automatically uses different API endpoints based on the environment:

- **Development** (`npm run serve`): `http://localhost:5000/api`
- **Production** (`npm run build`): `https://backend.livopath.istitutodecarneri.it/api`

Configuration is in `src/plugins/axios.ts`.

## Building

### Web Application

**Build for production** (web only):
```bash
npm run build
```
- Output will be in the `dist/` folder
- Optimized and minified for production
- Ready to deploy on any web server

### Mobile Application

**Build web + prepare mobile assets**:
```bash
npx vue-cli-service build && npx cap copy
```
- Builds the web app and copies assets to native projects

**Sync native projects** (inline mode):
```bash
npx cap sync --inline
```
- Updates native dependencies and configurations
- Copies web assets to native projects

## Mobile Development

### Running on Devices/Emulators

**Android**:
```bash
npx cap open android
```
- Opens project in Android Studio
- Build and run from Android Studio

**iOS** (macOS only):
```bash
npx cap open ios
```
- Opens project in Xcode
- Build and run from Xcode

### Publishing

**Build Android APK**:
```bash
npx cap build android --androidreleasetype=APK --keystorealias=<keystorealias> --keystorealiaspass=<keystorealiaspass> --keystorepass=<keystorepass> --keystorepath=<keystorepath>
```

Replace the placeholders:
- `<keystorealias>`: Your keystore alias name
- `<keystorealiaspass>`: Password for the key alias
- `<keystorepass>`: Password for the keystore
- `<keystorepath>`: Path to your .jks/.keystore file

**Build iOS**:
```bash
npx cap build ios
```
- Requires macOS and Xcode
- Follow Apple's App Store submission guidelines


## Code Quality

**Run linter**:
```bash
npm run lint
```

## Deployment

### Web Deployment

After building (`npm run build`), deploy the `dist/` folder to your web server:

**Using a static file server (for testing)**:
```bash
# Install serve globally
npm install -g serve

# Serve the production build
serve -s dist -l 3000
```

**Production deployment**:
- Upload `dist/` folder to your web server (Nginx, Apache, etc.)
- Configure server to handle SPA routing (redirect all routes to `index.html`)
- Ensure HTTPS is enabled

### Mobile Deployment

- **Android**: Submit APK/AAB to [Google Play Console](https://play.google.com/console)
- **iOS**: Submit IPA to [App Store Connect](https://appstoreconnect.apple.com/)

## Project Structure

```
app/
├── android/              # Android native project
├── ios/                  # iOS native project
├── public/               # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Vue components
│   ├── plugins/         # Vue plugins (axios, etc.)
│   ├── router/          # Vue Router configuration
│   ├── theme/           # CSS/SCSS global styles
│   ├── views/           # Page components
│   ├── App.vue          # Root component
│   ├── main.ts          # Application entry point
│   └── store.ts         # Vuex store
├── tests/               # Unit and E2E tests
└── package.json         # Dependencies and scripts
```

## Useful Commands Summary

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run serve` | Start dev server (development mode) |
| `npm run ionic_serve` | Start dev server (production mode with SSL) |
| `npm run build` | Build for production (web) |
| `npx vue-cli-service build && npx cap copy` | Build web + copy to native |
| `npx cap sync --inline` | Sync native projects |
| `npx cap open android` | Open Android project |
| `npx cap open ios` | Open iOS project |
| `npm run test:unit` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run lint` | Lint and fix code |

## License

This project is part of the LIVO Path initiative by Istituto De Carneri.