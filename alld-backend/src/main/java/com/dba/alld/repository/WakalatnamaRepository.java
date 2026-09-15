package com.dba.alld.repository;

import com.dba.alld.entities.Wakalatnama;
import com.dba.alld.response.WakalatnamaListResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface WakalatnamaRepository extends JpaRepository<Wakalatnama, Integer> {

    List<WakalatnamaListResponse> findAllProjectedBy();

    @Query("SELECT w FROM Wakalatnama w")
    Page<WakalatnamaListResponse> findAllProjectedBy(Pageable pageable);

    // Wakalatnama Credit Records - created by user
    @Query("SELECT w FROM Wakalatnama w WHERE w.status = 'ACTIVE' " +
            "AND w.createdBy = :userId " +
            "AND w.createdDate >= :startDate AND w.createdDate < :endDate")
    List<Wakalatnama> findWakalatnamaCreditRecords(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Wakalatnama Credit Amount Total
    @Query("SELECT COALESCE(SUM(w.amount), 0) FROM Wakalatnama w WHERE w.status = 'ACTIVE' " +
            "AND w.createdBy = :userId " +
            "AND w.createdDate >= :startDate AND w.createdDate < :endDate")
    BigDecimal findWakalatnamaCreditTotal(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Wakalatnama Debit Records - updated by user
    @Query("SELECT w FROM Wakalatnama w WHERE w.status = 'ACTIVE' " +
            "AND w.updatedBy = :userId " +
            "AND w.paymentDate >= :startDate AND w.paymentDate < :endDate")
    List<Wakalatnama> findWakalatnamaDebitRecords(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // Wakalatnama Debit Amount Total (member_amount where payment_status = PAID)
    @Query("SELECT COALESCE(SUM(w.memberAmount), 0) FROM Wakalatnama w WHERE w.status = 'ACTIVE' " +
            "AND w.updatedBy = :userId " +
            "AND w.paymentStatus = 'PAID' " +
            "AND w.paymentDate >= :startDate AND w.paymentDate < :endDate")
    BigDecimal findWakalatnamaDebitTotal(
            @Param("userId") String userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

}
