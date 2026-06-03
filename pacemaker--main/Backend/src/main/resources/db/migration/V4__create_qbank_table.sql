CREATE TABLE qbank (

    id BIGINT NOT NULL AUTO_INCREMENT,

    question VARCHAR(3000) NOT NULL,

    option_a VARCHAR(255) NOT NULL,

    option_b VARCHAR(255) NOT NULL,

    option_c VARCHAR(255) NOT NULL,

    option_d VARCHAR(255) NOT NULL,

    correct_answer VARCHAR(255) NOT NULL,

    tags VARCHAR(255),

    difficulty VARCHAR(255),

    explanation VARCHAR(3000),

    created_at DATETIME,

    PRIMARY KEY (id)

);