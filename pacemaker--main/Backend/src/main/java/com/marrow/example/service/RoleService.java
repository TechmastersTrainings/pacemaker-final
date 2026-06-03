package com.marrow.example.service;

import com.marrow.example.dto.RoleResponseDto;
import com.marrow.example.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {
    private final RoleRepository roleRepository;

    public List<RoleResponseDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(r -> RoleResponseDto.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .permissions(r.getPermissions().stream().map(p -> p.getName()).collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }
}
