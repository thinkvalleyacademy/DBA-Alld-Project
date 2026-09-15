package com.dba.alld.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

/**
 * Caffeine Cache Configuration for High-Performance Caching
 * 
 * Java 25 Optimized - Uses modern Caffeine cache with improved performance
 * 
 * Features:
 * - Maximum size limits to prevent memory bloat
 * - Time-based expiration for stale data
 * - Statistics for monitoring cache performance
 * - Multiple cache regions for different data types
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Configure Caffeine Cache Manager with optimized settings
     * 
     * Cache regions:
     * - members: Member data (10k entries, 1 hour expiry)
     * - publicNoticeImages: Public notice images (5k entries, 2 hour expiry)
     * - users: User authentication data (2k entries, 30 min expiry)
     * - roles: Role permissions (500 entries, 4 hour expiry)
     * - welfare: Welfare member data (5k entries, 1 hour expiry)
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        cacheManager.setCaffeine(Caffeine.newBuilder()
            // Maximum entries per cache
            .maximumSize(10000)
            // Expire entries after write
            .expireAfterWrite(1, TimeUnit.HOURS)
            // Expire entries after access (for frequently accessed data)
            .expireAfterAccess(30, TimeUnit.MINUTES)
            // Record statistics for monitoring
            .recordStats()
            // Soft references for values (allows GC under memory pressure)
            .softValues()
        );
        
        // Define specific cache names with custom configurations
        cacheManager.registerCustomCache("members", Caffeine.newBuilder()
            .maximumSize(10000)
            .expireAfterWrite(1, TimeUnit.HOURS)
            .recordStats()
            .build());
            
        cacheManager.registerCustomCache("publicNoticeImages", Caffeine.newBuilder()
            .maximumSize(5000)
            .expireAfterWrite(2, TimeUnit.HOURS)
            .recordStats()
            .build());
            
        cacheManager.registerCustomCache("users", Caffeine.newBuilder()
            .maximumSize(2000)
            .expireAfterWrite(30, TimeUnit.MINUTES)
            .expireAfterAccess(15, TimeUnit.MINUTES)
            .recordStats()
            .build());
            
        cacheManager.registerCustomCache("roles", Caffeine.newBuilder()
            .maximumSize(500)
            .expireAfterWrite(4, TimeUnit.HOURS)
            .recordStats()
            .build());
            
        cacheManager.registerCustomCache("welfare", Caffeine.newBuilder()
            .maximumSize(5000)
            .expireAfterWrite(1, TimeUnit.HOURS)
            .recordStats()
            .build());
        
        return cacheManager;
    }
}
