package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.request.WakalatnamaGenerateRequest;
import com.dba.alld.service.WakalatnamaService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/wakalatnama")
public class WakalatnamaController {

    static Logger log = LoggerFactory.getLogger(WakalatnamaController.class);

    @Autowired
    WakalatnamaService wakalatnamaService;

    @GetMapping("/list")
    public ResponseEntity<GenericApiResponse<Object>> listWakalatnama(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy).descending());
        return ResponseEntity.ok(wakalatnamaService.listWakalatnama(pageable));
    }

    @PostMapping("/generate")
    public ResponseEntity<GenericApiResponse<Object>> generateWakalatnama(@RequestBody WakalatnamaGenerateRequest wakalatnamaGenerateRequest) throws Exception {
        log.info("generate wakalatanama request received..!!");
        return ResponseEntity.ok(wakalatnamaService.generateWakalatnama(wakalatnamaGenerateRequest));
    }
}
