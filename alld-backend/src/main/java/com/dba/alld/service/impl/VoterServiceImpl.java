package com.dba.alld.service.impl;


import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.repository.CopMemberSummary;
import com.dba.alld.repository.MembersRepository;
import com.dba.alld.service.VoterService;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Log4j2
public class VoterServiceImpl implements VoterService {

    @Autowired
    MembersRepository membersRepository;


    @Override
    public GenericApiResponse<Object> listGMMember(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("name").ignoreCase()));
        log.info("listGMMember request page={}, size={}", page, size);
        Page<CopMemberSummary> membersPage = membersRepository.findLmVoters(pageable);
        log.info("listGMMember fetched totalMembers={}, pageSize={}, returnedEntries={}", membersPage.getTotalElements(), membersPage.getSize(), membersPage.getNumberOfElements());
        log.debug("listGMMember sample entries={}", buildSampleLog(membersPage));

        return buildResponse(membersPage, "Filtered active C.O.P members");
    }

    @Override
    public GenericApiResponse<Object> listGmVotersByMonthYear(int year, int month, int page, int size) {

        // E = last day of selected month & year
        LocalDate eligibilityDate = YearMonth.of(year, month).atEndOfMonth();

        // Member must have at least 2 years of membership from eligibility date
        LocalDate twoYearsBeforeDate = eligibilityDate.minusYears(2);
        LocalDateTime twoYearsBeforeTime = twoYearsBeforeDate.atStartOfDay();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("name").ignoreCase()));

        Page<CopMemberSummary> members =
                membersRepository.findGmVotersByMonthYear(
                        eligibilityDate,
                        twoYearsBeforeDate,
                        twoYearsBeforeTime,
                        pageable
                );
        log.info("listGmVotersByMonthYear request year={}, month={}, page={}, size={}, eligibilityDate={}, twoYearsBeforeDate={}", year, month, page, size, eligibilityDate, twoYearsBeforeDate);
        log.info("listGmVotersByMonthYear fetched totalMembers={}, pageSize={}, returnedEntries={}", members.getTotalElements(), members.getSize(), members.getNumberOfElements());
        log.debug("listGmVotersByMonthYear sample entries={}", buildSampleLog(members));

        return buildResponse(members, "GM Voter List as of " + eligibilityDate);
    }

    @Override
    public GenericApiResponse<Object> listLmVotersByMonthYear(int year, int month, int page, int size) {

        LocalDate eligibilityDate = YearMonth.of(year, month).atEndOfMonth();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("name").ignoreCase()));

        Page<CopMemberSummary> members =
                membersRepository.findLmVotersByMonthYear(pageable);
        log.info("listLmVotersByMonthYear request year={}, month={}, page={}, size={}, eligibilityDate={}", year, month, page, size, eligibilityDate);
        log.info("listLmVotersByMonthYear fetched totalMembers={}, pageSize={}, returnedEntries={}", members.getTotalElements(), members.getSize(), members.getNumberOfElements());
        log.debug("listLmVotersByMonthYear sample entries={}", buildSampleLog(members));

        return buildResponse(members, "LM Voter List");
    }

    @Override
    public GenericApiResponse<Object> searchGmVotersByMonthYear(int year, int month, String searchQuery, int page, int size) {

        LocalDate eligibilityDate = YearMonth.of(year, month).atEndOfMonth();
        LocalDate twoYearsBeforeDate = eligibilityDate.minusYears(2);
        LocalDateTime twoYearsBeforeTime = twoYearsBeforeDate.atStartOfDay();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("name").ignoreCase()));

        Page<CopMemberSummary> members =
                membersRepository.searchGmVotersByMonthYear(
                        eligibilityDate,
                        twoYearsBeforeDate,
                        twoYearsBeforeTime,
                        searchQuery,
                        pageable
                );
        log.info("searchGmVotersByMonthYear request year={}, month={}, query={}, page={}, size={}", year, month, searchQuery, page, size);
        log.info("searchGmVotersByMonthYear fetched totalMembers={}, pageSize={}, returnedEntries={}", members.getTotalElements(), members.getSize(), members.getNumberOfElements());
        log.debug("searchGmVotersByMonthYear sample entries={}", buildSampleLog(members));

        return buildResponse(members, "GM Voter Search Results for '" + searchQuery + "' as of " + eligibilityDate);
    }

    @Override
    public GenericApiResponse<Object> searchLmVoters(String searchQuery, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("name").ignoreCase()));
        log.info("searchLmVoters request query={}, page={}, size={}", searchQuery, page, size);

        Page<CopMemberSummary> members = membersRepository.searchLmVoters(searchQuery, pageable);
        log.info("searchLmVoters fetched totalMembers={}, pageSize={}, returnedEntries={}", members.getTotalElements(), members.getSize(), members.getNumberOfElements());
        log.debug("searchLmVoters sample entries={}", buildSampleLog(members));

        return buildResponse(members, "LM Voter Search Results for '" + searchQuery + "'");
    }

    @Override
    public GenericApiResponse<Object> searchLmVotersByMonthYear(int year, int month, String searchQuery, int page, int size) {

        LocalDate eligibilityDate = YearMonth.of(year, month).atEndOfMonth();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.asc("name").ignoreCase()));
        log.info("searchLmVotersByMonthYear request year={}, month={}, query={}, page={}, size={}", year, month, searchQuery, page, size);

        Page<CopMemberSummary> members = membersRepository.searchLmVotersByMonthYear(searchQuery, pageable);
        log.info("searchLmVotersByMonthYear fetched totalMembers={}, pageSize={}, returnedEntries={}", members.getTotalElements(), members.getSize(), members.getNumberOfElements());
        log.debug("searchLmVotersByMonthYear sample entries={}", buildSampleLog(members));

        return buildResponse(members, "LM Voter Search Results for '" + searchQuery + "'");
    }

    private String buildSampleLog(Page<CopMemberSummary> page) {
        List<CopMemberSummary> content = page.getContent();
        return content.stream()
                .limit(5)
                .map(member -> String.format("[%s | %s | %s | %s]", member.getMemberId(), member.getName(), member.getRegistrationNo(), member.getMobile()))
                .collect(Collectors.joining(", "));
    }

    private GenericApiResponse<Object> buildResponse(Page<CopMemberSummary> page, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("members", page.getContent());
        response.put("totalMembers", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        response.put("currentPage", page.getNumber());
        response.put("pageSize", page.getSize());

        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message(message)
                .data(response)
                .build();
    }

}
