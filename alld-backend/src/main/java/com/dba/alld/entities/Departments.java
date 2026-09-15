package com.dba.alld.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "departments")
public class Departments {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; // matches table int

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(length = 20, nullable = false)
    private String status = "ACTIVE";

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy = "system";

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;

//    // One department has many employees
//    @OneToMany(mappedBy = "department", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<EmployeeAccountDetails> employees;

    // getters and setters
}
