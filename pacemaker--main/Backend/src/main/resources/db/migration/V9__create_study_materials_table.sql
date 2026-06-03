CREATE TABLE study_materials (

    id BIGINT NOT NULL AUTO_INCREMENT,

    subject_name VARCHAR(255),

    chapter_name VARCHAR(255),

    file_name VARCHAR(255),

    file_type VARCHAR(255),

    file_path VARCHAR(1000),

    file_size BIGINT,

    uploaded_at DATETIME,

    PRIMARY KEY (id)

);