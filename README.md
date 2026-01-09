
# Tabular Review for Bulk Document Analysis

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/framework-React-61DAFB.svg)
![AI](https://img.shields.io/badge/AI-Claude-8E75B2.svg)

An AI-powered document review workspace that transforms unstructured legal contracts into structured, queryable datasets. Designed for legal professionals, auditors, and procurement teams to accelerate due diligence and contract analysis.

## 🚀 Features

- **AI-Powered Extraction**: Automatically extract key clauses, dates, amounts, and entities from PDFs using Claude Haiku 4.5.
- **Direct PDF Processing**: Documents are processed locally and sent to Claude for analysis with native PDF understanding.
- **Dynamic Schema**: Define columns with natural language prompts (e.g., "What is the governing law?").
- **Verification & Citations**: Click any extracted cell to view the exact source quote from the document.
- **Spreadsheet Interface**: A high-density, Excel-like grid for managing bulk document reviews.
- **Integrated Chat Analyst**: Ask questions across your entire dataset (e.g., "Which contract has the most favorable MFN clause?").

## 🎬 Demo

https://github.com/user-attachments/assets/b63026d8-3df6-48a8-bb4b-eb8f24d3a1ca

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI Integration**: Anthropic Claude SDK (Claude Haiku 4.5)

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
If using Bolt, configure your API key in the Secrets menu with the key name `ANTHROPIC_API_KEY`.

For local development, create a `.env` file in the root directory:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API key from [Anthropic Console](https://console.anthropic.com/)

### 4. Run
```bash
npm run dev
```

The application will start at http://localhost:5173

## 🛡 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This tool is an AI assistant and should not be used as a substitute for professional legal advice. Always verify AI-generated results against the original documents.
