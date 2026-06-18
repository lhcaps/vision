-- CreateTable
CREATE TABLE `agencies` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `agency_code` VARCHAR(100) NULL,
    `agency_name` VARCHAR(255) NOT NULL,
    `agency_type` VARCHAR(50) NOT NULL,
    `parent_agency_id` BIGINT UNSIGNED NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_agencies_code`(`agency_code`),
    INDEX `fk_agencies_parent`(`parent_agency_id`),
    INDEX `idx_agencies_name`(`agency_name`),
    INDEX `idx_agencies_type`(`agency_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `actor_name` VARCHAR(255) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(100) NOT NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `case_id` BIGINT UNSIGNED NULL,
    `old_value_json` JSON NULL,
    `new_value_json` JSON NULL,
    `ip_address` VARCHAR(100) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_audit_logs_action`(`action`),
    INDEX `idx_audit_logs_actor`(`actor_name`),
    INDEX `idx_audit_logs_case`(`case_id`),
    INDEX `idx_audit_logs_created_at`(`created_at`),
    INDEX `idx_audit_logs_entity`(`entity_type`, `entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `case_id` BIGINT UNSIGNED NOT NULL,
    `official_id` BIGINT UNSIGNED NULL,
    `assignment_role` VARCHAR(100) NOT NULL,
    `assigned_date` DATE NULL,
    `ended_date` DATE NULL,
    `decision_no` VARCHAR(100) NULL,
    `decision_date` DATE NULL,
    `note` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_case_assignments_case`(`case_id`),
    INDEX `idx_case_assignments_official`(`official_id`),
    INDEX `idx_case_assignments_role`(`assignment_role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `case_id` BIGINT UNSIGNED NOT NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `event_title` VARCHAR(500) NOT NULL,
    `event_description` TEXT NULL,
    `stage_code` VARCHAR(100) NULL,
    `status_before` VARCHAR(100) NULL,
    `status_after` VARCHAR(100) NULL,
    `event_date` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `related_person_id` BIGINT UNSIGNED NULL,
    `related_template_id` BIGINT UNSIGNED NULL,
    `created_by_name` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_case_events_case`(`case_id`),
    INDEX `idx_case_events_date`(`event_date`),
    INDEX `idx_case_events_person`(`related_person_id`),
    INDEX `idx_case_events_type`(`event_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_offenses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `case_id` BIGINT UNSIGNED NOT NULL,
    `person_id` BIGINT UNSIGNED NULL,
    `offense_id` BIGINT UNSIGNED NOT NULL,
    `legal_article_id` BIGINT UNSIGNED NULL,
    `offense_description` TEXT NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_case_offenses_case`(`case_id`),
    INDEX `idx_case_offenses_deleted`(`is_deleted`),
    INDEX `idx_case_offenses_legal_article`(`legal_article_id`),
    INDEX `idx_case_offenses_offense`(`offense_id`),
    INDEX `idx_case_offenses_person`(`person_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `case_people` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `case_id` BIGINT UNSIGNED NOT NULL,
    `person_id` BIGINT UNSIGNED NOT NULL,
    `role_type` VARCHAR(100) NOT NULL,
    `person_order` INTEGER NOT NULL DEFAULT 1,
    `legal_status` VARCHAR(100) NULL,
    `is_primary` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `note` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_case_people_case`(`case_id`),
    INDEX `idx_case_people_person`(`person_id`),
    INDEX `idx_case_people_role`(`role_type`),
    INDEX `idx_case_people_status`(`legal_status`),
    UNIQUE INDEX `uq_case_people_unique_role`(`case_id`, `person_id`, `role_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cases` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `case_code` VARCHAR(100) NOT NULL,
    `national_case_code` VARCHAR(100) NULL,
    `case_title` VARCHAR(500) NOT NULL,
    `case_summary` TEXT NULL,
    `case_type` VARCHAR(50) NOT NULL DEFAULT 'CRIMINAL_CASE',
    `source_type` VARCHAR(50) NULL,
    `current_stage` VARCHAR(100) NOT NULL DEFAULT 'RECEPTION',
    `current_status` VARCHAR(100) NOT NULL DEFAULT 'DRAFT',
    `ward_id` BIGINT UNSIGNED NULL,
    `agency_id` BIGINT UNSIGNED NULL,
    `received_date` DATE NULL,
    `accepted_date` DATE NULL,
    `prosecuted_date` DATE NULL,
    `closed_date` DATE NULL,
    `priority` VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    `note` TEXT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_by_name` VARCHAR(255) NULL,
    `updated_by_name` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_cases_code`(`case_code`),
    INDEX `idx_cases_agency`(`agency_id`),
    INDEX `idx_cases_deleted`(`is_deleted`),
    INDEX `idx_cases_received_date`(`received_date`),
    INDEX `idx_cases_stage_status`(`current_stage`, `current_status`),
    INDEX `idx_cases_title`(`case_title`),
    INDEX `idx_cases_ward`(`ward_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `data_fields` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `field_key` VARCHAR(255) NOT NULL,
    `field_label` VARCHAR(500) NOT NULL,
    `field_group` VARCHAR(100) NOT NULL,
    `data_type` VARCHAR(50) NOT NULL DEFAULT 'TEXT',
    `source_path` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_data_fields_key`(`field_key`),
    INDEX `idx_data_fields_active`(`is_active`),
    INDEX `idx_data_fields_group`(`field_group`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_generation_batches` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `case_id` BIGINT UNSIGNED NOT NULL,
    `batch_code` VARCHAR(100) NOT NULL,
    `requested_formats` JSON NULL,
    `selected_templates_snapshot` JSON NULL,
    `target_selection_snapshot` JSON NULL,
    `status` VARCHAR(100) NOT NULL DEFAULT 'PENDING',
    `total_documents` INTEGER NOT NULL DEFAULT 0,
    `success_documents` INTEGER NOT NULL DEFAULT 0,
    `failed_documents` INTEGER NOT NULL DEFAULT 0,
    `error_message` TEXT NULL,
    `created_by_name` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` DATETIME(0) NULL,

    UNIQUE INDEX `uq_document_batches_code`(`batch_code`),
    INDEX `idx_document_batches_case`(`case_id`),
    INDEX `idx_document_batches_created_at`(`created_at`),
    INDEX `idx_document_batches_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_reviews` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `generated_document_id` BIGINT UNSIGNED NOT NULL,
    `review_action` VARCHAR(100) NOT NULL,
    `reviewer_name` VARCHAR(255) NULL,
    `review_note` TEXT NULL,
    `old_status` VARCHAR(100) NULL,
    `new_status` VARCHAR(100) NOT NULL,
    `reviewed_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_document_reviews_action`(`review_action`),
    INDEX `idx_document_reviews_document`(`generated_document_id`),
    INDEX `idx_document_reviews_reviewed_at`(`reviewed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evidence_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `case_id` BIGINT UNSIGNED NOT NULL,
    `evidence_code` VARCHAR(100) NULL,
    `evidence_name` VARCHAR(500) NOT NULL,
    `evidence_type` VARCHAR(100) NULL,
    `quantity` VARCHAR(100) NULL,
    `unit` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `current_status` VARCHAR(100) NOT NULL DEFAULT 'RECORDED',
    `storage_location` TEXT NULL,
    `owner_person_id` BIGINT UNSIGNED NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_evidence_owner`(`owner_person_id`),
    INDEX `idx_evidence_case`(`case_id`),
    INDEX `idx_evidence_deleted`(`is_deleted`),
    INDEX `idx_evidence_name`(`evidence_name`),
    INDEX `idx_evidence_status`(`current_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generated_document_files` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `generated_document_id` BIGINT UNSIGNED NOT NULL,
    `stored_file_id` BIGINT UNSIGNED NULL,
    `file_format` VARCHAR(20) NOT NULL,
    `file_name` VARCHAR(500) NOT NULL,
    `file_path` TEXT NOT NULL,
    `file_size_bytes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `checksum` VARCHAR(128) NULL,
    `is_final` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `fk_generated_document_files_stored_file`(`stored_file_id`),
    INDEX `idx_generated_document_files_document`(`generated_document_id`),
    INDEX `idx_generated_document_files_final`(`is_final`),
    INDEX `idx_generated_document_files_format`(`file_format`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `generated_documents` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT UNSIGNED NULL,
    `case_id` BIGINT UNSIGNED NOT NULL,
    `template_id` BIGINT UNSIGNED NOT NULL,
    `template_version_id` BIGINT UNSIGNED NULL,
    `document_code` VARCHAR(100) NULL,
    `document_title` VARCHAR(500) NOT NULL,
    `target_scope` VARCHAR(100) NOT NULL,
    `target_person_id` BIGINT UNSIGNED NULL,
    `target_evidence_id` BIGINT UNSIGNED NULL,
    `target_event_id` BIGINT UNSIGNED NULL,
    `review_status` VARCHAR(100) NOT NULL DEFAULT 'WAITING_REVIEW',
    `render_payload_snapshot` JSON NULL,
    `validation_result` JSON NULL,
    `generated_by_name` VARCHAR(255) NULL,
    `approved_by_name` VARCHAR(255) NULL,
    `generated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `approved_at` DATETIME(0) NULL,
    `note` TEXT NULL,

    INDEX `fk_generated_documents_evidence`(`target_evidence_id`),
    INDEX `fk_generated_documents_template_version`(`template_version_id`),
    INDEX `idx_generated_documents_batch`(`batch_id`),
    INDEX `idx_generated_documents_case`(`case_id`),
    INDEX `idx_generated_documents_generated_at`(`generated_at`),
    INDEX `idx_generated_documents_person`(`target_person_id`),
    INDEX `idx_generated_documents_status`(`review_status`),
    INDEX `idx_generated_documents_template`(`template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_batches` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `batch_code` VARCHAR(100) NOT NULL,
    `import_type` VARCHAR(100) NOT NULL,
    `source_name` VARCHAR(500) NULL,
    `source_path` TEXT NULL,
    `status` VARCHAR(100) NOT NULL DEFAULT 'PENDING',
    `total_files` INTEGER NOT NULL DEFAULT 0,
    `processed_files` INTEGER NOT NULL DEFAULT 0,
    `failed_files` INTEGER NOT NULL DEFAULT 0,
    `total_rows` INTEGER NOT NULL DEFAULT 0,
    `valid_rows` INTEGER NOT NULL DEFAULT 0,
    `invalid_rows` INTEGER NOT NULL DEFAULT 0,
    `error_message` TEXT NULL,
    `created_by_name` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` DATETIME(0) NULL,

    UNIQUE INDEX `uq_import_batches_code`(`batch_code`),
    INDEX `idx_import_batches_created_at`(`created_at`),
    INDEX `idx_import_batches_status`(`status`),
    INDEX `idx_import_batches_type`(`import_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_files` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT UNSIGNED NOT NULL,
    `stored_file_id` BIGINT UNSIGNED NULL,
    `original_file_name` VARCHAR(500) NOT NULL,
    `original_path` TEXT NULL,
    `file_ext` VARCHAR(20) NULL,
    `mime_type` VARCHAR(255) NULL,
    `file_size_bytes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `detected_group_code` VARCHAR(100) NULL,
    `detected_template_code` VARCHAR(100) NULL,
    `parse_status` VARCHAR(100) NOT NULL DEFAULT 'PENDING',
    `raw_text` LONGTEXT NULL,
    `parsed_json` JSON NULL,
    `error_message` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `parsed_at` DATETIME(0) NULL,

    INDEX `fk_import_files_stored_file`(`stored_file_id`),
    INDEX `idx_import_files_batch`(`batch_id`),
    INDEX `idx_import_files_ext`(`file_ext`),
    INDEX `idx_import_files_name`(`original_file_name`),
    INDEX `idx_import_files_status`(`parse_status`),
    INDEX `idx_import_files_template_code`(`detected_template_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_mapping_profile_columns` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `profile_id` BIGINT UNSIGNED NOT NULL,
    `source_column_name` VARCHAR(255) NOT NULL,
    `source_column_index` INTEGER NULL,
    `target_field_key` VARCHAR(255) NOT NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `transform_rule` JSON NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_mapping_profile_columns_profile`(`profile_id`),
    INDEX `idx_mapping_profile_columns_target`(`target_field_key`),
    UNIQUE INDEX `uq_mapping_profile_column`(`profile_id`, `source_column_name`, `target_field_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_mapping_profiles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `profile_name` VARCHAR(255) NOT NULL,
    `source_file_ext` VARCHAR(20) NULL,
    `sheet_name` VARCHAR(255) NULL,
    `header_row_index` INTEGER NOT NULL DEFAULT 1,
    `data_start_row_index` INTEGER NOT NULL DEFAULT 2,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_mapping_profiles_active`(`is_active`),
    INDEX `idx_mapping_profiles_name`(`profile_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_mapping_run_rows` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `run_id` BIGINT UNSIGNED NOT NULL,
    `row_index` INTEGER NOT NULL,
    `raw_row_json` JSON NULL,
    `mapped_payload_json` JSON NULL,
    `validation_status` VARCHAR(100) NOT NULL DEFAULT 'PENDING',
    `validation_errors` JSON NULL,
    `committed_case_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_mapping_run_rows_case`(`committed_case_id`),
    INDEX `idx_mapping_run_rows_run`(`run_id`),
    INDEX `idx_mapping_run_rows_status`(`validation_status`),
    UNIQUE INDEX `uq_mapping_run_row`(`run_id`, `row_index`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_mapping_runs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT UNSIGNED NULL,
    `profile_id` BIGINT UNSIGNED NULL,
    `source_file_id` BIGINT UNSIGNED NULL,
    `status` VARCHAR(100) NOT NULL DEFAULT 'PENDING',
    `total_rows` INTEGER NOT NULL DEFAULT 0,
    `valid_rows` INTEGER NOT NULL DEFAULT 0,
    `invalid_rows` INTEGER NOT NULL DEFAULT 0,
    `committed_rows` INTEGER NOT NULL DEFAULT 0,
    `skipped_rows` INTEGER NOT NULL DEFAULT 0,
    `failed_rows` INTEGER NOT NULL DEFAULT 0,
    `preview_json` JSON NULL,
    `error_message` TEXT NULL,
    `created_by_name` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completed_at` DATETIME(0) NULL,

    INDEX `fk_mapping_runs_file`(`source_file_id`),
    INDEX `idx_mapping_runs_batch`(`batch_id`),
    INDEX `idx_mapping_runs_created_at`(`created_at`),
    INDEX `idx_mapping_runs_profile`(`profile_id`),
    INDEX `idx_mapping_runs_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `legal_articles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `law_name` VARCHAR(255) NOT NULL DEFAULT 'Bộ luật Hình sự',
    `law_year` VARCHAR(50) NULL,
    `article_no` VARCHAR(50) NOT NULL,
    `clause_no` VARCHAR(50) NULL,
    `point_no` VARCHAR(50) NULL,
    `display_text` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_legal_articles_article`(`article_no`),
    INDEX `idx_legal_articles_display`(`display_text`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offenses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `offense_code` VARCHAR(100) NULL,
    `offense_name` VARCHAR(255) NOT NULL,
    `offense_group` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_offenses_code`(`offense_code`),
    INDEX `idx_offenses_group`(`offense_group`),
    INDEX `idx_offenses_name`(`offense_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `officials` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `agency_id` BIGINT UNSIGNED NULL,
    `full_name` VARCHAR(255) NOT NULL,
    `username` VARCHAR(100) NULL,
    `password_hash` VARCHAR(255) NULL,
    `position_title` VARCHAR(255) NULL,
    `rank_title` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `email` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `role` VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL',
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_officials_username`(`username`),
    INDEX `idx_officials_agency`(`agency_id`),
    INDEX `idx_officials_name`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `people` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `full_name` VARCHAR(255) NOT NULL,
    `other_name` VARCHAR(255) NULL,
    `gender` VARCHAR(20) NULL,
    `date_of_birth` DATE NULL,
    `birth_year` SMALLINT NULL,
    `place_of_birth` VARCHAR(500) NULL,
    `identity_no` VARCHAR(50) NULL,
    `identity_issued_date` DATE NULL,
    `identity_issued_place` VARCHAR(255) NULL,
    `nationality` VARCHAR(100) NULL DEFAULT 'Việt Nam',
    `ethnicity` VARCHAR(100) NULL,
    `religion` VARCHAR(100) NULL,
    `occupation` VARCHAR(255) NULL,
    `workplace` VARCHAR(500) NULL,
    `permanent_address` TEXT NULL,
    `current_address` TEXT NULL,
    `residence_address` TEXT NULL,
    `phone` VARCHAR(50) NULL,
    `note` TEXT NULL,
    `is_deleted` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_people_birth_year`(`birth_year`),
    INDEX `idx_people_deleted`(`is_deleted`),
    INDEX `idx_people_identity`(`identity_no`),
    INDEX `idx_people_name`(`full_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `storage_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `storage_root_path` TEXT NOT NULL,
    `max_storage_gb` INTEGER NOT NULL DEFAULT 500,
    `used_storage_bytes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `warning_threshold_percent` INTEGER NOT NULL DEFAULT 85,
    `allow_large_upload` BOOLEAN NOT NULL DEFAULT true,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stored_files` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `file_category` VARCHAR(100) NOT NULL,
    `original_file_name` VARCHAR(500) NOT NULL,
    `stored_file_name` VARCHAR(500) NOT NULL,
    `file_ext` VARCHAR(20) NULL,
    `mime_type` VARCHAR(255) NULL,
    `file_size_bytes` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `relative_path` TEXT NOT NULL,
    `absolute_path` TEXT NULL,
    `checksum` VARCHAR(128) NULL,
    `related_entity_type` VARCHAR(100) NULL,
    `related_entity_id` BIGINT UNSIGNED NULL,
    `created_by_name` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_stored_files_category`(`file_category`),
    INDEX `idx_stored_files_created_at`(`created_at`),
    INDEX `idx_stored_files_related`(`related_entity_type`, `related_entity_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_groups` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `group_code` VARCHAR(100) NOT NULL,
    `group_name` VARCHAR(500) NOT NULL,
    `group_order` INTEGER NOT NULL DEFAULT 1,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_template_groups_code`(`group_code`),
    INDEX `idx_template_groups_order`(`group_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_required_fields` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `template_id` BIGINT UNSIGNED NOT NULL,
    `data_field_id` BIGINT UNSIGNED NOT NULL,
    `placeholder_name` VARCHAR(255) NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT true,
    `applies_to_scope` VARCHAR(100) NOT NULL DEFAULT 'CASE',
    `missing_message` VARCHAR(500) NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_template_required_fields_data_field`(`data_field_id`),
    INDEX `idx_template_required_fields_template`(`template_id`),
    UNIQUE INDEX `uq_template_required_field`(`template_id`, `data_field_id`, `placeholder_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_versions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `template_id` BIGINT UNSIGNED NOT NULL,
    `version_no` INTEGER NOT NULL DEFAULT 1,
    `original_file_path` TEXT NULL,
    `normalized_docx_path` TEXT NULL,
    `output_name_pattern` VARCHAR(500) NULL,
    `placeholder_summary` JSON NULL,
    `checksum` VARCHAR(128) NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by_name` VARCHAR(255) NULL,
    `created_by_official_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_template_versions_created_by_official`(`created_by_official_id`),
    INDEX `idx_template_versions_active`(`is_active`),
    INDEX `idx_template_versions_default`(`is_default`),
    INDEX `idx_template_versions_template`(`template_id`),
    UNIQUE INDEX `uq_template_version`(`template_id`, `version_no`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `templates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `template_code` VARCHAR(100) NOT NULL,
    `template_no` VARCHAR(50) NULL,
    `template_name` VARCHAR(500) NOT NULL,
    `group_id` BIGINT UNSIGNED NULL,
    `source_file_name` VARCHAR(500) NULL,
    `original_ext` VARCHAR(20) NULL,
    `stage_code` VARCHAR(100) NULL,
    `render_scope` VARCHAR(100) NOT NULL DEFAULT 'CASE_LEVEL',
    `output_strategy` VARCHAR(100) NOT NULL DEFAULT 'ONE_FILE_PER_CASE',
    `default_output_formats` JSON NULL,
    `requires_review` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_by_official_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_templates_code`(`template_code`),
    INDEX `idx_templates_active`(`is_active`),
    INDEX `idx_templates_created_by_official`(`created_by_official_id`),
    INDEX `idx_templates_group`(`group_id`),
    INDEX `idx_templates_name`(`template_name`),
    INDEX `idx_templates_scope`(`render_scope`),
    INDEX `idx_templates_stage`(`stage_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wards` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `ward_code` VARCHAR(50) NULL,
    `ward_name` VARCHAR(255) NOT NULL,
    `district_name` VARCHAR(255) NULL,
    `province_name` VARCHAR(255) NULL DEFAULT 'Thành phố Hồ Chí Minh',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_wards_code`(`ward_code`),
    INDEX `idx_wards_name`(`ward_name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_sessions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `token_hash` CHAR(64) NOT NULL,
    `official_id` BIGINT UNSIGNED NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `ip_address` VARCHAR(100) NULL,
    `user_agent` TEXT NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_auth_sessions_token`(`token_hash`),
    INDEX `idx_auth_sessions_official`(`official_id`),
    INDEX `idx_auth_sessions_expires`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agencies` ADD CONSTRAINT `fk_agencies_parent` FOREIGN KEY (`parent_agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `fk_audit_logs_case` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_assignments` ADD CONSTRAINT `fk_case_assignments_case` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_assignments` ADD CONSTRAINT `fk_case_assignments_official` FOREIGN KEY (`official_id`) REFERENCES `officials`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_events` ADD CONSTRAINT `fk_case_events_case` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_events` ADD CONSTRAINT `fk_case_events_person` FOREIGN KEY (`related_person_id`) REFERENCES `people`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_offenses` ADD CONSTRAINT `fk_case_offenses_case` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_offenses` ADD CONSTRAINT `fk_case_offenses_legal_article` FOREIGN KEY (`legal_article_id`) REFERENCES `legal_articles`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_offenses` ADD CONSTRAINT `fk_case_offenses_offense` FOREIGN KEY (`offense_id`) REFERENCES `offenses`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_offenses` ADD CONSTRAINT `fk_case_offenses_person` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_people` ADD CONSTRAINT `fk_case_people_case` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `case_people` ADD CONSTRAINT `fk_case_people_person` FOREIGN KEY (`person_id`) REFERENCES `people`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cases` ADD CONSTRAINT `fk_cases_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `cases` ADD CONSTRAINT `fk_cases_ward` FOREIGN KEY (`ward_id`) REFERENCES `wards`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `document_generation_batches` ADD CONSTRAINT `fk_document_batches_case` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `document_reviews` ADD CONSTRAINT `fk_document_reviews_document` FOREIGN KEY (`generated_document_id`) REFERENCES `generated_documents`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `evidence_items` ADD CONSTRAINT `fk_evidence_case` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `evidence_items` ADD CONSTRAINT `fk_evidence_owner` FOREIGN KEY (`owner_person_id`) REFERENCES `people`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `generated_document_files` ADD CONSTRAINT `fk_generated_document_files_document` FOREIGN KEY (`generated_document_id`) REFERENCES `generated_documents`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `generated_document_files` ADD CONSTRAINT `fk_generated_document_files_stored_file` FOREIGN KEY (`stored_file_id`) REFERENCES `stored_files`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `generated_documents` ADD CONSTRAINT `fk_generated_documents_batch` FOREIGN KEY (`batch_id`) REFERENCES `document_generation_batches`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `generated_documents` ADD CONSTRAINT `fk_generated_documents_case` FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `generated_documents` ADD CONSTRAINT `fk_generated_documents_evidence` FOREIGN KEY (`target_evidence_id`) REFERENCES `evidence_items`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `generated_documents` ADD CONSTRAINT `fk_generated_documents_person` FOREIGN KEY (`target_person_id`) REFERENCES `people`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `generated_documents` ADD CONSTRAINT `fk_generated_documents_template` FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `generated_documents` ADD CONSTRAINT `fk_generated_documents_template_version` FOREIGN KEY (`template_version_id`) REFERENCES `template_versions`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_files` ADD CONSTRAINT `fk_import_files_batch` FOREIGN KEY (`batch_id`) REFERENCES `import_batches`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_files` ADD CONSTRAINT `fk_import_files_stored_file` FOREIGN KEY (`stored_file_id`) REFERENCES `stored_files`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_mapping_profile_columns` ADD CONSTRAINT `fk_mapping_profile_columns_profile` FOREIGN KEY (`profile_id`) REFERENCES `import_mapping_profiles`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_mapping_run_rows` ADD CONSTRAINT `fk_mapping_run_rows_case` FOREIGN KEY (`committed_case_id`) REFERENCES `cases`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_mapping_run_rows` ADD CONSTRAINT `fk_mapping_run_rows_run` FOREIGN KEY (`run_id`) REFERENCES `import_mapping_runs`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_mapping_runs` ADD CONSTRAINT `fk_mapping_runs_batch` FOREIGN KEY (`batch_id`) REFERENCES `import_batches`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_mapping_runs` ADD CONSTRAINT `fk_mapping_runs_file` FOREIGN KEY (`source_file_id`) REFERENCES `import_files`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `import_mapping_runs` ADD CONSTRAINT `fk_mapping_runs_profile` FOREIGN KEY (`profile_id`) REFERENCES `import_mapping_profiles`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `officials` ADD CONSTRAINT `fk_officials_agency` FOREIGN KEY (`agency_id`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `template_required_fields` ADD CONSTRAINT `fk_template_required_fields_data_field` FOREIGN KEY (`data_field_id`) REFERENCES `data_fields`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `template_required_fields` ADD CONSTRAINT `fk_template_required_fields_template` FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `template_versions` ADD CONSTRAINT `fk_template_versions_created_by_official` FOREIGN KEY (`created_by_official_id`) REFERENCES `officials`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `template_versions` ADD CONSTRAINT `fk_template_versions_template` FOREIGN KEY (`template_id`) REFERENCES `templates`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `fk_templates_created_by_official` FOREIGN KEY (`created_by_official_id`) REFERENCES `officials`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `templates` ADD CONSTRAINT `fk_templates_group` FOREIGN KEY (`group_id`) REFERENCES `template_groups`(`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `auth_sessions` ADD CONSTRAINT `fk_auth_sessions_official` FOREIGN KEY (`official_id`) REFERENCES `officials`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

