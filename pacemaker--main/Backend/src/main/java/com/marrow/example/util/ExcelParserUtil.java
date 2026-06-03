package com.marrow.example.util;

import com.marrow.example.dto.LiveClassImportDto;
import com.marrow.example.dto.MCQImportDto;
import com.marrow.example.dto.VideoImportDto;
import org.apache.poi.ss.usermodel.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class ExcelParserUtil {

    public static List<MCQImportDto> parseMCQExcel(MultipartFile file) throws Exception {
        List<MCQImportDto> dtoList = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            int rowNumber = 0;
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                rowNumber++;
                if (rowNumber == 1) { // Skip header
                    continue;
                }

                MCQImportDto dto = MCQImportDto.builder()
                        .recordNumber(rowNumber)
                        .question(getCellStringValue(currentRow.getCell(0)))
                        .optionA(getCellStringValue(currentRow.getCell(1)))
                        .optionB(getCellStringValue(currentRow.getCell(2)))
                        .optionC(getCellStringValue(currentRow.getCell(3)))
                        .optionD(getCellStringValue(currentRow.getCell(4)))
                        .correctAnswer(getCellStringValue(currentRow.getCell(5)))
                        .explanation(getCellStringValue(currentRow.getCell(6)))
                        .difficulty(getCellStringValue(currentRow.getCell(7)))
                        .subject(getCellStringValue(currentRow.getCell(8)))
                        .topic(getCellStringValue(currentRow.getCell(9)))
                        .build();

                dtoList.add(dto);
            }
        }
        return dtoList;
    }

    public static List<VideoImportDto> parseVideoExcel(MultipartFile file) throws Exception {
        List<VideoImportDto> dtoList = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            int rowNumber = 0;
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                rowNumber++;
                if (rowNumber == 1) {
                    continue;
                }

                String durationStr = getCellStringValue(currentRow.getCell(3));
                Integer duration = 0;
                try {
                    duration = (int) Double.parseDouble(durationStr);
                } catch (NumberFormatException ignored) {}

                VideoImportDto dto = VideoImportDto.builder()
                        .recordNumber(rowNumber)
                        .title(getCellStringValue(currentRow.getCell(0)))
                        .description(getCellStringValue(currentRow.getCell(1)))
                        .videoUrl(getCellStringValue(currentRow.getCell(2)))
                        .duration(duration)
                        .category(getCellStringValue(currentRow.getCell(4)))
                        .build();

                dtoList.add(dto);
            }
        }
        return dtoList;
    }

    public static List<LiveClassImportDto> parseLiveClassExcel(MultipartFile file) throws Exception {
        List<LiveClassImportDto> dtoList = new ArrayList<>();
        try (InputStream is = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            Iterator<Row> rows = sheet.iterator();

            int rowNumber = 0;
            while (rows.hasNext()) {
                Row currentRow = rows.next();
                rowNumber++;
                if (rowNumber == 1) {
                    continue;
                }

                LiveClassImportDto dto = LiveClassImportDto.builder()
                        .recordNumber(rowNumber)
                        .title(getCellStringValue(currentRow.getCell(0)))
                        .trainer(getCellStringValue(currentRow.getCell(1)))
                        .schedule(getCellStringValue(currentRow.getCell(2)))
                        .zoomJoinUrl(getCellStringValue(currentRow.getCell(3)))
                        .topic(getCellStringValue(currentRow.getCell(4)))
                        .description(getCellStringValue(currentRow.getCell(5)))
                        .build();

                dtoList.add(dto);
            }
        }
        return dtoList;
    }

    private static String getCellStringValue(Cell cell) {
        if (cell == null) {
            return "";
        }
        DataFormatter formatter = new DataFormatter();
        return formatter.formatCellValue(cell).trim();
    }
}
