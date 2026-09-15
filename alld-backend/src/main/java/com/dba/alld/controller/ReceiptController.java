package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.service.ReceiptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * //todo:
 * This will be used to maintain receipt generations
 * 1. keep record every time a new receipt is generated
 * 2. If duplicate receipt is generated keep that record too.
 * */

@RestController
@RequestMapping("/api/v1/receipt")
public class ReceiptController {

    @Autowired
    ReceiptService service ;

    @PostMapping("/list")
    public ResponseEntity<GenericApiResponse<Object>> listReceipt(
            @RequestParam String memberId
    ){
        return  ResponseEntity.ok(service.getList(memberId));
    }

    @PostMapping("/print")
    public ResponseEntity<GenericApiResponse<Object>> printReceipt(
            @RequestParam String memberId,
            @RequestParam String userId
    ){
        return  ResponseEntity.ok(service.printReceipt(memberId, userId));
    }



}
