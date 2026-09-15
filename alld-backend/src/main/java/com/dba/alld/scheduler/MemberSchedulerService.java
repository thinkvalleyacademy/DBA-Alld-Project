package com.dba.alld.scheduler;

import com.dba.alld.entities.Members;
import com.dba.alld.repository.MembersRepository;
import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Log4j2
public class MemberSchedulerService {

    private final MembersRepository membersRepository;

    public MemberSchedulerService(MembersRepository membersRepository) {
        this.membersRepository = membersRepository;
    }

    public void runDailyMaintenance() {
        log.info("🕒 Running Daily DBA Member Scheduler...");

        expireOldMembers();
        updateVoterEligibility();

        log.info("✅ Scheduler work completed.");
    }

    private void expireOldMembers() {
        LocalDate today = LocalDate.now();

        List<Members> expiredMembers =
                membersRepository.findByExpiryDateBeforeAndStatus(today, "ACTIVE");

        if (expiredMembers.isEmpty()) {
            log.info("No expired members found.");
            return;
        }

        expiredMembers.forEach(member -> {
            member.setStatus("INACTIVE");
            log.info("⚠ Marked INACTIVE: " + member.getMemberId());
        });

        membersRepository.saveAll(expiredMembers);
    }


    private void updateVoterEligibility() {
        List<Members> allMembers = membersRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Members m : allMembers) {

            boolean eligible = false;

            // WELFARE MEMBER - check isWm flag
            if (m.getIsWm() != null && m.getIsWm()) {
                eligible = m.getRegistrationNo() != null && !m.getRegistrationNo().isBlank();
            }

            // LIFE MEMBER (2)
            else if (m.getGmLmMemberType() == 2) {
                eligible = m.getRegistrationNo() != null && !m.getRegistrationNo().isBlank();
            }

            // GENERAL MEMBER (1)
            else if (m.getGmLmMemberType() == 1) {

                boolean hasCop = m.getRegistrationNo() != null && !m.getRegistrationNo().isBlank();
                LocalDate joinDate = m.getMembershipDate();

                boolean completed2Years;

                if (joinDate == null) {
                    completed2Years = true;  // blank means assume 2 years done
                } else {
                    completed2Years = joinDate.plusYears(2).isBefore(today);
                }

                eligible = hasCop && completed2Years;
            }

            m.setVoter(eligible ? "yes" : "no");
        }

        membersRepository.saveAll(allMembers);
        log.info("✔ Updated voter eligibility for all members.");
    }
}