package com.hireconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.hireconnect.entity.Asset;

@Repository
public interface AssetRepository extends JpaRepository<Asset, Long> {

    Optional<Asset> findBySerialNumber(String serialNumber);

    List<Asset> findByAssetType(String assetType);

    List<Asset> findByEmployeeId(String employeeId);

    @Query("SELECT a FROM Asset a WHERE " +
           "LOWER(a.employeeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.employeeId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.makeModel) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Asset> searchAssets(@Param("search") String search);

    @Query("SELECT a FROM Asset a WHERE a.assetType = :type AND " +
           "(LOWER(a.employeeName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.employeeId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.makeModel) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(a.serialNumber) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Asset> searchAssetsByType(@Param("type") String type, @Param("search") String search);

    long countByAssetType(String assetType);
}