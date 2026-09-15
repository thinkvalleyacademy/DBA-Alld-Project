package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.entities.Members;
import com.dba.alld.entities.MembersSubscriptionHistory;
import com.dba.alld.entities.Receipt;
import com.dba.alld.repository.MemberSubRepository;
import com.dba.alld.repository.MembersRepository;
import com.dba.alld.repository.ReceiptRepository;
import com.dba.alld.request.RegistrationFeeRequest;
import com.dba.alld.request.SubscriptionRequest;
import com.dba.alld.service.S3Service;
import com.dba.alld.utility.Utility;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberServiceImplTest {

    @Mock
    private MembersRepository membersRepository;

    @Mock
    private MemberSubRepository subRepository;

    @Mock
    private ReceiptRepository receiptRepository;

    @Mock
    private Utility utility;

    @Mock
    private S3Service s3Service;

    @InjectMocks
    private MemberServiceImpl memberService;

    @Test
    void calculateRegistrationFee_shouldReturn50ForOldAnd575ForNew() {
        RegistrationFeeRequest oldRequest = RegistrationFeeRequest.builder()
                .memberType("Old")
                .gmLmMemberType(1)
                .build();

        GenericApiResponse<Object> oldResponse = memberService.calculateRegistrationFee(oldRequest);
        assertEquals(200, oldResponse.getStatus());
        assertNotNull(oldResponse.getData());
        assertEquals(50, ((Map<?, ?>) oldResponse.getData()).get("amount"));

        RegistrationFeeRequest newRequest = RegistrationFeeRequest.builder()
                .memberType("New")
                .gmLmMemberType(1)
                .build();

        GenericApiResponse<Object> newResponse = memberService.calculateRegistrationFee(newRequest);
        assertEquals(200, newResponse.getStatus());
        assertNotNull(newResponse.getData());
        assertEquals(575, ((Map<?, ?>) newResponse.getData()).get("amount"));
    }

    @Test
    void calculateRenewalAmount_shouldApplyCumulativeRateByMonthFromNextExpiryMonth() {
        Members member = new Members();
        member.setMemberId("POR00012990");
        member.setGmLmMemberType(1);
        member.setExpiryDate(LocalDate.of(2023, 1, 31));

        when(membersRepository.findByMemberId("POR00012990")).thenReturn(Optional.of(member));

        SubscriptionRequest request = SubscriptionRequest.builder()
                .memberID("POR00012990")
                .monthsNo(3)
                .userPhone("98XXXXXXXX")
                .build();

        GenericApiResponse<Object> response = memberService.calculateRenewalAmount(request);

        assertEquals(200, response.getStatus());
        assertNotNull(response.getData());

        Map<?, ?> data = (Map<?, ?>) response.getData();
        assertEquals(65, data.get("amount"));
        assertTrue(data.containsKey("expiryDate"));
        assertTrue(data.containsKey("validTill"));
    }

    @Test
    void saveOrUpdateMember_shouldCreateRegistrationHistoryAndReceipt() {
        Members lastMember = new Members();
        lastMember.setMemberId("POR00000009");
        when(membersRepository.findTopByOrderByMemberIdDesc()).thenReturn(lastMember);
        when(receiptRepository.save(any(Receipt.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(subRepository.save(any(MembersSubscriptionHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(membersRepository.save(any(Members.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Members request = new Members();
        request.setMemberType("Old");
        request.setName("Test Member");
        request.setGender("Male");
        request.setRelation("Father");
        request.setGuardianName("Guardian");
        request.setRegistrationType("C.O.P No.");
        request.setAddress("Address");
        request.setCity("Prayagraj");
        request.setZip("211001");
        request.setState("UP");
        request.setKsAddress("KS");
        request.setMobile("9999999999");
        request.setNomineeName("Nominee");
        request.setNomineeMobile("9999999998");
        request.setBcOfUpType("C.O.P");
        request.setVoter("Yes");
        request.setQrcodeDigit("QRCODE");
        request.setGmLmMemberType(1);
        request.setEwalletBalance(BigDecimal.valueOf(50));

        GenericApiResponse<Object> response =
                memberService.saveOrUpdateMember(request, null, null, null, null, "admin", false, false);

        assertEquals(200, response.getStatus());
        Map<?, ?> data = (Map<?, ?>) response.getData();
        assertNotNull(data.get("member"));
        assertNotNull(data.get("subscriptionEntry"));

        Members savedMember = (Members) data.get("member");
        assertEquals("POR00000010", savedMember.getMemberId());
        assertEquals("ACTIVE", savedMember.getStatus());

        verify(receiptRepository).save(any(Receipt.class));
        verify(subRepository).save(any(MembersSubscriptionHistory.class));
        verify(membersRepository).save(any(Members.class));
    }

    @Test
    void renewSubscription_shouldPersistRenewalEntryAndUpdateMemberExpiry() {
        LocalDate now = LocalDate.now();
        LocalDate currentExpiry = now.withDayOfMonth(now.lengthOfMonth());
        LocalDate expectedExpiry = currentExpiry.plusMonths(2)
                .withDayOfMonth(currentExpiry.plusMonths(2).lengthOfMonth());

        Members member = new Members();
        member.setMemberId("POR00000002");
        member.setGmLmMemberType(1);
        member.setExpiryDate(currentExpiry);

        when(membersRepository.findByMemberId("POR00000002")).thenReturn(Optional.of(member));
        when(subRepository.save(any(MembersSubscriptionHistory.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(membersRepository.save(any(Members.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SubscriptionRequest request = SubscriptionRequest.builder()
                .memberID("POR00000002")
                .monthsNo(2)
                .amount(50)
                .userPhone("9999999999")
                .build();

        GenericApiResponse<Object> response = memberService.renewSubscription(request);

        assertEquals(200, response.getStatus());
        Map<?, ?> data = (Map<?, ?>) response.getData();
        assertNotNull(data.get("member"));
        assertNotNull(data.get("subscriptionEntry"));

        Members updatedMember = (Members) data.get("member");
        assertEquals(expectedExpiry, updatedMember.getExpiryDate());
    }
}
