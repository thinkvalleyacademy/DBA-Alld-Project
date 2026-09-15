package com.dba.alld.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "employee_nominee_details")
public class EmployeeNomineeDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "company_id", nullable = false, length = 20)
    private String companyId;

    @Column(name = "emp_code", nullable = false, length = 20)
    private String empCode;

    @Column(name = "name", nullable = false, length = 60)
    private String name;

    @Column(name = "gender", length = 20)
    private String gender;

    @Column(name = "relation", length = 60)
    private String relation;

    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "created_by", length = 60)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 60)
    private String updatedBy;
}

