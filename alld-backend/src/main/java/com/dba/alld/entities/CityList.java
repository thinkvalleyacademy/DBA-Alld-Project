package com.dba.alld.entities;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "city_list")
public class CityList {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "statename", nullable = false)
    private String statename;

    @Column(nullable = false)
    private String country = "India";

    @Column(nullable = false)
    private String continent = "Asia";

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "created_date", nullable = false, columnDefinition = "datetime default CURRENT_TIMESTAMP")
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;

//    // Courts in this city
//    @OneToMany(mappedBy = "city", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<Court> courts;
//
//    // Optional: Affidavits directly linked to city (if needed)
//    @OneToMany(mappedBy = "city", cascade = CascadeType.ALL, orphanRemoval = true)
//    private List<Affidavit> affidavits;
}

