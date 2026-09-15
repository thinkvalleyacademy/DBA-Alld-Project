package com.dba.alld.repository;

import com.dba.alld.entities.Affidavit;
import com.dba.alld.response.AffidavitEntryListResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AffidavitRepository extends JpaRepository<Affidavit, Integer> {

    List<AffidavitEntryListResponse> findAllProjectedBy();
}
