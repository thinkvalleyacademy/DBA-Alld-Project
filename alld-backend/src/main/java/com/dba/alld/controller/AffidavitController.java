package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.service.AffidavitService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/v1/affidavit")
public class AffidavitController {

    static Logger log = LoggerFactory.getLogger(AffidavitController.class);

    @Autowired
    AffidavitService affidavitService;

    @GetMapping("/list")
    public ResponseEntity<GenericApiResponse<Object>> listAffidavitEntry() throws Exception {
        log.info("list affidavit entry list..!!");
        return ResponseEntity.ok(affidavitService.getAffidavitEntryList());
    }

}
