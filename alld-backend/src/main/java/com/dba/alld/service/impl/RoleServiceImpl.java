package com.dba.alld.service.impl;


import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.entities.Roles;
import com.dba.alld.repository.RolesRepository;
import com.dba.alld.service.RolesServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RoleServiceImpl implements RolesServices {

    @Autowired
    RolesRepository repository;

    @Override
    public GenericApiResponse<Object> findRoleById(int id) {

        Optional<Roles> role = repository.findById(id);
        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Here is the role info")
                .data(role)
                .build();

    }


}
