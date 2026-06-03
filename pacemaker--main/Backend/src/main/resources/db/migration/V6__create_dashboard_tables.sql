CREATE TABLE courses (

    id BIGINT NOT NULL AUTO_INCREMENT,

    course_name VARCHAR(255) NOT NULL,

    instructor_name VARCHAR(255),

    description VARCHAR(1000),

    PRIMARY KEY (id)

);

CREATE TABLE enrollments (

    id BIGINT NOT NULL AUTO_INCREMENT,

    student_id BIGINT,

    course_id BIGINT,

    PRIMARY KEY (id)

);