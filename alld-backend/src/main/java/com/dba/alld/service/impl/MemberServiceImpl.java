package com.dba.alld.service.impl;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.dto.MemberExportDTO;
import com.dba.alld.entities.Members;
import com.dba.alld.entities.MembersSubscriptionHistory;
import com.dba.alld.entities.Receipt;
import com.dba.alld.repository.MemberSubRepository;
import com.dba.alld.repository.MemberSummary;
import com.dba.alld.repository.MembersRepository;
import com.dba.alld.repository.ReceiptRepository;
import com.dba.alld.repository.WelfareMemberSummary;
import com.dba.alld.request.RegistrationFeeRequest;
import com.dba.alld.request.SubscriptionRequest;
import com.dba.alld.request.UpdateMemberContactRequest;
import com.dba.alld.request.WelfareMemberRequest;
import com.dba.alld.service.MemberService;
import com.dba.alld.service.S3Service;
import com.dba.alld.util.ExcelGenerator;
import com.dba.alld.utility.Utility;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.Serializable;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Log4j2
public class MemberServiceImpl implements MemberService {
    private static final BigDecimal GM_REGISTRATION_FEE_OLD = BigDecimal.valueOf(50);
    private static final BigDecimal GM_REGISTRATION_FEE_NEW = BigDecimal.valueOf(575);
    private static final BigDecimal GM_SUBSCRIPTION_CHARGE_PER_MONTH = BigDecimal.valueOf(25);
    private static final BigDecimal GM_SUBSCRIPTION_CHARGE_PER_MONTH_OLD = BigDecimal.valueOf(15);
    private static final YearMonth GM_SUBSCRIPTION_OLD_RATE_CUTOFF_MONTH = YearMonth.of(2023, 2);

    @Autowired
    MembersRepository membersRepository;

    @Autowired
    MemberSubRepository subRepository;

    @Autowired
    ReceiptRepository receiptRepository;

    @Autowired
    Utility utility;

    @Autowired
    S3Service s3Service;

    @Autowired
    ExcelGenerator excelGenerator;

    @Value("${app.upload.base-path}")
    private String uploadDir;

    @Value("${media.base-url}")
    private String mediaBaseUrl;

    @Override
    @Cacheable(value = "members", key = "#query + '_' + #type", unless = "#result.data == null")
    public GenericApiResponse<Object> searchMembers(String query, Integer type) {
        List<Members> results = membersRepository.searchMembers(query, type);

        List<Map<String, Serializable>> suggestions = results.stream()
                .limit(10)
                .map(m -> {
                    Map<String, Serializable> map = new LinkedHashMap<>();
                    map.put("id", m.getId());
                    map.put("memberId", m.getMemberId());
                    map.put("name", m.getName());
                    map.put("fatherName", m.getGuardianName());
                    map.put("mobile", m.getMobile());
                    map.put("membershipDate", m.getMembershipDate());
                    map.put("city", m.getCity());
                    map.put("registrationNo", m.getRegistrationNo());
                    map.put("enNo", m.getEnNo());
                    map.put("status", m.getStatus());
                    map.put("gmLmMemberType", m.getGmLmMemberType());
                    map.put("isWm", m.getIsWm() != null && m.getIsWm());
                    map.put("memberTypeName",
                            m.getIsWm() != null && m.getIsWm() ? "Welfare Member" :
                            m.getGmLmMemberType() == null ? "Unknown" :
                            m.getGmLmMemberType() == 1 ? "General Member" :
                                    m.getGmLmMemberType() == 2 ? "Life Member" :
                                            "Unknown"
                    );
                    map.put("createdAt", m.getCreatedDate());
                    return map;
                })
                .collect(Collectors.toList());


        return utility.buildResponse("Search Results", HttpStatus.OK.value(), suggestions);
    }

    public GenericApiResponse<Object> searchMembersByTypes(String query, List<Integer> types) {

        List<Members> results = membersRepository.searchMembersByTypes(query, types);

        List<Map<String, Serializable>> suggestions = results.stream()
                .limit(10)
                .map(m -> {
                    Map<String, Serializable> map = new LinkedHashMap<>();
                    map.put("id", m.getId());
                    map.put("memberId", m.getMemberId());
                    map.put("name", m.getName());
                    map.put("mobile", m.getMobile());
                    map.put("fatherName", m.getGuardianName());
                    map.put("city", m.getCity());
                    map.put("registrationNo", m.getRegistrationNo());
                    map.put("enNo", m.getEnNo());
                    map.put("status", m.getStatus());
                    map.put("gmLmMemberType", m.getGmLmMemberType());
                    map.put("memberTypeName",
                            m.getGmLmMemberType() == null ? "Unknown" :
                            m.getGmLmMemberType() == 1 ? "General Member" :
                                    m.getGmLmMemberType() == 2 ? "Life Member" :
                                            "Unknown"
                    );
                    map.put("createdAt", m.getCreatedDate());
                    return map;
                })
                .toList();

        return utility.buildResponse(
                "General & Life Member Search Results",
                HttpStatus.OK.value(),
                suggestions
        );
    }

    @Override
    @CacheEvict(value = "members", allEntries = true)
    public GenericApiResponse<Object> saveOrUpdateMember(
            Members member,
            MultipartFile photo,
            MultipartFile bcOfUpPhoto,
            MultipartFile affidavite,
            MultipartFile qrcode,
            String userId,
            // ✅ Skip checkbox flags
            Boolean skipDocUpload,
            Boolean skipAffidavit) {

        long methodStartTime = System.currentTimeMillis();
        log.info("[TIMING] saveOrUpdateMember started | memberId={}", member.getMemberId());

        try {
            Optional<Members> existingMemberOpt = Optional.empty();
            String numericId;

            // ===============================
            // CREATE OR UPDATE LOGIC
            // ===============================
            if (StringUtils.hasText(member.getMemberId())) {
                existingMemberOpt = membersRepository.findByMemberId(member.getMemberId());
                numericId = member.getMemberId().replaceAll("\\D+", "");
            } else {
                numericId = generateNextMemberId();
                member.setMemberId("POR" + numericId);
            }

            Members entity = existingMemberOpt.orElse(member);

            if (existingMemberOpt.isPresent()) {
                log.info("Updating existing member | memberId={}", entity.getMemberId());
                updateFields(entity, member);
                entity.setUpdatedDate(LocalDateTime.now());
                entity.setUpdatedBy(userId);
            } else {
                log.info("Creating new member | memberId={}", entity.getMemberId());
                entity.setCreatedDate(LocalDateTime.now());
                entity.setCreatedBy(userId);
                entity.setStatus(entity.getStatus() == null ? "ACTIVE" : entity.getStatus());
            }

            Objects.requireNonNull(entity.getMemberId(),
                    "MemberId must exist before file upload");

            // ===============================
            // FILE UPLOADS (NEW ARCHITECTURE)
            // ===============================
            if (photo != null && !photo.isEmpty()) {
                entity.setPhoto(
                        s3Service.uploadMemberImage(photo, "photos", entity.getMemberId(), entity.getPhoto())
                );
            }

            // ✅ Only upload BC document if NOT skipped and file is provided
            if (!Boolean.TRUE.equals(skipDocUpload) && bcOfUpPhoto != null && !bcOfUpPhoto.isEmpty()) {
                entity.setBcOfUpPhoto(
                        s3Service.uploadMemberImage(
                                bcOfUpPhoto,
                                "bc_of_up_photo",
                                entity.getMemberId(),
                                entity.getBcOfUpPhoto()
                        )
                );
            } else if (Boolean.TRUE.equals(skipDocUpload)) {
                log.info("[SKIP] BC document upload skipped by user | memberId={}", entity.getMemberId());
            }

            // ✅ Only upload affidavit if NOT skipped and file is provided
            if (!Boolean.TRUE.equals(skipAffidavit) && affidavite != null && !affidavite.isEmpty()) {
                entity.setAffidavite(
                        s3Service.uploadMemberImage(
                                affidavite,
                                "affidavit",
                                entity.getMemberId(),
                                entity.getAffidavite()
                        )
                );
            } else if (Boolean.TRUE.equals(skipAffidavit)) {
                log.info("[SKIP] Affidavit upload skipped by user | memberId={}", entity.getMemberId());
            }

            if (qrcode != null && !qrcode.isEmpty()) {
                entity.setQrcode(
                        s3Service.uploadMemberImage(
                                qrcode,
                                "qrcode",
                                entity.getMemberId(),
                                entity.getQrcode()
                        )
                );
            }

            normalizeAffidavit(entity);

            // ===============================
            // MEMBERSHIP / EXPIRY
            // ===============================
            entity.setMembershipDate(member.getMembershipDate());
            LocalDate registrationExpiryDate;

            if (existingMemberOpt.isPresent()) {
                // Update: preserve entered expiry date for General Members
                registrationExpiryDate = entity.getGmLmMemberType() == 1 ? member.getExpiryDate() : null;
            } else if (member.getExpiryDate() != null) {
                // Expiry date entered by user: store as-is
                registrationExpiryDate = member.getExpiryDate();
            } else {
                // No expiry date entered: default to last day of current month
                LocalDate today = LocalDate.now();
                registrationExpiryDate = today.withDayOfMonth(today.lengthOfMonth());
            }
            entity.setExpiryDate(registrationExpiryDate);

            // ===============================
            // TRANSACTION & RECEIPT
            // ===============================
            String orderId = generateReceiptNumber();
            String cleanedId = numericId.replaceFirst("^0+(?!$)", "");
            boolean isLifeMember = member.getGmLmMemberType() == 2;


            MembersSubscriptionHistory entry =
                    MembersSubscriptionHistory.builder()
                            .memberId(cleanedId)
                            .txnType("REGISTRATION")
                            .txnDate(LocalDateTime.now())
                            .noOfMonth(isLifeMember?0:1)
                            .createdBy(userId)
                            .createdDate(LocalDateTime.now())
                            .status("ACTIVE")
                            .orderId(Long.valueOf(orderId))
                            .amount(member.getEwalletBalance())
                            .expiryDate(registrationExpiryDate)
                            .build();

            Receipt receipt =
                    Receipt.builder()
                            .memberId(entity.getMemberId())
                            .printedAt(LocalDateTime.now())
                            .userId(userId)
                            .build();

            // ===============================
            // DATABASE OPERATIONS
            // ===============================
            long dbStart = System.currentTimeMillis();
            log.info("[TIMING] Database operations started");

            receiptRepository.save(receipt);
            subRepository.save(entry);
            membersRepository.save(entity);

            long dbEnd = System.currentTimeMillis();
            log.info("[TIMING] Database operations completed | duration={} ms", (dbEnd - dbStart));

            String action = existingMemberOpt.isPresent() ? "MEMBER_UPDATE" : "MEMBER_REGISTRATION";
            log.info("[AUDIT] action={} memberId={} gmLmMemberType={} amount={} orderId={} actor={}",
                    action,
                    entity.getMemberId(),
                    entity.getGmLmMemberType(),
                    entry.getAmount(),
                    entry.getOrderId(),
                    userId);

            long methodEndTime = System.currentTimeMillis();
            log.info("[TIMING] saveOrUpdateMember completed | memberId={} | total duration={} ms",
                    entity.getMemberId(), (methodEndTime - methodStartTime));

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("member", entity);
            responseData.put("subscriptionEntry", entry);

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Member saved successfully")
                    .data(responseData)
                    .build();

        } catch (Exception e) {
            long methodEndTime = System.currentTimeMillis();
            log.error("[TIMING] saveOrUpdateMember failed | duration={} ms | error={}",
                    (methodEndTime - methodStartTime), e.getMessage(), e);

            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Internal Server Error")
                    .data(e.getMessage())
                    .build();
        }
    }


    private LocalDate setExpiry(LocalDate membershipDate, String memberType, Members member) {

        //todo:
        // if memberType = GM , member expiry will be the current month(2nd day)
        // if memberType = LM/WM , no expiry

        // ---update MembersSubscriptionHistory table for scheduler.----
        // amount = read GM or LM member fee from table
        // txnType= as per request GM/LM(as per DB table )
        //txnDate = current Date
        //noOfMonth= applied for GM as every month will be renewed(current)
        //orderId = check how orderId is generated(may be auto generated value)

        return null;
    }

    private LocalDate calculateRenewalExpiryDate(LocalDate currentExpiry, LocalDate today, int months) {
        if (currentExpiry != null) {
            LocalDate normalizedCurrentExpiry = currentExpiry.withDayOfMonth(currentExpiry.lengthOfMonth());
            LocalDate targetMonth = normalizedCurrentExpiry.plusMonths(months);
            return targetMonth.withDayOfMonth(targetMonth.lengthOfMonth());
        }

        LocalDate currentMonthEnd = today.withDayOfMonth(today.lengthOfMonth());
        LocalDate targetMonth = currentMonthEnd.plusMonths(months - 1);
        return targetMonth.withDayOfMonth(targetMonth.lengthOfMonth());
    }

    private BigDecimal calculateCumulativeRenewalAmount(LocalDate currentExpiry, int months) {
        YearMonth startMonth = currentExpiry != null
                ? YearMonth.from(currentExpiry).plusMonths(1)
                : YearMonth.now();

        BigDecimal total = BigDecimal.ZERO;
        for (int i = 0; i < months; i++) {
            YearMonth chargeMonth = startMonth.plusMonths(i);
            BigDecimal rate = chargeMonth.compareTo(GM_SUBSCRIPTION_OLD_RATE_CUTOFF_MONTH) <= 0
                    ? GM_SUBSCRIPTION_CHARGE_PER_MONTH_OLD
                    : GM_SUBSCRIPTION_CHARGE_PER_MONTH;
            total = total.add(rate);
        }
        return total;
    }


    public GenericApiResponse<Object> listMember(int page, int size, Integer memberType, String query) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        Page<MemberSummary> membersPage = membersRepository.findAllMemberSummaries(memberType, query, pageable);

        // Prepare response map
        Map<String, Object> response = new HashMap<>();
        response.put("members", membersPage.getContent());       // current page data
        response.put("totalMembers", membersPage.getTotalElements()); // total number of members
        response.put("totalPages", membersPage.getTotalPages());      // total pages
        response.put("currentPage", membersPage.getNumber());         // current page number
        response.put("pageSize", membersPage.getSize());              // size per page

        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message(memberType == null
                        ? "List of all members"
                        : (memberType == 1 ? "List of General Members" : "List of Life Members"))
                .data(response)
                .build();
    }

    public GenericApiResponse<Object> memberDetails(String id) {

        Members member = membersRepository.findByMemberIdAndStatusNot(id, "DELETED")
                .orElseThrow(() -> new RuntimeException("Member not found"));

        Map<String, Object> response = new HashMap<>();
        response.put("member", member);

        // 🔑 Build FULL image URL for UI
        String photoUrl = null;
        if (member.getPhoto() != null && !member.getPhoto().isBlank()) {
            // member.getPhoto() → upload/photos/1543226003.jpg
            photoUrl = mediaBaseUrl + "/files/" + member.getPhoto();
        }

        response.put("photoUrl", photoUrl);

        return GenericApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Here is the member info")
                .data(response)
                .build();
    }



    private String generateNextMemberId() {


            String prefix = "POR";
            int numberLength = 8; // length of numeric part

            Members lastMember = membersRepository.findTopByOrderByMemberIdDesc();

            if (lastMember == null || lastMember.getMemberId() == null) {
                return prefix + String.format("%0" + numberLength + "d", 1);
            }

            String lastId = lastMember.getMemberId();

            // Extract numeric part after prefix
            String numberPart = lastId.substring(prefix.length());

            log.info("numberPart"+numberPart);
            int num = Integer.parseInt(numberPart);
            int next = num + 1;

            // Zero-pad back to required length
            String nextNumber = String.format("%0" + numberLength + "d", next);

            return nextNumber;
        }




    private String generateReceiptNumber() {

        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int randomNumber = (int) (Math.random() * 90000000) + 10000000;
        return datePart + randomNumber;
    }


    @Override
    public GenericApiResponse<Object> updateMemberContact(UpdateMemberContactRequest request) {
        return updateMemberContact(request, null, null, null);
    }

    @Override
    public GenericApiResponse<Object> updateMemberContact(UpdateMemberContactRequest request, MultipartFile bcOfUpPhoto) {
        return updateMemberContact(request, bcOfUpPhoto, null, null);
    }

    @Override
    public GenericApiResponse<Object> updateMemberContact(UpdateMemberContactRequest request, MultipartFile bcOfUpPhoto, MultipartFile affidavite) {
        return updateMemberContact(request, bcOfUpPhoto, affidavite, null);
    }

    @Override
    public GenericApiResponse<Object> updateMemberContact(UpdateMemberContactRequest request, MultipartFile bcOfUpPhoto, MultipartFile affidavite, MultipartFile photo) {
        try {
            Optional<Members> memberOpt = membersRepository.findByMemberIdAndStatusNot(request.getMemberId(), "DELETED");

            if (memberOpt.isEmpty()) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("Member not found")
                        .data(null)
                        .build();
            }

            Members member = memberOpt.get();

            // -------- Personal Info --------
            if (isNotBlank(request.getName()))
                member.setName(request.getName());

            if (isNotBlank(request.getFatherName()))
                member.setGuardianName(request.getFatherName());

            if (isNotBlank(request.getGender()))
                member.setGender(request.getGender());

            if (request.getDob() != null)
                member.setDob(request.getDob());

            if (isNotBlank(request.getBloodGroup()))
                member.setBloodGroup(request.getBloodGroup());

            // -------- Contact --------
            if (isNotBlank(request.getMobile()))
                member.setMobile(request.getMobile());

            if (isNotBlank(request.getEmail()))
                member.setEmail(request.getEmail());

            // -------- Address --------
            if (isNotBlank(request.getAddress()))
                member.setAddress(request.getAddress());

            if (isNotBlank(request.getCity()))
                member.setCity(request.getCity());

            if (isNotBlank(request.getState()))
                member.setState(request.getState());

            if (isNotBlank(request.getZip()))
                member.setZip(request.getZip());

            if (isNotBlank(request.getKsAddress()))
                member.setKsAddress(request.getKsAddress());

            // -------- Registration --------
            if (isNotBlank(request.getCopNumber()))
                member.setRegistrationNo(request.getCopNumber());

            if (isNotBlank(request.getEnNo()))
                member.setEnNo(request.getEnNo());

            if (isNotBlank(request.getBcOfUpType()))
                member.setBcOfUpType(request.getBcOfUpType());

            if (isNotBlank(request.getRegistrationType()))
                member.setRegistrationType(request.getRegistrationType());

            if (isNotBlank(request.getVoter()))
                member.setVoter(request.getVoter());

            if (bcOfUpPhoto != null && !bcOfUpPhoto.isEmpty()) {
                member.setBcOfUpPhoto(
                        s3Service.uploadMemberImage(
                                bcOfUpPhoto,
                                "bc_of_up_photo",
                                member.getMemberId(),
                                member.getBcOfUpPhoto()
                        )
                );
            }

            if (affidavite != null && !affidavite.isEmpty()) {
                member.setAffidavite(
                        s3Service.uploadMemberImage(
                                affidavite,
                                "affidavit",
                                member.getMemberId(),
                                member.getAffidavite()
                        )
                );
            }

            if (photo != null && !photo.isEmpty()) {
                member.setPhoto(
                        s3Service.uploadMemberImage(
                                photo,
                                "photos",
                                member.getMemberId(),
                                member.getPhoto()
                        )
                );
            }

            // -------- Nominee --------
            if (isNotBlank(request.getNomineeName()))
                member.setNomineeName(request.getNomineeName());

            if (isNotBlank(request.getNomineeMobile()))
                member.setNomineeMobile(request.getNomineeMobile());

            // -------- Meta --------
            member.setUpdatedBy(request.getUpdatedBy());
            member.setUpdatedDate(LocalDateTime.now());

            normalizeAffidavit(member);

            membersRepository.save(member);
            log.info("[AUDIT] action=MEMBER_CONTACT_UPDATE memberId={} actor={} bcOfUpType={} bcFileUpdated={}",
                    member.getMemberId(),
                    request.getUpdatedBy(),
                    member.getBcOfUpType(),
                    (bcOfUpPhoto != null && !bcOfUpPhoto.isEmpty()));

            if (member.getMemberId() == null)
                log.error("memberId is NULL");

            if (member.getName() == null)
                log.error("name is NULL");

            if (member.getMobile() == null)
                log.error("mobile is NULL");

            if (member.getRegistrationNo() == null)
                log.error("registrationNo is NULL");

            log.info(
                    "[DEBUG] Response values -> memberId={}, name={}, mobile={}, registrationNo={}",
                    member.getMemberId(),
                    member.getName(),
                    member.getMobile(),
                    member.getRegistrationNo()
            );

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("memberId", member.getMemberId());
            responseData.put("name", member.getName());
            responseData.put("mobile", member.getMobile());
            responseData.put("copNumber", member.getRegistrationNo());

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Member personal details updated successfully")
                    .data(responseData)
                    .build();

        } catch (Exception e) {
            log.error("Error updating member contact", e);

            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Something went wrong")
                    .data(e.getMessage())
                    .build();
        }
    }

    private boolean isNotBlank(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private void normalizeAffidavit(Members member) {
        if (member == null) {
            return;
        }

        String voter = member.getVoter();
        if ("No".equalsIgnoreCase(voter)) {
            // Business rule: affidavit can be empty when voter is No.
            if (!StringUtils.hasText(member.getAffidavite())) {
                member.setAffidavite("");
            }
            return;
        }

        // DB has NOT NULL constraint for affidavite; prevent null inserts/updates.
        if (member.getAffidavite() == null) {
            member.setAffidavite("");
        }
    }

    @Override
    public GenericApiResponse<Object> calculateRegistrationFee(RegistrationFeeRequest request) {
        try {
            if (request == null || request.getGmLmMemberType() == null) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("gmLmMemberType is required")
                        .data(null)
                        .build();
            }

            if (request.getGmLmMemberType() != 1) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Registration fee quote is currently available for General Member only")
                        .data(null)
                        .build();
            }

            boolean isOldMember = "old".equalsIgnoreCase(
                    Optional.ofNullable(request.getMemberType()).orElse("")
            );
            BigDecimal amount = isOldMember ? GM_REGISTRATION_FEE_OLD : GM_REGISTRATION_FEE_NEW;

            Map<String, Object> data = new HashMap<>();
            data.put("amount", amount.intValue());

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("OK")
                    .data(data)
                    .build();
        } catch (Exception e) {
            log.error("Error calculating registration fee", e);
            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Something went wrong")
                    .data(e.getMessage())
                    .build();
        }
    }

    @Override
    public GenericApiResponse<Object> calculateRenewalAmount(SubscriptionRequest request) {
        try {
            if (request == null || !StringUtils.hasText(request.getMemberID())) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("memberID is required")
                        .data(null)
                        .build();
            }

            int months = request.getMonthsNo() == null ? 0 : request.getMonthsNo();
            if (months < 1) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Months must be at least 1")
                        .data(null)
                        .build();
            }

            Optional<Members> memberOpt = membersRepository.findByMemberId(request.getMemberID());
            if (memberOpt.isEmpty()) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("Member not found")
                        .data(null)
                        .build();
            }

            Members member = memberOpt.get();
            if ("DELETED".equalsIgnoreCase(member.getStatus())) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("Member not found")
                        .data(null)
                        .build();
            }
            if (member.getGmLmMemberType() == null || member.getGmLmMemberType() != 1) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Renewal quote is currently available for General Member only")
                        .data(null)
                        .build();
            }

            LocalDate currentExpiry = member.getExpiryDate();
            BigDecimal amount = calculateCumulativeRenewalAmount(currentExpiry, months);
            LocalDate finalExpiry = calculateRenewalExpiryDate(currentExpiry, LocalDate.now(), months);

            Map<String, Object> data = new HashMap<>();
            data.put("amount", amount.intValue());
            data.put("expiryDate", finalExpiry.toString());
            data.put("validTill", finalExpiry.toString());

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("OK")
                    .data(data)
                    .build();
        } catch (Exception e) {
            log.error("Error calculating renewal amount", e);
            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Something went wrong")
                    .data(e.getMessage())
                    .build();
        }
    }


    @Override
    public GenericApiResponse<Object> renewSubscription(SubscriptionRequest request) {
        try {
            log.info("[AUDIT] action=RENEWAL_REQUEST memberId={} months={} actor={}",
                    request.getMemberID(), request.getMonthsNo(), request.getUserPhone());
            Optional<Members> memberOpt = membersRepository.findByMemberId(request.getMemberID());

            if (memberOpt.isEmpty()) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("MemberID is not present")
                        .data("Data is missing")
                        .build();
            }

            Members member = memberOpt.get();
            if ("DELETED".equalsIgnoreCase(member.getStatus())) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("MemberID is not present")
                        .data("Data is missing")
                        .build();
            }

            // Check if member is a General Member (gmLmMemberType = 1)
            if (member.getGmLmMemberType() != 1) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Only General Members can renew subscription")
                        .data("Invalid member type")
                        .build();
            }

            LocalDate today = LocalDate.now();

			String cleanedId = member.getMemberId()
                    .replaceAll("\\D", "")
                    .replaceFirst("^0+", "");
			
            int months = request.getMonthsNo();
            if (months < 1) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.BAD_REQUEST.value())
                        .message("Months must be at least 1")
                        .data("Invalid months")
                        .build();
            }

            LocalDate finalExpiry = calculateRenewalExpiryDate(member.getExpiryDate(), today, months);

            member.setExpiryDate(finalExpiry);


            member.setUpdatedBy(String.valueOf(request.getUserPhone()));
            member.setUpdatedDate(LocalDateTime.now());
            member.setStatus("ACTIVE");


            String orderId = generateReceiptNumber();

            // cleanedId already defined earlier in method - reuse it
            int req_months = member.getGmLmMemberType() == 2 ? 0 : request.getMonthsNo();

            MembersSubscriptionHistory entry = MembersSubscriptionHistory.builder()
                    .memberId(cleanedId)
                    .txnType("RENEWAL")
                    .txnDate(LocalDateTime.now())
                    .noOfMonth(req_months)
                    .createdBy(request.getUserPhone())
                    .createdDate(LocalDateTime.now())
                    .status("ACTIVE")
                    .orderId(Long.valueOf(orderId))
                    .amount(BigDecimal.valueOf(request.getAmount()))
                    .expiryDate(finalExpiry)
                    .build();

            subRepository.save(entry);
            membersRepository.save(member);
            log.info("[AUDIT] action=RENEWAL_SUCCESS memberId={} months={} amount={} orderId={} newExpiry={} actor={}",
                    member.getMemberId(),
                    req_months,
                    entry.getAmount(),
                    entry.getOrderId(),
                    finalExpiry,
                    request.getUserPhone());

            Map<String, Object> responseData = new HashMap<>();
            responseData.put("member", member);
            responseData.put("subscriptionEntry", entry);

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Subscription renewed successfully")
                    .data(responseData)
                    .build();

        } catch (Exception e) {
            log.error("Error renewing subscription", e);

            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Something went wrong")
                    .data(e.getMessage())
                    .build();
        }
    }

    public GenericApiResponse<Object> addWelfareMember(WelfareMemberRequest request){
        try {
            Optional<Members> memberOpt = membersRepository.findByMemberId(request.getMemberId());

            if (memberOpt.isEmpty()) {
                return GenericApiResponse.builder()
                        .status(HttpStatus.NOT_FOUND.value())
                        .message("MemberID is not present ")
                        .data("Data is missing")
                        .build();
            }

            Members member = memberOpt.get();

            if (request.getMobile() != null && !request.getMobile().isBlank()) {
                member.setMobile(request.getMobile());
            }

            if (request.getRegistrationNo() != null && !request.getRegistrationNo().isBlank()) {
                member.setRegistrationNo(request.getRegistrationNo()); // COP No
            }

            member.setStatus("ACTIVE");

            // Mark as Welfare Member instead of changing gmLmMemberType
            member.setIsWm(true);
            member.setExpiryDate(null);


            member.setUpdatedBy(request.getUserPhone());
            member.setUpdatedDate(LocalDateTime.now());
            String orderId =  generateReceiptNumber();

            String cleanedId = member.getMemberId()
                    .replaceAll("\\D", "")
                    .replaceFirst("^0+", "");

            MembersSubscriptionHistory entry   = MembersSubscriptionHistory.builder().
                    memberId(cleanedId).
                    txnType("RENEWAL").
                    txnDate(LocalDateTime.now()).
                    noOfMonth(0).
                    createdBy(request.getUserPhone()).
                    createdDate(LocalDateTime.now())
                    .status("ACTIVE").
                    orderId(Long.valueOf(orderId)).
                    amount(request.getAmount()).
                    expiryDate(member.getExpiryDate()).build();

            subRepository.save(entry);

            membersRepository.save(member);


            Map<String, Object> responseData = new HashMap<>();
            responseData.put("member", member);
            responseData.put("subscriptionEntry", entry);

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Welfare Member created Successfully")
                    .data(responseData)
                    .build();


        } catch (Exception e) {
            log.error("Error updating member contact in welfare", e);

            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Something went wrong")
                    .data(e.getMessage())
                    .build();
        }

    }

    private void updateFields(Members target, Members source) {
        target.setName(source.getName());
        target.setGender(source.getGender());
        target.setRelation(source.getRelation());
        target.setGuardianName(source.getGuardianName());
        target.setDob(source.getDob());
        target.setBloodGroup(source.getBloodGroup());
        target.setRegistrationType(source.getRegistrationType());
        target.setRegistrationNo(source.getRegistrationNo());
        target.setEnNo(source.getEnNo());
        target.setAddress(source.getAddress());
        target.setCity(source.getCity());
        target.setZip(source.getZip());
        target.setState(source.getState());
        target.setKsAddress(source.getKsAddress());
        target.setMobile(source.getMobile());
        target.setEmail(source.getEmail());
        target.setNomineeName(source.getNomineeName());
        target.setNomineeMobile(source.getNomineeMobile());
        target.setMembershipDate(source.getMembershipDate());
        target.setExpiryDate(source.getExpiryDate());
        target.setBcOfUpType(source.getBcOfUpType());
        target.setVoter(source.getVoter());
        target.setQrcodeDigit(source.getQrcodeDigit());
        target.setGmLmMemberType(source.getGmLmMemberType());
        target.setStatus(source.getStatus());
        target.setEwalletBalance(source.getEwalletBalance());
        target.setDesignation(source.getDesignation());
    }

    /**
     * Optimized method for welfare member list download
     * Fetches only required fields using lightweight DTO
     */
    @Override
    public GenericApiResponse<Object> getWelfareMemberListForDownload(Integer memberType) {
        try {
            List<WelfareMemberSummary> members = membersRepository.findWelfareMembersByType(memberType);

            Map<String, Object> response = new HashMap<>();
            response.put("members", members);
            response.put("totalMembers", members.size());

            return GenericApiResponse.builder()
                    .status(HttpStatus.OK.value())
                    .message("Welfare Member List for Download")
                    .data(response)
                    .build();
        } catch (Exception e) {
            log.error("Error fetching welfare member list", e);
            return GenericApiResponse.builder()
                    .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                    .message("Error fetching member list")
                    .data(null)
                    .build();
        }
    }

    /**
     * Get member export data as DTO list - optimized for Excel generation
     * Uses stream to avoid loading all data into memory at once
     */
    @Override
    public List<MemberExportDTO> getMemberExportData(Integer memberType) {
        try {
            // Fetch all members without pagination using stream
            return membersRepository.findAllMemberSummariesStream(memberType)
                    .stream()
                    .map(summary -> MemberExportDTO.builder()
                            .srNo(0) // Will be set during Excel generation
                            .memberId(summary.getMemberId())
                            .name(summary.getName())
                            .fatherName(summary.getGuardianName())
                            .copNo(summary.getRegistrationNo())
                            .enrollmentNo(summary.getEnNo())
                            .regType(summary.getRegistrationType())
                            .address(summary.getAddress())
                            .city(summary.getCity())
                            .mobile(summary.getMobile())
                            .membershipDate(summary.getMembershipDate())
                            .subscription(summary.getExpiryDate())
                            .voter(summary.getVoter())
                            .build())
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching member export data", e);
            return Collections.emptyList();
        }
    }

    /**
     * Export members to Excel file - server-side generation
     * Uses streaming to handle large datasets efficiently
     */
    @Override
    public ResponseEntity<byte[]> exportMembersToExcel(Integer memberType) {
        try {
            log.info("Starting Excel export for memberType={}", memberType);
            long startTime = System.currentTimeMillis();

            // Fetch data
            List<MemberExportDTO> members = getMemberExportData(memberType);

            if (members.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("No members found for export".getBytes());
            }

            // Add serial numbers
            for (int i = 0; i < members.size(); i++) {
                members.get(i).setSrNo(i + 1);
            }

            // Sort by name for Welfare members
            if (memberType == 3) {
                members.sort(Comparator.comparing(m -> m.getName() != null ? m.getName() : ""));
            }

            // Generate Excel file using streaming
            byte[] excelData = excelGenerator.generateMemberExcel(
                    members,
                    memberType == 1 ? "General Members" :
                    memberType == 2 ? "Life Members" :
                    memberType == 3 ? "Welfare Members" : "All Members"
            );

            long endTime = System.currentTimeMillis();
            log.info("Excel export completed in {}ms for {} members", (endTime - startTime), members.size());

            // Prepare filename with timestamp
            String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            String filename = String.format("Members_%s_%s_%d_records.xlsx",
                    memberType == null ? "All" :
                    memberType == 1 ? "General" :
                    memberType == 2 ? "Life" : "Welfare",
                    date,
                    members.size());

            // Return Excel file with proper headers
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(excelData);

        } catch (Exception e) {
            log.error("Error generating Excel file", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(("Error generating Excel: " + e.getMessage()).getBytes());
        }
    }

    @Override
    public GenericApiResponse<Object> getDuplicateMembers(String mobileFilter) {
        try {
            log.info("Fetching duplicate members with filter={}", mobileFilter);

            List<Members> allMembers;
            
            if (mobileFilter != null && !mobileFilter.trim().isEmpty()) {
                // Fetch members with specific mobile number
                allMembers = membersRepository.findByMobile(mobileFilter.trim());
            } else {
                // This would require a custom query to find all groups with duplicates
                // For now, fetch all and group in code
                allMembers = membersRepository.findAll();
            }

            if (allMembers == null || allMembers.isEmpty()) {
                log.info("No duplicate members found with filter={}", mobileFilter);
                return utility.buildResponse("No duplicate members found", 200, new ArrayList<>());
            }

            // Group by mobile and filter only those with duplicates
            Map<String, List<Members>> groupedByMobile = allMembers.stream()
                    .collect(Collectors.groupingBy(Members::getMobile));

            List<Map<String, Object>> duplicateResult = new ArrayList<>();
            for (Map.Entry<String, List<Members>> entry : groupedByMobile.entrySet()) {
                if (entry.getValue().size() > 1) {
                    for (Members member : entry.getValue()) {
                        Map<String, Object> memberMap = new HashMap<>();
                        memberMap.put("member_id", member.getMemberId());
                        memberMap.put("mobile", member.getMobile());
                        memberMap.put("name", member.getName());
                        memberMap.put("gender", member.getGender());
                        memberMap.put("registration_no", member.getRegistrationNo());
                        memberMap.put("registration_type", member.getRegistrationType());
                        memberMap.put("city", member.getCity());
                        memberMap.put("membership_date", member.getMembershipDate());
                        memberMap.put("expiry_date", member.getExpiryDate());
                        memberMap.put("voter", member.getVoter());
                        memberMap.put("gm_lm_member_type", member.getGmLmMemberType());
                        memberMap.put("updated_by", member.getUpdatedBy());
                        memberMap.put("status", member.getStatus());
                        memberMap.put("duplicate_count", entry.getValue().size());
                        duplicateResult.add(memberMap);
                    }
                }
            }

            if (duplicateResult.isEmpty()) {
                log.info("No duplicate members found with filter={}", mobileFilter);
                return utility.buildResponse("No duplicate members found", 200, new ArrayList<>());
            }

            log.info("Found {} member records in duplicate groups with filter={}", duplicateResult.size(), mobileFilter);
            return utility.buildResponse("Duplicate members fetched successfully", 200, duplicateResult);

        } catch (Exception e) {
            log.error("Error fetching duplicate members", e);
            return utility.buildResponse("Error fetching duplicate members: " + e.getMessage(), 500, null);
        }
    }

    @Override
    public GenericApiResponse<Object> updateMemberStatus(String memberId, String newStatus) {
        try {
            log.info("Updating status for memberId={} to newStatus={}", memberId, newStatus);

            String normalizedStatus = normalizeStatus(newStatus);

            // Validate status
            if (!isValidStatus(normalizedStatus)) {
                return utility.buildResponse("Invalid status. Allowed values: ACTIVE, INACTIVE, DELETED", 400, null);
            }

            Optional<Members> memberOpt = membersRepository.findByMemberId(memberId);
            if (!memberOpt.isPresent()) {
                log.warn("Member not found for memberId={}", memberId);
                return utility.buildResponse("Member not found", 404, null);
            }

            Members member = memberOpt.get();
            String oldStatus = member.getStatus();
            member.setStatus(normalizedStatus);
            member.setUpdatedDate(LocalDateTime.now());
            member.setUpdatedBy("admin");

            membersRepository.save(member);

            log.info("Status updated successfully for memberId={} from {} to {}", memberId, oldStatus, newStatus);

            Map<String, Object> response = new HashMap<>();
            response.put("memberId", memberId);
            response.put("oldStatus", oldStatus);
            response.put("newStatus", normalizedStatus);
            response.put("updatedDate", member.getUpdatedDate());

            return utility.buildResponse("Member status updated successfully", 200, response);

        } catch (Exception e) {
            log.error("Error updating member status for memberId={}", memberId, e);
            return utility.buildResponse("Error updating member status: " + e.getMessage(), 500, null);
        }
    }

    @Override
    @Transactional
    public GenericApiResponse<Object> bulkUpdateMemberStatus(List<String> memberIds, String newStatus) {
        try {
            log.info("Bulk updating status for {} members to newStatus={}", memberIds.size(), newStatus);

            String normalizedStatus = normalizeStatus(newStatus);

            // Validate status
            if (!isValidStatus(normalizedStatus)) {
                return utility.buildResponse("Invalid status. Allowed values: ACTIVE, INACTIVE, DELETED", 400, null);
            }

            if (memberIds == null || memberIds.isEmpty()) {
                return utility.buildResponse("Member IDs list is empty", 400, null);
            }

            int successCount = 0;
            int failureCount = 0;
            List<String> failedIds = new ArrayList<>();

            for (String memberId : memberIds) {
                try {
                    Optional<Members> memberOpt = membersRepository.findByMemberId(memberId);
                    if (memberOpt.isPresent()) {
                        Members member = memberOpt.get();
                        member.setStatus(normalizedStatus);
                        member.setUpdatedDate(LocalDateTime.now());
                        member.setUpdatedBy("admin");

                        membersRepository.save(member);
                        successCount++;

                        if (successCount % 100 == 0) {
                            log.info("Bulk status update progress: {} of {} completed", successCount, memberIds.size());
                        }
                    } else {
                        failureCount++;
                        failedIds.add(memberId);
                        log.warn("Member not found: {}", memberId);
                    }
                } catch (Exception e) {
                    failureCount++;
                    failedIds.add(memberId);
                    log.error("Error updating status for memberId={}", memberId, e);
                }
            }

            log.info("Bulk status update completed: {} successful, {} failed", successCount, failureCount);

            Map<String, Object> response = new HashMap<>();
            response.put("totalRequested", memberIds.size());
            response.put("successCount", successCount);
            response.put("failureCount", failureCount);
            response.put("newStatus", normalizedStatus);
            response.put("updatedDate", LocalDateTime.now());

            if (!failedIds.isEmpty()) {
                response.put("failedIds", failedIds);
            }

            return utility.buildResponse("Bulk status update completed", 200, response);

        } catch (Exception e) {
            log.error("Error in bulk status update", e);
            return utility.buildResponse("Error in bulk status update: " + e.getMessage(), 500, null);
        }
    }

    private String normalizeStatus(String status) {
        return status == null ? null : status.trim().toUpperCase();
    }

    private boolean isValidStatus(String status) {
        return status != null && (status.equals("ACTIVE") || status.equals("INACTIVE") || status.equals("DELETED"));
    }
}
