package com.dba.alld.repository;

import com.dba.alld.entities.PublicNoticeImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PublicNoticeImageRepository extends JpaRepository<PublicNoticeImage, Long> {
    List<PublicNoticeImage> findByActiveTrueOrderByCreatedDateDesc();
}
