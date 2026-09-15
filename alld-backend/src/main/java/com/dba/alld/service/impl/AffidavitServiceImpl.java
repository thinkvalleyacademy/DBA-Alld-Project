package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.repository.AffidavitRepository;
import com.dba.alld.service.AffidavitService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AffidavitServiceImpl implements AffidavitService {

    static Logger logger = LoggerFactory.getLogger(AffidavitServiceImpl.class);

    @Autowired
    AffidavitRepository affidavitRepository;

    @Override
    public GenericApiResponse<Object> getAffidavitEntryList() {
        logger.info("Affidavit Entry List..!!");
        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Affidavit entry list fetched Successfully")
                .data(affidavitRepository.findAllProjectedBy())
                .build();
    }
}
