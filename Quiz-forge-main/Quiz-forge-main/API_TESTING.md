# Quiz Generator - API Testing Guide

## Quick Test Commands

### 1. Test with cURL (from Windows PowerShell)

```powershell
# Using cURL to test the JSON API
curl.exe -X POST http://localhost:5000/generate_json `
  -F "file=@C:\path\to\your\file.pdf" `
  -F "num_questions=3" `
  -v
```

### 2. Test with Python

```python
import requests
import json

# Test the JSON API
files = {'file': open('C:\\path\\to\\your\\file.pdf', 'rb')}
data = {'num_questions': 5}

response = requests.post(
    'http://localhost:5000/generate_json',
    files=files,
    data=data
)

# Display the result
quiz_data = response.json()
print(json.dumps(quiz_data, indent=2))

# Save to file
with open('quiz_output.json', 'w') as f:
    json.dump(quiz_data, f, indent=2)
```

### 3. Test with JavaScript (Frontend)

```javascript
// Create a FormData object
const formData = new FormData();
const fileInput = document.getElementById('fileInput');
formData.append('file', fileInput.files[0]);
formData.append('num_questions', 5);

// Make the request
fetch('/generate_json', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Quiz Generated:', data);
    processQuiz(data);
})
.catch(error => console.error('Error:', error));
```

### 4. Save & Process the JSON

```python
import json

# Load the generated JSON
with open('quiz_output.json', 'r') as f:
    quiz = json.load(f)

# Access the data
print(f"Quiz Title: {quiz['quiz_title']}")
print(f"Total Questions: {len(quiz['questions'])}")

# Loop through questions
for i, q in enumerate(quiz['questions'], 1):
    print(f"\nQuestion {i}: {q['question']}")
    for j, opt in enumerate(q['options']):
        label = chr(65 + j)  # A, B, C, D
        print(f"  {label}) {opt}")
    correct = chr(65 + q['correct_option'])
    print(f"  Correct Answer: {correct}")
```

## Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Quiz generated successfully |
| 400 | Bad Request | Missing file or invalid format |
| 500 | Server Error | Internal processing error |

## Expected Responses

### Success Response (200)
```json
{
  "quiz_title": "document_name",
  "questions": [
    {
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "correct_option": 1
    }
  ]
}
```

### Error Response (400)
```json
{
  "error": "No file uploaded."
}
```

## Supported File Formats

- ✅ PDF (.pdf)
- ✅ Word Documents (.docx)  
- ✅ Text Files (.txt)

## Testing Checklist

```
□ Test with PDF file
□ Test with DOCX file
□ Test with TXT file
□ Test with different num_questions values
□ Test error handling (no file, invalid format)
□ Verify JSON structure
□ Test JSON parsing in your application
□ Save generated JSON locally
□ Integrate with your website
```

## Troubleshooting

### "No file uploaded" error
- Ensure file input is named `file`
- File exists and is readable
- Using multipart/form-data content type

### "Invalid file format" error
- File extension must be: .pdf, .docx, or .txt
- File has proper content (not corrupted)

### "Could not extract text" error
- PDF might be image-based (try OCR)
- Document might be encrypted
- Try a different file

### JSON parsing error
- Response might not be valid JSON
- Check Content-Type header (should be application/json)
- Log the raw response for debugging

## Integration Workflow

```
1. User uploads document
   ↓
2. POST to /generate_json
   ↓
3. LLM generates MCQs
   ↓
4. Parse text output to JSON
   ↓
5. Return JSON response
   ↓
6. Use in your application
```

## Full Integration Example

```python
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/process-quiz', methods=['POST'])
def process_quiz():
    # Get file from request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    num_questions = request.form.get('num_questions', 5)
    
    # Call the Quiz Generator API
    quiz_generator_url = 'http://localhost:5000/generate_json'
    
    files = {'file': file}
    data = {'num_questions': num_questions}
    
    response = requests.post(quiz_generator_url, files=files, data=data)
    
    if response.status_code != 200:
        return jsonify({'error': 'Quiz generation failed'}), 500
    
    quiz_data = response.json()
    
    # Your custom processing here
    # - Save to database
    # - Create quiz session
    # - Send to frontend
    
    return jsonify({
        'success': True,
        'quiz': quiz_data
    })

if __name__ == '__main__':
    app.run(debug=True)
```

## Real-World Example: Create a Quiz Platform

```javascript
// quiz-platform.js
class QuizGenerator {
    constructor(apiUrl = 'http://localhost:5000') {
        this.apiUrl = apiUrl;
    }
    
    async generateQuiz(file, numQuestions = 5) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('num_questions', numQuestions);
        
        const response = await fetch(`${this.apiUrl}/generate_json`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) throw new Error('Failed to generate quiz');
        return response.json();
    }
    
    async displayQuiz(quiz) {
        // Render quiz UI
        // Handle user selections
        // Calculate score
    }
}

// Usage
const generator = new QuizGenerator();
const file = document.getElementById('fileInput').files[0];
const quiz = await generator.generateQuiz(file, 5);
```

---

**Happy Testing!** 🚀

For more information, see JSON_API_GUIDE.md
