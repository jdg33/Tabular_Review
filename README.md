
# Tabular Review for Bulk Document Analysis

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/framework-React-61DAFB.svg)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-8E75B2.svg)

An AI-powered document review workspace that transforms unstructured legal contracts into structured, queryable datasets. Designed for legal professionals, auditors, and procurement teams to accelerate due diligence and contract analysis.

## 🚀 Features

- **AI-Powered Extraction**: Automatically extract key clauses, dates, amounts, and entities from PDFs using Google Gemini 2.5 Pro / 3.0.
- **Direct PDF Processing**: Files are uploaded directly to Gemini's File API for native PDF understanding without conversion.
- **Dynamic Schema**: Define columns with natural language prompts (e.g., "What is the governing law?").
- **Verification & Citations**: Click any extracted cell to view the exact source quote from the document.
- **Spreadsheet Interface**: A high-density, Excel-like grid for managing bulk document reviews.
- **Integrated Chat Analyst**: Ask questions across your entire dataset (e.g., "Which contract has the most favorable MFN clause?").

## 🎬 Demo

https://github.com/user-attachments/assets/b63026d8-3df6-48a8-bb4b-eb8f24d3a1ca

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI Integration**: Google GenAI SDK (Gemini 2.5 Flash, 2.5 Pro, 3.0 Pro)

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/tabular-review.git
cd tabular-review
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure API Key
Create a `.env` file in the root directory:
```env
VITE_GEMINI_API_KEY=your_google_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 4. Run
```bash
npm run dev
```

The application will start at http://localhost:5173

## 🛡 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This tool is an AI assistant and should not be used as a substitute for professional legal advice. Always verify AI-generated results against the original documents.
