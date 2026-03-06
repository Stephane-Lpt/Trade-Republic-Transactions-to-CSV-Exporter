# 📊 Trade Republic Transaction Exporter

<div align="center">

![Firefox](https://img.shields.io/badge/Firefox-FF7139?style=for-the-badge&logo=Firefox-Browser&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge)
![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Security](https://img.shields.io/badge/Security-100%25%20Local-success?style=for-the-badge&logo=security&logoColor=white)

**Secure Firefox extension to export your Trade Republic transactions to a CSV file**

[Features](#-features) • [Installation](#-installation) • [Security](#-security) • [Usage](#-usage) • [FAQ](#-faq)

</div>

---

## 📋 Description

Trade Republic Transaction Exporter is an open-source Firefox extension that lets you easily export your banking transactions from your Trade Republic account to a CSV file for further analysis in Excel, Google Sheets, or any other accounting software.

### 🎯 Why this extension?

- **📥 Quick export**: Export months of transactions in just a few clicks
- **📅 Date filtering**: Precisely select the period you're interested in
- **🔒 Fully secure**: No data ever leaves your computer
- **💯 Zero dependencies**: Native JavaScript, no external libraries
- **🆓 Free and open-source**: Full code transparency

---

## ✨ Features

### 🎨 Intuitive interface
- Elegant and easy-to-use popup
- Date selection with built-in calendar
- Real-time progress bar
- Clear status messages

### 🔄 Automatic loading
- **Automated infinite scroll**: The extension automatically scrolls the page to load all your transactions
- **Smart detection**: Stops automatically once the selected period is fully loaded
- **Performance optimisation**: Minimises unnecessary scroll requests

### 📅 Date management
- Customisable period
- Dates intelligently pre-filled (20th of the previous month to the 19th of the current month)
- Automatic date validation

---

## 🔒 Security & Privacy

### ⚠️ SECURITY GUARANTEES

This extension was developed to the highest security standards:

#### ✅ WHAT THE EXTENSION DOES:
- ✔️ Reads **only** the HTML content visible in your browser
- ✔️ Analyses data displayed on the Trade Republic page
- ✔️ Generates the CSV file **locally** on your computer
- ✔️ Uses only native JavaScript (Vanilla JS)

#### ❌ WHAT THE EXTENSION WILL **NEVER** DO:
- ❌ **No access to session tokens** or cookies
- ❌ **No interception** of network requests (XHR/Fetch)
- ❌ **No connection** to external servers
- ❌ **No transmission** of your personal data
- ❌ **No modification** of your banking data
- ❌ **No tracking** or analytics

### 🔍 Full Transparency

- **Open source code**: All code is visible and auditable
- **Minimal permissions**: The extension only requests strictly necessary permissions
- **Manifest V3**: Uses Firefox's latest security architecture
- **No dependencies**: No risk of vulnerabilities via third-party libraries

## 🚀 Usage

### Step-by-step guide

1. **Log in to Trade Republic**
   - Open [app.traderepublic.com](https://app.traderepublic.com)
   - Log in to your account
   - Navigate to **Profile → Transactions** (`/profile/transactions`)

2. **Open the extension**
   - Click the extension icon in the toolbar
   - The popup opens with pre-filled dates

3. **Configure the export**
   - **Start date**: First day of the period
   - **End date**: Last day of the period
   - Default dates cover from the 20th of last month to the 19th of the current month

4. **Start the export**
   - Click **"🚀 Start export"**
   - The extension will automatically:
     - Scroll the page to load all transactions
     - Extract the data
     - Generate the CSV file
   - A progress bar shows you the current status

5. **Retrieve your file**
   - The CSV file is automatically downloaded
   - File name: `traderepublic_YYYY-MM-DD_YYYY-MM-DD.csv`
   - Open it with Excel, Google Sheets, or your preferred software

## 📊 CSV file format

The generated CSV file contains the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| **Date** | Transaction date (DD/MM/YYYY) | 23/02/2026 |
| **Description** | Label / Merchant name | Amazon Pay |
| **Amount** | Decimal amount | 25.99 |
| **Currency** | Currency symbol | € |
| **Status** | Transaction status | Completed, Sent, Cancelled |

## 🛠️ Technical Architecture

### File structure
```
traderepublic-exporter/
├── manifest.json          # Extension configuration
├── popup.html             # User interface
├── popup.css              # Interface styles
├── popup.js               # Popup logic
├── content.js             # Scraping script (core of the extension)
├── icons/                 # Extension icons (optional)
│   ├── icon-48.png
│   └── icon-96.png
└── README.md              # Documentation
```

### Technologies used

- **Manifest V3**: Modern and secure architecture
- **Vanilla JavaScript**: No external dependencies
- **DOM Scraping**: Reads only the visible HTML
- **Content Scripts**: Full isolation from the page context
- **Browser API**: Native Firefox APIs for communication

### Required permissions
```json
{
  "permissions": [
    "activeTab",      // Access to the active tab only
    "scripting"       // Content script injection
  ],
  "host_permissions": [
    "https://app.traderepublic.com/*"  // Limited to Trade Republic only
  ]
}
```

---

## 🐛 Troubleshooting

### The extension can't find transactions

**Solution**:
- Make sure you are on the `/profile/transactions` page
- Reload the Trade Republic page
- Reload the extension in `about:debugging`

## ❓ FAQ

### Does the extension access my password?
**No.** The extension cannot access your credentials. It only reads the HTML content displayed after you log in.

### Is my data sent anywhere?
**No.** All operations are performed locally on your computer. No data ever leaves your browser.

### Why does the extension need access to Trade Republic?
To read the page content and extract the displayed transactions. This is the only way to retrieve your data without an official API.

### Does the extension work with other banks?
No, it is specifically designed for Trade Republic. The code would need to be adapted for other platforms.

### Will the extension be updated if Trade Republic changes?
Updates depend on the community. If Trade Republic changes its HTML structure, the code will need to be adapted.

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### 🐛 Report a bug
- Open an [issue](https://github.com/your-username/traderepublic-exporter/issues)
- Describe the problem with screenshots
- Include console error messages (F12)

### 💡 Suggest a feature
- Open an [issue](https://github.com/your-username/traderepublic-exporter/issues) with the `enhancement` tag
- Clearly describe the desired feature
- Explain the use case

### 🔧 Contribute code
1. Fork the project
2. Create a branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request