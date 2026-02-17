# Muchacho Personal Manager

A cross-platform desktop application built with Electron for managing your personal productivity, notes, and digital collections. Stay organized with integrated tools for todos, notes, calendar events, book tracking, video collections, financial securities, and password management.

## 🎯 Features

- **Todo Management** - Create, organize, and track your daily tasks
- **Notes** - Write and organize markdown-formatted notes with full formatting support
- **Calendar** - Keep track of important dates and events
- **Books** - Maintain a collection of books you want to read or have read
- **Videos** - Organize and bookmark your video library
- **Securities** - Track financial investments and securities
- **Password Manager** - Securely store and manage passwords with encryption
- **AI Integration** - Intelligent search and text processing powered by TensorFlow and NLP models
- **Responsive Layout** - Customizable multi-panel interface

## 🛠️ Tech Stack

- **Framework**: Electron 28.0.0
- **Language**: JavaScript (Node.js)
- **UI**: HTML5 & CSS3
- **AI/ML**:
    - TensorFlow.js v4.22.0
    - Universal Sentence Encoder
    - Natural language processing (compromise, natural, stopword)
- **Data Processing**:
    - Marked (markdown rendering)
    - Highlight.js (syntax highlighting)
- **Security**: CryptoJS (encryption)
- **Build Tool**: electron-builder

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn

## 🚀 Installation

1. Clone the repository:

```bash
git clone https://github.com/Muchacho365/my-personal-manager.git
cd my-personal-manager
```

2. Install dependencies:

```bash
npm install
```

3. Start the application:

```bash
npm start
```

For development mode with hot reload:

```bash
npm run dev
```

## 🏗️ Project Structure

```
├── main.js                 # Electron main process
├── preload.js             # Preload script for IPC
├── index.html             # Main application template
├── styles.css             # Global styles
├── js/
│   ├── app.js             # Application initialization
│   ├── state.js           # State management
│   ├── utils.js           # Utility functions
│   ├── ai/
│   │   ├── aiManager.js   # AI orchestration
│   │   └── aiWorker.js    # AI processing
│   ├── components/        # UI components
│   │   ├── AiTools.js
│   │   ├── Books.js
│   │   ├── Calendar.js
│   │   ├── LayoutManager.js
│   │   ├── Notes.js
│   │   ├── Securities.js
│   │   ├── Todos.js
│   │   └── Videos.js
│   └── utils/
│       └── markdown.js    # Markdown processing
└── assets/               # Static assets
```

## 💾 Build

To build the application for distribution:

```bash
npm run build
```

The compiled application will be generated in the `dist/` directory.

## 📝 License

This project is licensed under the MIT License. See LICENSE file for details.

## 👤 Author

**Muchacho**

- Email: muchacho@personal-manager.local
- GitHub: [@Muchacho365](https://github.com/Muchacho365)
