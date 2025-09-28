// PDF generation utility for student results
export const generateResultPDF = async (result: any, studentName: string) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Set up the document
  doc.setFontSize(20);
  doc.text('Exam Result Report', 20, 30);

  doc.setFontSize(12);
  doc.text(`Student: ${studentName}`, 20, 50);
  doc.text(`Exam: ${result.examTitle}`, 20, 60);
  doc.text(`Subject: ${result.subject}`, 20, 70);
  doc.text(`Date: ${new Date(result.examDate).toLocaleDateString()}`, 20, 80);

  // Score section
  doc.setFontSize(16);
  doc.text('Score Summary', 20, 100);

  doc.setFontSize(12);
  doc.text(`Score: ${result.score}/${result.totalMarks}`, 20, 115);
  doc.text(`Percentage: ${result.percentage.toFixed(1)}%`, 20, 125);
  doc.text(`Grade: ${result.grade}`, 20, 135);
  doc.text(`Status: ${result.passed ? 'Passed' : 'Failed'}`, 20, 145);

  // Teacher information
  if (result.teacher) {
    doc.text(`Teacher: ${result.teacher}`, 20, 160);
  }

  // Teacher remark
  if (result.teacherRemark) {
    doc.setFontSize(14);
    doc.text("Teacher's Remark", 20, 180);
    doc.setFontSize(10);
    const splitRemark = doc.splitTextToSize(result.teacherRemark, 170);
    doc.text(splitRemark, 20, 190);
  }

  // Question breakdown
  if (result.questions && result.questions.length > 0) {
    doc.setFontSize(14);
    doc.text('Question Breakdown', 20, 220);

    let yPosition = 235;
    result.questions.forEach((question: any, index: number) => {
      if (yPosition > 280) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.text(`Question ${index + 1}:`, 20, yPosition);
      doc.text(
        `Points: ${question.pointsAwarded}/${question.points}`,
        20,
        yPosition + 5
      );
      doc.text(`Type: ${question.type.replace('_', ' ')}`, 20, yPosition + 10);

      yPosition += 25;
    });
  }

  // Performance analysis
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Performance Analysis', 20, 30);

  doc.setFontSize(12);
  let analysis = '';
  if (result.percentage >= 90) {
    analysis = 'Excellent performance! Keep up the great work.';
  } else if (result.percentage >= 80) {
    analysis = 'Very good performance. Consider reviewing missed concepts.';
  } else if (result.percentage >= 70) {
    analysis = 'Good performance. Focus on areas that need improvement.';
  } else if (result.percentage >= 50) {
    analysis = 'Fair performance. Review the material and practice more.';
  } else {
    analysis = 'Needs improvement. Consider seeking additional help.';
  }

  doc.text(analysis, 20, 50);

  // Save the PDF
  const fileName = `result_${result.examTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateAllResultsPDF = async (
  results: any[],
  studentName: string
) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  // Title page
  doc.setFontSize(20);
  doc.text('Complete Results Report', 20, 30);
  doc.setFontSize(12);
  doc.text(`Student: ${studentName}`, 20, 50);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 60);

  // Summary statistics
  const totalExams = results.length;
  const passedExams = results.filter(r => r.passed).length;
  const averageScore =
    results.reduce((sum, r) => sum + r.percentage, 0) / totalExams;

  doc.setFontSize(14);
  doc.text('Summary Statistics', 20, 80);
  doc.setFontSize(12);
  doc.text(`Total Exams: ${totalExams}`, 20, 95);
  doc.text(`Passed Exams: ${passedExams}`, 20, 105);
  doc.text(
    `Pass Rate: ${((passedExams / totalExams) * 100).toFixed(1)}%`,
    20,
    115
  );
  doc.text(`Average Score: ${averageScore.toFixed(1)}%`, 20, 125);

  // Individual results
  results.forEach((result, index) => {
    if (index > 0) {
      doc.addPage();
    }

    doc.setFontSize(16);
    doc.text(`Result ${index + 1}: ${result.examTitle}`, 20, 30);

    doc.setFontSize(12);
    doc.text(`Subject: ${result.subject}`, 20, 45);
    doc.text(`Score: ${result.score}/${result.totalMarks}`, 20, 55);
    doc.text(`Percentage: ${result.percentage.toFixed(1)}%`, 20, 65);
    doc.text(`Grade: ${result.grade}`, 20, 75);
    doc.text(`Status: ${result.passed ? 'Passed' : 'Failed'}`, 20, 85);
    doc.text(`Date: ${new Date(result.examDate).toLocaleDateString()}`, 20, 95);

    if (result.teacher) {
      doc.text(`Teacher: ${result.teacher}`, 20, 105);
    }
  });

  // Save the PDF
  const fileName = `complete_results_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
