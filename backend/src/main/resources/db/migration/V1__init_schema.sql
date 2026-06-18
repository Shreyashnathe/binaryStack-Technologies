CREATE TABLE users (
  id bigint NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  password varchar(255) NOT NULL,
  role enum('ADMIN','STUDENT') NOT NULL,
  phone_number varchar(255) DEFAULT NULL,
  city varchar(255) DEFAULT NULL,
  education_level varchar(255) DEFAULT NULL,
  target_role varchar(255) DEFAULT NULL,
  bio text,
  date_of_birth date DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enrollments (
  id bigint NOT NULL AUTO_INCREMENT,
  student_id bigint NOT NULL,
  course_id bigint NOT NULL,
  enrolled_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_enrollments_student_course (student_id, course_id),
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id) REFERENCES courses (id),
  CONSTRAINT fk_enrollments_student FOREIGN KEY (student_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE class_sessions (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  description text,
  mentor_name varchar(255) NOT NULL,
  start_time datetime(6) NOT NULL,
  end_time datetime(6) NOT NULL,
  mode enum('ONLINE','OFFLINE','HYBRID') NOT NULL,
  meeting_link varchar(255) DEFAULT NULL,
  location varchar(255) DEFAULT NULL,
  active bit(1) NOT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE announcements (
  id bigint NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  message text NOT NULL,
  audience enum('ALL','STUDENT','ADMIN') NOT NULL,
  active bit(1) NOT NULL,
  created_by varchar(255) DEFAULT NULL,
  created_at datetime(6) DEFAULT NULL,
  updated_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cart_items (
  id bigint NOT NULL AUTO_INCREMENT,
  student_id bigint NOT NULL,
  course_id bigint NOT NULL,
  added_at datetime(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_items_student_course (student_id, course_id),
  CONSTRAINT fk_cart_items_course FOREIGN KEY (course_id) REFERENCES courses (id),
  CONSTRAINT fk_cart_items_student FOREIGN KEY (student_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
