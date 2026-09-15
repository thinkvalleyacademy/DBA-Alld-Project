-- DBA ALLD Database Schema - Optimized Indexes for Member Export
-- Run this script to add performance indexes for member list and export queries

USE dba;

-- Composite index for member list filtering (most common query pattern)
-- Optimizes: WHERE gm_lm_member_type = ? OR is_wm = ?
CREATE INDEX idx_gm_lm_is_wm ON members(gm_lm_member_type, is_wm);

-- Composite index for member export queries
-- Covers all fields used in the export query SELECT and WHERE clauses
CREATE INDEX idx_member_export ON members(
    gm_lm_member_type,
    is_wm,
    name,
    status
);

-- Index for status-based filtering
CREATE INDEX idx_status_active ON members(status) WHERE status = 'ACTIVE';

-- Index for membership date queries (useful for subscription filtering)
CREATE INDEX idx_membership_date ON members(membership_date);

-- Index for expiry date queries (useful for subscription expiry)
CREATE INDEX idx_expiry_date ON members(expiry_date);

-- Composite index for voter list queries
CREATE INDEX idx_voter_list ON members(
    status,
    gm_lm_member_type,
    voter,
    registration_type
);

-- Optimize existing indexes
-- Drop and recreate with better column order if needed
-- (Only if you have specific performance issues with existing queries)

-- Analyze table to update statistics
ANALYZE TABLE members;

-- Show index usage statistics
SELECT 
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX,
    NON_UNIQUE,
    INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'dba'
  AND TABLE_NAME = 'members'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

SELECT 'Indexes created successfully!' AS status;
