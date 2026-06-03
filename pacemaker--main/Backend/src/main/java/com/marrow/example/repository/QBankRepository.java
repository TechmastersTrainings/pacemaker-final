package com.marrow.example.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.marrow.example.entity.QBank;

public interface QBankRepository
        extends JpaRepository<QBank, Long> {

}