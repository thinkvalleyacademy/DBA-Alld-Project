package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.request.StaffCollectionReportRequest;

public interface StaffCollectionReportService {

    GenericApiResponse<Object> getStaffCollectionReport(StaffCollectionReportRequest request);

    GenericApiResponse<Object> getActiveUsers();

}
