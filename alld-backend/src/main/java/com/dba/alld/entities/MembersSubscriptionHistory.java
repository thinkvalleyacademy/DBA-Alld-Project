package com.dba.alld.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalDate;

@Entity
@Table(name = "members_subscription_history")
@SuperBuilder
@Data
@NoArgsConstructor
public class MembersSubscriptionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false, length = 20)
    private String memberId;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "txn_type", nullable = false, length = 20)
    private String txnType;

    @Column(name = "txn_date", nullable = false)
    private LocalDateTime txnDate;

    @Column(name = "no_of_month", nullable = false)
    private Integer noOfMonth;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

}


