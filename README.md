
# Tabular Review for Bulk Document Analysis

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/framework-React-61DAFB.svg)
![AI](https://img.shields.io/badge/AI-Claude-8E75B2.svg)

An AI-powered document review workspace that transforms unstructured legal contracts into structured, queryable datasets. Designed for legal professionals, auditors, and procurement teams to accelerate due diligence and contract analysis.

## 🚀 Features

- **AI-Powered Extraction**: Automatically extract key clauses, dates, amounts, and entities from documents using Claude Haiku 4.5.
- **Document Format Support**: Supports PDF, DOCX, and DOC files with automatic conversion to PDF for optimal processing.
- **Direct PDF Processing**: Documents are sent to Claude for analysis with native PDF understanding via document content blocks.
- **Dynamic Schema**: Define columns with natural language prompts (e.g., "What is the governing law?").
- **Verification & Citations**: Click any extracted cell to view the exact source quote from the document.
- **Spreadsheet Interface**: A high-density, Excel-like grid for managing bulk document reviews.
- **Integrated Chat Analyst**: Ask questions across your entire dataset (e.g., "Which contract has the most favorable MFN clause?").

## 🎬 Demo

https://github.com/user-attachments/assets/b63026d8-3df6-48a8-bb4b-eb8f24d3a1ca

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **AI Integration**: Anthropic Claude SDK (Claude Haiku 4.5)
- **Backend**: Supabase Edge Functions (for document conversion)
- **Document Processing**: CloudConvert API (DOCX/DOC to PDF)

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

### 3. Configure API Keys

#### Anthropic Claude API Key (Required)
If using Bolt, configure your API key in the Secrets menu with the key name `ANTHROPIC_API_KEY`.

For local development, create a `.env` file in the root directory:
```env
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API key from [Anthropic Console](https://console.anthropic.com/)

#### CloudConvert API Key (Required for DOCX/DOC conversion)
To enable automatic conversion of Word documents to PDF:

1. Sign up for a free account at [CloudConvert](https://cloudconvert.com/register)
2. Get your API key from the [CloudConvert Dashboard](https://cloudconvert.com/dashboard/api/v2/keys)
3. Set the `CLOUDCONVERT_API_KEY` secret in your Supabase Edge Functions:

```bash
supabase secrets set CLOUDCONVERT_API_KEY=your_cloudconvert_api_key_here
```

**Note**: CloudConvert offers a free tier with 25 conversions per day. Without this key, the app will still work but only accept PDF files.

### 4. Run
```bash
npm run dev
```

The application will start at http://localhost:5173

## 🛡 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Disclaimer**: This tool is an AI assistant and should not be used as a substitute for professional legal advice. Always verify AI-generated results against the original documents.
