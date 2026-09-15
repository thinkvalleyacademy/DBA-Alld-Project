package com.dba.alld.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "employees")
public class Employees {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "company_id", nullable = false, length = 20)
    private String companyId;

    @Column(name = "designation_id", nullable = false, length = 20)
    private String designationId;

    @Column(name = "emp_code", nullable = false, length = 20)
    private String empCode;

    @Column(name = "reg_date", nullable = false)
    private LocalDateTime regDate;

    @Column(name = "joining_date", nullable = false)
    private LocalDateTime joiningDate;

    @Column(name = "name_title", length = 60)
    private String nameTitle;

    @Column(name = "name", nullable = false, length = 60)
    private String name;

    @Column(name = "father_title", length = 60)
    private String fatherTitle;

    @Column(name = "father_name", length = 60)
    private String fatherName;

    @Column(length = 20)
    private String gender;

    @Column
    private LocalDate dob;

    @Column(length = 50)
    private String age;

    @Column(name = "is_married", length = 20)
    private String isMarried;

    @Column(length = 200)
    private String qualification;

    @Column(name = "pan_no", length = 20)
    private String panNo;

    @Column(name = "adhar_no", length = 20)
    private String adharNo;

    @Column(name = "pf_no", length = 20)
    private String pfNo;

    @Column(name = "esic_no", length = 20)
    private String esicNo;

    @Column(length = 100)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String img;

    @Column(length = 200)
    private String address;

    @Column(name = "city_code", length = 60)
    private String cityCode;

    @Column(length = 6)
    private String pincode;

    @Column(length = 20)
    private String mobile;

    @Column(name = "email_id", length = 60)
    private String emailId;

    @Column(name = "wage_rate", precision = 10, scale = 2)
    private BigDecimal wageRate;

    @Column(name = "wage_period", length = 50)
    private String wagePeriod;

    @Column(name = "basic_salary", precision = 10, scale = 2)
    private BigDecimal basicSalary;

    @Column(precision = 10, scale = 2)
    private BigDecimal hra;

    @Column(precision = 10, scale = 2)
    private BigDecimal conveyance;

    @Column(name = "tenure_of_employment", length = 50)
    private String tenureOfEmployment;

    @Column(name = "termination_date")
    private LocalDate terminationDate;

    @Column(name = "termination_reason", length = 100)
    private String terminationReason;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "kyc_status", nullable = false, length = 20)
    private String kycStatus;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "created_by", length = 60)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 60)
    private String updatedBy;
}


