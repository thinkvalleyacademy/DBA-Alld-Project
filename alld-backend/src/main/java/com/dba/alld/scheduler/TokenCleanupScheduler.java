package com.dba.alld.scheduler;

import com.dba.alld.repository.TokenBlacklistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Scheduler component for cleaning up expired blacklisted tokens.
 * Runs periodically to remove old entries from the token_blacklist table.
 */
@Component
public class TokenCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupScheduler.class);

    @Autowired
    private TokenBlacklistRepository blacklistRepository;

    /**
     * Whether the cleanup scheduler is enabled.
     * Default is true.
     */
    @Value("${token.blacklist.cleanup.enabled:true}")
    private boolean cleanupEnabled;

    /**
     * Cleanup expired blacklisted tokens.
     * Runs daily at 2:00 AM by default.
     *
     * Cron expression: "0 0 2 * * ?" = Every day at 2:00 AM
     */
    @Scheduled(cron = "${token.blacklist.cleanup.cron:0 0 2 * * ?}")
    public void cleanupExpiredBlacklist() {
        if (!cleanupEnabled) {
            log.debug("Token blacklist cleanup is disabled");
            return;
        }

        try {
            log.info("Starting cleanup of expired blacklisted tokens...");

            LocalDateTime now = LocalDateTime.now();
            int deletedCount = blacklistRepository.deleteByExpiryTimeBefore(now);

            log.info("Cleaned up {} expired blacklisted tokens", deletedCount);

        } catch (Exception e) {
            log.error("Error during token blacklist cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger for cleanup (can be called via JMX or actuator endpoint).
     *
     * @return number of records deleted
     */
    public int triggerCleanup() {
        log.info("Manual cleanup triggered");
        LocalDateTime now = LocalDateTime.now();
        return blacklistRepository.deleteByExpiryTimeBefore(now);
    }
}
