package com.dba.alld.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@SuperBuilder
@Table(name = "wakalatnama")
@NoArgsConstructor
@Data
public class Wakalatnama {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "order_id", nullable = false, length = 45)
    private String orderId;

    @Column(name = "member_id", length = 45)
    private String memberId;

    @Column(length = 150)
    private String name;

    @Column(length = 20)
    private String mobile;

    @Column(nullable = false, precision = 10, scale = 0)
    private BigDecimal amount;

    @Column(name = "member_amount", nullable = false, precision = 10, scale = 0)
    private BigDecimal memberAmount;

    @Column(name = "payment_status", length = 20)
    private String paymentStatus;

    @Column(name = "payment_date")
    private LocalDateTime paymentDate;

    @Column(nullable = false, length = 45)
    private String status;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "created_by", length = 45)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 45)
    private String updatedBy;

    @Column(name = "is_client", nullable = false, length = 45)
    private String isClient;

}
