package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.StaffCollectionReportResponse;
import com.dba.alld.entities.MembersSubscriptionHistory;
import com.dba.alld.entities.Purcha;
import com.dba.alld.entities.Users;
import com.dba.alld.repository.*;
import com.dba.alld.request.StaffCollectionReportRequest;
import com.dba.alld.service.StaffCollectionReportService;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Log4j2
public class StaffCollectionReportServiceImpl implements StaffCollectionReportService {

    @Autowired
    private MemberSubRepository memberSubRepository;

    @Autowired
    private PurchaRepository purchaRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Override
    public GenericApiResponse<Object> getStaffCollectionReport(StaffCollectionReportRequest request) {

        String userId = request.getUserId();
        log.info("[AUDIT] action=STAFF_COLLECTION_REPORT_REQUEST userId={} startDate={} endDate={}",
                userId, request.getStartDate(), request.getEndDate());

        // Convert LocalDate to LocalDateTime (full day range)
        LocalDateTime startDateTime = request.getStartDate().atStartOfDay();
        LocalDateTime endDateTime = request.getEndDate()
                .plusDays(1)
                .atStartOfDay();

    /* =========================================================
       1️⃣ FETCH RECORD LISTS (Still Needed For UI Display)
       ========================================================= */

        List<MembersSubscriptionHistory> registrationRecords =
                memberSubRepository.findRegistrationRecords(userId, startDateTime, endDateTime);

        List<MembersSubscriptionHistory> subscriptionRecords =
                memberSubRepository.findSubscriptionRecords(userId, startDateTime, endDateTime);

        List<Purcha> purchaCreditRecords =
                purchaRepository.findPurchaCreditRecords(userId, startDateTime, endDateTime);

        List<Purcha> purchaDebitRecords =
                purchaRepository.findPurchaDebitRecords(userId, startDateTime, endDateTime);


    /* =========================================================
       2️⃣ FETCH GROUPED SUMMARY (OPTIMIZED — 2 QUERIES ONLY)
       ========================================================= */

        List<StaffTxnSummary> txnSummary =
                memberSubRepository.findTxnSummary(userId, startDateTime, endDateTime);

        BigDecimal registrationTotal = BigDecimal.ZERO;
        BigDecimal subscriptionTotal = BigDecimal.ZERO;
        long registrationCount = 0;
        long subscriptionCount = 0;

        for (StaffTxnSummary summary : txnSummary) {

            if ("REGISTRATION".equals(summary.getTxnType())) {
                registrationTotal = summary.getTotalAmount();
                registrationCount = summary.getCount();
            }

            if ("SUBSCRIPTION".equals(summary.getTxnType())
                    || "RENEWAL".equals(summary.getTxnType())) {

                subscriptionTotal = subscriptionTotal.add(summary.getTotalAmount());
                subscriptionCount += summary.getCount();
            }
        }

        List<PurchaSummary> purchaSummary =
                purchaRepository.findPurchaSummary(userId, startDateTime, endDateTime);

        BigDecimal purchaCreditTotal = BigDecimal.ZERO;
        BigDecimal purchaDebitTotal = BigDecimal.ZERO;
        long purchaCreditCount = 0;
        long purchaDebitCount = 0;

        for (PurchaSummary summary : purchaSummary) {

            if ("CREDIT".equals(summary.getType())) {
                purchaCreditTotal = summary.getTotalAmount();
                purchaCreditCount = summary.getCount();
            }

            if ("DEBIT".equals(summary.getType())) {
                purchaDebitTotal = summary.getTotalAmount();
                purchaDebitCount = summary.getCount();
            }
        }

    /* =========================================================
       3️⃣ GRAND TOTAL CALCULATION
       ========================================================= */

        BigDecimal creditTotal = registrationTotal
                .add(subscriptionTotal)
                .add(purchaCreditTotal);

        BigDecimal grandTotal = creditTotal.subtract(purchaDebitTotal);


    /* =========================================================
       4️⃣ BUILD RESPONSE
       ========================================================= */

        StaffCollectionReportResponse response = StaffCollectionReportResponse.builder()
                .registrationRecords(registrationRecords)
                .registrationTotal(registrationTotal)
                .registrationCount(registrationCount)

                .subscriptionRecords(subscriptionRecords)
                .subscriptionTotal(subscriptionTotal)
                .subscriptionCount(subscriptionCount)

                .purchaCreditRecords(purchaCreditRecords)
                .purchaCreditTotal(purchaCreditTotal)
                .purchaCreditCount(purchaCreditCount)

                .purchaDebitRecords(purchaDebitRecords)
                .purchaDebitTotal(purchaDebitTotal)
                .purchaDebitCount(purchaDebitCount)

                .grandTotal(grandTotal)
                .build();
        log.info("[AUDIT] action=STAFF_COLLECTION_REPORT_SUCCESS userId={} registrationCount={} subscriptionCount={} purchaCreditCount={} purchaDebitCount={} grandTotal={}",
                userId,
                registrationCount,
                subscriptionCount,
                purchaCreditCount,
                purchaDebitCount,
                grandTotal);

        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Staff Collection Report")
                .data(response)
                .build();
    }


    @Override
    public GenericApiResponse<Object> getActiveUsers() {
        List<Users> activeUsers = usersRepository.findByStatus("ACTIVE");

        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Active Users List")
                .data(activeUsers)
                .build();
    }

}
