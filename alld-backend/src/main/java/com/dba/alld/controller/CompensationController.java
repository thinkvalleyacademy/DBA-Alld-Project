package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.request.WelfareMemberCompensationRequest;
import com.dba.alld.service.CompensationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/compensation")
public class CompensationController {


    static Logger log = LoggerFactory.getLogger(CompensationService.class);

    @Autowired
    CompensationService service;

    @PostMapping("/entry")
    public ResponseEntity<GenericApiResponse<Object>> addEntry(
            @RequestBody WelfareMemberCompensationRequest request,
            @RequestHeader("X-USER-ID") String userId

    ) {
        try {

            return ResponseEntity.ok(service.addCompensation(request,userId ));
        } catch (Exception e) {
            log.error("Error while creating entry in compensation  : '{}'",e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(GenericApiResponse.builder()
                            .message("Internal Server Error")
                            .data(null)
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .build());
        }
    }

    @PostMapping("/list")
    public ResponseEntity<GenericApiResponse<Object>> listCompensation(){
        try{
            return ResponseEntity.ok(service.compensationList());

        } catch (Exception e) {
            log.error("Error while fetching the compensation list : '{}'",e.getMessage());

            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(GenericApiResponse.builder()
                            .message("List fetching failed")
                            .data(null)
                            .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                            .build());

        }
    }

    @PostMapping("/entryDetails")
    public ResponseEntity<GenericApiResponse<Object>> entryDetails(
            @RequestParam String id
    ){
        return ResponseEntity.ok(service.compensationEntry(id));
    }

    @PostMapping("/memberDetails")
    public  ResponseEntity<GenericApiResponse<Object>> memberDetails(@RequestParam String id){
        return  ResponseEntity.ok(service.compensationEntryByMemberId(id));
    }


}
