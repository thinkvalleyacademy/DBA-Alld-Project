package com.dba.alld.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Serves the React build from classpath:/static/ and falls back to
 * index.html for client-side (react-router) routes that don't match a
 * real static file -- only when the frontend build is actually bundled
 * into this jar's resources (index.html present on the classpath).
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    private static final String[] API_PREFIXES = {
            "api/", "actuator/", "files/", "swagger-ui", "v3/", "webjars/", "error"
    };

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        if (!new ClassPathResource("/static/index.html").exists()) {
            return;
        }

        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested;
                        }
                        for (String prefix : API_PREFIXES) {
                            if (resourcePath.startsWith(prefix)) {
                                return null;
                            }
                        }
                        return new ClassPathResource("/static/index.html");
                    }
                });
    }
}
