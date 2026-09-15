package com.dba.alld.repository;

import com.dba.alld.entities.Members;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MembersRepository extends JpaRepository<Members, Long> {

    @Query("""
    SELECT m
    FROM Members m
    WHERE (
        LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.guardianName) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.memberId) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.registrationNo) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.enNo) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.mobile) LIKE LOWER(CONCAT('%', :query, '%')))
    AND m.status <> 'DELETED'
    AND (
        (:type = 1 AND m.gmLmMemberType = 1)
        OR (:type = 2 AND m.gmLmMemberType = 2)
        OR (:type IS NULL)
    )
""")
    List<Members> searchMembers(
            @Param("query") String query,
            @Param("type") Integer type
    );



    @Query("""
    SELECT m
    FROM Members m
    WHERE (
       LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.guardianName) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.memberId) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.registrationNo) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.enNo) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.mobile) LIKE LOWER(CONCAT('%', :query, '%'))
    )
    AND m.status <> 'DELETED'
    AND m.gmLmMemberType IN (1, 2)
""")
    List<Members> searchMembersByTypes(@Param("query") String query, List<Integer> types);

    // Optimized query for welfare member list download - fetches only required fields
    @Query("""
    SELECT
        m.memberId AS memberId,
        m.name AS name,
        m.guardianName AS guardianName,
        m.registrationNo AS registrationNo,
        m.enNo AS enNo,
        m.address AS address,
        m.expiryDate AS expiryDate,
        m.mobile AS mobile,
        m.photo AS photo,
        m.isWm AS isWm
    FROM Members m
    WHERE m.isWm = true
    ORDER BY m.name ASC
""")
    List<WelfareMemberSummary> findWelfareMembersByType(@Param("memberType") Integer memberType);


    Optional<Members> findByMemberId(String memberId);

    Optional<Members> findByMemberIdAndStatusNot(String memberId, String status);

    @Query("""
    SELECT
        m.name AS name,
        m.memberId AS memberId,
        m.guardianName AS guardianName,
        m.gmLmMemberType AS gmLmMemberType,
        m.registrationType AS registrationType,
        m.registrationNo AS registrationNo,
        m.enNo AS enNo,
        m.ksAddress AS ksAddress,
        m.address AS address,
        m.city AS city,
        m.expiryDate AS expiryDate,
        m.status AS status,
        m.mobile AS mobile,
        m.photo AS photo,
        m.isWm AS isWm,
        m.voter AS voter,
        m.membershipDate AS membershipDate,
        m.updatedBy AS updatedBy
    FROM Members m
    WHERE (
        (:memberType = 1 AND m.gmLmMemberType = 1)
        OR (:memberType = 2 AND m.gmLmMemberType = 2)
        OR (:memberType IS NULL)
    )
    AND m.status <> 'DELETED'
    AND (
        :query IS NULL
        OR TRIM(:query) = ''
        OR LOWER(m.memberId) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.mobile) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%'))
        OR LOWER(m.registrationNo) LIKE LOWER(CONCAT('%', :query, '%'))
    )
""")
    Page<MemberSummary> findAllMemberSummaries(
            @Param("memberType") Integer memberType,
            @Param("query") String query,
            Pageable pageable
    );

    /**
     * Stream all member summaries for export - no pagination
     * Uses fetch join for better performance
     */
    @Query("""
    SELECT
        m.name AS name,
        m.memberId AS memberId,
        m.guardianName AS guardianName,
        m.gmLmMemberType AS gmLmMemberType,
        m.registrationType AS registrationType,
        m.registrationNo AS registrationNo,
        m.enNo AS enNo,
        m.ksAddress AS ksAddress,
        m.address AS address,
        m.city AS city,
        m.expiryDate AS expiryDate,
        m.status AS status,
        m.mobile AS mobile,
        m.photo AS photo,
        m.isWm AS isWm,
        m.voter AS voter,
        m.membershipDate AS membershipDate,
        m.updatedBy AS updatedBy
    FROM Members m
    WHERE (
        (:memberType = 1 AND m.gmLmMemberType = 1)
        OR (:memberType = 2 AND m.gmLmMemberType = 2)
        OR (:memberType IS NULL)
    )
    AND m.status <> 'DELETED'
    ORDER BY m.name ASC
""")
    List<MemberSummary> findAllMemberSummariesStream(@Param("memberType") Integer memberType);



    @Query(
            value = "SELECT * FROM members ORDER BY CAST(SUBSTRING(member_id, 4) AS UNSIGNED) DESC LIMIT 1",
            nativeQuery = true
    )
    Members findTopByOrderByMemberIdDesc();

    List<Members> findByExpiryDateBeforeAndStatus(LocalDate date, String status);


    @Query("""
                SELECT m.memberId AS memberId,
                       m.name AS name,
                       m.dob AS dob,
                       m.guardianName AS guardianName,
                       m.registrationType AS registrationType,
                       m.registrationNo AS registrationNo,
                       m.enNo AS enNo,
                       m.mobile AS mobile,
                       m.photo AS photo,
                       m.address AS address
                FROM Members m
                WHERE m.status = 'ACTIVE'
                  AND m.gmLmMemberType = 2
                  AND m.voter = 'Yes'
                  AND m.registrationType = 'C.O.P No.'
            """)
    Page<CopMemberSummary> findFilteredMembers(Pageable pageable);

    @Query("""
            SELECT m.memberId AS memberId,
                   m.name AS name,
                   m.dob AS dob,
                   m.guardianName AS guardianName,
                   m.registrationType AS registrationType,
                   m.registrationNo AS registrationNo,
                   m.enNo AS enNo,
                   m.photo AS photo,
                   m.mobile AS mobile,
                   m.address AS address
            FROM Members m
            WHERE (m.status = 'ACTIVE' OR m.status = 'INACTIVE')
              AND m.gmLmMemberType = 2
              AND m.voter = 'Yes'
              AND m.registrationType IN ('C.O.P No.')
            """)
    Page<CopMemberSummary> findLmVoters(Pageable pageable);

    @Query("""
            SELECT m.memberId AS memberId,
                   m.name AS name,
                   m.dob AS dob,
                   m.guardianName AS guardianName,
                   m.registrationType AS registrationType,
                   m.registrationNo AS registrationNo,
                   m.enNo AS enNo,
                   m.photo AS photo,
                   m.mobile AS mobile,
                   m.address AS address
            FROM Members m
            WHERE (m.status = 'ACTIVE' OR m.status = 'INACTIVE')
              AND m.gmLmMemberType = 1
              AND m.voter = 'Yes'
              AND m.registrationType = 'C.O.P No.'
              AND m.registrationNo IS NOT NULL
              AND TRIM(m.registrationNo) <> ''
              AND m.expiryDate >= :eligibilityDate
              AND (
                    m.membershipDate <= :twoYearsBeforeDate
                 OR m.createdDate <= :twoYearsBeforeTime
                  )
            """)
    Page<CopMemberSummary> findGmVotersByMonthYear(
            @Param("eligibilityDate") LocalDate eligibilityDate,
            @Param("twoYearsBeforeDate") LocalDate twoYearsBeforeDate,
            @Param("twoYearsBeforeTime") LocalDateTime twoYearsBeforeTime,
            Pageable pageable
    );

    @Query("""
            SELECT m.memberId AS memberId,
                   m.name AS name,
                   m.dob AS dob,
                   m.guardianName AS guardianName,
                   m.registrationType AS registrationType,
                   m.registrationNo AS registrationNo,
                   m.enNo AS enNo,
                   m.photo AS photo,
                   m.mobile AS mobile,
                   m.address AS address
            FROM Members m
            WHERE (m.status = 'ACTIVE' OR m.status = 'INACTIVE')
              AND m.gmLmMemberType = 1
              AND m.voter = 'Yes'
              AND m.registrationType IN ('C.O.P No.')
              AND m.registrationNo IS NOT NULL
              AND TRIM(m.registrationNo) <> ''
              AND m.expiryDate >= :eligibilityDate
              AND (
                    m.membershipDate <= :twoYearsBeforeDate
                 OR m.createdDate <= :twoYearsBeforeTime
                  )
              AND (
                    LOWER(m.name) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.guardianName) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.registrationNo) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.enNo) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.mobile) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(CAST(m.memberId AS STRING)) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
              )
            """)
    Page<CopMemberSummary> searchGmVotersByMonthYear(
            @Param("eligibilityDate") LocalDate eligibilityDate,
            @Param("twoYearsBeforeDate") LocalDate twoYearsBeforeDate,
            @Param("twoYearsBeforeTime") LocalDateTime twoYearsBeforeTime,
            @Param("searchQuery") String searchQuery,
            Pageable pageable
    );

    @Query("""
            SELECT m.memberId AS memberId,
                   m.name AS name,
                   m.dob AS dob,
                   m.guardianName AS guardianName,
                   m.registrationType AS registrationType,
                   m.registrationNo AS registrationNo,
                   m.enNo AS enNo,
                   m.photo AS photo,
                   m.mobile AS mobile,
                   m.address AS address
            FROM Members m
            WHERE (m.status = 'ACTIVE' OR m.status = 'INACTIVE')
              AND m.gmLmMemberType = 2
              AND m.voter = 'Yes'
              AND m.registrationType IN ('C.O.P No.')
              AND (
                    LOWER(m.name) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.guardianName) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.registrationNo) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.enNo) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.mobile) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(CAST(m.memberId AS STRING)) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
              )
            """)
    Page<CopMemberSummary> searchLmVoters(
            @Param("searchQuery") String searchQuery,
            Pageable pageable
    );

    @Query("""
            SELECT m.memberId AS memberId,
                   m.name AS name,
                   m.dob AS dob,
                   m.guardianName AS guardianName,
                   m.registrationType AS registrationType,
                   m.registrationNo AS registrationNo,
                   m.enNo AS enNo,
                   m.photo AS photo,
                   m.mobile AS mobile,
                   m.address AS address
            FROM Members m
            WHERE (m.status = 'ACTIVE' OR m.status = 'INACTIVE')
              AND m.gmLmMemberType = 2
              AND m.voter = 'Yes'
              AND m.registrationType IN ('C.O.P No.')
              AND m.registrationNo IS NOT NULL
              AND TRIM(m.registrationNo) <> ''
              AND (
                    LOWER(m.name) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.guardianName) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.registrationNo) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.enNo) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(m.mobile) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
                 OR LOWER(CAST(m.memberId AS STRING)) LIKE LOWER(CONCAT('%', :searchQuery, '%'))
              )
            """)
    Page<CopMemberSummary> searchLmVotersByMonthYear(
            @Param("searchQuery") String searchQuery,
            Pageable pageable
    );

    @Query("""
            SELECT m.memberId AS memberId,
                   m.name AS name,
                   m.dob AS dob,
                   m.guardianName AS guardianName,
                   m.registrationType AS registrationType,
                   m.registrationNo AS registrationNo,
                   m.enNo AS enNo,
                   m.photo AS photo,
                   m.mobile AS mobile,
                   m.address AS address
            FROM Members m
            WHERE (m.status = 'ACTIVE' OR m.status = 'INACTIVE')
              AND m.gmLmMemberType = 2
              AND m.voter = 'Yes'
              AND m.registrationType = 'C.O.P No.'
              AND m.registrationNo IS NOT NULL
              AND TRIM(m.registrationNo) <> ''
            """)
    Page<CopMemberSummary> findLmVotersByMonthYear(
            Pageable pageable
    );

    // Query to find duplicate members by mobile number
    @Query(value = """
            SELECT m.mobile, m.name, m.gender, m.registration_no, m.registration_type,
                   m.city, m.membership_date, m.expiry_date, m.voter, m.gm_lm_member_type,
                   m.updated_by, m.status, COUNT(*) as duplicate_count
            FROM members m
            GROUP BY m.mobile
            HAVING COUNT(*) > 1
            ORDER BY m.mobile DESC
            """, nativeQuery = true)
    List<Object[]> findDuplicateMembers();

    // Query to find members by mobile number
    List<Members> findByMobile(String mobile);

    // Query to find duplicate members by mobile number with filter
    @Query(value = """
            SELECT m.mobile, m.name, m.gender, m.registration_no, m.registration_type,
                   m.city, m.membership_date, m.expiry_date, m.voter, m.gm_lm_member_type,
                   m.updated_by, m.status, COUNT(*) as duplicate_count
            FROM members m
            WHERE m.mobile = :mobile
            GROUP BY m.mobile
            HAVING COUNT(*) > 1
            """, nativeQuery = true)
    List<Object[]> findDuplicatesByMobile(@Param("mobile") String mobile);

    default List<Object[]> getNativeDuplicateMembers(String mobileFilter) {
        if (mobileFilter != null && !mobileFilter.trim().isEmpty()) {
            return findDuplicatesByMobile(mobileFilter.trim());
        }
        return findDuplicateMembers();
    }

}
