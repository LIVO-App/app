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
│   ├── components/      # Reusable Vue components (UI, cards, forms, tables, layout)
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

### Components (`src/components/`)

The `src/components/` directory is already structured into feature-oriented subfolders:

- **layout/**: global layout pieces

  - `OuterHeader.vue`: main header
  - `InnerHeader.vue`: condensed header (secondary/top bar)
  - `LoadingComponent.vue`: loading/suspense placeholder

- **elements/**: reusable UI elements (building blocks)

  - `IonicElement.vue`: dynamic element renderer (wraps HTML/Ionic widgets driven by `CustomElement`)
  - `CustomSelect.vue`: `ion-select` wrapper with labeling/placeholder utilities
  - `EditorWrapper.vue`: Quill editor wrapper used for rich-text fields
  - `SimpleAdder.vue`: generic “add/remove rows + confirm” UI used by manager screens
  - `ImageUploader.vue`: collects images to upload (emits progress/errors)
  - `ImageCarousel.vue`: displays one or multiple images (carousel)

- **cards/**: card/grid/list primitives and related rendering

  - `GeneralCard.vue`: generic card layout driven by `GeneralCardElements` / `GeneralTableCardElements`
  - `CourseCard.vue`: course-specific card used mainly in selection/enrollment flows
  - `CardItem.vue`: card wrapper that routes rendering between general/course cards
  - `CardsGrid.vue`: renders `CardItem` instances in a responsive grid
  - `GroupList.vue`: renders grouped lists of `CardItem` (with dividers)
  - `ListCard.vue` [main-structure]: renders an `OrderedCardsList` with support for list/grid/group layouts and selection events
  - `IonicTable.vue` [main-structure]: table renderer for an `OrderedCardsList` of `GeneralTableCardElements`

- **announcements/**: announcements feature

  - `AnnouncementsComponent.vue`: announcements list for a course/session (opens publish/view modals)
  - `AnnouncementsPublisher.vue`: modal to compose and publish an announcement (with optional section targeting)
  - `AnnouncementViewer.vue`: modal to display a single announcement (HTML body loaded from backend)

- **courses/**: course-related UI

  - `CourseDescription.vue`: modal that shows detailed course info (content, teachings, images) and optionally project-class info via segment switch
  - `CourseProposition.vue`: multi-step UI to propose/view/edit a course model (rich-text fields, validation, admin approval workflow)
  - `CoursesSelectionList.vue`: student course enrollment UI
  - `CurriculumList.vue`: student curriculum/progression table (credits progression + course table; opens grades and course-details modals)

- **learning_sessions/**: learning sessions feature

  - `LearningSessionsCards.vue`: shows learning sessions grouped by status (current/future/upcoming/completed)
  - `LearningSessionsSelection.vue`: teacher view to select a session and list related/associated courses/classes for that session
  - `LearningSessionsManager.vue`: admin tool to propose/edit learning sessions per school year (table editing + confirm/cancel flows)
  - `SessionDescription.vue`: compact session “header/details” card loaded from backend (used as context summary)

- **classes/**: class management

  - **classes/ordinary/**:
    - `OrdinaryClass.vue`: ordinary class page (students tables, compliance checks, session/section selection, student movement to project classes)
    - `OrdinaryClassesManager.vue`: admin modals to create ordinary classes and add teachers/students (bulk add via `SimpleAdder`)
    - `OrdinaryClassPeopleAdder.vue`: modal-based UI to add teachers/students to a class (search/filter + teaching/coordinator options)
  - **classes/project/**:
    - `ProjectClass.vue`: project class page (roster, course details modal, grades management, student move between project classes)
    - `ProjectClassesList.vue`: master/detail list for sessions/years and related courses/classes (includes admin export and ordinary-classes management entry points)
    - `ProjectClassSelectList.vue`: selection list for propositions/courses per session
    - `ProjectClassSelector.vue`: modal to select destination project class for a student (shows constraints and available options)

- **grades/**: grades management

  - `GradesManager.vue`: modal to view/insert/edit grades (table + mean, date picker, per-grade descriptions, optional final grade)
  - `MultipleGradesManager.vue`: modal to insert grades for multiple students at once (bulk input + validation)

- **users/**: user/student-related UI
  - `AuthPanel.vue`: login form (student/teacher/admin switch + alternative login link)
  - `UserDescription.vue`: user profile page (view/edit personal data, profile image upload/remove, logout)
  - `OverallStudentDescription.vue`: wrapper that combines student profile view + `CurriculumList`

In general:

- `src/components/` contains **reusable building blocks**.
- `src/views/` contains **route-level pages** (used by the router).

## Useful Commands Summary

| Command                                     | Description                                 |
| ------------------------------------------- | ------------------------------------------- |
| `npm install`                               | Install dependencies                        |
| `npm run serve`                             | Start dev server (development mode)         |
| `npm run ionic_serve`                       | Start dev server (production mode with SSL) |
| `npm run build`                             | Build for production (web)                  |
| `npx vue-cli-service build && npx cap copy` | Build web + copy to native                  |
| `npx cap sync --inline`                     | Sync native projects                        |
| `npx cap open android`                      | Open Android project                        |
| `npx cap open ios`                          | Open iOS project                            |
| `npm run test:unit`                         | Run unit tests                              |
| `npm run test:e2e`                          | Run E2E tests                               |
| `npm run lint`                              | Lint and fix code                           |

## Future developments legend

In the codebase, comments about future work follow this convention:

- `! (1-3): <important change>`

  - High priority / high impact changes.
  - The number in parentheses indicates the **priority level** from **1 (highest)** to **3**.

- `TODO (4+): <change>`
  - Normal improvements, refactors, and minor fixes.
  - The number in parentheses indicates the **priority level** from **4 onwards**.

## License

This project is part of the LIVO Path initiative by Istituto De Carneri.
