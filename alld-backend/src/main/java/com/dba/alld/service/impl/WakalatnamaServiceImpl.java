package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.entities.Wakalatnama;
import com.dba.alld.repository.WakalatnamaRepository;
import com.dba.alld.request.WakalatnamaGenerateRequest;
import com.dba.alld.response.WakalatnamaListResponse;
import com.dba.alld.service.WakalatnamaService;
import com.dba.alld.utility.Utility;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.data.domain.Pageable;


@Service
public class WakalatnamaServiceImpl implements WakalatnamaService {

    @Autowired
    WakalatnamaRepository wakalatnamaRepository;

    @Autowired
    Utility utility;

    @Override
    public GenericApiResponse<Object> listWakalatnama(Pageable pageable) {
        Page<WakalatnamaListResponse> page = wakalatnamaRepository.findAllProjectedBy(pageable);
        return utility.buildResponse("Fetched wakalatnama list", HttpStatus.OK.value(), page);
    }


    @Override
    public GenericApiResponse<Object> generateWakalatnama(@RequestBody WakalatnamaGenerateRequest wakalatnamaGenerateRequest) {
        Wakalatnama wakalatnama = Wakalatnama
                .builder()
                .orderId(wakalatnamaGenerateRequest.getOrderId())
                .memberId(wakalatnamaGenerateRequest.getMemberId())
                .mobile(wakalatnamaGenerateRequest.getMobile())
                .amount(wakalatnamaGenerateRequest.getAmount())
                .memberAmount(wakalatnamaGenerateRequest.getMemberAmount())
                .paymentStatus(wakalatnamaGenerateRequest.getPaymentStatus())
                .paymentDate(wakalatnamaGenerateRequest.getPaymentDate())
                .status(wakalatnamaGenerateRequest.getStatus())
                .createdDate(wakalatnamaGenerateRequest.getCreatedDate())
                .createdBy(wakalatnamaGenerateRequest.getCreatedBy())
                .updatedDate(wakalatnamaGenerateRequest.getUpdatedDate())
                .updatedBy(wakalatnamaGenerateRequest.getUpdatedBy())
                .isClient(String.valueOf(wakalatnamaGenerateRequest.getIsClient()))
                .build();

        wakalatnamaRepository.save(wakalatnama);
        return utility.buildResponse("Wakalatnama generated", HttpStatus.OK.value(),"");
    }
}
