package com.dba.alld.controller;

import com.dba.alld.dto.GenericApiResponse;
import com.dba.alld.request.SubscriptionRequest;
import com.dba.alld.service.MemberService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 *
 * //todo:
 *This will be used to renew a subscription of GM.
 * API 1- getMemberList
 * API 2 - getGmListByStatus
 * API 3 - renewSubscription(PSEUDOCODE given )
 *     'GM_SUBSCRIPTION_CHARGE_PER_MONTH' => '25',
 *     'GM_SUBSCRIPTION_CHARGE_PER_MONTH_OLD' => '15',
 * API 4 - getLatestSubscriptionList
 * API 5 - getLatestSubscriptionListForMember
 *
 * FUNCTION renewSubscription(request):
 *
 *     LOG "renewSubscription started"
 *
 *     // ----------------------------------------
 *     // 1. Read Input
 *     // ----------------------------------------
 *     memberId = request.POST("member_id")
 *     monthsToAdd = request.POST("no_of_months")
 *
 *     // ----------------------------------------
 *     // 2. Validate Token
 *     // ----------------------------------------
 *     IF CSRF_TOKEN_IS_INVALID:
 *         RETURN ERROR("Invalid token")
 *
 *     // ----------------------------------------
 *     // 3. Validate Inputs
 *     // ----------------------------------------
 *     IF memberId is empty:
 *         RETURN ERROR("Member ID is required")
 *
 *     IF monthsToAdd is empty OR monthsToAdd < 1:
 *         RETURN ERROR("Months must be at least 1")
 *
 *     START TRANSACTION
 *
 *     // ----------------------------------------
 *     // 4. Fetch member record
 *     // Table: members
 *     // ----------------------------------------
 *     member = SELECT * FROM members WHERE id = memberId
 *
 *     IF member does not exist:
 *         ROLLBACK
 *         RETURN ERROR("Member not found")
 *
 *     IF member.gm_lm_member_type != '1':   // Only General Members allowed
 *         ROLLBACK
 *         RETURN ERROR("Member is not a General Member")
 *
 *
 *     // ----------------------------------------
 *     // 5. Calculate subscription amount
 *     // Charge depends on expiry date
 *     // ----------------------------------------
 *     IF member.expiry_date <= '2023-02-27':
 *         ratePerMonth = GM_SUBSCRIPTION_CHARGE_PER_MONTH_OLD
 *     ELSE:
 *         ratePerMonth = GM_SUBSCRIPTION_CHARGE_PER_MONTH
 *
 *     amount = ratePerMonth * monthsToAdd
 *
 *     // ----------------------------------------
 *     // 6. Generate receipt (order_id)
 *     // ----------------------------------------
 *     currentTime = NOW()
 *     randomNum = RANDOM(1, 999999)
 *     receiptNo = FORMAT(currentTime, 'YmdH') + randomNum
 *
 *
 *     // ----------------------------------------
 *     // 7. Insert subscription history
 *     // Table: members_subscription_history
 *     // ----------------------------------------
 *     INSERT INTO members_subscription_history (
 *         member_id,
 *         amount,
 *         txn_type,
 *         txn_date,
 *         created_by,
 *         created_date,
 *         order_id,
 *         no_of_month,
 *         expiry_date
 *     )
 *     VALUES (
 *         memberId,
 *         amount,
 *         "SUBSCRIPTION",
 *         NOW(),
 *         currentUserId,
 *         NOW(),
 *         receiptNo,
 *         monthsToAdd,
 *         DATE_ADD(member.expiry_date, INTERVAL monthsToAdd MONTH)
 *     )
 *
 *     IF insert failed:
 *         ROLLBACK
 *         RETURN ERROR("Failed to record subscription history")
 *
 *
 *     // ----------------------------------------
 *     // 8. Update member expiry date
 *     // Table: members
 *     // ----------------------------------------
 *     UPDATE members
 *     SET expiry_date = DATE_ADD(expiry_date, INTERVAL monthsToAdd MONTH)
 *     WHERE id = memberId
 *
 *     IF update failed:
 *         ROLLBACK
 *         RETURN ERROR("Failed to update member validity")
 *
 *
 *     // ----------------------------------------
 *     // 9. Credit amount to DBA wallet
 *     // Table: ewallet_ledger / (handled by EwalletModel)
 *     // ----------------------------------------
 *     success = CREDIT_EWALLET(
 *         account_id = 1,
 *         amount = amount,
 *         description = "Subscription Fee for member " + member.member_id,
 *         reference = receiptNo,
 *         txn_type = "SUBSCRIPTION"
 *     )
 *
 *     IF NOT success:
 *         ROLLBACK
 *         RETURN ERROR("Failed to credit DBA account")
 *
 *
 *     // ----------------------------------------
 *     // 10. Send SMS (optional)
 *     // Table: sms_queue (inside SMSModel::scheduleNewSMS)
 *     // ----------------------------------------
 *     IF SMS_ENABLED AND member.mobile is not empty:
 *         smsText = "Hi " + member.name +
 *                   ", Your subscription extended for " + monthsToAdd +
 *                   " months. Member ID: " + member.member_id +
 *                   " Receipt: " + receiptNo
 *
 *         smsSuccess = INSERT INTO sms_queue (...) VALUES(...)
 *
 *         IF NOT smsSuccess:
 *             ROLLBACK
 *             RETURN ERROR("Failed to send SMS")
 *
 *
 *     // ----------------------------------------
 *     // 11. Commit transaction
 *     // ----------------------------------------
 *     COMMIT
 *
 *     RETURN receiptNo
 * */
@RestController
@RequestMapping("/api/v1/renewSubscription")
public class RenewSubscriptionController {

    @Autowired
    MemberService service;

    @PostMapping("/renew")
    public ResponseEntity<GenericApiResponse<Object>> listReceipt(
            @RequestBody SubscriptionRequest request
            ){
        return  ResponseEntity.ok(service.renewSubscription(request));
    }

    @PostMapping("/calculate")
    public ResponseEntity<GenericApiResponse<Object>> calculateRenewal(
            @RequestBody SubscriptionRequest request
    ) {
        return ResponseEntity.ok(service.calculateRenewalAmount(request));
    }


}
