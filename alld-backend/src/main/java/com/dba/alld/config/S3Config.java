package com.dba.alld.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;

@Configuration
public class S3Config {

    @Value("${aws.access-key:}")
    private String accessKey;

    @Value("${aws.secret-key:}")
    private String secretKey;

    @Value("${aws.region:ap-south-1}")
    private String region;

    // Optional -- set to point at an S3-compatible endpoint (e.g. OCI Object
    // Storage) instead of real AWS. Leave blank for real AWS (unchanged
    // behavior for existing deployments).
    @Value("${aws.s3.endpoint:}")
    private String endpointOverride;

    @Bean(destroyMethod = "close")
    public S3Client s3Client() {
        AwsCredentialsProvider credentialsProvider;
        if (isPresentCredential(accessKey) && isPresentCredential(secretKey)) {
            credentialsProvider = StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(accessKey.trim(), secretKey.trim()));
        } else {
            credentialsProvider = DefaultCredentialsProvider.create();
        }

        S3Client.Builder builder = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(credentialsProvider);

        if (endpointOverride != null && !endpointOverride.trim().isEmpty()) {
            builder = builder
                    .endpointOverride(URI.create(endpointOverride.trim()))
                    .forcePathStyle(true);
        }

        return builder.build();
    }

    private boolean isPresentCredential(String value) {
        if (value == null) {
            return false;
        }
        String trimmed = value.trim();
        return !trimmed.isEmpty() && !trimmed.startsWith("replace-with-");
    }
}
