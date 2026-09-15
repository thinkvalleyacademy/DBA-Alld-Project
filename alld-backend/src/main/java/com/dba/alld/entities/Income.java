package com.dba.alld.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "income")
public class Income {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false, length = 200)
    private String userId;

    @Column(name = "category_id", nullable = false, length = 200)
    private String categoryId;

    @Column(name = "request_date")
    private LocalDateTime requestDate;

    @Column(name = "details", nullable = false, length = 200)
    private String details;

    @Column(name = "amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "app_rej_by", length = 20)
    private String appRejBy;

    @Column(name = "app_rej_date")
    private LocalDateTime appRejDate;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;

    @Column(name = "order_id", length = 20)
    private String orderId;
}


