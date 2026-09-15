-- DBA ALLD Database Schema
USE dba;

-- Create members table if not exists
CREATE TABLE IF NOT EXISTS members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(20) NOT NULL,
    member_type VARCHAR(50),
    name VARCHAR(60) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    relation VARCHAR(20) NOT NULL,
    guardian_name VARCHAR(60) NOT NULL,
    dob DATE,
    blood_group VARCHAR(20),
    registration_type VARCHAR(100) NOT NULL,
    registration_no VARCHAR(64),
    en_no VARCHAR(64),
    address VARCHAR(200) NOT NULL,
    city VARCHAR(60) NOT NULL,
    zip VARCHAR(10) NOT NULL,
    state VARCHAR(60) NOT NULL,
    ks_address VARCHAR(200) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    email VARCHAR(60),
    nominee_name VARCHAR(60) NOT NULL,
    nominee_mobile VARCHAR(20) NOT NULL,
    membership_date DATE,
    expiry_date DATE,
    bc_of_up_type VARCHAR(20) NOT NULL,
    bc_of_up_photo VARCHAR(200),
    voter VARCHAR(20) NOT NULL,
    affidavite VARCHAR(200),
    photo VARCHAR(200),
    qrcode VARCHAR(200),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_date DATETIME,
    created_by VARCHAR(60),
    updated_date DATETIME,
    updated_by VARCHAR(60),
    gm_lm_member_type INT NOT NULL DEFAULT 1,
    is_wm BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_member_id (member_id),
    INDEX idx_mobile (mobile),
    INDEX idx_name (name),
    INDEX idx_status (status),
    INDEX idx_is_wm (is_wm)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO members (
    member_id, member_type, name, gender, relation, guardian_name,
    dob, blood_group, registration_type, registration_no, en_no,
    address, city, zip, state, ks_address, mobile, email,
    nominee_name, nominee_mobile, membership_date, expiry_date,
    bc_of_up_type, voter, affidavite, photo, qrcode, status,
    created_date, created_by, gm_lm_member_type, is_wm
) VALUES
('POR00000001', 'General Member', 'Rajesh Kumar', 'Male', 'S/O', 'Mohan Lal',
 '1980-05-15', 'B+', 'C.O.P No.', '12345', 'EN001',
 '123 Civil Lines', 'Allahabad', '211001', 'UP', '456 Civil Lines', '9876543210', 'rajesh@example.com',
 'Sunita Kumar', '9876543211', '2020-01-01', '2026-03-31',
 'Agricultural', 'Yes', 'affidavit_001.pdf', 'photos/001.jpg', 'qrcode/001.png', 'ACTIVE',
 NOW(), 'admin', 1, FALSE),
('POR00000002', 'Life Member', 'Amit Sharma', 'Male', 'S/O', 'Rakesh Sharma',
 '1975-08-20', 'O+', 'C.O.P No.', '12346', 'EN002',
 '456 George Street', 'Allahabad', '211002', 'UP', '789 George Street', '9876543212', 'amit@example.com',
 'Priya Sharma', '9876543213', '2019-06-15', NULL,
 'Business', 'Yes', 'affidavit_002.pdf', 'photos/002.jpg', 'qrcode/002.png', 'ACTIVE',
 NOW(), 'admin', 2, FALSE),
('POR00000003', 'Welfare Member', 'Suresh Yadav', 'Male', 'S/O', 'Ram Yadav',
 '1985-03-10', 'A+', 'C.O.P No.', '12347', 'EN003',
 '789 MG Road', 'Allahabad', '211003', 'UP', '321 MG Road', '9876543214', 'suresh@example.com',
 'Meera Yadav', '9876543215', '2021-02-20', NULL,
 'Agricultural', 'No', '', 'photos/003.jpg', 'qrcode/003.png', 'ACTIVE',
 NOW(), 'admin', 1, TRUE);

SELECT 'Database initialized successfully!' AS status;
