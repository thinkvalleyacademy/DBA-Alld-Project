package com.dba.alld.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "menu_detail")
public class MenuDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 45)
    private String name;

    @Column(length = 45)
    private String url;

    @Column(name = "menu_order")
    private Double menuOrder;

    @Column(nullable = false, length = 45)
    private String status;

    @Column(name = "parent_id", nullable = false, length = 45)
    private String parentId;

    @Column(length = 200)
    private String icon;

    @Column(length = 200)
    private String title;

    @Column(name = "resp_url", length = 200)
    private String respUrl;

    @Column(length = 45)
    private String type;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;
}

