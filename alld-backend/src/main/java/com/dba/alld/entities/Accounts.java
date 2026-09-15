package com.dba.alld.entities;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
public class Accounts {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 45)
    private String name;

    @Column(length = 20, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;

    @Column(name = "ewallet_balance", nullable = false, precision = 10, scale = 2)
    private BigDecimal ewalletBalance = BigDecimal.valueOf(0.0);

//    // Foreign key to employee_account_details
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "employee_id")
//    private EmployeeAccountDetails employee;
}



