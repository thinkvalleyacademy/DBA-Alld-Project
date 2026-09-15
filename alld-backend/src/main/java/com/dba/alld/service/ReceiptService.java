package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;
import jakarta.annotation.Nullable;

public interface ReceiptService {

    GenericApiResponse<Object> getList(String memberId);

    GenericApiResponse<Object> printReceipt(String memberId, String userId);

}
