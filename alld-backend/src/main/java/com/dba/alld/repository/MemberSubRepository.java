package com.dba.alld.repository;

import com.dba.alld.entities.MembersSubscriptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MemberSubRepository  extends JpaRepository<MembersSubscriptionHistory, Long> {

    List<MembersSubscriptionHistory> findByMemberId(String memberId);

    List<MembersSubscriptionHistory> findByMemberIdOrderByTxnDateDesc(String memberId);

    // Registration Records
    @Query("SELECT m FROM MembersSubscriptionHistory m WHERE m.txnType = 'REGISTRATION' " +
            "AND m.status != 'DELETED' " +
            "AND m.createdBy = :userId " +
            "AND m.txnDate >= :startDate AND m.txnDate < :endDate")
    List<MembersSubscriptionHistory> findRegistrationRecords(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Subscription Records
    @Query("""
    SELECT m 
    FROM MembersSubscriptionHistory m 
    WHERE m.txnType IN ('SUBSCRIPTION', 'RENEWAL')
      AND m.status <> 'DELETED'
      AND m.createdBy = :userId
      AND m.txnDate >= :startDate 
      AND m.txnDate < :endDate
    ORDER BY m.txnDate DESC
""")
    List<MembersSubscriptionHistory> findSubscriptionRecords(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("""
    SELECT m.txnType as txnType,
           COALESCE(SUM(m.amount), 0) as totalAmount,
           COUNT(m) as count
    FROM MembersSubscriptionHistory m
    WHERE m.status <> 'DELETED'
      AND m.createdBy = :userId
      AND m.txnDate >= :startDate
      AND m.txnDate < :endDate
      AND m.txnType IN ('REGISTRATION','SUBSCRIPTION','RENEWAL')
    GROUP BY m.txnType
""")
    List<StaffTxnSummary> findTxnSummary(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);


}


