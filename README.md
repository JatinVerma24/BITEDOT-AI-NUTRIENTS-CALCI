# 🍎 bite.

> **Scan it. Log it. Own it.**
> The fastest way to track your nutrition — barcode scanning, smart food lookup, and automatic macro logging in seconds.

---

## 📱 What is bite.?

**bite.** is a sleek, minimal nutrition tracking app that makes calorie and macro logging effortless. No more manual data entry — just scan a barcode or type a meal name, and bite. instantly fetches the exact nutrition data and logs it for you.

### How it works

| Step | Action |
|------|--------|
| 🔍 **Scan or Type** | User scans a barcode or types a meal name |
| 📡 **Fetch** | App sends a request to the nutrition database |
| ✅ **Log** | App automatically logs exact calories, protein, and fats |

---

## ✨ Features

- **📷 Barcode Scanner** — Instantly identify packaged foods by scanning the barcode
- **🔎 Smart Food Search** — Type any meal or ingredient to find its nutrition profile
- **🔥 Calorie Tracking** — Automatic daily calorie logging with goal progress
- **💪 Macro Breakdown** — Tracks Protein, Carbohydrates, and Fats per meal
- **📊 Daily Dashboard** — Clean summary view of your daily intake
- **🕒 Meal History** — Log breakfast, lunch, dinner, and snacks separately
- **🎯 Custom Goals** — Set personalized daily calorie and macro targets
- **📈 Progress Charts** — Weekly and monthly nutrition trends

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native / Next.js |
| **Backend** | Node.js + Express |
| **Database** | Firebase / MongoDB |
| **Nutrition API** | Open Food Facts / Edamam API |
| **Barcode Scanning** | expo-barcode-scanner / QuaggaJS |
| **Auth** | Firebase Authentication |

> ⚠️ Tech stack will be finalized during development.

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>= 18.x`
- npm or yarn
- (Mobile) Expo CLI or Android/iOS simulator

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/bitedot.git
cd bitedot

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Nutrition Database API
NUTRITION_API_KEY=your_api_key_here
NUTRITION_API_URL=https://api.edamam.com/api/food-database/v2

# Firebase Config
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📂 Project Structure

```
bitedot/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js app directory / pages
│   ├── components/         # Reusable UI components
│   │   ├── BarcodeScanner/ # Barcode scanning component
│   │   ├── FoodSearch/     # Food search & results
│   │   ├── MacroCard/      # Macro display cards
│   │   └── Dashboard/      # Daily summary dashboard
│   ├── lib/                # Utility functions & API helpers
│   │   ├── nutritionApi.js # Nutrition database integration
│   │   └── firebase.js     # Firebase config & auth
│   ├── hooks/              # Custom React hooks
│   └── styles/             # Global styles
├── .env.example            # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

---

## 🗺️ Roadmap

- [x] Project setup & README
- [ ] UI/UX Design & Wireframes
- [ ] Barcode scanning integration
- [ ] Nutrition database API connection
- [ ] Food search & auto-logging
- [ ] Daily dashboard (calories + macros)
- [ ] User authentication (Firebase)
- [ ] Custom daily goals
- [ ] Meal history & weekly stats
- [ ] Progress charts & analytics
- [ ] Mobile app (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ — bite. your goals, not your progress.**

</div>
