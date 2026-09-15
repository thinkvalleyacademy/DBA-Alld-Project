package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;

public interface RolesServices {

        GenericApiResponse<Object> findRoleById(int id);

}
