package com.dba.alld.entities;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Table(name = "receipt")
@SuperBuilder
@Data
@Entity
@NoArgsConstructor
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "member_id", nullable = false, length = 20)
    private String memberId;


    @Column(name = "printed_At")
    private LocalDateTime printedAt;

    @Column(name = "user_id")
    private String userId;



}
