package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.WelfareCompensationDTO;
import com.dba.alld.dto.WelfareMemberCompensationResponse;
import com.dba.alld.entities.Members;
import com.dba.alld.entities.Users;
import com.dba.alld.entities.WelfareMemberCompensation;
import com.dba.alld.repository.CompensationRepository;
import com.dba.alld.repository.UsersRepository;
import com.dba.alld.request.WelfareMemberCompensationRequest;
import com.dba.alld.service.CompensationService;
import com.dba.alld.repository.MembersRepository;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class CompensationServiceImpl implements CompensationService {

    @Autowired
    CompensationRepository repository;

    @Autowired
    MembersRepository membersRepository;

    @Autowired
    UsersRepository usersRepository;


    @Override
    public GenericApiResponse<Object> addCompensation(WelfareMemberCompensationRequest request, String createdByUserId) {
        Members member = membersRepository.findByMemberId(request.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        Users user = usersRepository.findByUserId(createdByUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        WelfareMemberCompensation compensation =
                WelfareMemberCompensation.builder()
                        .compensationId("WFC-" + UUID.randomUUID().toString().substring(0, 8))
                        .member(member)
                        .amount(request.getAmount())
                        .compensationDate(request.getCompensationDate())
                        .description(request.getDescription())
                        .createdBy(user)
                        .createdDate(LocalDateTime.now())
                        .build();
        repository.save(compensation);

        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Success")
                .data(compensation.getCompensationId())
                .build();

    }

    @Override
    public GenericApiResponse<Object> compensationList() {
        List<WelfareMemberCompensationResponse> list =
                repository.findTop10ByOrderByCreatedDateDesc()
                        .stream()
                        .map(c -> WelfareMemberCompensationResponse.builder()
                                .compensationId(c.getCompensationId())
                                .memberId(c.getMember().getMemberId())
                                .memberName(c.getMember().getName())
                                .amount(c.getAmount())
                                .compensationDate(c.getCompensationDate())
                                .description(c.getDescription())
                                .userPhone(c.getCreatedBy().getMobile())
                                .createdDate(c.getCreatedDate())
                                .build())
                        .toList();

        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Compensation List")
                .data(list)
                .build();
    }

    @Override
    public GenericApiResponse<Object> compensationEntry(String id) {
        try {
            List<WelfareMemberCompensation> entries =
                    repository.findByCompensationId(id);

            List<WelfareCompensationDTO> dtoList = entries.stream()
                    .map(c -> WelfareCompensationDTO.builder()
                            .compensationId(c.getCompensationId())
                            .memberId(c.getMember().getMemberId())
                            .memberName(c.getMember().getName())
                            .amount(c.getAmount())
                            .compensationDate(c.getCompensationDate())
                            .description(c.getDescription())
                            .createdDate(c.getCreatedDate())
                            .userPhone(c.getCreatedBy().getMobile())
                            .build()
                    ).toList();

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Entry found")
                    .data(dtoList)
                    .build();
        } catch (Exception e) {
            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Internal Server Error")
                    .data("")
                    .build();
        }

    }

    private Long extractNumericId(String memberId) {
        // POR00000223 → 223
        String numeric = memberId.replaceAll("\\D+", "");
        return Long.valueOf(numeric);
    }



    @Override
    public GenericApiResponse<Object> compensationEntryByMemberId(String  memberId) {
        try {
            Long numericMemberId = extractNumericId(memberId);

            List<WelfareMemberCompensation> entries =
                    repository.findByMember_Id(numericMemberId);

            if (entries.isEmpty()) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("No compensation entries found for this member")
                        .data(List.of())
                        .build();
            }

            List<WelfareCompensationDTO> dtoList = entries.stream()
                    .map(c -> WelfareCompensationDTO.builder()
                            .compensationId(c.getCompensationId())
                            .memberId(c.getMember().getMemberId())
                            .memberName(c.getMember().getName())
                            .amount(c.getAmount())
                            .compensationDate(c.getCompensationDate())
                            .description(c.getDescription())
                            .createdDate(c.getCreatedDate())
                            .userPhone(c.getCreatedBy().getMobile())
                            .build()
                    ).toList();

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Compensation entries found")
                    .data(dtoList)
                    .build();

        } catch (Exception e) {
            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Internal Server Error")
                    .data("")
                    .build();
        }
    }


}
