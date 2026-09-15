package com.dba.alld.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sms_credentials")
public class SmsCredentials {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "institute_id", nullable = false)
    private Integer instituteId;

    @Column(name = "is_default", nullable = false, columnDefinition = "TINYINT(1)")
    private Boolean isDefault;

    @Column(nullable = false, length = 20)
    private String name;

    @Column(name = "user_id", nullable = false, length = 45)
    private String userId;

    @Column(nullable = false, length = 45)
    private String password;

    @Column(name = "sender_id", nullable = false, length = 6)
    private String senderId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;
}
