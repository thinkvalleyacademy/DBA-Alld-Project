package com.dba.alld.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "affidavit")
public class Affidavit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "affidavit_no", nullable = false, length = 45)
    private String affidavitNo;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 10)
    private String mobile;

    @Column(length = 200)
    private String address;

    @Column(name = "member_id", length = 45)
    private String memberId;

    @Column(name = "is_registered_advocate", nullable = false, length = 45)
    private String isRegisteredAdvocate;

    @Column(name = "advocate_name", nullable = false, length = 200)
    private String advocateName;

    @Column(name = "advocate_mobile", nullable = false, length = 10)
    private String advocateMobile;

    @Column(name = "coupon_no", length = 45)
    private String couponNo;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "txn_desc", length = 200)
    private String txnDesc;

    @Column(nullable = false, length = 45)
    private String status = "ACTIVE";

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 45)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 45)
    private String updatedBy;

    @Column(name = "order_id", nullable = false, length = 45)
    private String orderId;

    // Many affidavits belong to one court
//    @ManyToOne
//    @JoinColumn(name = "court_id", referencedColumnName = "id", nullable = false)
//    private Court court;

//    // Optional: Many affidavits belong to one city
//    @ManyToOne
//    @JoinColumn(name = "city_id", referencedColumnName = "id")
//    private CityList city;
}


