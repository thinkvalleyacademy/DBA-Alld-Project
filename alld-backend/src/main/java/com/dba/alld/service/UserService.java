package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.request.LoginRequest;
import com.dba.alld.request.ResetPasswordRequest;
import com.dba.alld.request.UserRegisterRequest;
import org.jspecify.annotations.Nullable;

public interface UserService {

    @Nullable
    GenericApiResponse<Object> userRegistration(UserRegisterRequest registrationRequest);

    @Nullable
    GenericApiResponse<Object> userLogin(LoginRequest loginRequest);

    @Nullable
    GenericApiResponse<Object> userList();

    @Nullable
    GenericApiResponse<Object> resetPassword(ResetPasswordRequest resetPasswordRequest);
}
