package com.dba.alld.dto;

import com.dba.alld.entities.MembersSubscriptionHistory;
import com.dba.alld.entities.Purcha;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffCollectionReportResponse {

    // Registration data
    private List<MembersSubscriptionHistory> registrationRecords;
    private BigDecimal registrationTotal;
    private long registrationCount;

    // Subscription data
    private List<MembersSubscriptionHistory> subscriptionRecords;
    private BigDecimal subscriptionTotal;
    private long subscriptionCount;

    // Purcha Credit data
    private List<Purcha> purchaCreditRecords;
    private BigDecimal purchaCreditTotal;
    private long purchaCreditCount;

    // Purcha Debit data
    private List<Purcha> purchaDebitRecords;
    private BigDecimal purchaDebitTotal;
    private long purchaDebitCount;

    // Grand total: (registration + subscription + purcha_credit) - (purcha_debit)
    private BigDecimal grandTotal;

}
