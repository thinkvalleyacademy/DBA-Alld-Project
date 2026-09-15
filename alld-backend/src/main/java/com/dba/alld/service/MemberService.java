package com.dba.alld.service;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.MemberExportDTO;
import com.dba.alld.entities.Members;
import com.dba.alld.request.RegistrationFeeRequest;
import com.dba.alld.request.SubscriptionRequest;
import com.dba.alld.request.UpdateMemberContactRequest;
import com.dba.alld.request.WelfareMemberRequest;
import jakarta.transaction.Transactional;
import org.jspecify.annotations.Nullable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


public interface MemberService {

    @Nullable

    GenericApiResponse<Object> searchMembers(String query, Integer type);

    GenericApiResponse<Object> searchMembersByTypes(String query, List<Integer> types) ;


        GenericApiResponse<Object> saveOrUpdateMember(Members member,
                                                  MultipartFile photo,
                                                  MultipartFile bcOfUpPhoto,
                                                  MultipartFile affidavite,
                                                  MultipartFile qrcode,
                                                  String userId,
                                                  // ✅ Skip checkbox flags
                                                  Boolean skipDocUpload,
                                                  Boolean skipAffidavit) throws IOException;

    GenericApiResponse<Object> listMember(int page, int size,  Integer memberType, String query);

    GenericApiResponse<Object> memberDetails(String id);

    GenericApiResponse<Object> updateMemberContact(UpdateMemberContactRequest request);

    GenericApiResponse<Object> updateMemberContact(UpdateMemberContactRequest request, MultipartFile bcOfUpPhoto);
    GenericApiResponse<Object> updateMemberContact(UpdateMemberContactRequest request, MultipartFile bcOfUpPhoto, MultipartFile affidavite);
    GenericApiResponse<Object> updateMemberContact(UpdateMemberContactRequest request, MultipartFile bcOfUpPhoto, MultipartFile affidavite, MultipartFile photo);

    GenericApiResponse<Object> renewSubscription(SubscriptionRequest request);

    GenericApiResponse<Object> calculateRenewalAmount(SubscriptionRequest request);

    GenericApiResponse<Object> calculateRegistrationFee(RegistrationFeeRequest request);

    @Transactional
    GenericApiResponse<Object> addWelfareMember(WelfareMemberRequest request);

    GenericApiResponse<Object> getWelfareMemberListForDownload(Integer memberType);

    /**
     * Export member list to Excel file (server-side generation)
     * @param memberType filter by member type (1=General, 2=Life, null=All)
     * @return ResponseEntity with Excel file
     */
    ResponseEntity<byte[]> exportMembersToExcel(Integer memberType);

    /**
     * Get member export data as DTO list
     */
    List<MemberExportDTO> getMemberExportData(Integer memberType);

    // ✅ Duplicate members management
    GenericApiResponse<Object> getDuplicateMembers(String mobileFilter);

    GenericApiResponse<Object> updateMemberStatus(String memberId, String newStatus);

    @Transactional
    GenericApiResponse<Object> bulkUpdateMemberStatus(List<String> memberIds, String newStatus);
}
