package com.dba.alld.entities;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "role_menu_mapping_detail")
public class RoleMenuMappingDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "menu_id", nullable = false, length = 45)
    private String menuId;

    @Column(name = "role_id", nullable = false, length = 45)
    private String roleId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "add_access", nullable = false)
    private Boolean addAccess;

    @Column(name = "edit_access", nullable = false)
    private Boolean editAccess;

    @Column(name = "delete_access", nullable = false)
    private Boolean deleteAccess;

    @Column(name = "created_by", nullable = false, length = 20)
    private String createdBy;

    @Column(name = "created_date")
    private LocalDate createdDate;

    @Column(name = "updated_by", length = 20)
    private String updatedBy;

    @Column(name = "updated_date")
    private LocalDate updatedDate;
}

