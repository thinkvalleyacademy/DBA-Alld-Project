package com.dba.alld.repository;

import com.dba.alld.entities.WelfareMemberCompensation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CompensationRepository extends JpaRepository<WelfareMemberCompensation, Integer> {

    List<WelfareMemberCompensation> findTop10ByOrderByCreatedDateDesc();

    List<WelfareMemberCompensation> findByCompensationId(String id);

    List<WelfareMemberCompensation> findByMember_Id(Long memberId);

}
