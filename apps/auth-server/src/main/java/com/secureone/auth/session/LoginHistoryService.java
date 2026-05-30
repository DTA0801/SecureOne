package com.secureone.auth.session;

import com.secureone.auth.user.UserAccount;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LoginHistoryService {

    private final LoginHistoryRepository repository;

    public LoginHistoryService(LoginHistoryRepository repository) {
        this.repository = repository;
    }

    public void record(
            UserAccount user, String result, String ip, String device, String method, String location) {
        LoginHistory row = new LoginHistory();
        row.setTenantId(user.getTenantId());
        row.setUserId(user.getId());
        row.setResult(result);
        row.setIp(ip != null ? ip : "unknown");
        row.setDevice(device != null ? device : "unknown");
        Map<String, Object> geo = new HashMap<>();
        geo.put("location", location != null ? location : "—");
        geo.put("method", method);
        geo.put("actorEmail", user.getEmail());
        row.setGeo(geo);
        repository.save(row);
    }
}
