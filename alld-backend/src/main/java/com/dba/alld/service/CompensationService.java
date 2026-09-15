package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.request.WelfareMemberCompensationRequest;

public interface CompensationService {

    GenericApiResponse<Object> addCompensation(WelfareMemberCompensationRequest request,
                                               String createdByUserId);

    GenericApiResponse<Object> compensationList();

    GenericApiResponse<Object> compensationEntry(String id);

    GenericApiResponse<Object> compensationEntryByMemberId(String memberId);
}
