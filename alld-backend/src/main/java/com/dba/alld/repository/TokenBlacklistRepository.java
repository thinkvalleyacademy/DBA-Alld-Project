package com.dba.alld.repository;

import com.dba.alld.entities.TokenBlacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for TokenBlacklist entity.
 * Provides methods for managing blacklisted tokens.
 */
@Repository
public interface TokenBlacklistRepository extends JpaRepository<TokenBlacklist, Long> {

    /**
     * Check if a token hash exists in the blacklist.
     *
     * @param tokenHash the SHA-256 hash of the token
     * @return true if token is blacklisted, false otherwise
     */
    boolean existsByTokenHash(String tokenHash);

    /**
     * Find a blacklisted token by its hash.
     *
     * @param tokenHash the SHA-256 hash of the token
     * @return Optional containing the blacklisted token if found
     */
    Optional<TokenBlacklist> findByTokenHash(String tokenHash);

    /**
     * Delete all blacklisted tokens that have expired.
     * Used for cleanup of old blacklist entries.
     *
     * @param expiryTime the cutoff expiry time
     * @return number of records deleted
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM TokenBlacklist tb WHERE tb.expiryTime < :expiryTime")
    int deleteByExpiryTimeBefore(LocalDateTime expiryTime);

    /**
     * Count all blacklisted tokens for a specific user.
     *
     * @param userId the user ID
     * @return count of blacklisted tokens
     */
    long countByUserId(Long userId);

    /**
     * Delete all blacklisted tokens for a specific user.
     * Used when completely removing a user or invalidating all sessions.
     *
     * @param userId the user ID
     */
    @Modifying
    @Transactional
    void deleteByUserId(Long userId);

    /**
     * Count blacklisted tokens by token type.
     *
     * @param tokenType the token type (ACCESS or REFRESH)
     * @return count of blacklisted tokens
     */
    long countByTokenType(TokenBlacklist.TokenType tokenType);

    /**
     * Find all blacklisted tokens for a user that haven't expired yet.
     *
     * @param userId the user ID
     * @param now current time
     * @return count of active blacklisted tokens
     */
    @Query("SELECT COUNT(tb) FROM TokenBlacklist tb WHERE tb.userId = :userId AND tb.expiryTime > :now")
    long countActiveBlacklistedTokensByUserId(Long userId, LocalDateTime now);
}
