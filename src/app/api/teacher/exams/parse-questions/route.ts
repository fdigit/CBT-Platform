import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'text/csv', // .csv
      'application/csv', // .csv
    ];

    // Also check file extension for CSV files (browsers sometimes don't set correct MIME type)
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isAllowedExtension = ['xlsx', 'xls', 'docx', 'doc', 'csv'].includes(
      fileExtension || ''
    );

    if (!allowedTypes.includes(file.type) && !isAllowedExtension) {
      return NextResponse.json(
        {
          error:
            'File type not supported. Please upload Excel (.xlsx, .xls), CSV (.csv), or Word (.docx, .doc) files.',
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    let questions: any[] = [];

    // Parse based on file type
    if (
      file.type.includes('spreadsheet') ||
      file.type.includes('excel') ||
      fileExtension === 'xlsx' ||
      fileExtension === 'xls'
    ) {
      questions = await parseExcelFile(buffer);
    } else if (
      file.type.includes('wordprocessingml') ||
      file.type.includes('msword') ||
      fileExtension === 'docx' ||
      fileExtension === 'doc'
    ) {
      questions = await parseWordFile(buffer);
    } else if (file.type.includes('csv') || fileExtension === 'csv') {
      questions = await parseCSVFile(buffer);
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No questions found in the uploaded file' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
    });
  } catch (error) {
    console.error('Error parsing questions file:', error);
    return NextResponse.json(
      { error: 'Failed to parse questions file' },
      { status: 500 }
    );
  }
}

async function parseExcelFile(buffer: ArrayBuffer): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON with header row
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (data.length < 2) {
      throw new Error(
        'Excel file must have at least a header row and one question row'
      );
    }

    const headers = data[0] as string[];
    const rows = data.slice(1) as any[][];

    const questions: any[] = [];

    rows.forEach((row, index) => {
      if (!row || row.length === 0 || !row[0]) return; // Skip empty rows

      const question: any = {
        id: `imported_${Date.now()}_${index}`,
        text: '',
        type: 'MCQ',
        options: [],
        correctAnswer: '',
        points: 1,
        difficulty: 'MEDIUM',
        explanation: '',
        tags: [],
      };

      // Map Excel columns to question properties
      headers.forEach((header, colIndex) => {
        const value = row[colIndex]?.toString().trim() || '';

        switch (header.toLowerCase()) {
          case 'question':
          case 'text':
            question.text = value;
            break;
          case 'type':
            question.type = value.toUpperCase() || 'MCQ';
            break;
          case 'option1':
          case 'option a':
            if (value) question.options[0] = value;
            break;
          case 'option2':
          case 'option b':
            if (value) question.options[1] = value;
            break;
          case 'option3':
          case 'option c':
            if (value) question.options[2] = value;
            break;
          case 'option4':
          case 'option d':
            if (value) question.options[3] = value;
            break;
          case 'correct':
          case 'correct answer':
          case 'answer':
            // Convert letter answers (A, B, C, D) to index (0, 1, 2, 3)
            if (/^[A-D]$/i.test(value)) {
              question.correctAnswer = (
                value.toUpperCase().charCodeAt(0) - 65
              ).toString();
            } else if (/^[1-4]$/.test(value)) {
              question.correctAnswer = (parseInt(value) - 1).toString();
            } else {
              question.correctAnswer = value;
            }
            break;
          case 'points':
          case 'marks':
          case 'score':
            question.points = parseFloat(value) || 1;
            break;
          case 'difficulty':
            question.difficulty = value.toUpperCase() || 'MEDIUM';
            break;
          case 'explanation':
            question.explanation = value;
            break;
          case 'tags':
            question.tags = value
              ? value.split(',').map((tag: string) => tag.trim())
              : [];
            break;
        }
      });

      // Ensure we have at least 4 options for MCQ
      if (question.type === 'MCQ') {
        while (question.options.length < 4) {
          question.options.push('');
        }
      }

      // Validate required fields
      if (question.text && question.type) {
        questions.push(question);
      }
    });

    return questions;
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error(
      'Failed to parse Excel file. Please ensure the file format is correct.'
    );
  }
}

async function parseWordFile(buffer: ArrayBuffer): Promise<any[]> {
  try {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buffer),
    });
    const text = result.value;

    const questions: any[] = [];
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);

    let currentQuestion: any = null;
    let questionNumber = 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect question start (lines starting with numbers or Q)
      if (/^\d+\.|^Q\d+\.|^Question\s*\d*:?/i.test(line)) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.text) {
          questions.push(currentQuestion);
        }

        // Start new question
        currentQuestion = {
          id: `imported_${Date.now()}_${questionNumber}`,
          text: line.replace(/^\d+\.|^Q\d+\.|^Question\s*\d*:?\s*/i, ''),
          type: 'MCQ',
          options: [],
          correctAnswer: '',
          points: 1,
          difficulty: 'MEDIUM',
          explanation: '',
          tags: [],
        };
        questionNumber++;
      }
      // Detect options (lines starting with a), b), c), d) or A), B), C), D)
      else if (/^[a-dA-D]\)/.test(line)) {
        if (currentQuestion) {
          const option = line.replace(/^[a-dA-D]\)\s*/, '');
          const optionIndex = line.toLowerCase().charAt(0).charCodeAt(0) - 97; // a=0, b=1, c=2, d=3
          currentQuestion.options[optionIndex] = option;
        }
      }
      // Detect correct answer (lines starting with "Answer:", "Correct:", etc.)
      else if (/^(Answer|Correct|Solution):\s*/i.test(line)) {
        if (currentQuestion) {
          currentQuestion.correctAnswer = line.replace(
            /^(Answer|Correct|Solution):\s*/i,
            ''
          );
        }
      }
      // Detect explanation (lines starting with "Explanation:", "Reason:", etc.)
      else if (/^(Explanation|Reason|Solution):\s*/i.test(line)) {
        if (currentQuestion) {
          currentQuestion.explanation = line.replace(
            /^(Explanation|Reason|Solution):\s*/i,
            ''
          );
        }
      }
      // If no special pattern, append to current question text
      else if (currentQuestion && !currentQuestion.text.includes(line)) {
        currentQuestion.text += ' ' + line;
      }
    }

    // Add the last question
    if (currentQuestion && currentQuestion.text) {
      questions.push(currentQuestion);
    }

    // Ensure all MCQ questions have 4 options
    questions.forEach(q => {
      if (q.type === 'MCQ') {
        while (q.options.length < 4) {
          q.options.push('');
        }
      }
    });

    return questions;
  } catch (error) {
    console.error('Error parsing Word file:', error);
    throw new Error(
      'Failed to parse Word file. Please ensure the file format is correct.'
    );
  }
}

async function parseCSVFile(buffer: ArrayBuffer): Promise<any[]> {
  try {
    const text = new TextDecoder('utf-8').decode(buffer);
    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);

    if (lines.length < 2) {
      throw new Error(
        'CSV file must have at least a header row and one question row'
      );
    }

    const headers = lines[0]
      .split(',')
      .map(header => header.trim().replace(/"/g, ''));
    const rows = lines
      .slice(1)
      .map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));

    const questions: any[] = [];

    rows.forEach((row, index) => {
      if (!row || row.length === 0 || !row[0]) return; // Skip empty rows

      const question: any = {
        id: `imported_${Date.now()}_${index}`,
        text: '',
        type: 'MCQ',
        options: [],
        correctAnswer: '',
        points: 1,
        difficulty: 'MEDIUM',
        explanation: '',
        tags: [],
      };

      // Map CSV columns to question properties
      headers.forEach((header, colIndex) => {
        const value = row[colIndex]?.toString().trim() || '';

        switch (header.toLowerCase()) {
          case 'question':
          case 'text':
            question.text = value;
            break;
          case 'type':
            question.type = value.toUpperCase() || 'MCQ';
            break;
          case 'option1':
          case 'option a':
            if (value) question.options[0] = value;
            break;
          case 'option2':
          case 'option b':
            if (value) question.options[1] = value;
            break;
          case 'option3':
          case 'option c':
            if (value) question.options[2] = value;
            break;
          case 'option4':
          case 'option d':
            if (value) question.options[3] = value;
            break;
          case 'correct':
          case 'correct answer':
          case 'answer':
            // Convert letter answers (A, B, C, D) to index (0, 1, 2, 3)
            if (/^[A-D]$/i.test(value)) {
              question.correctAnswer = (
                value.toUpperCase().charCodeAt(0) - 65
              ).toString();
            } else if (/^[1-4]$/.test(value)) {
              question.correctAnswer = (parseInt(value) - 1).toString();
            } else {
              question.correctAnswer = value;
            }
            break;
          case 'points':
          case 'marks':
          case 'score':
            question.points = parseFloat(value) || 1;
            break;
          case 'difficulty':
            question.difficulty = value.toUpperCase() || 'MEDIUM';
            break;
          case 'explanation':
            question.explanation = value;
            break;
          case 'tags':
            question.tags = value
              ? value.split(',').map((tag: string) => tag.trim())
              : [];
            break;
        }
      });

      // Ensure we have at least 4 options for MCQ
      if (question.type === 'MCQ') {
        while (question.options.length < 4) {
          question.options.push('');
        }
      }

      // Validate required fields
      if (question.text && question.type) {
        questions.push(question);
      }
    });

    return questions;
  } catch (error) {
    console.error('Error parsing CSV file:', error);
    throw new Error(
      'Failed to parse CSV file. Please ensure the file format is correct.'
    );
  }
}
