package com.secureone.auth.account;

import com.secureone.auth.user.UserCredential;
import com.secureone.auth.user.UserCredentialRepository;
import java.util.UUID;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserPasswordService {

    private final UserCredentialRepository credentials;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService policy;

    public UserPasswordService(
            UserCredentialRepository credentials,
            PasswordEncoder passwordEncoder,
            PasswordPolicyService policy) {
        this.credentials = credentials;
        this.passwordEncoder = passwordEncoder;
        this.policy = policy;
    }

    public boolean hasPassword(UUID userId) {
        return credentials.findFirstByUserIdAndCurrentTrueOrderByCreatedAtDescIdDesc(userId).isPresent();
    }

    public void setPassword(UUID userId, String plainPassword) {
        setPassword(userId, plainPassword, null);
    }

    public void changePassword(UUID userId, String currentPassword, String newPassword, UUID applicationId) {
        var cred = credentials
                .findFirstByUserIdAndCurrentTrueOrderByCreatedAtDescIdDesc(userId)
                .orElseThrow(() -> new BadCredentialsException("No password credential on file"));
        if (!passwordEncoder.matches(currentPassword, cred.getPasswordHash())) {
            throw new BadCredentialsException("Current password is incorrect");
        }
        setPassword(userId, newPassword, applicationId);
    }

    public void setPassword(UUID userId, String plainPassword, UUID applicationId) {
        policy.validate(plainPassword, applicationId);
        credentials.clearCurrentForUser(userId);
        credentials.flush();
        UserCredential cred = new UserCredential();
        cred.setUserId(userId);
        cred.setPasswordHash(passwordEncoder.encode(plainPassword));
        cred.setAlgorithm("bcrypt");
        cred.setCurrent(true);
        credentials.saveAndFlush(cred);
    }

    public void removePassword(UUID userId) {
        credentials.findByUserId(userId).forEach(credentials::delete);
        credentials.flush();
    }
}
