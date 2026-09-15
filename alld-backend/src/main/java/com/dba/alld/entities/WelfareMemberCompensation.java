package com.dba.alld.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "welfare_member_compensation")
@Data
@SuperBuilder
@NoArgsConstructor
public class WelfareMemberCompensation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "compensation_id", nullable = false, unique = true, length = 30)
    private String compensationId;

    // 🔗 FK → members.id (BIGINT UNSIGNED)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private Members member;

    @Column(name = "amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "compensation_date", nullable = false)
    private LocalDate compensationDate;

    @Column(name = "description", length = 500)
    private String description;

    // 🔗 FK → users.id (INT)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private Users createdBy;

    @Column(name = "created_date", nullable = false)
    private LocalDateTime createdDate;
}
