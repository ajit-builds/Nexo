import Papa from "papaparse";
import { StudentRecord, ValidationError } from "@/types";

export interface ParseResult {
  records: StudentRecord[];
  errors: ValidationError[];
  totalRows: number;
  validRows: number;
}

/**
 * Parse and validate CSV data for student batch graduation
 */
export function parseStudentCSV(csvContent: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, "_"),
      complete: (results) => {
        const errors: ValidationError[] = [];
        const records: StudentRecord[] = [];

        results.data.forEach((row, idx) => {
          const rowNum = idx + 2; // header is row 1
          const studentId = row.student_id || row.id || row.roll_no || row.roll_number;
          const fullName = row.full_name || row.name || row.student_name;
          const degree = row.degree || row.course || "Bachelor of Technology";
          const major = row.major || row.department || row.branch || "Computer Science";
          const gradYear = parseInt(row.graduation_year || row.year || "2024", 10);
          const rawCgpa = parseFloat(row.cgpa || row.gpa || "0");
          const institutionName = row.institution_name || row.university || "IIT Bombay";
          const issueDate = row.issue_date || row.date || new Date().toISOString().split("T")[0];

          // Validation checks
          if (!studentId) {
            errors.push({
              row: rowNum,
              field: "student_id",
              message: "Student ID / Roll Number is required",
              value: studentId
            });
          }

          if (!fullName) {
            errors.push({
              row: rowNum,
              field: "full_name",
              message: "Full Name cannot be empty",
              value: fullName
            });
          }

          if (isNaN(rawCgpa) || rawCgpa < 0 || rawCgpa > 10) {
            errors.push({
              row: rowNum,
              field: "cgpa",
              message: "CGPA must be a valid number between 0.0 and 10.0",
              value: row.cgpa
            });
          }

          if (isNaN(gradYear) || gradYear < 1970 || gradYear > 2035) {
            errors.push({
              row: rowNum,
              field: "graduation_year",
              message: "Graduation year must be a realistic 4-digit year",
              value: row.graduation_year
            });
          }

          // If no critical errors for this row, add to valid records
          if (studentId && fullName && !isNaN(rawCgpa) && rawCgpa >= 0 && rawCgpa <= 10) {
            records.push({
              id: `CRED-${institutionName.replace(/\s+/g, "").toUpperCase()}-${gradYear}-${studentId}`,
              studentId,
              fullName,
              degree,
              major,
              graduationYear: gradYear,
              cgpa: rawCgpa,
              cgpaAbove8: rawCgpa >= 8.0,
              institutionName,
              issueDate
            });
          }
        });

        resolve({
          records,
          errors,
          totalRows: results.data.length,
          validRows: records.length
        });
      }
    });
  });
}
