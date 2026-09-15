package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.request.WakalatnamaGenerateRequest;
import org.springframework.data.domain.Pageable;

public interface WakalatnamaService {
    GenericApiResponse<Object> listWakalatnama(Pageable pageable);
    GenericApiResponse<Object> generateWakalatnama(WakalatnamaGenerateRequest wakalatnamaGenerateRequest);
}
