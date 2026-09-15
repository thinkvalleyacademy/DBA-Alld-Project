package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.entities.Members;
import com.dba.alld.entities.MembersSubscriptionHistory;
import com.dba.alld.entities.Receipt;
import com.dba.alld.repository.MemberSubRepository;
import com.dba.alld.repository.MembersRepository;
import com.dba.alld.repository.ReceiptRepository;
import com.dba.alld.service.ReceiptService;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Log4j2
public class ReceiptServiceImpl implements ReceiptService {

    @Autowired
    MembersRepository repository;

    @Autowired
    ReceiptRepository receiptRepository;

    @Autowired
    MemberSubRepository memberSubRepository;

    @Override
    public GenericApiResponse<Object> getList(String memberId) {

        String numericMemberId = memberId
                .replaceAll("[^0-9]", "")
                .replaceFirst("^0+(?!$)", "");

        Optional<Members> member = repository.findByMemberId(memberId);

        List<MembersSubscriptionHistory> receipts =
                memberSubRepository.findByMemberIdOrderByTxnDateDesc(numericMemberId);

        Map<String, Object> response = new HashMap<>();
        response.put("member", member.orElse(null));
        response.put("receipts", receipts); // LIST now

        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Member details with receipt history")
                .data(response)
                .build();
    }


    @Override
    public GenericApiResponse<Object> printReceipt(String memberId, String userId) {
        Receipt receipt =  Receipt.builder()
                .userId(userId)
                .memberId(memberId)
                .printedAt(LocalDateTime.now()).build();

        receiptRepository.save(receipt);
        log.info("[AUDIT] action=RECEIPT_GENERATED memberId={} actor={} receiptId={} printedAt={}",
                memberId, userId, receipt.getId(), receipt.getPrintedAt());
        return GenericApiResponse.builder().status(HttpStatus.OK.value()).
                message("Receipt History added").
                data(receipt)
                .build();
    }







}
