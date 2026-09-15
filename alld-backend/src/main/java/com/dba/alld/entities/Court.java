package com.dba.alld.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "court")
public class Court {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 60)
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

    @Column(length = 200)
    private String address;

    private Integer pincode;

//    // Many courts belong to one city
//    @ManyToOne
//    @JoinColumn(name = "city_code", referencedColumnName = "id", nullable = false)
//    private CityList city;
//
//    // Affidavits for this court
//    @OneToMany(mappedBy = "court", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<Affidavit> affidavits;
}



