package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.entities.Roles;
import com.dba.alld.repository.RolesRepository;
import com.dba.alld.service.RolesServices;
import com.dba.alld.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
public class RolesController {

    static Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    RolesServices services;


    @Autowired
    RolesRepository repository;

    @GetMapping("/list")
    public GenericApiResponse<Object> getList() throws Exception{
        try {
            List<Roles> rolesList = repository.findAll();
            return GenericApiResponse.builder()
                    .message("List fetched successfully")
                    .data(rolesList)
                    .status(HttpStatus.OK.value())
                    .build();
        } catch (Exception e) {
//            throw new RuntimeException(e);
            log.error("Error while fetching the users list : '{}'",e.getMessage());
            return GenericApiResponse.builder()
                    .message("List fetching failed")
//                    .data("")
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .build();
        }

    }

    @GetMapping("/role")
    public ResponseEntity<GenericApiResponse<Object>> getRoleById(
            @RequestParam int id
    ) {
        return ResponseEntity.ok(services.findRoleById(id));
    }

}
