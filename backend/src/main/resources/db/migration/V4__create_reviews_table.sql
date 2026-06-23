CREATE TABLE reviews (
  id bigint NOT NULL AUTO_INCREMENT,
  student_id bigint NOT NULL,
  course_id bigint NOT NULL,
  rating int NOT NULL,
  comment text,
  created_at datetime(6) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reviews_student_course (student_id, course_id),
  CONSTRAINT fk_reviews_course FOREIGN KEY (course_id) REFERENCES courses (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_student FOREIGN KEY (student_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
