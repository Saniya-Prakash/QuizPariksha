# Quiz Generator - JSON API Integration Guide

## Overview
Your Quiz Generator has been enhanced to support **JSON output format**, making it easy to integrate with external websites and applications.

## JSON Output Format

```json
{
  "quiz_title": "string",
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct_option": 0
    }
  ]
}
```

### JSON Structure Details:
- **quiz_title**: Title of the quiz (based on the uploaded document name)
- **questions**: Array of question objects
- **question**: The MCQ question text
- **options**: Array of exactly 4 answer options (A, B, C, D)
- **correct_option**: Index of the correct option (0=A, 1=B, 2=C, 3=D)

## How to Use

### Option 1: HTML Interface
1. Upload a document (PDF, DOCX, or TXT) 
2. Specify number of questions
3. Click "Download as .json" from the results page
4. The JSON file is saved and ready to use

### Option 2: Direct API Endpoint (for integration)
Make a POST request to `/generate_json` endpoint with:

**Endpoint**: `POST /generate_json`

**Request Parameters**:
- `file`: Your document file (PDF, DOCX, or TXT)
- `num_questions`: Number of MCQs to generate (default: 5)

**Example using cURL**:
```bash
curl -X POST http://localhost:5000/generate_json \
  -F "file=@your_document.pdf" \
  -F "num_questions=5"
```

**Example using JavaScript/Fetch**:
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('num_questions', 5);

fetch('http://localhost:5000/generate_json', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

**Example using Python**:
```python
import requests
import json

files = {'file': open('your_document.pdf', 'rb')}
data = {'num_questions': 5}

response = requests.post(
    'http://localhost:5000/generate_json',
    files=files,
    data=data
)

quiz_data = response.json()
print(json.dumps(quiz_data, indent=2))
```

**Response**:
```json
{
  "quiz_title": "your_document",
  "questions": [
    {
      "question": "What is...?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_option": 1
    }
  ]
}
```

## Integration Example (HTML/JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Quiz Generator</title>
</head>
<body>
    <form id="quizForm">
        <input type="file" id="fileInput" accept=".pdf,.docx,.txt" required>
        <input type="number" id="numQuestions" value="5" min="1" max="20">
        <button type="submit">Generate Quiz</button>
    </form>

    <div id="quizContainer"></div>

    <script>
        document.getElementById('quizForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('file', document.getElementById('fileInput').files[0]);
            formData.append('num_questions', document.getElementById('numQuestions').value);

            const response = await fetch('/generate_json', {
                method: 'POST',
                body: formData
            });

            const quizData = await response.json();
            
            // Display quiz
            let html = `<h2>${quizData.quiz_title}</h2>`;
            quizData.questions.forEach((q, idx) => {
                html += `
                    <div class="question">
                        <h4>Q${idx + 1}: ${q.question}</h4>
                        ${q.options.map((opt, i) => `
                            <label>
                                <input type="radio" name="q${idx}">
                                ${String.fromCharCode(65 + i)}) ${opt}
                            </label>
                        `).join('')}
                    </div>
                `;
            });
            
            document.getElementById('quizContainer').innerHTML = html;
        });
    </script>
</body>
</html>
```

## Features Added

✅ **JSON Export**: Download quiz as JSON file from the HTML interface
✅ **JSON API Endpoint**: Direct API endpoint for programmatic access
✅ **Structured Data**: Consistent, easy-to-parse JSON format
✅ **Option Indexing**: Correct answers indexed as 0-3 for A-D
✅ **Flexible Integration**: Works with any website or application

## File Downloads

The HTML interface now provides three download options:
- **Download as .txt** - Plain text format
- **Download as .pdf** - PDF document
- **Download as .json** - Structured JSON data (NEW!)

## Example JSON Output

See `EXAMPLE_JSON_OUTPUT.json` in the project directory for sample output.

## Error Handling

**API Response Codes**:
- `200 OK`: Quiz generated successfully
- `400 Bad Request`: Missing file or invalid parameters
- `500 Server Error`: Server-side processing error

**Error Response**:
```json
{
  "error": "No file uploaded."
}
```

## Notes

- JSON files are automatically saved in the `results/` directory
- All three formats (TXT, PDF, JSON) are generated simultaneously
- The JSON structure is consistent and validated
- Correct answer indices follow A=0, B=1, C=2, D=3 convention
