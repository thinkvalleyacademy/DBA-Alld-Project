-- ============================================
-- Token Blacklist Table Migration Script
-- Purpose: Server-side logout functionality
-- Date: 2026-03-17
-- ============================================

-- Create token_blacklist table for storing invalidated tokens
CREATE TABLE IF NOT EXISTS token_blacklist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE COMMENT 'SHA-256 hash of the token',
    token_type ENUM('ACCESS', 'REFRESH') NOT NULL COMMENT 'Type of token',
    expiry_time DATETIME NOT NULL COMMENT 'When the token expires (for cleanup)',
    blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'When the token was blacklisted',
    user_id BIGINT COMMENT 'User ID associated with the token',
    reason VARCHAR(50) DEFAULT 'LOGOUT' COMMENT 'Reason: LOGOUT, EXPIRED, REVOKED, SECURITY',
    created_by VARCHAR(100) COMMENT 'User who performed the blacklist action',
    
    -- Indexes for performance
    INDEX idx_token_hash (token_hash),
    INDEX idx_expiry (expiry_time),
    INDEX idx_user_id (user_id),
    INDEX idx_blacklisted_at (blacklisted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores blacklisted/invalidated JWT tokens for logout functionality';

-- ============================================
-- Stored Procedure: Cleanup Expired Blacklist
-- Purpose: Remove old blacklisted tokens
-- ============================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS cleanup_expired_blacklist()
BEGIN
    DECLARE deleted_count INT DEFAULT 0;
    
    DELETE FROM token_blacklist 
    WHERE expiry_time < NOW();
    
    SET deleted_count = ROW_COUNT();
    
    SELECT deleted_count AS 'Deleted Records';
END //

DELIMITER ;

-- ============================================
-- Sample Data (for testing only - remove in production)
-- ============================================

-- INSERT INTO token_blacklist (token_hash, token_type, expiry_time, user_id, reason)
-- VALUES 
--     ('test_hash_1234567890abcdef', 'ACCESS', DATE_ADD(NOW(), INTERVAL 1 HOUR), 1, 'LOGOUT'),
--     ('test_hash_0987654321fedcba', 'REFRESH', DATE_ADD(NOW(), INTERVAL 7 DAY), 1, 'LOGOUT');

-- ============================================
-- Verification Queries
-- ============================================

-- Check table structure
-- DESCRIBE token_blacklist;

-- Count blacklisted tokens by type
-- SELECT token_type, COUNT(*) as count FROM token_blacklist GROUP BY token_type;

-- Find active blacklisted tokens (not yet expired)
-- SELECT * FROM token_blacklist WHERE expiry_time > NOW();

-- ============================================
-- Rollback Script (if needed)
-- ============================================

-- DROP PROCEDURE IF EXISTS cleanup_expired_blacklist;
-- DROP TABLE IF EXISTS token_blacklist;
