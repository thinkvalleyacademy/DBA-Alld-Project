package com.dba.alld;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EntityScan(basePackages = "com.dba.alld.entities")
@EnableCaching
public class AlldApplication {

    public static void main(String[] args) {
        SpringApplication.run(AlldApplication.class, args);
    }
}
