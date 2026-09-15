package com.dba.alld.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "employee_account_details")
public class EmployeeAccountDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "company_id", nullable = false, length = 20)
    private String companyId;

    @Column(name = "emp_code", nullable = false, length = 20)
    private String empCode;

    @Column(name = "bank_name", nullable = false, length = 60)
    private String bankName;

    @Column(name = "branch_name", length = 20)
    private String branchName;

    @Column(name = "account_no", nullable = false, length = 60)
    private String accountNo;

    @Column(name = "ifsc_code", nullable = false, length = 60)
    private String ifscCode;

    @Column(name = "name_in_bank", length = 60)
    private String nameInBank;

    @Column(length = 20, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "created_by", length = 60)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 60)
    private String updatedBy;

//    // Relationship with Accounts
//    @OneToMany(mappedBy = "employee", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<Accounts> accounts;

    // getters and setters
}



