package com.dba.alld.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sms_txn_history")
public class SmsTxnHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "institute_id")
    private Integer instituteId;

    @Column(name = "message_text", nullable = false, columnDefinition = "TEXT")
    private String messageText;

    @Column(name = "mobile_no", nullable = false, columnDefinition = "BLOB")
    private byte[] mobileNo;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "message_id", length = 45)
    private String messageId;

    @Column(name = "sent_status", length = 200)
    private String sentStatus;

    @Column(name = "retry_count", nullable = false)
    private Integer retryCount;

    @Column(name = "message_type", nullable = false, length = 20)
    private String messageType;

    @Column(name = "sent_type", nullable = false, length = 20)
    private String sentType;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "updated_date")
    private LocalDateTime updatedDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;

    @Column(name = "sent_date")
    private LocalDateTime sentDate;

    @Column(name = "sent_to", columnDefinition = "BLOB")
    private byte[] sentTo;
}


