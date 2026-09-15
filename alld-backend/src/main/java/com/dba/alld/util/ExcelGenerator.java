package com.dba.alld.util;

import com.dba.alld.dto.MemberExportDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellUtil;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Utility class for generating Excel files using Apache POI with streaming
 * Optimized for large datasets to prevent OutOfMemory errors
 */
@Component
public class ExcelGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd-MM-yyyy");

    /**
     * Generate Excel file in streaming mode for memory efficiency
     * @param members List of member data to export
     * @param sheetName Name of the Excel sheet
     * @return byte array containing the Excel file
     * @throws IOException if file generation fails
     */
    public byte[] generateMemberExcel(List<MemberExportDTO> members, String sheetName) throws IOException {
        // Use SXSSFWorkbook for streaming - keeps only 100 rows in memory at a time
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100)) {
            Sheet sheet = workbook.createSheet(sheetName);

            // Create header style
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle dateStyle = createDateStyle(workbook);

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "Sr No.", "Member ID", "Name", "Father Name", "COP No.", "Enrollment No.",
                "Reg. Type", "Address", "City", "Mobile No.",
                "Date of Membership", "Subscription", "Voter"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Write data rows
            int rowNum = 1;
            for (MemberExportDTO member : members) {
                Row row = sheet.createRow(rowNum++);

                createCell(row, 0, member.getSrNo(), dataStyle);
                createCell(row, 1, member.getMemberId(), dataStyle);
                createCell(row, 2, member.getName(), dataStyle);
                createCell(row, 3, member.getFatherName(), dataStyle);
                createCell(row, 4, member.getCopNo(), dataStyle);
                createCell(row, 5, member.getEnrollmentNo(), dataStyle);
                createCell(row, 6, member.getRegType(), dataStyle);
                createCell(row, 7, member.getAddress(), dataStyle);
                createCell(row, 8, member.getCity(), dataStyle);
                createCell(row, 9, member.getMobile(), dataStyle);

                // Date cells with formatting
                createDateCell(row, 10, member.getMembershipDate(), dateStyle);
                createDateCell(row, 11, member.getSubscription(), dateStyle);

                createCell(row, 12, member.getVoter(), dataStyle);
            }

            // Auto-size columns (can be expensive for large datasets, so we set specific widths)
            setColumnWidths(sheet);

            // Freeze header row
            sheet.createFreezePane(0, 1);

            // Write to byte array
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                workbook.write(outputStream);
                return outputStream.toByteArray();
            }
        }
    }

    private CellStyle createHeaderStyle(SXSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createDataStyle(SXSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        return style;
    }

    private CellStyle createDateStyle(SXSSFWorkbook workbook) {
        CellStyle style = createDataStyle(workbook);
        DataFormat format = workbook.createDataFormat();
        style.setDataFormat(format.getFormat("dd-mm-yyyy"));
        return style;
    }

    private void createCell(Row row, int column, Object value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value instanceof String) {
            cell.setCellValue((String) value);
        } else if (value instanceof Integer) {
            cell.setCellValue((Integer) value);
        } else if (value != null) {
            cell.setCellValue(value.toString());
        }
        cell.setCellStyle(style);
    }

    private void createDateCell(Row row, int column, java.time.LocalDate date, CellStyle style) {
        Cell cell = row.createCell(column);
        if (date != null) {
            cell.setCellValue(java.sql.Date.valueOf(date));
            cell.setCellStyle(style);
        } else {
            cell.setCellStyle(style);
        }
    }

    private void setColumnWidths(Sheet sheet) {
        int[] columnWidths = {8, 18, 30, 25, 18, 18, 18, 40, 20, 15, 15, 15, 12};
        for (int i = 0; i < columnWidths.length; i++) {
            sheet.setColumnWidth(i, columnWidths[i] * 256);
        }
    }
}
