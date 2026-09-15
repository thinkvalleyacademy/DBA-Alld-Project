package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.request.StaffCollectionReportRequest;
import com.dba.alld.service.StaffCollectionReportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/report")
public class StaffCollectionReportController {

    private static final Logger log = LoggerFactory.getLogger(StaffCollectionReportController.class);

    @Autowired
    private StaffCollectionReportService staffCollectionReportService;

    @PostMapping("/staff-collection")
    public ResponseEntity<GenericApiResponse<Object>> getStaffCollectionReport(
            @RequestBody StaffCollectionReportRequest request
    ) {
        try {
            return ResponseEntity.ok(staffCollectionReportService.getStaffCollectionReport(request));
        } catch (Exception e) {
            log.error("Error while generating staff collection report: '{}'", e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(GenericApiResponse.builder()
                            .message("Failed to generate staff collection report")
                            .data(null)
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .build());
        }
    }

    @GetMapping("/staff-list")
    public ResponseEntity<GenericApiResponse<Object>> getStaffList() {
        try {
            return ResponseEntity.ok(staffCollectionReportService.getActiveUsers());
        } catch (Exception e) {
            log.error("Error while fetching staff list: '{}'", e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(GenericApiResponse.builder()
                            .message("Failed to fetch staff list")
                            .data(null)
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .build());
        }
    }

}
