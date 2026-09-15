package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.utility.Utility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cache")
public class CacheController {

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private Utility utility;

    @PostMapping("/clear")
    public ResponseEntity<GenericApiResponse<Object>> clearCache(
            @RequestParam(value = "name", required = false) String name
    ) {
        if (name == null || name.isBlank()) {
            for (String cacheName : cacheManager.getCacheNames()) {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                }
            }
            return ResponseEntity.ok(
                    utility.buildResponse("All caches cleared", HttpStatus.OK.value(), null)
            );
        }

        Cache cache = cacheManager.getCache(name);
        if (cache == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(utility.buildResponse("Cache not found: " + name, HttpStatus.NOT_FOUND.value(), null));
        }

        cache.clear();
        return ResponseEntity.ok(
                utility.buildResponse("Cache cleared: " + name, HttpStatus.OK.value(), null)
        );
    }
}
