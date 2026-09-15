package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;
import org.springframework.stereotype.Service;


public interface AffidavitService {

    GenericApiResponse<Object> getAffidavitEntryList();
}
