package com.dba.alld.repository;

import com.dba.alld.entities.Purcha;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PurchaRepository extends JpaRepository<Purcha, Integer> {

    // Purcha Credit Records - created by user
    @Query("SELECT p FROM Purcha p WHERE p.status = 'ACTIVE' " +
            "AND p.createdBy = :userId " +
            "AND p.createdDate >= :startDate AND p.createdDate < :endDate")
    List<Purcha> findPurchaCreditRecords(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Purcha Debit Records - updated by user
    @Query("SELECT p FROM Purcha p WHERE p.status = 'ACTIVE' " +
            "AND p.updatedBy = :userId " +
            "AND p.paymentDate >= :startDate AND p.paymentDate < :endDate")
    List<Purcha> findPurchaDebitRecords(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);


    @Query("""
    SELECT 
        CASE 
            WHEN p.createdBy = :userId THEN 'CREDIT'
            WHEN p.updatedBy = :userId AND p.paymentStatus = 'PAID' THEN 'DEBIT'
        END as type,
        COALESCE(SUM(
            CASE 
                WHEN p.createdBy = :userId THEN p.amount
                WHEN p.updatedBy = :userId AND p.paymentStatus = 'PAID' THEN p.memberAmount
            END
        ), 0) as totalAmount,
        COUNT(p) as count
    FROM Purcha p
    WHERE p.status = 'ACTIVE'
      AND (
            (p.createdBy = :userId AND p.createdDate >= :startDate AND p.createdDate < :endDate)
         OR (p.updatedBy = :userId AND p.paymentStatus = 'PAID' AND p.paymentDate >= :startDate AND p.paymentDate < :endDate)
      )
    GROUP BY type
""")
    List<PurchaSummary> findPurchaSummary(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

}
