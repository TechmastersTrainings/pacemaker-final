package com.marrow.example.util;

import com.marrow.example.dto.LiveClassImportDto;
import com.marrow.example.dto.MCQImportDto;
import com.marrow.example.dto.VideoImportDto;
import com.opencsv.CSVReader;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;

public class CsvParserUtil {

    public static List<MCQImportDto> parseMCQCsv(MultipartFile file) throws Exception {
        List<MCQImportDto> dtoList = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream());
             CSVReader csvReader = new CSVReader(reader)) {

            List<String[]> rows = csvReader.readAll();
            int recordNum = 0;
            for (String[] row : rows) {
                recordNum++;
                if (recordNum == 1) { // skip header
                    continue;
                }
                if (row.length < 10) continue;

                MCQImportDto dto = MCQImportDto.builder()
                        .recordNumber(recordNum)
                        .question(row[0].trim())
                        .optionA(row[1].trim())
                        .optionB(row[2].trim())
                        .optionC(row[3].trim())
                        .optionD(row[4].trim())
                        .correctAnswer(row[5].trim())
                        .explanation(row[6].trim())
                        .difficulty(row[7].trim())
                        .subject(row[8].trim())
                        .topic(row[9].trim())
                        .build();

                dtoList.add(dto);
            }
        }
        return dtoList;
    }

    public static List<VideoImportDto> parseVideoCsv(MultipartFile file) throws Exception {
        List<VideoImportDto> dtoList = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream());
             CSVReader csvReader = new CSVReader(reader)) {

            List<String[]> rows = csvReader.readAll();
            int recordNum = 0;
            for (String[] row : rows) {
                recordNum++;
                if (recordNum == 1) continue;
                if (row.length < 5) continue;

                Integer duration = 0;
                try {
                    duration = (int) Double.parseDouble(row[3].trim());
                } catch (NumberFormatException ignored) {}

                VideoImportDto dto = VideoImportDto.builder()
                        .recordNumber(recordNum)
                        .title(row[0].trim())
                        .description(row[1].trim())
                        .videoUrl(row[2].trim())
                        .duration(duration)
                        .category(row[4].trim())
                        .build();

                dtoList.add(dto);
            }
        }
        return dtoList;
    }

    public static List<LiveClassImportDto> parseLiveClassCsv(MultipartFile file) throws Exception {
        List<LiveClassImportDto> dtoList = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream());
             CSVReader csvReader = new CSVReader(reader)) {

            List<String[]> rows = csvReader.readAll();
            int recordNum = 0;
            for (String[] row : rows) {
                recordNum++;
                if (recordNum == 1) continue;
                if (row.length < 6) continue;

                LiveClassImportDto dto = LiveClassImportDto.builder()
                        .recordNumber(recordNum)
                        .title(row[0].trim())
                        .trainer(row[1].trim())
                        .schedule(row[2].trim())
                        .zoomJoinUrl(row[3].trim())
                        .topic(row[4].trim())
                        .description(row[5].trim())
                        .build();

                dtoList.add(dto);
            }
        }
        return dtoList;
    }
}
