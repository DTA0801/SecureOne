package com.secureone.auth.logging;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaDelete;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ApplicationLogMaintenanceService {

    @PersistenceContext
    private EntityManager entityManager;

    private final ApplicationLogRepository repository;

    public ApplicationLogMaintenanceService(ApplicationLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public long count(ApplicationLogFilter filter) {
        return repository.count(ApplicationLogSpecifications.from(filter, false));
    }

    @Transactional
    public int delete(ApplicationLogFilter filter) {
        Specification<ApplicationLog> spec = ApplicationLogSpecifications.from(filter, false);
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaDelete<ApplicationLog> delete = cb.createCriteriaDelete(ApplicationLog.class);
        Root<ApplicationLog> root = delete.from(ApplicationLog.class);
        Predicate predicate = spec.toPredicate(root, cb.createQuery(), cb);
        if (predicate != null) {
            delete.where(predicate);
        }
        return entityManager.createQuery(delete).executeUpdate();
    }
}
