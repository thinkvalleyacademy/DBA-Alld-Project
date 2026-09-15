package com.dba.alld.controller;


import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.service.VoterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/voter")
public class VoterController {

    @Autowired
    VoterService service ;

    @GetMapping("/LMList")
    public ResponseEntity<GenericApiResponse<Object>> listLM(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.listGMMember(page, size));
    }

    @GetMapping("/gm")
    public ResponseEntity<GenericApiResponse<Object>> listGmVotersByMonthYear(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.listGmVotersByMonthYear(year, month, page, size));
    }

    @GetMapping("/lm")
    public ResponseEntity<GenericApiResponse<Object>> listLmVotersByMonthYear(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.listLmVotersByMonthYear(year, month, page, size));
    }

    @GetMapping("/gm/search")
    public ResponseEntity<GenericApiResponse<Object>> searchGmVoters(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.searchGmVotersByMonthYear(year, month, query, page, size));
    }

    @GetMapping("/lm/search")
    public ResponseEntity<GenericApiResponse<Object>> searchLmVoters(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        // Note: This endpoint doesn't filter by date. Use /lm/search/by-month-year for date-aware search.
        return ResponseEntity.ok(service.searchLmVoters(query, page, size));
    }

    @GetMapping("/lm/search/by-month-year")
    public ResponseEntity<GenericApiResponse<Object>> searchLmVotersByMonthYear(
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.searchLmVotersByMonthYear(year, month, query, page, size));
    }

}
