CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_users_role (role),
  KEY idx_users_status (status)
);

CREATE TABLE IF NOT EXISTS universities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  abbr VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  province VARCHAR(120) NOT NULL,
  location VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  field VARCHAR(120) NOT NULL,
  min_aps INT NOT NULL,
  KEY idx_courses_field (field),
  KEY idx_courses_min_aps (min_aps)
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  grade VARCHAR(80) NOT NULL,
  province VARCHAR(120),
  school VARCHAR(150),
  aps_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_student_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_universities (
  course_id INT NOT NULL,
  university_id INT NOT NULL,
  PRIMARY KEY (course_id, university_id),
  CONSTRAINT fk_course_universities_course
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_course_universities_university
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS application_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(120) NOT NULL,
  province VARCHAR(120) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  contact_number VARCHAR(40) NOT NULL,
  guardian_name VARCHAR(160) NOT NULL,
  guardian_relationship VARCHAR(80),
  guardian_contact VARCHAR(40) NOT NULL,
  guardian_email VARCHAR(255),
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_application_profiles_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS application_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_type VARCHAR(120) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size INT NOT NULL,
  content_base64 LONGTEXT NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_application_documents_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_application_documents_user_id (user_id),
  KEY idx_application_documents_type (document_type)
);

CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(64) NOT NULL UNIQUE,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  course_name VARCHAR(255) NOT NULL,
  university_id INT NOT NULL,
  university_name VARCHAR(255) NOT NULL,
  status ENUM('Pending', 'Accepted', 'Rejected') NOT NULL DEFAULT 'Pending',
  rejection_reason VARCHAR(255),
  status_note TEXT,
  status_updated_at TIMESTAMP NULL DEFAULT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_applications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_applications_course
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT,
  CONSTRAINT fk_applications_university
    FOREIGN KEY (university_id) REFERENCES universities(id) ON DELETE RESTRICT,
  UNIQUE KEY idx_unique_user_course_university (user_id, course_id, university_id),
  KEY idx_applications_user_id (user_id),
  KEY idx_applications_status (status)
);

CREATE TABLE IF NOT EXISTS application_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  actor_user_id INT,
  actor_role VARCHAR(40),
  event_type VARCHAR(80) NOT NULL,
  title VARCHAR(180) NOT NULL,
  message TEXT,
  metadata_json TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_application_events_application
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT fk_application_events_actor
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,
  KEY idx_application_events_application_id (application_id),
  KEY idx_application_events_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS application_email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  application_id INT NOT NULL,
  recipient_email VARCHAR(255),
  template_id VARCHAR(120),
  email_type VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  status_label VARCHAR(80),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_application_email_logs_application
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  KEY idx_application_email_logs_application_id (application_id),
  KEY idx_application_email_logs_status (status),
  KEY idx_application_email_logs_created_at (created_at)
);
