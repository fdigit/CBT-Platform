import { authOptions } from '@/lib/auth';
import { calculateGPA, getOverallGradeFromGPA } from '@/lib/grading';
import { prisma } from '@/lib/prisma';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { name: true } },
        class: { select: { name: true, section: true } },
        school: { select: { name: true, logoUrl: true } },
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const term = searchParams.get('term');
    const session_param = searchParams.get('session');

    if (!term || !session_param) {
      return NextResponse.json(
        { error: 'Term and session are required' },
        { status: 400 }
      );
    }

    const results = await prisma.academicResult.findMany({
      where: {
        studentId: student.id,
        term,
        session: session_param,
        status: 'PUBLISHED',
      },
      include: {
        subject: { select: { name: true, code: true } },
        teacher: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
      orderBy: {
        subject: { name: 'asc' },
      },
    });

    if (results.length === 0) {
      return NextResponse.json(
        { error: 'No published results found for this term and session' },
        { status: 404 }
      );
    }

    const gpaCalc = calculateGPA(results as any);
    const overallGrade = getOverallGradeFromGPA(gpaCalc.gpa);

    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(student.school.name, 105, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('ACADEMIC RESULT SLIP', 105, 30, { align: 'center' });

    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(10);
    let yPos = 45;

    doc.text(`Name: ${student.user.name}`, 20, yPos);
    doc.text(`Reg. No: ${student.regNumber}`, 130, yPos);
    yPos += 7;

    doc.text(
      `Class: ${student.class?.name}${student.class?.section ? ` ${student.class.section}` : ''}`,
      20,
      yPos
    );
    doc.text(`Term: ${term}`, 130, yPos);
    yPos += 7;

    doc.text(`Session: ${session_param}`, 20, yPos);
    doc.text(`No. of Subjects: ${results.length}`, 130, yPos);
    yPos += 10;

    const tableData = results.map(result => [
      result.subject.name,
      result.caScore?.toFixed(1) || '0.0',
      result.examScore?.toFixed(1) || '0.0',
      result.totalScore.toFixed(1),
      result.actualGrade,
      result.gradePoint.toFixed(1),
      result.remark || '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [
        [
          'Subject',
          'CA (40)',
          'Exam (60)',
          'Total (100)',
          'Grade',
          'GP',
          'Remark',
        ],
      ],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 32 },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`GPA: ${gpaCalc.gpa.toFixed(2)}`, 20, yPos);
    doc.text(`Overall Grade: ${overallGrade}`, 80, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Comments:', 20, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const firstResult = results[0];
    if (firstResult.teacherComment) {
      doc.text(`Class Teacher: ${firstResult.teacherComment}`, 20, yPos);
      yPos += 6;
    }

    if (firstResult.hodComment) {
      doc.text(`Head of Department: ${firstResult.hodComment}`, 20, yPos);
      yPos += 6;
    }

    if (firstResult.principalComment) {
      doc.text(`Principal: ${firstResult.principalComment}`, 20, yPos);
      yPos += 6;
    }

    yPos += 10;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('GRADING KEY', 20, yPos);
    yPos += 5;

    doc.setFont('helvetica', 'normal');
    doc.text(
      'A* (90-100) = 5.0 | A (80-89) = 4.5 | B+ (70-79) = 4.0 | B (60-69) = 3.5',
      20,
      yPos
    );
    yPos += 4;
    doc.text('C (50-59) = 3.0 | D (40-49) = 2.0 | F (0-39) = 0.0', 20, yPos);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Result_${student.regNumber}_${term}_${session_param}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
